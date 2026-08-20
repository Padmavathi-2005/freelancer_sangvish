import pool from "../../config/db.js";

export const getPlatformWalletStats = async (req, res) => {
  try {
    // 1. Get system wallet details
    const systemWalletRes = await pool.query("SELECT * FROM wallets WHERE is_system = TRUE");
    const systemWallet = systemWalletRes.rows[0];

    // 2. Get escrow holdings (sum of budgets for active contracts in progress)
    const escrowRes = await pool.query("SELECT COALESCE(SUM(budget), 0) AS total_escrow FROM contracts WHERE status = 'In Progress'");
    const totalEscrow = parseFloat(escrowRes.rows[0].total_escrow);

    // 3. Get total commissions earned (sum of commission_amount in transactions)
    const commissionsRes = await pool.query("SELECT COALESCE(SUM(commission_amount), 0) AS total_commissions FROM wallet_transactions");
    const totalCommissions = parseFloat(commissionsRes.rows[0].total_commissions);

    // 4. Get all user wallets
    const walletsRes = await pool.query(`
      SELECT 
        w.*,
        u.first_name || ' ' || COALESCE(u.last_name, '') AS user_name,
        u.email,
        CASE 
          WHEN fp.user_id IS NOT NULL THEN 'Freelancer'
          WHEN cp.user_id IS NOT NULL THEN 'Client'
          ELSE 'User'
        END AS role,
        (COALESCE(fp.onboarding_completed, false) OR COALESCE(cp.onboarding_completed, false)) AS is_onboarded
      FROM wallets w
      LEFT JOIN users u ON w.user_id = u.user_id
      LEFT JOIN freelancer_profiles fp ON u.user_id = fp.user_id
      LEFT JOIN client_profiles cp ON w.user_id = cp.user_id
      WHERE w.is_system = FALSE
      ORDER BY w.balance DESC
    `);

    // 5. Get global transaction log
    const transactionsRes = await pool.query(`
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
      ORDER BY wt.created_at DESC
      LIMIT 100
    `);

    return res.status(200).json({
      systemWallet,
      totalEscrow,
      totalCommissions,
      wallets: walletsRes.rows,
      transactions: transactionsRes.rows
    });
  } catch (error) {
    console.error("Error in getPlatformWalletStats:", error);
    return res.status(500).json({ message: "Failed to retrieve admin wallet stats." });
  }
};

export const getWithdrawalRequests = async (req, res) => {
  try {
    const requestsRes = await pool.query(`
      SELECT 
        wr.*,
        u.first_name || ' ' || COALESCE(u.last_name, '') AS user_name,
        u.email,
        w.balance AS current_wallet_balance
      FROM withdrawal_requests wr
      JOIN users u ON wr.user_id = u.user_id
      JOIN wallets w ON wr.wallet_id = w.wallet_id
      ORDER BY wr.created_at DESC
    `);
    return res.status(200).json(requestsRes.rows);
  } catch (error) {
    console.error("Error in getWithdrawalRequests:", error);
    return res.status(500).json({ message: "Failed to fetch withdrawal requests." });
  }
};

