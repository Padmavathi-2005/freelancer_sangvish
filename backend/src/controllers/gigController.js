import Gig from "../models/gigModel.js";
import Notification from "../models/notificationModel.js";
import pool from "../config/db.js";
import { initializeChat } from "./messageController.js";

export const createFreelancerGig = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const {
      category_id,
      sub_category_id,
      title,
      description,
      price,
      currency_id,
      delivery_days,
      revisions,
      images,
      video_url,
      documents,
      skills
    } = req.body;

    // Validations
    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Gig title is required." });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ message: "Gig description is required." });
    }
    if (price === undefined || isNaN(price) || parseFloat(price) <= 0) {
      return res.status(400).json({ message: "A valid positive price is required." });
    }
    if (!delivery_days || isNaN(delivery_days) || parseInt(delivery_days) <= 0) {
      return res.status(400).json({ message: "Delivery days must be a positive integer." });
    }

    // Save gig
    const gig = await Gig.create(
      userId,
      category_id,
      sub_category_id,
      title,
      description,
      price,
      currency_id,
      delivery_days,
      revisions,
      images,
      video_url,
      documents
    );

    // Save skill links if provided
    if (skills && Array.isArray(skills) && skills.length > 0) {
      for (const skillId of skills) {
        await Gig.addSkill(gig.gig_id, skillId);
      }
    }

    // Retrieve full gig details with populated joins
    const freelancerGigs = await Gig.findByFreelancerId(userId);
    const fullyPopulatedGig = freelancerGigs.find((g) => g.gig_id === gig.gig_id);

    return res.status(201).json({
      message: "Gig created successfully!",
      gig: fullyPopulatedGig || gig
    });
  } catch (error) {
    console.error("Error creating gig:", error);
    return res.status(500).json({ message: "Internal server error while creating gig." });
  }
};

export const getFreelancerGigs = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const gigs = await Gig.findByFreelancerId(userId);
    return res.status(200).json(gigs);
  } catch (error) {
    console.error("Error fetching freelancer gigs:", error);
    return res.status(500).json({ message: "Internal server error while fetching gigs." });
  }
};

export const getCurrencies = async (req, res) => {
  try {
    const currencies = await Gig.getAllCurrencies();
    return res.status(200).json(currencies);
  } catch (error) {
    console.error("Error fetching currencies:", error);
    return res.status(500).json({ message: "Internal server error while fetching currencies." });
  }
};

export const getClientGigs = async (req, res) => {
  try {
    const gigs = await Gig.findAllActive();
    return res.status(200).json(gigs);
  } catch (error) {
    console.error("Error fetching client gigs:", error);
    return res.status(500).json({ message: "Internal server error while fetching gigs." });
  }
};

export const applyToFreelancerGig = async (req, res) => {
  try {
    const clientId = req.user.user_id;
    const { gig_id, requirements, price, currency_id, milestones } = req.body;

    if (!gig_id) {
      return res.status(400).json({ message: "Gig ID is required." });
    }
    if (!requirements || !requirements.trim()) {
      return res.status(400).json({ message: "Requirements are required." });
    }
    if (price === undefined || isNaN(price) || parseFloat(price) <= 0) {
      return res.status(400).json({ message: "A valid positive price is required." });
    }

    // Retrieve gig details to identify owner
    const gigRes = await pool.query(
      "SELECT freelancer_id, title FROM gigs WHERE gig_id = $1",
      [parseInt(gig_id)]
    );
    if (gigRes.rows.length === 0) {
      return res.status(444).json({ message: "The gig no longer exists." });
    }
    const gig = gigRes.rows[0];

    const orderPrice = parseFloat(price);
    const gm1 = Math.round(orderPrice * 0.3 * 100) / 100;
    const gm2 = Math.round(orderPrice * 0.5 * 100) / 100;
    const gm3 = Math.round((orderPrice - gm1 - gm2) * 100) / 100;
    const finalMilestones = milestones && Array.isArray(milestones) && milestones.length > 0
      ? milestones
      : [
          { id: "gm1", title: "Project initiation and requirements analysis", percentage: 30, amount: gm1, completed: false, paid: false },
          { id: "gm2", title: "Core implementation and layout staging", percentage: 50, amount: gm2, completed: false, paid: false },
          { id: "gm3", title: "Final testing, polish and deployment handoff", percentage: 20, amount: gm3, completed: false, paid: false }
        ];

    const application = await Gig.createApplication(gig_id, clientId, requirements, price, currency_id, finalMilestones);

    // Save and dispatch notification to freelancer
    try {
      const notif = await Notification.create({
        userId: gig.freelancer_id,
        title: "New Gig Order Received",
        message: `A client placed an order/application on your gig "${gig.title}"`,
        type: "gig",
        referenceId: gig_id.toString()
      });

      if (req.io) {
        req.io.to(`user_${gig.freelancer_id}`).emit("new_notification", notif);
      }
    } catch (notifErr) {
      console.error("Failed to generate freelancer gig notification:", notifErr);
    }

    return res.status(201).json({
      message: "Application submitted successfully!",
      application
    });
  } catch (error) {
    console.error("Error creating gig application:", error);
    return res.status(500).json({ message: "Internal server error while applying for gig." });
  }
};

