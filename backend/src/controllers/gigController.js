import Gig from "../models/gigModel.js";
import Notification from "../models/notificationModel.js";
import pool from "../config/db.js";
import { initializeChat } from "./messageController.js";
import jwt from "jsonwebtoken";

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
      skills,
      negotiation,
      discount_percent,
      payment_type,
      min_price,
      max_price,
      milestones,
      slug,
      plans,
      faqs,
      seo
    } = req.body;

    // Validations
    if (plans && Array.isArray(plans)) {
      if (plans.length > 3) {
        return res.status(400).json({ message: "A maximum of 3 pricing plans are allowed." });
      }
      for (const p of plans) {
        if (!p.name || !p.name.trim()) {
          return res.status(400).json({ message: "Each plan must have a title/name." });
        }
        if (p.price === undefined || isNaN(p.price) || parseFloat(p.price) <= 0) {
          return res.status(400).json({ message: `Plan '${p.name}' must have a valid positive price.` });
        }
        if (!p.delivery_days || isNaN(p.delivery_days) || parseInt(p.delivery_days) <= 0) {
          return res.status(400).json({ message: `Plan '${p.name}' must have positive delivery days.` });
        }
      }
    }

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
      documents,
      negotiation,
      discount_percent,
      payment_type || 'fixed',
      min_price || null,
      max_price || null,
      milestones || null
    );

    // Save unique slug
    let finalSlug = slug ? slug.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '') : title.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
    if (!finalSlug) finalSlug = `gig-${gig.gig_id}`;

    let isUnique = false;
    let counter = 1;
    let uniqueSlug = finalSlug;
    while (!isUnique) {
      const check = await pool.query("SELECT 1 FROM gigs WHERE slug = $1 AND gig_id != $2", [uniqueSlug, gig.gig_id]);
      if (check.rows.length === 0) {
        isUnique = true;
      } else {
        uniqueSlug = `${finalSlug}-${counter++}`;
      }
    }
    await pool.query("UPDATE gigs SET slug = $1 WHERE gig_id = $2", [uniqueSlug, gig.gig_id]);

    // Save plans if provided
    if (plans && Array.isArray(plans)) {
      await pool.query("UPDATE gigs SET plans = $1 WHERE gig_id = $2", [JSON.stringify(plans), gig.gig_id]);
    }

    // Save faqs if provided
    if (faqs) {
      await pool.query("UPDATE gigs SET faqs = $1 WHERE gig_id = $2", [typeof faqs === 'string' ? faqs : JSON.stringify(faqs), gig.gig_id]);
    }

    // Save seo if provided
    if (seo) {
      await pool.query("UPDATE gigs SET seo = $1 WHERE gig_id = $2", [typeof seo === 'string' ? seo : JSON.stringify(seo), gig.gig_id]);
    }

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
    const excludeUserId = req.user?.user_id;
    const gigs = await Gig.findAllActive(excludeUserId);
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
      `SELECT g.freelancer_id AS freelancer_user_id, g.title 
       FROM gigs g
       WHERE g.gig_id = $1`,
      [parseInt(gig_id)]
    );
    if (gigRes.rows.length === 0) {
      return res.status(444).json({ message: "The gig no longer exists." });
    }
    const gig = gigRes.rows[0];

    if (gig.freelancer_user_id === clientId) {
      return res.status(400).json({ message: "You cannot order your own service gig." });
    }

    const finalMilestones = milestones && Array.isArray(milestones) && milestones.length > 0 ? milestones : [];
    const milestonesSum = finalMilestones.reduce((sum, m) => sum + parseFloat(m.amount || 0), 0);
    const totalPrice = parseFloat(price) + milestonesSum;

    const application = await Gig.createApplication(gig_id, clientId, requirements, totalPrice, currency_id, finalMilestones);

    // Save extra feature milestones to gig_application_milestones table if provided
    if (finalMilestones.length > 0) {
      for (const m of finalMilestones) {
        await pool.query(
          `INSERT INTO gig_application_milestones (application_id, title, description, amount, start_date, end_date)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            application.application_id,
            m.title,
            m.description || null,
            parseFloat(m.amount || 0),
            m.start_date || null,
            m.end_date || null
          ]
        );
      }
    }

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
    
    // Fetch milestones for each application
    for (const app of applications) {
      if (app.contract_id) {
        const msRes = await pool.query(
          "SELECT * FROM contract_milestones WHERE contract_id = $1 ORDER BY milestone_id ASC",
          [app.contract_id]
        );
        app.milestones = msRes.rows;
      } else {
        const msRes = await pool.query(
          "SELECT * FROM gig_application_milestones WHERE application_id = $1 ORDER BY id ASC",
          [app.application_id]
        );
        app.milestones = msRes.rows;
      }
    }

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

    // Wallet Payment Logic — Payment and contract creation now happen when client pays
    // via the payment panel in ClientOrdersTab (Stripe/PayPal/Wallet).
    // Accepting simply confirms the freelancer is ready to work.
    // The client will receive a notification to pay, and the contract is created after payment.

    const application = await Gig.updateApplicationStatus(id, status);

    if (status === "Completed") {
      const contractRes = await pool.query(
        "SELECT * FROM contracts WHERE application_id = $1",
        [parseInt(id)]
      );
      if (contractRes.rows.length > 0) {
        const contract = contractRes.rows[0];
        if (contract.status !== 'Completed') {
          await pool.query("BEGIN");
          try {
            // Get system escrow wallet
            const sysWalletRes = await pool.query("SELECT * FROM wallets WHERE is_system = TRUE");
            const systemWallet = sysWalletRes.rows[0];

            // Get freelancer wallet
            let freelancerWalletRes = await pool.query("SELECT * FROM wallets WHERE user_id = $1", [contract.freelancer_id]);
            let freelancerWallet = freelancerWalletRes.rows[0];
            if (!freelancerWallet) {
              const ins = await pool.query(
                "INSERT INTO wallets (user_id, balance, currency) VALUES ($1, 0.00, 'USD') RETURNING *",
                [contract.freelancer_id]
              );
              freelancerWallet = ins.rows[0];
            }

            // Find all unpaid milestones for this contract to calculate remaining payout
            const unpaidMilestonesRes = await pool.query(
              "SELECT * FROM contract_milestones WHERE contract_id = $1 AND payment_status != 'Paid'",
              [contract.contract_id]
            );
            const totalUnpaidAmount = unpaidMilestonesRes.rows.reduce((sum, m) => sum + parseFloat(m.amount), 0);

            if (totalUnpaidAmount > 0 && systemWallet) {
              // Calculate platform fee commission based on standard platform fee
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
              const commissionAmount = totalUnpaidAmount * commissionPercent;
              const freelancerAmount = totalUnpaidAmount - commissionAmount;

              // Debit system wallet, credit freelancer wallet
              await pool.query(
                "UPDATE wallets SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = $2",
                [freelancerAmount, systemWallet.wallet_id]
              );
              await pool.query(
                "UPDATE wallets SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = $2",
                [freelancerAmount, freelancerWallet.wallet_id]
              );

              // Record transactions
              await pool.query(
                `INSERT INTO wallet_transactions (sender_wallet_id, receiver_wallet_id, amount, commission_amount, type, status, description)
                 VALUES ($1, $2, $3, $4, 'Milestone_Release', 'Completed', $5)`,
                [
                  systemWallet.wallet_id,
                  freelancerWallet.wallet_id,
                  freelancerAmount,
                  commissionAmount,
                  `Escrow release upon gig completion for contract: ${contract.title}`
                ]
              );
            }

            // Update milestones status to completed/paid
            await pool.query(
              "UPDATE contract_milestones SET status = 'Completed', payment_status = 'Paid', updated_at = CURRENT_TIMESTAMP WHERE contract_id = $1",
              [contract.contract_id]
            );

            // Update contract status to completed and progress to 100%
            await pool.query(
              "UPDATE contracts SET status = 'Completed', progress = 100, completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE contract_id = $1",
              [contract.contract_id]
            );

            await pool.query("COMMIT");
          } catch (txErr) {
            await pool.query("ROLLBACK");
            console.error("Escrow payout failed on gig completion:", txErr);
          }
        }
      }
    }

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
    
    // Fetch milestones for each application
    for (const app of applications) {
      if (app.contract_id) {
        const msRes = await pool.query(
          "SELECT * FROM contract_milestones WHERE contract_id = $1 ORDER BY milestone_id ASC",
          [app.contract_id]
        );
        app.milestones = msRes.rows;
      } else {
        const msRes = await pool.query(
          "SELECT * FROM gig_application_milestones WHERE application_id = $1 ORDER BY id ASC",
          [app.application_id]
        );
        app.milestones = msRes.rows;
      }
    }

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
      `SELECT ga.client_id, ga.status, g.freelancer_id 
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

    await pool.query("BEGIN");
    try {
      if (assocUser.status === "Accepted") {
        const contractRes = await pool.query(
          "SELECT contract_id FROM contracts WHERE application_id = $1",
          [applicationId]
        );
        if (contractRes.rows.length > 0) {
          const contractId = contractRes.rows[0].contract_id;
          await pool.query("DELETE FROM contract_milestones WHERE contract_id = $1", [contractId]);
          for (const m of milestones) {
            const statusVal = m.status || (m.completed === true || m.completed === 'true' ? 'Completed' : 'Pending');
            const paymentVal = m.payment_status || (m.paid === true || m.paid === 'true' ? 'Paid' : 'Pending');
            await pool.query(
              `INSERT INTO contract_milestones (contract_id, title, description, amount, start_date, end_date, status, payment_status)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
              [
                contractId,
                m.title,
                m.description || null,
                parseFloat(m.amount),
                m.start_date || null,
                m.end_date || null,
                statusVal,
                paymentVal
              ]
            );
          }
        }
      } else {
        await pool.query("DELETE FROM gig_application_milestones WHERE application_id = $1", [applicationId]);
        for (const m of milestones) {
          await pool.query(
            `INSERT INTO gig_application_milestones (application_id, title, description, amount, start_date, end_date)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              applicationId,
              m.title,
              m.description || null,
              parseFloat(m.amount),
              m.start_date || null,
              m.end_date || null
            ]
          );
        }
      }

      await Gig.updateApplicationMilestones(applicationId, milestones);
      await pool.query("COMMIT");
    } catch (txErr) {
      await pool.query("ROLLBACK");
      throw txErr;
    }

    const updatedApp = await pool.query("SELECT * FROM gig_applications WHERE application_id = $1", [applicationId]).then(r => r.rows[0]);
    if (updatedApp) {
      const msRes = await pool.query(
        "SELECT * FROM gig_application_milestones WHERE application_id = $1 ORDER BY id ASC",
        [applicationId]
      );
      updatedApp.milestones = msRes.rows;
    }

    return res.status(200).json({
      message: "Gig application milestones updated successfully.",
      application: updatedApp
    });
  } catch (error) {
    console.error("Error updating gig application milestones:", error);
    return res.status(500).json({ message: "Internal server error while updating milestones." });
  }
};

export const deleteFreelancerGig = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;

    // Check ownership
    const checkRes = await pool.query("SELECT * FROM gigs WHERE gig_id = $1 AND freelancer_id = $2", [parseInt(id), userId]);
    if (checkRes.rows.length === 0) {
      return res.status(403).json({ message: "Gig not found or not owned by you." });
    }

    // Delete gig
    await pool.query("DELETE FROM gigs WHERE gig_id = $1", [parseInt(id)]);

    return res.status(200).json({ message: "Gig deleted successfully!" });
  } catch (error) {
    console.error("Error deleting gig:", error);
    return res.status(500).json({ message: "Internal server error while deleting gig." });
  }
};

