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

    // Fetch system wallet to verify balance
    const sysWalletRes = await pool.query("SELECT * FROM wallets WHERE is_system = TRUE");
    const sysWallet = sysWalletRes.rows[0];
    if (!sysWallet) {
      return res.status(500).json({ message: "System escrow wallet not found." });
    }

    if (parseFloat(sysWallet.balance) < amount) {
      return res.status(400).json({ message: `Insufficient system escrow balance. System balance is $${parseFloat(sysWallet.balance).toFixed(2)}.` });
    }

    // Update withdrawal request status
    await pool.query(
      "UPDATE withdrawal_requests SET status = 'Approved', updated_at = CURRENT_TIMESTAMP WHERE request_id = $1",
      [requestId]
    );

    // Deduct payout amount from system/escrow wallet balance
    await pool.query(
      "UPDATE wallets SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE is_system = TRUE",
      [amount]
    );

    // Update wallet transaction log status from Pending to Completed
    await pool.query(
      `UPDATE wallet_transactions 
       SET status = 'Completed' 
       WHERE sender_wallet_id = $1 AND amount = $2 AND type = 'Withdrawal_Request' AND status = 'Pending'`,
      [request.wallet_id, amount]
    );

    return res.status(200).json({ message: "Withdrawal request approved and processed successfully." });
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

    // Update withdrawal request status
    await pool.query(
      "UPDATE withdrawal_requests SET status = 'Rejected', updated_at = CURRENT_TIMESTAMP WHERE request_id = $1",
      [requestId]
    );

    // Restore the amount back to user's wallet
    await pool.query(
      "UPDATE wallets SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = $2",
      [amount, request.wallet_id]
    );

    // Update wallet transaction log status to Rejected
    await pool.query(
      `UPDATE wallet_transactions 
       SET status = 'Rejected' 
       WHERE sender_wallet_id = $1 AND amount = $2 AND type = 'Withdrawal_Request' AND status = 'Pending'`,
      [request.wallet_id, amount]
    );

    return res.status(200).json({ message: "Withdrawal request rejected. Funds returned to user's wallet." });
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
    const query = `
      SELECT 
        rp.payout_id,
        rp.referrer_id,
        rp.referred_id,
        rp.status,
        rp.amount,
        rp.created_at,
        rp.details,
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
        -- Check if they completed at least one order
        EXISTS (
            SELECT 1 
            FROM wallet_transactions wt
            JOIN wallets w ON w.wallet_id = wt.sender_wallet_id
            WHERE w.user_id = referred.user_id AND wt.status = 'completed'
        ) as has_completed_order
      FROM referral_payouts rp
      JOIN users referrer ON rp.referrer_id = referrer.user_id
      JOIN users referred ON rp.referred_id = referred.user_id
      ORDER BY rp.created_at DESC
    `;

    const result = await pool.query(query);
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

    // 1. Fetch payout request
    const payoutRes = await pool.query("SELECT * FROM referral_payouts WHERE payout_id = $1", [payoutId]);
    if (payoutRes.rows.length === 0) {
      return res.status(404).json({ message: "Referral payout request not found." });
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
          type: "payment",
          referenceId: payoutId.toString()
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
