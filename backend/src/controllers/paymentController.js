import Stripe from "stripe";
import fs from "fs";
import pool from "../config/db.js";
import { getOrCreateWallet } from "./walletController.js";
import { handlePostHireNotificationsAndActions } from "../utils/hiringNotifier.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

/**
 * Re-evaluates a job's Open/Closed status based on how many non-cancelled
 * contracts currently exist vs. the job's num_freelancers hiring limit.
 * Called after any single contract is cancelled so that multi-hire jobs
 * re-open a slot without affecting other active contracts on the same job.
 */
const recalculateJobStatus = async (jobId) => {
  if (!jobId) return;
  try {
    const jobRes = await pool.query("SELECT num_freelancers FROM jobs WHERE job_id = $1", [jobId]);
    if (jobRes.rows.length === 0) return;

    const numFreelancersStr = jobRes.rows[0]?.num_freelancers || "1 freelancer";
    let limit = 1;
    if (numFreelancersStr.includes("2-3")) {
      limit = 3;
    } else if (numFreelancersStr.includes("2-5")) {
      limit = 5;
    } else if (numFreelancersStr.includes("More than 5") || numFreelancersStr.includes("5+") || numFreelancersStr.includes("many") || numFreelancersStr.includes("4+")) {
      limit = 999;
    } else {
      const match = numFreelancersStr.match(/^(\d+)/);
      if (match) limit = parseInt(match[1]);
    }

    const countRes = await pool.query(
      "SELECT COUNT(*) FROM contracts WHERE job_id = $1 AND status != 'Cancelled'",
      [jobId]
    );
    const activeCount = parseInt(countRes.rows[0].count || 0);

    const newStatus = activeCount >= limit ? "Closed" : "Open";
    await pool.query(
      "UPDATE jobs SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE job_id = $2",
      [newStatus, jobId]
    );
  } catch (err) {
    console.error("recalculateJobStatus error for job", jobId, ":", err);
  }
};

/**
 * Checks if a user has a referrer and if this is their first completed payment.
 * If so, awards the referrer a referral bonus of $10.
 */
export const checkAndRewardReferrer = async (referredUserId) => {
  try {
    // 1. Check if the user was referred by someone
    const userRes = await pool.query(
      "SELECT referred_by FROM users WHERE user_id = $1",
      [referredUserId]
    );
    
    if (userRes.rows.length === 0) return;
    const referrerId = userRes.rows[0].referred_by;
    if (!referrerId) return; // Not referred

    // 2. Check if a payout request already exists for this referral
    const checkRes = await pool.query(
      "SELECT payout_id FROM referral_payouts WHERE referrer_id = $1 AND referred_id = $2",
      [referrerId, referredUserId]
    );

    if (checkRes.rows.length > 0) {
      return; // Already exists (pending, approved, or rejected)
    }

    // 3. Calculate this referrer's successful referral number (nth_referral)
    const approvedRes = await pool.query(
      "SELECT COUNT(*) as count FROM referral_payouts WHERE referrer_id = $1 AND status = 'approved'",
      [referrerId]
    );
    const approvedCount = parseInt(approvedRes.rows[0].count || 0);
    const referralNumber = approvedCount + 1; // This is their Nth referral

    // 4. Fetch referral settings from database
    let bonusAmount = 10.00; // Default fallback
    try {
      const settingsRes = await pool.query("SELECT setting_value FROM settings WHERE setting_key = 'referral_settings'");
      if (settingsRes.rows.length > 0) {
        let settingsVal = settingsRes.rows[0].setting_value;
        if (typeof settingsVal === "string") {
          settingsVal = JSON.parse(settingsVal);
        }
        if (settingsVal && Array.isArray(settingsVal.tiers)) {
          // Sort tiers by min_referrals descending to match the highest applicable tier
          const sortedTiers = [...settingsVal.tiers].sort((a, b) => b.min_referrals - a.min_referrals);
          const matchingTier = sortedTiers.find(tier => referralNumber >= tier.min_referrals);
          if (matchingTier) {
            bonusAmount = parseFloat(matchingTier.reward);
          }
        }
      }
    } catch (settingErr) {
      console.error("Error reading referral settings, using fallback reward amount:", settingErr);
    }

    // 5. Create a pending payout request in referral_payouts
    await pool.query(`
      INSERT INTO referral_payouts (referrer_id, referred_id, amount, status, details)
      VALUES ($1, $2, $3, 'pending', $4)
    `, [
      referrerId, 
      referredUserId, 
      bonusAmount, 
      JSON.stringify({ 
        trigger: "first_completed_transaction",
        referral_number: referralNumber,
        timestamp: new Date().toISOString()
      })
    ]);

    console.log(`Created pending referral payout request for referrer ${referrerId} and referred user ${referredUserId} (Referral #${referralNumber}, Reward: $${bonusAmount})`);
  } catch (err) {
    console.error("Error in checkAndRewardReferrer:", err);
  }
};

/**
 * Checks if the transacting user has a referrer, and if so, records a pending
 * affiliate commission equal to 10% of the platform service fee collected.
 */
export const checkAndEarnAffiliateCommission = async (referredUserId) => {
  try {
    // 1. Check if referred by someone
    const userRes = await pool.query("SELECT referred_by FROM users WHERE user_id = $1", [referredUserId]);
    if (userRes.rows.length === 0) return;
    const referrerId = userRes.rows[0].referred_by;
    if (!referrerId) return;

    // 2. Fetch the latest completed transaction of the referred user that has a commission_amount > 0
    // and hasn't been credited for affiliate commissions yet
    const query = `
      SELECT wt.transaction_id, wt.commission_amount
      FROM wallet_transactions wt
      JOIN wallets w ON w.wallet_id = wt.sender_wallet_id
      WHERE w.user_id = $1 
        AND wt.status = 'completed' 
        AND wt.commission_amount > 0
        AND NOT EXISTS (
          SELECT 1 FROM affiliate_commissions ac 
          WHERE ac.transaction_id = wt.transaction_id
        )
      ORDER BY wt.created_at DESC
      LIMIT 1
    `;
    const txRes = await pool.query(query, [referredUserId]);
    if (txRes.rows.length === 0) return;

    const { transaction_id, commission_amount } = txRes.rows[0];
    const platformFee = parseFloat(commission_amount);
    
    // Affiliate gets 10%
    const affiliateAmount = parseFloat((platformFee * 0.10).toFixed(2));
    if (affiliateAmount <= 0) return;

    // 3. Insert the pending commission request
    await pool.query(`
      INSERT INTO affiliate_commissions (affiliate_id, referred_user_id, transaction_id, amount, platform_fee, status)
      VALUES ($1, $2, $3, $4, $5, 'pending')
    `, [referrerId, referredUserId, transaction_id, affiliateAmount, platformFee]);

    console.log(`Log pending affiliate commission: Referrer=${referrerId}, Referred=${referredUserId}, Tx=${transaction_id}, Fee=${platformFee}, Comm=${affiliateAmount}`);
  } catch (err) {
    console.error("Error in checkAndEarnAffiliateCommission:", err);
  }
};

/**
 * POST /api/payments/stripe/create-session
 * Creates a Stripe Checkout Session for a gig application payment.
 * Called from ClientOrdersTab AFTER the freelancer has accepted the order.
 *
 * Body: { application_id, amount_usd, label }
 */
export const createStripeSession = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { application_id, amount_usd, label } = req.body;

    if (!application_id || !amount_usd) {
      return res.status(400).json({ message: "application_id and amount_usd are required." });
    }

    const amountCents = Math.round(parseFloat(amount_usd) * 100);
    if (amountCents < 50) {
      return res.status(400).json({ message: "Minimum Stripe charge is $0.50." });
    }

    // Verify the application belongs to this client and is Accepted
    const appRes = await pool.query(
      `SELECT ga.application_id, ga.price, ga.status, g.title as gig_title
       FROM gig_applications ga
       JOIN gigs g ON ga.gig_id = g.gig_id
       WHERE ga.application_id = $1 AND ga.client_id = $2`,
      [parseInt(application_id), userId]
    );
    if (appRes.rows.length === 0) {
      return res.status(404).json({ message: "Application not found or access denied." });
    }
    const app = appRes.rows[0];
    if (app.status !== "Accepted") {
      return res.status(400).json({ message: "Payment is only allowed for Accepted orders." });
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
      return res.status(400).json({ message: "Stripe is not configured. Please add Stripe Secret Key in Admin Payment Settings." });
    }

    const localStripe = new Stripe(stripeSecretKey);

    const session = await localStripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: label || `Payment for: ${app.gig_title}`,
              description: `Gig Order #${application_id}`,
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${FRONTEND_URL}/dashboard/orders?stripe_success=1&application_id=${application_id}&amount=${amount_usd}`,
      cancel_url:  `${FRONTEND_URL}/dashboard/orders?stripe_cancel=1&application_id=${application_id}`,
      metadata: {
        application_id: application_id.toString(),
        user_id: userId.toString(),
        amount_usd: amount_usd.toString(),
        type: "gig_payment",
      },
    });

    return res.status(200).json({ url: session.url, session_id: session.id });
  } catch (err) {
    console.error("Stripe session creation error:", err);
    return res.status(500).json({ message: "Failed to create Stripe payment session.", error: err.message });
  }
};

/**
 * POST /api/payments/stripe/confirm
 * Called by frontend AFTER Stripe redirects back with success.
 *
 * Flow:
 *  1. Funds client wallet with paid amount
 *  2. Deducts from wallet into escrow
 *  3. Creates the contract and milestones
 *
 * Body: { application_id, amount_usd }
 */
export const confirmStripePayment = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { application_id, amount_usd } = req.body;

    if (!application_id || !amount_usd) {
      return res.status(400).json({ message: "application_id and amount_usd are required." });
    }

    const amount = parseFloat(amount_usd);

    // Fetch application + gig details
    const appRes = await pool.query(
      `SELECT ga.application_id, ga.client_id, ga.price, g.freelancer_id, g.title as gig_title
       FROM gig_applications ga
       JOIN gigs g ON ga.gig_id = g.gig_id
       WHERE ga.application_id = $1 AND ga.client_id = $2`,
      [parseInt(application_id), userId]
    );
    if (appRes.rows.length === 0) {
      return res.status(404).json({ message: "Application not found." });
    }
    const app = appRes.rows[0];
    const orderPrice = parseFloat(app.price);

    // Check for custom milestones (determines flow 1 vs 3)
    const milestoneCountRes = await pool.query(
      "SELECT COUNT(*) FROM gig_application_milestones WHERE application_id = $1",
      [parseInt(application_id)]
    );
    const hasMilestones = parseInt(milestoneCountRes.rows[0].count) > 0;

    // Get or create client wallet
    let clientWalletRes = await pool.query("SELECT * FROM wallets WHERE user_id = $1", [userId]);
    let clientWallet = clientWalletRes.rows[0];
    if (!clientWallet) {
      const ins = await pool.query(
        "INSERT INTO wallets (user_id, balance, currency) VALUES ($1, 0.00, 'USD') RETURNING *",
        [userId]
      );
      clientWallet = ins.rows[0];
    }

    // Get or create freelancer wallet
    let freelancerWalletRes = await pool.query("SELECT * FROM wallets WHERE user_id = $1", [app.freelancer_id]);
    let freelancerWallet = freelancerWalletRes.rows[0];
    if (!freelancerWallet) {
      const ins = await pool.query(
        "INSERT INTO wallets (user_id, balance, currency) VALUES ($1, 0.00, 'USD') RETURNING *",
        [app.freelancer_id]
      );
      freelancerWallet = ins.rows[0];
    }

    // Get system escrow wallet
    const sysRes = await pool.query("SELECT * FROM wallets WHERE is_system = TRUE");
    const sysWallet = sysRes.rows[0];

    const upfrontAmount = amount; // The amount paid via Stripe IS the upfront amount
    const percentDesc = "100%";

    await pool.query("BEGIN");
    try {
      // 1. Credit client wallet with Stripe-paid amount (simulates real-money funding)
      await pool.query(
        "UPDATE wallets SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = $2",
        [upfrontAmount, clientWallet.wallet_id]
      );

      // 2. Record stripe deposit transaction
      if (sysWallet) {
        await pool.query(
          `INSERT INTO wallet_transactions (sender_wallet_id, receiver_wallet_id, amount, type, status, description)
           VALUES ($1, $2, $3, 'Stripe Deposit', 'Completed', $4)`,
          [
            clientWallet.wallet_id,
            sysWallet.wallet_id,
            upfrontAmount,
            `Stripe payment of $${upfrontAmount.toFixed(2)} for gig order #${application_id}`,
          ]
        );
      }

      // 3. Debit client wallet → credit escrow (upfront amount)
      await pool.query(
        "UPDATE wallets SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = $2",
        [upfrontAmount, clientWallet.wallet_id]
      );
      if (sysWallet) {
        await pool.query(
          "UPDATE wallets SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = $2",
          [upfrontAmount, sysWallet.wallet_id]
        );

        // 4. Record escrow transfer
        await pool.query(
          `INSERT INTO wallet_transactions (sender_wallet_id, receiver_wallet_id, amount, type, status, description)
           VALUES ($1, $2, $3, 'Transfer', 'Completed', $4)`,
          [
            clientWallet.wallet_id,
            sysWallet.wallet_id,
            upfrontAmount,
            `${percentDesc} upfront escrow for gig order: ${app.gig_title}`,
          ]
        );
      }

      // 5. Check if contract already exists for this application (avoid duplicates)
      const existingContract = await pool.query(
        "SELECT contract_id FROM contracts WHERE application_id = $1",
        [parseInt(application_id)]
      );

      if (existingContract.rows.length === 0) {
        // 6. Create the contract
        const contractRes = await pool.query(
          `INSERT INTO contracts (client_id, freelancer_id, title, budget, status, progress, application_id)
           VALUES ($1, $2, $3, $4, 'Hired', $5, $6) RETURNING *`,
          [
            app.client_id,
            app.freelancer_id,
            app.gig_title,
            orderPrice,
            hasMilestones ? 50 : 0,
            parseInt(application_id),
          ]
        );
        const contract = contractRes.rows[0];

        // 7. Populate contract_milestones
        if (hasMilestones) {
          const appMilestones = await pool.query(
            "SELECT * FROM gig_application_milestones WHERE application_id = $1 ORDER BY id ASC",
            [parseInt(application_id)]
          );
          let mIndex = 0;
          for (const m of appMilestones.rows) {
            const payStatus = mIndex === 0 ? 'Funded' : 'Pending';
            await pool.query(
              `INSERT INTO contract_milestones (contract_id, title, description, amount, start_date, end_date, status, payment_status)
               VALUES ($1, $2, $3, $4, $5, $6, 'Pending', $7)`,
              [contract.contract_id, m.title, m.description || null, parseFloat(m.amount), m.start_date, m.end_date, payStatus]
            );
            mIndex++;
          }
        } else {
          await pool.query(
            `INSERT INTO contract_milestones (contract_id, title, amount, status, payment_status)
             VALUES ($1, 'Entire Project Scope', $2, 'Pending', 'Funded')`,
            [contract.contract_id, orderPrice]
          );
        }
      }

      // 8. Mark application as paid (update payment_status if column exists)
      await pool.query(
        "UPDATE gig_applications SET status = 'Accepted' WHERE application_id = $1",
        [parseInt(application_id)]
      );

      await pool.query("COMMIT");
      await checkAndRewardReferrer(userId);
      await checkAndEarnAffiliateCommission(userId);
    } catch (txErr) {
      await pool.query("ROLLBACK");
      throw txErr;
    }

    // Notify freelancer that payment was received
    try {
      const { default: Notification } = await import("../models/notificationModel.js");
      const notif = await Notification.create({
        userId: app.freelancer_id,
        title: "Payment Received",
        message: `Client has paid for the gig order "${app.gig_title}". The contract is now active.`,
        type: "payment",
        referenceId: application_id.toString(),
      });
      if (req.io) {
        req.io.to(`user_${app.freelancer_id}`).emit("new_notification", notif);
      }
    } catch (notifErr) {
      console.error("Payment notification error:", notifErr);
    }

    return res.status(200).json({
      message: "Payment confirmed. Contract is now active.",
      amount: upfrontAmount,
      hasMilestones,
    });
  } catch (err) {
    console.error("Stripe confirm error:", err);
    return res.status(500).json({ message: "Failed to confirm payment.", error: err.message });
  }
};

