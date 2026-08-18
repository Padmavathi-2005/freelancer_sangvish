import pool from "../config/db.js";
import Stripe from "stripe";

// Helper to get or create a user's wallet on the fly
export const getOrCreateWallet = async (userId) => {
  const selectQuery = "SELECT * FROM wallets WHERE user_id = $1";
  const selectRes = await pool.query(selectQuery, [userId]);
  
  if (selectRes.rows.length > 0) {
    return selectRes.rows[0];
  }

  // All users start with $0.00
  const initialBalance = 0.00;
  const insertQuery = `
    INSERT INTO wallets (user_id, balance, currency)
    VALUES ($1, $2, 'USD')
    RETURNING *
  `;
  const insertRes = await pool.query(insertQuery, [userId, initialBalance]);
  return insertRes.rows[0];
};

export const getUserWallet = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const wallet = await getOrCreateWallet(userId);

    // Get transaction history
    const transactionsQuery = `
      SELECT 
        wt.*,
        sender.user_id AS sender_user_id,
        sender_u.first_name || ' ' || COALESCE(sender_u.last_name, '') AS sender_name,
        receiver.user_id AS receiver_user_id,
        receiver_u.first_name || ' ' || COALESCE(receiver_u.last_name, '') AS receiver_name
      FROM wallet_transactions wt
      LEFT JOIN wallets sender ON wt.sender_wallet_id = sender.wallet_id
      LEFT JOIN users sender_u ON sender.user_id = sender_u.user_id
      LEFT JOIN wallets receiver ON wt.receiver_wallet_id = receiver.wallet_id
      LEFT JOIN users receiver_u ON receiver.user_id = receiver_u.user_id
      WHERE wt.sender_wallet_id = $1 OR wt.receiver_wallet_id = $1
      ORDER BY wt.created_at DESC
    `;
    const transactionsRes = await pool.query(transactionsQuery, [wallet.wallet_id]);

    // Calculate total non-withdrawable signup bonus credits
    const bonusRes = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total_bonus FROM wallet_transactions 
       WHERE receiver_wallet_id = $1 AND type IN ('referral_signup_bonus', 'signup_bonus') AND status = 'completed'`,
      [wallet.wallet_id]
    );
    const bonusBalance = parseFloat(bonusRes.rows[0].total_bonus || "0");

    // Calculate pending (unapproved) referral/signup bonus amount from referral_payouts table
    const pendingBonusRes = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS pending_bonus 
       FROM referral_payouts 
       WHERE (referred_id = $1 OR referrer_id = $1) AND status = 'pending'`,
      [userId]
    );
    const pendingBonusBalance = parseFloat(pendingBonusRes.rows[0].pending_bonus || "0");

    // Fetch min_withdrawal_amount setting from DB (check general settings first, fallback to referral settings)
    let minWithdrawalAmount = 10.00;
    try {
      const directRes = await pool.query("SELECT setting_value FROM settings WHERE setting_key = 'min_withdrawal_amount'");
      if (directRes.rows.length > 0) {
        let val = directRes.rows[0].setting_value;
        if (typeof val === "string") { try { val = JSON.parse(val); } catch (e) {} }
        const parsed = typeof val === "object" ? parseFloat(val.amount || val.min_withdrawal_amount) : parseFloat(val);
        if (!isNaN(parsed) && parsed > 0) {
          minWithdrawalAmount = parsed;
        }
      } else {
        const settingsRes = await pool.query("SELECT setting_value FROM settings WHERE setting_key = 'referral_settings'");
        if (settingsRes.rows.length > 0) {
          let val = settingsRes.rows[0].setting_value;
          if (typeof val === "string") { try { val = JSON.parse(val); } catch (e) {} }
          if (val && val.min_withdrawal_amount !== undefined && parseFloat(val.min_withdrawal_amount) > 0) {
            minWithdrawalAmount = parseFloat(val.min_withdrawal_amount);
          }
        }
      }
    } catch (sErr) {}

    const activeBalance = parseFloat(wallet.balance);
    // All wallet balance (including signup bonus, referral rewards & affiliate commissions) is withdrawable and usable for purchases
    const withdrawableBalance = Math.max(0, activeBalance);

    const walletData = {
      ...wallet,
      bonus_balance: bonusBalance,
      pending_bonus_balance: pendingBonusBalance,
      withdrawable_balance: withdrawableBalance,
      min_withdrawal_amount: minWithdrawalAmount
    };

    // Get withdrawal requests
    const withdrawalsQuery = `
      SELECT * FROM withdrawal_requests
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;
    const withdrawalsRes = await pool.query(withdrawalsQuery, [userId]);

    return res.status(200).json({
      wallet: walletData,
      transactions: transactionsRes.rows,
      withdrawals: withdrawalsRes.rows
    });
  } catch (error) {
    console.error("Error in getUserWallet:", error);
    return res.status(500).json({ message: "Failed to retrieve wallet information." });
  }
};

export const requestWithdrawal = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { amount, paymentMethod, accountDetails } = req.body;

    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      return res.status(400).json({ message: "Please provide a valid withdrawal amount." });
    }
    if (!paymentMethod || !paymentMethod.trim()) {
      return res.status(400).json({ message: "Payment method is required." });
    }
    if (!accountDetails || !accountDetails.trim()) {
      return res.status(400).json({ message: "Account details are required." });
    }

    const withdrawAmt = parseFloat(amount);
    const wallet = await getOrCreateWallet(userId, req.user.role);

    // Fetch min_withdrawal_amount setting from DB (check general settings first, fallback to referral settings)
    let minWithdrawalAmount = 10.00;
    try {
      const directRes = await pool.query("SELECT setting_value FROM settings WHERE setting_key = 'min_withdrawal_amount'");
      if (directRes.rows.length > 0) {
        let val = directRes.rows[0].setting_value;
        if (typeof val === "string") { try { val = JSON.parse(val); } catch (e) {} }
        const parsed = typeof val === "object" ? parseFloat(val.amount || val.min_withdrawal_amount) : parseFloat(val);
        if (!isNaN(parsed) && parsed > 0) {
          minWithdrawalAmount = parsed;
        }
      } else {
        const settingsRes = await pool.query("SELECT setting_value FROM settings WHERE setting_key = 'referral_settings'");
        if (settingsRes.rows.length > 0) {
          let val = settingsRes.rows[0].setting_value;
          if (typeof val === "string") { try { val = JSON.parse(val); } catch (e) {} }
          if (val && val.min_withdrawal_amount !== undefined && parseFloat(val.min_withdrawal_amount) > 0) {
            minWithdrawalAmount = parseFloat(val.min_withdrawal_amount);
          }
        }
      }
    } catch (sErr) {}

    if (withdrawAmt < minWithdrawalAmount) {
      return res.status(400).json({ message: `Minimum withdrawal amount is $${minWithdrawalAmount.toFixed(2)}.` });
    }

    // Calculate total pending withdrawal requests for this user
    const pendingRes = await pool.query(
      "SELECT COALESCE(SUM(amount), 0) AS total_pending FROM withdrawal_requests WHERE user_id = $1 AND status = 'Pending'",
      [userId]
    );
    const totalPending = parseFloat(pendingRes.rows[0].total_pending || "0");

    const activeBalance = parseFloat(wallet.balance);
    const withdrawableBalance = Math.max(0, activeBalance - totalPending);

    if (withdrawableBalance < withdrawAmt) {
      return res.status(400).json({
        message: `Insufficient available balance. Active balance is $${activeBalance.toFixed(2)}, Pending requests: $${totalPending.toFixed(2)}, Available: $${withdrawableBalance.toFixed(2)}.`
      });
    }

    // Create withdrawal request in Pending status (Balance is NOT deducted until Admin approves)
    const requestQuery = `
      INSERT INTO withdrawal_requests (user_id, wallet_id, amount, payment_method, account_details, status)
      VALUES ($1, $2, $3, $4, $5, 'Pending')
      RETURNING *
    `;
    const requestRes = await pool.query(requestQuery, [
      userId,
      wallet.wallet_id,
      withdrawAmt,
      paymentMethod.trim(),
      accountDetails.trim()
    ]);

    // Record pending wallet transaction
    const transactionQuery = `
      INSERT INTO wallet_transactions (sender_wallet_id, receiver_wallet_id, amount, type, status, description)
      VALUES ($1, NULL, $2, 'Withdrawal_Request', 'Pending', $3)
    `;
    const description = `Withdrawal request via ${paymentMethod}`;
    await pool.query(transactionQuery, [wallet.wallet_id, withdrawAmt, description]);

    // Send notifications to freelancer and admins
    try {
      const userRes = await pool.query("SELECT first_name, last_name FROM users WHERE user_id = $1", [userId]);
      const userName = userRes.rows[0] ? `${userRes.rows[0].first_name} ${userRes.rows[0].last_name || ""}`.trim() : "A freelancer";

      // Freelancer notification
      const freeNotif = await pool.query(
        `INSERT INTO notifications (user_id, title, message, type, reference_id)
         VALUES ($1, 'Withdrawal Submitted 💸', $2, 'withdrawal_request', $3) RETURNING *`,
        [
          userId,
          `Your withdrawal request of $${withdrawAmt.toFixed(2)} has been submitted for review.`,
          requestRes.rows[0].request_id.toString()
        ]
      );
      if (req.io && freeNotif.rows.length > 0) {
        req.io.to(`user_${userId}`).emit("new_notification", freeNotif.rows[0]);
      }

      // Admin notifications
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

        const adminNotif = await pool.query(
          `INSERT INTO notifications (user_id, title, message, type, reference_id, target_tab)
           VALUES ($1, 'New Withdrawal Request 💰', $2, 'withdrawal_request', $3, 'wallet_management') RETURNING *`,
          [
            adminUserId,
            `A new withdrawal request of $${withdrawAmt.toFixed(2)} was submitted by ${userName}.`,
            requestRes.rows[0].request_id.toString()
          ]
        );

        if (req.io && adminNotif.rows.length > 0) {
          req.io.to(`user_${adminUserId}`).emit("new_notification", adminNotif.rows[0]);
        }
      }
    } catch (notifErr) {
      console.error("Error creating notifications for withdrawal request:", notifErr);
    }

    return res.status(201).json({
      message: "Withdrawal request submitted successfully. Awaiting Admin review.",
      wallet,
      request: requestRes.rows[0]
    });
  } catch (error) {
    console.error("Error in requestWithdrawal:", error);
    return res.status(500).json({ message: "Failed to submit withdrawal request." });
  }
};

export const depositFunds = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { amount, method } = req.body;

    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      return res.status(400).json({ message: "Please provide a valid deposit amount." });
    }

    const depositAmt = parseFloat(amount);
    const wallet = await getOrCreateWallet(userId, req.user.role);

    // Update user wallet balance
    const depositQuery = `
      UPDATE wallets
      SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP
      WHERE wallet_id = $2
      RETURNING *
    `;
    const depositRes = await pool.query(depositQuery, [depositAmt, wallet.wallet_id]);

    // Record wallet transaction
    const transactionQuery = `
      INSERT INTO wallet_transactions (sender_wallet_id, receiver_wallet_id, amount, type, status, description)
      VALUES (NULL, $1, $2, 'Deposit', 'Completed', $3)
    `;
    const description = method === "paypal" ? "PayPal Deposit (Simulated)" : "Simulated account deposit";
    await pool.query(transactionQuery, [wallet.wallet_id, depositAmt, description]);

    return res.status(200).json({
      message: "Funds deposited successfully.",
      wallet: depositRes.rows[0]
    });
  } catch (error) {
    console.error("Error in depositFunds:", error);
    return res.status(500).json({ message: "Failed to deposit funds." });
  }
};

export const createStripeDepositSession = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { amount } = req.body;

    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      return res.status(400).json({ message: "Please provide a valid deposit amount." });
    }

    const amountCents = Math.round(parseFloat(amount) * 100);
    if (amountCents < 50) {
      return res.status(400).json({ message: "Minimum Stripe charge is $0.50." });
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
    const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

    const session = await localStripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Wallet Deposit",
              description: "Funding your platform virtual wallet",
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${FRONTEND_URL}/dashboard?tab=wallet&stripe_deposit_success=1&session_id={CHECKOUT_SESSION_ID}&amount=${amount}`,
      cancel_url:  `${FRONTEND_URL}/dashboard?tab=wallet&stripe_deposit_cancel=1`,
      metadata: {
        user_id: userId.toString(),
        amount: amount.toString(),
        type: "wallet_deposit",
      },
    });

    return res.status(200).json({ url: session.url, session_id: session.id });
  } catch (error) {
    console.error("Error in createStripeDepositSession:", error);
    return res.status(500).json({ message: "Failed to initiate Stripe session." });
  }
};