export const approveWithdrawal = async (req, res) => {
  try {
    const requestId = parseInt(req.params.id);
    
    // Fetch request details
    const requestRes = await pool.query("SELECT * FROM withdrawal_requests WHERE request_id = $1", [requestId]);
    if (requestRes.rows.length === 0) {
      return res.status(404).json({ message: "Withdrawal request not found." });
    }
    const request = requestRes.rows[0];

    if (request.status !== "Pending") {
      return res.status(400).json({ message: `Request is already ${request.status.toLowerCase()}.` });
    }

    const amount = parseFloat(request.amount);

    // Fetch user wallet to verify active balance
    const userWalletRes = await pool.query("SELECT * FROM wallets WHERE wallet_id = $1", [request.wallet_id]);
    const userWallet = userWalletRes.rows[0];

    if (!userWallet) {
      return res.status(404).json({ message: "User wallet not found." });
    }

    if (parseFloat(userWallet.balance) < amount) {
      return res.status(400).json({
        message: `Insufficient user wallet balance. Current balance is $${parseFloat(userWallet.balance).toFixed(2)}, required $${amount.toFixed(2)}.`
      });
    }

    // Deduct payout amount from user's wallet NOW upon Admin approval
    await pool.query(
      "UPDATE wallets SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = $2",
      [amount, request.wallet_id]
    );

    // Update system escrow wallet if system wallet exists
    await pool.query(
      "UPDATE wallets SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE is_system = TRUE",
      [amount]
    ).catch(() => {});

    // Update withdrawal request status to Approved
    await pool.query(
      "UPDATE withdrawal_requests SET status = 'Approved', updated_at = CURRENT_TIMESTAMP WHERE request_id = $1",
      [requestId]
    );

    // Update wallet transaction log status from Pending to Completed
    await pool.query(
      `UPDATE wallet_transactions 
       SET status = 'Completed' 
       WHERE sender_wallet_id = $1 AND amount = $2 AND type = 'Withdrawal_Request' AND status = 'Pending'`,
      [request.wallet_id, amount]
    );

    // Notify freelancer of approval
    try {
      const freeNotif = await pool.query(
        `INSERT INTO notifications (user_id, title, message, type, reference_id)
         VALUES ($1, 'Withdrawal Approved ✅', $2, 'withdrawal_approval', $3) RETURNING *`,
        [
          request.user_id,
          `Your withdrawal request of $${amount.toFixed(2)} has been approved and completed.`,
          requestId.toString()
        ]
      );
      if (req.io && freeNotif.rows.length > 0) {
        req.io.to(`user_${request.user_id}`).emit("new_notification", freeNotif.rows[0]);
      }
    } catch (notifErr) {
      console.error("Error creating approval notification:", notifErr);
    }

    return res.status(200).json({ message: "Withdrawal request approved and funds debited successfully." });
  } catch (error) {
    console.error("Error in approveWithdrawal:", error);
    return res.status(500).json({ message: "Failed to approve withdrawal request." });
  }
};

export const rejectWithdrawal = async (req, res) => {
  try {
    const requestId = parseInt(req.params.id);
    
    // Fetch request details
    const requestRes = await pool.query("SELECT * FROM withdrawal_requests WHERE request_id = $1", [requestId]);
    if (requestRes.rows.length === 0) {
      return res.status(404).json({ message: "Withdrawal request not found." });
    }
    const request = requestRes.rows[0];

    if (request.status !== "Pending") {
      return res.status(400).json({ message: `Request is already ${request.status.toLowerCase()}.` });
    }

    const amount = parseFloat(request.amount);

    // Update withdrawal request status to Rejected
    await pool.query(
      "UPDATE withdrawal_requests SET status = 'Rejected', updated_at = CURRENT_TIMESTAMP WHERE request_id = $1",
      [requestId]
    );

    // Update wallet transaction log status to Rejected
    await pool.query(
      `UPDATE wallet_transactions 
       SET status = 'Rejected' 
       WHERE sender_wallet_id = $1 AND amount = $2 AND type = 'Withdrawal_Request' AND status = 'Pending'`,
      [request.wallet_id, amount]
    );

    // Notify freelancer of rejection
    try {
      const freeNotif = await pool.query(
        `INSERT INTO notifications (user_id, title, message, type, reference_id)
         VALUES ($1, 'Withdrawal Rejected ❌', $2, 'withdrawal_rejection', $3) RETURNING *`,
        [
          request.user_id,
          `Your withdrawal request of $${amount.toFixed(2)} has been rejected.`,
          requestId.toString()
        ]
      );
      if (req.io && freeNotif.rows.length > 0) {
        req.io.to(`user_${request.user_id}`).emit("new_notification", freeNotif.rows[0]);
      }
    } catch (notifErr) {
      console.error("Error creating rejection notification:", notifErr);
    }

    return res.status(200).json({ message: "Withdrawal request rejected." });
  } catch (error) {
    console.error("Error in rejectWithdrawal:", error);
    return res.status(500).json({ message: "Failed to reject withdrawal request." });
  }
};