/**
 * POST /api/payments/wallet/pay
 * Handles direct wallet or simulated PayPal payment for a gig order.
 * Same logic as confirmStripePayment but uses existing wallet balance.
 *
 * Body: { application_id, method }  (method: "wallet" | "paypal")
 */
export const payWithWallet = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { application_id, method } = req.body;

    if (!application_id) {
      return res.status(400).json({ message: "application_id is required." });
    }

    const appRes = await pool.query(
      `SELECT ga.application_id, ga.client_id, ga.price, ga.status, g.freelancer_id, g.title as gig_title
       FROM gig_applications ga
       JOIN gigs g ON ga.gig_id = g.gig_id
       WHERE ga.application_id = $1 AND ga.client_id = $2`,
      [parseInt(application_id), userId]
    );
    if (appRes.rows.length === 0) {
      return res.status(404).json({ message: "Application not found." });
    }
    const app = appRes.rows[0];
    if (app.status !== "Accepted") {
      return res.status(400).json({ message: "Payment is only allowed for Accepted orders." });
    }

    const orderPrice = parseFloat(app.price);

    const milestoneCountRes = await pool.query(
      "SELECT COUNT(*) FROM gig_application_milestones WHERE application_id = $1",
      [parseInt(application_id)]
    );
    const hasMilestones = parseInt(milestoneCountRes.rows[0].count) > 0;
    const upfrontAmount = orderPrice;
    const percentDesc = "100%";

    // Get or create client wallet
    let clientWalletRes = await pool.query("SELECT * FROM wallets WHERE user_id = $1", [userId]);
    let clientWallet = clientWalletRes.rows[0];
    if (!clientWallet) {
      const ins = await pool.query(
        "INSERT INTO wallets (user_id, balance, currency) VALUES ($1, 0.00, 'USD') RETURNING *",
        [userId]
      );
      clientWallet = ins.rows[0];
    }

    if (method === "paypal") {
      // Simulate PayPal: auto-fund the wallet first
      await pool.query(
        "UPDATE wallets SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = $2",
        [upfrontAmount, clientWallet.wallet_id]
      );
    } else {
      // Wallet: check existing balance
      if (parseFloat(clientWallet.balance) < upfrontAmount) {
        return res.status(400).json({
          message: `Insufficient wallet balance. You have $${parseFloat(clientWallet.balance).toFixed(2)} but need $${upfrontAmount.toFixed(2)}.`,
        });
      }
    }

    // Re-fetch after potential PayPal top-up
    clientWalletRes = await pool.query("SELECT * FROM wallets WHERE user_id = $1", [userId]);
    clientWallet = clientWalletRes.rows[0];

    const sysRes = await pool.query("SELECT * FROM wallets WHERE is_system = TRUE");
    const sysWallet = sysRes.rows[0];

    await pool.query("BEGIN");
    try {
      // Deduct from client wallet
      await pool.query(
        "UPDATE wallets SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = $2",
        [upfrontAmount, clientWallet.wallet_id]
      );

      // Credit escrow
      if (sysWallet) {
        await pool.query(
          "UPDATE wallets SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = $2",
          [upfrontAmount, sysWallet.wallet_id]
        );
        await pool.query(
          `INSERT INTO wallet_transactions (sender_wallet_id, receiver_wallet_id, amount, type, status, description)
           VALUES ($1, $2, $3, 'Transfer', 'Completed', $4)`,
          [
            clientWallet.wallet_id,
            sysWallet.wallet_id,
            upfrontAmount,
            `${percentDesc} upfront escrow via ${method} for gig order: ${app.gig_title}`,
          ]
        );
      }

      // Create contract if not already existing
      const existingContract = await pool.query(
        "SELECT contract_id FROM contracts WHERE application_id = $1",
        [parseInt(application_id)]
      );
      if (existingContract.rows.length === 0) {
        const contractRes = await pool.query(
          `INSERT INTO contracts (client_id, freelancer_id, title, budget, status, progress, application_id)
           VALUES ($1, $2, $3, $4, 'Hired', $5, $6) RETURNING *`,
          [app.client_id, app.freelancer_id, app.gig_title, orderPrice, hasMilestones ? 50 : 0, parseInt(application_id)]
        );
        const contract = contractRes.rows[0];

        if (hasMilestones) {
          const appMilestones = await pool.query(
            "SELECT * FROM gig_application_milestones WHERE application_id = $1 ORDER BY id ASC",
            [parseInt(application_id)]
          );
          let mIndex = 0;
          for (const m of appMilestones.rows) {
            const payStatus = mIndex === 0 ? 'Funded' : 'Pending';
            await pool.query(
              `INSERT INTO contract_milestones (contract_id, title, description, amount, start_date, end_date, status, payment_status)
               VALUES ($1, $2, $3, $4, $5, $6, 'Pending', $7)`,
              [contract.contract_id, m.title, m.description || null, parseFloat(m.amount), m.start_date, m.end_date, payStatus]
            );
            mIndex++;
          }
        } else {
          await pool.query(
            `INSERT INTO contract_milestones (contract_id, title, amount, status, payment_status)
             VALUES ($1, 'Entire Project Scope', $2, 'Pending', 'Funded')`,
            [contract.contract_id, orderPrice]
          );
        }
      }

      // Update gig application status to Accepted (paid) to match Stripe confirm behavior
      await pool.query(
        "UPDATE gig_applications SET status = 'Accepted', updated_at = CURRENT_TIMESTAMP WHERE application_id = $1",
        [parseInt(application_id)]
      );

      await pool.query("COMMIT");
      await checkAndRewardReferrer(userId);
      await checkAndEarnAffiliateCommission(userId);
    } catch (txErr) {
      await pool.query("ROLLBACK");
      throw txErr;
    }

    // Notify freelancer that payment was received
    try {
      const { default: Notification } = await import("../models/notificationModel.js");
      const notif = await Notification.create({
        userId: app.freelancer_id,
        title: "Payment Received",
        message: `Client has paid for the gig order "${app.gig_title}". The contract is now active.`,
        type: "payment",
        referenceId: application_id.toString(),
      });
      if (req.io) {
        req.io.to(`user_${app.freelancer_id}`).emit("new_notification", notif);
      }
    } catch (notifErr) {
      console.error("Payment notification error:", notifErr);
    }

    return res.status(200).json({
      message: `${method === "paypal" ? "PayPal" : "Wallet"} payment confirmed. Contract is now active.`,
      amount: upfrontAmount,
      hasMilestones,
    });
  } catch (err) {
    console.error("Wallet/PayPal pay error:", err);
    return res.status(500).json({ message: "Failed to process payment.", error: err.message });
  }
};

/**
 * POST /api/payments/stripe/create-subscription-session
 * Creates a Stripe Checkout Session for subscription plans.
 */
export const createStripeSubscriptionSession = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { plan_id } = req.body;

    if (!plan_id) {
      return res.status(400).json({ message: "plan_id is required." });
    }

    // Get plan details
    const planRes = await pool.query("SELECT * FROM subscription_plans WHERE plan_id = $1", [parseInt(plan_id)]);
    if (planRes.rows.length === 0) {
      return res.status(404).json({ message: "Subscription plan not found." });
    }
    const plan = planRes.rows[0];
    const priceStr = plan.price.replace(/[^0-9.]/g, '');
    const price = priceStr ? parseFloat(priceStr) : 0;
    const amountCents = Math.round(price * 100);

    if (amountCents < 50) {
      return res.status(400).json({ message: "Plan price is below minimum Stripe charge." });
    }

    // Fetch Stripe Secret Key from database settings
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
      return res.status(400).json({ message: "Stripe is not configured in Admin Payment Settings." });
    }

    const localStripe = new Stripe(stripeSecretKey);
    const session = await localStripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${plan.name} Plan Membership Upgrade`,
              description: `LancerFlow Premium Upgrade`,
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${FRONTEND_URL}/pricing/${plan_id}?stripe_success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${FRONTEND_URL}/pricing/${plan_id}?stripe_cancel=1`,
      metadata: {
        plan_id: plan_id.toString(),
        user_id: userId.toString(),
        type: "subscription_payment",
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Subscription Stripe session error:", err);
    return res.status(500).json({ message: "Failed to create subscription Stripe session.", error: err.message });
  }
};

/**
 * Helper to process the database transaction for hiring/accepting a proposal
 */