export const confirmStripeDepositPayment = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { session_id, amount } = req.body;

    if (!session_id || !amount) {
      return res.status(400).json({ message: "session_id and amount are required." });
    }

    const depositAmt = parseFloat(amount);

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
      return res.status(400).json({ message: "Stripe is not configured." });
    }

    // Verify session in Stripe
    const localStripe = new Stripe(stripeSecretKey);
    const stripeSession = await localStripe.checkout.sessions.retrieve(session_id);
    if (stripeSession.payment_status !== "paid") {
      return res.status(400).json({ message: "Stripe payment has not been completed." });
    }

    // Check if this session was already processed to prevent duplicate deposit
    const checkTx = await pool.query(
      "SELECT * FROM wallet_transactions WHERE description = $1",
      [`Stripe Deposit (Session: ${session_id})`]
    );
    if (checkTx.rows.length > 0) {
      return res.status(400).json({ message: "This deposit has already been processed." });
    }

    const wallet = await getOrCreateWallet(userId);

    await pool.query("BEGIN");
    try {
      // Update user wallet balance
      await pool.query(
        "UPDATE wallets SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = $2",
        [depositAmt, wallet.wallet_id]
      );

      // Record transaction
      await pool.query(
        `INSERT INTO wallet_transactions (sender_wallet_id, receiver_wallet_id, amount, type, status, description)
         VALUES (NULL, $1, $2, 'Deposit', 'Completed', $3)`,
        [wallet.wallet_id, depositAmt, `Stripe Deposit (Session: ${session_id})`]
      );

      await pool.query("COMMIT");
    } catch (err) {
      await pool.query("ROLLBACK");
      throw err;
    }

    const updatedWallet = await getOrCreateWallet(userId);

    return res.status(200).json({
      message: "Stripe deposit confirmed successfully.",
      wallet: updatedWallet
    });
  } catch (error) {
    console.error("Error in confirmStripeDepositPayment:", error);
    return res.status(500).json({ message: "Failed to confirm Stripe deposit." });
  }
};
