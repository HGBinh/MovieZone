import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { Types } from 'mongoose';
import User, { IUserDocument } from '../models/User';
import Favorite from '../models/Favorite';
import Comment from '../models/Comment';

const registerUser = async (req: Request, res: Response): Promise<void> => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    res.status(400);
    throw new Error('Please add all fields');
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const user = await User.create({
    username,
    email,
    password,
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
};

const loginUser = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password') as IUserDocument | null;

  if (user && (await user.matchPassword(password))) {
    if (user.isBanned) {
      res.status(403);
      throw new Error('Tài khoản của bạn đã bị ban! Vui lòng liên hệ admin để được hỗ trợ.');
    }

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      adminRequestStatus: user.adminRequestStatus,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error('Invalid credentials');
  }
};

const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  res.status(200).json(req.user);
};

const updateUserProfile = async (req: Request, res: Response): Promise<void> => {
  const user = await User.findById(req.user!._id);

  if (user) {
    user.username = req.body.username || user.username;
    user.email = req.body.email || user.email;
    user.avatar = req.body.avatar || user.avatar;

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role,
      avatar: updatedUser.avatar,
      token: generateToken(updatedUser._id),
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
};

const uploadAvatar = async (req: Request, res: Response): Promise<void> => {
  console.log('--- DEBUG UPLOAD AVATAR ---');
  console.log('req.file:', req.file);
  console.log('req.user:', req.user);
  console.log('Cloudinary Config:', {
    name: process.env.CLOUDINARY_CLOUD_NAME,
    key: process.env.CLOUDINARY_API_KEY ? 'EXISTS' : 'MISSING',
    secret: process.env.CLOUDINARY_API_SECRET ? 'EXISTS' : 'MISSING',
  });

  try {
    if (!req.file) {
      console.log('ERROR: No file in request');
      res.status(400).json({ message: 'Please upload an image' });
      return;
    }

    const userId = req.user!._id || req.user!.id;
    const user = await User.findById(userId);

    if (!user) {
      console.log('ERROR: User not found with ID:', userId);
      res.status(404).json({ message: 'User not found' });
      return;
    }

    user.avatar = (req.file as Express.Multer.File & { path: string }).path;
    await user.save();

    console.log('SUCCESS: Avatar updated for user:', user.username);
    res.json({
      success: true,
      avatar: user.avatar,
    });
  } catch (error) {
    const err = error as Error;
    console.log('CATCH ERROR:', err.message);
    res.status(500).json({ message: err.message });
  }
};

const generateToken = (id: Types.ObjectId): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET as string, {
    expiresIn: '30d',
  });
};

const getUserStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const favoritesCount = await Favorite.countDocuments({ user: req.user!._id });
    const userComments = await Comment.find({ user: req.user!._id });

    const commentsCount = userComments.length;
    let avgRating = 0;

    if (commentsCount > 0) {
      const totalRating = userComments.reduce(
        (sum: number, comment: { rating?: number }) => sum + (comment.rating || 0),
        0
      );
      avgRating = Number((totalRating / commentsCount).toFixed(1));
    }

    res.json({
      favorites: favoritesCount,
      comments: commentsCount,
      avgRating,
    });
  } catch {
    res.status(500).json({ message: 'Error fetching user stats' });
  }
};

const getUserActivity = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;

    const comments = await Comment.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(20);

    const likedComments = await Comment.find({ likes: userId })
      .populate('user', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(20);

    const commentsWithUserReplies = await Comment.find({ 'replies.user': userId })
      .populate('user', 'username avatar')
      .sort({ updatedAt: -1 })
      .limit(20);

    const user = await User.findById(userId).select('watchHistory');

    res.json({
      comments,
      likedComments,
      replies: commentsWithUserReplies,
      watchHistory: user?.watchHistory || [],
    });
  } catch {
    res.status(500).json({ message: 'Error fetching user activity' });
  }
};

const addToWatchHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { movieId, title, posterPath } = req.body;
    const mid = movieId != null ? String(movieId).trim() : '';

    if (!mid) {
      res.status(400).json({ message: 'movieId is required' });
      return;
    }

    const entry = {
      movieId: mid,
      title: String(title || 'Unknown').slice(0, 300),
      posterPath: posterPath != null ? String(posterPath).slice(0, 500) : '',
      watchedAt: new Date(),
    };

    await User.updateOne(
      { _id: req.user!._id },
      { $pull: { watchHistory: { movieId: mid } } }
    );

    const user = await User.findOneAndUpdate(
      { _id: req.user!._id },
      {
        $push: {
          watchHistory: {
            $each: [entry],
            $position: 0,
            $slice: 50,
          },
        },
      },
      { new: true, select: 'watchHistory' }
    );

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({ success: true, watchHistory: user.watchHistory });
  } catch (error) {
    const err = error as Error;
    console.error('addToWatchHistory error:', err.message);
    res.status(500).json({ message: 'Error updating watch history' });
  }
};

const deleteWatchHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { movieId } = req.params;
    const user = await User.findById(req.user!._id);

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (movieId === 'all') {
      user.watchHistory = [];
    } else {
      user.watchHistory = user.watchHistory.filter(
        (item) => item.movieId.toString() !== movieId
      );
    }

    await user.save();
    res.json({ success: true, watchHistory: user.watchHistory });
  } catch {
    res.status(500).json({ message: 'Error deleting watch history' });
  }
};

const checkEmailExists = async (req: Request, res: Response): Promise<void> => {
  const email = req.body.email?.toLowerCase().trim();
  console.log('\x1b[36m%s\x1b[0m', '--- FORGOT PASSWORD DEBUG ---');
  console.log('1. Email input:', email);

  try {
    const user = await User.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });

    if (user) {
      console.log('2. User found:', user.username);

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      console.log('3. Generated OTP:', otp);

      const emailData = {
        service_id: process.env.EMAILJS_SERVICE_ID,
        template_id: process.env.EMAILJS_TEMPLATE_ID,
        user_id: process.env.EMAILJS_PUBLIC_KEY,
        accessToken: process.env.EMAILJS_PRIVATE_KEY,
        template_params: {
          passcode: otp,
          username: user.username,
          user_email: email,
        },
      };

      try {
        console.log('4. Sending request to EmailJS...');
        const emailResponse = await axios.post(
          'https://api.emailjs.com/api/v1.0/email/send',
          emailData,
          { headers: { 'Content-Type': 'application/json' } }
        );

        console.log('5. EmailJS Response:', emailResponse.data);

        res.status(200).json({
          success: true,
          message: 'Mã OTP đã được gửi đến email của bạn',
          username: user.username,
          otp: otp,
        });
        return;
      } catch (emailError) {
        const err = emailError as { response?: { status: number; data: unknown }; message: string };
        console.error('5. EmailJS ERROR DETECTED:');
        if (err.response) {
          console.error('Status:', err.response.status);
          console.error('Data:', err.response.data);
        } else {
          console.error('Message:', err.message);
        }

        res.status(500).json({
          success: false,
          message: `Lỗi gửi Email: ${err.response?.data || err.message}`,
        });
        return;
      }
    } else {
      console.log('2. User NOT found for email:', email);
      res.status(404).json({
        success: false,
        message: 'Email không tồn tại trong hệ thống',
      });
      return;
    }
  } catch (error) {
    console.error('CRITICAL ERROR:', error);
    res.status(500).json({ success: false, message: 'Lỗi hệ thống khi kiểm tra email' });
  }
};

const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const email = req.body.email?.toLowerCase().trim();
  const { newPassword } = req.body;

  console.log('--- DEBUG FORGOT PASSWORD: RESET PASSWORD ---');
  console.log('Resetting password for email:', email);

  try {
    const user = await User.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });

    if (user) {
      user.password = newPassword;
      await user.save();
      console.log('Password updated successfully for:', user.username);
      res.json({
        success: true,
        message: 'Mật khẩu đã được cập nhật thành công',
      });
    } else {
      console.log('User NOT found for reset password:', email);
      res.status(404).json({
        success: false,
        message: 'Người dùng không tồn tại',
      });
    }
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
  }
};

const requestAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user!._id);

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (user.role === 'admin') {
      res.status(400).json({ message: 'Bạn đã là Admin rồi' });
      return;
    }

    if (user.adminRequestStatus === 'pending') {
      res.status(400).json({ message: 'Yêu cầu của bạn đang chờ được duyệt' });
      return;
    }

    user.adminRequestStatus = 'pending';
    await user.save();

    res.json({ success: true, message: 'Yêu cầu quyền Admin đã được gửi' });
  } catch {
    res.status(500).json({ message: 'Error requesting admin rights' });
  }
};

export {
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
};
