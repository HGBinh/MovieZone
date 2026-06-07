import express from 'express';
import {
  getComments,
  addComment,
  updateComment,
  deleteComment,
  likeComment,
  addReply,
  likeReply,
  deleteReply,
  reportComment,
} from '../controllers/commentController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/:movieId', getComments);
router.post('/', protect, addComment);
router.put('/:id', protect, updateComment);
router.delete('/:id', protect, deleteComment);
router.post('/:id/like', protect, likeComment);
router.post('/:id/reply', protect, addReply);
router.post('/:id/reply/:replyId/like', protect, likeReply);
router.delete('/:id/reply/:replyId', protect, deleteReply);
router.post('/:id/report', protect, reportComment);

export default router;
