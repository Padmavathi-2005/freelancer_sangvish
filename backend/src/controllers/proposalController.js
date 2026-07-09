import Proposal from "../models/proposalModel.js";
import Job from "../models/jobModel.js";
import Notification from "../models/notificationModel.js";
import pool from "../config/db.js";
import { initializeChat } from "./messageController.js";
import MessageModel from "../models/messageModel.js";
import { sendEmail } from "../utils/emailHelper.js";
import { handlePostHireNotificationsAndActions } from "../utils/hiringNotifier.js";


// Helper to calculate the start of the current rolling monthly billing cycle relative to registration date
const getCurrentCycleStart = (registrationDateStr, durationDays = 30) => {
  const regDate = new Date(registrationDateStr);
  const now = new Date();
  
  const diffTime = now.getTime() - regDate.getTime();
  if (diffTime < 0) {
    return regDate;
  }
  
  const oneDayMs = 24 * 60 * 60 * 1000;
  const diffDays = Math.floor(diffTime / oneDayMs);
  
  const completedCycles = Math.floor(diffDays / durationDays);
  const currentCycleStartMs = regDate.getTime() + (completedCycles * durationDays * oneDayMs);
  
  return new Date(currentCycleStartMs);
};

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
    const profileRes = await pool.query("SELECT * FROM freelancer_profiles WHERE user_id = $1", [freelancerId]);
    if (profileRes.rows.length === 0) {
      return res.status(400).json({ message: "You must create a freelancer profile before submitting proposals." });
    }

    // Check monthly proposal limits
    const settingsRes = await pool.query("SELECT setting_value FROM settings WHERE setting_key = 'package_options_settings'");
    let packageOption = "Free listing for both type of users";
    if (settingsRes.rows.length > 0) {
      const parsed = typeof settingsRes.rows[0].setting_value === "string"
        ? JSON.parse(settingsRes.rows[0].setting_value)
        : settingsRes.rows[0].setting_value;
      packageOption = parsed.package_option || "Free listing for both type of users";
    }

    const isPaidOption = packageOption === "Paid listing for both" || packageOption === "Paid listing for sellers";

    if (isPaidOption) {
      const planQuery = await pool.query(
        `SELECT sp.credits, sp.plan_duration, u.created_at 
         FROM users u 
         LEFT JOIN subscription_plans sp ON u.active_plan_id = sp.plan_id 
         WHERE u.user_id = $1`,
        [freelancerId]
      );
      const limit = planQuery.rows.length > 0 && planQuery.rows[0].credits !== null 
        ? parseInt(planQuery.rows[0].credits) 
        : 10;

      const durationDays = planQuery.rows.length > 0 && planQuery.rows[0].plan_duration !== null 
        ? parseInt(planQuery.rows[0].plan_duration) 
        : 30;

      const userCreatedAt = planQuery.rows.length > 0 ? planQuery.rows[0].created_at : new Date();
      const cycleStart = getCurrentCycleStart(userCreatedAt, durationDays);

      const countQuery = await pool.query(
        `SELECT COUNT(*) FROM proposals 
         WHERE freelancer_id = $1 
           AND created_at >= $2`,
        [freelancerId, cycleStart]
      );
      const submittedCount = parseInt(countQuery.rows[0].count || 0);

      if (submittedCount >= limit) {
        const nextReset = new Date(cycleStart);
        nextReset.setDate(nextReset.getDate() + durationDays);
        const options = { year: 'numeric', month: 'short', day: '2-digit' };
        const resetStr = nextReset.toLocaleDateString('en-US', options);

        return res.status(403).json({ 
          message: `Your monthly bid proposal limit of ${limit} has been reached for this billing cycle. Your limit resets on ${resetStr}. Please upgrade your subscription plan to submit more bids.` 
        });
      }
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
      if (Math.abs(milestoneTotal - parseFloat(bid_amount)) > 0.01) {
        return res.status(400).json({
          message: `Total amount of milestones ($${milestoneTotal.toFixed(2)}) must be exactly equal to the offered total bid amount ($${parseFloat(bid_amount).toFixed(2)}).`
        });
      }
    }

    // Fetch proposal vetting setting
    let enableProposalVetting = false;
    try {
      const { default: Settings } = await import("../models/settingsModel.js");
      const setting = await Settings.getByKey("enable_proposal_vetting");
      if (setting) {
        let val = setting.setting_value;
        if (typeof val === "string") {
          try { val = JSON.parse(val); } catch {}
        }
        enableProposalVetting = val?.enabled === true || val?.enabled === "true";
      }
    } catch (err) {
      console.error("Failed to fetch enable_proposal_vetting setting:", err);
    }

    const initialStatus = enableProposalVetting ? "Pending Approval" : "Pending";

    // 7. Create proposal
    const proposal = await Proposal.create(
      job_id,
      freelancerId,
      cover_letter.trim(),
      bid_amount,
      delivery_days,
      milestones || null,
      initialStatus
    );

    // Create and dispatch notification
    try {
      if (enableProposalVetting) {
        const notif = await Notification.create({
          userId: freelancerId,
          title: "Proposal Under Review",
          message: `Your proposal on project "${job.title}" has been submitted and is pending admin vetting.`,
          type: "proposal",
          referenceId: job_id.toString()
        });
        if (req.io) {
          req.io.to(`user_${freelancerId}`).emit("new_notification", notif);
        }
      } else {
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
      }
    } catch (notifErr) {
      console.error("Failed to generate notification:", notifErr);
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

    if (proposalDetails.status === "Accepted") {
      return res.status(400).json({ message: "This proposal has already been hired." });
    }

    // Wallet Payment & Contract Creation Logic
    if (status === "Accepted") {
      const bidAmount = parseFloat(proposalDetails.bid_amount);

      let milestoneList = [];
      try {
        milestoneList = typeof proposalDetails.milestones === "string"
          ? JSON.parse(proposalDetails.milestones)
          : (proposalDetails.milestones || []);
      } catch (e) {}

      const hasMilestones = milestoneList && milestoneList.length > 0;
      const upfrontAmount = hasMilestones ? parseFloat(milestoneList[0].amount) : bidAmount;

      await pool.query("BEGIN");
      try {
        // Lock proposal row to prevent concurrent race condition
        const lockRes = await pool.query(
          "SELECT status FROM proposals WHERE proposal_id = $1 FOR UPDATE",
          [proposalId]
        );
        if (lockRes.rows[0]?.status === "Accepted") {
          throw new Error("This proposal has already been accepted.");
        }

        // Get or create client wallet
        const clientWalletQuery = "SELECT * FROM wallets WHERE user_id = $1";
        const clientWalletRes = await pool.query(clientWalletQuery, [proposalDetails.client_id]);
        let clientWallet = clientWalletRes.rows[0];
        if (!clientWallet) {
          const insertClientWallet = "INSERT INTO wallets (user_id, balance, currency) VALUES ($1, 0.00, 'USD') RETURNING *";
          const insertRes = await pool.query(insertClientWallet, [proposalDetails.client_id]);
          clientWallet = insertRes.rows[0];
        }

        if (parseFloat(clientWallet.balance) < upfrontAmount) {
          throw new Error(`Insufficient wallet balance. Milestone cost is $${upfrontAmount.toFixed(2)}, but your wallet only has $${parseFloat(clientWallet.balance).toFixed(2)}. Please add funds first.`);
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

        // Calculate commission & net freelancer amount based on standard platform fee
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

        // 1. Debit client wallet
        await pool.query("UPDATE wallets SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = $2", [upfrontAmount, clientWallet.wallet_id]);

        // 2. Credit admin escrow wallet (holds the actual funds)
        await pool.query("UPDATE wallets SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = $2", [upfrontAmount, systemWallet.wallet_id]);

        // 4. Record client-to-escrow transaction
        const clientTxQuery = `
          INSERT INTO wallet_transactions (sender_wallet_id, receiver_wallet_id, amount, type, status, description)
          VALUES ($1, $2, $3, 'Transfer', 'Completed', $4)
        `;
        const clientTxDesc = `Escrow funding (First Milestone) for project: ${proposalDetails.job_title}`;
        await pool.query(clientTxQuery, [clientWallet.wallet_id, systemWallet.wallet_id, upfrontAmount, clientTxDesc]);

        const contractQuery = `
          INSERT INTO contracts (client_id, freelancer_id, job_id, title, budget, status, progress)
          VALUES ($1, $2, $3, $4, $5, 'Hired', 0)
          RETURNING *
        `;
        const contractRes = await pool.query(contractQuery, [
          proposalDetails.client_id,
          proposalDetails.freelancer_id,
          proposalDetails.job_id,
          proposalDetails.job_title,
          bidAmount
        ]);
        const contract = contractRes.rows[0];

        // 5.5 Populate contract_milestones
        if (hasMilestones) {
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

        // 6. Check hiring limit and update Job Status
        const numFreelancersQuery = await pool.query("SELECT num_freelancers FROM jobs WHERE job_id = $1", [proposalDetails.job_id]);
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
          [proposalDetails.job_id]
        );
        const hiredCount = parseInt(hiredCountRes.rows[0].count || 0);

        if (hiredCount >= limit) {
          await pool.query("UPDATE jobs SET status = 'Closed' WHERE job_id = $1", [proposalDetails.job_id]);
        } else {
          await pool.query("UPDATE jobs SET status = 'Open' WHERE job_id = $1", [proposalDetails.job_id]);
        }

        // 7. Update Proposal Status to 'Accepted'
        await pool.query("UPDATE proposals SET status = 'Accepted', updated_at = CURRENT_TIMESTAMP WHERE proposal_id = $1", [proposalId]);

        await pool.query("COMMIT");
      } catch (txnErr) {
        await pool.query("ROLLBACK");
        return res.status(400).json({ message: txnErr.message || "Failed to accept proposal." });
      }

      // Trigger post-hire notifications, messages, emails, and auto-declines (outside transaction)
      await handlePostHireNotificationsAndActions({
        proposalId,
        bidAmount,
        io: req.io
      });
    } else {
      // Handle declined status manually
      const updatedProposal = await Proposal.updateStatus(proposalId, status);
      try {
        const notif = await Notification.create({
          userId: proposalDetails.freelancer_id,
          title: "Proposal Declined",
          message: `Your proposal on project "${proposalDetails.job_title}" was declined.`,
          type: "proposal",
          referenceId: proposalDetails.job_id.toString()
        });
        if (req.io) {
          req.io.to(`user_${proposalDetails.freelancer_id}`).emit("new_notification", notif);
        }
      } catch (notifErr) {
        console.error("Failed to generate freelancer notification:", notifErr);
      }
    }

    const updatedProposal = await Proposal.findById(proposalId);

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

export const createDirectHire = async (req, res) => {
  try {
    const clientId = req.user.user_id;
    const { freelancer_id, job_id, new_job, bid_amount, delivery_days, cover_letter, milestones } = req.body;

    if (!freelancer_id) {
      return res.status(400).json({ message: "Freelancer ID is required." });
    }
    if (bid_amount === undefined || isNaN(bid_amount) || parseFloat(bid_amount) <= 0) {
      return res.status(400).json({ message: "A valid positive bid amount is required." });
    }
    if (delivery_days === undefined || isNaN(delivery_days) || parseInt(delivery_days) <= 0) {
      return res.status(400).json({ message: "A valid positive delivery days is required." });
    }

    let activeJobId = job_id;
    let jobTitle = "";

    await pool.query("BEGIN");
    try {
      if (new_job) {
        const { title, description } = new_job;
        if (!title || !description) {
          throw new Error("Job title and description are required for new inline projects.");
        }
        const insertJobRes = await pool.query(
          `INSERT INTO jobs (client_id, title, description, budget, status, project_type, milestone_type)
           VALUES ($1, $2, $3, $4, 'Closed', 'Fixed', 'Milestone')
           RETURNING *`,
          [clientId, title, description, parseFloat(bid_amount)]
        );
        activeJobId = insertJobRes.rows[0].job_id;
        jobTitle = title;
      } else if (activeJobId) {
        const jobRes = await pool.query("SELECT * FROM jobs WHERE job_id = $1", [parseInt(activeJobId)]);
        if (jobRes.rows.length === 0) {
          throw new Error("The associated project no longer exists.");
        }
        const job = jobRes.rows[0];
        if (job.client_id !== clientId) {
          throw new Error("You do not own this project.");
        }
        jobTitle = job.title;
      } else {
        throw new Error("Either a job_id or new_job details must be provided.");
      }

      const checkProp = await pool.query(
        "SELECT * FROM proposals WHERE job_id = $1 AND freelancer_id = $2",
        [activeJobId, freelancer_id]
      );
      if (checkProp.rows.length > 0) {
        throw new Error("You have already sent a hire request or a proposal exists for this freelancer on this project.");
      }

      const milestoneStr = milestones ? JSON.stringify(milestones) : null;
      const insertPropRes = await pool.query(
        `INSERT INTO proposals (job_id, freelancer_id, cover_letter, bid_amount, delivery_days, milestones, initiated_by, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'client', 'Pending')
         RETURNING *`,
        [
          activeJobId,
          parseInt(freelancer_id),
          cover_letter || `Direct hire offer for project: ${jobTitle}`,
          parseFloat(bid_amount),
          parseInt(delivery_days),
          milestoneStr
        ]
      );
      const proposal = insertPropRes.rows[0];

      await pool.query("COMMIT");

      const notif = await Notification.create({
        userId: parseInt(freelancer_id),
        title: "Direct Hire Request! 💼",
        message: `You received a direct hire offer on project "${jobTitle}" for $${parseFloat(bid_amount).toFixed(2)}.`,
        type: "proposal",
        referenceId: activeJobId.toString()
      });
      if (req.io) {
        req.io.to(`user_${freelancer_id}`).emit("new_notification", notif);
      }

      let conversationId = null;
      try {
        conversationId = await initializeChat(clientId, parseInt(freelancer_id), jobTitle);
        if (conversationId) {
          const chatMsgText = `[Direct Hire Request]
Hello! I would like to hire you directly for my project "${jobTitle}".
- Offer Budget: $${parseFloat(bid_amount).toFixed(2)}
- Offer Delivery: ${delivery_days} days
Please review and accept/decline this offer in your dashboard under "Proposals".`;
          await MessageModel.createMessage(conversationId, clientId, chatMsgText);

          const senderRes = await pool.query(
            "SELECT CONCAT(first_name, ' ', last_name) as sender_name, profile_image as sender_profile_image FROM users WHERE user_id = $1",
            [clientId]
          );
          const sender = senderRes.rows[0] || {};
          const chatMessage = {
            conversation_id: conversationId,
            message_text: chatMsgText,
            sender_id: clientId,
            sender_name: sender.sender_name || "Client",
            sender_profile_image: sender.sender_profile_image || null,
            created_at: new Date()
          };
          req.io.to(`user_${freelancer_id}`).emit("new_message", chatMessage);
          req.io.to(`user_${clientId}`).emit("new_message", chatMessage);
        }
      } catch (chatErr) {
        console.error("Failed to post direct hire message in chat:", chatErr);
      }

      try {
        const freelancerEmailQuery = await pool.query("SELECT email FROM users WHERE user_id = $1", [parseInt(freelancer_id)]);
        const freelancerEmail = freelancerEmailQuery.rows[0]?.email;
        if (freelancerEmail) {
          const subject = `Direct Hire Offer on Buy2Lancer!`;
          const text = `Hi,\n\nYou have received a direct hire request for the project "${jobTitle}" with a budget of $${parseFloat(bid_amount).toFixed(2)}.\n\nLog in to your dashboard to accept or decline the offer.\n\nBest regards,\nThe Buy2Lancer Team`;
          await sendEmail({ to: freelancerEmail, subject, text });
        }
      } catch (mailErr) {
        console.error("Failed to send direct hire email:", mailErr);
      }

      return res.status(201).json({
        message: "Direct hire request sent successfully.",
        proposal
      });

    } catch (txErr) {
      await pool.query("ROLLBACK");
      throw txErr;
    }

  } catch (err) {
    console.error("Error creating direct hire request:", err);
    return res.status(500).json({ message: err.message || "Failed to create direct hire request." });
  }
};

export const respondDirectHire = async (req, res) => {
  try {
    const freelancerId = req.user.user_id;
    const proposalId = parseInt(req.params.proposalId);
    const { action } = req.body;

    if (!action || (action !== "Accept" && action !== "Decline")) {
      return res.status(400).json({ message: "Action must be either 'Accept' or 'Decline'." });
    }

    const propRes = await pool.query(
      `SELECT p.*, j.title as job_title, j.client_id
       FROM proposals p
       JOIN jobs j ON p.job_id = j.job_id
       WHERE p.proposal_id = $1`,
      [proposalId]
    );

    if (propRes.rows.length === 0) {
      return res.status(404).json({ message: "Hire request not found." });
    }

    const proposal = propRes.rows[0];

    if (proposal.freelancer_id !== freelancerId) {
      return res.status(403).json({ message: "Access denied. Only the offered freelancer can respond." });
    }

    if (proposal.status !== "Pending") {
      return res.status(400).json({ message: `Cannot respond to hire request in status: ${proposal.status}` });
    }

    if (proposal.initiated_by !== "client") {
      return res.status(400).json({ message: "This is not a client-initiated direct hire offer." });
    }

    const newStatus = action === "Accept" ? "Accepted_By_Freelancer" : "Declined";

    await pool.query(
      "UPDATE proposals SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE proposal_id = $2",
      [newStatus, proposalId]
    );

    const notif = await Notification.create({
      userId: proposal.client_id,
      title: action === "Accept" ? "Hire Offer Accepted! 🎉" : "Hire Offer Declined ❌",
      message: action === "Accept"
        ? `Freelancer accepted your direct hire offer for "${proposal.job_title}". Click here to complete escrow payment.`
        : `Freelancer declined your direct hire offer for "${proposal.job_title}".`,
      type: "proposal",
      referenceId: proposal.job_id.toString()
    });
    if (req.io) {
      req.io.to(`user_${proposal.client_id}`).emit("new_notification", notif);
    }

    try {
      let conv = await MessageModel.checkConversationExists(proposal.client_id, freelancerId);
      if (conv) {
        const sysMsg = action === "Accept"
          ? `System: Freelancer accepted the direct hire offer! Client, please finalize by funding the escrow.`
          : `System: Freelancer declined the direct hire offer.`;
        await MessageModel.createMessage(conv.conversation_id, proposal.client_id, sysMsg);

        const chatMessage = {
          conversation_id: conv.conversation_id,
          message_text: sysMsg,
          sender_id: proposal.client_id,
          sender_name: "System",
          sender_profile_image: null,
          created_at: new Date()
        };
        req.io.to(`user_${proposal.client_id}`).emit("new_message", chatMessage);
        req.io.to(`user_${freelancerId}`).emit("new_message", chatMessage);
      }
    } catch (chatErr) {
      console.error("Failed to post system response in chat:", chatErr);
    }

    try {
      const clientEmailQuery = await pool.query("SELECT email FROM users WHERE user_id = $1", [proposal.client_id]);
      const clientEmail = clientEmailQuery.rows[0]?.email;
      if (clientEmail) {
        const subject = `Update on your direct hire offer for "${proposal.job_title}"`;
        const text = `Hi,\n\nThe freelancer has ${action === "Accept" ? "accepted" : "declined"} your direct hire request for the project "${proposal.job_title}".\n\n${
          action === "Accept"
            ? "Log in to your dashboard and complete the escrow payment to launch the project."
            : "No further action is required."
        }\n\nBest regards,\nThe Buy2Lancer Team`;
        await sendEmail({ to: clientEmail, subject, text });
      }
    } catch (mailErr) {
      console.error("Failed to send direct hire response email:", mailErr);
    }

    return res.status(200).json({
      message: `Direct hire offer ${action === "Accept" ? "accepted" : "declined"} successfully.`,
      status: newStatus
    });

  } catch (err) {
    console.error("Error responding to direct hire request:", err);
    return res.status(500).json({ message: err.message || "Failed to respond to direct hire request." });
  }
};

export const submitContractReview = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const contractId = parseInt(req.params.id);
    const { rating, comment } = req.body;

    if (!rating || isNaN(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "A valid rating between 1 and 5 is required." });
    }

    // 1. Fetch contract to find roles
    const contractRes = await pool.query("SELECT * FROM contracts WHERE contract_id = $1", [contractId]);
    if (contractRes.rows.length === 0) {
      return res.status(404).json({ message: "Contract not found." });
    }

    const contract = contractRes.rows[0];
    
    // Check if contract is completed
    if (contract.status !== 'Completed') {
      return res.status(400).json({ message: "Reviews can only be submitted for completed contracts." });
    }

    let reviewerRole = "";
    let revieweeId = null;

    if (contract.client_id === userId) {
      reviewerRole = "client";
      revieweeId = contract.freelancer_id;
    } else if (contract.freelancer_id === userId) {
      reviewerRole = "freelancer";
      revieweeId = contract.client_id;
    } else {
      return res.status(403).json({ message: "You are not authorized to review this contract." });
    }

    // 2. Check if this user already reviewed this contract
    const existingRes = await pool.query(
      "SELECT * FROM contract_reviews WHERE contract_id = $1 AND reviewer_id = $2",
      [contractId, userId]
    );

    if (existingRes.rows.length > 0) {
      return res.status(400).json({ message: "You have already reviewed this contract." });
    }

    // 3. Insert review
    const insertRes = await pool.query(
      `INSERT INTO contract_reviews (contract_id, reviewer_id, reviewee_id, reviewer_role, rating, comment)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [contractId, userId, revieweeId, reviewerRole, parseFloat(rating), comment || ""]
    );

    return res.status(201).json({
      message: "Review submitted successfully!",
      review: insertRes.rows[0]
    });
  } catch (error) {
    console.error("Error submitting contract review:", error);
    return res.status(500).json({ message: "Internal server error while submitting review." });
  }
};

export const getContractReview = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const contractId = parseInt(req.params.id);

    const reviewRes = await pool.query(
      "SELECT * FROM contract_reviews WHERE contract_id = $1 AND reviewer_id = $2",
      [contractId, userId]
    );

    return res.status(200).json({
      reviewed: reviewRes.rows.length > 0,
      review: reviewRes.rows[0] || null
    });
  } catch (error) {
    console.error("Error fetching contract review:", error);
    return res.status(500).json({ message: "Internal server error while fetching review." });
  }
};

export const checkProposalLimit = async (req, res) => {
  try {
    const freelancerId = req.user.user_id;

    // Check package settings
    const settingsRes = await pool.query("SELECT setting_value FROM settings WHERE setting_key = 'package_options_settings'");
    let packageOption = "Free listing for both type of users";
    if (settingsRes.rows.length > 0) {
      const parsed = typeof settingsRes.rows[0].setting_value === "string"
        ? JSON.parse(settingsRes.rows[0].setting_value)
        : settingsRes.rows[0].setting_value;
      packageOption = parsed.package_option || "Free listing for both type of users";
    }
    const isPaidOption = packageOption === "Paid listing for both" || packageOption === "Paid listing for sellers";

    if (!isPaidOption) {
      return res.status(200).json({
        limitReached: false,
        submittedCount: 0,
        limit: 99999,
        resetDate: null,
        isPaidOption: false
      });
    }

    const planQuery = await pool.query(
      `SELECT sp.credits, sp.plan_duration, u.created_at 
       FROM users u 
       LEFT JOIN subscription_plans sp ON u.active_plan_id = sp.plan_id 
       WHERE u.user_id = $1`,
      [freelancerId]
    );
    const limit = planQuery.rows.length > 0 && planQuery.rows[0].credits !== null 
      ? parseInt(planQuery.rows[0].credits) 
      : 10;

    const durationDays = planQuery.rows.length > 0 && planQuery.rows[0].plan_duration !== null 
      ? parseInt(planQuery.rows[0].plan_duration) 
      : 30;

    const userCreatedAt = planQuery.rows.length > 0 ? planQuery.rows[0].created_at : new Date();
    const cycleStart = getCurrentCycleStart(userCreatedAt, durationDays);

    const countQuery = await pool.query(
      `SELECT COUNT(*) FROM proposals 
       WHERE freelancer_id = $1 
         AND created_at >= $2`,
      [freelancerId, cycleStart]
    );
    const submittedCount = parseInt(countQuery.rows[0].count || 0);
    const limitReached = submittedCount >= limit;

    const nextReset = new Date(cycleStart);
    nextReset.setDate(nextReset.getDate() + durationDays);
    const options = { year: 'numeric', month: 'short', day: '2-digit' };
    const resetStr = nextReset.toLocaleDateString('en-US', options);

    return res.status(200).json({
      limitReached,
      submittedCount,
      limit,
      resetDate: resetStr,
      isPaidOption: true
    });
  } catch (error) {
    console.error("Error in checkProposalLimit:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