export const updateFreelancerGig = async (req, res) => {
  try {
    const { id } = req.params;
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
      skills,
      negotiation,
      discount_percent,
      payment_type,
      min_price,
      max_price,
      milestones,
      slug,
      plans,
      faqs,
      seo
    } = req.body;

    // Validations
    if (plans && Array.isArray(plans)) {
      if (plans.length > 3) {
        return res.status(400).json({ message: "A maximum of 3 pricing plans are allowed." });
      }
      for (const p of plans) {
        if (!p.name || !p.name.trim()) {
          return res.status(400).json({ message: "Each plan must have a title/name." });
        }
        if (p.price === undefined || isNaN(p.price) || parseFloat(p.price) <= 0) {
          return res.status(400).json({ message: `Plan '${p.name}' must have a valid positive price.` });
        }
        if (!p.delivery_days || isNaN(p.delivery_days) || parseInt(p.delivery_days) <= 0) {
          return res.status(400).json({ message: `Plan '${p.name}' must have positive delivery days.` });
        }
      }
    }

    // Check ownership
    const checkRes = await pool.query("SELECT * FROM gigs WHERE gig_id = $1 AND freelancer_id = $2", [parseInt(id), userId]);
    if (checkRes.rows.length === 0) {
      return res.status(403).json({ message: "Gig not found or not owned by you." });
    }

    // Update gig details
    const query = `
      UPDATE gigs
      SET 
        category_id = $1,
        sub_category_id = $2,
        title = $3,
        description = $4,
        price = $5,
        currency_id = $6,
        delivery_days = $7,
        revisions = $8,
        images = $9,
        video_url = $10,
        documents = $11,
        negotiation = $12,
        discount_percent = $13,
        payment_type = $14,
        min_price = $15,
        max_price = $16,
        milestones = $17,
        updated_at = CURRENT_TIMESTAMP
      WHERE gig_id = $18
      RETURNING *
    `;
    const values = [
      category_id ? parseInt(category_id) : null,
      sub_category_id ? parseInt(sub_category_id) : null,
      title,
      description,
      parseFloat(price),
      currency_id ? parseInt(currency_id) : null,
      parseInt(delivery_days),
      revisions ? parseInt(revisions) : null,
      images ? JSON.stringify(images) : null,
      video_url || null,
      documents ? JSON.stringify(documents) : null,
      !!negotiation,
      parseFloat(discount_percent) || 0,
      payment_type || 'fixed',
      min_price ? parseFloat(min_price) : null,
      max_price ? parseFloat(max_price) : null,
      milestones ? (typeof milestones === 'string' ? milestones : JSON.stringify(milestones)) : null,
      parseInt(id)
    ];

    const result = await pool.query(query, values);

    if (slug) {
      let finalSlug = slug.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
      if (!finalSlug) finalSlug = `gig-${id}`;

      let isUnique = false;
      let counter = 1;
      let uniqueSlug = finalSlug;
      while (!isUnique) {
        const check = await pool.query("SELECT 1 FROM gigs WHERE slug = $1 AND gig_id != $2", [uniqueSlug, parseInt(id)]);
        if (check.rows.length === 0) {
          isUnique = true;
        } else {
          uniqueSlug = `${finalSlug}-${counter++}`;
        }
      }
      await pool.query("UPDATE gigs SET slug = $1 WHERE gig_id = $2", [uniqueSlug, parseInt(id)]);
    }

    if (plans && Array.isArray(plans)) {
      await pool.query("UPDATE gigs SET plans = $1 WHERE gig_id = $2", [JSON.stringify(plans), parseInt(id)]);
    }

    if (faqs) {
      await pool.query("UPDATE gigs SET faqs = $1 WHERE gig_id = $2", [typeof faqs === 'string' ? faqs : JSON.stringify(faqs), parseInt(id)]);
    } else {
      await pool.query("UPDATE gigs SET faqs = NULL WHERE gig_id = $1", [parseInt(id)]);
    }

    if (seo) {
      await pool.query("UPDATE gigs SET seo = $1 WHERE gig_id = $2", [typeof seo === 'string' ? seo : JSON.stringify(seo), parseInt(id)]);
    } else {
      await pool.query("UPDATE gigs SET seo = NULL WHERE gig_id = $1", [parseInt(id)]);
    }

    // Update skills (delete old, insert new)
    await pool.query("DELETE FROM gig_skills WHERE gig_id = $1", [parseInt(id)]);
    if (skills && Array.isArray(skills) && skills.length > 0) {
      for (const skillId of skills) {
        await pool.query("INSERT INTO gig_skills (gig_id, skill_id) VALUES ($1, $2)", [parseInt(id), parseInt(skillId)]);
      }
    }

    // Fetch the updated gig with joins
    const freelancerGigs = await Gig.findByFreelancerId(userId);
    const fullyPopulatedGig = freelancerGigs.find((g) => g.gig_id === parseInt(id));

    return res.status(200).json({
      message: "Gig updated successfully!",
      gig: fullyPopulatedGig || result.rows[0]
    });
  } catch (error) {
    console.error("Error updating gig:", error);
    return res.status(500).json({ message: "Internal server error while updating gig." });
  }
};

