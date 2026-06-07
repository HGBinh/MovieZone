export interface User {
  _id: string;
  id?: string;
  username: string;
  email: string;
  avatar?: string;
  role: 'user' | 'admin';
  adminRequestStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  isBanned?: boolean;
  token: string;
}

export interface Movie {
  _id?: string;
  id?: string | number;
  title?: string;
  name?: string;
  overview?: string;
  description?: string;
  poster_path?: string;
  posterPath?: string;
  backdrop_path?: string;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  runtime?: number;
  genres?: Array<{ name: string } | string>;
  isLocal?: boolean;
  trailerUrl?: string;
  videos?: { results?: Array<{ site: string; type: string; key: string }> };
  [key: string]: unknown;
}

export interface Comment {
  _id: string;
  user?: User;
  content: string;
  rating?: number;
  movieId?: string;
  movieTitle?: string;
  createdAt?: string;
  updatedAt?: string;
  likes?: string[];
  replies?: CommentReply[];
  reportsCount?: number;
}

export interface CommentReply {
  _id?: string;
  user?: User;
  content: string;
  createdAt?: string;
}

export interface Banner {
  _id: string;
  title?: string;
  description?: string;
  image?: string;
  link?: string;
  movie?: Movie | string;
}

export interface AdminMessage {
  _id: string;
  user?: User;
  receiver?: User | string;
  group?: string;
  content: string;
  isEdited?: boolean;
  createdAt?: string;
}

export interface ChatGroup {
  _id: string;
  name: string;
  members?: User[];
  createdBy?: User | string;
  isChatGroup?: boolean;
}

export interface SupportConversation {
  user: User;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface SupportMessage {
  _id: string;
  sender?: User;
  content: string;
  isAdmin: boolean;
  isRead?: boolean;
  createdAt?: string;
}

export interface ChatUnreadThread {
  type: 'defaultGroup' | 'private' | 'group';
  id: string;
  unreadCount: number;
  lastMessageAt?: string;
  lastMessage?: string;
}

export interface ChatUnreadSummary {
  threads: ChatUnreadThread[];
  unreadThreads: number;
  totalUnreadMessages: number;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  theme: 'dark' | 'light';
  lang: string;
  isModalOpen: boolean;
  login: (data: { email: string; password: string }) => Promise<{ success: boolean; message?: string }>;
  register: (data: Record<string, string>) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  toggleTheme: () => void;
  toggleLang: () => void;
  updateProfile: (data: Record<string, unknown>) => Promise<{ success: boolean; message?: string }>;
  uploadAvatar: (formData: FormData) => Promise<{ success: boolean; avatar?: string; message?: string }>;
  requestAdmin: () => Promise<{ success: boolean; message?: string }>;
  setIsModalOpen: (open: boolean) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
}

export type ChatReceiver = 'group' | User | ChatGroup;

export interface EditingMessage {
  id: string;
  content: string;
}

export interface AdminStats {
  users: number;
  comments: number;
  movies: number;
  activeUsers: number;
  latestUsers: User[];
  healthChart: Record<string, unknown>[];
  movieStorage: Record<string, unknown>[];
  latestComments: Comment[];
}

export interface MovieListResponse {
  results: Movie[];
  page?: number;
  total_pages?: number;
  total_results?: number;
}

export interface NavLinkItem {
  name: string;
  path?: string;
  type?: 'dropdown';
  items?: string[];
  protected?: boolean;
}

export interface UploadingState {
  movie: boolean;
  banner: boolean;
}

export type ThemeMode = 'dark' | 'light';
