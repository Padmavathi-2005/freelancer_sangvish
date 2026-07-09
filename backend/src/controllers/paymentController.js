import Stripe from "stripe";
import pool from "../config/db.js";
import { handlePostHireNotificationsAndActions } from "../utils/hiringNotifier.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

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
          for (const m of appMilestones.rows) {
            await pool.query(
              `INSERT INTO contract_milestones (contract_id, title, description, amount, start_date, end_date, status, payment_status)
               VALUES ($1, $2, $3, $4, $5, $6, 'Pending', 'Pending')`,
              [contract.contract_id, m.title, m.description || null, parseFloat(m.amount), m.start_date, m.end_date]
            );
          }
        } else {
          await pool.query(
            `INSERT INTO contract_milestones (contract_id, title, amount, status, payment_status)
             VALUES ($1, 'Entire Project Scope', $2, 'Pending', 'Pending')`,
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
    } catch (txErr) {
      await pool.query("ROLLBACK");
      throw txErr;
    }

    // Notify freelancer that payment was received
    try {
      const { default: Notification } = await import("../models/Notification.js");
      await Notification.create({
        userId: app.freelancer_id,
        title: "Payment Received",
        message: `Client has paid for the gig order "${app.gig_title}". The contract is now active.`,
        type: "payment",
        referenceId: application_id.toString(),
      });
      if (req.io) {
        req.io.to(`user_${app.freelancer_id}`).emit("new_notification", {
          title: "Payment Received",
          message: `Client paid $${upfrontAmount.toFixed(2)} for "${app.gig_title}".`,
        });
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
          for (const m of appMilestones.rows) {
            await pool.query(
              `INSERT INTO contract_milestones (contract_id, title, description, amount, start_date, end_date, status, payment_status)
               VALUES ($1, $2, $3, $4, $5, $6, 'Pending', 'Pending')`,
              [contract.contract_id, m.title, m.description || null, parseFloat(m.amount), m.start_date, m.end_date]
            );
          }
        } else {
          await pool.query(
            `INSERT INTO contract_milestones (contract_id, title, amount, status, payment_status)
             VALUES ($1, 'Entire Project Scope', $2, 'Pending', 'Pending')`,
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
    } catch (txErr) {
      await pool.query("ROLLBACK");
      throw txErr;
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
    if (numFreelancersStr.includes("2-5")) {
      limit = 5;
    } else if (numFreelancersStr.includes("More than 5") || numFreelancersStr.includes("many") || numFreelancersStr.includes("5+")) {
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
      `SELECT p.*, j.title as job_title, j.client_id, j.budget as job_budget, j.max_budget as job_max_budget, j.min_budget as job_min_budget
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
    if (maxBudget > 0 && (currentCommitted + bidAmount) > maxBudget) {
      return res.status(400).json({
        message: `Hiring limit exceeded. Total project budget is $${maxBudget.toLocaleString()}, but you have already committed $${currentCommitted.toLocaleString()} to active contracts. Hiring this candidate at $${bidAmount.toLocaleString()} would exceed the budget limit.`
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
      `SELECT p.*, j.title as job_title, j.client_id, j.budget as job_budget, j.max_budget as job_max_budget, j.min_budget as job_min_budget
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
    if (maxBudget > 0 && (currentCommitted + bidAmount) > maxBudget) {
      return res.status(400).json({
        message: `Hiring limit exceeded. Total project budget is $${maxBudget.toLocaleString()}, but you have already committed $${currentCommitted.toLocaleString()} to active contracts. Hiring this candidate at $${bidAmount.toLocaleString()} would exceed the budget limit.`
      });
    }

    await processProposalHireTransaction(proposal, upfrontAmount, method);

    // Send notifications and initialize chat
    await handlePostHireNotificationsAndActions({
      proposalId: parseInt(proposal_id),
      bidAmount: upfrontAmount,
      io: req.io
    });

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
        // Debit client wallet
        await pool.query(
          "UPDATE wallets SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = $2",
          [milestoneAmount, clientWallet.wallet_id]
        );

        // Credit system wallet with commission
        await pool.query(
          "UPDATE wallets SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = $2",
          [commissionAmount, sysWallet.wallet_id]
        );

        // Record client-to-system transaction (direct payment/escrow)
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
        "UPDATE contracts SET progress = $1, status = $2, completed_at = CASE WHEN $2 = 'Completed' THEN CURRENT_TIMESTAMP ELSE completed_at END, updated_at = CURRENT_TIMESTAMP WHERE contract_id = $3",
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
        await Notification.create({
          userId: contract.freelancer_id,
          title: "Milestone Payment Released!",
          message: `Client approved and released $${milestoneAmount.toFixed(2)} for milestone: "${milestone.title}".`,
          type: "payment",
          referenceId: contract.contract_id.toString(),
        });
        if (req.io) {
          req.io.to(`user_${contract.freelancer_id}`).emit("new_notification", {
            title: "Milestone Paid",
            message: `Client released $${milestoneAmount.toFixed(2)} for "${milestone.title}".`,
          });
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

    await pool.query(
      "UPDATE contract_milestones SET status = 'Under Review', updated_at = CURRENT_TIMESTAMP WHERE milestone_id = $1",
      [milestoneId]
    );

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
        req.io.to(`user_${contract.client_id}`).emit("new_notification", {
          title: "Milestone Work Submitted",
          message: `${freelancerName} submitted work for "${milestone.title}".`,
        });
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
    const { feedback } = req.body;

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

    await pool.query(
      "UPDATE contract_milestones SET status = 'Revision Requested', feedback = $1, updated_at = CURRENT_TIMESTAMP WHERE milestone_id = $2",
      [feedback.trim(), milestoneId]
    );

    try {
      const { default: Notification } = await import("../models/notificationModel.js");
      const clientUserRes = await pool.query("SELECT first_name || ' ' || COALESCE(last_name, '') as name FROM users WHERE user_id = $1", [clientId]);
      const clientName = clientUserRes.rows[0]?.name || "Client";

      await Notification.create({
        userId: contract.freelancer_id,
        title: "Revision Requested for Milestone ⚠️",
        message: `Client ${clientName} requested revisions for milestone "${milestone.title}". Feedback: "${feedback.trim()}"`,
        type: "contract",
        referenceId: contract.contract_id.toString(),
      });
      if (req.io) {
        req.io.to(`user_${contract.freelancer_id}`).emit("new_notification", {
          title: "Revision Requested",
          message: `${clientName} requested revisions for "${milestone.title}".`,
        });
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

    const budget = parseFloat(contract.budget);

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
      // Debit system escrow
      await pool.query(
        "UPDATE wallets SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = $2",
        [budget, sysWallet.wallet_id]
      );

      // Credit client wallet
      await pool.query(
        "UPDATE wallets SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = $2",
        [budget, clientWallet.wallet_id]
      );

      // Record refund transaction
      await pool.query(
        `INSERT INTO wallet_transactions (sender_wallet_id, receiver_wallet_id, amount, type, status, description)
         VALUES ($1, $2, $3, 'Transfer', 'Completed', $4)`,
        [
          sysWallet.wallet_id,
          clientWallet.wallet_id,
          budget,
          `Escrow refund due to contract cancellation: ${contract.title}`,
        ]
      );

      // Update contract status
      await pool.query(
        "UPDATE contracts SET status = 'Cancelled', progress = 0, cancelled_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE contract_id = $1",
        [contractId]
      );

      // Update all milestones to Cancelled
      await pool.query(
        "UPDATE contract_milestones SET status = 'Cancelled', payment_status = 'Refunded', updated_at = CURRENT_TIMESTAMP WHERE contract_id = $1",
        [contractId]
      );

      const proposalIdToCancel = contract.application_id || (await pool.query(
        "SELECT proposal_id FROM proposals WHERE job_id = $1 AND freelancer_id = $2 AND status = 'Accepted'",
        [contract.job_id, contract.freelancer_id]
      )).rows[0]?.proposal_id;

      if (proposalIdToCancel) {
        await pool.query(
          "UPDATE proposals SET status = 'Cancelled', updated_at = CURRENT_TIMESTAMP WHERE proposal_id = $1",
          [proposalIdToCancel]
        );
      }

      await pool.query("COMMIT");

      // Notify freelancer
      try {
        const { default: Notification } = await import("../models/notificationModel.js");
        await Notification.create({
          userId: contract.freelancer_id,
          title: "Contract Cancelled",
          message: `Client cancelled the contract "${contract.title}" and requested a full refund.`,
          type: "system",
          referenceId: contractId.toString(),
        });
        if (req.io) {
          req.io.to(`user_${contract.freelancer_id}`).emit("new_notification", {
            title: "Contract Cancelled",
            message: `Client cancelled "${contract.title}" and requested a full refund.`,
          });
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
      await Notification.create({
        userId: contract.client_id,
        title: "Work Started! 🚀",
        message: `Freelancer started working on your contract: "${contract.title}".`,
        type: "system",
        referenceId: contractId.toString(),
      });
      if (req.io) {
        req.io.to(`user_${contract.client_id}`).emit("new_notification", {
          title: "Work Started!",
          message: `Freelancer started working on "${contract.title}".`,
        });
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
    const { contract_id, timecard_id } = req.body;
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
      success_url: `${FRONTEND_URL}/dashboard/proposals?stripe_timecard_success=1&contract_id=${contract_id}&timecard_id=${timecard_id}&amount=${extraPayment}`,
      cancel_url:  `${FRONTEND_URL}/dashboard/proposals?stripe_timecard_cancel=1&contract_id=${contract_id}&timecard_id=${timecard_id}`,
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

    return res.status(responseStatus).json(responseData);
  } catch (err) {
    console.error("Pay timecard directly error:", err);
    return res.status(500).json({ message: err.message || "Failed to process timecard payment." });
  }
};