export const getClientGigById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (id === "applications") {
      return next();
    }
    const isNumeric = /^\d+$/.test(id);

    // Increment views count
    if (isNumeric) {
      await pool.query(
        "UPDATE gigs SET views = COALESCE(views, 0) + 1 WHERE gig_id = $1",
        [parseInt(id)]
      );
    } else {
      await pool.query(
        "UPDATE gigs SET views = COALESCE(views, 0) + 1 WHERE slug = $1",
        [id]
      );
    }

    const lookupField = isNumeric ? "g.gig_id" : "g.slug";
    const lookupVal = isNumeric ? parseInt(id) : id;

    const query = `
      SELECT 
        g.*,
        u.slug as freelancer_slug,
        u.first_name || COALESCE(' ' || u.last_name, '') as freelancer_name,
        u.profile_image as freelancer_image,
        u.email as freelancer_email,
        fp.professional_title as freelancer_title,
        fp.hourly_rate as freelancer_hourly_rate,
        c.code as currency_code,
        c.symbol as currency_symbol,
        c.name as currency_name,
        cat.category_name,
        sub.sub_category_name,
        COALESCE(
          json_agg(
            json_build_object('skill_id', s.skill_id, 'skill_name', s.skill_name)
          ) FILTER (WHERE s.skill_id IS NOT NULL), '[]'::json
        ) as skills
      FROM gigs g
      JOIN users u ON g.freelancer_id = u.user_id
      LEFT JOIN freelancer_profiles fp ON g.freelancer_id = fp.user_id
      LEFT JOIN currencies c ON g.currency_id = c.currency_id
      LEFT JOIN categories cat ON g.category_id = cat.category_id
      LEFT JOIN sub_categories sub ON g.sub_category_id = sub.sub_category_id
      LEFT JOIN gig_skills gs ON g.gig_id = gs.gig_id
      LEFT JOIN skills s ON gs.skill_id = s.skill_id
      WHERE ${lookupField} = $1 AND g.status = 'Active'
      GROUP BY g.gig_id, u.user_id, u.slug, fp.user_id, fp.professional_title, fp.hourly_rate, c.currency_id, c.code, c.symbol, c.name, cat.category_id, cat.category_name, sub.sub_category_id, sub.sub_category_name
    `;
    const result = await pool.query(query, [lookupVal]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Gig not found or not active." });
    }

    const gigData = result.rows[0];

    // Calculate user subscription plan discount if logged in
    let discountPercent = 0;
    let planName = "";
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.split(" ")[1];
      if (token) {
        try {
          const JWT_SECRET = process.env.JWT_SECRET || "mysecretkey";
          const decoded = jwt.verify(token, JWT_SECRET);
          const userId = decoded.user_id;

          const planQuery = await pool.query(
            `SELECT sp.gig_discount_percent, sp.name
             FROM users u
             LEFT JOIN subscription_plans sp ON u.active_plan_id = sp.plan_id
             WHERE u.user_id = $1`,
            [userId]
          );

          if (planQuery.rows.length > 0 && planQuery.rows[0].gig_discount_percent) {
            discountPercent = parseInt(planQuery.rows[0].gig_discount_percent);
            planName = planQuery.rows[0].name;
          }
        } catch (e) {
          console.error("JWT verify failed or query failed in getClientGigById:", e);
        }
      }
    }

    gigData.plan_discount_percent = discountPercent;
    gigData.plan_name = planName;
    const basePrice = parseFloat(gigData.price || 0);
    if (discountPercent > 0) {
      gigData.discounted_price = parseFloat((basePrice - (basePrice * discountPercent / 100)).toFixed(2));
    } else {
      gigData.discounted_price = basePrice;
    }

    // Fetch Reviews
    const reviewsRes = await pool.query(
      `SELECT gr.*, u.first_name || ' ' || u.last_name as client_name, u.profile_image as client_image 
       FROM gig_reviews gr
       JOIN users u ON gr.client_id = u.user_id
       WHERE gr.gig_id = $1
       ORDER BY gr.created_at DESC`,
      [gigData.gig_id]
    );
    gigData.reviews = reviewsRes.rows;

    return res.status(200).json(gigData);
  } catch (error) {
    console.error("Error fetching gig by ID:", error);
    return res.status(500).json({ message: "Internal server error while fetching gig." });
  }
};

