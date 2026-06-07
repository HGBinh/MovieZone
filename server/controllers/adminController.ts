import { Request, Response } from 'express';
import mongoose, { Types } from 'mongoose';
import User from '../models/User';
import Comment from '../models/Comment';
import Movie from '../models/Movie';
import Banner from '../models/Banner';
import AdminMessage from '../models/AdminMessage';
import AdminChatGroup from '../models/AdminChatGroup';
import { IUserDocument } from '../models/User';

const epoch = (): Date => new Date(0);

const getPrivateReadAt = (userDoc: IUserDocument | null, adminId: Types.ObjectId | string): Date => {
  const entry = userDoc?.adminChatReadAt?.privateChats?.find(
    (p) => p.adminId?.toString() === adminId?.toString()
  );
  return entry?.readAt || epoch();
};

const getGroupReadAt = (userDoc: IUserDocument | null, groupId: Types.ObjectId | string): Date => {
  const entry = userDoc?.adminChatReadAt?.customGroups?.find(
    (g) => g.groupId?.toString() === groupId?.toString()
  );
  return entry?.readAt || epoch();
};

const markAdminChatRead = async (
  userId: Types.ObjectId,
  { receiverId, groupId }: { receiverId?: string; groupId?: string } = {}
): Promise<void> => {
  const now = new Date();
  const user = await User.findById(userId);
  if (!user) return;

  if (!user.adminChatReadAt) {
    user.adminChatReadAt = { defaultGroup: null, privateChats: [], customGroups: [] };
  }

  if (groupId) {
    const idx = user.adminChatReadAt.customGroups.findIndex(
      (g) => g.groupId?.toString() === groupId.toString()
    );
    if (idx >= 0) {
      user.adminChatReadAt.customGroups[idx].readAt = now;
    } else {
      user.adminChatReadAt.customGroups.push({
        groupId: new Types.ObjectId(groupId),
        readAt: now,
      });
    }
  } else if (receiverId && receiverId !== 'group') {
    const idx = user.adminChatReadAt.privateChats.findIndex(
      (p) => p.adminId?.toString() === receiverId.toString()
    );
    if (idx >= 0) {
      user.adminChatReadAt.privateChats[idx].readAt = now;
    } else {
      user.adminChatReadAt.privateChats.push({
        adminId: new Types.ObjectId(receiverId),
        readAt: now,
      });
    }
  } else {
    user.adminChatReadAt.defaultGroup = now;
  }

  await user.save();
};

