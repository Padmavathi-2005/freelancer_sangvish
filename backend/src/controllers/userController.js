import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import * as userModel from '../models/userModel.js';

export const register = async (req, res) => {

    try {

        const {
            first_name,
            email,
            password
        } = req.body;
console.log(req.body);
console.log("Password:", password);
        const password_hash =
            await bcrypt.hash(password, 10);

        const user =
            await userModel.createUser(
                first_name,
                email,
                password_hash
            );

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
                "UPDATE users SET active_plan_id = $1 WHERE user_id = $2",
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
        const { email, first_name } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        let user = await userModel.findUserByEmail(email);

        if (!user) {
            // User doesn't exist, create a new one with a dummy/empty password_hash
            const dummyPasswordHash = "";
            user = await userModel.createUser(first_name || email.split('@')[0], email, dummyPasswordHash);
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