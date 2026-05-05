import express from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // All notification routes require authentication

router.route('/').get(getNotifications);
router.route('/unread-count').get(getUnreadCount);
router.route('/read-all').put(markAllAsRead);
router.route('/:id/read').put(markAsRead);
router.route('/:id').delete(deleteNotification);

export default router;
