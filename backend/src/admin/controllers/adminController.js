import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import * as Admin from "../models/adminModel.js";
import pool from "../../config/db.js";

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
              fp.professional_title, fp.onboarding_completed AS freelancer_onboarding
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
        res.json({ message: "Project status updated", project: result.rows[0] });
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