export const payToUser = async (req, res) => {
  try {
    const { recipient_user_id, amount, description } = req.body;

    if (!recipient_user_id || !amount || isNaN(amount) || parseFloat(amount) <= 0) {
      return res.status(400).json({ message: "Please provide a valid recipient user ID and amount." });
    }

    const payAmt = parseFloat(amount);

    // Get system/escrow wallet
    const sysRes = await pool.query("SELECT * FROM wallets WHERE is_system = TRUE");
    const sysWallet = sysRes.rows[0];
    if (!sysWallet) {
      return res.status(500).json({ message: "System escrow wallet not found." });
    }

    if (parseFloat(sysWallet.balance) < payAmt) {
      return res.status(400).json({ message: `Insufficient escrow balance. Escrow balance is $${parseFloat(sysWallet.balance).toFixed(2)}.` });
    }

    // Get or create recipient's wallet
    let recipientWalletRes = await pool.query("SELECT * FROM wallets WHERE user_id = $1", [recipient_user_id]);
    let recipientWallet = recipientWalletRes.rows[0];
    if (!recipientWallet) {
      const ins = await pool.query(
        "INSERT INTO wallets (user_id, balance, currency) VALUES ($1, 0.00, 'USD') RETURNING *",
        [recipient_user_id]
      );
      recipientWallet = ins.rows[0];
    }

    // Execute transfer in database transaction
    await pool.query("BEGIN");
    try {
      // 1. Deduct from system wallet
      await pool.query(
        "UPDATE wallets SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = $2",
        [payAmt, sysWallet.wallet_id]
      );

      // 2. Add to recipient wallet
      await pool.query(
        "UPDATE wallets SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = $2",
        [payAmt, recipientWallet.wallet_id]
      );

      // 3. Record transaction log
      await pool.query(
        `INSERT INTO wallet_transactions (sender_wallet_id, receiver_wallet_id, amount, type, status, description)
         VALUES ($1, $2, $3, 'Platform_Payout', 'Completed', $4)`,
        [
          sysWallet.wallet_id,
          recipientWallet.wallet_id,
          payAmt,
          description || "Manual platform wallet release payout"
        ]
      );

      await pool.query("COMMIT");
    } catch (txErr) {
      await pool.query("ROLLBACK");
      throw txErr;
    }

    // Notify recipient of manual platform payout
    try {
      const payNotif = await pool.query(
        `INSERT INTO notifications (user_id, title, message, type, reference_id, target_tab)
         VALUES ($1, 'Funds Received 💰', $2, 'payment_received', $3, 'wallet') RETURNING *`,
        [
          recipient_user_id,
          `You have received a platform payout of $${payAmt.toFixed(2)} from the administrator. Reason: ${description || "Manual platform wallet release payout"}.`,
          recipientWallet.wallet_id.toString()
        ]
      );
      if (req.io && payNotif.rows.length > 0) {
        req.io.to(`user_${recipient_user_id}`).emit("new_notification", payNotif.rows[0]);
      }
    } catch (notifErr) {
      console.error("Error creating payout notification:", notifErr);
    }

    return res.status(200).json({
      message: `Successfully paid $${payAmt.toFixed(2)} to user #${recipient_user_id}.`
    });
  } catch (error) {
    console.error("Error in payToUser admin wallet transfer:", error);
    return res.status(500).json({ message: "Failed to process manual platform payout." });
  }
};