export const getFreelancerGigApplications = async (req, res) => {
  try {
    const freelancerId = req.user.user_id;
    const applications = await Gig.findApplicationsByFreelancerId(freelancerId);
    return res.status(200).json(applications);
  } catch (error) {
    console.error("Error fetching gig applications:", error);
    return res.status(500).json({ message: "Internal server error while fetching applications." });
  }
};

export const updateGigApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status is required." });
    }
    const validStatuses = ["Pending", "Accepted", "Rejected", "Completed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value." });
    }

    // Fetch details to find client, freelancer, gig title, and price
    const appDetailsRes = await pool.query(
      `SELECT ga.client_id, ga.price, g.freelancer_id, g.title as gig_title
       FROM gig_applications ga
       JOIN gigs g ON ga.gig_id = g.gig_id
       WHERE ga.application_id = $1`,
      [parseInt(id)]
    );
    if (appDetailsRes.rows.length === 0) {
      return res.status(404).json({ message: "Gig application not found." });
    }
    const appDetails = appDetailsRes.rows[0];

    // Wallet Payment Logic
    if (status === "Accepted") {
      const orderPrice = parseFloat(appDetails.price);

      // Get or create client wallet
      const clientWalletQuery = "SELECT * FROM wallets WHERE user_id = $1";
      const clientWalletRes = await pool.query(clientWalletQuery, [appDetails.client_id]);
      let clientWallet = clientWalletRes.rows[0];
      if (!clientWallet) {
        const insertClientWallet = "INSERT INTO wallets (user_id, balance, currency) VALUES ($1, 10000.00, 'USD') RETURNING *";
        const insertRes = await pool.query(insertClientWallet, [appDetails.client_id]);
        clientWallet = insertRes.rows[0];
      }

      if (parseFloat(clientWallet.balance) < orderPrice) {
        return res.status(400).json({ 
          message: `Insufficient wallet balance. Gig order price is $${orderPrice.toFixed(2)}, but your wallet only has $${parseFloat(clientWallet.balance).toFixed(2)}. Please add funds first.` 
        });
      }

      // Get or create freelancer wallet
      const freelancerWalletQuery = "SELECT * FROM wallets WHERE user_id = $1";
      const freelancerWalletRes = await pool.query(freelancerWalletQuery, [appDetails.freelancer_id]);
      let freelancerWallet = freelancerWalletRes.rows[0];
      if (!freelancerWallet) {
        const insertFreelancerWallet = "INSERT INTO wallets (user_id, balance, currency) VALUES ($1, 0.00, 'USD') RETURNING *";
        const insertRes = await pool.query(insertFreelancerWallet, [appDetails.freelancer_id]);
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
      const commissionAmount = orderPrice * commissionPercent;
      const freelancerAmount = orderPrice - commissionAmount;

      // 1. Debit client wallet
      await pool.query("UPDATE wallets SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = $2", [orderPrice, clientWallet.wallet_id]);

      // 2. Credit admin escrow wallet (holds the actual funds)
      await pool.query("UPDATE wallets SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = $2", [orderPrice, systemWallet.wallet_id]);

      // 3. Credit freelancer virtual wallet balance
      await pool.query("UPDATE wallets SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = $2", [freelancerAmount, freelancerWallet.wallet_id]);

      // 4. Record client-to-escrow transaction
      const clientTxQuery = `
        INSERT INTO wallet_transactions (sender_wallet_id, receiver_wallet_id, amount, type, status, description)
        VALUES ($1, $2, $3, 'Transfer', 'Completed', $4)
      `;
      const clientTxDesc = `Escrow funding for gig order: ${appDetails.gig_title}`;
      await pool.query(clientTxQuery, [clientWallet.wallet_id, systemWallet.wallet_id, orderPrice, clientTxDesc]);

      // 5. Record escrow-to-freelancer virtual credit transaction
      const freelancerTxQuery = `
        INSERT INTO wallet_transactions (sender_wallet_id, receiver_wallet_id, amount, commission_amount, type, status, description)
        VALUES ($1, $2, $3, $4, 'Milestone_Release', 'Completed', $5)
      `;
      const freelancerTxDesc = `Virtual credit for gig order (minus ${commissionPercent * 100}% platform fee)`;
      await pool.query(freelancerTxQuery, [systemWallet.wallet_id, freelancerWallet.wallet_id, freelancerAmount, commissionAmount, freelancerTxDesc]);

      // 6. Auto-create contract!
      const contractQuery = `
        INSERT INTO contracts (client_id, freelancer_id, title, budget, status, progress)
        VALUES ($1, $2, $3, $4, 'In Progress', 0)
        RETURNING *
      `;
      await pool.query(contractQuery, [
        appDetails.client_id,
        appDetails.freelancer_id,
        appDetails.gig_title,
        orderPrice
      ]);
    }

    const application = await Gig.updateApplicationStatus(id, status);

    // Save and dispatch notification to client
    try {
      const notif = await Notification.create({
        userId: appDetails.client_id,
        title: `Gig Order ${status}`,
        message: `Your order for gig "${appDetails.gig_title}" has been ${status.toLowerCase()} by the freelancer.`,
        type: "gig",
        referenceId: id.toString()
      });

      if (req.io) {
        req.io.to(`user_${appDetails.client_id}`).emit("new_notification", notif);
      }
    } catch (notifErr) {
      console.error("Failed to generate client gig notification:", notifErr);
    }

    // Auto-start messaging conversation if accepted
    if (status === "Accepted") {
      try {
        await initializeChat(
          appDetails.client_id,
          appDetails.freelancer_id,
          appDetails.gig_title
        );
      } catch (err) {
        console.error("Failed to automatically start chat conversation:", err);
      }
    }

    return res.status(200).json({
      message: `Application status updated to ${status}.`,
      application
    });
  } catch (error) {
    console.error("Error updating gig application status:", error);
    return res.status(500).json({ message: "Internal server error while updating application status." });
  }
};

