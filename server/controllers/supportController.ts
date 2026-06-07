import { Request, Response } from 'express';
import SupportMessage from '../models/SupportMessage';

const getUserSupportMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const messages = await SupportMessage.find({ user: req.user!._id })
      .populate('sender', 'username avatar role')
      .sort({ createdAt: 1 });

    await SupportMessage.updateMany(
      { user: req.user!._id, isAdmin: true, isRead: false },
      { isRead: true }
    );

    res.json(messages);
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};

const getUserSupportUnread = async (req: Request, res: Response): Promise<void> => {
  try {
    const unreadCount = await SupportMessage.countDocuments({
      user: req.user!._id,
      isAdmin: true,
      isRead: false,
    });
    res.json({ unreadCount });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};

const sendUserSupportMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { content } = req.body;
    if (!content) {
      res.status(400).json({ message: 'Content is required' });
      return;
    }

    const message = await SupportMessage.create({
      user: req.user!._id,
      sender: req.user!._id,
      content,
      isAdmin: false,
    });

    const populatedMessage = await SupportMessage.findById(message._id)
      .populate('sender', 'username avatar role');

    res.status(201).json(populatedMessage);
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};

const getAdminConversations = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await SupportMessage.distinct('user');

    const conversations = await Promise.all(users.map(async (userId) => {
      const lastMessage = await SupportMessage.findOne({ user: userId })
        .sort({ createdAt: -1 })
        .populate('user', 'username avatar email');

      const unreadCount = await SupportMessage.countDocuments({
        user: userId,
        isAdmin: false,
        isRead: false,
      });

      return {
        user: lastMessage!.user,
        lastMessage: lastMessage!.content,
        lastMessageAt: lastMessage!.createdAt,
        unreadCount,
      };
    }));

    conversations.sort((a, b) => {
      const aUnread = a.unreadCount > 0 ? 1 : 0;
      const bUnread = b.unreadCount > 0 ? 1 : 0;
      if (bUnread !== aUnread) return bUnread - aUnread;
      return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
    });

    res.json(conversations);
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};

const getAdminUserMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const messages = await SupportMessage.find({ user: req.params.userId })
      .populate('sender', 'username avatar role')
      .sort({ createdAt: 1 });

    await SupportMessage.updateMany(
      { user: req.params.userId, isAdmin: false, isRead: false },
      { isRead: true }
    );

    res.json(messages);
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};

const adminReplySupportMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { content } = req.body;
    if (!content) {
      res.status(400).json({ message: 'Content is required' });
      return;
    }

    const message = await SupportMessage.create({
      user: String(req.params.userId),
      sender: req.user!._id,
      content,
      isAdmin: true,
    });

    const populatedMessage = await SupportMessage.findById(message._id)
      .populate('sender', 'username avatar role');

    res.status(201).json(populatedMessage);
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};

const updateSupportMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { content } = req.body;
    const message = await SupportMessage.findById(req.params.id);

    if (!message) {
      res.status(404).json({ message: 'Message not found' });
      return;
    }

    if (message.sender.toString() !== req.user!._id.toString()) {
      res.status(403).json({ message: 'Not authorized' });
      return;
    }

    message.content = content;
    message.isEdited = true;
    await message.save();

    const populatedMessage = await SupportMessage.findById(message._id)
      .populate('sender', 'username avatar role');

    res.json(populatedMessage);
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};

const deleteSupportMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const message = await SupportMessage.findById(req.params.id);

    if (!message) {
      res.status(404).json({ message: 'Message not found' });
      return;
    }

    if (message.sender.toString() !== req.user!._id.toString()) {
      res.status(403).json({ message: 'Not authorized' });
      return;
    }

    await message.deleteOne();
    res.json({ message: 'Message withdrawn' });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ message: err.message });
  }
};

export {
  getUserSupportMessages,
  getUserSupportUnread,
  sendUserSupportMessage,
  getAdminConversations,
  getAdminUserMessages,
  adminReplySupportMessage,
  updateSupportMessage,
  deleteSupportMessage,
};
