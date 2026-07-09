import MessageModel from "../models/messageModel.js";
import Notification from "../models/notificationModel.js";
import pool from "../config/db.js";

// Helper to initialize chat room with system text
export const initializeChat = async (userOneId, userTwoId, contextTitle) => {
  try {
    const firstId = Math.min(userOneId, userTwoId);
    const secondId = Math.max(userOneId, userTwoId);

    // 1. Get or create conversation
    const conv = await MessageModel.createConversation(firstId, secondId);
    const conversationId = conv.conversation_id;

    // 2. Add system welcome message
    const systemMsg = `System: Offer accepted! Conversation started for "${contextTitle}". You can now discuss requirements and milestone deliverables.`;
    await MessageModel.createMessage(conversationId, firstId, systemMsg);

    return conversationId;
  } catch (err) {
    console.error("Error initializing chat:", err);
    throw err;
  }
};

// Helper to initialize project-wide group chat
export const initializeProjectGroupChat = async (clientId, freelancerId, jobId, contextTitle) => {
  try {
    // 1. Check if group chat already exists for this job_id
    const existingGroupRes = await pool.query(
      "SELECT conversation_id FROM conversations WHERE job_id = $1 AND is_group = TRUE",
      [jobId]
    );

    let conversationId;
    if (existingGroupRes.rows.length > 0) {
      conversationId = existingGroupRes.rows[0].conversation_id;
      
      // Add freelancer as participant (if not already there)
      await pool.query(
        `INSERT INTO conversation_participants (conversation_id, user_id)
         VALUES ($1, $2)
         ON CONFLICT (conversation_id, user_id) DO NOTHING`,
        [conversationId, freelancerId]
      );

      // Post system message notifying that the freelancer joined the group chat
      const freelancerNameRes = await pool.query(
        "SELECT CONCAT(first_name, ' ', last_name) as name FROM users WHERE user_id = $1",
        [freelancerId]
      );
      const name = freelancerNameRes.rows[0]?.name || "Freelancer";
      const systemMsg = `System: ${name} has joined the project group chat.`;
      await MessageModel.createMessage(conversationId, clientId, systemMsg);
    } else {
      // Create new group chat conversation
      const groupName = `Project Group: ${contextTitle}`;
      const insertConvRes = await pool.query(
        `INSERT INTO conversations (is_group, group_name, job_id)
         VALUES (TRUE, $1, $2)
         RETURNING conversation_id`,
        [groupName, jobId]
      );
      conversationId = insertConvRes.rows[0].conversation_id;

      // Add client and freelancer as participants
      await pool.query(
        `INSERT INTO conversation_participants (conversation_id, user_id)
         VALUES ($1, $2), ($1, $3)
         ON CONFLICT (conversation_id, user_id) DO NOTHING`,
        [conversationId, clientId, freelancerId]
      );

      // Post welcome message
      const systemMsg = `System: Group chat initialized for project "${contextTitle}". Client and all hired freelancers will be added here.`;
      await MessageModel.createMessage(conversationId, clientId, systemMsg);
    }

    return conversationId;
  } catch (err) {
    console.error("Error initializing project group chat:", err);
    throw err;
  }
};

export const getConversations = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const conversations = await MessageModel.findConversationsByUserId(userId);
    return res.status(200).json(conversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return res.status(500).json({ message: "Internal server error while fetching chats." });
  }
};

