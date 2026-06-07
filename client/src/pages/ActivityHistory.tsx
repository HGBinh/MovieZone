import { useState, useEffect } from 'react';
import userService from '../services/userService';
import commentService from '../services/commentService';
import { useAuth } from '../context/AuthContext';
import { 
  FiClock, FiMessageSquare, FiHeart, FiCornerDownRight, 
  FiArrowLeft, FiPlay, FiCalendar, FiExternalLink, FiTrash2
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Avatar from '../components/common/Avatar';

const ActivityHistory = () => {
  const { user, theme, t, lang } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('watch');
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<any>({
    watchHistory: [],
    comments: [],
    likedComments: [],
    replies: []
  });

  useEffect(() => {
    const fetchActivity = async () => {
      if (!user) return;
      try {
        const data = await userService.getActivity(user?.token || '');
        setActivities(data);
      } catch (error) {
        toast.error(lang === 'vi' ? 'Lỗi tải lịch sử hoạt động' : 'Failed to load activity history');
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
  }, [user, lang]);

  const handleDeleteHistory = async (movieId: string) => {
    if (!window.confirm(lang === 'vi' ? 'Bạn có chắc chắn muốn xóa lịch sử này?' : 'Are you sure you want to delete this history?')) return;
    try {
      await userService.deleteWatchHistory(user?.token || '', movieId);
      setActivities((prev: any) => ({
        ...prev,
        watchHistory: movieId === 'all' ? [] : prev.watchHistory.filter((item: any) => item.movieId !== movieId)
      }));
      toast.success(lang === 'vi' ? 'Đã xóa lịch sử' : 'History deleted');
    } catch (error) {
      toast.error(lang === 'vi' ? 'Không thể xóa lịch sử' : 'Failed to delete history');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm(lang === 'vi' ? 'Bạn có muốn thu hồi bình luận này?' : 'Do you want to withdraw this comment?')) return;
    try {
      await commentService.deleteComment(user?.token || '', commentId);
      setActivities((prev: any) => ({
        ...prev,
        comments: prev.comments.filter((c: any) => c._id !== commentId)
      }));
      toast.success(lang === 'vi' ? 'Đã thu hồi bình luận' : 'Comment withdrawn');
    } catch (e) { toast.error(lang === 'vi' ? 'Không thể xóa bình luận' : 'Failed to delete comment'); }
  };

  const handleDeleteReply = async (commentId: string, replyId: string) => {
    if (!window.confirm(lang === 'vi' ? 'Bạn có muốn xóa phản hồi này?' : 'Do you want to delete this reply?')) return;
    try {
      await commentService.deleteReply(user?.token || '', commentId, replyId);
      setActivities((prev: any) => ({
        ...prev,
        replies: prev.replies.map((c: any) => {
          if (c._id === commentId) {
            return { ...c, replies: c.replies.filter((r: any) => r._id !== replyId) };
          }
          return c;
        }).filter((c: any) => c.replies.some((r: any) => r.user?._id === user?._id || r.user === user?._id))
      }));
      toast.success(lang === 'vi' ? 'Đã xóa phản hồi' : 'Reply deleted');
    } catch (e) { toast.error(lang === 'vi' ? 'Không thể xóa phản hồi' : 'Failed to delete reply'); }
  };

  const tabs = [
    { id: 'watch', label: lang === 'vi' ? 'Lịch sử xem' : 'Watch History', icon: FiClock },
    { id: 'comments', label: lang === 'vi' ? 'Bình luận' : 'Comments', icon: FiMessageSquare },
    { id: 'liked', label: lang === 'vi' ? 'Đã thích' : 'Liked', icon: FiHeart },
    { id: 'replies', label: lang === 'vi' ? 'Phản hồi' : 'Replies', icon: FiCornerDownRight },
  ];

  if (loading) return (
    <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-gray-50'}`}>
      <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className={`min-h-screen pt-24 pb-20 transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0a0a0a] text-white' : 'bg-[#f8f9fa] text-dark'}`}>
      <div className="container mx-auto px-4 md:px-10 max-w-6xl">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <button 
            onClick={() => navigate('/profile')}
            className={`flex items-center space-x-3 px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all ${
              theme === 'dark' ? 'bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white' : 'bg-white border border-gray-100 shadow-sm text-neutral-500 hover:text-dark'
            }`}
          >
            <FiArrowLeft size={16} />
            <span>{t('back')}</span>
          </button>
          <div className="text-right">
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-1">
              {lang === 'vi' ? 'Hoạt động' : 'Activity'}<span className="text-primary">Zone</span>
            </h1>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500">
              {lang === 'vi' ? 'Lịch sử tương tác của bạn' : 'Your interaction history'}
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
          <div className="flex flex-wrap gap-4">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-3 px-8 py-5 rounded-3xl transition-all font-black uppercase tracking-widest text-[10px] ${
                  activeTab === tab.id 
                    ? 'bg-primary text-white shadow-2xl shadow-primary/30' 
                    : theme === 'dark' ? 'bg-white/5 text-neutral-500 hover:bg-white/10' : 'bg-white text-neutral-500 border border-gray-100 hover:bg-gray-50'
                }`}
              >
                <tab.icon size={18} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {activeTab === 'watch' && activities.watchHistory.length > 0 && (
            <button 
              onClick={() => handleDeleteHistory('all')}
              className="flex items-center space-x-2 px-6 py-4 rounded-2xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all font-black uppercase tracking-widest text-[10px]"
            >
              <FiTrash2 size={16} />
              <span>{lang === 'vi' ? 'Xóa tất cả' : 'Clear All'}</span>
            </button>
          )}
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {activeTab === 'watch' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
                {activities.watchHistory.length === 0 ? (
                  <div className="col-span-full py-20 text-center text-neutral-500 font-bold uppercase tracking-widest text-xs">
                    {lang === 'vi' ? 'Chưa có lịch sử xem phim' : 'No watch history yet'}
                  </div>
                ) : activities.watchHistory.map((item: any, i: any) => {
                  const imageUrl = item.posterPath?.startsWith('http') 
                    ? item.posterPath 
                    : `https://image.tmdb.org/t/p/w500${item.posterPath}`;

                  return (
                    <div 
                      key={i} 
                      className={`group relative rounded-[2rem] overflow-hidden border transition-all hover:-translate-y-2 ${
                        theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-white border-gray-100 shadow-xl'
                      }`}
                    >
                      <div className="aspect-[2/3] overflow-hidden relative">
                        <img 
                          src={imageUrl || 'https://via.placeholder.com/500x750?text=No+Image'} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                          alt={item.title} 
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-3">
                          <Link 
                            to={`/movie/${item.movieId}`}
                            className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-2xl scale-75 group-hover:scale-100 transition-transform hover:bg-red-700"
                          >
                            <FiPlay className="text-white fill-current ml-1 text-sm" />
                          </Link>
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              handleDeleteHistory(item.movieId);
                            }}
                            className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center shadow-2xl scale-75 group-hover:scale-100 transition-transform hover:bg-red-500 hover:text-white"
                          >
                            <FiTrash2 className="text-sm" />
                          </button>
                        </div>
                      </div>
                      <div className="p-4">
                        <h4 className="font-black text-[11px] uppercase truncate mb-1">{item.title}</h4>
                        <p className="text-[8px] font-bold text-neutral-500 uppercase tracking-widest flex items-center">
                          <FiCalendar className="mr-1" /> {new Date(item.watchedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === 'comments' && (
              <div className="space-y-4">
                {activities.comments.length === 0 ? (
                  <div className="py-20 text-center text-neutral-500 font-bold uppercase tracking-widest text-xs">
                    {lang === 'vi' ? 'Bạn chưa để lại bình luận nào' : 'No comments yet'}
                  </div>
                ) : activities.comments.map((comment: any, i: any) => (
                  <div
                    key={i}
                    className={`p-4 sm:p-6 md:p-8 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] border transition-all ${
                      theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-white border-gray-100 shadow-xl'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <div className="bg-primary/20 text-primary p-2 rounded-lg">
                            <FiMessageSquare size={14} />
                          </div>
                          <Link to={`/movie/${comment.movieId}`} className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline flex items-center">
                            {lang === 'vi' ? 'Xem tại phim' : 'View on movie'} <FiExternalLink className="ml-2" />
                          </Link>
                          <span className="text-[10px] text-neutral-500 font-bold">• {new Date(comment.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-neutral-200' : 'text-neutral-800'}`}>"{comment.content}"</p>
                        <div className="flex items-center space-x-6">
                          <div className="flex items-center space-x-2 text-neutral-500">
                            <FiHeart className="text-primary" size={14} />
                            <span className="text-xs font-black">{comment.likes?.length || 0}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-neutral-500">
                            <FiCornerDownRight className="text-blue-500" size={14} />
                            <span className="text-xs font-black">{comment.replies?.length || 0}</span>
                          </div>
                          <button 
                            onClick={() => handleDeleteComment(comment._id)}
                            className="flex items-center space-x-2 text-neutral-500 hover:text-red-500 transition-colors"
                          >
                            <FiTrash2 size={14} />
                            <span className="text-[9px] font-black uppercase tracking-widest">{lang === 'vi' ? 'Thu hồi' : 'Withdraw'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'liked' && (
              <div className="space-y-4">
                {activities.likedComments.length === 0 ? (
                  <div className="py-20 text-center text-neutral-500 font-bold uppercase tracking-widest text-xs">
                    {lang === 'vi' ? 'Bạn chưa thả tim bình luận nào' : 'No liked comments yet'}
                  </div>
                ) : activities.likedComments.map((comment: any, i: any) => (
                  <div 
                    key={i}
                    className={`p-8 rounded-[2.5rem] border transition-all ${
                      theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-white border-gray-100 shadow-xl'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center space-x-4">
                          <Avatar src={comment.user?.avatar} size={32} />
                          <div className="flex flex-col">
                            <span className="text-[11px] font-black uppercase">{comment.user?.username}</span>
                            <span className="text-[8px] text-neutral-500 font-bold">{new Date(comment.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <p className={`text-sm italic leading-relaxed ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'}`}>"{comment.content}"</p>
                        <div className="flex items-center space-x-4">
                          <Link to={`/movie/${comment.movieId}`} className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline flex items-center">
                            {lang === 'vi' ? 'Xem nguồn' : 'View source'} <FiExternalLink className="ml-2" />
                          </Link>
                          <div className="flex items-center space-x-1.5 bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase">
                            <FiHeart size={10} className="fill-current" />
                            <span>{lang === 'vi' ? 'Bạn đã thả tim' : 'You liked this'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'replies' && (
              <div className="space-y-4">
                {activities.replies.length === 0 ? (
                  <div className="py-20 text-center text-neutral-500 font-bold uppercase tracking-widest text-xs">
                    {lang === 'vi' ? 'Bạn chưa phản hồi bình luận nào' : 'No replies yet'}
                  </div>
                ) : activities.replies.map((comment: any, i: any) => {
                  const userReplies = comment.replies?.filter((r: any) => r.user?._id === user?._id || r.user === user?._id);
                  return (
                    <div 
                      key={i}
                      className={`p-8 rounded-[2.5rem] border transition-all ${
                        theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-white border-gray-100 shadow-xl'
                      }`}
                    >
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Avatar src={comment.user?.avatar} size={28} />
                            <span className="text-[10px] font-black uppercase text-neutral-500">{lang === 'vi' ? 'Phản hồi bình luận của' : 'Replied to'} {comment.user?.username}</span>
                          </div>
                          <Link to={`/movie/${comment.movieId}`} className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline flex items-center">
                            {lang === 'vi' ? 'Xem phim' : 'View movie'} <FiExternalLink className="ml-2" />
                          </Link>
                        </div>
                        
                        <div className={`p-4 rounded-2xl border-l-4 border-primary/30 ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                          <p className={`text-xs italic ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500'}`}>"{comment.content}"</p>
                        </div>

                        <div className="space-y-4 pl-8 border-l border-white/5">
                          {userReplies.map((reply: any, ri: any) => (
                            <div key={ri} className="space-y-2 group/reply-item">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <FiCornerDownRight className="text-primary" />
                                  <span className="text-[10px] font-black uppercase text-primary">{lang === 'vi' ? 'Bạn đã viết' : 'You wrote'}</span>
                                  <span className="text-[8px] text-neutral-500 font-bold">• {new Date(reply.createdAt).toLocaleDateString()}</span>
                                </div>
                                <button 
                                  onClick={() => handleDeleteReply(comment._id, reply._id)}
                                  className="text-neutral-500 hover:text-red-500 transition-colors opacity-0 group-hover/reply-item:opacity-100"
                                >
                                  <FiTrash2 size={12} />
                                </button>
                              </div>
                              <p className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-dark'}`}>{reply.content}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ActivityHistory;