import axios from 'axios';
import type { User } from '../types';

const API_URL = `${import.meta.env.VITE_API_URL}/auth`;

const authHeaders = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
});

const authService = {
  login: async (email: string, password: string): Promise<User> => {
    const res = await axios.post(`${API_URL}/login`, { email, password });
    return res.data;
  },

  register: async (userData: Record<string, string>): Promise<User> => {
    const res = await axios.post(`${API_URL}/register`, userData);
    return res.data;
  },

  checkEmail: async (email: string): Promise<unknown> => {
    const res = await axios.post(`${API_URL}/check-email`, { email });
    return res.data;
  },

  resetPassword: async (email: string, newPassword: string): Promise<unknown> => {
    const res = await axios.post(`${API_URL}/reset-password`, { email, newPassword });
    return res.data;
  },

  getProfile: async (token: string): Promise<User> => {
    const res = await axios.get(`${API_URL}/profile`, authHeaders(token));
    return res.data;
  },

  updateProfile: async (token: string, userData: Record<string, unknown>): Promise<Partial<User>> => {
    const res = await axios.put(`${API_URL}/profile`, userData, authHeaders(token));
    return res.data;
  },

  getStats: async (token: string): Promise<Record<string, unknown>> => {
    const res = await axios.get(`${API_URL}/stats`, authHeaders(token));
    return res.data;
  },

  uploadAvatar: async (token: string, formData: FormData): Promise<{ avatar: string }> => {
    const res = await axios.post(`${API_URL}/upload-avatar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  },

  requestAdmin: async (token: string): Promise<unknown> => {
    const res = await axios.post(`${API_URL}/request-admin`, {}, authHeaders(token));
    return res.data;
  },
};

export default authService;
