import express from 'express';
import {
  getAdminRequests,
  approveAdminRequest,
  getAllComments,
  deleteComment,
  getStats,
  addMovie,
  updateMovie,
  addBanner,
  updateBanner,
  getAllMovies,
  getAllBanners,
  deleteMovie,
  deleteBanner,
  updateComment,
  deleteReply,
  updateReply,
  uploadMovieFile,
  uploadBannerFile,
  toggleUserBan,
  updateUserRole,
  getAdminMessages,
  getAdminChatUnread,
  sendAdminMessage,
  deleteAdminMessage,
  updateAdminMessage,
  getChatGroups,
  createChatGroup,
  updateChatGroup,
  deleteChatGroup,
  leaveChatGroup,
  getAllAdmins,
} from '../controllers/adminController';
import { protect, admin } from '../middleware/authMiddleware';
import { movieUpload, bannerUpload } from '../middleware/uploadMiddleware';

const router = express.Router();

router.use(protect);
router.use(admin);

router.get('/requests', getAdminRequests);
router.patch('/approve-request/:userId', approveAdminRequest);

router.get('/chat/groups', getChatGroups);
router.get('/chat/unread', getAdminChatUnread);
router.post('/chat/groups', createChatGroup);
router.put('/chat/groups/:id', updateChatGroup);
router.delete('/chat/groups/:id', deleteChatGroup);
router.post('/chat/groups/:id/leave', leaveChatGroup);
router.get('/chat', getAdminMessages);
router.post('/chat', sendAdminMessage);
router.delete('/chat/:id', deleteAdminMessage);
router.put('/chat/:id', updateAdminMessage);

router.get('/comments', getAllComments);
router.put('/comments/:id', updateComment);
router.delete('/comments/:id', deleteComment);
router.delete('/comments/:id/replies/:replyId', deleteReply);
router.put('/comments/:id/replies/:replyId', updateReply);
router.get('/stats', getStats);

router.get('/users/admins', getAllAdmins);
router.patch('/users/:id/ban', toggleUserBan);
router.patch('/users/:id/role', updateUserRole);

router.post('/movies', addMovie);
router.put('/movies/:id', updateMovie);
router.post('/movies/upload', movieUpload.single('movie'), uploadMovieFile);
router.get('/movies', getAllMovies);
router.delete('/movies/:id', deleteMovie);
router.post('/banners', addBanner);
router.put('/banners/:id', updateBanner);
router.post('/banners/upload', bannerUpload.single('banner'), uploadBannerFile);
router.get('/banners', getAllBanners);
router.delete('/banners/:id', deleteBanner);

export default router;