export const getReferralPayouts = async (req, res) => {
  try {
    // Fetch dynamic referral settings from database
    let signupBonusAmt = 2.00;
    let promoterRewardAmt = 10.00;
    try {
      const sRes = await pool.query("SELECT setting_value FROM settings WHERE setting_key = 'referral_settings'");
      if (sRes.rows.length > 0) {
        let val = sRes.rows[0].setting_value;
        if (typeof val === "string") val = JSON.parse(val);
        if (val.signup_bonus !== undefined) signupBonusAmt = parseFloat(val.signup_bonus);
        if (val.referrer_reward !== undefined) promoterRewardAmt = parseFloat(val.referrer_reward);
        else if (val.max_referrer_reward !== undefined) promoterRewardAmt = parseFloat(val.max_referrer_reward);
      }
    } catch (sErr) {
      console.error("Error loading referral settings for payouts:", sErr);
    }

    // Update any auto_sync records that were assigned 5.00 to the real signup_bonus amount
    try {
      await pool.query(`UPDATE referral_payouts SET amount = $1 WHERE amount = 5.00 AND status = 'pending'`, [signupBonusAmt]);
    } catch (e) {}

    // 1. Auto-sync missing referral_payouts records for any existing referred users
    try {
      await pool.query(`
        INSERT INTO referral_payouts (referrer_id, referred_id, amount, status, details)
        SELECT 
          u.referred_by,
          u.user_id,
          $1,
          'pending',
          '{"type":"signup_bonus","trigger":"auto_sync"}'::jsonb
        FROM users u
        WHERE u.referred_by IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM referral_payouts rp WHERE rp.referred_id = u.user_id AND rp.referrer_id = u.referred_by
          )
      `, [signupBonusAmt]);
    } catch (syncErr) {
      console.error("Auto-sync referral payouts error:", syncErr);
    }

    const query = `
      SELECT 
        COALESCE(rp.payout_id, referred.user_id) as payout_id,
        referrer.user_id as referrer_id,
        referred.user_id as referred_id,
        COALESCE(rp.status, 'pending') as status,
        CASE 
          WHEN rp.amount IS NOT NULL AND rp.amount <> 5.00 THEN rp.amount
          WHEN EXISTS (
            SELECT 1 
            FROM wallet_transactions wt
            JOIN wallets w ON (w.wallet_id = wt.sender_wallet_id OR w.wallet_id = wt.receiver_wallet_id)
            WHERE w.user_id = referred.user_id AND wt.status = 'completed'
          ) THEN $2
          ELSE $1
        END as amount,
        COALESCE(rp.created_at, referred.created_at) as created_at,
        COALESCE(rp.details, CASE 
          WHEN EXISTS (
            SELECT 1 
            FROM wallet_transactions wt
            JOIN wallets w ON (w.wallet_id = wt.sender_wallet_id OR w.wallet_id = wt.receiver_wallet_id)
            WHERE w.user_id = referred.user_id AND wt.status = 'completed'
          ) THEN '{"type":"promoter_reward"}'::jsonb
          ELSE '{"type":"signup_bonus"}'::jsonb
        END) as details,
        referrer.first_name || ' ' || COALESCE(referrer.last_name, '') as referrer_name,
        referrer.email as referrer_email,
        referred.first_name || ' ' || COALESCE(referred.last_name, '') as referred_name,
        referred.email as referred_email,
        referred.phone as referred_phone,
        referred.email_verified as referred_email_verified,
        referred.phone_verified as referred_phone_verified,
        -- Check duplicate phone number count
        (
          SELECT COUNT(*) 
          FROM users u2 
          WHERE u2.phone = referred.phone AND u2.user_id <> referred.user_id AND referred.phone IS NOT NULL AND referred.phone <> ''
        ) as duplicate_phone_count,
        -- Check if onboarding completed (freelancer or client)
        (
          COALESCE((SELECT onboarding_completed FROM freelancer_profiles WHERE user_id = referred.user_id), false)
          OR
          COALESCE((SELECT onboarding_completed FROM client_profiles WHERE user_id = referred.user_id), false)
        ) as is_onboarded,
        -- Check if they completed at least one order (as sender or receiver)
        EXISTS (
            SELECT 1 
            FROM wallet_transactions wt
            JOIN wallets w ON (w.wallet_id = wt.sender_wallet_id OR w.wallet_id = wt.receiver_wallet_id)
            WHERE w.user_id = referred.user_id AND wt.status = 'completed'
        ) as has_completed_order,
        -- Check dynamic referral stage
        CASE
          WHEN rp.status = 'approved' THEN 'approved'
          WHEN rp.status = 'rejected' THEN 'rejected'
          WHEN (
            (COALESCE((SELECT onboarding_completed FROM freelancer_profiles WHERE user_id = referred.user_id), false) OR COALESCE((SELECT onboarding_completed FROM client_profiles WHERE user_id = referred.user_id), false))
            AND
            EXISTS (
              SELECT 1 
              FROM wallet_transactions wt
              JOIN wallets w ON (w.wallet_id = wt.sender_wallet_id OR w.wallet_id = wt.receiver_wallet_id)
              WHERE w.user_id = referred.user_id AND wt.status = 'completed'
            )
          ) THEN 'completed'
          WHEN EXISTS (
            SELECT 1 
            FROM wallet_transactions wt
            JOIN wallets w ON (w.wallet_id = wt.sender_wallet_id OR w.wallet_id = wt.receiver_wallet_id)
            WHERE w.user_id = referred.user_id AND wt.status = 'completed'
          ) THEN 'purchased'
          WHEN (
            COALESCE((SELECT onboarding_completed FROM freelancer_profiles WHERE user_id = referred.user_id), false)
            OR
            COALESCE((SELECT onboarding_completed FROM client_profiles WHERE user_id = referred.user_id), false)
          ) THEN 'onboarding_completed'
          ELSE 'pending'
        END as referral_stage
      FROM users referred
      JOIN users referrer ON referred.referred_by = referrer.user_id
      LEFT JOIN referral_payouts rp ON rp.referred_id = referred.user_id AND rp.referrer_id = referred.referred_by
      WHERE referred.referred_by IS NOT NULL
      ORDER BY COALESCE(rp.created_at, referred.created_at) DESC
    `;

    const result = await pool.query(query, [signupBonusAmt, promoterRewardAmt]);
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error in getReferralPayouts:", error);
    return res.status(500).json({ message: "Failed to retrieve referral payout requests." });
  }
};

