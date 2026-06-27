import express from 'express';
import auth from '../middleware/auth.js';
import {
  getUserNotifications,
  getUnreadCount,
  markRead,
  markAllRead
} from '../controllers/notificationController.js';

const router = express.Router();

router.use(auth);

router.get('/', getUserNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/read-all', markAllRead);
router.put('/:id/read', markRead);

export default router;
