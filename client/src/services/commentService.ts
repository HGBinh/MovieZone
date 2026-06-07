import axios from 'axios';
import type { Comment } from '../types';

const API_URL = `${import.meta.env.VITE_API_URL}/comments`;

const authHeaders = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
});

const commentService = {
  getComments: async (movieId: string): Promise<Comment[]> => {
    const res = await axios.get(`${API_URL}/${movieId}`);
    return res.data;
  },

  addComment: async (token: string, commentData: Record<string, unknown>): Promise<Comment> => {
    const res = await axios.post(API_URL, commentData, authHeaders(token));
    return res.data;
  },

  updateComment: async (token: string, commentId: string, commentData: Record<string, unknown>): Promise<Comment> => {
    const res = await axios.put(`${API_URL}/${commentId}`, commentData, authHeaders(token));
    return res.data;
  },

  deleteComment: async (token: string, commentId: string): Promise<unknown> => {
    const res = await axios.delete(`${API_URL}/${commentId}`, authHeaders(token));
    return res.data;
  },

  likeComment: async (token: string, commentId: string): Promise<Comment> => {
    const res = await axios.post(`${API_URL}/${commentId}/like`, {}, authHeaders(token));
    return res.data;
  },

  addReply: async (token: string, commentId: string, replyData: Record<string, unknown>): Promise<Comment> => {
    const res = await axios.post(`${API_URL}/${commentId}/reply`, replyData, authHeaders(token));
    return res.data;
  },

  likeReply: async (token: string, commentId: string, replyId: string): Promise<Comment> => {
    const res = await axios.post(`${API_URL}/${commentId}/reply/${replyId}/like`, {}, authHeaders(token));
    return res.data;
  },

  deleteReply: async (token: string, commentId: string, replyId: string): Promise<unknown> => {
    const res = await axios.delete(`${API_URL}/${commentId}/reply/${replyId}`, authHeaders(token));
    return res.data;
  },

  reportComment: async (token: string, commentId: string, reason: string): Promise<unknown> => {
    const res = await axios.post(`${API_URL}/${commentId}/report`, { reason }, authHeaders(token));
    return res.data;
  },
};

export default commentService;
