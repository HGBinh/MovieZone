import { createContext, useState, useEffect, useContext, type ReactNode } from 'react';
import authService from '../services/authService';
import { useTranslation } from 'react-i18next';
import { getAxiosMessage } from '../utils/axiosError';
import type { AuthContextType, ThemeMode, User } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<ThemeMode>(
    (localStorage.getItem('moviezone_theme') as ThemeMode) || 'dark'
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('moviezone_user');
      if (storedUser && storedUser !== 'undefined' && storedUser !== 'null') {
        setUser(JSON.parse(storedUser) as User);
      }
    } catch (error) {
      console.error('Error initializing user from storage:', error);
      localStorage.removeItem('moviezone_user');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.documentElement.className = theme;
    localStorage.setItem('moviezone_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const toggleLang = () => {
    const nextLang = lang === 'vi' ? 'en' : 'vi';
    i18n.changeLanguage(nextLang);
  };

  const login: AuthContextType['login'] = async (userData) => {
    try {
      const data = await authService.login(userData.email, userData.password);
      setUser(data);
      localStorage.setItem('moviezone_user', JSON.stringify(data));
      return { success: true };
    } catch (error) {
      return { success: false, message: getAxiosMessage(error, 'Login failed') };
    }
  };

  const register: AuthContextType['register'] = async (userData) => {
    try {
      const data = await authService.register(userData);
      setUser(data);
      localStorage.setItem('moviezone_user', JSON.stringify(data));
      return { success: true };
    } catch (error) {
      return { success: false, message: getAxiosMessage(error, 'Registration failed') };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('moviezone_user');
  };

  const updateProfile: AuthContextType['updateProfile'] = async (userData) => {
    if (!user) return { success: false, message: 'Not authenticated' };
    try {
      const data = await authService.updateProfile(user.token, userData);
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      localStorage.setItem('moviezone_user', JSON.stringify(updatedUser));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: getAxiosMessage(error, 'Update failed'),
      };
    }
  };

  const uploadAvatar: AuthContextType['uploadAvatar'] = async (formData) => {
    if (!user) return { success: false, message: 'Not authenticated' };
    try {
      const data = await authService.uploadAvatar(user.token, formData);
      const updatedUser = { ...user, avatar: data.avatar };
      setUser(updatedUser);
      localStorage.setItem('moviezone_user', JSON.stringify(updatedUser));
      return { success: true, avatar: data.avatar };
    } catch (error) {
      return {
        success: false,
        message: getAxiosMessage(error, 'Upload failed'),
      };
    }
  };

  const requestAdmin: AuthContextType['requestAdmin'] = async () => {
    if (!user) return { success: false, message: 'Not authenticated' };
    try {
      await authService.requestAdmin(user.token);
      const updatedUser = { ...user, adminRequestStatus: 'pending' as const };
      setUser(updatedUser);
      localStorage.setItem('moviezone_user', JSON.stringify(updatedUser));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: getAxiosMessage(error, 'Request failed'),
      };
    }
  };

  return (
    <AuthContext.Provider value={{
      user, loading, login, register, logout,
      theme, toggleTheme, updateProfile, uploadAvatar,
      requestAdmin, lang, toggleLang, t,
      isModalOpen, setIsModalOpen,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