const processProposalHireTransaction = async (proposal, upfrontAmount, method) => {
  const bidAmount = parseFloat(proposal.bid_amount);

  // Get or create client wallet
  let clientWalletRes = await pool.query("SELECT * FROM wallets WHERE user_id = $1", [proposal.client_id]);
  let clientWallet = clientWalletRes.rows[0];
  if (!clientWallet) {
    const ins = await pool.query(
      "INSERT INTO wallets (user_id, balance, currency) VALUES ($1, 0.00, 'USD') RETURNING *",
      [proposal.client_id]
    );
    clientWallet = ins.rows[0];
  }

  // Get or create freelancer wallet
  let freelancerWalletRes = await pool.query("SELECT * FROM wallets WHERE user_id = $1", [proposal.freelancer_id]);
  let freelancerWallet = freelancerWalletRes.rows[0];
  if (!freelancerWallet) {
    const ins = await pool.query(
      "INSERT INTO wallets (user_id, balance, currency) VALUES ($1, 0.00, 'USD') RETURNING *",
      [proposal.freelancer_id]
    );
    freelancerWallet = ins.rows[0];
  }

  // Get system escrow wallet
  const systemWalletRes = await pool.query("SELECT * FROM wallets WHERE is_system = TRUE");
  const systemWallet = systemWalletRes.rows[0];

  // Calculate commission & net freelancer amount (standard platform fee)
  let commissionPercent = 0.05; // Default 5%
  const feeRes = await pool.query("SELECT setting_value FROM settings WHERE setting_key = 'platform_fee'");
  if (feeRes.rows.length > 0) {
    let feeVal = feeRes.rows[0].setting_value;
    if (typeof feeVal === "string") {
      try { feeVal = JSON.parse(feeVal); } catch {}
    }
    if (feeVal?.fee) {
      commissionPercent = parseFloat(feeVal.fee) / 100;
    }
  }
  const commissionAmount = upfrontAmount * commissionPercent;
  const freelancerAmount = upfrontAmount - commissionAmount;

  await pool.query("BEGIN");
  try {
    // Lock the proposal row to prevent concurrent race conditions
    const lockProposalRes = await pool.query(
      "SELECT status FROM proposals WHERE proposal_id = $1 FOR UPDATE",
      [proposal.proposal_id]
    );
    if (lockProposalRes.rows[0]?.status === "Accepted") {
      throw new Error("This proposal has already been accepted.");
    }

    // 1. If method is paypal or stripe, credit client wallet first (simulates depositing funds)
    if (method === "paypal" || method === "stripe") {
      await pool.query(
        "UPDATE wallets SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = $2",
        [upfrontAmount, clientWallet.wallet_id]
      );
      // Record Stripe/PayPal deposit transaction
      if (systemWallet) {
        await pool.query(
          `INSERT INTO wallet_transactions (sender_wallet_id, receiver_wallet_id, amount, type, status, description)
           VALUES ($1, $2, $3, $4, 'Completed', $5)`,
          [
            clientWallet.wallet_id,
            systemWallet.wallet_id,
            upfrontAmount,
            method === "stripe" ? "Stripe Deposit" : "PayPal Deposit",
            `${method === "stripe" ? "Stripe" : "PayPal"} payment of $${upfrontAmount.toFixed(2)} for project: ${proposal.job_title}`,
          ]
        );
      }
    } else {
      // Wallet: check balance
      if (parseFloat(clientWallet.balance) < upfrontAmount) {
        throw new Error(`Insufficient wallet balance. You have $${parseFloat(clientWallet.balance).toFixed(2)}, but need $${upfrontAmount.toFixed(2)}. Please add funds first.`);
      }
    }

    // Re-fetch client wallet balance after potential auto-fund
    if (method === "paypal" || method === "stripe") {
      const ref = await pool.query("SELECT * FROM wallets WHERE wallet_id = $1", [clientWallet.wallet_id]);
      clientWallet = ref.rows[0];
    }

    // 2. Debit client wallet
    await pool.query(
      "UPDATE wallets SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = $2",
      [upfrontAmount, clientWallet.wallet_id]
    );

    // 3. Credit admin escrow wallet (holds the actual funds)
    if (systemWallet) {
      await pool.query(
        "UPDATE wallets SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = $2",
        [upfrontAmount, systemWallet.wallet_id]
      );

      // Record client-to-escrow transfer transaction
      await pool.query(
        `INSERT INTO wallet_transactions (sender_wallet_id, receiver_wallet_id, amount, type, status, description)
         VALUES ($1, $2, $3, 'Transfer', 'Completed', $4)`,
        [
          clientWallet.wallet_id,
          systemWallet.wallet_id,
          upfrontAmount,
          `Escrow funding (First Milestone) for project: ${proposal.job_title} via ${method}`,
        ]
      );
    }

    // 5. Auto-create contract!
    const contractRes = await pool.query(
      `INSERT INTO contracts (client_id, freelancer_id, job_id, title, budget, status, progress)
       VALUES ($1, $2, $3, $4, $5, 'Hired', 0)
       RETURNING *`,
      [
        proposal.client_id,
        proposal.freelancer_id,
        proposal.job_id,
        proposal.job_title,
        bidAmount
      ]
    );
    const contract = contractRes.rows[0];

    // 6. Populate contract_milestones
    let milestoneList = [];
    try {
      milestoneList = typeof proposal.milestones === "string"
        ? JSON.parse(proposal.milestones)
        : (proposal.milestones || []);
    } catch (e) {}

    if (milestoneList && milestoneList.length > 0) {
      for (let i = 0; i < milestoneList.length; i++) {
        const m = milestoneList[i];
        const isFirst = i === 0;
        await pool.query(
          `INSERT INTO contract_milestones (contract_id, title, amount, status, payment_status)
           VALUES ($1, $2, $3, 'Pending', $4)`,
          [contract.contract_id, m.title, parseFloat(m.amount), isFirst ? 'Funded' : 'Pending']
        );
      }
    } else {
      await pool.query(
        `INSERT INTO contract_milestones (contract_id, title, amount, status, payment_status)
         VALUES ($1, 'Entire Project Scope', $2, 'Pending', 'Funded')`,
        [contract.contract_id, bidAmount]
      );
    }

    // 7. Check hiring limit and update Job Status
    const numFreelancersQuery = await pool.query("SELECT num_freelancers FROM jobs WHERE job_id = $1", [proposal.job_id]);
    const numFreelancersStr = numFreelancersQuery.rows[0]?.num_freelancers || "1 freelancer";
    
    let limit = 1;
    if (numFreelancersStr.includes("2-3")) {
      limit = 3;
    } else if (numFreelancersStr.includes("2-5")) {
      limit = 5;
    } else if (numFreelancersStr.includes("More than 5") || numFreelancersStr.includes("many") || numFreelancersStr.includes("5+") || numFreelancersStr.includes("4+")) {
      limit = 999;
    } else {
      const match = numFreelancersStr.match(/^(\d+)/);
      if (match) {
        limit = parseInt(match[1]);
      }
    }

    const hiredCountRes = await pool.query(
      "SELECT COUNT(*) FROM contracts WHERE job_id = $1 AND status != 'Cancelled'",
      [proposal.job_id]
    );
    const hiredCount = parseInt(hiredCountRes.rows[0].count || 0);

    if (hiredCount >= limit) {
      await pool.query("UPDATE jobs SET status = 'Closed' WHERE job_id = $1", [proposal.job_id]);
      // Auto-decline other proposals for this job
      await pool.query(
        "UPDATE proposals SET status = 'Declined', updated_at = CURRENT_TIMESTAMP WHERE job_id = $1 AND proposal_id != $2 AND status NOT IN ('Declined', 'Accepted')",
        [proposal.job_id, proposal.proposal_id]
      );
    } else {
      await pool.query("UPDATE jobs SET status = 'Open' WHERE job_id = $1", [proposal.job_id]);
    }

    // 8. Update Proposal Status to 'Accepted'
    await pool.query("UPDATE proposals SET status = 'Accepted', updated_at = CURRENT_TIMESTAMP WHERE proposal_id = $1", [proposal.proposal_id]);

    await pool.query("COMMIT");
    return { contract, commissionPercent };
  } catch (err) {
    await pool.query("ROLLBACK");
    throw err;
  }
};

/**
 * POST /api/payments/proposal/stripe/create-session
 */
export const createStripeProposalSession = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { proposal_id } = req.body;

    if (!proposal_id) {
      return res.status(400).json({ message: "proposal_id is required." });
    }

    const proposalRes = await pool.query(
      `SELECT p.*, j.title as job_title, j.client_id, j.budget as job_budget, j.max_budget as job_max_budget, j.min_budget as job_min_budget, j.num_freelancers
       FROM proposals p
       JOIN jobs j ON p.job_id = j.job_id
       WHERE p.proposal_id = $1`,
      [parseInt(proposal_id)]
    );
    if (proposalRes.rows.length === 0) {
      return res.status(404).json({ message: "Proposal not found." });
    }
    const proposal = proposalRes.rows[0];
    if (proposal.client_id !== userId) {
      return res.status(403).json({ message: "Access denied. You do not own the project for this proposal." });
    }
    if (proposal.status === "Accepted") {
      return res.status(400).json({ message: "This proposal has already been hired." });
    }

    const bidAmount = parseFloat(proposal.bid_amount);
    let milestoneList = [];
    try {
      milestoneList = typeof proposal.milestones === "string"
        ? JSON.parse(proposal.milestones)
        : (proposal.milestones || []);
    } catch (e) {}

    const hasMilestones = milestoneList && milestoneList.length > 0;
    const upfrontAmount = hasMilestones ? parseFloat(milestoneList[0].amount) : bidAmount;
    
    // Check total budget limit
    const contractSumRes = await pool.query(
      "SELECT COALESCE(SUM(budget), 0) as total FROM contracts WHERE job_id = $1 AND status != 'Cancelled'",
      [proposal.job_id]
    );
    const currentCommitted = parseFloat(contractSumRes.rows[0].total || 0);
    const maxBudget = parseFloat(proposal.job_max_budget || proposal.job_budget || 0);
    
    const numFreelancersStr = proposal.num_freelancers || "1 freelancer";
    let limit = 1;
    if (numFreelancersStr.includes("2-3")) {
      limit = 3;
    } else if (numFreelancersStr.includes("2-5")) {
      limit = 5;
    } else if (numFreelancersStr.includes("More than 5") || numFreelancersStr.includes("5+") || numFreelancersStr.includes("many") || numFreelancersStr.includes("4+")) {
      limit = 999;
    } else {
      const match = numFreelancersStr.match(/^(\d+)/);
      if (match) {
        limit = parseInt(match[1]);
      }
    }

    const isMultiHire = limit > 1;
    const isBudgetExceeded = isMultiHire
      ? bidAmount > maxBudget
      : (currentCommitted + bidAmount) > maxBudget;

    if (maxBudget > 0 && isBudgetExceeded) {
      return res.status(400).json({
        message: isMultiHire
          ? `Hiring limit exceeded. Total project budget is $${maxBudget.toLocaleString()} per freelancer, but the candidate's bid of $${bidAmount.toLocaleString()} exceeds this limit.`
          : `Hiring limit exceeded. Total project budget is $${maxBudget.toLocaleString()}, but you have already committed $${currentCommitted.toLocaleString()} to active contracts. Hiring this candidate at $${bidAmount.toLocaleString()} would exceed the budget limit.`
      });
    }

    const amountCents = Math.round(upfrontAmount * 100);

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
      return res.status(400).json({ message: "Stripe is not configured. Please add Stripe Secret Key in Admin Payment Settings." });
    }

    const localStripe = new Stripe(stripeSecretKey);
    const session = await localStripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Hiring payment for: ${proposal.job_title}`,
              description: `Project Proposal #${proposal_id}`,
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${FRONTEND_URL}/dashboard/proposals?stripe_proposal_success=1&proposal_id=${proposal_id}&amount=${upfrontAmount}`,
      cancel_url:  `${FRONTEND_URL}/dashboard/proposals?stripe_proposal_cancel=1&proposal_id=${proposal_id}`,
      metadata: {
        proposal_id: proposal_id.toString(),
        user_id: userId.toString(),
        amount_usd: upfrontAmount.toString(),
        type: "proposal_payment",
      },
    });

    return res.status(200).json({ url: session.url, session_id: session.id });
  } catch (err) {
    console.error("Stripe session creation error for proposal:", err);
    return res.status(500).json({ message: "Failed to create Stripe payment session.", error: err.message });
  }
};

/**
 * POST /api/payments/proposal/confirm
 */
export const confirmStripeProposalPayment = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { proposal_id, amount_usd } = req.body;

    if (!proposal_id || !amount_usd) {
      return res.status(400).json({ message: "proposal_id and amount_usd are required." });
    }

    const proposalRes = await pool.query(
      `SELECT p.*, j.title as job_title, j.client_id
       FROM proposals p
       JOIN jobs j ON p.job_id = j.job_id
       WHERE p.proposal_id = $1`,
      [parseInt(proposal_id)]
    );
    if (proposalRes.rows.length === 0) {
      return res.status(404).json({ message: "Proposal not found." });
    }
    const proposal = proposalRes.rows[0];
    if (proposal.client_id !== userId) {
      return res.status(403).json({ message: "Access denied." });
    }
    if (proposal.status === "Accepted") {
      return res.status(200).json({ message: "Payment already confirmed." });
    }

    const upfrontAmount = parseFloat(amount_usd);

    await processProposalHireTransaction(proposal, upfrontAmount, "stripe");

    // Send notifications and initialize chat
    await handlePostHireNotificationsAndActions({
      proposalId: parseInt(proposal_id),
      bidAmount: upfrontAmount,
      io: req.io
    });

    await checkAndRewardReferrer(userId);
    await checkAndEarnAffiliateCommission(userId);

    return res.status(200).json({
      message: "Payment confirmed. Contract is now active.",
      amount: upfrontAmount,
    });
  } catch (err) {
    console.error("Stripe proposal confirm error:", err);
    return res.status(500).json({ message: "Failed to confirm proposal payment.", error: err.message });
  }
};

/**
 * POST /api/payments/proposal/pay
 */
export const payProposalDirectly = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { proposal_id, method } = req.body; // method: "wallet" or "paypal"

    if (!proposal_id || !method) {
      return res.status(400).json({ message: "proposal_id and method are required." });
    }

    const proposalRes = await pool.query(
      `SELECT p.*, j.title as job_title, j.client_id, j.budget as job_budget, j.max_budget as job_max_budget, j.min_budget as job_min_budget, j.num_freelancers
       FROM proposals p
       JOIN jobs j ON p.job_id = j.job_id
       WHERE p.proposal_id = $1`,
      [parseInt(proposal_id)]
    );
    if (proposalRes.rows.length === 0) {
      return res.status(404).json({ message: "Proposal not found." });
    }
    const proposal = proposalRes.rows[0];
    if (proposal.client_id !== userId) {
      return res.status(403).json({ message: "Access denied." });
    }
    if (proposal.status === "Accepted") {
      return res.status(400).json({ message: "This proposal has already been hired." });
    }

    const bidAmount = parseFloat(proposal.bid_amount);
    let milestoneList = [];
    try {
      milestoneList = typeof proposal.milestones === "string"
        ? JSON.parse(proposal.milestones)
        : (proposal.milestones || []);
    } catch (e) {}

    const hasMilestones = milestoneList && milestoneList.length > 0;
    const upfrontAmount = hasMilestones ? parseFloat(milestoneList[0].amount) : bidAmount;

    // Check total budget limit
    const contractSumRes = await pool.query(
      "SELECT COALESCE(SUM(budget), 0) as total FROM contracts WHERE job_id = $1 AND status != 'Cancelled'",
      [proposal.job_id]
    );
    const currentCommitted = parseFloat(contractSumRes.rows[0].total || 0);
    const maxBudget = parseFloat(proposal.job_max_budget || proposal.job_budget || 0);
    
    const numFreelancersStr = proposal.num_freelancers || "1 freelancer";
    let limit = 1;
    if (numFreelancersStr.includes("2-3")) {
      limit = 3;
    } else if (numFreelancersStr.includes("2-5")) {
      limit = 5;
    } else if (numFreelancersStr.includes("More than 5") || numFreelancersStr.includes("5+") || numFreelancersStr.includes("many") || numFreelancersStr.includes("4+")) {
      limit = 999;
    } else {
      const match = numFreelancersStr.match(/^(\d+)/);
      if (match) {
        limit = parseInt(match[1]);
      }
    }

    const isMultiHire = limit > 1;
    const isBudgetExceeded = isMultiHire
      ? bidAmount > maxBudget
      : (currentCommitted + bidAmount) > maxBudget;

    if (maxBudget > 0 && isBudgetExceeded) {
      return res.status(400).json({
        message: isMultiHire
          ? `Hiring limit exceeded. Total project budget is $${maxBudget.toLocaleString()} per freelancer, but the candidate's bid of $${bidAmount.toLocaleString()} exceeds this limit.`
          : `Hiring limit exceeded. Total project budget is $${maxBudget.toLocaleString()}, but you have already committed $${currentCommitted.toLocaleString()} to active contracts. Hiring this candidate at $${bidAmount.toLocaleString()} would exceed the budget limit.`
      });
    }

    await processProposalHireTransaction(proposal, upfrontAmount, method);

    // Send notifications and initialize chat
    await handlePostHireNotificationsAndActions({
      proposalId: parseInt(proposal_id),
      bidAmount: upfrontAmount,
      io: req.io
    });

    await checkAndRewardReferrer(userId);
    await checkAndEarnAffiliateCommission(userId);

    return res.status(200).json({
      message: "Payment confirmed. Contract is now active.",
      amount: upfrontAmount,
    });
  } catch (err) {
    console.error("Direct proposal pay error:", err);
    return res.status(500).json({ message: err.message || "Failed to process direct payment." });
  }
};

