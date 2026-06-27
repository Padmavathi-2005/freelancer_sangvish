import Proposal from "../models/proposalModel.js";
import Job from "../models/jobModel.js";
import Notification from "../models/notificationModel.js";
import pool from "../config/db.js";
import { initializeChat } from "./messageController.js";

export const createProposal = async (req, res) => {
  try {
    const freelancerId = req.user.user_id;
    const { job_id, cover_letter, bid_amount, delivery_days, milestones } = req.body;

    // 1. Basic validation
    if (!job_id) {
      return res.status(400).json({ message: "Job ID is required." });
    }
    if (!cover_letter || !cover_letter.trim()) {
      return res.status(400).json({ message: "Cover letter is required." });
    }
    if (bid_amount === undefined || isNaN(bid_amount) || parseFloat(bid_amount) <= 0) {
      return res.status(400).json({ message: "A valid positive bid amount is required." });
    }
    if (delivery_days === undefined || isNaN(delivery_days) || parseInt(delivery_days) <= 0) {
      return res.status(400).json({ message: "A valid positive delivery days is required." });
    }

    // 2. Check if user has a freelancer profile
    const freelancerProfileRes = await pool.query(
      "SELECT 1 FROM freelancer_profiles WHERE user_id = $1",
      [freelancerId]
    );
    if (freelancerProfileRes.rows.length === 0) {
      return res.status(403).json({ message: "Only registered freelancers can apply for projects." });
    }

    // 3. Verify job exists and retrieve client details
    const jobRes = await pool.query(
      "SELECT client_id, status, title, milestone_type, project_type FROM jobs WHERE job_id = $1",
      [parseInt(job_id)]
    );
    if (jobRes.rows.length === 0) {
      return res.status(444).json({ message: "The project no longer exists." });
    }
    const job = jobRes.rows[0];

    // 4. Verify job is open
    if (job.status !== "Open") {
      return res.status(400).json({ message: "This project is no longer open for proposals." });
    }

    // 5. Prevent client from applying to their own job
    if (job.client_id === freelancerId) {
      return res.status(400).json({ message: "You cannot apply to your own project." });
    }

    // 6. Check if freelancer has already applied (Database UNIQUE constraint backup)
    const hasApplied = await Proposal.checkHasApplied(job_id, freelancerId);
    if (hasApplied) {
      return res.status(400).json({ message: "You have already submitted a proposal for this project." });
    }

    // 6.5. Milestone validation
    if (job.project_type === "Fixed" && job.milestone_type === "Milestone") {
      if (!milestones || !Array.isArray(milestones) || milestones.length === 0) {
        return res.status(400).json({ message: "Milestone structure is required for this project. Please define at least one milestone." });
      }
    }

    if (milestones && Array.isArray(milestones) && milestones.length > 0) {
      let milestoneTotal = 0;
      for (const m of milestones) {
        if (!m.title || !m.title.trim()) {
          return res.status(400).json({ message: "Each milestone must have a valid description title." });
        }
        if (m.amount === undefined || isNaN(m.amount) || parseFloat(m.amount) <= 0) {
          return res.status(400).json({ message: "Each milestone must have a valid positive amount." });
        }
        milestoneTotal += parseFloat(m.amount);
      }
      if (milestoneTotal > parseFloat(bid_amount)) {
        return res.status(400).json({
          message: `Total amount of milestones ($${milestoneTotal.toLocaleString()}) cannot exceed the offered total bid amount ($${parseFloat(bid_amount).toLocaleString()}).`
        });
      }
    }

    // 7. Create proposal
    const proposal = await Proposal.create(
      job_id,
      freelancerId,
      cover_letter.trim(),
      bid_amount,
      delivery_days,
      milestones || null
    );

    // Create and dispatch client notification
    try {
      const notif = await Notification.create({
        userId: job.client_id,
        title: "New Proposal Received",
        message: `A freelancer submitted a proposal on your project "${job.title}"`,
        type: "proposal",
        referenceId: job_id.toString()
      });

      if (req.io) {
        req.io.to(`user_${job.client_id}`).emit("new_notification", notif);
      }
    } catch (notifErr) {
      console.error("Failed to generate client notification:", notifErr);
    }

    return res.status(201).json({
      message: "Proposal submitted successfully!",
      proposal
    });
  } catch (error) {
    console.error("Error creating proposal:", error);
    return res.status(500).json({ message: "Internal server error while submitting proposal." });
  }
};

export const getFreelancerProposals = async (req, res) => {
  try {
    const freelancerId = req.user.user_id;
    const proposals = await Proposal.findByFreelancerId(freelancerId);
    return res.status(200).json(proposals);
  } catch (error) {
    console.error("Error fetching freelancer proposals:", error);
    return res.status(500).json({ message: "Internal server error while fetching proposals." });
  }
};

