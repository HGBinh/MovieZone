import { useState, useEffect, useMemo } from 'react';
import movieService from '../services/movieService';
import { motion } from 'framer-motion';
import BannerSlider from '../components/movie/BannerSlider';
import MovieRow from '../components/movie/MovieRow';
import MovieCard from '../components/movie/MovieCard';
import { FiTrendingUp, FiActivity, FiClock, FiStar, FiSearch } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { theme, t, lang } = useAuth();
  const [trending, setTrending] = useState<any[]>([]);
  const [popular, setPopular] = useState<any[]>([]);
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [topRated, setTopRated] = useState<any[]>([]);
  const [localMovies, setLocalMovies] = useState<any[]>([]);
  const [customBanners, setCustomBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [trendingPage, setTrendingPage] = useState(1);
  const [popularPage, setPopularPage] = useState(1);
  const [upcomingPage, setUpcomingPage] = useState(1);

  const fetchTrending = async (page: number) => {
    try {
      const apiLang = lang === 'vi' ? 'vi-VN' : 'en-US';
      const data = await movieService.getTrendingMovies(page, apiLang);
      setTrending(prev => {
        if (page === 1) return data.results;
        const existingIds = new Set(prev.map(m => m.id));
        const unique = data.results.filter(m => !existingIds.has(m.id));
        return [...prev, ...unique];
      });
    } catch (error) {
      console.error('Error fetching trending:', error);
    }
  };

  const fetchPopular = async (page: number) => {
    try {
      const apiLang = lang === 'vi' ? 'vi-VN' : 'en-US';
      const data = await movieService.getPopularMovies(page, apiLang);
      setPopular(prev => {
        if (page === 1) return data.results;
        const existingIds = new Set(prev.map(m => m.id));
        const unique = data.results.filter(m => !existingIds.has(m.id));
        return [...prev, ...unique];
      });
    } catch (error) {
      console.error('Error fetching popular:', error);
    }
  };

  const fetchUpcoming = async (page: number) => {
    try {
      const apiLang = lang === 'vi' ? 'vi-VN' : 'en-US';
      const data = await movieService.getUpcomingMovies(page, apiLang);
      setUpcoming(prev => {
        if (page === 1) return data.results;
        const existingIds = new Set(prev.map(m => m.id));
        const unique = data.results.filter(m => !existingIds.has(m.id));
        return [...prev, ...unique];
      });
    } catch (error) {
      console.error('Error fetching upcoming:', error);
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const apiLang = lang === 'vi' ? 'vi-VN' : 'en-US';
        const [resTopRated, resLocal, resBanners] = await Promise.all([
          movieService.getTopRatedMovies(1, apiLang),
          movieService.getLocalMovies(),
          movieService.getBannerMovies(),
        ]);

        await Promise.all([
          fetchTrending(1),
          fetchPopular(1),
          fetchUpcoming(1)
        ]);

        setTopRated(resTopRated.results || resTopRated);
        setLocalMovies(resLocal);
        setCustomBanners(resBanners);
      } catch (error) {
        console.error('Error fetching initial data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [lang]);

  const loadMoreTrending = () => {
    const nextPage = trendingPage + 1;
    if (nextPage > 500) return;
    setTrendingPage(nextPage);
    fetchTrending(nextPage);
  };

  const loadMorePopular = () => {
    const nextPage = popularPage + 1;
    if (nextPage > 500) return;
    setPopularPage(nextPage);
    fetchPopular(nextPage);
  };

  const loadMoreUpcoming = () => {
    const nextPage = upcomingPage + 1;
    if (nextPage > 500) return;
    setUpcomingPage(nextPage);
    fetchUpcoming(nextPage);
  };

  // Combine custom banners with trending movies for slider
  const sliderMovies = useMemo(() => [
    ...customBanners.map(b => {
      const movie =
        b.movie && typeof b.movie === 'object' && b.movie._id ? b.movie : null;
      const movieId = movie?._id;
      const externalLink = b.link?.trim() || null;
      return {
        id: movieId || externalLink || `banner_${b._id}`,
        title: b.title,
        overview: b.description || movie?.description || '',
        backdrop_path: b.image,
        poster_path: movie?.posterPath || b.image,
        vote_average: movie?.voteAverage ?? 0,
        release_date: movie?.releaseDate || '',
        isCustom: true,
        customLink: externalLink || null,
        hasMovieLink: !!movieId,
      };
    }),
    ...trending.slice(0, 5),
    ...popular.slice(0, 2)
  ].filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i), [customBanners, trending, popular]);

  if (loading) return (
    <div className={`flex flex-col items-center justify-center min-h-screen space-y-4 ${theme === 'dark' ? 'bg-dark' : 'bg-white'}`}>
      <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      <p className="text-primary font-bold animate-pulse tracking-widest uppercase text-xs">{t('loading_experience')}</p>
    </div>
  );

  return (
    <div className={`transition-colors duration-300 w-full max-w-full overflow-x-hidden ${theme === 'dark' ? 'bg-[#050505]' : 'bg-[#f8f9fa]'} pb-20`}>
      {sliderMovies.length > 0 ? (
        <BannerSlider movies={sliderMovies} />
      ) : (
        <div className={`relative h-[60vh] flex items-center justify-center overflow-hidden`}>
          {/* Background Decorative Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-blue-500/10 animate-pulse"></div>
            <div className="absolute top-1/4 left-0 w-64 sm:w-96 h-64 sm:h-96 bg-primary/10 rounded-full blur-[120px] -translate-x-1/2"></div>
            <div className="absolute bottom-1/4 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-blue-500/10 rounded-full blur-[120px] translate-x-1/2"></div>
          </div>
          
          <div className="relative z-10 text-center px-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase">
                Movie<span className="text-primary">Zone</span>
              </h2>
              <p className="text-neutral-500 font-black uppercase tracking-[0.4em] text-[10px] md:text-xs">
                {t('cinematic_exp')}
              </p>
              <div className="flex items-center justify-center space-x-4 pt-4">
                <div className="w-12 h-[1px] bg-neutral-800"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-ping"></div>
                <div className="w-12 h-[1px] bg-neutral-800"></div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
      
      {/* Search Section Integrated to Home */}
      <div className={`container mx-auto px-4 sm:px-6 md:px-10 relative z-10 ${sliderMovies.length > 0 ? '-mt-8 sm:-mt-12' : '-mt-16 sm:-mt-20'}`}>
        <div className={`max-w-4xl mx-auto p-2 sm:p-3 rounded-[2rem] sm:rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border transition-all duration-500 ${
          theme === 'dark' 
            ? 'bg-black border-white/10 hover:border-primary/30' 
            : 'bg-white border-gray-200 hover:border-primary/20'
        }`}>
          <form onSubmit={(e: React.FormEvent) => {
            e.preventDefault();
            const query = (e.target as HTMLFormElement).search.value;
            if(query) window.location.href = `/search?q=${query}`;
          }} className="flex items-center min-w-0 gap-1 sm:gap-2">
            <div className="pl-3 sm:pl-6 pr-1 sm:pr-3 text-primary/60 flex-shrink-0"><FiSearch size={18} /></div>
            <input 
              name="search"
              type="text" 
              placeholder={t('search_home_placeholder')} 
              className={`min-w-0 flex-1 bg-transparent py-3 sm:py-5 text-sm md:text-lg focus:outline-none font-bold placeholder:text-neutral-500 ${theme === 'dark' ? 'text-white' : 'text-dark'}`}
            />
            <button type="submit" className="btn-primary-safe bg-primary text-white px-3 sm:px-10 py-3 sm:py-5 rounded-[1.5rem] sm:rounded-[2rem] font-black uppercase tracking-widest text-[8px] sm:text-[11px] hover:bg-red-700 transition-all shadow-none sm:shadow-2xl active:scale-95 whitespace-nowrap flex-shrink-0 flex items-center justify-center space-x-1 sm:space-x-2 group no-min-h min-w-[3rem] sm:min-w-0">
              <span>{t('search_btn')}</span>
              <FiSearch className="group-hover:translate-x-1 transition-transform hidden sm:block" size={14} />
            </button>
          </form>
        </div>
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 md:px-10 mt-12 sm:mt-16">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
          {/* Main Content */}
          <div className="lg:w-3/4 space-y-8 sm:space-y-12">
            {localMovies.length > 0 && (
              <MovieRow title={t('newly_added')} movies={localMovies.map(m => ({
                id: m._id,
                title: m.title,
                poster_path: m.posterPath,
                vote_average: m.voteAverage || 0,
                release_date: m.releaseDate,
                isLocal: true
              }))} />
            )}
            <MovieRow title={t('recently_updated')} movies={trending} onLoadMore={loadMoreTrending} />
            <MovieRow title={t('hot_series')} movies={popular} onLoadMore={loadMorePopular} />
            <MovieRow title={t('new_movies')} movies={upcoming} onLoadMore={loadMoreUpcoming} />
            
            <div className={`p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border transition-colors ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-white border-gray-100 shadow-sm'}`}>
              <div className="flex items-center space-x-3 sm:space-x-4 mb-6 sm:mb-8">
                <div className="w-1.5 h-6 sm:h-8 bg-primary rounded-full shadow-[0_0_10px_rgba(229,9,20,0.5)]"></div>
                <h2 className={`text-xl sm:text-2xl font-black uppercase ${theme === 'dark' ? 'text-white' : 'text-dark'}`}>{t('top_rated')}</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 sm:gap-6">
                {topRated.slice(0, 8).map(movie => (
                  <MovieCard key={movie.id} movie={movie} />
                ))}
              </div>
              <div className="mt-8 sm:mt-10 text-center px-2 sm:px-4 overflow-hidden">
                <Link to="/search" className="inline-flex items-center justify-center max-w-full btn-primary-safe bg-primary text-white px-4 sm:px-10 py-2.5 sm:py-3 rounded-full font-black uppercase tracking-wider text-[8px] sm:text-xs hover:bg-red-700 transition-all shadow-none sm:shadow-lg sm:shadow-primary/20 whitespace-normal sm:whitespace-nowrap text-center leading-tight">
                  {t('explore_all')}
                </Link>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-1/4 space-y-6 sm:space-y-10">
            <div className={`rounded-2xl sm:rounded-3xl border transition-colors overflow-hidden ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-white border-gray-100 shadow-lg'}`}>
              <div className="bg-primary px-4 sm:px-6 py-4 sm:py-5 flex items-center space-x-2 sm:space-x-3">
                <FiTrendingUp className="text-white" size={20} />
                <h3 className="font-black text-[10px] sm:text-xs uppercase tracking-[0.2em] text-white">
                  {t('trending_week')}
                </h3>
              </div>
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-hidden">
                {trending.slice(5, 12).map((movie, index) => (
                  <Link key={movie.id} to={`/movie/${movie.id}`} className="flex items-center space-x-3 sm:space-x-4 group">
                    <div className="relative flex-shrink-0">
                      <span className={`absolute -top-1.5 sm:-top-2 -left-1.5 sm:-left-2 w-5 h-5 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center text-[9px] sm:text-[10px] font-black z-10 shadow-xl ${index < 3 ? 'bg-primary text-white' : 'bg-neutral-800 text-neutral-400'}`}>
                        {index + 1}
                      </span>
                      <img 
                        src={`https://image.tmdb.org/t/p/w185${movie.poster_path}`} 
                        className="w-12 h-16 sm:w-16 sm:h-24 object-cover rounded-lg sm:rounded-xl border border-white/5 group-hover:border-primary/50 transition-all shadow-md" 
                        alt={movie.title} 
                        loading="lazy"
                      />
                    </div>
                    <div className="flex-grow">
                      <h4 className={`text-[10px] sm:text-[11px] font-black uppercase leading-tight line-clamp-2 transition-colors group-hover:text-primary ${theme === 'dark' ? 'text-neutral-200' : 'text-neutral-800'}`}>
                        {movie.title}
                      </h4>
                      <div className="flex items-center space-x-2 sm:space-x-3 mt-1.5 sm:mt-2 text-[8px] sm:text-[9px] font-black text-neutral-500 uppercase tracking-widest">
                        <span className="text-yellow-500 flex items-center"><FiStar className="mr-1" size={12} /> {movie.vote_average?.toFixed(1) || '0.0'}</span>
                        <span>{movie.release_date?.split('-')[0] || 'N/A'}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className={`p-4 sm:p-6 rounded-2xl sm:rounded-3xl border transition-colors space-y-4 sm:space-y-6 ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-white border-gray-100 shadow-lg'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 sm:space-x-3 text-neutral-500">
                  <FiActivity size={18} />
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">{t('live_status')}</span>
                </div>
                <span className="text-primary font-black text-xs sm:text-sm">2,451</span>
              </div>
              <div className={`h-[1px] w-full ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}></div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 sm:space-x-3 text-neutral-500">
                  <FiClock size={18} />
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">{t('database_stats')}</span>
                </div>
                <span className={`${theme === 'dark' ? 'text-white' : 'text-dark'} font-black text-xs sm:text-sm`}>15,842</span>
              </div>
            </div>

            <div className={`p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border transition-colors ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-white border-gray-100 shadow-lg'}`}>
              <h3 className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 mb-4 sm:mb-6">{t('popular_keywords')}</h3>
              <div className="flex flex-wrap gap-2">
                {['Hành Động', 'K-Drama', 'Marvel', 'Anime', 'Kinh Dị', 'Top IMDb'].map(tag => (
                  <Link key={tag} to={`/search?q=${tag}`} className={`text-[8px] sm:text-[9px] font-black uppercase tracking-widest px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl transition-all border ${theme === 'dark' ? 'text-neutral-400 bg-white/5 border-white/5 hover:bg-primary hover:text-white hover:border-primary' : 'text-neutral-600 bg-gray-50 border-gray-100 hover:bg-primary hover:text-white hover:border-primary'}`}>
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