export const releaseMilestonePayment = async (req, res) => {
  try {
    const clientId = req.user.user_id;
    const milestoneId = parseInt(req.params.id);

    if (!milestoneId || isNaN(milestoneId)) {
      return res.status(400).json({ message: "Invalid milestone ID." });
    }

    // 1. Fetch milestone
    const milestoneRes = await pool.query("SELECT * FROM contract_milestones WHERE milestone_id = $1", [milestoneId]);
    if (milestoneRes.rows.length === 0) {
      return res.status(404).json({ message: "Milestone not found." });
    }
    const milestone = milestoneRes.rows[0];

    // 2. Fetch contract
    const contractRes = await pool.query("SELECT * FROM contracts WHERE contract_id = $1", [milestone.contract_id]);
    if (contractRes.rows.length === 0) {
      return res.status(404).json({ message: "Contract associated with milestone not found." });
    }
    const contract = contractRes.rows[0];

    // 3. Verify client authorization
    if (contract.client_id !== clientId) {
      return res.status(403).json({ message: "Access denied. You do not own this contract." });
    }

    // 4. Verify status
    if (milestone.payment_status === "Paid") {
      return res.status(400).json({ message: "This milestone has already been paid." });
    }

    const milestoneAmount = parseFloat(milestone.amount);

    // 5. Get wallets
    const sysRes = await pool.query("SELECT * FROM wallets WHERE is_system = TRUE");
    const sysWallet = sysRes.rows[0];

    let freelancerWalletRes = await pool.query("SELECT * FROM wallets WHERE user_id = $1", [contract.freelancer_id]);
    let freelancerWallet = freelancerWalletRes.rows[0];
    if (!freelancerWallet) {
      const ins = await pool.query(
        "INSERT INTO wallets (user_id, balance, currency) VALUES ($1, 0.00, 'USD') RETURNING *",
        [contract.freelancer_id]
      );
      freelancerWallet = ins.rows[0];
    }

    // Get client wallet if base milestone or extra revision fee is not funded upfront
    // Get client wallet if the milestone is not funded upfront
    let clientWallet = null;
    const isFundedUpfront = milestone.payment_status === "Funded";
    
    if (!isFundedUpfront) {
      const clientWalletRes = await pool.query("SELECT * FROM wallets WHERE user_id = $1", [contract.client_id]);
      clientWallet = clientWalletRes.rows[0];
      if (!clientWallet) {
        const ins = await pool.query(
          "INSERT INTO wallets (user_id, balance, currency) VALUES ($1, 0.00, 'USD') RETURNING *",
          [contract.client_id]
        );
        clientWallet = ins.rows[0];
      }

      if (parseFloat(clientWallet.balance) < milestoneAmount) {
        return res.status(400).json({
          message: `Insufficient wallet balance. Releasing this milestone requires a payment of $${milestoneAmount.toFixed(2)}, but your wallet only has $${parseFloat(clientWallet.balance).toFixed(2)}. Please add funds first.`
        });
      }
    }

    // 6. Calculate commission fee (standard platform fee)
    let commissionPercent = 0.05; // Default 5%
    const feeRes = await pool.query("SELECT setting_value FROM settings WHERE setting_key = 'platform_fee'");
    if (feeRes.rows.length > 0) {
      let feeVal = feeRes.rows[0].setting_value;
      if (typeof feeVal === "string") {
        try { feeVal = JSON.parse(feeVal); } catch {}
      }
      if (feeVal?.fee) {
        commissionPercent = parseFloat(feeVal.fee) / 100;
      }
    }
    const commissionAmount = milestoneAmount * commissionPercent;
    const freelancerAmount = milestoneAmount - commissionAmount;

    await pool.query("BEGIN");
    try {
      if (isFundedUpfront) {
        // Debit escrow wallet (only debit freelancerAmount so the admin commission remains in the system wallet)
        await pool.query(
          "UPDATE wallets SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = $2",
          [freelancerAmount, sysWallet.wallet_id]
        );
      } else {
        // Debit client wallet for base milestone amount
        await pool.query(
          "UPDATE wallets SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = $2",
          [milestoneAmount, clientWallet.wallet_id]
        );

        // Credit system wallet with commission on the base milestone amount
        await pool.query(
          "UPDATE wallets SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = $2",
          [commissionAmount, sysWallet.wallet_id]
        );

        // Record client-to-system transaction (direct payment/escrow) for base milestone amount
        await pool.query(
          `INSERT INTO wallet_transactions (sender_wallet_id, receiver_wallet_id, amount, type, status, description)
           VALUES ($1, $2, $3, 'Transfer', 'Completed', $4)`,
          [
            clientWallet.wallet_id,
            sysWallet.wallet_id,
            milestoneAmount,
            `Direct payment for milestone: ${milestone.title} (contract: ${contract.title})`
          ]
        );
      }

      // Credit freelancer wallet
      await pool.query(
        "UPDATE wallets SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = $2",
        [freelancerAmount, freelancerWallet.wallet_id]
      );

      // Record escrow-to-freelancer release transaction
      await pool.query(
        `INSERT INTO wallet_transactions (sender_wallet_id, receiver_wallet_id, amount, commission_amount, type, status, description)
         VALUES ($1, $2, $3, $4, 'Milestone_Release', 'Completed', $5)`,
        [
          sysWallet.wallet_id,
          freelancerWallet.wallet_id,
          freelancerAmount,
          commissionAmount,
          `Escrow release for milestone: ${milestone.title} (contract: ${contract.title})`,
        ]
      );

      // Update milestone
      await pool.query(
        "UPDATE contract_milestones SET status = 'Completed', payment_status = 'Paid', updated_at = CURRENT_TIMESTAMP WHERE milestone_id = $1",
        [milestoneId]
      );

      // Calculate new contract progress
      const allMilestones = await pool.query("SELECT * FROM contract_milestones WHERE contract_id = $1", [contract.contract_id]);
      const completedMilestones = allMilestones.rows.filter(m => m.payment_status === "Paid");
      const totalBudget = allMilestones.rows.reduce((sum, m) => sum + parseFloat(m.amount), 0);
      const paidTotal = completedMilestones.reduce((sum, m) => sum + parseFloat(m.amount), 0);
      const newProgress = totalBudget > 0 ? Math.round((paidTotal / totalBudget) * 100) : 0;
      const isFinished = newProgress >= 100;

      await pool.query(
        "UPDATE contracts SET progress = $1, status = $2, completed_at = CASE WHEN $2::varchar = 'Completed' THEN CURRENT_TIMESTAMP ELSE completed_at END, updated_at = CURRENT_TIMESTAMP WHERE contract_id = $3",
        [newProgress, isFinished ? "Completed" : "Work Started", contract.contract_id]
      );

      // If linked to a gig application and is finished, update gig application status to Completed
      if (contract.application_id && isFinished) {
        await pool.query(
          "UPDATE gig_applications SET status = 'Completed', updated_at = CURRENT_TIMESTAMP WHERE application_id = $1",
          [contract.application_id]
        );
      }


      await pool.query("COMMIT");

      // Notify freelancer
      try {
        const { default: Notification } = await import("../models/notificationModel.js");
        const notif = await Notification.create({
          userId: contract.freelancer_id,
          title: "Milestone Payment Released!",
          message: `Client approved and released $${milestoneAmount.toFixed(2)} for milestone: "${milestone.title}".`,
          type: "payment",
          referenceId: contract.contract_id.toString(),
        });
        if (req.io) {
          req.io.to(`user_${contract.freelancer_id}`).emit("new_notification", notif);
        }
      } catch (nErr) {
        console.error("Failed to notify freelancer on milestone release:", nErr);
      }

      return res.status(200).json({
        message: "Milestone payment released successfully.",
        progress: newProgress,
        status: isFinished ? "Completed" : "In Progress"
      });
    } catch (txErr) {
      await pool.query("ROLLBACK");
      throw txErr;
    }
  } catch (err) {
    console.error("Release milestone error:", err);
    return res.status(500).json({ message: err.message || "Failed to release milestone payment." });
  }
};

export const submitMilestoneWork = async (req, res) => {
  try {
    const freelancerId = req.user.user_id;
    const milestoneId = parseInt(req.params.id);
    const { submitted_files } = req.body; // Expecting a JSON string or comma-separated URLs

    if (!milestoneId || isNaN(milestoneId)) {
      return res.status(400).json({ message: "Invalid milestone ID." });
    }

    const milestoneRes = await pool.query("SELECT * FROM contract_milestones WHERE milestone_id = $1", [milestoneId]);
    if (milestoneRes.rows.length === 0) {
      return res.status(404).json({ message: "Milestone not found." });
    }
    const milestone = milestoneRes.rows[0];

    const contractRes = await pool.query("SELECT * FROM contracts WHERE contract_id = $1", [milestone.contract_id]);
    if (contractRes.rows.length === 0) {
      return res.status(404).json({ message: "Contract associated with milestone not found." });
    }
    const contract = contractRes.rows[0];

    if (contract.freelancer_id !== freelancerId) {
      return res.status(403).json({ message: "Access denied. You do not own this contract." });
    }

    const validPaymentStatuses = ["Funded", "Escrowed", "Escrow", "Paid", "Pending"];
    if (!validPaymentStatuses.includes(milestone.payment_status)) {
      return res.status(400).json({ message: "Client has not added funds in escrow for this milestone yet." });
    }

    if (milestone.revision_status === "Awaiting Funding") {
      return res.status(400).json({ message: "You cannot submit deliverables because the client has not funded the proposed revision fee yet." });
    }

    await pool.query(
      "UPDATE contract_milestones SET status = 'Under Review', submitted_files = $1, revision_status = 'None', updated_at = CURRENT_TIMESTAMP WHERE milestone_id = $2",
      [submitted_files || null, milestoneId]
    );

    // Check if all milestones are either Paid or Under Review
    const allMilestonesRes = await pool.query("SELECT * FROM contract_milestones WHERE contract_id = $1", [contract.contract_id]);
    const allMilestones = allMilestonesRes.rows;
    const isAllSubmittedOrPaid = allMilestones.every(m => m.payment_status === "Paid" || m.status === "Under Review" || m.status === "Completed");

    if (isAllSubmittedOrPaid) {
      await pool.query(
        "UPDATE contracts SET status = 'Under Review', progress = 100, submitted_files = $1, submitted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE contract_id = $2",
        [submitted_files ? (typeof submitted_files === 'string' ? submitted_files : JSON.stringify(submitted_files)) : null, contract.contract_id]
      );
    }

    try {
      const { default: Notification } = await import("../models/notificationModel.js");
      const freelancerUserRes = await pool.query("SELECT first_name || ' ' || COALESCE(last_name, '') as name FROM users WHERE user_id = $1", [freelancerId]);
      const freelancerName = freelancerUserRes.rows[0]?.name || "Freelancer";

      await Notification.create({
        userId: contract.client_id,
        title: "Work Submitted for Milestone 🚀",
        message: `Freelancer ${freelancerName} submitted work for milestone "${milestone.title}" (contract: "${contract.title}"). Please review and approve.`,
        type: "contract",
        referenceId: contract.contract_id.toString(),
      });
      if (req.io) {
        const notifData = {
          user_id: contract.client_id,
          title: "Work Submitted for Milestone 🚀",
          message: `Freelancer ${freelancerName} submitted work for milestone "${milestone.title}" (contract: "${contract.title}"). Please review and approve.`,
          type: "contract",
          reference_id: contract.contract_id.toString()
        };
        req.io.to(`user_${contract.client_id}`).emit("new_notification", notifData);
        req.io.emit("new_notification", notifData);
        req.io.emit("notification", notifData);
      }
    } catch (nErr) {
      console.error("Failed to notify client on milestone submit:", nErr);
    }

    return res.status(200).json({
      message: "Milestone work submitted successfully. Awaiting client review."
    });
  } catch (err) {
    console.error("Submit milestone error:", err);
    return res.status(500).json({ message: err.message || "Failed to submit milestone work." });
  }
};