export const approveReferralPayout = async (req, res) => {
  try {
    const { id } = req.params;
    const payoutId = parseInt(id);

    // Fetch dynamic signup bonus amount for fallback
    let signupBonusAmt = 2.00;
    try {
      const sRes = await pool.query("SELECT setting_value FROM settings WHERE setting_key = 'referral_settings'");
      if (sRes.rows.length > 0) {
        let val = sRes.rows[0].setting_value;
        if (typeof val === "string") val = JSON.parse(val);
        if (val.signup_bonus !== undefined) signupBonusAmt = parseFloat(val.signup_bonus);
      }
    } catch (e) {}

    // 1. Fetch payout request
    let payoutRes = await pool.query("SELECT * FROM referral_payouts WHERE payout_id = $1", [payoutId]);
    if (payoutRes.rows.length === 0) {
      const userCheck = await pool.query("SELECT user_id, referred_by FROM users WHERE user_id = $1 AND referred_by IS NOT NULL", [payoutId]);
      if (userCheck.rows.length > 0) {
        const refUser = userCheck.rows[0];
        const ins = await pool.query(
          `INSERT INTO referral_payouts (referrer_id, referred_id, amount, status, details)
           VALUES ($1, $2, $3, 'pending', '{"type":"signup_bonus"}'::jsonb)
           RETURNING *`,
          [refUser.referred_by, refUser.user_id, signupBonusAmt]
        );
        payoutRes = ins;
      } else {
        return res.status(404).json({ message: "Referral payout request not found." });
      }
    }
    const payout = payoutRes.rows[0];

    if (payout.status !== "pending") {
      return res.status(400).json({ message: `Referral payout has already been ${payout.status}.` });
    }

    const payAmt = parseFloat(payout.amount);
    const referrerId = payout.referrer_id;
    const referredUserId = payout.referred_id;

    // Check payout type in details
    let isSignupBonus = false;
    try {
      const details = typeof payout.details === "string" ? JSON.parse(payout.details) : (payout.details || {});
      if (details.type === "signup_bonus") {
        isSignupBonus = true;
      }
    } catch (e) {}

    // Enforce eligibility criteria before approval
    const eligibilityQuery = await pool.query(`
      SELECT 
        (COALESCE((SELECT onboarding_completed FROM freelancer_profiles WHERE user_id = $1), false) OR COALESCE((SELECT onboarding_completed FROM client_profiles WHERE user_id = $1), false)) as is_onboarded,
        EXISTS (
          SELECT 1 FROM wallet_transactions wt
          JOIN wallets w ON (w.wallet_id = wt.sender_wallet_id OR w.wallet_id = wt.receiver_wallet_id)
          WHERE w.user_id = $1 AND wt.status = 'completed'
        ) as has_purchased
    `, [referredUserId]);

    const { is_onboarded, has_purchased } = eligibilityQuery.rows[0];

    if (isSignupBonus) {
      if (!is_onboarded) {
        return res.status(400).json({ 
          message: "Cannot approve. Referred user must complete their profile onboarding first." 
        });
      }
    } else {
      if (!is_onboarded || !has_purchased) {
        return res.status(400).json({ 
          message: `Cannot approve. Referred user must complete both profile onboarding and make at least one purchase. (Onboarded: ${is_onboarded ? 'Yes' : 'No'}, Purchased: ${has_purchased ? 'Yes' : 'No'})` 
        });
      }
    }

    const recipientUserId = isSignupBonus ? referredUserId : referrerId;

    // 2. Fetch or create recipient's wallet
    let recipientWalletRes = await pool.query("SELECT * FROM wallets WHERE user_id = $1", [recipientUserId]);
    let recipientWallet = recipientWalletRes.rows[0];
    if (!recipientWallet) {
      const ins = await pool.query(
        "INSERT INTO wallets (user_id, balance, currency) VALUES ($1, 0.00, 'USD') RETURNING *",
        [recipientUserId]
      );
      recipientWallet = ins.rows[0];
    }

    // 3. Fetch system wallet
    const sysWalletRes = await pool.query("SELECT * FROM wallets WHERE is_system = TRUE");
    const sysWallet = sysWalletRes.rows[0];
    if (!sysWallet) {
      return res.status(500).json({ message: "System wallet not found." });
    }

    if (parseFloat(sysWallet.balance) < payAmt) {
      return res.status(400).json({ message: `Insufficient system escrow balance. System balance is $${parseFloat(sysWallet.balance).toFixed(2)}.` });
    }

    // Execute transfer in database transaction
    await pool.query("BEGIN");
    try {
      // a. Deduct from system wallet
      await pool.query(
        "UPDATE wallets SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = $2",
        [payAmt, sysWallet.wallet_id]
      );

      // b. Add to recipient wallet
      await pool.query(
        "UPDATE wallets SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = $2",
        [payAmt, recipientWallet.wallet_id]
      );

      // c. Record transaction log
      const txType = isSignupBonus ? 'referral_signup_bonus' : 'referral_bonus';
      const txDesc = isSignupBonus 
        ? `Referral sign-up bonus reward`
        : `Referral reward for user_id = ${referredUserId}`;

      await pool.query(
        `INSERT INTO wallet_transactions (sender_wallet_id, receiver_wallet_id, amount, type, status, description)
         VALUES ($1, $2, $3, $4, 'completed', $5)`,
        [
          sysWallet.wallet_id,
          recipientWallet.wallet_id,
          payAmt,
          txType,
          txDesc
        ]
      );

      // d. Update payout status in referral_payouts
      await pool.query(
        "UPDATE referral_payouts SET status = 'approved', updated_at = CURRENT_TIMESTAMP WHERE payout_id = $1",
        [payoutId]
      );

      await pool.query("COMMIT");

      // e. Dispatch notification
      try {
        const { default: Notification } = await import("../../../models/notificationModel.js");
        const title = isSignupBonus ? "Sign-up Bonus Released! 🎁" : "Referral Reward Approved! 💰";
        const message = isSignupBonus
          ? `Your referral sign-up bonus of $${payAmt.toFixed(2)} has been approved and credited to your wallet.`
          : `Your referral reward payout of $${payAmt.toFixed(2)} has been approved and credited to your wallet.`;

        const notif = await Notification.create({
          userId: recipientUserId,
          title,
          message,
          type: isSignupBonus ? "signup_bonus" : "referral",
          referenceId: payoutId.toString(),
          targetTab: "wallet"
        });

        if (req.io) {
          req.io.to(`user_${recipientUserId}`).emit("new_notification", notif);
          req.io.to(`user_${recipientUserId}`).emit("wallet_balance_updated", { amount: payAmt });
        }
      } catch (notifErr) {
        console.error("Failed to send referral payout notification:", notifErr);
      }

    } catch (txErr) {
      await pool.query("ROLLBACK");
      throw txErr;
    }

    return res.status(200).json({
      message: isSignupBonus
        ? `Successfully approved referral sign-up bonus of $${payAmt.toFixed(2)} to user #${recipientUserId}.`
        : `Successfully approved referral payout of $${payAmt.toFixed(2)} to referrer #${recipientUserId}.`
    });
  } catch (error) {
    console.error("Error in approveReferralPayout:", error);
    return res.status(500).json({ message: "Failed to approve referral payout." });
  }
};

