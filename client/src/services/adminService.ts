import axios from 'axios';
import type {
  AdminMessage,
  Banner,
  ChatGroup,
  ChatUnreadSummary,
  Comment,
  Movie,
  User,
} from '../types';

const API_URL = `${import.meta.env.VITE_API_URL}/admin`;

const authHeaders = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
});

const adminService = {
  getStats: async (token: string): Promise<Record<string, unknown>> => {
    const res = await axios.get(`${API_URL}/stats`, authHeaders(token));
    return res.data;
  },

  getRequests: async (token: string): Promise<User[]> => {
    const res = await axios.get(`${API_URL}/requests`, authHeaders(token));
    return res.data;
  },

  getComments: async (token: string): Promise<Comment[]> => {
    const res = await axios.get(`${API_URL}/comments`, authHeaders(token));
    return res.data;
  },

  getMovies: async (token: string): Promise<Movie[]> => {
    const res = await axios.get(`${API_URL}/movies`, authHeaders(token));
    return res.data;
  },

  getBanners: async (token: string): Promise<Banner[]> => {
    const res = await axios.get(`${API_URL}/banners`, authHeaders(token));
    return res.data;
  },

  approveRequest: async (token: string, userId: string, status: string): Promise<unknown> => {
    const res = await axios.patch(`${API_URL}/approve-request/${userId}`, { status }, authHeaders(token));
    return res.data;
  },

  updateUserRole: async (token: string, userId: string, role: string): Promise<User> => {
    const res = await axios.patch(`${API_URL}/users/${userId}/role`, { role }, authHeaders(token));
    return res.data;
  },

  deleteComment: async (token: string, commentId: string): Promise<unknown> => {
    const res = await axios.delete(`${API_URL}/comments/${commentId}`, authHeaders(token));
    return res.data;
  },

  deleteReply: async (token: string, commentId: string, replyId: string): Promise<unknown> => {
    const res = await axios.delete(`${API_URL}/comments/${commentId}/replies/${replyId}`, authHeaders(token));
    return res.data;
  },

  updateReply: async (token: string, commentId: string, replyId: string, content: string): Promise<Comment> => {
    const res = await axios.put(`${API_URL}/comments/${commentId}/replies/${replyId}`, { content }, authHeaders(token));
    return res.data;
  },

  updateComment: async (token: string, commentId: string, data: Record<string, unknown>): Promise<Comment> => {
    const res = await axios.put(`${API_URL}/comments/${commentId}`, data, authHeaders(token));
    return res.data;
  },

  addMovie: async (token: string, movieData: Record<string, unknown>): Promise<Movie> => {
    const res = await axios.post(`${API_URL}/movies`, movieData, authHeaders(token));
    return res.data;
  },

  updateMovie: async (token: string, movieId: string, movieData: Record<string, unknown>): Promise<Movie> => {
    const res = await axios.put(`${API_URL}/movies/${movieId}`, movieData, authHeaders(token));
    return res.data;
  },

  uploadFile: async (token: string, type: string, formData: FormData): Promise<{ url?: string; path?: string }> => {
    const res = await axios.post(`${API_URL}/${type}s/upload`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  deleteMovie: async (token: string, movieId: string): Promise<unknown> => {
    const res = await axios.delete(`${API_URL}/movies/${movieId}`, authHeaders(token));
    return res.data;
  },

  addBanner: async (token: string, bannerData: Record<string, unknown>): Promise<Banner> => {
    const res = await axios.post(`${API_URL}/banners`, bannerData, authHeaders(token));
    return res.data;
  },

  updateBanner: async (token: string, bannerId: string, bannerData: Record<string, unknown>): Promise<Banner> => {
    const res = await axios.put(`${API_URL}/banners/${bannerId}`, bannerData, authHeaders(token));
    return res.data;
  },

  deleteBanner: async (token: string, bannerId: string): Promise<unknown> => {
    const res = await axios.delete(`${API_URL}/banners/${bannerId}`, authHeaders(token));
    return res.data;
  },

  getChatUnread: async (token: string): Promise<ChatUnreadSummary> => {
    const res = await axios.get(`${API_URL}/chat/unread`, authHeaders(token));
    return res.data;
  },

  getMessages: async (token: string, { receiverId, groupId }: { receiverId?: string; groupId?: string } = {}): Promise<AdminMessage[]> => {
    const params: Record<string, string> = {};
    if (groupId) params.groupId = groupId;
    else if (receiverId) params.receiverId = receiverId;
    const res = await axios.get(`${API_URL}/chat`, {
      params,
      ...authHeaders(token),
    });
    return res.data;
  },

  sendMessage: async (token: string, messageData: Record<string, unknown>): Promise<AdminMessage> => {
    const res = await axios.post(`${API_URL}/chat`, messageData, authHeaders(token));
    return res.data;
  },

  getChatGroups: async (token: string): Promise<ChatGroup[]> => {
    const res = await axios.get(`${API_URL}/chat/groups`, authHeaders(token));
    return res.data;
  },

  createChatGroup: async (token: string, data: Record<string, unknown>): Promise<ChatGroup> => {
    const res = await axios.post(`${API_URL}/chat/groups`, data, authHeaders(token));
    return res.data;
  },

  updateChatGroup: async (token: string, groupId: string, data: Record<string, unknown>): Promise<ChatGroup> => {
    const res = await axios.put(`${API_URL}/chat/groups/${groupId}`, data, authHeaders(token));
    return res.data;
  },

  deleteChatGroup: async (token: string, groupId: string): Promise<unknown> => {
    const res = await axios.delete(`${API_URL}/chat/groups/${groupId}`, authHeaders(token));
    return res.data;
  },

  leaveChatGroup: async (
    token: string,
    groupId: string
  ): Promise<{ left: boolean; groupDeleted?: boolean; group?: unknown }> => {
    const res = await axios.post(`${API_URL}/chat/groups/${groupId}/leave`, {}, authHeaders(token));
    return res.data;
  },

  deleteMessage: async (token: string, messageId: string): Promise<unknown> => {
    const res = await axios.delete(`${API_URL}/chat/${messageId}`, authHeaders(token));
    return res.data;
  },

  editMessage: async (token: string, messageId: string, content: string): Promise<AdminMessage> => {
    const res = await axios.put(`${API_URL}/chat/${messageId}`, { content }, authHeaders(token));
    return res.data;
  },

  getAdmins: async (token: string): Promise<User[]> => {
    const res = await axios.get(`${API_URL}/users/admins`, authHeaders(token));
    return res.data;
  },

  toggleBan: async (token: string, userId: string): Promise<User> => {
    const res = await axios.patch(`${API_URL}/users/${userId}/ban`, {}, authHeaders(token));
    return res.data;
  },
};

export default adminService;