export const getJobProposals = async (req, res) => {
  try {
    const clientId = req.user.user_id;
    const jobId = parseInt(req.params.jobId);

    if (!jobId || isNaN(jobId)) {
      return res.status(400).json({ message: "Invalid project ID." });
    }

    // Verify job exists and belongs to the client
    const jobRes = await pool.query(
      "SELECT client_id FROM jobs WHERE job_id = $1",
      [jobId]
    );
    if (jobRes.rows.length === 0) {
      return res.status(404).json({ message: "Project not found." });
    }
    if (jobRes.rows[0].client_id !== clientId) {
      return res.status(403).json({ message: "Access denied. You do not own this project." });
    }

    const proposals = await Proposal.findByJobId(jobId);
    return res.status(200).json(proposals);
  } catch (error) {
    console.error("Error fetching job proposals:", error);
    return res.status(500).json({ message: "Internal server error while fetching project proposals." });
  }
};

export const updateProposalStatus = async (req, res) => {
  try {
    const clientId = req.user.user_id;
    const proposalId = parseInt(req.params.proposalId);
    const { status } = req.body; // 'Accepted' or 'Declined'

    if (!proposalId || isNaN(proposalId)) {
      return res.status(400).json({ message: "Invalid proposal ID." });
    }
    if (!status || !["Accepted", "Declined"].includes(status)) {
      return res.status(400).json({ message: "Status must be 'Accepted' or 'Declined'." });
    }

    // Verify proposal details and check if the client owns the corresponding job
    const proposalDetails = await Proposal.findById(proposalId);
    if (!proposalDetails) {
      return res.status(404).json({ message: "Proposal not found." });
    }
    if (proposalDetails.client_id !== clientId) {
      return res.status(403).json({ message: "Access denied. You do not own the project for this proposal." });
    }

    // Wallet Payment & Contract Creation Logic
    if (status === "Accepted") {
      const bidAmount = parseFloat(proposalDetails.bid_amount);

      // Get or create client wallet
      const clientWalletQuery = "SELECT * FROM wallets WHERE user_id = $1";
      const clientWalletRes = await pool.query(clientWalletQuery, [proposalDetails.client_id]);
      let clientWallet = clientWalletRes.rows[0];
      if (!clientWallet) {
        const insertClientWallet = "INSERT INTO wallets (user_id, balance, currency) VALUES ($1, 10000.00, 'USD') RETURNING *";
        const insertRes = await pool.query(insertClientWallet, [proposalDetails.client_id]);
        clientWallet = insertRes.rows[0];
      }

      if (parseFloat(clientWallet.balance) < bidAmount) {
        return res.status(400).json({ 
          message: `Insufficient wallet balance. Milestone cost is $${bidAmount.toFixed(2)}, but your wallet only has $${parseFloat(clientWallet.balance).toFixed(2)}. Please add funds first.` 
        });
      }

      // Get or create freelancer wallet
      const freelancerWalletQuery = "SELECT * FROM wallets WHERE user_id = $1";
      const freelancerWalletRes = await pool.query(freelancerWalletQuery, [proposalDetails.freelancer_id]);
      let freelancerWallet = freelancerWalletRes.rows[0];
      if (!freelancerWallet) {
        const insertFreelancerWallet = "INSERT INTO wallets (user_id, balance, currency) VALUES ($1, 0.00, 'USD') RETURNING *";
        const insertRes = await pool.query(insertFreelancerWallet, [proposalDetails.freelancer_id]);
        freelancerWallet = insertRes.rows[0];
      }

      // Get system escrow wallet
      const systemWalletRes = await pool.query("SELECT * FROM wallets WHERE is_system = TRUE");
      const systemWallet = systemWalletRes.rows[0];

      // Calculate commission & net freelancer amount
      let commissionPercent = 0.10; // Default 10%
      const feeRes = await pool.query("SELECT setting_value FROM settings WHERE setting_key = 'platform_fee'");
      if (feeRes.rows.length > 0) {
        commissionPercent = parseFloat(feeRes.rows[0].setting_value.fee) / 100;
      }
      const commissionAmount = bidAmount * commissionPercent;
      const freelancerAmount = bidAmount - commissionAmount;

      // 1. Debit client wallet
      await pool.query("UPDATE wallets SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = $2", [bidAmount, clientWallet.wallet_id]);

      // 2. Credit admin escrow wallet (holds the actual funds)
      await pool.query("UPDATE wallets SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = $2", [bidAmount, systemWallet.wallet_id]);

      // 3. Credit freelancer virtual wallet balance
      await pool.query("UPDATE wallets SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = $2", [freelancerAmount, freelancerWallet.wallet_id]);

      // 4. Record client-to-escrow transaction
      const clientTxQuery = `
        INSERT INTO wallet_transactions (sender_wallet_id, receiver_wallet_id, amount, type, status, description)
        VALUES ($1, $2, $3, 'Transfer', 'Completed', $4)
      `;
      const clientTxDesc = `Escrow funding for project: ${proposalDetails.job_title}`;
      await pool.query(clientTxQuery, [clientWallet.wallet_id, systemWallet.wallet_id, bidAmount, clientTxDesc]);

      // 5. Record escrow-to-freelancer virtual credit transaction
      const freelancerTxQuery = `
        INSERT INTO wallet_transactions (sender_wallet_id, receiver_wallet_id, amount, commission_amount, type, status, description)
        VALUES ($1, $2, $3, $4, 'Milestone_Release', 'Completed', $5)
      `;
      const freelancerTxDesc = `Virtual credit for milestone (minus ${commissionPercent * 100}% platform fee)`;
      await pool.query(freelancerTxQuery, [systemWallet.wallet_id, freelancerWallet.wallet_id, freelancerAmount, commissionAmount, freelancerTxDesc]);

      // 6. Auto-create contract!
      const contractQuery = `
        INSERT INTO contracts (client_id, freelancer_id, job_id, title, budget, status, progress)
        VALUES ($1, $2, $3, $4, $5, 'In Progress', 0)
        RETURNING *
      `;
      await pool.query(contractQuery, [
        proposalDetails.client_id,
        proposalDetails.freelancer_id,
        proposalDetails.job_id,
        proposalDetails.job_title,
        bidAmount
      ]);

      // 7. Update Job Status to 'Closed'
      await pool.query("UPDATE jobs SET status = 'Closed' WHERE job_id = $1", [proposalDetails.job_id]);
    }

    const updatedProposal = await Proposal.updateStatus(proposalId, status);
    
    // Create and dispatch freelancer notification
    try {
      const isAccepted = status === "Accepted";
      const notif = await Notification.create({
        userId: proposalDetails.freelancer_id,
        title: isAccepted ? "Proposal Accepted!" : "Proposal Declined",
        message: isAccepted 
          ? `Your proposal on project "${proposalDetails.job_title}" was accepted by the client!`
          : `Your proposal on project "${proposalDetails.job_title}" was declined.`,
        type: "proposal",
        referenceId: proposalDetails.job_id.toString()
      });

      if (req.io) {
        req.io.to(`user_${proposalDetails.freelancer_id}`).emit("new_notification", notif);
      }
    } catch (notifErr) {
      console.error("Failed to generate freelancer notification:", notifErr);
    }

    // Auto-start message conversation if proposal is accepted
    if (status === "Accepted") {
      try {
        await initializeChat(
          proposalDetails.client_id,
          proposalDetails.freelancer_id,
          proposalDetails.job_title
        );
      } catch (err) {
        console.error("Failed to automatically start chat conversation:", err);
      }
    }

    return res.status(200).json({
      message: `Proposal status updated to ${status}.`,
      proposal: updatedProposal
    });
  } catch (error) {
    console.error("Error updating proposal status:", error);
    return res.status(500).json({ message: "Internal server error while updating proposal." });
  }
};

