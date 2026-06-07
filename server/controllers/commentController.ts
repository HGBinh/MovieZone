import { Request, Response } from 'express';
import { Types } from 'mongoose';
import Comment from '../models/Comment';
import Movie from '../models/Movie';

const syncLocalMovieRating = async (movieId: string): Promise<number | null> => {
  const comments = await Comment.find({ movieId });
  if (!comments.length) return null;

  const avg = comments.reduce((sum, c) => sum + (c.rating || 0), 0) / comments.length;
  const rounded = Number(avg.toFixed(1));

  if (movieId.startsWith('local_')) {
    const localId = movieId.replace('local_', '');
    await Movie.findByIdAndUpdate(localId, { voteAverage: rounded });
  }

  return rounded;
};

const getComments = async (req: Request, res: Response): Promise<void> => {
  try {
    const comments = await Comment.find({ movieId: req.params.movieId })
      .populate('user', 'username avatar')
      .populate('replies.user', 'username avatar')
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch {
    res.status(500).json({ message: 'Error fetching comments' });
  }
};

const addComment = async (req: Request, res: Response): Promise<void> => {
  const { movieId, content, rating } = req.body;

  try {
    const comment = await Comment.create({
      user: req.user!._id,
      movieId,
      content,
      rating,
    });

    const populatedComment = await Comment.findById(comment._id).populate(
      'user',
      'username avatar'
    );

    const communityRating = await syncLocalMovieRating(movieId);

    res.status(201).json({ ...populatedComment!.toObject(), communityRating });
  } catch {
    res.status(500).json({ message: 'Error adding comment' });
  }
};

const updateComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      res.status(404).json({ message: 'Comment not found' });
      return;
    }

    if (comment.user.toString() !== req.user!._id.toString()) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    comment.content = req.body.content || comment.content;
    comment.rating = req.body.rating || comment.rating;

    const updatedComment = await comment.save();
    const populatedComment = await Comment.findById(updatedComment._id).populate(
      'user',
      'username avatar'
    );

    const communityRating = await syncLocalMovieRating(comment.movieId);

    res.json({ ...populatedComment!.toObject(), communityRating });
  } catch {
    res.status(500).json({ message: 'Error updating comment' });
  }
};

const deleteComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      res.status(404).json({ message: 'Comment not found' });
      return;
    }

    if (
      comment.user.toString() !== req.user!._id.toString() &&
      req.user!.role !== 'admin'
    ) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    const movieId = comment.movieId;
    await comment.deleteOne();
    const communityRating = await syncLocalMovieRating(movieId);
    res.json({ message: 'Comment removed', communityRating });
  } catch {
    res.status(500).json({ message: 'Error deleting comment' });
  }
};

const likeComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      res.status(404).json({ message: 'Comment not found' });
      return;
    }

    const isLiked = comment.likes.includes(req.user!._id);

    if (isLiked) {
      comment.likes = comment.likes.filter(
        (id: Types.ObjectId) => id.toString() !== req.user!._id.toString()
      );
    } else {
      comment.likes.push(req.user!._id);
    }

    await comment.save();
    res.json({ likes: comment.likes });
  } catch {
    res.status(500).json({ message: 'Error liking comment' });
  }
};

const addReply = async (req: Request, res: Response): Promise<void> => {
  const { content, replyToUser } = req.body;

  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      res.status(404).json({ message: 'Comment not found' });
      return;
    }

    comment.replies.push({
      user: req.user!._id,
      content,
      replyToUser,
    });

    await comment.save();

    const updatedComment = await Comment.findById(comment._id)
      .populate('user', 'username avatar')
      .populate('replies.user', 'username avatar');

    res.json(updatedComment);
  } catch {
    res.status(500).json({ message: 'Error adding reply' });
  }
};

const likeReply = async (req: Request, res: Response): Promise<void> => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      res.status(404).json({ message: 'Comment not found' });
      return;
    }

    const reply = comment.replies.id(String(req.params.replyId));
    if (!reply) {
      res.status(404).json({ message: 'Reply not found' });
      return;
    }

    if (!reply.likes) {
      reply.likes = [];
    }

    const isLiked = reply.likes.includes(req.user!._id);

    if (isLiked) {
      reply.likes = reply.likes.filter(
        (id: Types.ObjectId) => id.toString() !== req.user!._id.toString()
      );
    } else {
      reply.likes.push(req.user!._id);
    }

    await comment.save();
    res.json({ likes: reply.likes });
  } catch {
    res.status(500).json({ message: 'Error liking reply' });
  }
};

const reportComment = async (req: Request, res: Response): Promise<void> => {
  const { reason } = req.body;

  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      res.status(404).json({ message: 'Comment not found' });
      return;
    }

    const alreadyReported = comment.reports.some(
      (r) => r.user?.toString() === req.user!._id.toString()
    );

    if (alreadyReported) {
      res.status(400).json({ message: 'You already reported this comment' });
      return;
    }

    comment.reports.push({
      user: req.user!._id,
      reason,
    });

    await comment.save();
    res.json({ message: 'Comment reported successfully' });
  } catch {
    res.status(500).json({ message: 'Error reporting comment' });
  }
};

const deleteReply = async (req: Request, res: Response): Promise<void> => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      res.status(404).json({ message: 'Comment not found' });
      return;
    }

    const reply = comment.replies.id(String(req.params.replyId));

    if (!reply) {
      res.status(404).json({ message: 'Reply not found' });
      return;
    }

    if (
      reply.user.toString() !== req.user!._id.toString() &&
      req.user!.role !== 'admin'
    ) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    comment.set(
      'replies',
      comment.replies.filter(
        (r) => r._id.toString() !== String(req.params.replyId)
      )
    );

    await comment.save();
    res.json({ message: 'Reply removed' });
  } catch {
    res.status(500).json({ message: 'Error deleting reply' });
  }
};

export {
  getComments,
  addComment,
  updateComment,
  deleteComment,
  likeComment,
  addReply,
  likeReply,
  reportComment,
  deleteReply,
};