const getAdminChatUnread = async (req: Request, res: Response): Promise<void> => {
  try {
    const me = req.user!._id;
    const user = await User.findById(me).select('adminChatReadAt');
    const defaultReadAt = user?.adminChatReadAt?.defaultGroup || epoch();
    const threads: Array<{
      type: string;
      id: string;
      unreadCount: number;
      lastMessageAt: Date | null;
      lastMessage: string;
    }> = [];

    const defaultLast = await AdminMessage.findOne({ receiver: null, group: null })
      .sort({ createdAt: -1 })
      .select('content createdAt');
    const defaultUnread = await AdminMessage.countDocuments({
      receiver: null,
      group: null,
      user: { $ne: me },
      createdAt: { $gt: defaultReadAt },
    });
    threads.push({
      type: 'defaultGroup',
      id: 'group',
      unreadCount: defaultUnread,
      lastMessageAt: defaultLast?.createdAt || null,
      lastMessage: defaultLast?.content || '',
    });

    const otherAdmins = await User.find({ role: 'admin', _id: { $ne: me } }).select('_id');
    for (const admin of otherAdmins) {
      const readAt = getPrivateReadAt(user, admin._id);
      const lastMsg = await AdminMessage.findOne({
        group: null,
        $or: [
          { user: admin._id, receiver: me },
          { user: me, receiver: admin._id },
        ],
      })
        .sort({ createdAt: -1 })
        .select('content createdAt');
      const unreadCount = await AdminMessage.countDocuments({
        group: null,
        user: admin._id,
        receiver: me,
        createdAt: { $gt: readAt },
      });
      threads.push({
        type: 'private',
        id: admin._id.toString(),
        unreadCount,
        lastMessageAt: lastMsg?.createdAt || null,
        lastMessage: lastMsg?.content || '',
      });
    }

    const groups = await AdminChatGroup.find({ members: me }).select('_id updatedAt');
    for (const group of groups) {
      const readAt = getGroupReadAt(user, group._id);
      const lastMsg = await AdminMessage.findOne({ group: group._id })
        .sort({ createdAt: -1 })
        .select('content createdAt');
      const unreadCount = await AdminMessage.countDocuments({
        group: group._id,
        user: { $ne: me },
        createdAt: { $gt: readAt },
      });
      threads.push({
        type: 'group',
        id: group._id.toString(),
        unreadCount,
        lastMessageAt: lastMsg?.createdAt || group.updatedAt || null,
        lastMessage: lastMsg?.content || '',
      });
    }

    const withUnread = threads.filter((t) => t.unreadCount > 0);

    res.json({
      threads,
      unreadThreads: withUnread.length,
      totalUnreadMessages: threads.reduce((sum, t) => sum + t.unreadCount, 0),
    });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};

const getAllAdmins = async (req: Request, res: Response): Promise<void> => {
  try {
    const admins = await User.find({ role: 'admin' }).select('username avatar email');
    res.json(admins);
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};

const getAdminMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { receiverId, groupId } = req.query;

    let query: Record<string, unknown>;

    if (groupId) {
      const group = await AdminChatGroup.findById(groupId);
      if (!group) {
        res.status(404).json({ message: 'Group not found' });
        return;
      }
      const isMember = group.members.some(
        (m: Types.ObjectId) => m.toString() === req.user!._id.toString()
      );
      if (!isMember) {
        res.status(403).json({ message: 'Not a member of this group' });
        return;
      }
      query = { group: groupId };
    } else if (receiverId && receiverId !== 'group') {
      query = {
        $or: [
          { user: req.user!._id, receiver: receiverId },
          { user: receiverId, receiver: req.user!._id },
        ],
      };
    } else {
      query = { receiver: null, group: null };
    }

    const messages = await AdminMessage.find(query)
      .populate('user', 'username avatar')
      .populate('receiver', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(50);

    await markAdminChatRead(req.user!._id, {
      receiverId: receiverId as string | undefined,
      groupId: groupId as string | undefined,
    });

    res.json(messages.reverse());
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};

const sendAdminMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { content, receiverId, groupId } = req.body;
    if (!content) {
      res.status(400).json({ message: 'Content is required' });
      return;
    }

    const messageData: {
      user: Types.ObjectId;
      content: string;
      receiver?: Types.ObjectId | null;
      group?: Types.ObjectId | null;
    } = {
      user: req.user!._id,
      content,
    };

    if (groupId) {
      const group = await AdminChatGroup.findById(groupId);
      if (!group) {
        res.status(404).json({ message: 'Group not found' });
        return;
      }
      const isMember = group.members.some(
        (m: Types.ObjectId) => m.toString() === req.user!._id.toString()
      );
      if (!isMember) {
        res.status(403).json({ message: 'Not a member of this group' });
        return;
      }
      messageData.group = groupId;
      messageData.receiver = null;
    } else if (receiverId && receiverId !== 'group') {
      messageData.receiver = receiverId;
    } else {
      messageData.receiver = null;
      messageData.group = null;
    }

    const message = await AdminMessage.create(messageData);

    const populatedMessage = await AdminMessage.findById(message._id)
      .populate('user', 'username avatar')
      .populate('receiver', 'username avatar');
    res.status(201).json(populatedMessage);
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};

const getChatGroups = async (req: Request, res: Response): Promise<void> => {
  try {
    const groups = await AdminChatGroup.find({ members: req.user!._id })
      .populate('members', 'username avatar email')
      .populate('createdBy', 'username avatar')
      .populate('coAdmins', 'username avatar email')
      .sort({ updatedAt: -1 });
    res.json(groups);
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};

const createChatGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, memberIds = [] } = req.body;
    if (!name?.trim()) {
      res.status(400).json({ message: 'Group name is required' });
      return;
    }

    const validMemberIds = (memberIds as string[]).filter((id) =>
      mongoose.Types.ObjectId.isValid(id)
    );
    const memberSet = new Set([
      req.user!._id.toString(),
      ...validMemberIds.map((id) => id.toString()),
    ]);

    const group = await AdminChatGroup.create({
      name: name.trim(),
      createdBy: req.user!._id,
      members: Array.from(memberSet),
    });

    const populated = await AdminChatGroup.findById(group._id)
      .populate('members', 'username avatar email')
      .populate('createdBy', 'username avatar');

    res.status(201).json(populated);
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};

const updateChatGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, memberIds, coAdminIds } = req.body;
    const group = await AdminChatGroup.findById(req.params.id);

    if (!group) {
      res.status(404).json({ message: 'Group not found' });
      return;
    }

    const isCreator = group.createdBy.toString() === req.user!._id.toString();
    const isCoAdmin = group.coAdmins.some(
      (ca: Types.ObjectId) => ca.toString() === req.user!._id.toString()
    );
    const isMember = group.members.some(
      (m: Types.ObjectId) => m.toString() === req.user!._id.toString()
    );
    if (!isMember) {
      res.status(403).json({ message: 'Not authorized' });
      return;
    }

    if (name?.trim()) {
      if (!isCreator && !isCoAdmin) {
        res.status(403).json({ message: 'Only creator or co-admins can update name' });
        return;
      }
      group.name = name.trim();
    }

    if (Array.isArray(memberIds)) {
      if (!isCreator && !isCoAdmin) {
        res.status(403).json({ message: 'Only creator or co-admins can manage members' });
        return;
      }
      const memberSet = new Set([
        group.createdBy.toString(),
        ...memberIds
          .filter((id: string) => mongoose.Types.ObjectId.isValid(id))
          .map((id: string) => id.toString()),
      ]);
      group.members = Array.from(memberSet) as unknown as Types.ObjectId[];
    }

    if (Array.isArray(coAdminIds) && isCreator) {
      const coAdminSet = new Set(
        coAdminIds
          .filter((id: string) => mongoose.Types.ObjectId.isValid(id))
          .map((id: string) => id.toString())
      );
      group.coAdmins = Array.from(coAdminSet) as unknown as Types.ObjectId[];
    }

    await group.save();

    const populated = await AdminChatGroup.findById(group._id)
      .populate('members', 'username avatar email')
      .populate('createdBy', 'username avatar')
      .populate('coAdmins', 'username avatar email');

    res.json(populated);
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};

const deleteChatGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    const group = await AdminChatGroup.findById(req.params.id);
    if (!group) {
      res.status(404).json({ message: 'Group not found' });
      return;
    }
    if (group.createdBy.toString() !== req.user!._id.toString()) {
      res.status(403).json({ message: 'Only group creator can delete' });
      return;
    }

    await AdminMessage.deleteMany({ group: group._id });
    await group.deleteOne();
    res.json({ success: true, message: 'Group deleted' });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};

const leaveChatGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    const group = await AdminChatGroup.findById(req.params.id);
    if (!group) {
      res.status(404).json({ message: 'Group not found' });
      return;
    }

    const userId = req.user!._id.toString();
    const isMember = group.members.some((m: Types.ObjectId) => m.toString() === userId);
    if (!isMember) {
      res.status(403).json({ message: 'Not a group member' });
      return;
    }

    group.members = group.members.filter((m: Types.ObjectId) => m.toString() !== userId);
    group.coAdmins = group.coAdmins.filter((ca: Types.ObjectId) => ca.toString() !== userId);

    if (group.members.length === 0) {
      await AdminMessage.deleteMany({ group: group._id });
      await group.deleteOne();
      res.json({ left: true, groupDeleted: true });
      return;
    }

    if (group.createdBy.toString() === userId) {
      group.createdBy = group.members[0];
    }

    await group.save();

    const populated = await AdminChatGroup.findById(group._id)
      .populate('members', 'username avatar email')
      .populate('createdBy', 'username avatar')
      .populate('coAdmins', 'username avatar email');

    res.json({ left: true, groupDeleted: false, group: populated });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};

const deleteAdminMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const message = await AdminMessage.findById(req.params.id);
    if (!message) {
      res.status(404).json({ message: 'Message not found' });
      return;
    }

    if (message.user.toString() !== req.user!._id.toString()) {
      res.status(403).json({ message: 'Not authorized to delete this message' });
      return;
    }

    await message.deleteOne();
    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};

const updateAdminMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { content } = req.body;
    const message = await AdminMessage.findById(req.params.id);

    if (!message) {
      res.status(404).json({ message: 'Message not found' });
      return;
    }

    if (message.user.toString() !== req.user!._id.toString()) {
      res.status(403).json({ message: 'Not authorized to edit this message' });
      return;
    }

    message.content = content || message.content;
    message.isEdited = true;
    await message.save();

    const populatedMessage = await AdminMessage.findById(message._id)
      .populate('user', 'username avatar')
      .populate('receiver', 'username avatar');
    res.json(populatedMessage);
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};

