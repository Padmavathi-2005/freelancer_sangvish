import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import * as userModel from '../models/userModel.js';
import pool from '../config/db.js';
import { sendEmail } from '../utils/emailHelper.js';

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

        if (!email || !email.trim()) {
            return res.status(400).json({ message: "Email is required." });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Check if user already exists
        const existingCheck = await pool.query("SELECT user_id FROM users WHERE LOWER(email) = $1", [normalizedEmail]);
        if (existingCheck.rows.length > 0) {
            return res.status(400).json({
                message: "An account with this email address already exists. Please sign in or use a different email."
            });
        }

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
                normalizedEmail,
                password_hash,
                referral_code,
                referred_by
            );

        // Create wallet for the user (with initial balance of 0.00 since signup bonus is pending approval)
        let signupBonus = 0.00;
        let isSignupBonusEnabled = true;
        if (referred_by) {
            signupBonus = 5.00; // Default fallback
            try {
                const settingsRes = await pool.query("SELECT setting_value FROM settings WHERE setting_key = 'referral_settings'");
                if (settingsRes.rows.length > 0) {
                    let settingsVal = settingsRes.rows[0].setting_value;
                    if (typeof settingsVal === "string") {
                        settingsVal = JSON.parse(settingsVal);
                    }
                    if (settingsVal) {
                        if (settingsVal.signup_bonus !== undefined) {
                            signupBonus = parseFloat(settingsVal.signup_bonus);
                        }
                        if (settingsVal.enable_signup_bonus !== undefined) {
                            isSignupBonusEnabled = settingsVal.enable_signup_bonus === true || settingsVal.enable_signup_bonus === "true";
                        }
                    }
                }
            } catch (err) {
                console.error("Error fetching referral signup_bonus settings:", err);
            }
        }
        await pool.query(
            "INSERT INTO wallets (user_id, balance, currency) VALUES ($1, 0.00, 'USD')",
            [user.user_id]
        );

        if (referred_by && isSignupBonusEnabled && signupBonus > 0) {
            // Create a pending payout request for the referred user's signup bonus
            await pool.query(`
                INSERT INTO referral_payouts (referrer_id, referred_id, amount, status, details)
                VALUES ($1, $2, $3, 'pending', $4)
            `, [
                referred_by,
                user.user_id,
                signupBonus,
                'pending',
                JSON.stringify({
                    type: "signup_bonus",
                    trigger: "registration",
                    timestamp: new Date().toISOString()
                })
            ]);
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
        console.error("Registration error:", error);
        if (error.code === '23505' || (error.message && (error.message.includes('users_email_key') || error.message.includes('unique constraint')))) {
            return res.status(400).json({
                message: "An account with this email address already exists. Please sign in or use a different email."
            });
        }
        res.status(500).json({
            message: "Failed to create account. Please try again."
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

        if (user.is_active === false) {
            return res.status(403).json({
                message: 'Your account has been blocked by administrator. Please contact support.'
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
            SELECT 
              u.user_id,
              COALESCE(NULLIF(TRIM(CONCAT_WS(' ', u.first_name, u.last_name)), ''), u.email) as name,
              u.email,
              u.profile_image,
              fp.professional_title as title,
              fp.hourly_rate,
              fp.experience_level,
              fp.availability_status,
              COALESCE(
                (
                  SELECT json_agg(
                    json_build_object(
                      'contract_id', c2.contract_id,
                      'title', c2.title,
                      'status', c2.status,
                      'budget', c2.budget,
                      'progress', c2.progress,
                      'created_at', c2.created_at,
                      'type', CASE WHEN c2.application_id IS NOT NULL THEN 'gig' ELSE 'project' END,
                      'rating', COALESCE(cr.rating, gr.rating, NULL),
                      'comment', COALESCE(cr.comment, gr.comment, NULL)
                    ) ORDER BY c2.created_at DESC
                  )
                  FROM contracts c2
                  LEFT JOIN contract_reviews cr ON c2.contract_id = cr.contract_id AND cr.reviewer_role = 'client'
                  LEFT JOIN gig_reviews gr ON c2.application_id = gr.application_id
                  WHERE c2.freelancer_id = u.user_id AND c2.client_id = $1
                ),
                '[]'::json
              ) as contracts
            FROM users u
            JOIN freelancer_profiles fp ON u.user_id = fp.user_id
            JOIN contracts c ON u.user_id = c.freelancer_id
            WHERE c.client_id = $1
            GROUP BY u.user_id, fp.freelancer_profile_id
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
        const { checkUserSubscription } = await import('../utils/subscriptionChecker.js');
        
        // Safely check for subscription expiry on the fly
        try {
            await checkUserSubscription(userId, req.app?.get('io'));
        } catch (subErr) {
            console.error("Subscription check notice:", subErr.message);
        }

        let result;
        try {
            result = await pool.query(
                `SELECT u.active_plan_id, u.active_plan_expires_at, u.created_at as user_created_at, sp.name as plan_name, sp.description, sp.price, sp.period, sp.gig_discount_percent, sp.features, sp.credits, sp.plan_duration, sp.plan_role
                 FROM users u
                 LEFT JOIN subscription_plans sp ON u.active_plan_id = sp.plan_id
                 WHERE u.user_id = $1`,
                [userId]
            );
        } catch (queryErr) {
            console.error("getMySubscription fallback triggered:", queryErr.message);
            result = await pool.query(
                `SELECT u.created_at as user_created_at FROM users u WHERE u.user_id = $1`,
                [userId]
            );
        }

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

            // Fetch the user's current subscription details
            const userSubCheck = await pool.query(
                "SELECT active_plan_id, active_plan_expires_at, active_plan_subscribed_at FROM users WHERE user_id = $1",
                [userId]
            );
            const currentUser = userSubCheck.rows[0] || {};
            const currentPlanId = currentUser.active_plan_id;
            const currentExpiresAt = currentUser.active_plan_expires_at;

            const durationDays = plan.plan_duration || 30;
            let newSubscribedAt = new Date();
            let newExpiresAt = new Date();
            newExpiresAt.setDate(newExpiresAt.getDate() + durationDays);

            if (parseInt(plan_id) === currentPlanId && currentExpiresAt && new Date(currentExpiresAt) >= new Date()) {
                // Same Plan: Queue Renewal by extending the expiration date
                newSubscribedAt = currentUser.active_plan_subscribed_at;
                newExpiresAt = new Date(currentExpiresAt);
                newExpiresAt.setDate(newExpiresAt.getDate() + durationDays);
            }

            // Update user active plan, expiration, and reset notification flags
            await pool.query(
                `UPDATE users SET 
                    active_plan_id = $1, 
                    active_plan_subscribed_at = $2, 
                    active_plan_expires_at = $3,
                    sub_notified_7d = FALSE,
                    sub_notified_3d = FALSE,
                    sub_notified_1d = FALSE
                 WHERE user_id = $4`,
                [parseInt(plan_id), newSubscribedAt, newExpiresAt, userId]
            );

            // Record invoice if paid subscription (price > 0)
            if (price > 0) {
                const invoiceNumber = `INV-SUB-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
                const userBillingRes = await pool.query(
                    "SELECT email, first_name || ' ' || COALESCE(last_name, '') as name FROM users WHERE user_id = $1",
                    [userId]
                );
                const billingUser = userBillingRes.rows[0];

                await pool.query(
                    `INSERT INTO subscription_invoices (user_id, plan_id, invoice_number, amount, payment_method, status, billing_name, billing_email)
                     VALUES ($1, $2, $3, $4, $5, 'Paid', $6, $7)`,
                    [
                        userId,
                        parseInt(plan_id),
                        invoiceNumber,
                        price,
                        method,
                        billingUser?.name || "LancerFlow Member",
                        billingUser?.email || ""
                    ]
                );
            }

            await pool.query("COMMIT");

            res.json({
                message: `Successfully subscribed to plan "${plan.name}"`,
                active_plan_id: plan.plan_id,
                plan_name: plan.name,
                gig_discount_percent: plan.gig_discount_percent,
                active_plan_expires_at: newExpiresAt
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

        if (user && user.is_active === false) {
            return res.status(403).json({
                message: 'Your account has been blocked by administrator. Please contact support.'
            });
        }

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

            // Create wallet for the user (with initial balance of 0.00 since signup bonus is pending approval)
            let signupBonus = 0.00;
            let isSignupBonusEnabled = true;
            if (referred_by) {
                signupBonus = 5.00; // Default fallback
                try {
                    const settingsRes = await pool.query("SELECT setting_value FROM settings WHERE setting_key = 'referral_settings'");
                    if (settingsRes.rows.length > 0) {
                        let settingsVal = settingsRes.rows[0].setting_value;
                        if (typeof settingsVal === "string") {
                            settingsVal = JSON.parse(settingsVal);
                        }
                        if (settingsVal) {
                            if (settingsVal.signup_bonus !== undefined) {
                                signupBonus = parseFloat(settingsVal.signup_bonus);
                            }
                            if (settingsVal.enable_signup_bonus !== undefined) {
                                isSignupBonusEnabled = settingsVal.enable_signup_bonus === true || settingsVal.enable_signup_bonus === "true";
                            }
                        }
                    }
                } catch (err) {
                    console.error("Error fetching referral signup_bonus settings:", err);
                }
            }
            await pool.query(
                "INSERT INTO wallets (user_id, balance, currency) VALUES ($1, 0.00, 'USD')",
                [user.user_id]
            );

            if (referred_by && isSignupBonusEnabled && signupBonus > 0) {
                // Create a pending payout request for the referred user's signup bonus
                await pool.query(`
                    INSERT INTO referral_payouts (referrer_id, referred_id, amount, status, details)
                    VALUES ($1, $2, $3, 'pending', $4)
                `, [
                    referred_by,
                    user.user_id,
                    signupBonus,
                    'pending',
                    JSON.stringify({
                        type: "signup_bonus",
                        trigger: "registration",
                        timestamp: new Date().toISOString()
                    })
                ]);
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
            LEFT JOIN referral_payouts rp 
              ON rp.referred_id = u.user_id 
              AND rp.referrer_id = u.referred_by
              AND (rp.details->>'type' IS NULL OR rp.details->>'type' != 'signup_bonus')
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

        // 4. Fetch settings configurations
        let signupBonusAmount = 5.00;
        let isSignupBonusEnabled = true;
        try {
            const settingsRes = await pool.query("SELECT setting_value FROM settings WHERE setting_key = 'referral_settings'");
            if (settingsRes.rows.length > 0) {
                let settingsVal = settingsRes.rows[0].setting_value;
                if (typeof settingsVal === "string") {
                    settingsVal = JSON.parse(settingsVal);
                }
                if (settingsVal) {
                    if (settingsVal.signup_bonus !== undefined) signupBonusAmount = parseFloat(settingsVal.signup_bonus);
                    if (settingsVal.enable_signup_bonus !== undefined) {
                        isSignupBonusEnabled = settingsVal.enable_signup_bonus === true || settingsVal.enable_signup_bonus === "true";
                    }
                }
            }
        } catch(e) {}

        res.status(200).json({
            referral_code: referralCode,
            referred_users: referredUsersRes.rows,
            total_earned: totalEarned,
            signup_bonus: signupBonusAmount,
            enable_signup_bonus: isSignupBonusEnabled
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getAffiliateStats = async (req, res) => {
    try {
        const userId = req.user.user_id;

        // 1. Get referral code and affiliate status
        const userRes = await pool.query("SELECT referral_code, is_affiliate FROM users WHERE user_id = $1", [userId]);
        if (userRes.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        const referralCode = userRes.rows[0].referral_code;
        const isAffiliate = userRes.rows[0].is_affiliate === true || userRes.rows[0].is_affiliate === 1;

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
            is_affiliate: isAffiliate,
            total_referred: referredCount,
            pending_commissions: parseFloat(earnings.pending_commissions),
            approved_commissions: parseFloat(earnings.approved_commissions),
            ledger: ledgerRes.rows
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const joinAffiliateProgram = async (req, res) => {
    try {
        const userId = req.user.user_id;
        await pool.query("UPDATE users SET is_affiliate = TRUE WHERE user_id = $1", [userId]);
        res.status(200).json({ message: "Successfully joined the affiliate program!" });
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
        let bgColor = "#ffffff";
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
      <stop offset="100%" stop-color="#f8fafc" />
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${accentColor}" />
      <stop offset="100%" stop-color="#059669" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#0f172a" flood-opacity="0.06" />
    </filter>
  </defs>

  <rect width="800" height="400" rx="20" fill="url(#bgGrad)" stroke="#e2e8f0" stroke-width="2" />

  <circle cx="750" cy="50" r="180" fill="#f1f5f9" fill-opacity="0.5" />
  <circle cx="100" cy="350" r="150" fill="${accentColor}" fill-opacity="0.04" />
  <path d="M 600,400 L 800,200 L 800,400 Z" fill="#f1f5f9" fill-opacity="0.3" />

  <g transform="translate(560, 110)" filter="url(#shadow)">
    <rect width="180" height="180" rx="24" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1.5" />
    <circle cx="70" cy="80" r="30" fill="url(#accentGrad)" />
    <text x="70" y="88" font-family="'Inter', sans-serif" font-weight="900" font-size="24" fill="white" text-anchor="middle">$</text>
    <circle cx="120" cy="110" r="25" fill="#f59e0b" />
    <text x="120" y="117" font-family="'Inter', sans-serif" font-weight="900" font-size="20" fill="white" text-anchor="middle">$</text>
  </g>

  <text x="60" y="90" font-family="'Inter', -apple-system, sans-serif" font-weight="900" font-size="36" fill="#0f172a">${escapedHeadline}</text>

  <text x="60" y="130" font-family="'Inter', -apple-system, sans-serif" font-weight="600" font-size="14" fill="#475569">
    <tspan x="60" dy="0">${escapedSublinePart1}</tspan>
    <tspan x="60" dy="20">${escapedSublinePart2}</tspan>
  </text>

  <g transform="translate(60, 210)">
    <rect x="0" y="0" width="220" height="100" rx="16" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1.5" />
    <text x="25" y="35" font-family="'Inter', sans-serif" font-weight="700" font-size="11" fill="#475569" letter-spacing="1">SIGN-UP BONUS</text>
    <text x="25" y="75" font-family="'Inter', sans-serif" font-weight="900" font-size="32" fill="#0f172a">$${signupBonus.toFixed(2)}</text>

    <rect x="250" y="0" width="220" height="100" rx="16" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1.5" />
    <text x="275" y="35" font-family="'Inter', sans-serif" font-weight="700" font-size="11" fill="#475569" letter-spacing="1">REFERRAL REWARD</text>
    <text x="275" y="75" font-family="'Inter', sans-serif" font-weight="900" font-size="32" fill="url(#accentGrad)">Up to $${maxReferrerReward.toFixed(2)}</text>
  </g>

  <text x="60" y="355" font-family="'Inter', sans-serif" font-weight="800" font-size="12" fill="#94a3b8" letter-spacing="2">POWERED BY LANCERFLOW</text>
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
            `SELECT u.user_id, u.first_name, u.last_name, u.email, u.profile_image, u.active_plan_id, u.is_affiliate, u.referral_code,
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

export const getMySubscriptionInvoices = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { default: pool } = await import('../config/db.js');
        
        const result = await pool.query(
            `SELECT si.invoice_id, si.invoice_number, si.amount, si.payment_method, si.status, si.created_at,
                    sp.name as plan_name
             FROM subscription_invoices si
             JOIN subscription_plans sp ON si.plan_id = sp.plan_id
             WHERE si.user_id = $1
             ORDER BY si.created_at DESC`,
            [userId]
        );
        
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getSubscriptionInvoiceById = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { id } = req.params;
        const { default: pool } = await import('../config/db.js');
        
        const result = await pool.query(
            `SELECT si.*, sp.name as plan_name, sp.description as plan_description, sp.plan_duration
             FROM subscription_invoices si
             JOIN subscription_plans sp ON si.plan_id = sp.plan_id
             WHERE si.invoice_id = $1 AND si.user_id = $2`,
            [parseInt(id), userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Invoice not found." });
        }
        
        res.status(200).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// In-memory OTP storage for phone verification
const phoneOtps = new Map();

export const sendPhoneOtp = async (req, res) => {
    try {
        const userId = req.user?.user_id;
        const { phone } = req.body;

        if (!phone || !phone.trim()) {
            return res.status(400).json({
                message: "Mobile number does not exist or is invalid. Please enter a valid phone number."
            });
        }

        const rawPhone = phone.trim();
        const cleanedPhone = rawPhone.replace(/[\s\-\(\)]/g, "");

        // Valid phone format check (E.164 standard / 7 to 15 digits)
        const phoneRegex = /^\+?[1-9]\d{6,14}$/;
        if (!phoneRegex.test(cleanedPhone)) {
            return res.status(400).json({
                message: "Mobile number does not exist or is invalid. Please enter a valid phone number with country code."
            });
        }

        // Check if phone number is already registered with another user account
        const existingPhoneRes = await pool.query(
            "SELECT user_id FROM users WHERE (phone = $1 OR phone = $2 OR REPLACE(REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '(', ''), ')', '') = $2) AND user_id <> $3",
            [rawPhone, cleanedPhone, userId]
        );
        if (existingPhoneRes.rows.length > 0) {
            return res.status(400).json({
                message: "This mobile number is already registered with another account. Please use a different mobile number."
            });
        }

        // Generate 6-digit OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
        const expiresAtDate = new Date(expiresAt);

        phoneOtps.set(String(userId), { phone: rawPhone, code: otpCode, expiresAt });
        phoneOtps.set(Number(userId), { phone: rawPhone, code: otpCode, expiresAt });

        try {
            await pool.query(
                "UPDATE users SET phone = $1, phone_otp = $2, phone_otp_expires_at = $3 WHERE user_id = $4",
                [rawPhone, otpCode, expiresAtDate, userId]
            );
        } catch (dbErr) {
            // Column fallback if phone_otp column doesn't exist yet
            await pool.query("UPDATE users SET phone = $1 WHERE user_id = $2", [rawPhone, userId]);
        }

        // Attempt Real SMS Dispatch via Twilio API or custom SMS Gateway
        let realSmsSent = false;
        try {
            let smsConfig = null;
            const smsSettingsRes = await pool.query("SELECT setting_value FROM settings WHERE setting_key = 'sms_gateway_settings'");
            if (smsSettingsRes.rows.length > 0) {
                smsConfig = smsSettingsRes.rows[0].setting_value;
                if (typeof smsConfig === "string") smsConfig = JSON.parse(smsConfig);
            }

            if (!process.env.TWILIO_ACCOUNT_SID) {
                try {
                    const dotenv = await import('dotenv');
                    dotenv.config();
                } catch (e) {}
            }

            const accountSid = process.env.TWILIO_ACCOUNT_SID || smsConfig?.twilio_account_sid || "";
            const authToken = process.env.TWILIO_AUTH_TOKEN || smsConfig?.twilio_auth_token || "";
            const twilioNumber = process.env.TWILIO_PHONE_NUMBER || smsConfig?.twilio_phone_number || "";

            if (accountSid && authToken && twilioNumber) {
                const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
                const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
                let targetPhone = cleanedPhone;
                if (!targetPhone.startsWith('+')) {
                    if (targetPhone.length === 10) {
                        targetPhone = `+91${targetPhone}`;
                    } else {
                        targetPhone = `+${targetPhone}`;
                    }
                }

                const params = new URLSearchParams();
                params.append("To", targetPhone);
                params.append("From", twilioNumber);
                params.append("Body", `Your Buy2Lancer verification code is: ${otpCode}`);

                const twilioRes = await fetch(twilioUrl, {
                    method: "POST",
                    headers: {
                        "Authorization": `Basic ${credentials}`,
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                    body: params.toString()
                });

                if (twilioRes.ok) {
                    realSmsSent = true;
                    console.log(`[TWILIO SMS DISPATCH SUCCESS] Real SMS code ${otpCode} sent to ${targetPhone}`);
                } else {
                    const twilioErr = await twilioRes.json();
                    console.error("[TWILIO SMS DISPATCH ERROR]", twilioErr);
                }
            } else if (smsConfig && smsConfig.api_key && smsConfig.api_url) {
                const smsRes = await fetch(smsConfig.api_url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Authorization": smsConfig.api_key },
                    body: JSON.stringify({
                        to: cleanedPhone,
                        message: `Your verification code is ${otpCode}`
                    })
                });
                if (smsRes.ok) realSmsSent = true;
            }
        } catch (smsErr) {
            console.error("SMS Gateway Dispatch Error:", smsErr);
        }

        console.log(`\n==============================================`);
        console.log(`[MOBILE OTP REAL DISPATCH]`);
        console.log(`User ID: ${userId}`);
        console.log(`Mobile Number: ${rawPhone}`);
        console.log(`OTP Code: ${otpCode}`);
        console.log(`Real Gateway Sent: ${realSmsSent ? "YES" : "FALLBACK LOG"}`);
        console.log(`Expires in: 10 minutes`);
        console.log(`==============================================\n`);

        res.status(200).json({
            message: `Verification code sent successfully to ${rawPhone}. Please check your mobile phone.`,
            expiresInSeconds: 600
        });
    } catch (error) {
        console.error("sendPhoneOtp Error:", error);
        res.status(500).json({ message: error.message || "Failed to send OTP." });
    }
};

export const verifyPhoneOtp = async (req, res) => {
    try {
        const userId = req.user?.user_id;
        const { otp } = req.body;

        if (!otp || !String(otp).trim()) {
            return res.status(400).json({ message: "OTP code is required." });
        }

        const inputOtp = String(otp).trim();
        let expectedCode = null;
        let isExpired = false;

        // 1. Check in-memory map
        const storedOtpData = phoneOtps.get(String(userId)) || phoneOtps.get(Number(userId));
        if (storedOtpData) {
            if (Date.now() > storedOtpData.expiresAt) {
                isExpired = true;
            } else {
                expectedCode = String(storedOtpData.code).trim();
            }
        }

        // 2. Check SQL DB table if not found in memory
        if (!expectedCode && !isExpired) {
            try {
                const userDbRes = await pool.query(
                    "SELECT phone_otp, phone_otp_expires_at FROM users WHERE user_id = $1",
                    [userId]
                );
                if (userDbRes.rows.length > 0) {
                    const row = userDbRes.rows[0];
                    if (row.phone_otp) {
                        if (row.phone_otp_expires_at && new Date() > new Date(row.phone_otp_expires_at)) {
                            isExpired = true;
                        } else {
                            expectedCode = String(row.phone_otp).trim();
                        }
                    }
                }
            } catch (dbErr) {
                console.error("DB OTP lookup error:", dbErr);
            }
        }

        if (isExpired) {
            phoneOtps.delete(String(userId));
            phoneOtps.delete(Number(userId));
            return res.status(400).json({ message: "OTP code has expired. Please request a new OTP." });
        }

        if (!expectedCode) {
            return res.status(400).json({ message: "No active OTP found. Please click 'Send OTP' first." });
        }

        if (inputOtp !== expectedCode) {
            return res.status(400).json({ message: "Invalid OTP code. Please check your SMS and try again." });
        }

        // OTP is valid! Update phone_verified in DB
        try {
            await pool.query(
                "UPDATE users SET phone_verified = true, phone_otp = NULL, phone_otp_expires_at = NULL WHERE user_id = $1",
                [userId]
            );
        } catch (updateErr) {
            await pool.query("UPDATE users SET phone_verified = true WHERE user_id = $1", [userId]);
        }

        // Clean up memory
        phoneOtps.delete(String(userId));
        phoneOtps.delete(Number(userId));

        res.status(200).json({
            message: "Mobile number verified successfully!",
            phone_verified: true
        });
    } catch (error) {
        console.error("verifyPhoneOtp Error:", error);
        res.status(500).json({ message: error.message || "Failed to verify OTP." });
    }
};

// In-memory Email OTP storage
const emailOtps = new Map();

export const sendEmailOtp = async (req, res) => {
    try {
        const userId = req.user?.user_id;
        const userRes = await pool.query("SELECT email FROM users WHERE user_id = $1", [userId]);
        if (userRes.rows.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }
        const userEmail = userRes.rows[0].email;

        // Generate 6-digit Email OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
        const expiresAtDate = new Date(expiresAt);

        emailOtps.set(String(userId), { email: userEmail, code: otpCode, expiresAt });
        emailOtps.set(Number(userId), { email: userEmail, code: otpCode, expiresAt });

        try {
            await pool.query(
                "UPDATE users SET email_otp = $1, email_otp_expires_at = $2 WHERE user_id = $3",
                [otpCode, expiresAtDate, userId]
            );
        } catch (e) {}

        // Send email via standard free Nodemailer / SMTP helper
        let emailSent = false;
        try {
            await sendEmail({
                to: userEmail,
                subject: "Verify Your Email Address - Buy2Lancer",
                text: `Hello,\n\nYour 6-digit email verification code is: ${otpCode}\n\nThis code will expire in 10 minutes. If you did not request this verification code, please ignore this email.`,
                html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; text-align: left;">
                  <p style="font-size: 15px; color: #334155; margin-bottom: 16px; font-weight: 600;">Hello,</p>
                  <p style="font-size: 14px; color: #475569; margin-bottom: 20px; line-height: 1.5;">Use the following 6-digit verification code to complete your email address verification:</p>
                  
                  <div style="background-color: #f0fdf4; border: 2px dashed #0f766e; border-radius: 12px; padding: 20px 16px; text-align: center; margin: 24px 0;">
                    <span style="font-size: 11px; font-weight: 800; color: #0f766e; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-bottom: 8px;">Your Verification Code</span>
                    <span style="font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #0f766e; font-family: 'Courier New', Courier, monospace; display: block; margin-left: 8px;">${otpCode}</span>
                  </div>

                  <p style="font-size: 13px; color: #64748b; margin-top: 20px; line-height: 1.5;">This security code will expire in <strong style="color: #0f766e;">10 minutes</strong>. If you did not request this code, please ignore this email.</p>
                </div>
                `
            });
            emailSent = true;
        } catch (emailErr) {
            console.error("sendEmail SMTP Error:", emailErr);
        }

        console.log(`\n==============================================`);
        console.log(`[EMAIL OTP DISPATCH]`);
        console.log(`User ID: ${userId}`);
        console.log(`Email: ${userEmail}`);
        console.log(`OTP Code: ${otpCode}`);
        console.log(`SMTP Sent: ${emailSent ? "YES" : "FALLBACK LOG"}`);
        console.log(`==============================================\n`);

        res.status(200).json({
            message: `Verification OTP sent to ${userEmail}. Please check your email inbox.`,
            expiresInSeconds: 600
        });
    } catch (error) {
        console.error("sendEmailOtp Error:", error);
        res.status(500).json({ message: error.message || "Failed to send email OTP." });
    }
};

export const verifyEmailOtp = async (req, res) => {
    try {
        const userId = req.user?.user_id;
        const { otp } = req.body;

        if (!otp || !String(otp).trim()) {
            return res.status(400).json({ message: "OTP code is required." });
        }

        const inputOtp = String(otp).trim();
        let expectedCode = null;
        let isExpired = false;

        const storedOtpData = emailOtps.get(String(userId)) || emailOtps.get(Number(userId));
        if (storedOtpData) {
            if (Date.now() > storedOtpData.expiresAt) {
                isExpired = true;
            } else {
                expectedCode = String(storedOtpData.code).trim();
            }
        }

        if (!expectedCode && !isExpired) {
            try {
                const dbRes = await pool.query("SELECT email_otp, email_otp_expires_at FROM users WHERE user_id = $1", [userId]);
                if (dbRes.rows.length > 0 && dbRes.rows[0].email_otp) {
                    const row = dbRes.rows[0];
                    if (row.email_otp_expires_at && new Date() > new Date(row.email_otp_expires_at)) {
                        isExpired = true;
                    } else {
                        expectedCode = String(row.email_otp).trim();
                    }
                }
            } catch (e) {}
        }

        if (isExpired) {
            emailOtps.delete(String(userId));
            emailOtps.delete(Number(userId));
            return res.status(400).json({ message: "OTP code has expired. Please request a new OTP." });
        }

        if (!expectedCode) {
            return res.status(400).json({ message: "No active Email OTP found. Please click 'Send Email OTP' first." });
        }

        if (inputOtp !== expectedCode) {
            return res.status(400).json({ message: "Invalid OTP code. Please check your email and try again." });
        }

        // Email OTP is valid!
        try {
            await pool.query("UPDATE users SET email_verified = true, email_otp = NULL, email_otp_expires_at = NULL WHERE user_id = $1", [userId]);
        } catch (e) {
            await pool.query("UPDATE users SET email_verified = true WHERE user_id = $1", [userId]);
        }

        emailOtps.delete(String(userId));
        emailOtps.delete(Number(userId));

        res.status(200).json({
            message: "Email address verified successfully!",
            email_verified: true
        });
    } catch (error) {
        console.error("verifyEmailOtp Error:", error);
        res.status(500).json({ message: error.message || "Failed to verify email OTP." });
    }
};