export const rejectMilestoneWork = async (req, res) => {
  try {
    const clientId = req.user.user_id;
    const milestoneId = parseInt(req.params.id);
    const { feedback, submitted_files } = req.body;

    if (!milestoneId || isNaN(milestoneId)) {
      return res.status(400).json({ message: "Invalid milestone ID." });
    }
    if (!feedback || !feedback.trim()) {
      return res.status(400).json({ message: "Revision feedback is required." });
    }

    const milestoneRes = await pool.query("SELECT * FROM contract_milestones WHERE milestone_id = $1", [milestoneId]);
    if (milestoneRes.rows.length === 0) {
      return res.status(404).json({ message: "Milestone not found." });
    }
    const milestone = milestoneRes.rows[0];

    const contractRes = await pool.query("SELECT * FROM contracts WHERE contract_id = $1", [milestone.contract_id]);
    if (contractRes.rows.length === 0) {
      return res.status(404).json({ message: "Contract associated with milestone not found." });
    }
    const contract = contractRes.rows[0];

    if (contract.client_id !== clientId) {
      return res.status(403).json({ message: "Access denied. You do not own this contract." });
    }

    let existingHistory = [];
    const currentFeedback = milestone.revision_feedback;
    if (currentFeedback) {
      if (currentFeedback.trim().startsWith("[")) {
        try {
          existingHistory = JSON.parse(currentFeedback);
        } catch (e) {
          existingHistory = [{
            revision_number: 1,
            feedback: currentFeedback,
            files: milestone.revision_submitted_files ? JSON.parse(milestone.revision_submitted_files) : [],
            timestamp: milestone.updated_at || new Date().toISOString()
          }];
        }
      } else {
        let filesArr = [];
        if (milestone.revision_submitted_files) {
          try {
            filesArr = JSON.parse(milestone.revision_submitted_files);
          } catch (e) {}
        }
        existingHistory = [{
          revision_number: 1,
          feedback: currentFeedback,
          files: filesArr,
          timestamp: milestone.updated_at || new Date().toISOString()
        }];
      }
    }

    const newRevisionNumber = existingHistory.length + 1;
    let newFilesArr = [];
    if (submitted_files) {
      try {
        newFilesArr = typeof submitted_files === "string" ? JSON.parse(submitted_files) : submitted_files;
      } catch (e) {}
    }

    const newRevisionObj = {
      revision_number: newRevisionNumber,
      feedback: feedback.trim(),
      files: newFilesArr,
      timestamp: new Date().toISOString()
    };

    existingHistory.push(newRevisionObj);
    const updatedFeedbackJson = JSON.stringify(existingHistory);

    await pool.query(
      "UPDATE contract_milestones SET status = 'Revision Requested', feedback = $1, revision_feedback = $2, revision_submitted_files = $3, revision_status = 'Pending Acceptance', updated_at = CURRENT_TIMESTAMP WHERE milestone_id = $4",
      [feedback.trim(), updatedFeedbackJson, submitted_files || null, milestoneId]
    );

    // Calculate new contract progress and revert status to Work Started/In Progress
    const allMilestones = await pool.query("SELECT * FROM contract_milestones WHERE contract_id = $1", [contract.contract_id]);
    const completedMilestones = allMilestones.rows.filter(m => m.payment_status === "Paid");
    const totalBudget = allMilestones.rows.reduce((sum, m) => sum + parseFloat(m.amount), 0);
    const paidTotal = completedMilestones.reduce((sum, m) => sum + parseFloat(m.amount), 0);
    const newProgress = totalBudget > 0 ? Math.round((paidTotal / totalBudget) * 100) : 0;

    await pool.query(
      "UPDATE contracts SET status = 'Work Started', progress = $1, updated_at = CURRENT_TIMESTAMP WHERE contract_id = $2",
      [newProgress, contract.contract_id]
    );

    try {
      const { default: Notification } = await import("../models/notificationModel.js");
      const clientUserRes = await pool.query("SELECT first_name || ' ' || COALESCE(last_name, '') as name FROM users WHERE user_id = $1", [clientId]);
      const clientName = clientUserRes.rows[0]?.name || "Client";

      const notif = await Notification.create({
        userId: contract.freelancer_id,
        title: "Revision Requested for Milestone ⚠️",
        message: `Client ${clientName} requested revisions for milestone "${milestone.title}". Feedback: "${feedback.trim()}"`,
        type: "contract",
        referenceId: contract.contract_id.toString(),
      });
      if (req.io) {
        req.io.to(`user_${contract.freelancer_id}`).emit("new_notification", notif);
      }
    } catch (nErr) {
      console.error("Failed to notify freelancer on milestone revision request:", nErr);
    }

    return res.status(200).json({
      message: "Milestone revision requested successfully."
    });
  } catch (err) {
    console.error("Reject milestone error:", err);
    return res.status(500).json({ message: err.message || "Failed to request milestone revision." });
  }
};

export const cancelContractAndRefund = async (req, res) => {
  try {
    const clientId = req.user.user_id;
    const contractId = parseInt(req.params.id);

    if (!contractId || isNaN(contractId)) {
      return res.status(400).json({ message: "Invalid contract ID." });
    }

    // 1. Fetch contract
    const contractRes = await pool.query("SELECT * FROM contracts WHERE contract_id = $1", [contractId]);
    if (contractRes.rows.length === 0) {
      return res.status(404).json({ message: "Contract not found." });
    }
    const contract = contractRes.rows[0];

    // 2. Verify client ownership
    if (contract.client_id !== clientId) {
      return res.status(403).json({ message: "Access denied. You do not own this contract." });
    }

    // 3. Verify status - cancellation and refund is only allowed before freelancer starts work ('Hired' status)
    if (contract.status !== "Hired") {
      return res.status(400).json({ message: `Cancellation and refund is only allowed before the freelancer starts work (Contract status is '${contract.status}', but must be 'Hired').` });
    }

    // 4. Check if any milestones have been paid
    const milestonesRes = await pool.query("SELECT * FROM contract_milestones WHERE contract_id = $1", [contractId]);
    const paidMilestones = milestonesRes.rows.filter(m => m.payment_status === "Paid");
    if (paidMilestones.length > 0) {
      return res.status(400).json({ message: "Cancellation and refund is not allowed because at least one milestone has already been completed and paid." });
    }

    // Calculate actual funded amount to refund
    const fundedRes = await pool.query(
      `SELECT COALESCE(SUM(CAST(amount AS numeric)), 0) as refund_amount 
       FROM contract_milestones 
       WHERE contract_id = $1 
         AND payment_status IN ('Funded', 'Escrowed', 'Escrow')`,
      [contractId]
    );
    const refundAmount = parseFloat(fundedRes.rows[0]?.refund_amount || 0);

    // 5. Get wallets
    const sysRes = await pool.query("SELECT * FROM wallets WHERE is_system = TRUE");
    const sysWallet = sysRes.rows[0];

    let clientWalletRes = await pool.query("SELECT * FROM wallets WHERE user_id = $1", [clientId]);
    let clientWallet = clientWalletRes.rows[0];
    if (!clientWallet) {
      const ins = await pool.query(
        "INSERT INTO wallets (user_id, balance, currency) VALUES ($1, 0.00, 'USD') RETURNING *",
        [clientId]
      );
      clientWallet = ins.rows[0];
    }

    // 6. Process refund
    await pool.query("BEGIN");
    try {
      if (refundAmount > 0) {
        // Debit system escrow
        await pool.query(
          "UPDATE wallets SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = $2",
          [refundAmount, sysWallet.wallet_id]
        );

        // Credit client wallet
        await pool.query(
          "UPDATE wallets SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = $2",
          [refundAmount, clientWallet.wallet_id]
        );

        // Record refund transaction
        await pool.query(
          `INSERT INTO wallet_transactions (sender_wallet_id, receiver_wallet_id, amount, type, status, description)
           VALUES ($1, $2, $3, 'Transfer', 'Completed', $4)`,
          [
            sysWallet.wallet_id,
            clientWallet.wallet_id,
            refundAmount,
            `Escrow refund due to contract cancellation: ${contract.title}`,
          ]
        );
      }

      // Update contract status
      await pool.query(
        "UPDATE contracts SET status = 'Cancelled', progress = 0, cancelled_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE contract_id = $1",
        [contractId]
      );

      // Update non-completed/non-paid milestones to Cancelled/Refunded
      await pool.query(
        `UPDATE contract_milestones 
         SET status = 'Cancelled', 
             payment_status = CASE WHEN payment_status IN ('Funded', 'Escrowed', 'Escrow') THEN 'Refunded' ELSE payment_status END, 
             updated_at = CURRENT_TIMESTAMP 
         WHERE contract_id = $1 AND status != 'Completed' AND payment_status != 'Paid'`,
        [contractId]
      );
      if (contract.application_id) {
        // This is a gig order contract! Update the gig application status to Cancelled
        await pool.query(
          "UPDATE gig_applications SET status = 'Cancelled', updated_at = CURRENT_TIMESTAMP WHERE application_id = $1",
          [contract.application_id]
        );
      } else {
        // This is a job contract! Update the proposal status to Cancelled
        const proposalIdToCancel = (await pool.query(
          "SELECT proposal_id FROM proposals WHERE job_id = $1 AND freelancer_id = $2 AND status = 'Accepted'",
          [contract.job_id, contract.freelancer_id]
        )).rows[0]?.proposal_id;

        if (proposalIdToCancel) {
          await pool.query(
            "UPDATE proposals SET status = 'Cancelled', updated_at = CURRENT_TIMESTAMP WHERE proposal_id = $1",
            [proposalIdToCancel]
          );
        }
      }

      await pool.query("COMMIT");

      // Re-evaluate job slot count so a multi-hire job re-opens if under limit
      await recalculateJobStatus(contract.job_id);

      // Notify freelancer
      try {
        const { default: Notification } = await import("../models/notificationModel.js");
        const notif = await Notification.create({
          userId: contract.freelancer_id,
          title: "Contract Cancelled",
          message: `Client cancelled the contract "${contract.title}" and requested a full refund.`,
          type: "system",
          referenceId: contractId.toString(),
        });
        if (req.io) {
          req.io.to(`user_${contract.freelancer_id}`).emit("new_notification", notif);
          if (proposalIdToCancel) {
            req.io.to(`user_${contract.freelancer_id}`).emit("proposal_status_updated", {
              proposal_id: proposalIdToCancel,
              status: "Cancelled"
            });
          }
        }
      } catch (nErr) {
        console.error("Failed to notify freelancer on contract refund:", nErr);
      }

      return res.status(200).json({
        message: "Contract cancelled and full escrow amount refunded successfully.",
      });
    } catch (txErr) {
      await pool.query("ROLLBACK");
      throw txErr;
    }
  } catch (err) {
    console.error("Cancel and refund contract error:", err);
    return res.status(500).json({ message: err.message || "Failed to cancel contract and refund escrow." });
  }
};