const getAdminRequests = async (req: Request, res: Response): Promise<void> => {
  const requests = await User.find({ adminRequestStatus: 'pending' }).select('-password');
  res.json(requests);
};

const approveAdminRequest = async (req: Request, res: Response): Promise<void> => {
  const { status } = req.body;
  const user = await User.findById(req.params.userId);

  if (user) {
    user.adminRequestStatus = status;
    if (status === 'approved') {
      user.role = 'admin';
    }
    await user.save();
    res.json({ success: true, message: `Request ${status}` });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
};

const getAllComments = async (req: Request, res: Response): Promise<void> => {
  try {
    const comments = await Comment.find({})
      .populate('user', 'username avatar email')
      .populate('replies.user', 'username avatar')
      .sort({ createdAt: -1 });

    const movieIds = [...new Set(comments.map((c: { movieId: string }) => c.movieId))];
    const movies = await Movie.find({ tmdbId: { $in: movieIds as string[] } });
    const movieMap = movies.reduce<Record<string, string>>((acc, m) => {
      if (m.tmdbId) acc[m.tmdbId] = m.title;
      return acc;
    }, {});

    const commentsWithInfo = comments.map((c: {
      movieId: string;
      likes?: unknown[];
      replies: Array<{ likes?: unknown[]; toObject: () => Record<string, unknown> }>;
      reports?: unknown[];
      toObject: () => Record<string, unknown>;
    }) => ({
      ...c.toObject(),
      movieTitle: movieMap[c.movieId] || `Movie ID: ${c.movieId}`,
      likesCount: c.likes?.length || 0,
      repliesCount: c.replies?.length || 0,
      reportsCount: c.reports?.length || 0,
      replies: c.replies.map((r) => ({
        ...r.toObject(),
        likesCount: r.likes?.length || 0,
      })),
    }));

    res.json(commentsWithInfo);
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};

const updateComment = async (req: Request, res: Response): Promise<void> => {
  const { content } = req.body;
  const comment = await Comment.findById(req.params.id);

  if (comment) {
    comment.content = content || comment.content;
    await comment.save();
    res.json({ success: true, message: 'Comment updated' });
  } else {
    res.status(404);
    throw new Error('Comment not found');
  }
};

const deleteReply = async (req: Request, res: Response): Promise<void> => {
  const comment = await Comment.findById(req.params.id);

  if (comment) {
    comment.set(
      'replies',
      comment.replies.filter(
        (reply) => reply._id.toString() !== String(req.params.replyId)
      )
    );
    await comment.save();
    res.json({ success: true, message: 'Reply deleted' });
  } else {
    res.status(404);
    throw new Error('Comment not found');
  }
};

const updateReply = async (req: Request, res: Response): Promise<void> => {
  const { content } = req.body;
  const comment = await Comment.findById(req.params.id);

  if (comment) {
    const reply = comment.replies.find(
      (r: { _id: Types.ObjectId }) => r._id.toString() === req.params.replyId
    );
    if (reply) {
      reply.content = content || reply.content;
      await comment.save();
      res.json({ success: true, message: 'Reply updated' });
    } else {
      res.status(404);
      throw new Error('Reply not found');
    }
  } else {
    res.status(404);
    throw new Error('Comment not found');
  }
};

const deleteComment = async (req: Request, res: Response): Promise<void> => {
  const comment = await Comment.findById(req.params.id);
  if (comment) {
    await comment.deleteOne();
    res.json({ success: true, message: 'Comment deleted' });
  } else {
    res.status(404);
    throw new Error('Comment not found');
  }
};

const getStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userCount = await User.countDocuments();
    const commentCount = await Comment.countDocuments();
    const movieCount = await Movie.countDocuments();

    const activeUsers = await User.countDocuments({
      lastLogin: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    });

    const latestUsers = await User.find({}).sort({ createdAt: -1 }).limit(10).select('-password');

    const healthChart = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));

      const count = await User.countDocuments({
        lastLogin: { $gte: startOfDay, $lte: endOfDay },
      });

      healthChart.push({
        name: startOfDay.toLocaleDateString('vi-VN', { weekday: 'short' }),
        date: startOfDay.toLocaleDateString('vi-VN'),
        users: count,
      });
    }

    const movies = await Movie.find({});
    const genreMap: Record<string, number> = {};
    movies.forEach((m) => {
      if (m.genres && m.genres.length > 0) {
        const primaryGenre = m.genres[0];
        genreMap[primaryGenre] = (genreMap[primaryGenre] || 0) + 1;
      }
    });

    const movieStorage = Object.keys(genreMap).map((genre) => ({
      genre,
      count: genreMap[genre],
    }));

    const commonGenres = ['Hành Động', 'Anime', 'Tình Cảm', 'Kinh Dị', 'Viễn Tưởng', 'Hài Hước'];
    commonGenres.forEach((g) => {
      if (!genreMap[g]) {
        movieStorage.push({ genre: g, count: 0 });
      }
    });

    const latestComments = await Comment.find({})
      .populate('user', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      users: userCount,
      comments: commentCount,
      movies: movieCount,
      activeUsers,
      latestUsers,
      healthChart,
      movieStorage,
      latestComments,
    });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};

