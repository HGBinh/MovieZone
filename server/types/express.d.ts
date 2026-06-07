import { Types } from 'mongoose';

export interface IUser {
  _id: Types.ObjectId;
  id?: string;
  username: string;
  email: string;
  password?: string;
  avatar: string;
  role: 'user' | 'admin';
  adminRequestStatus: 'none' | 'pending' | 'approved' | 'rejected';
  isBanned: boolean;
  lastLogin: Date;
  favorites: string[];
  watchHistory: Array<{
    movieId: string;
    title?: string;
    posterPath?: string;
    watchedAt: Date;
  }>;
  adminChatReadAt?: {
    defaultGroup: Date | null;
    privateChats: Array<{ adminId: Types.ObjectId; readAt: Date }>;
    customGroups: Array<{ groupId: Types.ObjectId; readAt: Date }>;
  };
  matchPassword?(enteredPassword: string): Promise<boolean>;
}

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export {};