export const freelancerCancelContractAndRefund = async (req, res) => {
  try {
    const freelancerId = req.user.user_id;
    const contractId = parseInt(req.params.id);

    if (!contractId || isNaN(contractId)) {
      return res.status(400).json({ message: "Invalid contract ID." });
    }

    // 1. Fetch contract
    const contractRes = await pool.query("SELECT * FROM contracts WHERE contract_id = $1", [contractId]);
    if (contractRes.rows.length === 0) {
      return res.status(404).json({ message: "Contract not found." });
    }
    const contract = contractRes.rows[0];

    // 2. Verify freelancer ownership
    if (contract.freelancer_id !== freelancerId) {
      return res.status(403).json({ message: "Access denied. Only the assigned freelancer can cancel this work." });
    }

    // 3. Verify status - cancellation and refund is allowed on active/started contracts
    const allowedStatuses = ["Hired", "Work Started", "In Progress", "Work Completed", "Under Review"];
    if (!allowedStatuses.includes(contract.status)) {
      return res.status(400).json({ message: `Cancellation is only allowed on active contracts (current status: '${contract.status}').` });
    }

    // Calculate actual funded amount to refund
    const fundedRes = await pool.query(
      `SELECT COALESCE(SUM(CAST(amount AS numeric)), 0) as refund_amount 
       FROM contract_milestones 
       WHERE contract_id = $1 
         AND payment_status IN ('Funded', 'Escrowed', 'Escrow')`,
      [contractId]
    );
    const refundAmount = parseFloat(fundedRes.rows[0]?.refund_amount || 0);

    // 4. Get wallets
    const sysRes = await pool.query("SELECT * FROM wallets WHERE is_system = TRUE");
    const sysWallet = sysRes.rows[0];

    let clientWalletRes = await pool.query("SELECT * FROM wallets WHERE user_id = $1", [contract.client_id]);
    let clientWallet = clientWalletRes.rows[0];
    if (!clientWallet) {
      const ins = await pool.query(
        "INSERT INTO wallets (user_id, balance, currency) VALUES ($1, 0.00, 'USD') RETURNING *",
        [contract.client_id]
      );
      clientWallet = ins.rows[0];
    }

    // 5. Process refund
    await pool.query("BEGIN");
    try {
      if (refundAmount > 0) {
        // Debit system escrow
        await pool.query(
          "UPDATE wallets SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = $2",
          [refundAmount, sysWallet.wallet_id]
        );

        // Credit client wallet
        await pool.query(
          "UPDATE wallets SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = $2",
          [refundAmount, clientWallet.wallet_id]
        );

        // Record refund transaction
        await pool.query(
          `INSERT INTO wallet_transactions (sender_wallet_id, receiver_wallet_id, amount, type, status, description)
           VALUES ($1, $2, $3, 'Transfer', 'Completed', $4)`,
          [
            sysWallet.wallet_id,
            clientWallet.wallet_id,
            refundAmount,
            `Escrow refund due to freelancer cancelling work: ${contract.title}`,
          ]
        );
      }

      // Update contract status
      await pool.query(
        "UPDATE contracts SET status = 'Cancelled', progress = 0, cancelled_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE contract_id = $1",
        [contractId]
      );

      // Update non-completed/non-paid milestones to Cancelled/Refunded
      await pool.query(
        `UPDATE contract_milestones 
         SET status = 'Cancelled', 
             payment_status = CASE WHEN payment_status IN ('Funded', 'Escrowed', 'Escrow') THEN 'Refunded' ELSE payment_status END, 
             updated_at = CURRENT_TIMESTAMP 
         WHERE contract_id = $1 AND status != 'Completed' AND payment_status != 'Paid'`,
        [contractId]
      );

      if (contract.application_id) {
        // This is a gig order contract! Update the gig application status to Cancelled
        await pool.query(
          "UPDATE gig_applications SET status = 'Cancelled', updated_at = CURRENT_TIMESTAMP WHERE application_id = $1",
          [contract.application_id]
        );
      } else {
        // This is a job contract! Update the proposal status to Cancelled
        const proposalIdToCancel = (await pool.query(
          "SELECT proposal_id FROM proposals WHERE job_id = $1 AND freelancer_id = $2 AND status = 'Accepted'",
          [contract.job_id, contract.freelancer_id]
        )).rows[0]?.proposal_id;

        if (proposalIdToCancel) {
          await pool.query(
            "UPDATE proposals SET status = 'Cancelled', updated_at = CURRENT_TIMESTAMP WHERE proposal_id = $1",
            [proposalIdToCancel]
          );
        }
      }

      await pool.query("COMMIT");

      // Re-evaluate job slot count so a multi-hire job re-opens if under limit
      await recalculateJobStatus(contract.job_id);

      // Notify client
      try {
        const { default: Notification } = await import("../models/notificationModel.js");
        const notif = await Notification.create({
          userId: contract.client_id,
          title: "Project Cancelled by Freelancer",
          message: `Freelancer cancelled the contract "${contract.title}". Escrow funds have been refunded to your wallet.`,
          type: "system",
          referenceId: contractId.toString(),
        });
        if (req.io) {
          req.io.to(`user_${contract.client_id}`).emit("new_notification", notif);
        }
      } catch (nErr) {
        console.error("Failed to notify client on freelancer cancellation:", nErr);
      }

      return res.status(200).json({
        message: "Work cancelled successfully and escrow refunded to the client.",
      });
    } catch (txErr) {
      await pool.query("ROLLBACK");
      throw txErr;
    }
  } catch (err) {
    console.error("Freelancer cancel contract error:", err);
    return res.status(500).json({ message: err.message || "Failed to cancel contract." });
  }
};

export const startWorkContract = async (req, res) => {
  try {
    const freelancerId = req.user.user_id;
    const contractId = parseInt(req.params.id);

    if (!contractId || isNaN(contractId)) {
      return res.status(400).json({ message: "Invalid contract ID." });
    }

    const contractRes = await pool.query("SELECT * FROM contracts WHERE contract_id = $1", [contractId]);
    if (contractRes.rows.length === 0) {
      return res.status(404).json({ message: "Contract not found." });
    }
    const contract = contractRes.rows[0];

    if (contract.freelancer_id !== freelancerId) {
      return res.status(403).json({ message: "Access denied. Only the hired freelancer can start work." });
    }

    if (contract.status !== "Hired") {
      return res.status(400).json({ message: `Cannot start work for contract in status: ${contract.status}` });
    }

    await pool.query(
      "UPDATE contracts SET status = 'Work Started', work_started_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE contract_id = $1",
      [contractId]
    );

    // Notify client
    try {
      const { default: Notification } = await import("../models/notificationModel.js");
      const notif = await Notification.create({
        userId: contract.client_id,
        title: "Work Started! 🚀",
        message: `Freelancer started working on your contract: "${contract.title}".`,
        type: "system",
        referenceId: contractId.toString(),
      });
      if (req.io) {
        req.io.to(`user_${contract.client_id}`).emit("new_notification", notif);
      }
    } catch (nErr) {
      console.error("Failed to notify client on start work:", nErr);
    }

    return res.status(200).json({ message: "Contract status updated to Work Started successfully." });
  } catch (err) {
    console.error("Start work error:", err);
    return res.status(500).json({ message: err.message || "Failed to update contract status." });
  }
};

