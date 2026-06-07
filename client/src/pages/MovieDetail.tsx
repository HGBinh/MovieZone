import { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import movieService from '../services/movieService';
import commentService from '../services/commentService';
import favoriteService from '../services/favoriteService';
import userService from '../services/userService';
import { useAuth } from '../context/AuthContext';
import {
  FiStar, FiClock, FiCalendar, FiPlay, FiPlus,
  FiCheck, FiAlertCircle, FiInfo, FiTag, FiGlobe,
  FiChevronRight, FiTrendingUp, FiShare2, FiX,
  FiMessageSquare, FiHeart, FiThumbsUp, FiCornerDownRight, FiSend, FiTrash2
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import MovieRow from '../components/movie/MovieRow';
import { motion, AnimatePresence } from 'framer-motion';
import Avatar from '../components/common/Avatar';

const MovieDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, theme, t, lang, setIsModalOpen } = useAuth();
  const [movie, setMovie] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [rating, setRating] = useState(5);
  const [trailer, setTrailer] = useState<any>(null);
  const [showVideo, setShowVideo] = useState(false);
  const [replyingTo, setReplyTo] = useState<string | null>(null);
  const [replyToUser, setReplyToUser] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const watchHistorySentRef = useRef(false);

  const communityRating = useMemo(() => {
    if (!comments.length) return 0;
    const total = comments.reduce((sum, c) => sum + (Number(c.rating) || 0), 0);
    return Number((total / comments.length).toFixed(1));
  }, [comments]);

  const viewCount = useMemo(() => {
    if (!movie) return 0;
    if (movie.isLocal) return Number(movie.views) || 0;
    return Math.round((Number(movie.popularity) || 0) * 10);
  }, [movie]);

  const fetchMovieData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      window.scrollTo({ top: 0, behavior: 'instant' });
      const apiLang = lang === 'vi' ? 'vi-VN' : 'en-US';
      const isTV = window.location.pathname.includes('/movie/tv/');
      
      const [movieData, commentsData] = await Promise.all([
        movieService.getMovieById(id, apiLang, isTV ? 'tv' : 'movie'),
        commentService.getComments(id).catch(() => [])
      ]);

      const normalizedMovie = {
        ...movieData,
        title: movieData.title || movieData.name,
        release_date: movieData.release_date || movieData.first_air_date,
        runtime: movieData.runtime || (Array.isArray(movieData.episode_run_time) && movieData.episode_run_time.length > 0 ? movieData.episode_run_time[0] : null)
      };

      setMovie(normalizedMovie);
      setComments(commentsData || []);

      const extractYoutubeId = (url: string) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
      };

      if (movieData.trailerUrl) {
        const youtubeId = extractYoutubeId(movieData.trailerUrl);
        if (youtubeId) {
          setTrailer({ key: youtubeId });
        } else if (movieData.isLocal) {
          setTrailer(null);
        }
      } 

      if (!movieData.isLocal || (movieData.isLocal && !movieData.trailerUrl)) {
        const youtubeTrailer = movieData.videos?.results?.find(
          (vid) => vid.site === 'YouTube' && (vid.type === 'Trailer' || vid.type === 'Teaser')
        );
        if (youtubeTrailer) setTrailer(youtubeTrailer);
      }

      if (user?.token) {
        favoriteService.getFavorites(user.token).then(data => {
          setIsFavorite(data?.some((f) => f.movieId === id.toString()));
        }).catch(() => {});

        if (!watchHistorySentRef.current && !movieData.isBannerUnlinked) {
          watchHistorySentRef.current = true;
          const poster = movieData.posterPath || movieData.poster_path;
          userService.addToWatchHistory(user.token, {
            movieId: String(id),
            title: movieData.title || movieData.name || '',
            posterPath: typeof poster === 'string' ? poster : ''
          }).catch(() => {});
        }
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError(t('movie_not_found'));
      } else {
        setError(t('movie_data_error'));
      }
    } finally {
      setLoading(false);
    }
  }, [id, user, lang, t]);

  useEffect(() => {
    watchHistorySentRef.current = false;
    fetchMovieData();
  }, [fetchMovieData]);

  useEffect(() => {
    if (showVideo) {
      setIsModalOpen(true);
      document.body.style.overflow = 'hidden';
      document.body.classList.add('trailer-modal-open');
    } else {
      setIsModalOpen(false);
      document.body.style.overflow = '';
      document.body.classList.remove('trailer-modal-open');
    }
    return () => {
      setIsModalOpen(false);
      document.body.style.overflow = '';
      document.body.classList.remove('trailer-modal-open');
    };
  }, [showVideo, setIsModalOpen]);

  const handleShare = () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: movie?.title,
        text: movie?.overview,
        url: shareUrl,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success(t('copied_link'));
    }
  };

  const toggleFavorite = async () => {
                if (!user) {
                  toast.info(t('login_required_fav'));
                  navigate('/login');
                  return;
                }
                try {
                  if (isFavorite) {
                    await favoriteService.removeFavorite(user?.token || '', id || '');
                    setIsFavorite(false);
                    toast.success(t('fav_removed'));
                  } else {
                    await favoriteService.addFavorite(user?.token || '', { 
                      movieId: id || '', 
                      movieTitle: movie.title, 
                      posterPath: movie.poster_path, 
                      releaseDate: movie.release_date, 
                      voteAverage: movie.vote_average 
                    });
                    setIsFavorite(true);
                    toast.success(t('fav_added'));
                  }
                } catch (e) { toast.error(t('fav_error')); }
              };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.info(t('login_required_comm'));
      navigate('/login');
      return;
    }
    try {
      const data = await commentService.addComment(user.token, { 
        movieId: id, 
        content: newComment, 
        rating 
      });
      setComments([data, ...comments]);
      setNewComment('');
      if (typeof (data as any).communityRating === 'number' && movie?.isLocal) {
        setMovie((prev: any) => prev ? { ...prev, vote_average: (data as any).communityRating } : prev);
      }
      toast.success(t('comment_posted'));
    } catch (e) { toast.error(t('comment_error')); }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm(t('confirm_withdraw_comment'))) return;
    try {
      const res = await commentService.deleteComment(user?.token || '', commentId);
      const remaining = comments.filter(c => c._id !== commentId);
      setComments(remaining);
      if (typeof (res as any)?.communityRating === 'number' && movie?.isLocal) {
        setMovie((prev: any) => prev ? { ...prev, vote_average: (res as any).communityRating } : prev);
      } else if (movie?.isLocal && remaining.length > 0) {
        const avg = remaining.reduce((s, c) => s + (Number(c.rating) || 0), 0) / remaining.length;
        setMovie((prev: any) => prev ? { ...prev, vote_average: Number(avg.toFixed(1)) } : prev);
      } else if (movie?.isLocal) {
        setMovie((prev: any) => prev ? { ...prev, vote_average: 0 } : prev);
      }
      toast.success(t('comment_withdrawn'));
    } catch (e) { toast.error(t('delete_error')); }
  };

  const handleDeleteReply = async (commentId: string, replyId: string) => {
    if (!window.confirm(t('confirm_delete_reply'))) return;
    try {
      await commentService.deleteReply(user?.token || '', commentId, replyId);
      setComments(comments.map(c => {
        if (c._id === commentId) {
          return { ...c, replies: c.replies.filter((r: any) => r._id !== replyId) };
        }
        return c;
      }));
      toast.success(t('reply_deleted'));
    } catch (e) { toast.error(t('delete_error')); }
  };

  const handleLike = async (commentId: string) => {
    if (!user) return navigate('/login');
    try {
      const data = await commentService.likeComment(user.token, commentId);
      setComments(comments.map(c => c._id === commentId ? { ...c, likes: data.likes } : c));
    } catch (e) { toast.error(t('fav_error')); }
  };

  const handleLikeReply = async (commentId: string, replyId: string) => {
    if (!user) return navigate('/login');
    try {
      const data = await commentService.likeReply(user.token, commentId, replyId);
      setComments(comments.map(c => {
        if (c._id === commentId) {
          const updatedReplies = c.replies.map((r: any) => 
            r._id === replyId ? { ...r, likes: data.likes } : r
          );
          return { ...c, replies: updatedReplies };
        }
        return c;
      }));
    } catch (e) { toast.error(t('fav_error')); }
  };

  const handleReplySubmit = async (e: React.FormEvent, commentId: string) => {
    e.preventDefault();
    if (!user) return navigate('/login');
    if (!replyContent.trim()) return;
    try {
      const data = await commentService.addReply(user.token, commentId, { 
        content: replyContent, 
        replyToUser 
      });
      setComments(comments.map(c => c._id === commentId ? data : c));
      setReplyContent('');
      setReplyTo(null);
      setReplyToUser(null);
      toast.success(t('reply_posted'));
    } catch (e) { toast.error(t('comment_error')); }
  };

  const handleReport = async (commentId: string) => {
    if (!user) return navigate('/login');
    const reason = window.prompt(lang === 'vi' ? 'Lý do báo cáo vi phạm?' : 'Reason for reporting?');
    if (!reason) return;
    
    try {
      await commentService.reportComment(user.token, commentId, reason);
      toast.success(t('reported_success'));
    } catch (error) {
      toast.error((error as any).response?.data?.message || 'Report failed');
    }
  };

  const movieInfoItems = useMemo(() => {
    if (!movie) return [];
    return [
      { 
        label: t('runtime'), 
        value: movie.isBannerUnlinked
          ? '—'
          : movie.isLocal
            ? movie.runtime || '—'
            : `${movie.runtime} ${t('minutes')}`
      },
      {
        label: t('release_date'),
        value: movie.release_date?.split('-')[0] || '—',
      },
      { label: t('countries'), value: movie.production_countries?.[0]?.name || 'N/A' },
      {
        label: t('genres'),
        value: movie.genres?.[0]?.name || (typeof movie.genres?.[0] === 'string' ? movie.genres[0] : '—') || '—',
      },
    ];
  }, [movie, t]);

  if (loading) return <div className="min-h-screen bg-dark flex items-center justify-center text-primary font-black uppercase tracking-widest animate-pulse">{t('loading')}</div>;
  if (error || !movie) return <div className="min-h-screen bg-dark flex items-center justify-center text-white font-bold">{t('movie_not_found')}</div>;

  return (
    <div className={`transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0a0a0a] text-white' : 'bg-[#f8f9fa] text-black'} pb-32`}>
      <AnimatePresence>
        {showVideo && trailer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100003] bg-black flex flex-col"
            style={{ touchAction: 'none' }}
          >
            {/* Close bar — single X, tăng safe area và độ nổi bật */}
            <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 pt-[max(1rem,env(safe-area-inset-top),48px)] sm:pt-4 shrink-0 bg-black/95 backdrop-blur-xl border-b border-white/10 shadow-lg">
              <p className="text-white/70 text-[10px] sm:text-xs font-black uppercase tracking-widest truncate pr-4">
                {movie.title}
              </p>
              <button
                type="button"
                onClick={() => setShowVideo(false)}
                aria-label="Close video"
                className="w-11 h-11 rounded-xl bg-white/10 hover:bg-primary text-white transition-all flex items-center justify-center flex-shrink-0 icon-btn no-min-h active:scale-95"
              >
                <FiX size={22} />
              </button>
            </div>
            <div className="flex-1 min-h-0 w-full p-0 sm:p-4 md:p-10 flex items-center justify-center">
              <motion.div
                initial={{ scale: 0.98, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.98, opacity: 0 }}
                className="w-full h-full sm:max-w-6xl sm:aspect-video sm:h-auto sm:rounded-3xl overflow-hidden border-0 sm:border border-white/10 shadow-2xl bg-black"
              >
                <iframe
                src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen; compute-pressure"
                title="Trailer"
              />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative h-[50vh] sm:h-[60vh] md:h-[80vh] w-full overflow-hidden">
        <img 
          src={movie.isLocal ? movie.backdrop_path : `https://image.tmdb.org/t/p/original${movie.backdrop_path}`} 
          className="w-full h-full object-cover opacity-60" 
          alt="backdrop" 
        />
        <div className={`absolute inset-0 bg-gradient-to-t ${theme === 'dark' ? 'from-[#0a0a0a]' : 'from-[#f8f9fa]'} via-transparent to-transparent`} />
      </div>

      <div className="container mx-auto px-4 sm:px-6 md:px-10 lg:px-20 -mt-32 sm:-mt-48 md:-mt-64 relative z-10">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
          <div className="lg:w-[350px] flex-shrink-0 space-y-6 sm:space-y-8">
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="relative rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden shadow-2xl border border-white/10 mx-auto lg:mx-0 w-fit">
              <img 
                src={movie.isLocal ? movie.poster_path : `https://image.tmdb.org/t/p/w500${movie.poster_path}`} 
                className="w-[200px] sm:w-[250px] md:w-[300px] lg:w-full" 
                alt="poster" 
              />
              <div className="absolute top-2 sm:top-4 left-2 sm:left-4 bg-primary text-white text-[9px] sm:text-[10px] font-black px-1.5 sm:px-2 py-0.5 sm:py-1 rounded uppercase">HD 4K</div>
            </motion.div>
            
            <button
              onClick={() => {
                if (movie.isBannerUnlinked) {
                  toast.info(t('banner_play_unavailable'));
                  return;
                }
                if (trailer) setShowVideo(true);
                else toast.info(t('no_trailer'));
              }}
              className="w-full btn-primary-safe bg-primary hover:bg-red-700 text-white py-3 sm:py-4 md:py-5 rounded-xl sm:rounded-2xl font-black uppercase tracking-wider text-[11px] sm:text-sm transition-all flex items-center justify-center space-x-2 sm:space-x-4 overflow-hidden relative isolate"
            >
              <FiPlay className="fill-current relative z-10 flex-shrink-0" size={16} />
              <span className="relative z-10">{t('play_now')}</span>
            </button>
            
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <button onClick={toggleFavorite} className={`py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[9px] sm:text-[10px] transition-all flex items-center justify-center space-x-2 border ${isFavorite ? 'bg-white text-black border-white' : 'bg-white/5 text-neutral-400 border-white/10 hover:bg-white/10 hover:text-white'}`}>{isFavorite ? <FiCheck size={16} /> : <FiPlus size={16} />}<span>{isFavorite ? t('saved_fav') : t('save_fav')}</span></button>
              <button onClick={handleShare} className="py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[9px] sm:text-[10px] bg-white/5 text-neutral-400 border border-white/10 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center space-x-2"><FiShare2 size={16} /><span>{t('share')}</span></button>
            </div>

            <div className={`p-4 sm:p-6 md:p-8 rounded-[1.5rem] sm:rounded-[2rem] border transition-colors ${theme === 'dark' ? 'bg-white/5 border-white/10 text-neutral-400' : 'bg-white border-gray-200 text-gray-600 shadow-lg'} space-y-3 sm:space-y-4 text-[10px] sm:text-xs font-bold uppercase tracking-widest`}>
              <div className="flex justify-between items-center"><FiStar className="text-yellow-500" size={16} /> <span className={`${theme === 'dark' ? 'text-white' : 'text-dark'} text-base sm:text-lg font-black`}>{(comments.length > 0 ? communityRating : (movie.vote_average || 0)).toFixed(1)}</span></div>
              <div className={`h-[1px] ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`} />
              <div className="flex justify-between items-center">{t('views')}: <span className={theme === 'dark' ? 'text-white' : 'text-dark'}>{viewCount.toLocaleString()}</span></div>
            </div>
          </div>

          <div className="flex-grow space-y-8 sm:space-y-12">
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="space-y-4 sm:space-y-6">
              <h1 className={`text-2xl sm:text-3xl md:text-5xl lg:text-7xl font-black leading-tight tracking-tighter uppercase ${theme === 'dark' ? 'text-white' : 'text-dark'}`}>{movie.title}</h1>
              <p className="text-primary font-black italic text-base sm:text-lg md:text-xl uppercase">{movie.tagline}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                {movieInfoItems.map((item, i) => (
                  <div key={i} className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-colors ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-white border-gray-200 shadow-sm'}`}>
                    <p className="text-[8px] sm:text-[10px] text-neutral-500 font-black mb-1 uppercase tracking-widest whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</p>
                    <p className={`text-[10px] sm:text-xs font-black uppercase ${theme === 'dark' ? 'text-white' : 'text-dark'} whitespace-nowrap overflow-hidden text-ellipsis`}>{item.value}</p>
                  </div>
                ))}
              </div>
              <p className={`text-sm sm:text-base md:text-lg leading-relaxed font-medium p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border transition-colors ${theme === 'dark' ? 'text-neutral-300 bg-white/5 border-white/5' : 'text-gray-700 bg-white border-gray-200 shadow-sm'}`}>{movie.overview}</p>
            </motion.div>

            <div className="space-y-8 sm:space-y-12 p-4 sm:p-6 md:p-12 rounded-[2rem] sm:rounded-[2.5rem] border transition-all duration-300 shadow-2xl relative overflow-hidden group w-full max-w-7xl mx-auto">
              <div className={`absolute inset-0 transition-opacity duration-300 ${theme === 'dark' ? 'bg-black/40' : 'bg-white'}`} />
              
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6 relative z-10 border-b border-white/5 pb-6 sm:pb-8">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-1.5 h-6 sm:h-8 bg-primary rounded-full flex-shrink-0" />
                  <h3 className={`text-lg sm:text-xl md:text-3xl font-black uppercase tracking-tighter whitespace-nowrap ${theme === 'dark' ? 'text-white' : 'text-dark'}`}>
                    {t('community_rating')}
                  </h3>
                  <span className="text-primary/30 font-black tracking-widest text-sm sm:text-base md:text-xl leading-none">/ {comments.length}</span>
                </div>

                <div className="flex items-center space-x-2 sm:space-x-3 bg-black/20 backdrop-blur-md px-3 sm:px-4 py-2 rounded-xl border border-white/5">
                  <div className="flex space-x-0.5 items-center">
                    {[1,2,3,4,5].map(s => (
                      <FiStar key={s} size={14} className={communityRating >= s ? 'text-yellow-500 fill-current' : 'text-neutral-800'} />
                    ))}
                  </div>
                  <span className="font-black text-base sm:text-lg text-yellow-500 leading-none">{communityRating.toFixed(1)}</span>
                </div>
              </div>
              
              {user ? (
                <form onSubmit={handleCommentSubmit} className="space-y-6 sm:space-y-8 relative z-10">
                  <div className="flex flex-col md:flex-row md:items-center gap-4 sm:gap-6">
                    <div className="flex items-center space-x-4 sm:space-x-6 bg-gray-100 dark:bg-black/40 p-3 sm:p-4 rounded-xl sm:rounded-2xl w-fit border border-gray-200 dark:border-white/5 shadow-xl">
                      <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">{t('feeling')}</span>
                      <div className="flex space-x-2 sm:space-x-3">
                        {[1,2,3,4,5].map(s => (
                          <button 
                            key={s} 
                            type="button" 
                            onClick={() => setRating(s)} 
                            className={`transition-all hover:scale-125 ${rating >= s ? 'text-yellow-500' : 'text-neutral-700'}`}
                          >
                            <FiStar size={24} className={rating >= s ? 'fill-current' : ''} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="relative group/input">
                    <textarea 
                      value={newComment} 
                      onChange={(e) => setNewComment(e.target.value)} 
                      placeholder={t('your_thought')} 
                      className={`w-full border rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 md:p-8 text-sm sm:text-base md:text-lg outline-none transition-all min-h-[120px] sm:min-h-[150px] font-medium leading-relaxed ${theme === 'dark' ? 'bg-black/60 border-white/10 text-white focus:border-primary placeholder:text-neutral-700' : 'bg-white border-gray-200 text-dark focus:border-primary placeholder:text-gray-300 shadow-2xl'}`} 
                      required 
                    />
                    <div className="absolute bottom-4 sm:bottom-6 right-4 sm:right-8">
                      <button 
                        type="submit" 
                        className="group flex items-center space-x-2 sm:space-x-3 bg-primary text-white px-6 py-2.5 sm:px-10 sm:py-4 rounded-xl font-black uppercase tracking-widest text-[10px] sm:text-xs hover:bg-red-700 transition-all shadow-xl"
                      >
                        <span className="relative z-10">{t('send_rating')}</span>
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="text-center p-8 sm:p-12 bg-black/20 rounded-[2rem] sm:rounded-[2.5rem] border border-white/5 backdrop-blur-md relative z-10">
                  <FiMessageSquare size={48} className="mx-auto mb-4 sm:mb-6 text-neutral-700" />
                  <Link to="/login" className="inline-block bg-primary text-white px-6 py-3 sm:px-8 sm:py-4 rounded-xl font-black uppercase tracking-widest text-[10px] sm:text-xs hover:bg-red-700 transition-all shadow-xl">
                    {t('login_required_comm')}
                  </Link>
                </div>
              )}
              
              <div className="relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <AnimatePresence mode="popLayout">
                    {comments.map((c, idx) => (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ delay: idx * 0.05 }} 
                        key={c._id} 
                        className={`flex flex-col gap-3 sm:gap-4 p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border transition-all ${theme === 'dark' ? 'bg-white/[0.02] border-white/5' : 'bg-white border-gray-100 shadow-md'}`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3 sm:gap-4">
                            <Avatar 
                              src={c.user?.avatar} 
                              alt={c.user?.username} 
                              size={44} 
                              className="rounded-xl border border-primary/10" 
                            />
                            <div>
                              <h4 className={`font-black text-xs sm:text-sm uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-dark'}`}>{c.user?.username}</h4>
                              <span className="text-[8px] sm:text-[9px] text-neutral-500 font-bold uppercase tracking-widest">{new Date(c.createdAt).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', { day: 'numeric', month: 'short' })}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1 bg-yellow-500/10 px-2 sm:px-3 py-1 rounded-xl border border-yellow-500/20">
                            <FiStar size={10} className="text-yellow-500 fill-current" />
                            <span className="text-yellow-500 font-black text-[10px] sm:text-xs">{c.rating}</span>
                          </div>
                        </div>
                        <p className={`text-[11px] sm:text-[13px] leading-relaxed font-medium min-h-[40px] ${theme === 'dark' ? 'text-neutral-300' : 'text-gray-700'}`}>{c.content}</p>
                        
                        <div className="flex items-center justify-between pt-4 sm:pt-5 border-t border-white/5 mt-auto">
                          <div className="flex items-center gap-4 sm:gap-8">
                            <button 
                              onClick={() => handleLike(c._id)}
                              className={`text-[10px] sm:text-[11px] font-black uppercase tracking-widest transition-all flex items-center space-x-1.5 sm:space-x-2.5 ${c.likes?.includes(user?._id) ? 'text-primary scale-110' : 'text-neutral-500 hover:text-neutral-300'}`}
                            >
                              <FiThumbsUp size={18} className={c.likes?.includes(user?._id) ? 'fill-current' : ''} />
                              <span>{c.likes?.length || 0}</span>
                            </button>
                            
                            <button 
                              onClick={() => {
                                if (replyingTo === c._id && !replyToUser) {
                                  setReplyTo(null);
                                } else {
                                  setReplyTo(c._id);
                                  setReplyToUser(null);
                                }
                              }}
                              className={`text-[10px] sm:text-[11px] font-black uppercase tracking-widest transition-all flex items-center space-x-1.5 sm:space-x-2.5 ${replyingTo === c._id && !replyToUser ? 'text-primary' : 'text-neutral-500 hover:text-neutral-300'}`}
                            >
                              <div className="relative">
                                <FiMessageSquare size={18} />
                                {c.replies?.length > 0 && (
                                  <span className="absolute -top-2 -right-2 bg-primary text-white text-[7px] sm:text-[8px] w-3.5 h-3.5 sm:w-4 sm:h-4 flex items-center justify-center rounded-full border-2 border-dark animate-pulse font-bold">
                                    {c.replies.length}
                                  </span>
                                )}
                              </div>
                              <span>{t('reply')}</span>
                            </button>
                          </div>
                          <div className="flex items-center gap-3 sm:gap-5">
                            {/* Only show Report if NOT owner */}
                            {user?._id !== (c.user?._id || c.user) && (
                              <button 
                                onClick={() => handleReport(c._id)}
                                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-white/5 text-neutral-500 hover:bg-yellow-500/20 hover:text-yellow-500 transition-all border border-transparent hover:border-yellow-500/30"
                                title={t('report')}
                              >
                                <FiAlertCircle size={18} />
                              </button>
                            )}
                            {/* Only show Delete if Owner or Admin */}
                            {(user?._id === (c.user?._id || c.user) || user?.role === 'admin') && (
                              <button 
                                onClick={() => handleDeleteComment(c._id)}
                                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-white/5 text-neutral-500 hover:bg-red-500/20 hover:text-red-500 transition-all border border-transparent hover:border-red-500/30"
                                title={t('withdraw')}
                              >
                                <FiTrash2 size={18} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Replies List */}
                        {c.replies?.length > 0 && (
                          <div className={`mt-2 space-y-2 sm:space-y-3 pl-2 sm:pl-3 border-l-2 ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'} max-h-[200px] overflow-y-auto custom-scrollbar`}>
                            {c.replies.map((reply: any, rid: any) => (
                              <div key={rid} className="flex gap-2 group/reply">
                                <Avatar src={reply.user?.avatar} size={20} className="rounded-md flex-shrink-0 mt-0.5" />
                                <div className="flex-grow min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className={`text-[8px] sm:text-[9px] font-black uppercase truncate ${theme === 'dark' ? 'text-white/80' : 'text-dark/80'}`}>{reply.user?.username}</p>
                                    <div className="flex items-center space-x-2">
                                      <span className="text-[6px] sm:text-[7px] text-neutral-500 font-bold whitespace-nowrap">{new Date(reply.createdAt).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', { day: 'numeric', month: 'short' })}</span>
                                      
                                      {/* Like Reply button */}
                                      <button 
                                        onClick={() => handleLikeReply(c._id, reply._id)}
                                        className={`text-[6px] sm:text-[7px] font-black uppercase transition-all flex items-center space-x-1 ${reply.likes?.includes(user?._id) ? 'text-primary' : 'text-neutral-500 hover:text-neutral-300'}`}
                                      >
                                        <FiThumbsUp size={10} className={reply.likes?.includes(user?._id) ? 'fill-current' : ''} />
                                        <span>{reply.likes?.length || 0}</span>
                                      </button>

                                      {/* New Reply to Reply button */}
                                      <button 
                                        onClick={() => {
                                          setReplyTo(c._id);
                                          setReplyToUser(reply.user?.username);
                                        }}
                                        className="text-[6px] sm:text-[7px] font-black uppercase text-neutral-500 hover:text-primary transition-colors opacity-0 group-hover/reply:opacity-100"
                                      >
                                        {t('reply')}
                                      </button>

                                      {(user?._id === reply.user?._id || user?._id === reply.user || user?.role === 'admin') && (
                                        <button 
                                          onClick={() => handleDeleteReply(c._id, reply._id)}
                                          className="text-neutral-500 hover:text-red-500 transition-colors opacity-0 group-hover/reply:opacity-100"
                                          title={t('delete_comm')}
                                        >
                                          <FiTrash2 size={8} />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  <p className={`text-[9px] sm:text-[10px] leading-snug font-medium break-words ${theme === 'dark' ? 'text-neutral-400' : 'text-gray-600'}`}>
                                    {reply.replyToUser && (
                                      <span className="text-primary font-bold mr-1 italic">@{reply.replyToUser}</span>
                                    )}
                                    {reply.content}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Reply Input */}
                        <AnimatePresence>
                          {replyingTo === c._id && (
                            <motion.form 
                              initial={{ opacity: 0, height: 0 }} 
                              animate={{ opacity: 1, height: 'auto' }} 
                              exit={{ opacity: 0, height: 0 }}
                              onSubmit={(e) => handleReplySubmit(e, c._id)}
                              className="relative mt-2"
                            >
                              {replyToUser && (
                                <div className="flex items-center space-x-2 mb-1.5 ml-2 sm:ml-3 px-2 py-1 bg-primary/10 rounded-lg w-fit border border-primary/20">
                                  <span className="text-[6px] sm:text-[7px] font-black uppercase text-primary tracking-widest flex items-center">
                                    <FiCornerDownRight className="mr-1" size={10} /> {lang === 'vi' ? 'Phản hồi' : 'Replying to'} @{replyToUser}
                                  </span>
                                  <button 
                                    onClick={() => setReplyToUser(null)}
                                    className="text-primary/40 hover:text-primary transition-colors flex items-center border-l border-primary/20 pl-1.5 ml-1.5"
                                  >
                                    <FiX size={10} />
                                  </button>
                                </div>
                              )}
                              <div className="relative">
                                <input 
                                  type="text"
                                  value={replyContent}
                                  onChange={(e) => setReplyContent(e.target.value)}
                                  placeholder={replyToUser ? `${t('reply')} @${replyToUser}...` : t('reply')}
                                  className={`w-full border rounded-lg sm:rounded-xl py-2 pl-2 sm:pl-3 pr-8 sm:pr-10 text-[9px] sm:text-[10px] outline-none focus:border-primary transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-dark'}`}
                                />
                                <button type="submit" className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 text-primary hover:text-red-700 transition-colors">
                                  <FiSend size={14} />
                                </button>
                              </div>
                            </motion.form>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
                {comments.length === 0 && (
                  <div className="text-center py-16 sm:py-20 bg-white/5 rounded-[1.5rem] sm:rounded-[2rem] border border-dashed border-white/10">
                    <FiMessageSquare size={48} className="mx-auto mb-3 sm:mb-4 text-neutral-700" />
                    <p className="font-black uppercase tracking-[0.3em] text-[10px] sm:text-xs text-neutral-500">{t('no_comments')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(MovieDetail);
