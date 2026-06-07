import mongoose, { Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUserDocument extends Document {
  username: string;
  email: string;
  password: string;
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
    privateChats: Array<{ adminId: mongoose.Types.ObjectId; readAt: Date }>;
    customGroups: Array<{ groupId: mongoose.Types.ObjectId; readAt: Date }>;
  };
  matchPassword(enteredPassword: string): Promise<boolean>;
  isModified(path: string): boolean;
}

export interface IUserModel extends Model<IUserDocument> {}

const userSchema = new mongoose.Schema<IUserDocument>(
  {
    username: {
      type: String,
      required: [true, 'Please add a username'],
      unique: true,
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: 6,
      select: false,
    },
    avatar: {
      type: String,
      default: 'https://i.pravatar.cc/150?u=moviezone',
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    adminRequestStatus: {
      type: String,
      enum: ['none', 'pending', 'approved', 'rejected'],
      default: 'none',
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    favorites: [
      {
        type: String,
      },
    ],
    watchHistory: [
      {
        movieId: { type: String, required: true },
        title: { type: String },
        posterPath: { type: String },
        watchedAt: { type: Date, default: Date.now },
      },
    ],
    adminChatReadAt: {
      defaultGroup: { type: Date, default: null },
      privateChats: [
        {
          adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
          readAt: { type: Date, default: Date.now },
        },
      ],
      customGroups: [
        {
          groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminChatGroup' },
          readAt: { type: Date, default: Date.now },
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre('save', async function (this: IUserDocument) {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (
  this: IUserDocument,
  enteredPassword: string
) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model<IUserDocument, IUserModel>('User', userSchema);

export default User;
