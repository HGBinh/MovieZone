import express from 'express';
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  uploadAvatar,
  requestAdmin,
  getUserStats,
  getUserActivity,
  addToWatchHistory,
  deleteWatchHistory,
  checkEmailExists,
  resetPassword,
} from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';
import { avatarUpload } from '../middleware/uploadMiddleware';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/check-email', checkEmailExists);
router.post('/reset-password', resetPassword);
router.route('/profile').get(protect, getUserProfile).put(protect, updateUserProfile);
router.get('/stats', protect, getUserStats);
router.get('/activity', protect, getUserActivity);
router.post('/watch-history', protect, addToWatchHistory);
router.delete('/watch-history/:movieId', protect, deleteWatchHistory);
router.post('/upload-avatar', protect, avatarUpload.single('avatar'), uploadAvatar);
router.post('/request-admin', protect, requestAdmin);

export default router;