export const updateProposalMilestones = async (req, res) => {
  try {
    const clientId = req.user.user_id;
    const proposalId = parseInt(req.params.proposalId);
    const { milestones } = req.body;

    if (!proposalId || isNaN(proposalId)) {
      return res.status(400).json({ message: "Invalid proposal ID." });
    }
    if (!milestones || !Array.isArray(milestones)) {
      return res.status(400).json({ message: "Milestones array is required." });
    }

    // Verify proposal details and check if client or freelancer owns/is associated with the job
    const proposalDetails = await Proposal.findById(proposalId);
    if (!proposalDetails) {
      return res.status(404).json({ message: "Proposal not found." });
    }
    if (proposalDetails.client_id !== clientId && proposalDetails.freelancer_id !== clientId) {
      return res.status(403).json({ message: "Access denied. You are not associated with this project." });
    }

    const query = `
      UPDATE proposals
      SET milestones = $1, updated_at = CURRENT_TIMESTAMP
      WHERE proposal_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [JSON.stringify(milestones), proposalId]);
    
    return res.status(200).json({
      message: "Proposal milestones updated successfully.",
      proposal: result.rows[0]
    });
  } catch (error) {
    console.error("Error updating proposal milestones:", error);
    return res.status(500).json({ message: "Internal server error while updating milestones." });
  }
};
