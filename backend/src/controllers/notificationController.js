import Notification from '../models/notificationModel.js';

export const getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findByUserId(req.user.user_id);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.getUnreadCount(req.user.user_id);
    res.json({ unreadCount: count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.markAsRead(id, req.user.user_id);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found or unauthorized." });
    }
    res.json({ message: "Notification marked as read.", notification });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markAllRead = async (req, res) => {
  try {
    await Notification.markAllAsRead(req.user.user_id);
    res.json({ message: "All notifications marked as read." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
