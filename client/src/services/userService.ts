import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth`;

const authHeaders = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
});

const userService = {
  getWatchHistory: async (token: string): Promise<unknown[]> => {
    const res = await axios.get(`${API_URL}/watch-history`, authHeaders(token));
    return res.data;
  },

  addToWatchHistory: async (token: string, movieData: Record<string, unknown>): Promise<unknown> => {
    const res = await axios.post(`${API_URL}/watch-history`, movieData, authHeaders(token));
    return res.data;
  },

  deleteWatchHistory: async (token: string, movieId: string): Promise<unknown> => {
    const res = await axios.delete(`${API_URL}/watch-history/${movieId}`, authHeaders(token));
    return res.data;
  },

  getActivity: async (token: string): Promise<unknown[]> => {
    const res = await axios.get(`${API_URL}/activity`, authHeaders(token));
    return res.data;
  },
};

export default userService;