export const rejectReferralPayout = async (req, res) => {
  try {
    const { id } = req.params;
    const payoutId = parseInt(id);

    // 1. Fetch payout request
    const payoutRes = await pool.query("SELECT * FROM referral_payouts WHERE payout_id = $1", [payoutId]);
    if (payoutRes.rows.length === 0) {
      return res.status(404).json({ message: "Referral payout request not found." });
    }
    const payout = payoutRes.rows[0];

    if (payout.status !== "pending") {
      return res.status(400).json({ message: `Referral payout has already been ${payout.status}.` });
    }

    // Update status to rejected
    await pool.query(
      "UPDATE referral_payouts SET status = 'rejected', updated_at = CURRENT_TIMESTAMP WHERE payout_id = $1",
      [payoutId]
    );

    // Dispatch rejection notification to user
    try {
      const { default: Notification } = await import("../../../models/notificationModel.js");
      let details = {};
      try { details = typeof payout.details === "string" ? JSON.parse(payout.details) : (payout.details || {}); } catch(e) {}
      const isSignup = details.type === "signup_bonus";
      const targetUserId = isSignup ? payout.referred_id : payout.referrer_id;
      
      const notif = await Notification.create({
        userId: targetUserId,
        title: isSignup ? "❌ Sign-up Bonus Declined" : "❌ Referral Reward Declined",
        message: isSignup 
          ? `Your $${parseFloat(payout.amount).toFixed(2)} Sign-up bonus request was reviewed and declined by admin.`
          : `Your referral reward payout request of $${parseFloat(payout.amount).toFixed(2)} was reviewed and declined by admin.`,
        type: isSignup ? "signup_bonus" : "referral",
        referenceId: payoutId.toString(),
        targetTab: "wallet"
      });

      if (req.io) {
        req.io.to(`user_${targetUserId}`).emit("new_notification", notif);
      }
    } catch (notifErr) {
      console.error("Error creating rejection notification:", notifErr);
    }

    return res.status(200).json({
      message: "Referral payout request rejected successfully."
    });
  } catch (error) {
    console.error("Error in rejectReferralPayout:", error);
    return res.status(500).json({ message: "Failed to reject referral payout." });
  }
};