export const getSimilarGigs = async (req, res) => {
  try {
    const { id } = req.params;
    const isNumeric = /^\d+$/.test(id);
    
    // First, find category/subcategory of the current gig
    const currentGigRes = isNumeric
      ? await pool.query("SELECT gig_id, category_id, sub_category_id FROM gigs WHERE gig_id = $1", [parseInt(id)])
      : await pool.query("SELECT gig_id, category_id, sub_category_id FROM gigs WHERE slug = $1", [id]);

    if (currentGigRes.rows.length === 0) {
      return res.status(404).json({ message: "Gig not found" });
    }
    const { gig_id, category_id, sub_category_id } = currentGigRes.rows[0];
    
    const query = `
      SELECT 
        g.*,
        u.first_name || COALESCE(' ' || u.last_name, '') as freelancer_name,
        c.code as currency_code,
        c.symbol as currency_symbol,
        cat.category_name,
        sub.sub_category_name
      FROM gigs g
      JOIN users u ON g.freelancer_id = u.user_id
      LEFT JOIN currencies c ON g.currency_id = c.currency_id
      LEFT JOIN categories cat ON g.category_id = cat.category_id
      LEFT JOIN sub_categories sub ON g.sub_category_id = sub.sub_category_id
      WHERE g.status = 'Active' AND g.gig_id != $1 AND (g.sub_category_id = $2 OR g.category_id = $3)
      ORDER BY g.created_at DESC
      LIMIT 4
    `;
    const result = await pool.query(query, [gig_id, sub_category_id, category_id]);
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching similar gigs:", error);
    return res.status(500).json({ message: "Internal server error while fetching similar gigs." });
  }
};

