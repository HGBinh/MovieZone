import { useState, useEffect, useRef } from 'react';
import authService from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { 
  FiUser, FiMail, FiCalendar, FiStar, 
  FiMessageSquare, FiHeart, FiEdit2, FiCamera, 
  FiCheck, FiX, FiLock, FiLogOut, FiUpload, FiShield, FiArrowRight
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import Avatar from '../components/common/Avatar';

const Profile = () => {
  const { user, updateProfile, uploadAvatar, requestAdmin, logout, theme, t, lang } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stats, setStats] = useState({
    favorites: 0,
    comments: 0,
    avgRating: 0
  });
  const [isEditing, setIsEditing] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    avatar: user?.avatar || '',
    password: ''
  });
  const [loading, setLoading] = useState(true);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        username: user.username || '',
        email: user.email || '',
        avatar: user.avatar || ''
      }));
    }
  }, [user]);

  useEffect(() => {
    const fetchUserStats = async () => {
      if (!user) return;
      try {
        const data = await authService.getStats(user.token);
        setStats(data as { favorites: number; comments: number; avgRating: number });
      } catch (error) {
        console.error('Error fetching profile stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserStats();
  }, [user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log('DEBUG: File selected:', file);
    if (file) {
      setPreviewAvatar(URL.createObjectURL(file));
    }
  };

  const handleUploadAvatar = async () => {
    const file = fileInputRef.current?.files?.[0];
    console.log('DEBUG: Starting upload for file:', file);

    if (!file) {
      console.log('DEBUG: No file found in ref');
      return;
    }
    
    setUploading(true);
    const formData = new FormData();
    formData.append('avatar', file);

    console.log('DEBUG: FormData created, field "avatar" appended');
    
    const result = await uploadAvatar(formData);
    console.log('DEBUG: Upload result from Context:', result);
    
    setUploading(false);
    
    if (result.success) {
      toast.success(t('upload_success'));
      setPreviewAvatar(null);
    } else {
      console.log('DEBUG: Upload failed with message:', result.message);
      toast.error(t('upload_error') + ': ' + result.message);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateLoading(true);
    const result = await updateProfile(formData);
    setUpdateLoading(false);
    
    if (result.success) {
      toast.success(t('profile_updated'));
      setIsEditing(false);
    } else {
      toast.error(result.message);
    }
  };

  const handleAdminRequest = async () => {
    if (user?.adminRequestStatus === 'pending') return;
    setRequestLoading(true);
    const result = await requestAdmin();
    setRequestLoading(false);
    if (result.success) {
      toast.success(lang === 'vi' ? 'Đã gửi yêu cầu quyền Admin!' : 'Admin request sent!');
    } else {
      toast.error(result.message);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.info(t('logout_success'));
  };

  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0a0a0a] text-white' : 'bg-[#f8f9fa] text-dark'} pb-20 pt-10`}>
      <div className="container mx-auto px-4 md:px-10">
        <div className="max-w-5xl mx-auto">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Left Column: Avatar & Quick Info */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              className={`lg:col-span-1 p-8 rounded-[2.5rem] border transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-xl'}`}
            >
              <div className="relative group w-40 h-40 mx-auto mb-8">
                <div className="relative">
                  <Avatar 
                    src={previewAvatar || user?.avatar} 
                    alt={user?.username} 
                    size={150}
                    className="border-4 border-primary shadow-[0_0_30px_rgba(229,9,20,0.3)] transition-transform group-hover:scale-105"
                  />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-dark rounded-full shadow-sm"></div>
                </div>
                <label className="absolute bottom-2 right-2 bg-primary p-3 rounded-full cursor-pointer hover:scale-110 transition-all shadow-lg z-10">
                  <FiCamera className="text-white" size={20} />
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleAvatarChange} 
                  />
                </label>
              </div>

              {previewAvatar && (
                <div className="flex justify-center space-x-2 mb-6">
                  <button 
                    onClick={handleUploadAvatar}
                    disabled={uploading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center space-x-2 hover:bg-green-700 disabled:opacity-50 shadow-lg"
                  >
                    {uploading ? <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <FiUpload />}
                    <span>{t('save')}</span>
                  </button>
                  <button 
                    onClick={() => {
                      setPreviewAvatar(null);
                      if(fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    disabled={uploading}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center space-x-2 hover:bg-gray-700 disabled:opacity-50 shadow-lg"
                  >
                    <FiX />
                    <span>{t('cancel')}</span>
                  </button>
                </div>
              )}

              <div className="text-center space-y-2 mb-8">
                <h2 className={`text-2xl font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-dark'}`}>{user?.username}</h2>
                <p className={`text-xs font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500'}`}>{user?.email}</p>
                <div className="inline-block px-4 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-widest">
                  {user?.role} {t('account')}
                </div>
              </div>

              <div className="space-y-4">
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center space-x-3 border ${isEditing ? 'bg-white text-black border-white' : 'bg-primary text-white border-primary hover:bg-red-700'}`}
                >
                  {isEditing ? <><FiX /><span>{t('cancel')}</span></> : <><FiEdit2 /><span>{t('edit_profile')}</span></>}
                </button>
                <button 
                  onClick={handleLogout}
                  className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center space-x-3 bg-primary text-white border border-primary hover:bg-red-700 active:scale-[0.98] shadow-lg shadow-primary/20"
                >
                  <FiLogOut size={16} />
                  <span>{t('logout')}</span>
                </button>

                {user?.role !== 'admin' && (
                  <button 
                    onClick={handleAdminRequest}
                    disabled={requestLoading || user?.adminRequestStatus === 'pending'}
                    className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center space-x-3 border ${
                      user?.adminRequestStatus === 'pending' 
                        ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 cursor-default' 
                        : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20'
                    }`}
                  >
                    {requestLoading ? (
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : user?.adminRequestStatus === 'pending' ? (
                      <><FiCheck /><span>{t('pending_approval')}</span></>
                    ) : (
                      <><FiShield /><span>{t('request_admin')}</span></>
                    )}
                  </button>
                )}
              </div>
            </motion.div>

            {/* Right Column: Content */}
            <div className="lg:col-span-2 space-y-10">
              <AnimatePresence mode="wait">
                {isEditing ? (
                  <motion.div 
                    key="edit"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`p-10 rounded-[2.5rem] border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-xl'}`}
                  >
                    <h3 className="text-xl font-black uppercase tracking-widest mb-8 flex items-center">
                      <FiEdit2 className="mr-4 text-primary" /> {t('update_profile')}
                    </h3>
                    <form onSubmit={handleUpdate} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">{t('username')}</label>
                          <input 
                            type="text" 
                            value={formData.username}
                            onChange={(e) => setFormData({...formData, username: e.target.value})}
                            className={`w-full p-4 rounded-xl border outline-none transition-all ${theme === 'dark' ? 'bg-black/40 border-white/10 focus:border-primary text-white' : 'bg-gray-50 border-gray-200 focus:border-primary'}`}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">{t('email')}</label>
                          <input 
                            type="email" 
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            className={`w-full p-4 rounded-xl border outline-none transition-all ${theme === 'dark' ? 'bg-black/40 border-white/10 focus:border-primary text-white' : 'bg-gray-50 border-gray-200 focus:border-primary'}`}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">{t('new_password')}</label>
                        <input 
                          type="password" 
                          autoComplete="new-password"
                          placeholder="••••••••"
                          value={formData.password}
                          onChange={(e) => setFormData({...formData, password: e.target.value})}
                          className={`w-full p-4 rounded-xl border outline-none transition-all ${theme === 'dark' ? 'bg-black/40 border-white/10 focus:border-primary text-white' : 'bg-gray-50 border-gray-200 focus:border-primary'}`}
                        />
                      </div>

                      <button 
                        type="submit"
                        disabled={updateLoading}
                        className="w-full bg-primary text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-red-700 transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
                      >
                        {updateLoading ? t('loading') : t('save_changes')}
                      </button>
                    </form>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="stats"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-8"
                  >
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                      {[
                        { label: t('stats_fav'), value: stats.favorites, icon: FiHeart, color: 'text-primary', bg: 'bg-primary/10' },
                        { label: t('stats_comm'), value: stats.comments, icon: FiMessageSquare, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                        { label: t('stats_rate'), value: stats.avgRating, icon: FiStar, color: 'text-yellow-500', bg: 'bg-yellow-500/10' }
                      ].map((item, i) => (
                        <div key={i} className={`p-4 sm:p-6 md:p-8 rounded-[1.5rem] sm:rounded-[2rem] border text-center transition-all hover:-translate-y-2 ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-white border-gray-100 shadow-lg'}`}>
                          <div className={`${item.bg} w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6`}>
                            <item.icon className={item.color} size={28} />
                          </div>
                          <h4 className={`text-4xl font-black mb-2 tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-dark'}`}>{item.value}</h4>
                          <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500'}`}>{item.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Account Settings List */}
                    <div className={`p-4 sm:p-6 md:p-8 lg:p-10 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-xl'}`}>
                      <h3 className="text-xl font-black uppercase tracking-widest mb-8 flex items-center">
                        <FiUser className="mr-4 text-primary" /> {t('account_settings')}
                      </h3>
                      <div className="space-y-2">
                        {[
                          { label: lang === 'vi' ? 'Bảo mật & Mật khẩu' : 'Security & Password', icon: FiLock, desc: lang === 'vi' ? 'Thay đổi mật khẩu và quản lý bảo mật' : 'Change password and manage security', action: () => setIsEditing(true) },
                          { label: lang === 'vi' ? 'Thông báo' : 'Notifications', icon: FiMail, desc: lang === 'vi' ? 'Cài đặt nhận email thông báo phim mới' : 'Set up email notifications for new movies', action: () => setIsEditing(true) },
                          { label: lang === 'vi' ? 'Hoạt động gần đây' : 'Recent Activity', icon: FiCalendar, desc: lang === 'vi' ? 'Xem lại lịch sử xem phim và bình luận' : 'Review your watch history and comments', action: () => navigate('/activity') },
                          ...(user?.role !== 'admin' ? [{
                            label: t('request_admin'),
                            icon: FiShield,
                            desc: user?.adminRequestStatus === 'pending' ? t('pending_approval') : (lang === 'vi' ? 'Gửi yêu cầu để trở thành Quản trị viên' : 'Send a request to become an Administrator'),
                            action: handleAdminRequest,
                            disabled: user?.adminRequestStatus === 'pending' || requestLoading,
                            isPending: user?.adminRequestStatus === 'pending'
                          }] : [])
                        ].map((item, i) => (
                          <button 
                            key={i} 
                            onClick={item.action} 
                            disabled={item.disabled}
                            className={`w-full flex items-center p-6 rounded-2xl transition-all group ${
                              item.disabled ? 'opacity-60 cursor-default' : theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className={`p-4 rounded-xl mr-6 transition-all ${
                              item.isPending 
                                ? 'bg-yellow-500/20 text-yellow-500' 
                                : theme === 'dark' ? 'bg-white/5 group-hover:bg-primary/20 group-hover:text-primary' : 'bg-gray-100 group-hover:bg-primary group-hover:text-white'
                            }`}>
                              {item.isPending && requestLoading ? (
                                <div className="w-5 h-5 border-2 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin" />
                              ) : (
                                <item.icon size={20} />
                              )}
                            </div>
                            <div className="text-left flex-grow">
                              <h5 className={`font-black text-xs uppercase tracking-widest mb-1 ${
                                item.isPending ? 'text-yellow-500' : theme === 'dark' ? 'text-white' : 'text-dark'
                              }`}>
                                {item.label}
                                {item.isPending && <span className="ml-2 text-[8px] px-2 py-0.5 bg-yellow-500/10 rounded-full">PENDING</span>}
                              </h5>
                              <p className={`text-[10px] font-medium ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500'}`}>{item.desc}</p>
                            </div>
                            {!item.disabled && (
                              <FiArrowRight className="text-neutral-600 group-hover:text-primary transition-all group-hover:translate-x-1" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Profile;