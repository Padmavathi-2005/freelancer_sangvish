import pool from "../config/db.js";
import Notification from "../models/notificationModel.js";
import MessageModel from "../models/messageModel.js";
import { sendEmail } from "./emailHelper.js";
import { initializeChat, initializeProjectGroupChat } from "../controllers/messageController.js";

/**
 * Handles all notification dispatching (in-app, platform chat messages, emails)
 * and declines other proposals once a proposal is accepted and hired.
 */
export async function handlePostHireNotificationsAndActions({ proposalId, bidAmount, io }) {
  try {
    console.log(`📣 Post-hire notification triggering for proposalId: ${proposalId}...`);

    // 1. Fetch proposal details
    const proposalRes = await pool.query(
      `SELECT p.*, j.title as job_title, j.client_id, j.num_freelancers
       FROM proposals p
       JOIN jobs j ON p.job_id = j.job_id
       WHERE p.proposal_id = $1`,
      [proposalId]
    );
    const proposalDetails = proposalRes.rows[0];
    if (!proposalDetails) {
      console.error(`Proposal ID ${proposalId} not found in database for notifications.`);
      return;
    }

    // 2. Fetch site settings & email settings
    const siteSettingsRes = await pool.query("SELECT setting_value FROM settings WHERE setting_key = 'site_settings'");
    const siteSettings = siteSettingsRes.rows[0]?.setting_value || {};
    const siteName = siteSettings.site_name || "Buy2Lancer";
    const siteLogo = siteSettings.site_logo || "/public/logo.png";

    const emailSettingsRes = await pool.query("SELECT setting_value FROM settings WHERE setting_key = 'email_settings'");
    const emailSettings = emailSettingsRes.rows[0]?.setting_value || {};
    const emailId = emailSettings.email_id || "noreply@buy2lancer.com";

    // 3. Fetch Freelancer & Client info
    const freelancerUserRes = await pool.query(
      "SELECT first_name || ' ' || COALESCE(last_name, '') as name, email FROM users WHERE user_id = $1",
      [proposalDetails.freelancer_id]
    );
    const freelancerName = freelancerUserRes.rows[0]?.name || "Freelancer";
    const freelancerEmail = freelancerUserRes.rows[0]?.email;

    const clientUserRes = await pool.query(
      "SELECT first_name || ' ' || COALESCE(last_name, '') as name FROM users WHERE user_id = $1",
      [proposalDetails.client_id]
    );
    const clientName = clientUserRes.rows[0]?.name || "Client";

    // Parse num_freelancers to determine the limit
    let limit = 1;
    const numFreeStr = proposalDetails.num_freelancers || "1 freelancer";
    if (numFreeStr.includes("2-3")) {
      limit = 3;
    } else if (numFreeStr.includes("2-5")) {
      limit = 5;
    } else if (numFreeStr.includes("More than 5") || numFreeStr.includes("5+") || numFreeStr.includes("many") || numFreeStr.includes("4+")) {
      limit = 999;
    } else {
      const match = numFreeStr.match(/^(\d+)/);
      if (match) {
        limit = parseInt(match[1]);
      }
    }

    const hiredCountRes = await pool.query(
      "SELECT COUNT(*) FROM contracts WHERE job_id = $1 AND status != 'Cancelled'",
      [proposalDetails.job_id]
    );
    const hiredCount = parseInt(hiredCountRes.rows[0].count || 0);
    const limitReached = hiredCount >= limit;

    let otherProposalsRes = { rows: [] };
    if (limitReached) {
      // 4. Fetch other applicants to decline
      otherProposalsRes = await pool.query(
        `SELECT p.proposal_id, p.freelancer_id, p.bid_amount, u.email, u.first_name || ' ' || COALESCE(u.last_name, '') as name
         FROM proposals p
         JOIN users u ON u.user_id = p.freelancer_id
         WHERE p.job_id = $1 AND p.proposal_id != $2 AND p.status NOT IN ('Declined', 'Accepted')`,
        [proposalDetails.job_id, proposalId]
      );

      // 5. Auto-decline other proposals in DB
      await pool.query(
        "UPDATE proposals SET status = 'Declined', updated_at = CURRENT_TIMESTAMP WHERE job_id = $1 AND proposal_id != $2 AND status NOT IN ('Declined', 'Accepted')",
        [proposalDetails.job_id, proposalId]
      );

      // Set job status to Closed
      await pool.query("UPDATE jobs SET status = 'Closed' WHERE job_id = $1", [proposalDetails.job_id]);
    } else {
      // Ensure job remains open
      await pool.query("UPDATE jobs SET status = 'Open' WHERE job_id = $1", [proposalDetails.job_id]);
    }

    // 6. Notify other applicants
    for (const other of otherProposalsRes.rows) {
      try {
        // In-app notification
        const rejectNotif = await Notification.create({
          userId: other.freelancer_id,
          title: "Project Status Update",
          message: `The project "${proposalDetails.job_title}" you applied to (bid: $${parseFloat(other.bid_amount).toFixed(2)}) has been filled by another freelancer. Thank you for your proposal!`,
          type: "proposal",
          referenceId: proposalDetails.job_id.toString()
        });
        if (io) {
          io.to(`user_${other.freelancer_id}`).emit("new_notification", rejectNotif);
          io.to(`user_${other.freelancer_id}`).emit("proposal_status_updated", {
            proposal_id: other.proposal_id,
            status: "Declined"
          });
        }

        // Email Notification
        const rejectSubject = `Update on your proposal for "${proposalDetails.job_title}" on ${siteName}`;
        const rejectText = `Dear ${other.name},

Thank you for submitting a proposal of $${parseFloat(other.bid_amount).toFixed(2)} for the project "${proposalDetails.job_title}" on ${siteName}.

We wanted to let you know that the client has selected another freelancer for this project. Although you weren't chosen this time, we encourage you to keep applying to other opportunities on ${siteName}.

Best regards,
The ${siteName} Team
Contact: ${emailId}
Logo: ${siteLogo}`;
        await sendEmail({ to: other.email, subject: rejectSubject, text: rejectText });
      } catch (err) {
        console.error("Failed to notify rejected applicant:", err);
      }
    }

    // 7. Initialize Chats (1-on-1 and Group Chat)
    let conversationId = null;
    let groupConversationId = null;
    try {
      conversationId = await initializeChat(
        proposalDetails.client_id,
        proposalDetails.freelancer_id,
        proposalDetails.job_title
      );
    } catch (err) {
      console.error("Failed to automatically start chat conversation:", err);
    }

    try {
      groupConversationId = await initializeProjectGroupChat(
        proposalDetails.client_id,
        proposalDetails.freelancer_id,
        proposalDetails.job_id,
        proposalDetails.job_title
      );
      
      // Emit the welcome/message details to group room if socket is active
      if (groupConversationId && io) {
        const freelancerNameQuery = await pool.query(
          "SELECT CONCAT(first_name, ' ', last_name) as name FROM users WHERE user_id = $1",
          [proposalDetails.freelancer_id]
        );
        const flName = freelancerNameQuery.rows[0]?.name || "Freelancer";
        
        // Find latest message of group chat to format socket emit
        const latestMsgRes = await pool.query(
          "SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at DESC LIMIT 1",
          [groupConversationId]
        );
        const groupMsg = latestMsgRes.rows[0];
        if (groupMsg) {
          const groupSocketMessage = {
            ...groupMsg,
            sender_name: "System",
            sender_profile_image: null
          };
          
          // Fetch members to broadcast
          const membersRes = await pool.query(
            "SELECT user_id FROM conversation_participants WHERE conversation_id = $1",
            [groupConversationId]
          );
          for (const member of membersRes.rows) {
            io.to(`user_${member.user_id}`).emit("new_message", groupSocketMessage);
          }
        }
      }
    } catch (err) {
      console.error("Failed to automatically start group chat conversation:", err);
    }

    // 8. Notify Hired Freelancer
    try {
      // In-app notification
      const acceptNotif = await Notification.create({
        userId: proposalDetails.freelancer_id,
        title: "Proposal Accepted! 🎉",
        message: `Congratulations! Your proposal on the project "${proposalDetails.job_title}" was accepted by the client.`,
        type: "proposal",
        referenceId: proposalDetails.job_id.toString()
      });
      if (io) {
        io.to(`user_${proposalDetails.freelancer_id}`).emit("new_notification", acceptNotif);
        io.to(`user_${proposalDetails.freelancer_id}`).emit("proposal_status_updated", {
          proposal_id: proposalId,
          status: "Accepted"
        });
      }

      // Platform chat message from Site/Platform
      if (conversationId) {
        const platformMsg = `[${siteName} Platform Message]
Congratulations! You have been successfully hired by ${clientName} for the project "${proposalDetails.job_title}"!
- Bid Amount: $${parseFloat(bidAmount).toFixed(2)}
- Delivery Timeline: ${proposalDetails.delivery_days} days
Please coordinate details and milestones in this chat room.`;
        const msg = await MessageModel.createMessage(conversationId, proposalDetails.client_id, platformMsg);

        // Fetch client details as the sender profile to match inbox requirements
        const senderRes = await pool.query(
          "SELECT CONCAT(first_name, ' ', last_name) as sender_name, profile_image as sender_profile_image FROM users WHERE user_id = $1",
          [proposalDetails.client_id]
        );
        const sender = senderRes.rows[0] || {};
        const chatMessage = {
          ...msg,
          sender_name: sender.sender_name || "Client",
          sender_profile_image: sender.sender_profile_image || null
        };

        if (io) {
          io.to(`user_${proposalDetails.freelancer_id}`).emit("new_message", chatMessage);
          io.to(`user_${proposalDetails.client_id}`).emit("new_message", chatMessage);
        }
      }

      // Email Notification
      const acceptSubject = `You've been hired on ${siteName}! - ${proposalDetails.job_title}`;
      const acceptText = `Dear ${freelancerName},

Great news! The client ${clientName} has accepted your proposal and hired you for their project "${proposalDetails.job_title}" on ${siteName}.

Project Details:
- Project Name: ${proposalDetails.job_title}
- Budget: $${parseFloat(bidAmount).toFixed(2)}
- Delivery Days: ${proposalDetails.delivery_days}

Best regards,
The ${siteName} Team
Contact: ${emailId}
Logo: ${siteLogo}`;
      await sendEmail({ to: freelancerEmail, subject: acceptSubject, text: acceptText });
    } catch (err) {
      console.error("Failed to notify accepted freelancer:", err);
    }

  } catch (error) {
    console.error("Error in handlePostHireNotificationsAndActions helper:", error);
  }
}
