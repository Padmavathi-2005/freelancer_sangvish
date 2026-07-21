import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import * as userModel from '../models/userModel.js';
import pool from '../config/db.js';

// Helper to generate a unique referral code
const generateUniqueReferralCode = async () => {
    let unique = false;
    let code = "";
    while (!unique) {
        code = "REF_" + Math.random().toString(36).substring(2, 8).toUpperCase();
        const check = await pool.query("SELECT user_id FROM users WHERE referral_code = $1", [code]);
        if (check.rows.length === 0) {
            unique = true;
        }
    }
    return code;
};

export const register = async (req, res) => {

    try {

        const {
            first_name,
            email,
            password,
            refCode
        } = req.body;

        const password_hash =
            await bcrypt.hash(password, 10);

        // Fetch referred_by user
        let referred_by = null;
        if (refCode) {
            const refUserRes = await pool.query("SELECT user_id FROM users WHERE referral_code = $1", [refCode]);
            if (refUserRes.rows.length > 0) {
                referred_by = refUserRes.rows[0].user_id;
            }
        }

        // Generate unique referral code
        const referral_code = await generateUniqueReferralCode();

        const user =
            await userModel.createUser(
                first_name,
                email,
                password_hash,
                referral_code,
                referred_by
            );

        // Create wallet for the user
        let signupBonus = 0.00;
        if (referred_by) {
            signupBonus = 5.00; // Default fallback
            try {
                const settingsRes = await pool.query("SELECT setting_value FROM settings WHERE setting_key = 'referral_settings'");
                if (settingsRes.rows.length > 0) {
                    let settingsVal = settingsRes.rows[0].setting_value;
                    if (typeof settingsVal === "string") {
                        settingsVal = JSON.parse(settingsVal);
                    }
                    if (settingsVal && settingsVal.signup_bonus !== undefined) {
                        signupBonus = parseFloat(settingsVal.signup_bonus);
                    }
                }
            } catch (err) {
                console.error("Error fetching referral signup_bonus settings:", err);
            }
        }
        await pool.query(
            "INSERT INTO wallets (user_id, balance, currency) VALUES ($1, $2, 'USD')",
            [user.user_id, signupBonus]
        );

        if (referred_by) {
            const walletRes = await pool.query("SELECT wallet_id FROM wallets WHERE user_id = $1", [user.user_id]);
            const walletId = walletRes.rows[0].wallet_id;

            await pool.query(`
                INSERT INTO wallet_transactions 
                (sender_wallet_id, receiver_wallet_id, amount, type, status, description)
                VALUES (NULL, $1, $2, 'referral_signup_bonus', 'completed', 'Referral sign-up bonus reward')
            `, [walletId, signupBonus]);
        }

        const token = jwt.sign(
            {
                user_id: user.user_id
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '7d'
            }
        );

        res.status(201).json({
            token,
            user: {
                user_id: user.user_id,
                first_name: user.first_name,
                email: user.email
            }
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
};

export const login = async (req, res) => {

    try {

        const {
            email,
            password
        } = req.body;

        const user =
            await userModel.findUserByEmail(email);

        if (!user) {

            return res.status(401).json({
                message: 'User not exist'
            });

        }

        const isMatch =
            await bcrypt.compare(
                password,
                user.password_hash
            );

        if (!isMatch) {

            return res.status(401).json({
                message: 'Invalid password'
            });

        }

        const token = jwt.sign(
            {
                user_id: user.user_id
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '7d'
            }
        );

        res.status(200).json({
            token,
            user: {
                user_id: user.user_id,
                first_name: user.first_name,
                email: user.email
            }
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
};

export const onboardingCheck = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { default: pool } = await import('../config/db.js');

        // Check if freelancer profile exists and is completed
        const freelancerProfileRes = await pool.query(
            "SELECT onboarding_completed, vetting_status FROM freelancer_profiles WHERE user_id = $1",
            [userId]
        );
        const hasFreelancerProfile = freelancerProfileRes.rows.length > 0 && freelancerProfileRes.rows[0].onboarding_completed === true;

        // Check if client profile exists and is completed
        const clientProfileRes = await pool.query(
            "SELECT onboarding_completed, vetting_status FROM client_profiles WHERE user_id = $1",
            [userId]
        );
        const hasClientProfile = clientProfileRes.rows.length > 0 && clientProfileRes.rows[0].onboarding_completed === true;

        const freelancerVettingStatus = freelancerProfileRes.rows.length > 0 ? freelancerProfileRes.rows[0].vetting_status : null;
        const clientVettingStatus = clientProfileRes.rows.length > 0 ? clientProfileRes.rows[0].vetting_status : null;

        res.status(200).json({
            hasFreelancerProfile,
            hasClientProfile,
            freelancerVettingStatus,
            clientVettingStatus
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createClientProfile = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { ClientProfile } = await import('../models/clientProfileModel.js');

        const {
            company_name,
            company_size,
            industry,
            company_website,
            company_description,
            company_established_year,
            hiring_contact_name,
            hiring_contact_designation,
            onboarding_completed
        } = req.body;

        // Check if client profile already exists
        const checkRes = await ClientProfile.findByUserId(userId);
        let profile;

        if (checkRes.rows.length === 0) {
            const createRes = await ClientProfile.create(
                userId,
                company_name,
                company_size,
                industry,
                company_website,
                company_description,
                company_established_year,
                hiring_contact_name,
                hiring_contact_designation
            );
            profile = createRes.rows[0];
        } else {
            const current = checkRes.rows[0];
            const updatedProfile = await ClientProfile.update(
                userId,
                company_name !== undefined ? company_name : current.company_name,
                company_size !== undefined ? company_size : current.company_size,
                industry !== undefined ? industry : current.industry,
                company_website !== undefined ? company_website : current.company_website,
                company_description !== undefined ? company_description : current.company_description,
                company_established_year !== undefined ? (company_established_year ? parseInt(company_established_year) : null) : current.company_established_year,
                hiring_contact_name !== undefined ? hiring_contact_name : current.hiring_contact_name,
                hiring_contact_designation !== undefined ? hiring_contact_designation : current.hiring_contact_designation
            );
            profile = updatedProfile.rows[0];
        }

        if (onboarding_completed !== undefined) {
            const statusRes = await ClientProfile.updateOnboardingStatus(userId, onboarding_completed);
            profile = statusRes.rows[0];

            if (onboarding_completed === true) {
                const { default: pool } = await import("../config/db.js");
                const vettingSetting = await pool.query("SELECT setting_value FROM settings WHERE setting_key = 'enable_client_vetting'");
                let vettingVal = vettingSetting.rows[0]?.setting_value;
                if (typeof vettingVal === "string") {
                    try { vettingVal = JSON.parse(vettingVal); } catch {}
                }
                const isVettingEnabled = vettingVal === true || vettingVal === "true" || vettingVal?.enabled === true || vettingVal?.enabled === "true";
                const vettingStatus = isVettingEnabled ? "Pending" : "Approved";
                await ClientProfile.updateVettingStatus(userId, vettingStatus);
            }
        }

        res.status(201).json({
            message: "Client profile saved successfully.",
            profile
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getClientProfile = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { ClientProfile } = await import('../models/clientProfileModel.js');
        const { default: pool } = await import('../config/db.js');

        const checkRes = await ClientProfile.findByUserId(userId);
        if (checkRes.rows.length === 0) {
            return res.status(404).json({ message: "Client profile not found" });
        }

        const userRes = await pool.query(
            "SELECT first_name, last_name, email, profile_image FROM users WHERE user_id = $1",
            [userId]
        );

        res.status(200).json({
            profile: checkRes.rows[0],
            user: userRes.rows[0] || null
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getClientHiredFreelancers = async (req, res) => {
    try {
        const clientId = req.user.user_id;
        const { default: pool } = await import('../config/db.js');

        const query = `
            SELECT DISTINCT 
              u.user_id,
              u.first_name || ' ' || u.last_name as name,
              u.email,
              u.profile_image,
              fp.professional_title as title,
              fp.hourly_rate,
              fp.experience_level,
              fp.availability_status,
              COALESCE(
                (SELECT json_agg(json_build_object('project_id', j.job_id, 'title', j.title, 'type', 'project', 'status', p.status))
                 FROM proposals p
                 JOIN jobs j ON p.job_id = j.job_id
                 WHERE p.freelancer_id = u.user_id AND j.client_id = $1 AND p.status = 'Accepted'),
                '[]'::json
              ) as projects,
              COALESCE(
                (SELECT json_agg(json_build_object('application_id', ga.application_id, 'title', g.title, 'type', 'gig', 'status', ga.status))
                 FROM gig_applications ga
                 JOIN gigs g ON ga.gig_id = g.gig_id
                 WHERE ga.client_id = $1 AND g.freelancer_id = u.user_id AND ga.status = 'Accepted'),
                '[]'::json
              ) as gigs
            FROM users u
            JOIN freelancer_profiles fp ON u.user_id = fp.user_id
            WHERE u.user_id IN (
              -- Freelancers with accepted proposals for client's jobs
              SELECT p.freelancer_id 
              FROM proposals p
              JOIN jobs j ON p.job_id = j.job_id
              WHERE j.client_id = $1 AND p.status = 'Accepted'
              
              UNION
              
              -- Freelancers with accepted gig orders from this client
              SELECT g.freelancer_id
              FROM gig_applications ga
              JOIN gigs g ON ga.gig_id = g.gig_id
              WHERE ga.client_id = $1 AND ga.status = 'Accepted'
            )
        `;
        const result = await pool.query(query, [clientId]);
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getMySubscription = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { default: pool } = await import('../config/db.js');
        const result = await pool.query(
            `SELECT u.active_plan_id, u.created_at as user_created_at, sp.name as plan_name, sp.description, sp.price, sp.period, sp.gig_discount_percent, sp.features, sp.credits, sp.plan_duration, sp.plan_role
             FROM users u
             LEFT JOIN subscription_plans sp ON u.active_plan_id = sp.plan_id
             WHERE u.user_id = $1`,
            [userId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const subscribeToPlan = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { plan_id, payment_method } = req.body;
        const method = payment_method || "wallet";
        const { default: pool } = await import('../config/db.js');

        if (!plan_id) {
            return res.status(400).json({ message: "plan_id is required." });
        }

        // Verify the plan exists
        const planCheck = await pool.query("SELECT * FROM subscription_plans WHERE plan_id = $1", [parseInt(plan_id)]);
        if (planCheck.rows.length === 0) {
            return res.status(404).json({ message: "Subscription plan not found." });
        }

        const plan = planCheck.rows[0];
        const priceStr = plan.price.replace(/[^0-9.]/g, '');
        const price = priceStr ? parseFloat(priceStr) : 0;

        // Start transaction
        await pool.query("BEGIN");
        try {
            if (price > 0) {
                // Verify Stripe Checkout Session
                if (method === "stripe") {
                    const { session_id } = req.body;
                    if (!session_id) {
                        await pool.query("ROLLBACK");
                        return res.status(400).json({ message: "session_id is required for Stripe subscription confirmation." });
                    }

                    // Fetch Stripe secret key from Settings
                    let stripeSecretKey = process.env.STRIPE_SECRET_KEY;
                    const stripeKeysRes = await pool.query("SELECT setting_value FROM settings WHERE setting_key = 'stripe_keys'");
                    if (stripeKeysRes.rows.length > 0) {
                        let keys = stripeKeysRes.rows[0].setting_value;
                        if (typeof keys === "string") {
                            try { keys = JSON.parse(keys); } catch {}
                        }
                        if (keys?.secret_key) {
                            stripeSecretKey = keys.secret_key;
                        }
                    }

                    if (!stripeSecretKey) {
                        await pool.query("ROLLBACK");
                        return res.status(400).json({ message: "Stripe is not configured in settings." });
                    }

                    const { default: Stripe } = await import('stripe');
                    const localStripe = new Stripe(stripeSecretKey);
                    const stripeSession = await localStripe.checkout.sessions.retrieve(session_id);
                    if (stripeSession.payment_status !== "paid") {
                        await pool.query("ROLLBACK");
                        return res.status(400).json({ message: "Stripe payment has not been completed." });
                    }
                }

                // Get user wallet
                const userWalletRes = await pool.query("SELECT * FROM wallets WHERE user_id = $1", [userId]);
                let userWallet = userWalletRes.rows[0];
                if (!userWallet) {
                    const insertRes = await pool.query("INSERT INTO wallets (user_id, balance, currency) VALUES ($1, 0.00, 'USD') RETURNING *", [userId]);
                    userWallet = insertRes.rows[0];
                }

                // Get system/admin wallet
                const systemWalletRes = await pool.query("SELECT * FROM wallets WHERE is_system = TRUE");
                const systemWallet = systemWalletRes.rows[0];

                if (method === "wallet") {
                    if (parseFloat(userWallet.balance) < price) {
                        await pool.query("ROLLBACK");
                        return res.status(400).json({ 
                            message: `Insufficient wallet balance. Subscription requires $${price.toFixed(2)}, but your wallet only has $${parseFloat(userWallet.balance).toFixed(2)}.` 
                        });
                    }

                    // Debit user wallet
                    await pool.query("UPDATE wallets SET balance = balance - $1 WHERE wallet_id = $2", [price, userWallet.wallet_id]);
                }

                // Credit system/admin wallet
                if (systemWallet) {
                    await pool.query("UPDATE wallets SET balance = balance + $1 WHERE wallet_id = $2", [price, systemWallet.wallet_id]);
                }

                // Record transaction
                await pool.query(
                    `INSERT INTO wallet_transactions (sender_wallet_id, receiver_wallet_id, amount, type, status, description) 
                     VALUES ($1, $2, $3, 'Subscription_Purchase', 'Completed', $4)`,
                    [
                        method === "wallet" ? userWallet.wallet_id : null, 
                        systemWallet?.wallet_id || null, 
                        price, 
                        `Subscription purchase for ${plan.name} Plan (Paid via ${method === "wallet" ? "Wallet" : method === "stripe" ? "Stripe" : "PayPal"})`
                    ]
                );
            }

            // Update user active plan
            await pool.query(
                "UPDATE users SET active_plan_id = $1, active_plan_subscribed_at = CURRENT_TIMESTAMP WHERE user_id = $2",
                [parseInt(plan_id), userId]
            );

            await pool.query("COMMIT");

            res.json({
                message: `Successfully subscribed to plan "${plan.name}"`,
                active_plan_id: plan.plan_id,
                plan_name: plan.name,
                gig_discount_percent: plan.gig_discount_percent
            });
        } catch (txnError) {
            await pool.query("ROLLBACK");
            throw txnError;
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getLoggedInUser = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { default: pool } = await import('../config/db.js');

        const userRes = await pool.query(
            "SELECT user_id, first_name, last_name, email, profile_image FROM users WHERE user_id = $1",
            [userId]
        );

        if (userRes.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            user: userRes.rows[0]
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateUserProfile = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { default: pool } = await import('../config/db.js');
        const { first_name, last_name, profile_image } = req.body;

        const currentRes = await pool.query("SELECT * FROM users WHERE user_id = $1", [userId]);
        if (currentRes.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const current = currentRes.rows[0];

        const updatedName = first_name !== undefined ? first_name : current.first_name;
        const updatedLastName = last_name !== undefined ? last_name : current.last_name;
        const updatedImage = profile_image !== undefined ? profile_image : current.profile_image;

        const updateRes = await pool.query(
            `UPDATE users 
             SET first_name = $1, last_name = $2, profile_image = $3 
             WHERE user_id = $4 
             RETURNING user_id, first_name, last_name, email, profile_image`,
            [updatedName, updatedLastName, updatedImage, userId]
        );

        res.status(200).json({
            message: "User profile updated successfully!",
            user: updateRes.rows[0]
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const socialLogin = async (req, res) => {
    try {
        const { email, first_name, refCode } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        let user = await userModel.findUserByEmail(email);

        if (!user) {
            // User doesn't exist, create a new one with a dummy/empty password_hash
            const dummyPasswordHash = "";

            // Fetch referred_by user
            let referred_by = null;
            if (refCode) {
                const refUserRes = await pool.query("SELECT user_id FROM users WHERE referral_code = $1", [refCode]);
                if (refUserRes.rows.length > 0) {
                    referred_by = refUserRes.rows[0].user_id;
                }
            }

            // Generate unique referral code
            const referral_code = await generateUniqueReferralCode();

            user = await userModel.createUser(
                first_name || email.split('@')[0], 
                email, 
                dummyPasswordHash,
                referral_code,
                referred_by
            );

            // Create wallet for the user
            let signupBonus = 0.00;
            if (referred_by) {
                signupBonus = 5.00; // Default fallback
                try {
                    const settingsRes = await pool.query("SELECT setting_value FROM settings WHERE setting_key = 'referral_settings'");
                    if (settingsRes.rows.length > 0) {
                        let settingsVal = settingsRes.rows[0].setting_value;
                        if (typeof settingsVal === "string") {
                            settingsVal = JSON.parse(settingsVal);
                        }
                        if (settingsVal && settingsVal.signup_bonus !== undefined) {
                            signupBonus = parseFloat(settingsVal.signup_bonus);
                        }
                    }
                } catch (err) {
                    console.error("Error fetching referral signup_bonus settings:", err);
                }
            }
            await pool.query(
                "INSERT INTO wallets (user_id, balance, currency) VALUES ($1, $2, 'USD')",
                [user.user_id, signupBonus]
            );

            if (referred_by) {
                const walletRes = await pool.query("SELECT wallet_id FROM wallets WHERE user_id = $1", [user.user_id]);
                const walletId = walletRes.rows[0].wallet_id;

                await pool.query(`
                    INSERT INTO wallet_transactions 
                    (sender_wallet_id, receiver_wallet_id, amount, type, status, description)
                    VALUES (NULL, $1, $2, 'referral_signup_bonus', 'completed', 'Referral sign-up bonus reward')
                `, [walletId, signupBonus]);
            }
        }

        const token = jwt.sign(
            { user_id: user.user_id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(200).json({
            token,
            user: {
                user_id: user.user_id,
                first_name: user.first_name,
                email: user.email
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getReferrals = async (req, res) => {
    try {
        const userId = req.user.user_id;

        // 1. Fetch user's referral code
        const userRes = await pool.query("SELECT referral_code FROM users WHERE user_id = $1", [userId]);
        if (userRes.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        const referralCode = userRes.rows[0].referral_code;

        // 2. Fetch list of referred users
        const referredUsersRes = await pool.query(`
            SELECT 
                u.user_id,
                u.first_name || ' ' || COALESCE(u.last_name, '') as name,
                u.email,
                u.created_at,
                CASE 
                    WHEN rp.status = 'pending' THEN 'pending_approval'
                    WHEN rp.status = 'approved' THEN 'approved'
                    WHEN rp.status = 'rejected' THEN 'rejected'
                    ELSE 'pending_order'
                END as status
            FROM users u
            LEFT JOIN referral_payouts rp ON rp.referred_id = u.user_id AND rp.referrer_id = u.referred_by
            WHERE u.referred_by = $1
            ORDER BY u.created_at DESC
        `, [userId]);

        // 3. Fetch total referral earnings from wallet transactions
        const walletRes = await pool.query("SELECT wallet_id FROM wallets WHERE user_id = $1", [userId]);
        let totalEarned = 0;
        if (walletRes.rows.length > 0) {
            const walletId = walletRes.rows[0].wallet_id;
            const earningsRes = await pool.query(`
                SELECT COALESCE(SUM(amount), 0) as total
                FROM wallet_transactions
                WHERE receiver_wallet_id = $1 AND type = 'referral_bonus' AND status = 'completed'
            `, [walletId]);
            totalEarned = parseFloat(earningsRes.rows[0].total || 0);
        }

        res.status(200).json({
            referral_code: referralCode,
            referred_users: referredUsersRes.rows,
            total_earned: totalEarned
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getAffiliateStats = async (req, res) => {
    try {
        const userId = req.user.user_id;

        // 1. Get referral code
        const userRes = await pool.query("SELECT referral_code FROM users WHERE user_id = $1", [userId]);
        if (userRes.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        const referralCode = userRes.rows[0].referral_code;

        // 2. Count total referred users
        const referredCountRes = await pool.query("SELECT COUNT(*) as count FROM users WHERE referred_by = $1", [userId]);
        const referredCount = parseInt(referredCountRes.rows[0].count || 0);

        // 3. Count total pending & approved affiliate commissions
        const earningsRes = await pool.query(`
            SELECT 
                COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as pending_commissions,
                COALESCE(SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END), 0) as approved_commissions
            FROM affiliate_commissions
            WHERE affiliate_id = $1
        `, [userId]);
        const earnings = earningsRes.rows[0];

        // 4. Fetch the detailed commission ledger logs
        const ledgerRes = await pool.query(`
            SELECT 
                ac.commission_id,
                ac.amount,
                ac.platform_fee,
                ac.status,
                ac.created_at,
                u.first_name || ' ' || COALESCE(u.last_name, '') as referred_user_name,
                u.email as referred_user_email
            FROM affiliate_commissions ac
            JOIN users u ON ac.referred_user_id = u.user_id
            WHERE ac.affiliate_id = $1
            ORDER BY ac.created_at DESC
        `, [userId]);

        res.status(200).json({
            referral_code: referralCode,
            total_referred: referredCount,
            pending_commissions: parseFloat(earnings.pending_commissions),
            approved_commissions: parseFloat(earnings.approved_commissions),
            ledger: ledgerRes.rows
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getReferralBanner = async (req, res) => {
    try {
        // 1. Fetch settings from database
        let signupBonus = 5.00;
        let maxReferrerReward = 10.00;
        let headline = "Invite Friends & Earn";
        let subline = "Share your referral link with friends. They get a bonus on sign-up, and you get paid when they complete transactions!";
        let bgColor = "#0f172a";
        let accentColor = "#0d9488";

        const settingsRes = await pool.query("SELECT setting_value FROM settings WHERE setting_key = 'referral_settings'");
        let val = null;
        if (settingsRes.rows.length > 0) {
            val = settingsRes.rows[0].setting_value;
            if (typeof val === "string") {
                val = JSON.parse(val);
            }
            if (val) {
                // If a custom designed banner image exists, redirect the request to it!
                if (val.banner_image_url) {
                    return res.redirect(val.banner_image_url);
                }

                if (val.signup_bonus !== undefined) signupBonus = parseFloat(val.signup_bonus);
                if (val.banner_headline) headline = val.banner_headline;
                if (val.banner_subline) subline = val.banner_subline;
                if (val.banner_bg_color) bgColor = val.banner_bg_color;
                if (val.banner_accent_color) accentColor = val.banner_accent_color;

                if (Array.isArray(val.tiers) && val.tiers.length > 0) {
                    // Find max reward amount among tiers
                    maxReferrerReward = Math.max(...val.tiers.map(t => parseFloat(t.reward || 0)));
                }
            }
        }

        // 2. Wrap subline text into two lines
        const words = subline.split(" ");
        let sublinePart1 = "";
        let sublinePart2 = "";
        let currentLine = 1;
        for (const word of words) {
            if (currentLine === 1) {
                if ((sublinePart1 + " " + word).trim().length < 60) {
                    sublinePart1 += (sublinePart1 ? " " : "") + word;
                } else {
                    currentLine = 2;
                    sublinePart2 = word;
                }
            } else {
                if ((sublinePart2 + " " + word).trim().length < 60) {
                    sublinePart2 += (sublinePart2 ? " " : "") + word;
                } else {
                    sublinePart2 += "...";
                    break;
                }
            }
        }

        // XML-escape helper to prevent broken SVG elements
        const escapeXml = (str) => {
            if (!str) return "";
            return str.replace(/[<>&'"]/g, (c) => {
                switch (c) {
                    case '<': return '&lt;';
                    case '>': return '&gt;';
                    case '&': return '&amp;';
                    case '\'': return '&apos;';
                    case '"': return '&quot;';
                    default: return c;
                }
            });
        };

        const escapedHeadline = escapeXml(headline);
        const escapedSublinePart1 = escapeXml(sublinePart1);
        const escapedSublinePart2 = escapeXml(sublinePart2);

        // 3. Render SVG
        const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bgColor}" />
      <stop offset="100%" stop-color="#030712" />
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${accentColor}" />
      <stop offset="100%" stop-color="#10b981" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="10" stdDeviation="15" flood-color="#000" flood-opacity="0.3" />
    </filter>
  </defs>

  <rect width="800" height="400" rx="20" fill="url(#bgGrad)" />

  <circle cx="750" cy="50" r="180" fill="white" fill-opacity="0.03" />
  <circle cx="100" cy="350" r="150" fill="${accentColor}" fill-opacity="0.07" />
  <path d="M 600,400 L 800,200 L 800,400 Z" fill="white" fill-opacity="0.02" />

  <g transform="translate(560, 110)" filter="url(#shadow)">
    <rect width="180" height="180" rx="24" fill="white" fill-opacity="0.08" stroke="white" stroke-opacity="0.15" stroke-width="1.5" />
    <circle cx="70" cy="80" r="30" fill="url(#accentGrad)" />
    <text x="70" y="88" font-family="'Inter', sans-serif" font-weight="900" font-size="24" fill="white" text-anchor="middle">$</text>
    <circle cx="120" cy="110" r="25" fill="#f59e0b" />
    <text x="120" y="117" font-family="'Inter', sans-serif" font-weight="900" font-size="20" fill="white" text-anchor="middle">$</text>
  </g>

  <text x="60" y="90" font-family="'Inter', -apple-system, sans-serif" font-weight="900" font-size="36" fill="white">${escapedHeadline}</text>

  <text x="60" y="130" font-family="'Inter', -apple-system, sans-serif" font-weight="600" font-size="14" fill="#94a3b8">
    <tspan x="60" dy="0">${escapedSublinePart1}</tspan>
    <tspan x="60" dy="20">${escapedSublinePart2}</tspan>
  </text>

  <g transform="translate(60, 210)">
    <rect x="0" y="0" width="220" height="100" rx="16" fill="white" fill-opacity="0.05" stroke="white" stroke-opacity="0.1" stroke-width="1" />
    <text x="25" y="35" font-family="'Inter', sans-serif" font-weight="700" font-size="11" fill="#94a3b8" letter-spacing="1">SIGN-UP BONUS</text>
    <text x="25" y="75" font-family="'Inter', sans-serif" font-weight="900" font-size="32" fill="white">$${signupBonus.toFixed(2)}</text>

    <rect x="250" y="0" width="220" height="100" rx="16" fill="white" fill-opacity="0.05" stroke="white" stroke-opacity="0.1" stroke-width="1" />
    <text x="275" y="35" font-family="'Inter', sans-serif" font-weight="700" font-size="11" fill="#94a3b8" letter-spacing="1">REFERRAL REWARD</text>
    <text x="275" y="75" font-family="'Inter', sans-serif" font-weight="900" font-size="32" fill="url(#accentGrad)">Up to $${maxReferrerReward.toFixed(2)}</text>
  </g>

  <text x="60" y="355" font-family="'Inter', sans-serif" font-weight="800" font-size="12" fill="#64748b" letter-spacing="2">POWERED BY LANCERFLOW</text>
</svg>
        `;

        res.setHeader("Content-Type", "image/svg+xml");
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.status(200).send(svg);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getUserProfile = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { default: pool } = await import('../config/db.js');

        // Fetch user profile joining with subscription plans
        const userRes = await pool.query(
            `SELECT u.user_id, u.first_name, u.last_name, u.email, u.profile_image, u.active_plan_id, 
                    sp.name AS membership_name, sp.credits
             FROM users u
             LEFT JOIN subscription_plans sp ON u.active_plan_id = sp.plan_id
             WHERE u.user_id = $1`,
            [userId]
        );

        if (userRes.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const userData = userRes.rows[0];

        // Fetch wallet balance
        const walletRes = await pool.query("SELECT balance FROM wallets WHERE user_id = $1", [userId]);
        const balance = walletRes.rows.length > 0 ? parseFloat(walletRes.rows[0].balance) || 0.00 : 0.00;

        res.status(200).json({
            ...userData,
            membership_id: userData.active_plan_id,
            wallet_balance: balance.toString(),
            project_credits: userData.credits ?? 0,
            proposal_credits: userData.credits ?? 0
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};