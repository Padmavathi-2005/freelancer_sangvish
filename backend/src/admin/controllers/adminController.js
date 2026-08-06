import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import * as Admin from "../models/adminModel.js";
import pool from "../../config/db.js";
import Notification from "../../models/notificationModel.js";

const JWT_SECRET = process.env.JWT_SECRET || "mysecretkey";

// 🟢 CREATE ADMIN (only main admin can create sub admins, or by using a secure admin API key)
export const createAdmin = async (req, res) => {
    try {
        const apiKey = req.headers["x-admin-api-key"];
        const isValidApiKey = apiKey && process.env.ADMIN_API_KEY && apiKey === process.env.ADMIN_API_KEY;
        const isMainAdmin = req.admin && req.admin.role === "MAIN_ADMIN";

        if (!isValidApiKey && !isMainAdmin) {
            return res.status(403).json({
                message: "Forbidden: Only main admin can create admins"
            });
        }

        const { full_name, email, password, role } = req.body;

        const check = await Admin.findAdminByEmail(email);

        if (check.rows.length > 0) {
            return res.status(400).json({
                message: "Admin already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await Admin.createAdmin(
            full_name,
            email,
            hashedPassword,
            role || "SUB_ADMIN"
        );

        res.json({
            message: "Admin created successfully",
            admin: {
                admin_id: result.rows[0].admin_id,
                full_name: result.rows[0].full_name,
                email: result.rows[0].email,
                role: result.rows[0].role
            }
        });

    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
};

// 🔵 LOGIN ADMIN
export const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const admin = await Admin.findAdminByEmail(email);
        if (admin.rows.length === 0) {
            return res.status(404).json({ message: "Admin not found" });
        }

        const valid = await bcrypt.compare(password, admin.rows[0].password_hash);
        if (!valid) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign(
            {
                admin_id: admin.rows[0].admin_id,
                role: admin.rows[0].role,
                email: admin.rows[0].email
            },
            JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.json({
            message: "Login successful",
            token,
            admin: {
                admin_id: admin.rows[0].admin_id,
                full_name: admin.rows[0].full_name,
                email: admin.rows[0].email,
                role: admin.rows[0].role
            }
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 🟡 GET ALL ADMINS (only main admin)
export const getAdmins = async (req, res) => {
    try {
        const result = await Admin.getAllAdmins();
        // Remove password hashes from response for security
        const admins = result.rows.map(row => {
            const { password_hash, ...rest } = row;
            return rest;
        });
        res.json(admins);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 🔴 DELETE ADMIN (only main admin can delete sub admins)
export const deleteAdmin = async (req, res) => {
    try {
        const isMainAdmin = req.admin && req.admin.role === "MAIN_ADMIN";
        if (!isMainAdmin) {
            return res.status(403).json({
                message: "Forbidden: Only main admin can delete admins"
            });
        }

        const { id } = req.params;

        const admin = await Admin.findAdminById(id);

        if (admin.rows.length === 0) {
            return res.status(404).json({ message: "Admin not found" });
        }

        if (admin.rows[0].role === "MAIN_ADMIN") {
            return res.status(403).json({ message: "Main admin cannot be deleted" });
        }

        await Admin.deleteAdminById(id);

        res.json({ message: "Admin deleted successfully" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 👤 USER MANAGEMENT
export const getUsers = async (req, res) => {
    try {
        const query = `
            SELECT 
              u.user_id, u.first_name, u.last_name, u.email, u.phone, u.is_active, u.is_verified, u.created_at,
              cp.company_name, cp.onboarding_completed AS client_onboarding,
              fp.professional_title, fp.onboarding_completed AS freelancer_onboarding,
              COALESCE(fp.vetting_status, cp.vetting_status) AS vetting_status
            FROM users u
            LEFT JOIN client_profiles cp ON u.user_id = cp.user_id
            LEFT JOIN freelancer_profiles fp ON u.user_id = fp.user_id
            ORDER BY u.created_at DESC
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const toggleUserActive = async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
            UPDATE users 
            SET is_active = NOT COALESCE(is_active, true) 
            WHERE user_id = $1 
            RETURNING is_active
        `;
        const result = await pool.query(query, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json({ message: "User active status updated", is_active: result.rows[0].is_active });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const updateFreelancerVettingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { vetting_status } = req.body;

        if (!['Approved', 'Rejected', 'Pending'].includes(vetting_status)) {
            return res.status(400).json({ message: "Invalid vetting_status. Must be Approved, Rejected, or Pending." });
        }

        let result = await pool.query(
            `UPDATE freelancer_profiles
             SET vetting_status = $1::varchar, 
                 onboarding_completed = CASE WHEN $1::varchar = 'Approved' THEN true ELSE onboarding_completed END,
                 updated_at = NOW()
             WHERE user_id = $2
             RETURNING vetting_status`,
            [vetting_status, id]
        );

        if (result.rows.length === 0) {
            // Try client profiles
            result = await pool.query(
                `UPDATE client_profiles
                 SET vetting_status = $1::varchar, 
                     onboarding_completed = CASE WHEN $1::varchar = 'Approved' THEN true ELSE onboarding_completed END,
                     updated_at = NOW()
                 WHERE user_id = $2
                 RETURNING vetting_status`,
                [vetting_status, id]
            );
        }

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Profile not found for this user." });
        }

        // Create and dispatch vetting update notification to user
        try {
            const notif = await Notification.create({
                userId: parseInt(id),
                title: vetting_status === "Approved" ? "Onboarding Approved! 🏆" : "Onboarding Rejected",
                message: vetting_status === "Approved"
                    ? "Congratulations! Your contractor profile has been approved by admin. You now have full dashboard access."
                    : "Unfortunately, your contractor onboarding application was rejected by admin. Please contact support or update your details.",
                type: "vetting",
                referenceId: id.toString()
            });

            if (req.io) {
                req.io.to(`user_${id}`).emit("new_notification", notif);
                req.io.to(`user_${id}`).emit("vetting_status_updated", { vetting_status });
            }
        } catch (notifErr) {
            console.error("Failed to generate vetting update notification:", notifErr);
        }

        res.json({ message: `Freelancer vetting status updated to ${vetting_status}.`, vetting_status });
    } catch (err) {
        console.error("VETTING UPDATE ERROR:", err);
        res.status(500).json({ error: err.message });
    }
};

export const cleanData = async (req, res) => {
    try {
        const { default: pool } = await import("../../config/db.js");
        
        // Truncate transactional and catalog tables in order of dependencies
        await pool.query("TRUNCATE TABLE wallet_transactions CASCADE");
        await pool.query("TRUNCATE TABLE withdrawal_requests CASCADE");
        await pool.query("TRUNCATE TABLE gig_applications CASCADE");
        await pool.query("TRUNCATE TABLE contracts CASCADE");
        await pool.query("TRUNCATE TABLE proposals CASCADE");
        await pool.query("TRUNCATE TABLE gig_skills CASCADE");
        await pool.query("TRUNCATE TABLE gigs CASCADE");
        await pool.query("TRUNCATE TABLE jobs CASCADE");
        await pool.query("TRUNCATE TABLE messages CASCADE");
        await pool.query("TRUNCATE TABLE conversations CASCADE");
        await pool.query("TRUNCATE TABLE notifications CASCADE");
        
        // Reset balances of all wallets to 0.00
        await pool.query("UPDATE wallets SET balance = 0.00");

        res.status(200).json({ message: "Database tables cleaned successfully and wallet balances reset to $0.00!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 🗄️ DATABASE BACKUPS
export const getBackups = async (req, res) => {
    try {
        const backupDir = path.join(process.cwd(), "backups");
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir);
        }
        const files = fs.readdirSync(backupDir);
        const backups = files
            .filter(f => f.endsWith(".sql"))
            .map(filename => {
                const filePath = path.join(backupDir, filename);
                const stats = fs.statSync(filePath);
                return {
                    filename,
                    sizeBytes: stats.size,
                    createdAt: stats.birthtime || stats.mtime
                };
            })
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        res.json(backups);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const createBackup = async (req, res) => {
    try {
        const { default: pool } = await import("../../config/db.js");
        const backupDir = path.join(process.cwd(), "backups");
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir);
        }

        // List of tables to backup
        const tables = [
            'users',
            'categories',
            'sub_categories',
            'skills',
            'currencies',
            'languages',
            'translations',
            'settings',
            'cms_pages',
            'gigs',
            'gig_skills',
            'jobs',
            'proposals',
            'contracts',
            'contract_milestones',
            'wallets',
            'wallet_transactions',
            'withdrawal_requests',
            'conversations',
            'messages',
            'dispute_reasons',
            'subscription_plans'
        ];

        let sqlContent = `-- Database Backup generated on ${new Date().toISOString()}\n\n`;

        for (const table of tables) {
            // Check if table exists
            const tableCheck = await pool.query(
                "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1)",
                [table]
            );
            if (!tableCheck.rows[0].exists) continue;

            const data = await pool.query(`SELECT * FROM "${table}"`);
            if (data.rows.length === 0) continue;

            sqlContent += `-- Table: ${table}\n`;
            sqlContent += `TRUNCATE TABLE "${table}" CASCADE;\n`;

            const columns = Object.keys(data.rows[0]);
            
            for (const row of data.rows) {
                const valuePlaceholders = columns.map((col) => {
                    const val = row[col];
                    if (val === null) return 'NULL';
                    if (typeof val === 'string') {
                        return `'${val.replace(/'/g, "''")}'`;
                    }
                    if (val instanceof Date) {
                        return `'${val.toISOString()}'`;
                    }
                    if (typeof val === 'object') {
                        return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
                    }
                    return val;
                });

                sqlContent += `INSERT INTO "${table}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${valuePlaceholders.join(', ')});\n`;
            }
            sqlContent += '\n';
        }

        const filename = `backup-${Date.now()}.sql`;
        const filePath = path.join(backupDir, filename);
        fs.writeFileSync(filePath, sqlContent, 'utf-8');

        res.status(201).json({ message: 'Backup created successfully', filename });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const downloadBackup = async (req, res) => {
    try {
        const { filename } = req.params;
        if (filename.includes("/") || filename.includes("\\") || filename.includes("..")) {
            return res.status(400).json({ message: "Invalid filename." });
        }
        const filePath = path.join(process.cwd(), "backups", filename);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: "Backup file not found." });
        }
        res.download(filePath, filename);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const deleteBackup = async (req, res) => {
    try {
        const { filename } = req.params;
        if (filename.includes("/") || filename.includes("\\") || filename.includes("..")) {
            return res.status(400).json({ message: "Invalid filename." });
        }
        const filePath = path.join(process.cwd(), "backups", filename);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: "Backup file not found." });
        }
        fs.unlinkSync(filePath);
        res.json({ message: "Backup deleted successfully." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 💼 PROJECT MANAGEMENT
export const getProjects = async (req, res) => {
    try {
        const query = `
            SELECT 
              j.job_id, j.title, j.description, j.budget, j.experience_level, j.status, j.created_at,
              u.first_name || ' ' || COALESCE(u.last_name, '') AS client_name,
              c.category_name,
              sc.sub_category_name
            FROM jobs j
            LEFT JOIN users u ON j.client_id = u.user_id
            LEFT JOIN categories c ON j.category_id = c.category_id
            LEFT JOIN sub_categories sc ON j.sub_category_id = sc.sub_category_id
            ORDER BY j.created_at DESC
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const updateProjectStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const query = `
            UPDATE jobs 
            SET status = $1, updated_at = NOW() 
            WHERE job_id = $2 
            RETURNING *
        `;
        const result = await pool.query(query, [status, id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Project not found" });
        }

        const project = result.rows[0];
        try {
            let title = "";
            let message = "";
            if (status === "Open") {
                title = "Project Approved 🚀";
                message = `Your project post "${project.title}" has been approved by the admin and is now live.`;
            } else if (status === "Declined") {
                title = "Project Declined ❌";
                message = `Your project post "${project.title}" was declined by the admin.`;
            }

            if (title) {
                const clientNotif = await pool.query(
                    `INSERT INTO notifications (user_id, title, message, type, reference_id)
                     VALUES ($1, $2, $3, 'project', $4) RETURNING *`,
                    [project.client_id, title, message, project.job_id.toString()]
                );
                if (req.io && clientNotif.rows.length > 0) {
                    req.io.to(`user_${project.client_id}`).emit("new_notification", clientNotif.rows[0]);
                }
            }
        } catch (notifErr) {
            console.error("Client project approval notification failed:", notifErr);
        }

        res.json({ message: "Project status updated", project });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const deleteProject = async (req, res) => {
    try {
        const { id } = req.params;
        const query = `DELETE FROM jobs WHERE job_id = $1 RETURNING *`;
        const result = await pool.query(query, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Project not found" });
        }
        res.json({ message: "Project deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 🎯 GIG MANAGEMENT
export const getGigs = async (req, res) => {
    try {
        const query = `
            SELECT 
              g.gig_id, g.title, g.description, g.price, g.delivery_days, g.revisions, g.status, g.created_at,
              u.first_name || ' ' || COALESCE(u.last_name, '') AS freelancer_name,
              c.category_name,
              sc.sub_category_name
            FROM gigs g
            LEFT JOIN users u ON g.freelancer_id = u.user_id
            LEFT JOIN categories c ON g.category_id = c.category_id
            LEFT JOIN sub_categories sc ON g.sub_category_id = sc.sub_category_id
            ORDER BY g.created_at DESC
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const updateGigStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const query = `
            UPDATE gigs 
            SET status = $1, updated_at = NOW() 
            WHERE gig_id = $2 
            RETURNING *
        `;
        const result = await pool.query(query, [status, id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Gig not found" });
        }
        res.json({ message: "Gig status updated", gig: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const deleteGig = async (req, res) => {
    try {
        const { id } = req.params;
        const query = `DELETE FROM gigs WHERE gig_id = $1 RETURNING *`;
        const result = await pool.query(query, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Gig not found" });
        }
        res.json({ message: "Gig deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 📦 GIG ORDERS (GIG APPLICATIONS)
export const getGigOrders = async (req, res) => {
    try {
        const query = `
            SELECT 
              ga.application_id AS order_id, ga.requirements, ga.price, ga.status, ga.created_at,
              g.title AS gig_title,
              cu.first_name || ' ' || COALESCE(cu.last_name, '') AS client_name,
              fu.first_name || ' ' || COALESCE(fu.last_name, '') AS freelancer_name
            FROM gig_applications ga
            LEFT JOIN gigs g ON ga.gig_id = g.gig_id
            LEFT JOIN users cu ON ga.client_id = cu.user_id
            LEFT JOIN users fu ON g.freelancer_id = fu.user_id
            ORDER BY ga.created_at DESC
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const updateGigOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const query = `
            UPDATE gig_applications 
            SET status = $1, updated_at = NOW() 
            WHERE application_id = $2 
            RETURNING *
        `;
        const result = await pool.query(query, [status, id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Order not found" });
        }
        res.json({ message: "Order status updated", order: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 💸 TRANSACTION & PAYMENTS (CONTRACTS)
export const getTransactions = async (req, res) => {
    try {
        const query = `
            SELECT 
              c.contract_id, c.title, c.budget, c.status, c.progress, c.created_at,
              cl.first_name || ' ' || COALESCE(cl.last_name, '') AS client_name,
              fr.first_name || ' ' || COALESCE(fr.last_name, '') AS freelancer_name,
              j.title AS job_title
            FROM contracts c
            LEFT JOIN users cl ON c.client_id = cl.user_id
            LEFT JOIN users fr ON c.freelancer_id = fr.user_id
            LEFT JOIN jobs j ON c.job_id = j.job_id
            ORDER BY c.created_at DESC
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 🌐 LANGUAGES CRUD
export const getAdminLanguages = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM languages ORDER BY language_name ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const createLanguage = async (req, res) => {
    try {
        const { language_name, code, direction, status, is_site_lang } = req.body;
        if (!language_name?.trim()) return res.status(400).json({ message: 'language_name is required.' });

        const isSiteLang = is_site_lang === true || is_site_lang === 'true';

        if (isSiteLang && !code?.trim()) {
            return res.status(400).json({ message: 'Language code is required when enabling translation.' });
        }

        const checkName = await pool.query('SELECT 1 FROM languages WHERE LOWER(language_name) = LOWER($1)', [language_name.trim()]);
        if (checkName.rows.length > 0) return res.status(409).json({ message: 'Language name already exists.' });

        if (code?.trim()) {
            const checkCode = await pool.query('SELECT 1 FROM languages WHERE LOWER(code) = LOWER($1)', [code.trim()]);
            if (checkCode.rows.length > 0) return res.status(409).json({ message: 'Language code already exists.' });
        }

        const result = await pool.query(
            `INSERT INTO languages (language_name, code, direction, status, is_site_lang) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING *`, 
            [language_name.trim(), code?.trim() ? code.trim().toUpperCase() : null, direction || 'LTR', status || 'Active', isSiteLang]
        );

        // Seed default translation keys for this new language if enabled
        if (isSiteLang && code?.trim()) {
            const keysRes = await pool.query("SELECT DISTINCT key FROM translations");
            for (const row of keysRes.rows) {
                await pool.query(
                    "INSERT INTO translations (language_code, key, value) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
                    [code.trim().toUpperCase(), row.key, row.key]
                );
            }
        }

        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const updateLanguage = async (req, res) => {
    try {
        const { id } = req.params;
        const { language_name, code, direction, status, is_site_lang } = req.body;
        if (!language_name?.trim()) return res.status(400).json({ message: 'language_name is required.' });

        const isSiteLang = is_site_lang === true || is_site_lang === 'true';

        if (isSiteLang && !code?.trim()) {
            return res.status(400).json({ message: 'Language code is required when enabling translation.' });
        }

        // Check unique constraints excluding current language_id
        const checkName = await pool.query('SELECT 1 FROM languages WHERE LOWER(language_name) = LOWER($1) AND language_id != $2', [language_name.trim(), id]);
        if (checkName.rows.length > 0) return res.status(409).json({ message: 'Language name already exists.' });

        if (code?.trim()) {
            const checkCode = await pool.query('SELECT 1 FROM languages WHERE LOWER(code) = LOWER($1) AND language_id != $2', [code.trim(), id]);
            if (checkCode.rows.length > 0) return res.status(409).json({ message: 'Language code already exists.' });
        }

        // Get old code to update translations if code changed
        const oldLang = await pool.query('SELECT code FROM languages WHERE language_id = $1', [id]);
        if (oldLang.rows.length > 0) {
            const oldCode = oldLang.rows[0].code;
            const newCode = code?.trim() ? code.trim().toUpperCase() : null;
            if (oldCode && newCode && oldCode !== newCode) {
                await pool.query('UPDATE translations SET language_code = $1 WHERE language_code = $2', [newCode, oldCode]);
            }
        }

        const result = await pool.query(
            `UPDATE languages 
             SET language_name = $1, code = $2, direction = $3, status = $4, is_site_lang = $5, updated_at = CURRENT_TIMESTAMP 
             WHERE language_id = $6 
             RETURNING *`, 
            [language_name.trim(), code?.trim() ? code.trim().toUpperCase() : null, direction || 'LTR', status || 'Active', isSiteLang, id]
        );

        if (result.rows.length === 0) return res.status(404).json({ message: 'Language not found.' });

        // If newly enabled as a translation language, seed missing keys
        if (isSiteLang && code?.trim()) {
            const keysRes = await pool.query("SELECT DISTINCT key FROM translations");
            for (const row of keysRes.rows) {
                await pool.query(
                    "INSERT INTO translations (language_code, key, value) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
                    [code.trim().toUpperCase(), row.key, row.key]
                );
            }
        }

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const deleteLanguage = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM languages WHERE language_id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Language not found.' });
        res.json({ message: 'Language deleted successfully.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 🌐 TRANSLATIONS CRUD
export const getAdminTranslations = async (req, res) => {
    try {
        const { code } = req.params;
        const result = await pool.query(
            "SELECT translation_id, key, value FROM translations WHERE language_code = $1 ORDER BY key ASC",
            [code.toUpperCase()]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const updateAdminTranslations = async (req, res) => {
    try {
        const { code } = req.params;
        const { updates } = req.body;
        if (!Array.isArray(updates)) {
            return res.status(400).json({ message: "updates array is required." });
        }

        for (const item of updates) {
            await pool.query(
                `INSERT INTO translations (language_code, key, value) 
                 VALUES ($1, $2, $3) 
                 ON CONFLICT (language_code, key) 
                 DO UPDATE SET value = $3`,
                [code.toUpperCase(), item.key, item.value]
            );
        }
        res.json({ message: "Translations updated successfully." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const addGlobalTranslationKey = async (req, res) => {
    try {
        const { key, defaultValue } = req.body;
        if (!key?.trim()) return res.status(400).json({ message: "key is required." });

        const cleanKey = key.trim().toLowerCase();

        // Get all languages
        const langs = await pool.query("SELECT code FROM languages WHERE code IS NOT NULL");
        for (const lang of langs.rows) {
            await pool.query(
                `INSERT INTO translations (language_code, key, value) 
                 VALUES ($1, $2, $3) 
                 ON CONFLICT (language_code, key) DO NOTHING`,
                [lang.code, cleanKey, defaultValue || key]
            );
        }

        res.status(201).json({ message: `Key '${cleanKey}' added globally.` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 💱 CURRENCIES CRUD
export const getAdminCurrencies = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM currencies ORDER BY code ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const createCurrency = async (req, res) => {
    try {
        const { code, name, symbol, rate } = req.body;
        if (!code?.trim() || !name?.trim() || !symbol?.trim()) return res.status(400).json({ message: 'code, name and symbol are required.' });
        const check = await pool.query('SELECT 1 FROM currencies WHERE UPPER(code) = UPPER($1)', [code.trim()]);
        if (check.rows.length > 0) return res.status(409).json({ message: 'Currency code already exists.' });
        
        const rateVal = rate !== undefined ? parseFloat(rate) : 1.0;
        const result = await pool.query(
            'INSERT INTO currencies (code, name, symbol, rate) VALUES ($1, $2, $3, $4) RETURNING *',
            [code.trim().toUpperCase(), name.trim(), symbol.trim(), rateVal]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const updateCurrency = async (req, res) => {
    try {
        const { id } = req.params;
        const { code, name, symbol, rate } = req.body;
        if (!code?.trim() || !name?.trim() || !symbol?.trim()) return res.status(400).json({ message: 'code, name and symbol are required.' });
        
        // Check uniqueness of code for other currencies
        const check = await pool.query('SELECT 1 FROM currencies WHERE UPPER(code) = UPPER($1) AND currency_id != $2', [code.trim(), id]);
        if (check.rows.length > 0) {
            return res.status(409).json({ message: 'Currency code already exists.' });
        }
        
        const rateVal = rate !== undefined ? parseFloat(rate) : 1.0;
        const result = await pool.query(
            'UPDATE currencies SET code = $1, name = $2, symbol = $3, rate = $4, updated_at = NOW() WHERE currency_id = $5 RETURNING *',
            [code.trim().toUpperCase(), name.trim(), symbol.trim(), rateVal, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: 'Currency not found.' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const deleteCurrency = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM currencies WHERE currency_id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Currency not found.' });
        res.json({ message: 'Currency deleted successfully.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 💳 SUBSCRIPTION PLANS CRUD
export const getSubscriptionPlans = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM subscription_plans ORDER BY plan_id ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const updateSubscriptionPlan = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            name, description, price, period, features, button_text, is_popular, is_current, 
            gig_discount_percent, proposal_limit, job_posting_limit, transaction_fee_percent, featured_job_allowance,
            plan_role, plan_type, plan_duration, credits, profile_featured_duration, featured_project_limit, featured_project_duration, badge_image,
            is_enabled
        } = req.body;

        if (!name?.trim() || price === undefined || features === undefined || !button_text?.trim()) {
            return res.status(400).json({ message: 'name, price, features and button_text are required.' });
        }

        if (is_popular === true) {
            await pool.query('UPDATE subscription_plans SET is_popular = FALSE');
        }

        const featuresJson = typeof features === 'string' ? features : JSON.stringify(features);

        const result = await pool.query(
            `UPDATE subscription_plans 
             SET name = $1, description = $2, price = $3, period = $4, features = $5, button_text = $6, is_popular = $7, is_current = $8, 
                 gig_discount_percent = $9, proposal_limit = $10, job_posting_limit = $11, transaction_fee_percent = $12, featured_job_allowance = $13,
                 plan_role = $14, plan_type = $15, plan_duration = $16, credits = $17, profile_featured_duration = $18, 
                 featured_project_limit = $19, featured_project_duration = $20, badge_image = $21, is_enabled = $22, updated_at = NOW() 
             WHERE plan_id = $23 RETURNING *`,
            [
                name.trim(), description || '', parseFloat(price || 0.00), period || '', featuresJson, button_text.trim(), is_popular ?? false, is_current ?? false, 
                gig_discount_percent !== undefined && gig_discount_percent !== null ? parseInt(gig_discount_percent) : 0, 
                proposal_limit !== undefined && proposal_limit !== null ? parseInt(proposal_limit) : 5, 
                job_posting_limit !== undefined && job_posting_limit !== null ? parseInt(job_posting_limit) : 3, 
                transaction_fee_percent !== undefined && transaction_fee_percent !== null ? parseFloat(transaction_fee_percent) : 5.0, 
                featured_job_allowance ?? false,
                plan_role || 'seller', plan_type || 'Day(s)', 
                plan_duration !== undefined && plan_duration !== null ? parseInt(plan_duration) : 30, 
                credits !== undefined && credits !== null ? parseInt(credits) : 10,
                profile_featured_duration !== undefined && profile_featured_duration !== null ? parseInt(profile_featured_duration) : 0, 
                featured_project_limit !== undefined && featured_project_limit !== null ? parseInt(featured_project_limit) : 0, 
                featured_project_duration !== undefined && featured_project_duration !== null ? parseInt(featured_project_duration) : 0,
                badge_image || null, is_enabled !== false, id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Subscription plan not found.' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const createSubscriptionPlan = async (req, res) => {
    try {
        const { 
            name, description, price, period, features, button_text, is_popular, is_current, 
            gig_discount_percent, proposal_limit, job_posting_limit, transaction_fee_percent, featured_job_allowance,
            plan_role, plan_type, plan_duration, credits, profile_featured_duration, featured_project_limit, featured_project_duration, badge_image,
            is_enabled
        } = req.body;

        if (!name?.trim() || price === undefined || features === undefined || !button_text?.trim()) {
            return res.status(400).json({ message: 'name, price, features and button_text are required.' });
        }

        if (is_popular === true) {
            await pool.query('UPDATE subscription_plans SET is_popular = FALSE');
        }

        const featuresJson = typeof features === 'string' ? features : JSON.stringify(features);

        const result = await pool.query(
            `INSERT INTO subscription_plans (name, description, price, period, features, button_text, is_popular, is_current, gig_discount_percent, proposal_limit, job_posting_limit, transaction_fee_percent, featured_job_allowance, plan_role, plan_type, plan_duration, credits, profile_featured_duration, featured_project_limit, featured_project_duration, badge_image, is_enabled)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22) RETURNING *`,
            [
                name.trim(), description || '', parseFloat(price || 0.00), period || '', featuresJson, button_text.trim(), is_popular ?? false, is_current ?? false, 
                gig_discount_percent !== undefined && gig_discount_percent !== null ? parseInt(gig_discount_percent) : 0, 
                proposal_limit !== undefined && proposal_limit !== null ? parseInt(proposal_limit) : 5, 
                job_posting_limit !== undefined && job_posting_limit !== null ? parseInt(job_posting_limit) : 3, 
                transaction_fee_percent !== undefined && transaction_fee_percent !== null ? parseFloat(transaction_fee_percent) : 5.0, 
                featured_job_allowance ?? false,
                plan_role || 'seller', plan_type || 'Day(s)', 
                plan_duration !== undefined && plan_duration !== null ? parseInt(plan_duration) : 30, 
                credits !== undefined && credits !== null ? parseInt(credits) : 10,
                profile_featured_duration !== undefined && profile_featured_duration !== null ? parseInt(profile_featured_duration) : 0, 
                featured_project_limit !== undefined && featured_project_limit !== null ? parseInt(featured_project_limit) : 0, 
                featured_project_duration !== undefined && featured_project_duration !== null ? parseInt(featured_project_duration) : 0,
                badge_image || null, is_enabled !== false
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const deleteSubscriptionPlan = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM subscription_plans WHERE plan_id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Subscription plan not found.' });
        res.json({ message: 'Subscription plan deleted successfully.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getFaqs = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM faq_items ORDER BY sort_order ASC, faq_id ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const createFaq = async (req, res) => {
    try {
        const suffix = Date.now().toString();

        const orderRes = await pool.query('SELECT COALESCE(MAX(sort_order), 0) as max_order FROM faq_items');
        const nextOrder = parseInt(orderRes.rows[0].max_order) + 1;

        const result = await pool.query(
            'INSERT INTO faq_items (key_suffix, sort_order) VALUES ($1, $2) RETURNING *',
            [suffix, nextOrder]
        );

        const defaultTranslations = [
            { code: 'EN', key: `faq_q_${suffix}`, value: 'New Frequently Asked Question?' },
            { code: 'EN', key: `faq_a_${suffix}`, value: 'The answer description details go here.' },
            { code: 'AR', key: `faq_q_${suffix}`, value: 'سؤال جديد متكرر؟' },
            { code: 'AR', key: `faq_a_${suffix}`, value: 'تفاصيل إجابة السؤال تذهب هنا.' },
            { code: 'FR', key: `faq_q_${suffix}`, value: 'Nouvelle question fréquemment posée ?' },
            { code: 'FR', key: `faq_a_${suffix}`, value: 'Les détails de la réponse vont ici.' },
            { code: 'DE', key: `faq_q_${suffix}`, value: 'Neue häufig gestellte Frage?' },
            { code: 'DE', key: `faq_a_${suffix}`, value: 'Die Details zur Antwort finden Sie hier.' }
        ];

        for (const t of defaultTranslations) {
            await pool.query(
                `INSERT INTO translations (language_code, key, value) 
                 VALUES ($1, $2, $3) 
                 ON CONFLICT (language_code, key) DO NOTHING`,
                [t.code, t.key, t.value]
            );
        }

        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const deleteFaq = async (req, res) => {
    try {
        const { id } = req.params;

        const itemRes = await pool.query('SELECT * FROM faq_items WHERE faq_id = $1', [id]);
        if (itemRes.rows.length === 0) {
            return res.status(404).json({ message: 'FAQ item not found.' });
        }

        const suffix = itemRes.rows[0].key_suffix;

        await pool.query(
            'DELETE FROM translations WHERE key IN ($1, $2)',
            [`faq_q_${suffix}`, `faq_a_${suffix}`]
        );

        await pool.query('DELETE FROM faq_items WHERE faq_id = $1', [id]);

        res.json({ message: 'FAQ item and associated translations deleted successfully.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getWhyChooseFeatures = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM why_choose_features ORDER BY sort_order ASC, feature_id ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const createWhyChooseFeature = async (req, res) => {
    try {
        const suffix = Date.now().toString();
        
        const orderRes = await pool.query('SELECT COALESCE(MAX(sort_order), 0) as max_order FROM why_choose_features');
        const nextOrder = parseInt(orderRes.rows[0].max_order) + 1;

        const result = await pool.query(
            'INSERT INTO why_choose_features (key_suffix, sort_order, icon_name) VALUES ($1, $2, $3) RETURNING *',
            [suffix, nextOrder, 'Shield']
        );

        const defaultTranslations = [
            { code: 'EN', key: `why_choose_feat${suffix}_title`, value: 'New Vetted Benefit' },
            { code: 'EN', key: `why_choose_feat${suffix}_desc`, value: 'This benefit explains why clients choose to partner with us.' },
            { code: 'AR', key: `why_choose_feat${suffix}_title`, value: 'ميزة جديدة' },
            { code: 'AR', key: `why_choose_feat${suffix}_desc`, value: 'تشرح هذه الميزة سبب اختيار العملاء للشراكة معنا.' },
            { code: 'FR', key: `why_choose_feat${suffix}_title`, value: 'Nouvel avantage' },
            { code: 'FR', key: `why_choose_feat${suffix}_desc`, value: 'Cet avantage explique pourquoi les clients choisissent de s\'associer avec nous.' },
            { code: 'DE', key: `why_choose_feat${suffix}_title`, value: 'Neuer Vorteil' },
            { code: 'DE', key: `why_choose_feat${suffix}_desc`, value: 'Dieser Vorteil erklärt, warum Kunden sich für uns entscheiden.' }
        ];

        for (const t of defaultTranslations) {
            await pool.query(
                `INSERT INTO translations (language_code, key, value) 
                 VALUES ($1, $2, $3) 
                 ON CONFLICT (language_code, key) DO NOTHING`,
                [t.code, t.key, t.value]
            );
        }

        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const deleteWhyChooseFeature = async (req, res) => {
    try {
        const { id } = req.params;

        const itemRes = await pool.query('SELECT * FROM why_choose_features WHERE feature_id = $1', [id]);
        if (itemRes.rows.length === 0) {
            return res.status(404).json({ message: 'Feature not found.' });
        }

        const suffix = itemRes.rows[0].key_suffix;

        await pool.query(
            'DELETE FROM translations WHERE key IN ($1, $2)',
            [`why_choose_feat${suffix}_title`, `why_choose_feat${suffix}_desc`]
        );

        await pool.query('DELETE FROM why_choose_features WHERE feature_id = $1', [id]);

        res.json({ message: 'Feature and associated translations deleted successfully.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getHowItWorksSteps = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM how_it_works_steps ORDER BY sort_order ASC, step_id ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const createHowItWorksStep = async (req, res) => {
    try {
        const suffix = Date.now().toString();

        const orderRes = await pool.query('SELECT COALESCE(MAX(sort_order), 0) as max_order FROM how_it_works_steps');
        const nextOrder = parseInt(orderRes.rows[0].max_order) + 1;

        const result = await pool.query(
            'INSERT INTO how_it_works_steps (key_suffix, sort_order) VALUES ($1, $2) RETURNING *',
            [suffix, nextOrder]
        );

        const defaultTranslations = [
            { code: 'EN', key: `how_it_works_step${suffix}_title`, value: 'New Workflow Step' },
            { code: 'EN', key: `how_it_works_step${suffix}_desc`, value: 'Description of what user does in this step.' },
            { code: 'AR', key: `how_it_works_step${suffix}_title`, value: 'خطوة عمل جديدة' },
            { code: 'AR', key: `how_it_works_step${suffix}_desc`, value: 'وصف لما يفعله المستخدم في هذه الخطوة.' },
            { code: 'FR', key: `how_it_works_step${suffix}_title`, value: 'Nouvelle étape de travail' },
            { code: 'FR', key: `how_it_works_step${suffix}_desc`, value: 'Description de ce que fait l\'utilisateur à cette étape.' },
            { code: 'DE', key: `how_it_works_step${suffix}_title`, value: 'Neuer Arbeitsschritt' },
            { code: 'DE', key: `how_it_works_step${suffix}_desc`, value: 'Beschreibung dessen, was der Benutzer in diesem Schritt tut.' }
        ];

        for (const t of defaultTranslations) {
            await pool.query(
                `INSERT INTO translations (language_code, key, value) 
                 VALUES ($1, $2, $3) 
                 ON CONFLICT (language_code, key) DO NOTHING`,
                [t.code, t.key, t.value]
            );
        }

        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const deleteHowItWorksStep = async (req, res) => {
    try {
        const { id } = req.params;

        const itemRes = await pool.query('SELECT * FROM how_it_works_steps WHERE step_id = $1', [id]);
        if (itemRes.rows.length === 0) {
            return res.status(404).json({ message: 'Step not found.' });
        }

        const suffix = itemRes.rows[0].key_suffix;

        await pool.query(
            'DELETE FROM translations WHERE key IN ($1, $2)',
            [`how_it_works_step${suffix}_title`, `how_it_works_step${suffix}_desc`]
        );

        await pool.query('DELETE FROM how_it_works_steps WHERE step_id = $1', [id]);

        res.json({ message: 'Step and associated translations deleted successfully.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getPendingProposals = async (req, res) => {
    try {
        const query = `
            SELECT 
                p.*,
                j.title as job_title,
                j.client_id,
                uc.first_name || COALESCE(' ' || uc.last_name, '') as client_name,
                uc.email as client_email,
                uf.first_name || COALESCE(' ' || uf.last_name, '') as freelancer_name,
                uf.email as freelancer_email,
                fp.professional_title as freelancer_title,
                fp.hourly_rate as freelancer_hourly_rate
            FROM proposals p
            JOIN jobs j ON p.job_id = j.job_id
            JOIN users uc ON j.client_id = uc.user_id
            JOIN users uf ON p.freelancer_id = uf.user_id
            LEFT JOIN freelancer_profiles fp ON uf.user_id = fp.user_id
            WHERE p.status = 'Pending Approval'
            ORDER BY p.created_at DESC
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const updateProposalVettingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'Approved' or 'Rejected'

        if (!status || !['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ message: "Status must be 'Approved' or 'Rejected'." });
        }

        const proposalRes = await pool.query(
            `SELECT p.*, j.title as job_title, j.client_id
             FROM proposals p
             JOIN jobs j ON p.job_id = j.job_id
             WHERE p.proposal_id = $1`,
            [id]
        );

        if (proposalRes.rows.length === 0) {
            return res.status(404).json({ message: "Proposal not found." });
        }

        const proposal = proposalRes.rows[0];
        const newStatus = status === 'Approved' ? 'Pending' : 'Declined';

        await pool.query(
            "UPDATE proposals SET status = $1, updated_at = NOW() WHERE proposal_id = $2",
            [newStatus, id]
        );

        // Send notifications
        try {
            if (status === 'Approved') {
                // Notify client
                const clientNotif = await pool.query(
                    `INSERT INTO notifications (user_id, title, message, type, reference_id)
                     VALUES ($1, 'New Proposal Approved', $2, 'proposal', $3) RETURNING *`,
                    [
                        proposal.client_id,
                        `Admin approved a new proposal for your project "${proposal.job_title}".`,
                        proposal.job_id.toString()
                    ]
                );
                if (req.io && clientNotif.rows.length > 0) {
                    req.io.to(`user_${proposal.client_id}`).emit("new_notification", clientNotif.rows[0]);
                }

                // Notify freelancer
                const freelancerNotif = await pool.query(
                    `INSERT INTO notifications (user_id, title, message, type, reference_id)
                     VALUES ($1, 'Proposal Approved by Admin', $2, 'proposal', $3) RETURNING *`,
                    [
                        proposal.freelancer_id,
                        `Your proposal on project "${proposal.job_title}" has been approved by admin and is now visible to the client.`,
                        proposal.job_id.toString()
                    ]
                );
                if (req.io && freelancerNotif.rows.length > 0) {
                    req.io.to(`user_${proposal.freelancer_id}`).emit("new_notification", freelancerNotif.rows[0]);
                }
            } else {
                // Notify freelancer
                const freelancerNotif = await pool.query(
                    `INSERT INTO notifications (user_id, title, message, type, reference_id)
                     VALUES ($1, 'Proposal Rejected by Admin', $2, 'proposal', $3) RETURNING *`,
                    [
                        proposal.freelancer_id,
                        `Your proposal on project "${proposal.job_title}" was declined by the admin.`,
                        proposal.job_id.toString()
                    ]
                );
                if (req.io && freelancerNotif.rows.length > 0) {
                    req.io.to(`user_${proposal.freelancer_id}`).emit("new_notification", freelancerNotif.rows[0]);
                }
            }
        } catch (notifErr) {
            console.error("Vetting notification dispatch failed:", notifErr);
        }

        res.json({ message: `Proposal vetting status updated to ${status}.`, proposal: { ...proposal, status: newStatus } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getAdminProfile = async (req, res) => {
    try {
        const adminId = req.admin.admin_id;
        const email = req.admin.email;

        // Resolve virtual user_id in users table
        const userCheck = await pool.query("SELECT user_id FROM users WHERE email = $1", [email]);
        let userId = null;
        if (userCheck.rows.length > 0) {
            userId = userCheck.rows[0].user_id;
        } else {
            // Create user row if it does not exist yet (as fallback/proactive measure)
            const insertUser = await pool.query(
                "INSERT INTO users (first_name, email, password_hash) VALUES ($1, $2, $3) RETURNING user_id",
                [req.admin.full_name || "Admin", email, "ADMIN_VIRTUAL_HASH"]
            );
            userId = insertUser.rows[0].user_id;
        }

        res.json({
            admin_id: adminId,
            email: email,
            user_id: userId,
            full_name: req.admin.full_name || "Admin",
            role: req.admin.role
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getAdminDisputes = async (req, res) => {
    try {
        const query = `
            SELECT 
                d.dispute_id as id,
                d.contract_id,
                d.client_id,
                d.freelancer_id,
                d.conversation_id,
                d.status,
                d.reason,
                d.description,
                d.escalated_at,
                d.resolved_at,
                d.resolution_type,
                d.resolution_details,
                d.raised_by,
                c.title as project,
                c.budget as amount,
                CONCAT(u_client.first_name, ' ', u_client.last_name) as client,
                CONCAT(u_free.first_name, ' ', u_free.last_name) as freelancer
            FROM disputes d
            JOIN contracts c ON d.contract_id = c.contract_id
            JOIN users u_client ON d.client_id = u_client.user_id
            JOIN users u_free ON d.freelancer_id = u_free.user_id
            ORDER BY d.created_at DESC
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error("Failed to get admin disputes:", err);
        res.status(500).json({ error: err.message });
    }
};

export const getAdminDisputeMessages = async (req, res) => {
    try {
        const disputeId = parseInt(req.params.id);
        if (!disputeId || isNaN(disputeId)) {
            return res.status(400).json({ error: "Invalid dispute ID." });
        }

        const disputeRes = await pool.query("SELECT conversation_id FROM disputes WHERE dispute_id = $1", [disputeId]);
        if (disputeRes.rows.length === 0) {
            return res.status(404).json({ error: "Dispute not found." });
        }
        const { conversation_id } = disputeRes.rows[0];

        const { default: MessageModel } = await import("../../models/messageModel.js");
        const messages = await MessageModel.findMessagesByConversationId(conversation_id);
        res.json(messages);
    } catch (err) {
        console.error("Failed to get admin dispute messages:", err);
        res.status(500).json({ error: err.message });
    }
};

export const reopenAdminDispute = async (req, res) => {
    try {
        const disputeId = parseInt(req.params.id);
        await pool.query(
            "UPDATE disputes SET status = 'Under Mediation', resolved_at = NULL, resolution_type = NULL, resolution_details = NULL WHERE dispute_id = $1",
            [disputeId]
        );
        res.json({ success: true, message: "Dispute case reopened for mediation." });
    } catch (err) {
        console.error("Failed to reopen dispute:", err);
        res.status(500).json({ error: err.message });
    }
};

// Admin Contact Inquiries Management
export const getContactInquiries = async (req, res) => {
    try {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS contact_inquiries (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255),
            email VARCHAR(255) NOT NULL,
            subject VARCHAR(255) DEFAULT 'General Inquiry',
            message TEXT NOT NULL,
            status VARCHAR(50) DEFAULT 'Pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
          DO $$
          BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contact_inquiries' AND column_name='id') THEN
              IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contact_inquiries' AND column_name='inquiry_id') THEN
                ALTER TABLE contact_inquiries RENAME COLUMN inquiry_id TO id;
              ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contact_inquiries' AND column_name='contact_id') THEN
                ALTER TABLE contact_inquiries RENAME COLUMN contact_id TO id;
              ELSE
                ALTER TABLE contact_inquiries ADD COLUMN id SERIAL;
              END IF;
            END IF;
          END $$;
          ALTER TABLE contact_inquiries ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Pending';
          ALTER TABLE contact_inquiries ADD COLUMN IF NOT EXISTS name VARCHAR(255);
          ALTER TABLE contact_inquiries ADD COLUMN IF NOT EXISTS subject VARCHAR(255) DEFAULT 'General Inquiry';
        `);

        const result = await pool.query(`
            SELECT id, name, email, subject, message, COALESCE(status, 'Pending') as status, created_at
            FROM contact_inquiries
            ORDER BY created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching contact inquiries:", err);
        res.status(500).json({ error: err.message });
    }
};

export const updateContactInquiryStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const result = await pool.query(
            `UPDATE contact_inquiries SET status = $1 WHERE id = $2 RETURNING *`,
            [status || 'Responded', id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Contact inquiry not found." });
        }
        res.json({ message: "Inquiry status updated successfully.", inquiry: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const deleteContactInquiry = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query(`DELETE FROM contact_inquiries WHERE id = $1`, [id]);
        res.json({ message: "Contact inquiry deleted successfully." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const replyContactInquiry = async (req, res) => {
    try {
        const { id } = req.params;
        const { replySubject, replyMessage } = req.body;

        if (!replyMessage) {
            return res.status(400).json({ error: "Reply message body is required." });
        }

        const inqRes = await pool.query(`SELECT * FROM contact_inquiries WHERE id = $1`, [id]);
        if (inqRes.rows.length === 0) {
            return res.status(404).json({ error: "Contact inquiry not found." });
        }
        const inquiry = inqRes.rows[0];

        try {
            const { sendEmail } = await import("../../utils/emailHelper.js");
            await sendEmail({
                to: inquiry.email,
                subject: replySubject || `Re: ${inquiry.subject}`,
                text: replyMessage
            });
        } catch (emailErr) {
            console.error("Email sending notice:", emailErr.message);
        }

        const updateRes = await pool.query(
            `UPDATE contact_inquiries SET status = 'Responded' WHERE id = $1 RETURNING *`,
            [id]
        );

        res.json({
            success: true,
            message: "Reply processed and inquiry marked as Responded!",
            inquiry: updateRes.rows[0]
        });
    } catch (err) {
        console.error("Error replying to contact inquiry:", err);
        res.status(500).json({ error: err.message });
    }
};

// Admin Newsletter Subscribers Management
export const getNewsletterSubscribers = async (req, res) => {
    try {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS newsletter_subscribers (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            status VARCHAR(50) DEFAULT 'Subscribed',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
          DO $$
          BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='newsletter_subscribers' AND column_name='id') THEN
              IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='newsletter_subscribers' AND column_name='subscriber_id') THEN
                ALTER TABLE newsletter_subscribers RENAME COLUMN subscriber_id TO id;
              ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='newsletter_subscribers' AND column_name='newsletter_id') THEN
                ALTER TABLE newsletter_subscribers RENAME COLUMN newsletter_id TO id;
              ELSE
                ALTER TABLE newsletter_subscribers ADD COLUMN id SERIAL;
              END IF;
            END IF;
          END $$;
          ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Subscribed';
        `);

        const result = await pool.query(`
            SELECT id, email, COALESCE(status, 'Subscribed') as status, created_at
            FROM newsletter_subscribers
            ORDER BY created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching newsletter subscribers:", err);
        res.status(500).json({ error: err.message });
    }
};

export const updateNewsletterSubscriberStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const result = await pool.query(
            `UPDATE newsletter_subscribers SET status = $1 WHERE id = $2 RETURNING *`,
            [status || 'Subscribed', id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Subscriber not found." });
        }
        res.json({ message: "Subscriber status updated successfully.", subscriber: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const deleteNewsletterSubscriber = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query(`DELETE FROM newsletter_subscribers WHERE id = $1`, [id]);
        res.json({ message: "Newsletter subscriber deleted successfully." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};