export const getAdminAffiliateCommissions = async (req, res) => {
  try {
    const query = `
      SELECT 
        ac.commission_id,
        ac.affiliate_id,
        ac.referred_user_id,
        ac.transaction_id,
        ac.amount,
        ac.platform_fee,
        ac.status,
        ac.created_at,
        affiliate.first_name || ' ' || COALESCE(affiliate.last_name, '') as affiliate_name,
        affiliate.email as affiliate_email,
        referred.first_name || ' ' || COALESCE(referred.last_name, '') as referred_name,
        referred.email as referred_email
      FROM affiliate_commissions ac
      JOIN users affiliate ON ac.affiliate_id = affiliate.user_id
      JOIN users referred ON ac.referred_user_id = referred.user_id
      ORDER BY ac.created_at DESC
    `;

    const result = await pool.query(query);
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error in getAdminAffiliateCommissions:", error);
    return res.status(500).json({ message: "Failed to retrieve affiliate commissions ledger." });
  }
};

export const approveAffiliateCommission = async (req, res) => {
  try {
    const { id } = req.params;
    const commissionId = parseInt(id);

    // 1. Fetch commission row
    const commissionRes = await pool.query("SELECT * FROM affiliate_commissions WHERE commission_id = $1", [commissionId]);
    if (commissionRes.rows.length === 0) {
      return res.status(404).json({ message: "Affiliate commission request not found." });
    }
    const commission = commissionRes.rows[0];

    if (commission.status !== "pending") {
      return res.status(400).json({ message: `Commission has already been ${commission.status}.` });
    }

    const payAmt = parseFloat(commission.amount);
    const affiliateId = commission.affiliate_id;

    // 2. Fetch or create affiliate's wallet
    let affiliateWalletRes = await pool.query("SELECT * FROM wallets WHERE user_id = $1", [affiliateId]);
    let affiliateWallet = affiliateWalletRes.rows[0];
    if (!affiliateWallet) {
      const ins = await pool.query(
        "INSERT INTO wallets (user_id, balance, currency) VALUES ($1, 0.00, 'USD') RETURNING *",
        [affiliateId]
      );
      affiliateWallet = ins.rows[0];
    }

    // 3. Fetch system wallet
    const sysWalletRes = await pool.query("SELECT * FROM wallets WHERE is_system = TRUE");
    const sysWallet = sysWalletRes.rows[0];
    if (!sysWallet) {
      return res.status(500).json({ message: "System wallet not found." });
    }

    if (parseFloat(sysWallet.balance) < payAmt) {
      return res.status(400).json({ message: `Insufficient system escrow balance. System balance is $${parseFloat(sysWallet.balance).toFixed(2)}.` });
    }

    // Execute transfer in database transaction
    await pool.query("BEGIN");
    try {
      // a. Deduct from system wallet
      await pool.query(
        "UPDATE wallets SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = $2",
        [payAmt, sysWallet.wallet_id]
      );

      // b. Add to affiliate wallet
      await pool.query(
        "UPDATE wallets SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = $2",
        [payAmt, affiliateWallet.wallet_id]
      );

      // c. Record transaction log
      const descriptionMatch = `Affiliate commission reward for commission_id = ${commissionId}`;
      await pool.query(
        `INSERT INTO wallet_transactions (sender_wallet_id, receiver_wallet_id, amount, type, status, description)
         VALUES ($1, $2, $3, 'affiliate_commission', 'completed', $4)`,
        [
          sysWallet.wallet_id,
          affiliateWallet.wallet_id,
          payAmt,
          descriptionMatch
        ]
      );

      // d. Update status in affiliate_commissions
      await pool.query(
        "UPDATE affiliate_commissions SET status = 'approved', updated_at = CURRENT_TIMESTAMP WHERE commission_id = $1",
        [commissionId]
      );

      await pool.query("COMMIT");
    } catch (txErr) {
      await pool.query("ROLLBACK");
      throw txErr;
    }

    return res.status(200).json({
      message: `Successfully approved affiliate commission of $${payAmt.toFixed(2)} to affiliate #${affiliateId}.`
    });
  } catch (error) {
    console.error("Error in approveAffiliateCommission:", error);
    return res.status(500).json({ message: "Failed to approve affiliate commission." });
  }
};

export const rejectAffiliateCommission = async (req, res) => {
  try {
    const { id } = req.params;
    const commissionId = parseInt(id);

    // 1. Fetch commission row
    const commissionRes = await pool.query("SELECT * FROM affiliate_commissions WHERE commission_id = $1", [commissionId]);
    if (commissionRes.rows.length === 0) {
      return res.status(404).json({ message: "Affiliate commission request not found." });
    }
    const commission = commissionRes.rows[0];

    if (commission.status !== "pending") {
      return res.status(400).json({ message: `Commission has already been ${commission.status}.` });
    }

    // Update status to rejected
    await pool.query(
      "UPDATE affiliate_commissions SET status = 'rejected', updated_at = CURRENT_TIMESTAMP WHERE commission_id = $1",
      [commissionId]
    );

    return res.status(200).json({
      message: "Affiliate commission rejected successfully."
    });
  } catch (error) {
    console.error("Error in rejectAffiliateCommission:", error);
    return res.status(500).json({ message: "Failed to reject affiliate commission." });
  }
};