export const createStripeTimecardSession = async (req, res) => {
  try {
    const { contract_id, timecard_id, redirect_path } = req.body;
    const path = redirect_path || "/dashboard/proposals";
    const userId = req.user.user_id;

    // Verify contract owned by client
    const checkRes = await pool.query(
      "SELECT * FROM contracts WHERE contract_id = $1 AND client_id = $2",
      [parseInt(contract_id), userId]
    );
    const contract = checkRes.rows[0];
    if (!contract) {
      return res.status(403).json({ message: "Contract not found or not owned by you." });
    }

    // Fetch timecard
    const tcRes = await pool.query(
      "SELECT * FROM contract_timecards WHERE timecard_id = $1 AND contract_id = $2",
      [parseInt(timecard_id), contract.contract_id]
    );
    const timecard = tcRes.rows[0];
    if (!timecard) {
      return res.status(404).json({ message: "Timecard not found." });
    }
    if (timecard.status !== "Requested") {
      return res.status(400).json({ message: `Timecard status must be 'Requested'. Current status: ${timecard.status}` });
    }

    const amount = parseFloat(timecard.amount);
    const escrowAvailable = parseFloat(contract.budget || 0);
    const extraPayment = Math.max(0, amount - escrowAvailable);

    if (extraPayment <= 0) {
      return res.status(400).json({ message: "Timecard is fully covered by escrow. Please approve directly." });
    }

    const amountCents = Math.round(extraPayment * 100);

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
      return res.status(400).json({ message: "Stripe is not configured. Please add Stripe Secret Key in Admin Payment Settings." });
    }

    const localStripe = new Stripe(stripeSecretKey);
    const session = await localStripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Timecard Extra Payment: ${contract.title}`,
              description: `Timecard #${timecard_id} (${timecard.hours}h ${timecard.minutes}m worked)`,
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${FRONTEND_URL}${path}?project_id=${contract.job_id}&stripe_timecard_success=1&contract_id=${contract_id}&timecard_id=${timecard_id}&amount=${extraPayment}`,
      cancel_url:  `${FRONTEND_URL}${path}?project_id=${contract.job_id}&stripe_timecard_cancel=1&contract_id=${contract_id}&timecard_id=${timecard_id}`,
      metadata: {
        contract_id: contract_id.toString(),
        timecard_id: timecard_id.toString(),
        user_id: userId.toString(),
        amount_usd: extraPayment.toString(),
        type: "timecard_payment",
      },
    });

    return res.status(200).json({ url: session.url, session_id: session.id });
  } catch (err) {
    console.error("Stripe session creation error for timecard:", err);
    return res.status(500).json({ message: err.message || "Failed to initiate Stripe session." });
  }
};

export const confirmStripeTimecardPayment = async (req, res) => {
  try {
    const { contract_id, timecard_id, amount } = req.body;
    const userId = req.user.user_id;

    // Verify contract and timecard
    const checkRes = await pool.query(
      "SELECT * FROM contracts WHERE contract_id = $1 AND client_id = $2",
      [parseInt(contract_id), userId]
    );
    const contract = checkRes.rows[0];
    if (!contract) {
      return res.status(403).json({ message: "Contract not found or not owned by you." });
    }

    const tcRes = await pool.query(
      "SELECT * FROM contract_timecards WHERE timecard_id = $1 AND contract_id = $2",
      [parseInt(timecard_id), contract.contract_id]
    );
    const timecard = tcRes.rows[0];
    if (!timecard) {
      return res.status(404).json({ message: "Timecard not found." });
    }
    if (timecard.status !== "Requested") {
      // If already Paid, return success early (idempotent)
      if (timecard.status === "Paid") {
        return res.status(200).json({ message: "Timecard already paid." });
      }
      return res.status(400).json({ message: `Timecard status must be 'Requested'. Current status: ${timecard.status}` });
    }

    // 1. Credit client's wallet with the paid amount first
    const clientWalletRes = await pool.query("SELECT * FROM wallets WHERE user_id = $1", [contract.client_id]);
    let clientWallet = clientWalletRes.rows[0];
    if (!clientWallet) {
      const insertWallet = "INSERT INTO wallets (user_id, balance, currency) VALUES ($1, 0.00, 'USD') RETURNING *";
      const insertRes = await pool.query(insertWallet, [contract.client_id]);
      clientWallet = insertRes.rows[0];
    }

    await pool.query(
      "UPDATE wallets SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = $2",
      [parseFloat(amount), clientWallet.wallet_id]
    );

    // Record the Stripe load transaction to client's wallet
    await pool.query(
      `INSERT INTO wallet_transactions (sender_wallet_id, receiver_wallet_id, amount, type, status, description)
       VALUES (null, $1, $2, 'Load', 'Completed', $3)`,
      [clientWallet.wallet_id, parseFloat(amount), `Stripe load for timecard extra payment on contract: ${contract.title}`]
    );

    // 2. Invoke the timecard approval logic!
    const { approveTimecard } = await import("./freelancerController.js");
    const simReq = {
      params: { id: contract_id, timecard_id },
      user: { user_id: userId }
    };
    let responseStatus = 200;
    let responseData = {};
    const simRes = {
      status: (code) => {
        responseStatus = code;
        return simRes;
      },
      json: (data) => {
        responseData = data;
        return simRes;
      }
    };

    await approveTimecard(simReq, simRes);

    if (responseStatus === 200) {
      await checkAndRewardReferrer(userId);
      await checkAndEarnAffiliateCommission(userId);
    }

    return res.status(responseStatus).json(responseData);
  } catch (err) {
    console.error("Confirm Stripe timecard payment error:", err);
    return res.status(500).json({ message: err.message || "Failed to confirm Stripe timecard payment." });
  }
};

export const payTimecardDirectly = async (req, res) => {
  try {
    const { contract_id, timecard_id, method } = req.body;
    const userId = req.user.user_id;

    // Verify contract and timecard
    const checkRes = await pool.query(
      "SELECT * FROM contracts WHERE contract_id = $1 AND client_id = $2",
      [parseInt(contract_id), userId]
    );
    const contract = checkRes.rows[0];
    if (!contract) {
      return res.status(403).json({ message: "Contract not found or not owned by you." });
    }

    const tcRes = await pool.query(
      "SELECT * FROM contract_timecards WHERE timecard_id = $1 AND contract_id = $2",
      [parseInt(timecard_id), contract.contract_id]
    );
    const timecard = tcRes.rows[0];
    if (!timecard) {
      return res.status(404).json({ message: "Timecard not found." });
    }
    if (timecard.status !== "Requested") {
      return res.status(400).json({ message: `Timecard status must be 'Requested'. Current status: ${timecard.status}` });
    }

    const amount = parseFloat(timecard.amount);
    const escrowAvailable = parseFloat(contract.budget || 0);
    const extraPayment = Math.max(0, amount - escrowAvailable);

    if (method === "paypal") {
      // Simulate adding the extra payment to client's wallet
      const clientWalletRes = await pool.query("SELECT * FROM wallets WHERE user_id = $1", [contract.client_id]);
      let clientWallet = clientWalletRes.rows[0];
      if (!clientWallet) {
        const insertWallet = "INSERT INTO wallets (user_id, balance, currency) VALUES ($1, 0.00, 'USD') RETURNING *";
        const insertRes = await pool.query(insertWallet, [contract.client_id]);
        clientWallet = insertRes.rows[0];
      }

      await pool.query(
        "UPDATE wallets SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = $2",
        [extraPayment, clientWallet.wallet_id]
      );

      // Record transaction log for PayPal load
      await pool.query(
        `INSERT INTO wallet_transactions (sender_wallet_id, receiver_wallet_id, amount, type, status, description)
         VALUES (null, $1, $2, 'Load', 'Completed', $3)`,
        [clientWallet.wallet_id, extraPayment, `PayPal simulated load for timecard extra payment on contract: ${contract.title}`]
      );
    }

    // Invoke approval
    const { approveTimecard } = await import("./freelancerController.js");
    const simReq = {
      params: { id: contract_id, timecard_id },
      user: { user_id: userId }
    };
    let responseStatus = 200;
    let responseData = {};
    const simRes = {
      status: (code) => {
        responseStatus = code;
        return simRes;
      },
      json: (data) => {
        responseData = data;
        return simRes;
      }
    };

    await approveTimecard(simReq, simRes);

    if (responseStatus === 200) {
      await checkAndRewardReferrer(userId);
      await checkAndEarnAffiliateCommission(userId);
    }

    return res.status(responseStatus).json(responseData);
  } catch (err) {
    console.error("Pay timecard directly error:", err);
    return res.status(500).json({ message: err.message || "Failed to process timecard payment." });
  }
};

export const acceptRevisionRequest = async (req, res) => {
  try {
    const freelancerId = req.user.user_id;
    const milestoneId = parseInt(req.params.id);
    const { extra_fee } = req.body; // optional extra fee proposed by freelancer

    if (!milestoneId || isNaN(milestoneId)) {
      return res.status(400).json({ message: "Invalid milestone ID." });
    }

    const milestoneRes = await pool.query("SELECT * FROM contract_milestones WHERE milestone_id = $1", [milestoneId]);
    if (milestoneRes.rows.length === 0) {
      return res.status(404).json({ message: "Milestone not found." });
    }
    const milestone = milestoneRes.rows[0];

    const contractRes = await pool.query("SELECT * FROM contracts WHERE contract_id = $1", [milestone.contract_id]);
    if (contractRes.rows.length === 0) {
      return res.status(404).json({ message: "Contract associated with milestone not found." });
    }
    const contract = contractRes.rows[0];

    if (contract.freelancer_id !== freelancerId) {
      return res.status(403).json({ message: "Access denied. You do not own this contract." });
    }

    if (milestone.revision_status !== "Pending Acceptance") {
      return res.status(400).json({ message: "This revision request has already been accepted or handled." });
    }

    const currentCount = parseInt(milestone.revision_count || "0");
    const limit = parseInt(contract.revisions_limit || "3");
    const fee = parseFloat(extra_fee || "0");

    if (currentCount < limit && fee <= 0) {
      // Free/Within Limit revision: Start immediately
      await pool.query(
        "UPDATE contract_milestones SET revision_status = 'In Progress', status = 'Revision Requested', revision_count = COALESCE(revision_count, 0) + 1, updated_at = CURRENT_TIMESTAMP WHERE milestone_id = $1",
        [milestoneId]
      );
      
      // Notify client
      try {
        const { default: Notification } = await import("../models/notificationModel.js");
        const notif = await Notification.create({
          userId: contract.client_id,
          title: "Revision Accepted (Free)!",
          message: `Freelancer started work on the revision for milestone "${milestone.title}".`,
          type: "contract",
          referenceId: contract.contract_id.toString(),
        });
        if (req.io) {
          req.io.to(`user_${contract.client_id}`).emit("new_notification", notif);
        }
      } catch {}

      return res.status(200).json({
        message: "Revision accepted successfully.",
        revision_status: "In Progress"
      });
    } else {
      // Over limit and fee specified: Awaiting funding
      await pool.query(
        "UPDATE contract_milestones SET revision_status = 'Awaiting Funding', extra_revision_fee = $1, updated_at = CURRENT_TIMESTAMP WHERE milestone_id = $2",
        [fee, milestoneId]
      );

      // Notify client
      try {
        const { default: Notification } = await import("../models/notificationModel.js");
        const notif = await Notification.create({
          userId: contract.client_id,
          title: "Extra Revision Fee Proposed",
          message: `Freelancer has accepted the revision for milestone "${milestone.title}" but proposed an extra fee of $${fee.toFixed(2)} (limit reached).`,
          type: "contract",
          referenceId: contract.contract_id.toString(),
        });
        if (req.io) {
          req.io.to(`user_${contract.client_id}`).emit("new_notification", notif);
        }
      } catch {}

      return res.status(200).json({
        message: `Proposed extra revision fee of $${fee.toFixed(2)} to client.`,
        revision_status: "Awaiting Funding"
      });
    }
  } catch (err) {
    console.error("Accept revision error:", err);
    return res.status(500).json({ message: err.message || "Failed to accept revision request." });
  }
};

export const fundExtraRevision = async (req, res) => {
  try {
    const clientId = req.user.user_id;
    const milestoneId = parseInt(req.params.id);

    if (!milestoneId || isNaN(milestoneId)) {
      return res.status(400).json({ message: "Invalid milestone ID." });
    }

    const milestoneRes = await pool.query("SELECT * FROM contract_milestones WHERE milestone_id = $1", [milestoneId]);
    if (milestoneRes.rows.length === 0) {
      return res.status(404).json({ message: "Milestone not found." });
    }
    const milestone = milestoneRes.rows[0];

    const contractRes = await pool.query("SELECT * FROM contracts WHERE contract_id = $1", [milestone.contract_id]);
    if (contractRes.rows.length === 0) {
      return res.status(404).json({ message: "Contract associated with milestone not found." });
    }
    const contract = contractRes.rows[0];

    if (contract.client_id !== clientId) {
      return res.status(403).json({ message: "Access denied. You do not own this contract." });
    }

    if (milestone.revision_status !== "Awaiting Funding") {
      return res.status(400).json({ message: "This revision fee has already been funded or is not pending." });
    }

    const fee = parseFloat(milestone.extra_revision_fee || "0");
    if (fee <= 0) {
      return res.status(400).json({ message: "No extra revision fee is pending for this milestone." });
    }

    // Process wallet payment from client wallet to system wallet (escrow)
    const clientWalletRes = await pool.query("SELECT * FROM wallets WHERE user_id = $1", [clientId]);
    const clientWallet = clientWalletRes.rows[0];

    if (!clientWallet || parseFloat(clientWallet.balance) < fee) {
      return res.status(400).json({
        message: `Insufficient wallet balance. Funding requires $${fee.toFixed(2)}, but you only have $${parseFloat(clientWallet?.balance || "0").toFixed(2)}.`
      });
    }

    const sysRes = await pool.query("SELECT * FROM wallets WHERE is_system = TRUE");
    const sysWallet = sysRes.rows[0];

    await pool.query("BEGIN");
    try {
      // Debit client
      await pool.query(
        "UPDATE wallets SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = $2",
        [fee, clientWallet.wallet_id]
      );

      // Get freelancer's wallet
      let freelancerWalletRes = await pool.query("SELECT * FROM wallets WHERE user_id = $1", [contract.freelancer_id]);
      let freelancerWallet = freelancerWalletRes.rows[0];
      if (!freelancerWallet) {
        const ins = await pool.query(
          "INSERT INTO wallets (user_id, balance, currency) VALUES ($1, 0.00, 'USD') RETURNING *",
          [contract.freelancer_id]
        );
        freelancerWallet = ins.rows[0];
      }

      // Calculate commission
      let commissionPercent = 0.05;
      const feeRes = await pool.query("SELECT setting_value FROM settings WHERE setting_key = 'platform_fee'");
      if (feeRes.rows.length > 0) {
        let feeVal = feeRes.rows[0].setting_value;
        if (typeof feeVal === "string") {
          try { feeVal = JSON.parse(feeVal); } catch {}
        }
        if (feeVal?.fee) {
          commissionPercent = parseFloat(feeVal.fee) / 100;
        }
      }

      const commissionAmount = fee * commissionPercent;
      const freelancerAmount = fee - commissionAmount;

      // Credit freelancer wallet
      await pool.query(
        "UPDATE wallets SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = $2",
        [freelancerAmount, freelancerWallet.wallet_id]
      );

      // Credit system admin wallet
      await pool.query(
        "UPDATE wallets SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = $2",
        [commissionAmount, sysWallet.wallet_id]
      );

      // Record transaction
      await pool.query(
        `INSERT INTO wallet_transactions (sender_wallet_id, receiver_wallet_id, amount, commission_amount, type, status, description)
         VALUES ($1, $2, $3, $4, 'Revision_Direct_Payment', 'Completed', $5)`,
        [
          clientWallet.wallet_id,
          freelancerWallet.wallet_id,
          freelancerAmount,
          commissionAmount,
          `Direct payment for revision fee on milestone: ${milestone.title} (contract: ${contract.title})`
        ]
      );

      // Update milestone status to In Progress and increment revision_count
      await pool.query(
        "UPDATE contract_milestones SET revision_status = 'In Progress', status = 'Revision Requested', revision_count = COALESCE(revision_count, 0) + 1, updated_at = CURRENT_TIMESTAMP WHERE milestone_id = $1",
        [milestoneId]
      );

      await pool.query("COMMIT");

      // Notify freelancer
      try {
        const { default: Notification } = await import("../models/notificationModel.js");
        const notif = await Notification.create({
          userId: contract.freelancer_id,
          title: "Extra Revision Funded! 💰",
          message: `Client funded the extra revision fee of $${fee.toFixed(2)} for milestone "${milestone.title}". Work is started.`,
          type: "contract",
          referenceId: contract.contract_id.toString(),
        });
        if (req.io) {
          req.io.to(`user_${contract.freelancer_id}`).emit("new_notification", notif);
        }
      } catch {}

      return res.status(200).json({
        message: "Extra revision funded successfully. Work started.",
        revision_status: "In Progress"
      });
    } catch (txErr) {
      await pool.query("ROLLBACK");
      throw txErr;
    }
  } catch (err) {
    console.error("Fund extra revision error:", err);
    return res.status(500).json({ message: err.message || "Failed to fund extra revision." });
  }
};

export const rejectRevisionProposal = async (req, res) => {
  try {
    const clientId = req.user.user_id;
    const milestoneId = parseInt(req.params.id);

    if (!milestoneId || isNaN(milestoneId)) {
      return res.status(400).json({ message: "Invalid milestone ID." });
    }

    const milestoneRes = await pool.query("SELECT * FROM contract_milestones WHERE milestone_id = $1", [milestoneId]);
    if (milestoneRes.rows.length === 0) {
      return res.status(404).json({ message: "Milestone not found." });
    }
    const milestone = milestoneRes.rows[0];

    const contractRes = await pool.query("SELECT * FROM contracts WHERE contract_id = $1", [milestone.contract_id]);
    if (contractRes.rows.length === 0) {
      return res.status(404).json({ message: "Contract associated with milestone not found." });
    }
    const contract = contractRes.rows[0];

    if (contract.client_id !== clientId) {
      return res.status(403).json({ message: "Access denied. You do not own this contract." });
    }

    if (milestone.revision_status !== "Awaiting Funding") {
      return res.status(400).json({ message: "No active revision fee proposal is pending rejection." });
    }

    // Reset status back to Pending Acceptance and clear fee
    await pool.query(
      "UPDATE contract_milestones SET revision_status = 'Pending Acceptance', extra_revision_fee = 0.00, updated_at = CURRENT_TIMESTAMP WHERE milestone_id = $1",
      [milestoneId]
    );

    // Notify freelancer
    try {
      const { default: Notification } = await import("../models/notificationModel.js");
      const notif = await Notification.create({
        userId: contract.freelancer_id,
        title: "Revision Fee Declined ❌",
        message: `Client declined the extra fee proposal of $${parseFloat(milestone.extra_revision_fee).toFixed(2)} for milestone "${milestone.title}". Please accept for free or propose a new fee.`,
        type: "contract",
        referenceId: contract.contract_id.toString(),
      });
      if (req.io) {
        req.io.to(`user_${contract.freelancer_id}`).emit("new_notification", notif);
      }
    } catch {}

    return res.status(200).json({
      message: "Revision fee proposal declined successfully.",
      revision_status: "Pending Acceptance"
    });
  } catch (err) {
    console.error("Reject revision proposal error:", err);
    return res.status(500).json({ message: err.message || "Failed to decline revision proposal." });
  }
};

export const fundMilestone = async (req, res) => {
  try {
    const clientId = req.user.user_id;
    const milestoneId = parseInt(req.params.id);

    if (!milestoneId || isNaN(milestoneId)) {
      return res.status(400).json({ message: "Invalid milestone ID." });
    }

    const milestoneRes = await pool.query("SELECT * FROM contract_milestones WHERE milestone_id = $1", [milestoneId]);
    if (milestoneRes.rows.length === 0) {
      return res.status(404).json({ message: "Milestone not found." });
    }
    const milestone = milestoneRes.rows[0];

    const contractRes = await pool.query("SELECT * FROM contracts WHERE contract_id = $1", [milestone.contract_id]);
    if (contractRes.rows.length === 0) {
      return res.status(404).json({ message: "Contract associated with milestone not found." });
    }
    const contract = contractRes.rows[0];

    if (contract.client_id !== clientId) {
      return res.status(403).json({ message: "Access denied. You do not own this contract." });
    }

    if (milestone.payment_status === "Funded" || milestone.payment_status === "Paid") {
      return res.status(400).json({ message: "Milestone is already funded or paid." });
    }

    const milestoneAmount = parseFloat(milestone.amount);

    const clientWalletRes = await pool.query("SELECT * FROM wallets WHERE user_id = $1", [clientId]);
    const clientWallet = clientWalletRes.rows[0];

    if (!clientWallet || parseFloat(clientWallet.balance) < milestoneAmount) {
      return res.status(400).json({
        message: `Insufficient wallet balance. Funding requires $${milestoneAmount.toFixed(2)}, but you only have $${parseFloat(clientWallet?.balance || "0").toFixed(2)}.`
      });
    }

    const sysRes = await pool.query("SELECT * FROM wallets WHERE is_system = TRUE");
    const sysWallet = sysRes.rows[0];

    await pool.query("BEGIN");
    try {
      // Debit client
      await pool.query(
        "UPDATE wallets SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = $2",
        [milestoneAmount, clientWallet.wallet_id]
      );
      // Credit system escrow
      await pool.query(
        "UPDATE wallets SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = $2",
        [milestoneAmount, sysWallet.wallet_id]
      );

      // Record transaction
      await pool.query(
        `INSERT INTO wallet_transactions (sender_wallet_id, receiver_wallet_id, amount, type, status, description)
         VALUES ($1, $2, $3, 'Transfer', 'Completed', $4)`,
        [
          clientWallet.wallet_id,
          sysWallet.wallet_id,
          milestoneAmount,
          `Escrow funding for milestone: ${milestone.title} (contract: ${contract.title})`
        ]
      );

      // Update milestone
      await pool.query(
        "UPDATE contract_milestones SET payment_status = 'Funded', status = 'Pending', updated_at = CURRENT_TIMESTAMP WHERE milestone_id = $1",
        [milestoneId]
      );

      await pool.query("COMMIT");

      // Notify freelancer
      try {
        const { default: Notification } = await import("../models/notificationModel.js");
        await Notification.create({
          userId: contract.freelancer_id,
          title: "Milestone Funded! 💰",
          message: `Client funded milestone "${milestone.title}" ($${milestoneAmount.toFixed(2)}). You can now start working.`,
          type: "contract",
          referenceId: contract.contract_id.toString(),
        });
      } catch {}

      return res.status(200).json({
        message: "Milestone funded successfully.",
        payment_status: "Funded"
      });
    } catch (txErr) {
      await pool.query("ROLLBACK");
      throw txErr;
    }
  } catch (err) {
    console.error("Fund milestone error:", err);
    return res.status(500).json({ message: err.message || "Failed to fund milestone." });
  }
};

export const requestMilestoneFunding = async (req, res) => {
  try {
    const freelancerId = req.user.user_id;
    const milestoneId = parseInt(req.params.id);

    if (!milestoneId || isNaN(milestoneId)) {
      return res.status(400).json({ message: "Invalid milestone ID." });
    }

    const milestoneRes = await pool.query("SELECT * FROM contract_milestones WHERE milestone_id = $1", [milestoneId]);
    if (milestoneRes.rows.length === 0) {
      return res.status(404).json({ message: "Milestone not found." });
    }
    const milestone = milestoneRes.rows[0];

    const contractRes = await pool.query("SELECT * FROM contracts WHERE contract_id = $1", [milestone.contract_id]);
    if (contractRes.rows.length === 0) {
      return res.status(404).json({ message: "Contract associated with milestone not found." });
    }
    const contract = contractRes.rows[0];

    if (contract.freelancer_id !== freelancerId) {
      return res.status(403).json({ message: "Access denied. Only the hired freelancer can request funding." });
    }

    if (milestone.payment_status === "Funded" || milestone.payment_status === "Paid") {
      return res.status(400).json({ message: "Milestone is already funded or paid." });
    }

    // Notify client
    try {
      const { default: Notification } = await import("../models/notificationModel.js");
      const notif = await Notification.create({
        userId: contract.client_id,
        title: "Milestone Funding Request! 💰",
        message: `Freelancer has requested you to fund the next milestone: "${milestone.title}" ($${parseFloat(milestone.amount).toFixed(2)}).`,
        type: "system",
        referenceId: contract.contract_id.toString(),
      });

      if (req.io) {
        req.io.to(`user_${contract.client_id}`).emit("new_notification", notif);
      }
    } catch (nErr) {
      console.error("Failed to create funding request notification:", nErr);
    }

    return res.status(200).json({ message: "Funding request sent to client successfully." });
  } catch (err) {
    console.error("Request milestone funding error:", err);
    return res.status(500).json({ message: err.message || "Failed to request milestone funding." });
  }
};


export const createStripeMilestoneSession = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { milestone_id, type, redirect_path } = req.body; // type can be 'milestone' or 'revision'
    const path = redirect_path || "/dashboard/proposals";

    if (!milestone_id || !type) {
      return res.status(400).json({ message: "milestone_id and type are required." });
    }

    // Fetch milestone details
    const milestoneRes = await pool.query(
      `SELECT cm.*, c.title as contract_title, c.client_id, c.job_id
       FROM contract_milestones cm
       JOIN contracts c ON cm.contract_id = c.contract_id
       WHERE cm.milestone_id = $1`,
      [parseInt(milestone_id)]
    );
    if (milestoneRes.rows.length === 0) {
      return res.status(404).json({ message: "Milestone not found." });
    }
    const milestone = milestoneRes.rows[0];
    if (milestone.client_id !== userId) {
      return res.status(403).json({ message: "Access denied. You do not own the contract for this milestone." });
    }

    let payAmount = 0;
    let description = "";
    if (type === "milestone") {
      payAmount = parseFloat(milestone.amount);
      description = `Milestone Escrow Funding: ${milestone.title}`;
    } else if (type === "revision") {
      payAmount = parseFloat(milestone.extra_revision_fee);
      description = `Extra Revision Fee: ${milestone.title}`;
    } else {
      return res.status(400).json({ message: "Invalid type. Must be 'milestone' or 'revision'." });
    }

    if (payAmount <= 0) {
      return res.status(400).json({ message: "Amount must be greater than zero to charge via Stripe." });
    }

    const amountCents = Math.round(payAmount * 100);

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
      return res.status(400).json({ message: "Stripe is not configured. Please add Stripe Secret Key in Admin Payment Settings." });
    }

    const localStripe = new Stripe(stripeSecretKey);
    const session = await localStripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: description,
              description: `Contract: ${milestone.contract_title}`,
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${FRONTEND_URL}${path}?project_id=${milestone.job_id}&stripe_milestone_success=1&milestone_id=${milestone_id}&type=${type}&amount=${payAmount}`,
      cancel_url:  `${FRONTEND_URL}${path}?project_id=${milestone.job_id}&stripe_milestone_cancel=1&milestone_id=${milestone_id}`,
      metadata: {
        milestone_id: milestone_id.toString(),
        user_id: userId.toString(),
        amount_usd: payAmount.toString(),
        type: type,
      },
    });

    return res.status(200).json({ url: session.url, session_id: session.id });
  } catch (err) {
    console.error("Stripe session creation error for milestone:", err);
    return res.status(500).json({ message: "Failed to create Stripe payment session.", error: err.message });
  }
};

