import axios from 'axios';
import type { Movie } from '../types';

const API_URL = `${import.meta.env.VITE_API_URL}/favorites`;

const authHeaders = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
});

const favoriteService = {
  getFavorites: async (token: string): Promise<Movie[]> => {
    const res = await axios.get(API_URL, authHeaders(token));
    return res.data;
  },

  addFavorite: async (token: string, movieData: Record<string, unknown>): Promise<unknown> => {
    const res = await axios.post(`${API_URL}/add`, movieData, authHeaders(token));
    return res.data;
  },

  removeFavorite: async (token: string, movieId: string | number): Promise<unknown> => {
    const res = await axios.delete(`${API_URL}/${movieId}`, authHeaders(token));
    return res.data;
  },
};

export default favoriteService;