export const getMessages = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const conversationId = parseInt(req.params.conversationId);

    if (!conversationId || isNaN(conversationId)) {
      return res.status(400).json({ message: "Invalid conversation ID." });
    }

    // Verify conversation exists and user is part of it
    const convRes = await pool.query(
      "SELECT user_one_id, user_two_id, admin_id, is_group FROM conversations WHERE conversation_id = $1",
      [conversationId]
    );

    if (convRes.rows.length === 0) {
      return res.status(404).json({ message: "Conversation not found." });
    }

    const { user_one_id, user_two_id, admin_id, is_group } = convRes.rows[0];
    if (is_group) {
      const partCheck = await pool.query(
        "SELECT 1 FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2",
        [conversationId, userId]
      );
      if (partCheck.rows.length === 0) {
        return res.status(403).json({ message: "Access denied. You are not a participant in this group chat." });
      }
    } else {
      if (user_one_id !== userId && user_two_id !== userId && admin_id !== userId) {
        return res.status(403).json({ message: "Access denied. You are not part of this chat room." });
      }
    }

    const messages = await MessageModel.findMessagesByConversationId(conversationId);
    return res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return res.status(500).json({ message: "Internal server error while fetching message history." });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const senderId = req.user.user_id;
    const { conversation_id, message_text } = req.body;

    if (!conversation_id) {
      return res.status(400).json({ message: "Conversation ID is required." });
    }
    if (!message_text || !message_text.trim()) {
      return res.status(400).json({ message: "Message text is required." });
    }

    // Verify conversation exists and sender is part of it
    const convRes = await pool.query(
      "SELECT user_one_id, user_two_id, admin_id, is_group FROM conversations WHERE conversation_id = $1",
      [parseInt(conversation_id)]
    );

    if (convRes.rows.length === 0) {
      return res.status(404).json({ message: "Conversation not found." });
    }

    const { user_one_id, user_two_id, admin_id, is_group } = convRes.rows[0];
    if (is_group) {
      const partCheck = await pool.query(
        "SELECT 1 FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2",
        [parseInt(conversation_id), senderId]
      );
      if (partCheck.rows.length === 0) {
        return res.status(403).json({ message: "Access denied. You cannot post to this group chat." });
      }
    } else {
      if (user_one_id !== senderId && user_two_id !== senderId && admin_id !== senderId) {
        return res.status(403).json({ message: "Access denied. You cannot post to this chat room." });
      }
    }

    const message = await MessageModel.createMessage(
      conversation_id,
      senderId,
      message_text.trim()
    );

    // Retrieve sender details to match returned message details format in UI
    const senderRes = await pool.query(
      "SELECT CONCAT(first_name, ' ', last_name) as sender_name, profile_image as sender_profile_image FROM users WHERE user_id = $1",
      [senderId]
    );
    const sender = senderRes.rows[0];

    const chatMessage = {
      ...message,
      sender_name: sender.sender_name,
      sender_profile_image: sender.sender_profile_image
    };

    // Compile list of recipients
    const recipients = [];
    if (is_group) {
      const partsRes = await pool.query(
        "SELECT user_id FROM conversation_participants WHERE conversation_id = $1 AND user_id != $2",
        [parseInt(conversation_id), senderId]
      );
      partsRes.rows.forEach(r => recipients.push(r.user_id));
    } else {
      if (senderId === user_one_id) {
        recipients.push(user_two_id);
        if (admin_id) recipients.push(admin_id);
      } else if (senderId === user_two_id) {
        recipients.push(user_one_id);
        if (admin_id) recipients.push(admin_id);
      } else if (senderId === admin_id) {
        recipients.push(user_one_id);
        recipients.push(user_two_id);
      }
    }

    // Save persistent notification & emit socket events to each recipient
    for (const recipientId of recipients) {
      try {
        const notif = await Notification.create({
          userId: recipientId,
          title: `New Message from ${sender.sender_name}`,
          message: message_text.trim().length > 60 ? `${message_text.trim().substring(0, 60)}...` : message_text.trim(),
          type: "message",
          referenceId: conversation_id.toString()
        });

        if (req.io) {
          req.io.to(`user_${recipientId}`).emit("new_message", chatMessage);
          req.io.to(`user_${recipientId}`).emit("new_notification", notif);
        }
      } catch (notifErr) {
        console.error(`Failed to dispatch message notification to ${recipientId}:`, notifErr);
      }
    }

    return res.status(201).json({
      message: "Message sent successfully!",
      chatMessage
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return res.status(500).json({ message: "Internal server error while sending message." });
  }
};

export const getOrCreateConversation = async (req, res) => {
  try {
    const senderId = req.user.user_id;
    const { recipientId } = req.body;
    if (!recipientId) {
      return res.status(400).json({ message: "Recipient ID is required." });
    }
    const rId = parseInt(recipientId);
    if (isNaN(rId)) {
      return res.status(400).json({ message: "Invalid Recipient ID." });
    }
    if (senderId === rId) {
      return res.status(400).json({ message: "You cannot start a conversation with yourself." });
    }

    // Check if conversation exists
    let conv = await MessageModel.checkConversationExists(senderId, rId);
    if (!conv) {
      conv = await MessageModel.createConversation(senderId, rId);
      // Add a system welcome message
      await MessageModel.createMessage(conv.conversation_id, senderId, "System: Conversation started.");
    }
    return res.status(200).json({ conversationId: conv.conversation_id });
  } catch (error) {
    console.error("Error getting or creating conversation:", error);
    return res.status(500).json({ message: "Internal server error while retrieving/starting conversation." });
  }
};