export const syncGigWishlist = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    if (action === "add") {
      await pool.query(
        "UPDATE gigs SET wishlist_count = COALESCE(wishlist_count, 0) + 1 WHERE gig_id = $1",
        [parseInt(id)]
      );
    } else if (action === "remove") {
      await pool.query(
        "UPDATE gigs SET wishlist_count = GREATEST(COALESCE(wishlist_count, 0) - 1, 0) WHERE gig_id = $1",
        [parseInt(id)]
      );
    }

    return res.status(200).json({ message: "Wishlist sync successful." });
  } catch (error) {
    console.error("Error syncing wishlist:", error);
    return res.status(500).json({ message: "Internal server error while syncing wishlist." });
  }
};

export const createGigReview = async (req, res) => {
  try {
    const { id } = req.params;
    const clientId = req.user.user_id;
    const { rating, comment, application_id } = req.body;

    if (!rating || isNaN(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "A valid rating between 1 and 5 is required." });
    }
    if (!application_id) {
      return res.status(400).json({ message: "Application ID is required." });
    }

    const existing = await pool.query(
      "SELECT review_id FROM gig_reviews WHERE application_id = $1",
      [parseInt(application_id)]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: "You have already reviewed this order." });
    }

    await pool.query(
      `INSERT INTO gig_reviews (gig_id, client_id, application_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5)`,
      [parseInt(id), parseInt(clientId), parseInt(application_id), parseFloat(rating), comment || ""]
    );

    await pool.query(
      `UPDATE gigs 
       SET reviews_count = (SELECT COUNT(*) FROM gig_reviews WHERE gig_id = $1),
           reviews_avg_rating = (SELECT COALESCE(ROUND(AVG(rating), 1), 5.0) FROM gig_reviews WHERE gig_id = $1)
       WHERE gig_id = $1`,
      [parseInt(id)]
    );

    return res.status(201).json({ message: "Review submitted successfully!" });
  } catch (error) {
    console.error("Error creating gig review:", error);
    return res.status(500).json({ message: "Internal server error while creating review." });
  }
};

export const validateGigSlug = async (req, res) => {
  try {
    const { slug, excludeGigId } = req.query;
    if (!slug) {
      return res.status(400).json({ message: "Slug is required." });
    }
    
    let query = "SELECT 1 FROM gigs WHERE slug = $1";
    const params = [slug.toLowerCase().trim()];
    
    if (excludeGigId) {
      query += " AND gig_id != $2";
      params.push(parseInt(excludeGigId));
    }
    
    const result = await pool.query(query, params);
    const available = result.rows.length === 0;
    
    return res.status(200).json({ available });
  } catch (error) {
    console.error("Error validating gig slug:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

