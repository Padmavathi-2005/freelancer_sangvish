import pool from "../config/db.js";
import MessageModel from "../models/messageModel.js";
import Notification from "../models/notificationModel.js";

/**
 * Re-evaluates a job's Open/Closed status based on how many non-cancelled
 * contracts currently exist vs. the job's num_freelancers hiring limit.
 * Called after a dispute cancels a single contract so that multi-hire jobs
 * re-open a slot without affecting other active freelancers on the same job.
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


// Helper to push system messages into chat
const postSystemChatMessage = async (io, conversationId, senderId, payload) => {
  try {
    const messageJson = JSON.stringify(payload);
    const message = await MessageModel.createMessage(conversationId, senderId, messageJson);

    // Fetch sender info
    const senderRes = await pool.query(
      "SELECT first_name || ' ' || last_name as sender_name, profile_image as sender_profile_image FROM users WHERE user_id = $1",
      [senderId]
    );
    const sender = senderRes.rows[0];

    const chatMessage = {
      ...message,
      sender_name: sender ? sender.sender_name : "System",
      sender_profile_image: sender ? sender.sender_profile_image : null
    };

    // Get recipients
    const convRes = await pool.query(
      "SELECT user_one_id, user_two_id, admin_id FROM conversations WHERE conversation_id = $1",
      [conversationId]
    );
    if (convRes.rows.length > 0) {
      const { user_one_id, user_two_id, admin_id } = convRes.rows[0];
      const recipients = [user_one_id, user_two_id];
      if (admin_id) recipients.push(admin_id);

      for (const rId of recipients) {
        if (io) {
          io.to(`user_${rId}`).emit("new_message", chatMessage);
        }
      }
    }
    return chatMessage;
  } catch (err) {
    console.error("Failed to post system chat message:", err);
  }
};

// 1. OPEN DISPUTE
export const openDispute = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const contractId = parseInt(req.params.id);
    const { reason, description } = req.body;

    if (!reason || !description) {
      return res.status(400).json({ message: "Reason and description are required." });
    }

    // Fetch contract
    const contractRes = await pool.query("SELECT * FROM contracts WHERE contract_id = $1", [contractId]);
    if (contractRes.rows.length === 0) {
      return res.status(404).json({ message: "Contract not found." });
    }
    const contract = contractRes.rows[0];

    const isClient = contract.client_id === userId;
    const isFreelancer = contract.freelancer_id === userId;

    if (!isClient && !isFreelancer) {
      return res.status(403).json({ message: "Access denied. Only contract participants can raise a dispute." });
    }

    const raisedBy = isClient ? "client" : "freelancer";
    const opponentId = isClient ? contract.freelancer_id : contract.client_id;

    // Allowed statuses for dispute
    const allowedStatuses = ["In Progress", "Work Started", "Work Completed", "Under Review"];
    if (!allowedStatuses.includes(contract.status)) {
      return res.status(400).json({ message: "A dispute can only be opened on active or submitted contracts." });
    }

    // Get or create conversation between client and freelancer
    let conv = await MessageModel.checkConversationExists(contract.client_id, contract.freelancer_id);
    if (!conv) {
      conv = await MessageModel.createConversation(contract.client_id, contract.freelancer_id);
    }
    const conversationId = conv.conversation_id;

    await pool.query("BEGIN");
    try {
      // Create dispute record
      const disputeRes = await pool.query(
        `INSERT INTO disputes (contract_id, client_id, freelancer_id, conversation_id, status, reason, description, raised_by)
         VALUES ($1, $2, $3, $4, 'Open', $5, $6, $7)
         RETURNING *`,
        [contractId, contract.client_id, contract.freelancer_id, conversationId, reason, description, raisedBy]
      );
      const dispute = disputeRes.rows[0];

      // Update contract status to Disputed
      await pool.query(
        "UPDATE contracts SET status = 'Disputed', disputed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE contract_id = $1",
        [contractId]
      );

      await pool.query("COMMIT");

      // Post system chat message
      const payload = {
        isDispute: true,
        type: "dispute_opened",
        dispute_id: dispute.dispute_id,
        sender_id: userId,
        reason,
        description,
        status: "Open",
        budget: parseFloat(contract.budget),
        raised_by: raisedBy
      };
      await postSystemChatMessage(req.io, conversationId, userId, payload);

      // Notify opponent
      try {
        await Notification.create({
          userId: opponentId,
          title: "Contract Disputed",
          message: `${isClient ? "Client" : "Freelancer"} has raised a dispute on contract "${contract.title}". Check your chat for details.`,
          type: "system",
          referenceId: contractId.toString()
        });
      } catch (nErr) {}

      return res.status(201).json({ message: "Dispute opened successfully.", dispute });
    } catch (txErr) {
      await pool.query("ROLLBACK");
      throw txErr;
    }
  } catch (err) {
    console.error("Open dispute error:", err);
    return res.status(500).json({ message: err.message || "Failed to open dispute." });
  }
};

// 2. RESPOND TO DISPUTE
export const respondToDispute = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const disputeId = parseInt(req.params.id);
    const { action, explanation } = req.body; // 'Accept' or 'Contest'

    if (!action || !['Accept', 'Contest'].includes(action)) {
      return res.status(400).json({ message: "Action must be 'Accept' or 'Contest'." });
    }

    const disputeRes = await pool.query("SELECT * FROM disputes WHERE dispute_id = $1", [disputeId]);
    if (disputeRes.rows.length === 0) {
      return res.status(404).json({ message: "Dispute not found." });
    }
    const dispute = disputeRes.rows[0];

    const isFreelancer = dispute.freelancer_id === userId;
    const isClient = dispute.client_id === userId;

    if (!isFreelancer && !isClient) {
      return res.status(403).json({ message: "Access denied. You are not a participant in this dispute." });
    }

    const responderRole = isClient ? 'client' : 'freelancer';
    const raisedByRole = dispute.raised_by || 'client';

    if (responderRole === raisedByRole) {
      return res.status(403).json({ message: "Access denied. You cannot respond to a dispute you raised." });
    }

    if (dispute.status !== "Open") {
      return res.status(400).json({ message: "Dispute has already been updated or resolved." });
    }

    const contractRes = await pool.query("SELECT * FROM contracts WHERE contract_id = $1", [dispute.contract_id]);
    const contract = contractRes.rows[0];
    const budget = parseFloat(contract.budget);

    const sysRes = await pool.query("SELECT * FROM wallets WHERE is_system = TRUE");
    const sysWallet = sysRes.rows[0];

    if (action === "Accept") {
      await pool.query("BEGIN");
      try {
        if (raisedByRole === "client") {
          // Client raised it (wants refund), Freelancer accepts -> Refund Client
          const clientWalletRes = await pool.query("SELECT * FROM wallets WHERE user_id = $1", [dispute.client_id]);
          const clientWallet = clientWalletRes.rows[0];

          await pool.query("UPDATE wallets SET balance = balance - $1 WHERE wallet_id = $2", [budget, sysWallet.wallet_id]);
          await pool.query("UPDATE wallets SET balance = balance + $1 WHERE wallet_id = $2", [budget, clientWallet.wallet_id]);

          await pool.query(
            `INSERT INTO wallet_transactions (sender_wallet_id, receiver_wallet_id, amount, type, status, description)
             VALUES ($1, $2, $3, 'Transfer', 'Completed', $4)`,
            [sysWallet.wallet_id, clientWallet.wallet_id, budget, `Refund from dispute resolution: ${contract.title}`]
          );

          await pool.query("UPDATE contracts SET status = 'Cancelled', progress = 0, updated_at = NOW() WHERE contract_id = $1", [contract.contract_id]);
          await pool.query("UPDATE contract_milestones SET status = 'Cancelled', payment_status = 'Refunded' WHERE contract_id = $1", [contract.contract_id]);
          
          const proposalIdToCancel = contract.application_id || (await pool.query(
            "SELECT proposal_id FROM proposals WHERE job_id = $1 AND freelancer_id = $2 AND status = 'Accepted'",
            [contract.job_id, contract.freelancer_id]
          )).rows[0]?.proposal_id;

          if (proposalIdToCancel) {
            await pool.query("UPDATE proposals SET status = 'Cancelled', updated_at = NOW() WHERE proposal_id = $1", [proposalIdToCancel]);
          }

          await pool.query(
            "UPDATE disputes SET status = 'Resolved', resolution_type = 'Buyer_Won', resolved_at = NOW(), resolution_details = $1 WHERE dispute_id = $2",
            ["Freelancer accepted refund request.", disputeId]
          );

          await pool.query("COMMIT");

          // Re-open job slot if this was a multi-hire job and a slot just freed up
          await recalculateJobStatus(contract.job_id);

          if (req.io && proposalIdToCancel) {
            req.io.to(`user_${contract.freelancer_id}`).emit("proposal_status_updated", {
              proposal_id: proposalIdToCancel,
              status: "Cancelled"
            });
          }

          const payload = {
            isDispute: true,
            type: "dispute_resolved",
            dispute_id: disputeId,
            verdict: "Buyer Wins",
            details: "Freelancer accepted the refund request. Entire escrow amount has been returned to client."
          };
          await postSystemChatMessage(req.io, dispute.conversation_id, userId, payload);

          return res.json({ message: "Refund accepted and contract cancelled." });
        } else {
          // Freelancer raised it (wants payout), Client accepts -> Release to Freelancer
          let freelancerWalletRes = await pool.query("SELECT * FROM wallets WHERE user_id = $1", [dispute.freelancer_id]);
          let freelancerWallet = freelancerWalletRes.rows[0];
          if (!freelancerWallet) {
            const ins = await pool.query("INSERT INTO wallets (user_id, balance, currency) VALUES ($1, 0.00, 'USD') RETURNING *", [dispute.freelancer_id]);
            freelancerWallet = ins.rows[0];
          }

          await pool.query("UPDATE wallets SET balance = balance - $1 WHERE wallet_id = $2", [budget, sysWallet.wallet_id]);
          await pool.query("UPDATE wallets SET balance = balance + $1 WHERE wallet_id = $2", [budget, freelancerWallet.wallet_id]);

          await pool.query(
            `INSERT INTO wallet_transactions (sender_wallet_id, receiver_wallet_id, amount, type, status, description)
             VALUES ($1, $2, $3, 'Milestone_Release', 'Completed', $4)`,
            [sysWallet.wallet_id, freelancerWallet.wallet_id, budget, `Payout from dispute resolution: ${contract.title}`]
          );

          await pool.query("UPDATE contracts SET status = 'Completed', progress = 100, updated_at = NOW() WHERE contract_id = $1", [contract.contract_id]);
          await pool.query("UPDATE contract_milestones SET status = 'Completed', payment_status = 'Paid' WHERE contract_id = $1", [contract.contract_id]);

          await pool.query(
            "UPDATE disputes SET status = 'Resolved', resolution_type = 'Seller_Won', resolved_at = NOW(), resolution_details = $1 WHERE dispute_id = $2",
            ["Client accepted the payout release request.", disputeId]
          );

          await pool.query("COMMIT");

          const payload = {
            isDispute: true,
            type: "dispute_resolved",
            dispute_id: disputeId,
            verdict: "Seller Wins",
            details: "Client accepted the payout release request. Entire escrow budget has been released to freelancer."
          };
          await postSystemChatMessage(req.io, dispute.conversation_id, userId, payload);

          return res.json({ message: "Payout release accepted and contract completed." });
        }
      } catch (txErr) {
        await pool.query("ROLLBACK");
        throw txErr;
      }
    } else {
      // Contesting the dispute
      if (!explanation || !explanation.trim()) {
        return res.status(400).json({ message: "Explanation is required to contest dispute." });
      }

      await pool.query(
        "UPDATE disputes SET status = 'Contested', updated_at = NOW() WHERE dispute_id = $1",
        [disputeId]
      );

      // Post contested chat card
      const payload = {
        isDispute: true,
        type: "dispute_contested",
        dispute_id: disputeId,
        sender_id: userId,
        explanation
      };
      await postSystemChatMessage(req.io, dispute.conversation_id, userId, payload);

      return res.json({ message: "Dispute contested successfully." });
    }
  } catch (err) {
    console.error("Respond dispute error:", err);
    return res.status(500).json({ message: err.message || "Failed to respond." });
  }
};

// 3. PROPOSE SETTLEMENT
export const proposeSettlement = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const disputeId = parseInt(req.params.id);
    const { client_refund_percent } = req.body;

    if (client_refund_percent === undefined || isNaN(client_refund_percent) || client_refund_percent < 0 || client_refund_percent > 100) {
      return res.status(400).json({ message: "A valid split percentage between 0 and 100 is required." });
    }

    const disputeRes = await pool.query("SELECT * FROM disputes WHERE dispute_id = $1", [disputeId]);
    if (disputeRes.rows.length === 0) {
      return res.status(404).json({ message: "Dispute not found." });
    }
    const dispute = disputeRes.rows[0];

    if (dispute.client_id !== userId && dispute.freelancer_id !== userId) {
      return res.status(403).json({ message: "Access denied." });
    }

    await pool.query(
      "UPDATE disputes SET status = 'Pending_Settlement', updated_at = NOW() WHERE dispute_id = $1",
      [disputeId]
    );

    const payload = {
      isDispute: true,
      type: "settlement_proposed",
      dispute_id: disputeId,
      proposer_id: userId,
      client_refund_percent: parseFloat(client_refund_percent),
      freelancer_pay_percent: 100.0 - parseFloat(client_refund_percent)
    };
    await postSystemChatMessage(req.io, dispute.conversation_id, userId, payload);

    return res.json({ message: "Settlement proposal posted." });
  } catch (err) {
    console.error("Propose settlement error:", err);
    return res.status(500).json({ message: err.message || "Failed to propose settlement." });
  }
};

// 4. ACCEPT SETTLEMENT
export const acceptSettlement = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const disputeId = parseInt(req.params.id);
    const { client_refund_percent } = req.body; // Agreed percentage passed in acceptance body

    if (client_refund_percent === undefined || isNaN(client_refund_percent)) {
      return res.status(400).json({ message: "Refund percentage split is required." });
    }

    const disputeRes = await pool.query("SELECT * FROM disputes WHERE dispute_id = $1", [disputeId]);
    if (disputeRes.rows.length === 0) {
      return res.status(404).json({ message: "Dispute not found." });
    }
    const dispute = disputeRes.rows[0];

    if (dispute.client_id !== userId && dispute.freelancer_id !== userId) {
      return res.status(403).json({ message: "Access denied." });
    }

    const contractRes = await pool.query("SELECT * FROM contracts WHERE contract_id = $1", [dispute.contract_id]);
    const contract = contractRes.rows[0];
    const budget = parseFloat(contract.budget);

    const clientRefund = budget * (client_refund_percent / 100);
    const freelancerPayout = budget - clientRefund;

    const sysRes = await pool.query("SELECT * FROM wallets WHERE is_system = TRUE");
    const sysWallet = sysRes.rows[0];
    const clientWalletRes = await pool.query("SELECT * FROM wallets WHERE user_id = $1", [dispute.client_id]);
    const clientWallet = clientWalletRes.rows[0];
    let freelancerWalletRes = await pool.query("SELECT * FROM wallets WHERE user_id = $1", [dispute.freelancer_id]);
    let freelancerWallet = freelancerWalletRes.rows[0];

    // platform fee commission calculation on freelancer's payout portion
    const commissionPercent = 0.00;
    const commissionAmount = 0.00;
    const freelancerNet = freelancerPayout;

    await pool.query("BEGIN");
    try {
      // Debit escrow wallet
      await pool.query("UPDATE wallets SET balance = balance - $1 WHERE wallet_id = $2", [budget, sysWallet.wallet_id]);

      // Credit client
      await pool.query("UPDATE wallets SET balance = balance + $1 WHERE wallet_id = $2", [clientRefund, clientWallet.wallet_id]);

      // Credit freelancer (if any)
      if (freelancerNet > 0) {
        if (!freelancerWallet) {
          const ins = await pool.query("INSERT INTO wallets (user_id, balance, currency) VALUES ($1, 0.00, 'USD') RETURNING *", [dispute.freelancer_id]);
          freelancerWallet = ins.rows[0];
        }
        await pool.query("UPDATE wallets SET balance = balance + $1 WHERE wallet_id = $2", [freelancerNet, freelancerWallet.wallet_id]);
      }

      // Record client refund transfer
      await pool.query(
        `INSERT INTO wallet_transactions (sender_wallet_id, receiver_wallet_id, amount, type, status, description)
         VALUES ($1, $2, $3, 'Transfer', 'Completed', $4)`,
        [sysWallet.wallet_id, clientWallet.wallet_id, clientRefund, `Escrow refund split (dispute resolution): ${contract.title}`]
      );

      // Record freelancer split release
      if (freelancerPayout > 0 && freelancerWallet) {
        await pool.query(
          `INSERT INTO wallet_transactions (sender_wallet_id, receiver_wallet_id, amount, commission_amount, type, status, description)
           VALUES ($1, $2, $3, $4, 'Milestone_Release', 'Completed', $5)`,
          [sysWallet.wallet_id, freelancerWallet.wallet_id, freelancerNet, commissionAmount, `Split payout (dispute resolution): ${contract.title}`]
        );
      }

      // Update contract and milestones status
      await pool.query("UPDATE contracts SET status = 'Completed', progress = 100, updated_at = NOW() WHERE contract_id = $1", [contract.contract_id]);
      await pool.query("UPDATE contract_milestones SET status = 'Completed', payment_status = 'Paid' WHERE contract_id = $1", [contract.contract_id]);

      // Update dispute status
      await pool.query(
        "UPDATE disputes SET status = 'Resolved', resolution_type = 'Partial_Refund', resolved_at = NOW(), resolution_details = $1 WHERE dispute_id = $2",
        [`Agreed settlement split: Client receives ${client_refund_percent}%, Freelancer receives ${100 - client_refund_percent}%.`, disputeId]
      );

      await pool.query("COMMIT");

      // Post resolved chat card
      const payload = {
        isDispute: true,
        type: "dispute_resolved",
        dispute_id: disputeId,
        verdict: "Resolved - Partial Split",
        details: `Mutual settlement accepted. Client refunded ${client_refund_percent}% ($${clientRefund.toFixed(2)}). Freelancer paid ${100 - client_refund_percent}% ($${freelancerPayout.toFixed(2)}) and received a net amount of $${freelancerNet.toFixed(2)}.`
      };
      await postSystemChatMessage(req.io, dispute.conversation_id, userId, payload);

      return res.json({ message: "Mutual settlement executed successfully." });
    } catch (txErr) {
      await pool.query("ROLLBACK");
      throw txErr;
    }
  } catch (err) {
    console.error("Accept settlement split error:", err);
    return res.status(500).json({ message: err.message || "Failed to execute split settlement." });
  }
};

// 5. ESCALATE DISPUTE TO ADMIN
export const escalateDispute = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const disputeId = parseInt(req.params.id);

    const disputeRes = await pool.query("SELECT * FROM disputes WHERE dispute_id = $1", [disputeId]);
    if (disputeRes.rows.length === 0) {
      return res.status(404).json({ message: "Dispute not found." });
    }
    const dispute = disputeRes.rows[0];

    if (dispute.client_id !== userId && dispute.freelancer_id !== userId) {
      return res.status(403).json({ message: "Access denied." });
    }

    // Get Admin User ID from users table
    const adminUserRes = await pool.query(
      "SELECT user_id FROM users WHERE email = 'admin@lancerflow.com' OR first_name ILIKE '%admin%' LIMIT 1"
    );
    let adminUserId = adminUserRes.rows[0]?.user_id;

    if (!adminUserId) {
      const adminRecord = await pool.query("SELECT * FROM admins LIMIT 1");
      if (adminRecord.rows.length > 0) {
        const name = adminRecord.rows[0].full_name;
        const email = adminRecord.rows[0].email;
        const insertUser = await pool.query(
          "INSERT INTO users (first_name, email, password_hash) VALUES ($1, $2, $3) RETURNING user_id",
          [name, email, "ADMIN_VIRTUAL_HASH"]
        );
        adminUserId = insertUser.rows[0].user_id;
      } else {
        return res.status(500).json({ message: "Mediating administrator account not found in system." });
      }
    }

    await pool.query("BEGIN");
    try {
      // Update dispute status to Escalated
      await pool.query(
        "UPDATE disputes SET status = 'Escalated', escalated_at = NOW(), updated_at = NOW() WHERE dispute_id = $1",
        [disputeId]
      );

      // Inject Admin ID to conversation room to make it group chat
      await pool.query(
        "UPDATE conversations SET admin_id = $1, updated_at = CURRENT_TIMESTAMP WHERE conversation_id = $2",
        [adminUserId, dispute.conversation_id]
      );

      await pool.query("COMMIT");

      // Post escalated system message
      const payload = {
        isDispute: true,
        type: "dispute_escalated",
        dispute_id: disputeId
      };
      await postSystemChatMessage(req.io, dispute.conversation_id, userId, payload);

      return res.json({ message: "Dispute escalated to admin." });
    } catch (txErr) {
      await pool.query("ROLLBACK");
      throw txErr;
    }
  } catch (err) {
    console.error("Escalate dispute error:", err);
    return res.status(500).json({ message: err.message || "Failed to escalate dispute." });
  }
};

// 6. ADMIN RESOLVE
export const adminResolve = async (req, res) => {
  try {
    const disputeId = parseInt(req.params.id);
    const { verdict, client_refund_percent } = req.body; // 'Buyer Wins', 'Freelancer Wins', 'Partial Split', 'Revision Required'

    if (!verdict || !['Buyer Wins', 'Freelancer Wins', 'Partial Split', 'Revision Required'].includes(verdict)) {
      return res.status(400).json({ message: "Invalid verdict selection." });
    }

    const disputeRes = await pool.query("SELECT * FROM disputes WHERE dispute_id = $1", [disputeId]);
    if (disputeRes.rows.length === 0) {
      return res.status(404).json({ message: "Dispute not found." });
    }
    const dispute = disputeRes.rows[0];

    const contractRes = await pool.query("SELECT * FROM contracts WHERE contract_id = $1", [dispute.contract_id]);
    const contract = contractRes.rows[0];
    const budget = parseFloat(contract.budget);

    const sysRes = await pool.query("SELECT * FROM wallets WHERE is_system = TRUE");
    const sysWallet = sysRes.rows[0];
    const clientWalletRes = await pool.query("SELECT * FROM wallets WHERE user_id = $1", [dispute.client_id]);
    const clientWallet = clientWalletRes.rows[0];
    let freelancerWalletRes = await pool.query("SELECT * FROM wallets WHERE user_id = $1", [dispute.freelancer_id]);
    let freelancerWallet = freelancerWalletRes.rows[0];

    // Get Admin User ID from users to send the message
    const adminUserRes = await pool.query(
      "SELECT user_id FROM users WHERE email = $1 LIMIT 1",
      [req.admin?.email || "admin@lancerflow.com"]
    );
    const adminUserId = adminUserRes.rows[0]?.user_id || dispute.freelancer_id; // Fallback

    if (verdict === "Buyer Wins") {
      await pool.query("BEGIN");
      try {
        // Refund 100% to client
        await pool.query("UPDATE wallets SET balance = balance - $1 WHERE wallet_id = $2", [budget, sysWallet.wallet_id]);
        await pool.query("UPDATE wallets SET balance = balance + $1 WHERE wallet_id = $2", [budget, clientWallet.wallet_id]);

        await pool.query(
          `INSERT INTO wallet_transactions (sender_wallet_id, receiver_wallet_id, amount, type, status, description)
           VALUES ($1, $2, $3, 'Transfer', 'Completed', $4)`,
          [sysWallet.wallet_id, clientWallet.wallet_id, budget, `Refund from dispute (Admin decision - Buyer Won): ${contract.title}`]
        );

        // Update contract & milestones
        await pool.query("UPDATE contracts SET status = 'Cancelled', progress = 0, updated_at = NOW() WHERE contract_id = $1", [contract.contract_id]);
        await pool.query("UPDATE contract_milestones SET status = 'Cancelled', payment_status = 'Refunded' WHERE contract_id = $1", [contract.contract_id]);
        const proposalIdToCancelAdmin = contract.application_id || (await pool.query(
          "SELECT proposal_id FROM proposals WHERE job_id = $1 AND freelancer_id = $2 AND status = 'Accepted'",
          [contract.job_id, contract.freelancer_id]
        )).rows[0]?.proposal_id;

        if (proposalIdToCancelAdmin) {
          await pool.query("UPDATE proposals SET status = 'Cancelled', updated_at = NOW() WHERE proposal_id = $1", [proposalIdToCancelAdmin]);
        }

        // Update dispute
        await pool.query(
          "UPDATE disputes SET status = 'Resolved', resolution_type = 'Buyer_Won', resolved_at = NOW(), resolution_details = $1 WHERE dispute_id = $2",
          ["Admin resolved in favor of the client.", disputeId]
        );

        // Remove admin mediator from room
        await pool.query("UPDATE conversations SET admin_id = NULL WHERE conversation_id = $1", [dispute.conversation_id]);

        await pool.query("COMMIT");

        // Re-open job slot if this was a multi-hire job and a slot just freed up
        await recalculateJobStatus(contract.job_id);

        if (req.io && proposalIdToCancelAdmin) {
          req.io.to(`user_${contract.freelancer_id}`).emit("proposal_status_updated", {
            proposal_id: proposalIdToCancelAdmin,
            status: "Cancelled"
          });
        }

        // Post chat card
        const payload = {
          isDispute: true,
          type: "dispute_resolved",
          dispute_id: disputeId,
          verdict: "Buyer Wins",
          details: "Admin Mediator resolved dispute in favor of the Client. Entire escrow balance has been refunded to Client's wallet."
        };
        await postSystemChatMessage(req.io, dispute.conversation_id, adminUserId, payload);

        return res.json({ message: "Resolved successfully: Buyer Wins." });
      } catch (txErr) {
        await pool.query("ROLLBACK");
        throw txErr;
      }
    } else if (verdict === "Freelancer Wins") {
      // Calculate platform fee commission on budget
      const commissionPercent = 0.00;
      const commissionAmount = 0.00;
      const freelancerNet = budget;

      await pool.query("BEGIN");
      try {
        // Release 100% to freelancer
        if (!freelancerWallet) {
          const ins = await pool.query("INSERT INTO wallets (user_id, balance, currency) VALUES ($1, 0.00, 'USD') RETURNING *", [dispute.freelancer_id]);
          freelancerWallet = ins.rows[0];
        }
        await pool.query("UPDATE wallets SET balance = balance - $1 WHERE wallet_id = $2", [budget, sysWallet.wallet_id]);
        await pool.query("UPDATE wallets SET balance = balance + $1 WHERE wallet_id = $2", [freelancerNet, freelancerWallet.wallet_id]);

        await pool.query(
          `INSERT INTO wallet_transactions (sender_wallet_id, receiver_wallet_id, amount, commission_amount, type, status, description)
           VALUES ($1, $2, $3, $4, 'Milestone_Release', 'Completed', $5)`,
          [sysWallet.wallet_id, freelancerWallet.wallet_id, freelancerNet, commissionAmount, `Escrow payout from dispute (Admin decision - Freelancer Won): ${contract.title}`]
        );

        // Update contract & milestones
        await pool.query("UPDATE contracts SET status = 'Completed', progress = 100, updated_at = NOW() WHERE contract_id = $1", [contract.contract_id]);
        await pool.query("UPDATE contract_milestones SET status = 'Completed', payment_status = 'Paid' WHERE contract_id = $1", [contract.contract_id]);

        // Update dispute
        await pool.query(
          "UPDATE disputes SET status = 'Resolved', resolution_type = 'Freelancer_Won', resolved_at = NOW(), resolution_details = $1 WHERE dispute_id = $2",
          ["Admin resolved in favor of the freelancer.", disputeId]
        );

        // Remove admin mediator from room
        await pool.query("UPDATE conversations SET admin_id = NULL WHERE conversation_id = $1", [dispute.conversation_id]);

        await pool.query("COMMIT");

        // Post chat card
        const payload = {
          isDispute: true,
          type: "dispute_resolved",
          dispute_id: disputeId,
          verdict: "Freelancer Wins",
          details: `Admin Mediator resolved dispute in favor of the Freelancer. Escrow funds of $${budget.toFixed(2)} have been released. Freelancer paid $${budget.toFixed(2)} and received a net amount of $${freelancerNet.toFixed(2)}.`
        };
        await postSystemChatMessage(req.io, dispute.conversation_id, adminUserId, payload);

        return res.json({ message: "Resolved successfully: Freelancer Wins." });
      } catch (txErr) {
        await pool.query("ROLLBACK");
        throw txErr;
      }
    } else if (verdict === "Partial Split") {
      const splitPercent = parseFloat(client_refund_percent);
      if (splitPercent === undefined || isNaN(splitPercent) || splitPercent < 0 || splitPercent > 100) {
        return res.status(400).json({ message: "A split percentage split is required." });
      }

      const clientRefund = budget * (splitPercent / 100);
      const freelancerPayout = budget - clientRefund;

      const commissionPercent = 0.00;
      const commissionAmount = 0.00;
      const freelancerNet = freelancerPayout;

      await pool.query("BEGIN");
      try {
        // Debit system escrow
        await pool.query("UPDATE wallets SET balance = balance - $1 WHERE wallet_id = $2", [budget, sysWallet.wallet_id]);

        // Credit client
        await pool.query("UPDATE wallets SET balance = balance + $1 WHERE wallet_id = $2", [clientRefund, clientWallet.wallet_id]);

        // Credit freelancer
        if (freelancerNet > 0) {
          if (!freelancerWallet) {
            const ins = await pool.query("INSERT INTO wallets (user_id, balance, currency) VALUES ($1, 0.00, 'USD') RETURNING *", [dispute.freelancer_id]);
            freelancerWallet = ins.rows[0];
          }
          await pool.query("UPDATE wallets SET balance = balance + $1 WHERE wallet_id = $2", [freelancerNet, freelancerWallet.wallet_id]);
        }

        // Record split transactions
        await pool.query(
          `INSERT INTO wallet_transactions (sender_wallet_id, receiver_wallet_id, amount, type, status, description)
           VALUES ($1, $2, $3, 'Transfer', 'Completed', $4)`,
          [sysWallet.wallet_id, clientWallet.wallet_id, clientRefund, `Split refund from dispute (Admin split): ${contract.title}`]
        );

        if (freelancerPayout > 0 && freelancerWallet) {
          await pool.query(
            `INSERT INTO wallet_transactions (sender_wallet_id, receiver_wallet_id, amount, commission_amount, type, status, description)
             VALUES ($1, $2, $3, $4, 'Milestone_Release', 'Completed', $5)`,
            [sysWallet.wallet_id, freelancerWallet.wallet_id, freelancerNet, commissionAmount, `Split payout from dispute (Admin split): ${contract.title}`]
          );
        }

        // Update contract and milestones
        await pool.query("UPDATE contracts SET status = 'Completed', progress = 100, updated_at = NOW() WHERE contract_id = $1", [contract.contract_id]);
        await pool.query("UPDATE contract_milestones SET status = 'Completed', payment_status = 'Paid' WHERE contract_id = $1", [contract.contract_id]);

        // Update dispute status
        await pool.query(
          "UPDATE disputes SET status = 'Resolved', resolution_type = 'Partial_Refund', resolved_at = NOW(), resolution_details = $1 WHERE dispute_id = $2",
          [`Admin resolved via split payout: Client receives ${splitPercent}%, Freelancer receives ${100 - splitPercent}%.`, disputeId]
        );

        // Remove admin mediator from room
        await pool.query("UPDATE conversations SET admin_id = NULL WHERE conversation_id = $1", [dispute.conversation_id]);

        await pool.query("COMMIT");

        // Post chat card
        const payload = {
          isDispute: true,
          type: "dispute_resolved",
          dispute_id: disputeId,
          verdict: "Resolved - Partial Split",
          details: `Admin Mediator resolved dispute via split payout. Client refunded ${splitPercent}% ($${clientRefund.toFixed(2)}). Freelancer paid ${100 - splitPercent}% ($${freelancerPayout.toFixed(2)}) and received a net amount of $${freelancerNet.toFixed(2)}.`
        };
        await postSystemChatMessage(req.io, dispute.conversation_id, adminUserId, payload);

        return res.json({ message: "Resolved successfully: Partial Split." });
      } catch (txErr) {
        await pool.query("ROLLBACK");
        throw txErr;
      }
    } else {
      // Revision Required
      await pool.query(
        "UPDATE disputes SET status = 'Revision_Required', updated_at = NOW() WHERE dispute_id = $1",
        [disputeId]
      );

      // Post revision chat card
      const payload = {
        isDispute: true,
        type: "dispute_revision_required",
        dispute_id: disputeId,
        details: "Admin Mediator has requested the Freelancer to revise and update deliverables. Dispute placed in pending revision mode."
      };
      await postSystemChatMessage(req.io, dispute.conversation_id, adminUserId, payload);

      return res.json({ message: "Resolved successfully: Revision Required." });
    }
  } catch (err) {
    console.error("Admin resolve dispute error:", err);
    return res.status(500).json({ message: err.message || "Failed to resolve dispute." });
  }
};
