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
      "SELECT user_one_id, user_two_id FROM conversations WHERE conversation_id = $1",
      [conversationId]
    );

    if (convRes.rows.length === 0) {
      return res.status(404).json({ message: "Conversation not found." });
    }

    const { user_one_id, user_two_id } = convRes.rows[0];
    if (user_one_id !== userId && user_two_id !== userId) {
      return res.status(403).json({ message: "Access denied. You are not part of this chat room." });
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
      "SELECT user_one_id, user_two_id FROM conversations WHERE conversation_id = $1",
      [parseInt(conversation_id)]
    );

    if (convRes.rows.length === 0) {
      return res.status(404).json({ message: "Conversation not found." });
    }

    const { user_one_id, user_two_id } = convRes.rows[0];
    if (user_one_id !== senderId && user_two_id !== senderId) {
      return res.status(403).json({ message: "Access denied. You cannot post to this chat room." });
    }

    const message = await MessageModel.createMessage(
      conversation_id,
      senderId,
      message_text.trim()
    );

    // Retrieve sender details to match returned message details format in UI
    const senderRes = await pool.query(
      "SELECT first_name || ' ' || last_name as sender_name, profile_image as sender_profile_image FROM users WHERE user_id = $1",
      [senderId]
    );
    const sender = senderRes.rows[0];

    const recipientId = user_one_id === senderId ? user_two_id : user_one_id;

    // Save persistent notification
    const notif = await Notification.create({
      userId: recipientId,
      title: "New Message",
      message: message_text.trim().length > 60 ? `${message_text.trim().substring(0, 60)}...` : message_text.trim(),
      type: "message",
      referenceId: conversation_id.toString()
    });

    const chatMessage = {
      ...message,
      sender_name: sender.sender_name,
      sender_profile_image: sender.sender_profile_image
    };

    // Emit Socket.io real-time events to recipient room
    if (req.io) {
      req.io.to(`user_${recipientId}`).emit("new_message", chatMessage);
      req.io.to(`user_${recipientId}`).emit("new_notification", notif);
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

