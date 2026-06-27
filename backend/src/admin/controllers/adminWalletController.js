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
        u.role,
        (u.freelancer_onboarding OR u.client_onboarding) AS is_onboarded
      FROM wallets w
      LEFT JOIN users u ON w.user_id = u.user_id
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
