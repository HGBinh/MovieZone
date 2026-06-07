import { useState, useEffect } from 'react';
import favoriteService from '../services/favoriteService';
import { useAuth } from '../context/AuthContext';
import MovieCard from '../components/movie/MovieCard';
import { FiHeart, FiTrash2, FiSearch, FiChevronRight } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

const Favorites = () => {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, theme, t, lang } = useAuth();

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const data = await favoriteService.getFavorites(user?.token || '');
        setFavorites(data);
      } catch (error) {
        console.error('Error fetching favorites:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [user]);

  const removeFavorite = async (movieId: string) => {
    try {
      // Optimistic UI update
      const updatedFavorites = favorites.filter(f => f.movieId !== movieId);
      setFavorites(updatedFavorites);

      await favoriteService.removeFavorite(user?.token || '', movieId);
      
      toast.success(t('fav_removed'));
    } catch (error) {
      // Rollback if error
      toast.error(t('fav_error'));
      // Re-fetch to sync
      const data = await favoriteService.getFavorites(user?.token || '');
      setFavorites(data);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0a0a0a] text-white' : 'bg-[#f8f9fa] text-dark'} pb-32`}>
      {/* Breadcrumbs */}
      <div className={`py-4 transition-colors ${theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-white'} border-b ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'} mb-12`}>
        <div className="container mx-auto px-4 md:px-10 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-neutral-500">
            <Link to="/" className="hover:text-primary transition-colors">MovieZone</Link>
            <FiChevronRight />
            <Link to="/profile" className="hover:text-primary transition-colors">{t('profile')}</Link>
            <FiChevronRight />
            <span className="text-primary">{t('favorites')}</span>
          </div>
          <div className="px-4 py-1 bg-primary/10 rounded-full text-primary text-[10px] font-black uppercase">
            {favorites.length} {t('movies_count')}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-4">
              <div className="w-1.5 h-10 bg-primary rounded-full shadow-[0_0_15px_rgba(229,9,20,0.5)]"></div>
              <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">{t('my_collection')}</h1>
            </div>
            <p className="text-neutral-500 font-medium text-sm md:text-base">{t('fav_description')}</p>
          </div>
        </div>

        {favorites.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
            <AnimatePresence mode="popLayout">
              {favorites.map((fav) => (
                <motion.div 
                  key={fav.movieId}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.3 }}
                  className="relative group"
                >
                  <MovieCard movie={{
                    id: fav.movieId,
                    title: fav.movieTitle,
                    poster_path: fav.posterPath,
                    release_date: fav.releaseDate,
                    vote_average: fav.voteAverage
                  }} />
                  <button 
                    onClick={() => removeFavorite(fav.movieId)}
                    className="absolute top-3 right-3 bg-black/80 p-3 rounded-2xl text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-primary shadow-2xl z-20 backdrop-blur-md"
                    title={lang === 'vi' ? 'Xóa khỏi yêu thích' : 'Remove from favorites'}
                  >
                    <FiTrash2 size={18} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 bg-white/5 rounded-[3rem] border border-dashed border-white/10">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-8">
              <FiHeart size={40} className="text-primary animate-pulse" />
            </div>
            <p className="text-neutral-400 font-bold text-center max-w-md px-6 leading-relaxed mb-10">
              {t('empty_fav_desc')}
            </p>
            <Link to="/search" className="bg-primary text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-red-700 transition-all shadow-xl shadow-primary/20 flex items-center space-x-3">
              <FiSearch size={18} />
              <span>{t('explore_now')}</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;