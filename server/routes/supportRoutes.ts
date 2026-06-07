import express from 'express';
import {
  getUserSupportMessages,
  getUserSupportUnread,
  sendUserSupportMessage,
  getAdminConversations,
  getAdminUserMessages,
  adminReplySupportMessage,
  updateSupportMessage,
  deleteSupportMessage,
} from '../controllers/supportController';
import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

router.put('/:id', protect, updateSupportMessage);
router.delete('/:id', protect, deleteSupportMessage);

router.get('/unread', protect, getUserSupportUnread);
router.get('/', protect, getUserSupportMessages);
router.post('/', protect, sendUserSupportMessage);

router.get('/admin/conversations', protect, admin, getAdminConversations);
router.get('/admin/:userId', protect, admin, getAdminUserMessages);
router.post('/admin/:userId', protect, admin, adminReplySupportMessage);

export default router;
