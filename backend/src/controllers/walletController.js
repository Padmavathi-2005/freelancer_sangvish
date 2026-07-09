import pool from "../config/db.js";

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

    // Get withdrawal requests
    const withdrawalsQuery = `
      SELECT * FROM withdrawal_requests
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;
    const withdrawalsRes = await pool.query(withdrawalsQuery, [userId]);

    return res.status(200).json({
      wallet,
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

    if (parseFloat(wallet.balance) < withdrawAmt) {
      return res.status(400).json({ message: "Insufficient wallet balance." });
    }

    // Deduct balance from user wallet
    const deductQuery = `
      UPDATE wallets
      SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP
      WHERE wallet_id = $2
      RETURNING *
    `;
    const deductRes = await pool.query(deductQuery, [withdrawAmt, wallet.wallet_id]);

    // Create withdrawal request
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

    // Record wallet transaction
    const transactionQuery = `
      INSERT INTO wallet_transactions (sender_wallet_id, receiver_wallet_id, amount, type, status, description)
      VALUES ($1, NULL, $2, 'Withdrawal_Request', 'Pending', $3)
    `;
    const description = `Withdrawal request via ${paymentMethod}`;
    await pool.query(transactionQuery, [wallet.wallet_id, withdrawAmt, description]);

    return res.status(201).json({
      message: "Withdrawal request submitted successfully.",
      wallet: deductRes.rows[0],
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
    const { amount } = req.body;

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
      VALUES (NULL, $1, $2, 'Deposit', 'Completed', 'Simulated account deposit')
    `;
    await pool.query(transactionQuery, [wallet.wallet_id, depositAmt]);

    return res.status(200).json({
      message: "Funds deposited successfully.",
      wallet: depositRes.rows[0]
    });
  } catch (error) {
    console.error("Error in depositFunds:", error);
    return res.status(500).json({ message: "Failed to deposit funds." });
  }
};