export const getClientGigApplications = async (req, res) => {
  try {
    const clientId = req.user.user_id;
    const applications = await Gig.findApplicationsByClientId(clientId);
    return res.status(200).json(applications);
  } catch (error) {
    console.error("Error fetching client gig applications:", error);
    return res.status(500).json({ message: "Internal server error while fetching client applications." });
  }
};

export const updateGigApplicationMilestones = async (req, res) => {
  try {
    const clientId = req.user.user_id;
    const applicationId = parseInt(req.params.id);
    const { milestones } = req.body;

    if (!applicationId || isNaN(applicationId)) {
      return res.status(400).json({ message: "Invalid application ID." });
    }
    if (!milestones || !Array.isArray(milestones)) {
      return res.status(400).json({ message: "Milestones array is required." });
    }

    // Verify application exists and client or freelancer owns/is associated with it
    const checkRes = await pool.query(
      `SELECT ga.client_id, g.freelancer_id 
       FROM gig_applications ga
       JOIN gigs g ON ga.gig_id = g.gig_id
       WHERE ga.application_id = $1`,
      [applicationId]
    );
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ message: "Gig application not found." });
    }
    const assocUser = checkRes.rows[0];
    if (assocUser.client_id !== clientId && assocUser.freelancer_id !== clientId) {
      return res.status(403).json({ message: "Access denied. You are not associated with this gig order." });
    }

    const updatedApp = await Gig.updateApplicationMilestones(applicationId, milestones);

    return res.status(200).json({
      message: "Gig application milestones updated successfully.",
      application: updatedApp
    });
  } catch (error) {
    console.error("Error updating gig application milestones:", error);
    return res.status(500).json({ message: "Internal server error while updating milestones." });
  }
};

