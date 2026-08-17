import pool from "../config/db.js";
import Notification from "../models/notificationModel.js";

/**
 * Creates a PENDING sign-up bonus payout request upon profile onboarding completion
 * and notifies both the user and admin team. Money is ONLY credited after admin approval.
 */
export const creditSignupBonusIfEligible = async (userId) => {
    try {
        if (!userId) return { success: false, reason: "No user ID provided" };

        // 1. Fetch referral settings from database
        let signupBonusAmt = 2.00;
        let isSignupBonusEnabled = true;

        let requireSignupBonusApproval = true;

        const settingsRes = await pool.query("SELECT setting_value FROM settings WHERE setting_key = 'referral_settings'");
        if (settingsRes.rows.length > 0) {
            let val = settingsRes.rows[0].setting_value;
            if (typeof val === "string") {
                try { val = JSON.parse(val); } catch (e) {}
            }
            if (val) {
                if (val.signup_bonus !== undefined && parseFloat(val.signup_bonus) > 0) {
                    signupBonusAmt = parseFloat(val.signup_bonus);
                }
                if (val.enable_signup_bonus !== undefined) {
                    isSignupBonusEnabled = val.enable_signup_bonus === true || val.enable_signup_bonus === "true";
                }
                if (val.require_signup_bonus_approval !== undefined) {
                    requireSignupBonusApproval = val.require_signup_bonus_approval === true || val.require_signup_bonus_approval === "true";
                }
            }
        }

        if (!isSignupBonusEnabled || signupBonusAmt <= 0) {
            return { success: false, reason: "Signup bonus feature is disabled or set to 0." };
        }

        // 2. Check if user already received or requested a signup bonus
        const existingTxRes = await pool.query(`
            SELECT wt.transaction_id
            FROM wallet_transactions wt
            JOIN wallets w ON w.wallet_id = wt.receiver_wallet_id
            WHERE w.user_id = $1 AND wt.type IN ('signup_bonus', 'referral_signup_bonus') AND wt.status = 'completed'
        `, [userId]);

        if (existingTxRes.rows.length > 0) {
            return { success: false, reason: "Signup bonus already approved and credited previously." };
        }

        const existingPayoutRes = await pool.query(`
            SELECT payout_id, status FROM referral_payouts
            WHERE referred_id = $1 AND (details->>'type' = 'signup_bonus' OR details->>'type' IS NULL)
        `, [userId]);

        let payoutId;
        let userRes = await pool.query("SELECT first_name, last_name, email, referred_by FROM users WHERE user_id = $1", [userId]);
        const user = userRes.rows[0];
        const userName = user ? `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email : `User #${userId}`;
        const referrerId = user?.referred_by || userId;

        // Mode A: AUTO-CREDIT (No Admin Approval Required)
        if (!requireSignupBonusApproval) {
            // Check if payout record exists
            if (existingPayoutRes.rows.length > 0) {
                payoutId = existingPayoutRes.rows[0].payout_id;
                await pool.query("UPDATE referral_payouts SET status = 'approved', updated_at = CURRENT_TIMESTAMP WHERE payout_id = $1", [payoutId]);
            } else {
                const insRes = await pool.query(`
                    INSERT INTO referral_payouts (referrer_id, referred_id, amount, status, details)
                    VALUES ($1, $2, $3, 'approved', $4)
                    RETURNING payout_id
                `, [
                    referrerId,
                    userId,
                    signupBonusAmt,
                    JSON.stringify({
                        type: "signup_bonus",
                        trigger: "profile_setup_completion",
                        auto_approved: true,
                        timestamp: new Date().toISOString()
                    })
                ]);
                payoutId = insRes.rows[0].payout_id;
            }

            // Transfer money instantly into user wallet
            await pool.query("UPDATE wallets SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2", [signupBonusAmt, userId]);
            await pool.query("UPDATE wallets SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE is_system = TRUE", [signupBonusAmt]);

            const userWalletRes = await pool.query("SELECT wallet_id FROM wallets WHERE user_id = $1", [userId]);
            const sysWalletRes = await pool.query("SELECT wallet_id FROM wallets WHERE is_system = TRUE");
            if (userWalletRes.rows.length > 0 && sysWalletRes.rows.length > 0) {
                await pool.query(`
                    INSERT INTO wallet_transactions (sender_wallet_id, receiver_wallet_id, amount, type, status, description)
                    VALUES ($1, $2, $3, 'referral_signup_bonus', 'completed', 'Referral sign-up bonus reward (Auto-Approved)')
                `, [sysWalletRes.rows[0].wallet_id, userWalletRes.rows[0].wallet_id, signupBonusAmt]);
            }

            // Send Approval Notification
            try {
                await Notification.create({
                    userId,
                    title: "Sign-up Bonus Released! 🎁",
                    message: `Your $${signupBonusAmt.toFixed(2)} Sign-up bonus has been automatically credited to your wallet active balance!`,
                    type: "signup_bonus",
                    referenceId: payoutId.toString(),
                    targetTab: "wallet"
                });
            } catch (nErr) {
                console.error("Error creating user notification:", nErr);
            }

            console.log(`⚡ AUTO-CREDITED Sign-up Bonus $${signupBonusAmt.toFixed(2)} directly to user_id = ${userId}`);
            return { success: true, autoApproved: true };
        }

        // Mode B: MANUAL ADMIN APPROVAL REQUIRED
        if (existingPayoutRes.rows.length > 0) {
            payoutId = existingPayoutRes.rows[0].payout_id;
            console.log(`Pending signup bonus payout #${payoutId} already exists for user_id = ${userId}`);
        } else {
            // Create pending payout request in database
            const insRes = await pool.query(`
                INSERT INTO referral_payouts (referrer_id, referred_id, amount, status, details)
                VALUES ($1, $2, $3, 'pending', $4)
                RETURNING payout_id
            `, [
                referrerId,
                userId,
                signupBonusAmt,
                JSON.stringify({
                    type: "signup_bonus",
                    trigger: "profile_setup_completion",
                    timestamp: new Date().toISOString()
                })
            ]);
            payoutId = insRes.rows[0].payout_id;
            console.log(`🎁 Created pending signup bonus payout #${payoutId} ($${signupBonusAmt.toFixed(2)}) for user_id = ${userId}`);
        }

        // 3. STEP 1 NOTIFICATION: User In-App Notification
        try {
            await Notification.create({
                userId,
                title: "🎁 Sign-up Bonus Pending Admin Approval",
                message: `Your $${signupBonusAmt.toFixed(2)} Sign-up Bonus has been requested upon profile setup completion and is currently pending admin review.`,
                type: "signup_bonus",
                referenceId: payoutId.toString(),
                targetTab: "wallet"
            });
        } catch (nErr) {
            console.error("Error creating user notification:", nErr);
        }

        // 4. STEP 1 NOTIFICATION: Admin In-App Notifications
        try {
            const adminQuery = await pool.query("SELECT admin_id, email, full_name FROM admins");
            for (const adminRow of adminQuery.rows) {
                const userCheck = await pool.query("SELECT user_id FROM users WHERE email = $1", [adminRow.email]);
                let adminUserId;
                if (userCheck.rows.length > 0) {
                    adminUserId = userCheck.rows[0].user_id;
                } else {
                    const insertUser = await pool.query(
                        "INSERT INTO users (first_name, email, password_hash) VALUES ($1, $2, $3) RETURNING user_id",
                        [adminRow.full_name || "Admin", adminRow.email, "ADMIN_VIRTUAL_HASH"]
                    );
                    adminUserId = insertUser.rows[0].user_id;
                }

                await pool.query(
                    `INSERT INTO notifications (user_id, title, message, type, reference_id, target_tab)
                     VALUES ($1, '🎁 New Sign-up Bonus Pending Approval', $2, 'admin_alert', $3, 'referrals')`,
                    [
                        adminUserId,
                        `User ${userName} (${user?.email}) has completed profile setup. A $${signupBonusAmt.toFixed(2)} Sign-up bonus is pending admin approval.`,
                        payoutId.toString()
                    ]
                );
            }
        } catch (aErr) {
            console.error("Error creating admin notifications:", aErr);
        }

        return { success: true, payoutId, bonusAmount: signupBonusAmt, status: "pending" };
    } catch (err) {
        console.error("Error registering pending signup bonus:", err);
        return { success: false, reason: err.message };
    }
};