const toggleUserBan = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      if (user.role === 'admin' && req.user!.role !== 'admin') {
        res.status(403).json({ message: 'Cannot ban another admin' });
        return;
      }
      user.isBanned = !user.isBanned;
      await user.save();
      res.json({ success: true, isBanned: user.isBanned });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};

const updateUserRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { role } = req.body;
    const user = await User.findById(req.params.id);
    if (user) {
      user.role = role;
      await user.save();
      res.json({ success: true, role: user.role });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};

const addMovie = async (req: Request, res: Response): Promise<void> => {
  try {
    const movie = await Movie.create(req.body);
    res.status(201).json(movie);
  } catch (error) {
    const err = error as Error;
    res.status(400).json({ message: err.message });
  }
};

const updateMovie = async (req: Request, res: Response): Promise<void> => {
  try {
    const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (movie) {
      res.json(movie);
    } else {
      res.status(404).json({ message: 'Movie not found' });
    }
  } catch (error) {
    const err = error as Error;
    res.status(400).json({ message: err.message });
  }
};

const getAllMovies = async (req: Request, res: Response): Promise<void> => {
  const movies = await Movie.find({}).sort({ createdAt: -1 });
  res.json(movies);
};

const deleteMovie = async (req: Request, res: Response): Promise<void> => {
  const movie = await Movie.findById(req.params.id);
  if (movie) {
    await movie.deleteOne();
    res.json({ message: 'Movie removed' });
  } else {
    res.status(404);
    throw new Error('Movie not found');
  }
};

const addBanner = async (req: Request, res: Response): Promise<void> => {
  try {
    const body = { ...req.body } as Record<string, unknown>;
    if (!body.movie) body.movie = null;
    if (!body.link || body.link === '') body.link = null;
    const banner = await Banner.create(body);
    res.status(201).json(banner);
  } catch (error) {
    const err = error as Error;
    res.status(400).json({ message: err.message });
  }
};

const updateBanner = async (req: Request, res: Response): Promise<void> => {
  try {
    const body = { ...req.body } as Record<string, unknown>;
    if (body.movie === '' || body.movie === undefined) body.movie = null;
    if (body.link === '' || body.link === undefined) body.link = null;

    const banner = await Banner.findByIdAndUpdate(req.params.id, body, { new: true }).populate(
      'movie',
      'title posterPath description voteAverage releaseDate'
    );
    if (banner) {
      res.json(banner);
    } else {
      res.status(404).json({ message: 'Banner not found' });
    }
  } catch (error) {
    const err = error as Error;
    res.status(400).json({ message: err.message });
  }
};

const getAllBanners = async (req: Request, res: Response): Promise<void> => {
  const banners = await Banner.find({}).populate('movie', 'title');
  res.json(banners);
};

const deleteBanner = async (req: Request, res: Response): Promise<void> => {
  const banner = await Banner.findById(req.params.id);
  if (banner) {
    await banner.deleteOne();
    res.json({ message: 'Banner removed' });
  } else {
    res.status(404);
    throw new Error('Banner not found');
  }
};

const uploadMovieFile = async (req: Request, res: Response): Promise<void> => {
  if (req.file) {
    res.json({ url: (req.file as Express.Multer.File & { path: string }).path });
  } else {
    res.status(400);
    throw new Error('No file uploaded');
  }
};

const uploadBannerFile = async (req: Request, res: Response): Promise<void> => {
  if (req.file) {
    res.json({ url: (req.file as Express.Multer.File & { path: string }).path });
  } else {
    res.status(400);
    throw new Error('No file uploaded');
  }
};

export {
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
};