export const confirmStripeMilestonePayment = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { milestone_id, type, amount_usd } = req.body;
    fs.appendFileSync("api_logs.txt", `[${new Date().toISOString()}] confirmStripeMilestonePayment: userId=${userId}, body=${JSON.stringify(req.body)}\n`);

    if (!milestone_id || !type || !amount_usd) {
      return res.status(400).json({ message: "milestone_id, type and amount_usd are required." });
    }

    const milestoneId = parseInt(milestone_id);
    const payAmount = parseFloat(amount_usd);

    // Fetch milestone details
    const milestoneRes = await pool.query(
      `SELECT cm.*, c.title as contract_title, c.client_id, c.freelancer_id
       FROM contract_milestones cm
       JOIN contracts c ON cm.contract_id = c.contract_id
       WHERE cm.milestone_id = $1`,
      [milestoneId]
    );
    if (milestoneRes.rows.length === 0) {
      return res.status(404).json({ message: "Milestone not found." });
    }
    const milestone = milestoneRes.rows[0];
    if (milestone.client_id !== userId) {
      return res.status(403).json({ message: "Access denied." });
    }

    // 1. Get or create client's wallet
    const wallet = await getOrCreateWallet(userId, req.user.role);

    // 2. Perform transaction: deposit the amount to client's wallet first
    await pool.query("BEGIN");
    try {
      // Update wallet balance
      await pool.query(
        "UPDATE wallets SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = $2",
        [payAmount, wallet.wallet_id]
      );

      // Record deposit transaction
      await pool.query(
        `INSERT INTO wallet_transactions (sender_wallet_id, receiver_wallet_id, amount, type, status, description)
         VALUES (NULL, $1, $2, 'Stripe Deposit', 'Completed', $3)`,
        [wallet.wallet_id, payAmount, `Stripe payment for ${type}: ${milestone.title}`]
      );

      await pool.query("COMMIT");
    } catch (txErr) {
      await pool.query("ROLLBACK");
      throw txErr;
    }

    // 3. Perform the actual funding call
    await pool.query("BEGIN");
    try {
      // Deduct client wallet
      await pool.query(
        "UPDATE wallets SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = $2",
        [payAmount, wallet.wallet_id]
      );

      // Get system wallet ID
      const systemWalletRes = await pool.query("SELECT wallet_id FROM wallets WHERE is_system = true LIMIT 1");
      const systemWalletId = systemWalletRes.rows[0]?.wallet_id || 1;

      if (type === "milestone") {
        // Increment system escrow wallet balance
        await pool.query(
          "UPDATE wallets SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = $2",
          [payAmount, systemWalletId]
        );

        // Record escrow transfer
        await pool.query(
          `INSERT INTO wallet_transactions (sender_wallet_id, receiver_wallet_id, amount, type, status, description)
           VALUES ($1, $2, $3, 'Transfer', 'Completed', $4)`,
          [wallet.wallet_id, systemWalletId, payAmount, `Escrow funding for milestone: ${milestone.title} (contract: ${milestone.contract_title})`]
        );

        // Update milestone
        await pool.query(
          "UPDATE contract_milestones SET payment_status = 'Funded', status = 'Pending', updated_at = CURRENT_TIMESTAMP WHERE milestone_id = $1",
          [milestoneId]
        );
      } else {
        // Get freelancer wallet
        let freelancerWalletRes = await pool.query("SELECT * FROM wallets WHERE user_id = $1", [milestone.freelancer_id]);
        let freelancerWallet = freelancerWalletRes.rows[0];
        if (!freelancerWallet) {
          const ins = await pool.query(
            "INSERT INTO wallets (user_id, balance, currency) VALUES ($1, 0.00, 'USD') RETURNING *",
            [milestone.freelancer_id]
          );
          freelancerWallet = ins.rows[0];
        }

        // Calculate commission
        let commissionPercent = 0.05;
        const feeRes = await pool.query("SELECT setting_value FROM settings WHERE setting_key = 'platform_fee'");
        if (feeRes.rows.length > 0) {
          let feeVal = feeRes.rows[0].setting_value;
          if (typeof feeVal === "string") {
            try { feeVal = JSON.parse(feeVal); } catch {}
          }
          if (feeVal?.fee) {
            commissionPercent = parseFloat(feeVal.fee) / 100;
          }
        }

        const commissionAmount = payAmount * commissionPercent;
        const freelancerAmount = payAmount - commissionAmount;

        // Credit freelancer wallet
        await pool.query(
          "UPDATE wallets SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = $2",
          [freelancerAmount, freelancerWallet.wallet_id]
        );

        // Credit system admin wallet
        await pool.query(
          "UPDATE wallets SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = $2",
          [commissionAmount, systemWalletId]
        );

        // Record transaction
        await pool.query(
          `INSERT INTO wallet_transactions (sender_wallet_id, receiver_wallet_id, amount, commission_amount, type, status, description)
           VALUES ($1, $2, $3, $4, 'Revision_Direct_Payment', 'Completed', $5)`,
          [
            wallet.wallet_id,
            freelancerWallet.wallet_id,
            freelancerAmount,
            commissionAmount,
            `Direct payment for revision fee on milestone: ${milestone.title} (contract: ${milestone.contract_title})`
          ]
        );

        // Update milestone revision status and increment revision_count
        await pool.query(
          "UPDATE contract_milestones SET revision_status = 'In Progress', revision_count = COALESCE(revision_count, 0) + 1, updated_at = CURRENT_TIMESTAMP WHERE milestone_id = $1",
          [milestoneId]
        );
      }

      await pool.query("COMMIT");

      // Notify freelancer
      try {
        const { default: Notification } = await import("../models/notificationModel.js");
        await Notification.create({
          userId: milestone.freelancer_id,
          title: type === "milestone" ? "Milestone Funded! 💰" : "Revision Funded! 💰",
          message: type === "milestone" 
            ? `Client funded milestone "${milestone.title}" ($${payAmount.toFixed(2)}).`
            : `Client funded extra revision fee for "${milestone.title}" ($${payAmount.toFixed(2)}).`,
          type: "contract",
          referenceId: milestone.contract_id.toString(),
        });
      } catch {}

      return res.status(200).json({
        message: type === "milestone" ? "Milestone funded successfully." : "Extra revision funded successfully.",
        payment_status: type === "milestone" ? "Funded" : undefined,
        revision_status: type === "revision" ? "In Progress" : undefined
      });
    } catch (txErr) {
      await pool.query("ROLLBACK");
      throw txErr;
    }
  } catch (err) {
    fs.appendFileSync("api_logs.txt", `[${new Date().toISOString()}] confirmStripeMilestonePayment ERROR: ${err.message}\n`);
    console.error("Stripe milestone confirmation error:", err);
    return res.status(500).json({ message: err.message || "Failed to confirm Stripe payment." });
  }
};
