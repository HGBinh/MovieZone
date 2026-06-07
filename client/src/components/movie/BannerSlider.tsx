import { useState, useEffect, useCallback, memo } from 'react';
import { Link } from 'react-router-dom';
import { FiPlay, FiInfo, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import type { Movie } from '../../types';

interface BannerSliderProps {
  movies: Movie[];
}

const BannerSlider = ({ movies }: BannerSliderProps) => {
  const { t } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const nextSlide = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev === movies.length - 1 ? 0 : prev + 1));
  }, [movies.length]);

  const prevSlide = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev === 0 ? movies.length - 1 : prev - 1));
  }, [movies.length]);

  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, 8000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  if (!movies || movies.length === 0) return null;

  const movie = movies[currentIndex];
  const title = (movie.title || movie.name || 'Untitled') as string;
  const backdropUrl = (movie as Movie & { isCustom?: boolean }).isCustom
    ? (movie.backdrop_path as string)
    : (movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : 'https://placehold.co/1920x1080/1a1a1a/e50914?text=No+Backdrop');
  const posterUrl = (movie as Movie & { isCustom?: boolean }).isCustom
    ? (movie.poster_path as string)
    : (movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'https://placehold.co/500x750/1a1a1a/e50914?text=No+Poster');

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.onerror = null;
    target.src = target.src.includes('1920')
      ? 'https://placehold.co/1920x1080/1a1a1a/e50914?text=No+Backdrop'
      : 'https://placehold.co/500x750/1a1a1a/e50914?text=No+Poster';
  };

  const movieId = movie.id ?? movie._id;
  const customMeta = movie as Movie & { isCustom?: boolean; customLink?: string | null; hasMovieLink?: boolean };
  const isCustom = customMeta.isCustom;
  const customLink = customMeta.customLink;
  const hasMovieLink = customMeta.hasMovieLink;
  const externalHref =
    customLink || (movieId != null && String(movieId).startsWith('http') ? String(movieId) : null);
  const isUnlinkedCustomBanner = isCustom && !hasMovieLink && !externalHref;
  const bannerDetailHref = isUnlinkedCustomBanner ? `/movie/${movieId}` : null;
  const movieHref =
    isCustom && hasMovieLink
      ? `/movie/local_${movieId}`
      : movie.name
        ? `/movie/tv/${movieId}`
        : `/movie/${movieId}`;
  const detailHref = bannerDetailHref || movieHref;

  const primaryBtnClass =
    'btn-primary-safe group flex items-center justify-center space-x-2 sm:space-x-4 bg-primary text-white px-5 py-3 sm:px-8 sm:py-4 lg:px-10 lg:py-5 rounded-xl sm:rounded-2xl font-black hover:bg-red-700 transition-all text-[10px] sm:text-xs md:text-sm uppercase tracking-widest overflow-hidden relative max-w-full';
  const secondaryBtnClass =
    'flex items-center justify-center space-x-2 sm:space-x-4 bg-white/5 text-white px-5 py-3 sm:px-8 sm:py-4 lg:px-10 lg:py-5 rounded-xl sm:rounded-2xl font-black hover:bg-white/10 transition-all backdrop-blur-xl border border-white/10 text-[10px] sm:text-xs md:text-sm uppercase tracking-widest max-w-full overflow-hidden';

  const posterOverlay = (
    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-[2.5rem] flex items-center justify-center backdrop-blur-[2px]">
      <motion.div whileHover={{ scale: 1.1 }} className="w-20 h-20 bg-primary rounded-full flex items-center justify-center">
        <FiPlay className="fill-current text-white ml-1" size={32} />
      </motion.div>
    </div>
  );

  return (
    <div className="relative h-[60vh] sm:h-[70vh] md:h-[85vh] lg:h-screen w-full overflow-hidden bg-black">
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          <div className="absolute inset-0">
            <img
              src={backdropUrl}
              alt={title}
              className="w-full h-full object-cover"
              onError={handleImageError}
            />
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute inset-0 bg-gradient-to-r from-dark via-dark/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-dark via-transparent to-transparent" />
          </div>

          <div className="absolute inset-0 flex items-center">
            <div className="container mx-auto px-4 md:px-8 lg:px-20">
              <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-20">
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  className="hidden lg:block w-[280px] xl:w-[380px] flex-shrink-0"
                >
                  {externalHref ? (
                    <a href={externalHref} target="_blank" rel="noopener noreferrer" className="block relative group">
                      <img
                        src={posterUrl}
                        className="rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.8)] border border-white/10 transition-all duration-500 group-hover:scale-[1.02] group-hover:border-primary/50"
                        alt={title}
                        onError={handleImageError}
                      />
                      {posterOverlay}
                    </a>
                  ) : (
                    <Link to={detailHref} className="block relative group">
                      <img
                        src={posterUrl}
                        className="rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.8)] border border-white/10 transition-all duration-500 group-hover:scale-[1.02] group-hover:border-primary/50"
                        alt={title}
                        onError={handleImageError}
                      />
                      {posterOverlay}
                    </Link>
                  )}
                </motion.div>

                <div className="flex-grow max-w-full lg:max-w-4xl text-center lg:text-left">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="space-y-4 lg:space-y-6"
                  >
                    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-4">
                      <span className="bg-primary text-white text-[9px] sm:text-[10px] font-black px-3 py-1.5 sm:px-4 sm:py-2 rounded-full uppercase tracking-widest">
                        {t('featured_movie')}
                      </span>
                      <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-white/10">
                        <span className="text-yellow-500 font-black text-[10px] sm:text-xs">
                          ★ {movie.vote_average != null ? Number(movie.vote_average).toFixed(1) : '0.0'}
                        </span>
                        <span className="text-neutral-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">
                          | {(movie.release_date as string | undefined)?.split('-')[0] || '—'}
                        </span>
                      </div>
                    </div>

                    <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-7xl font-black drop-shadow-2xl leading-[1.1] tracking-tighter uppercase text-white">
                      {movie.title as string}
                    </h1>

                    <p className="text-xs sm:text-sm md:text-base lg:text-lg text-neutral-300 mb-6 lg:mb-8 line-clamp-2 md:line-clamp-3 drop-shadow-md max-w-full lg:max-w-2xl font-medium leading-relaxed px-2 lg:px-0">
                      {movie.overview as string}
                    </p>

                    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-4 overflow-hidden isolate max-w-full">
                      {externalHref ? (
                        <a href={externalHref} target="_blank" rel="noopener noreferrer" className={primaryBtnClass}>
                          <FiPlay className="fill-current relative z-10 flex-shrink-0" size={16} />
                          <span className="relative z-10">{t('play_now')}</span>
                        </a>
                      ) : (
                        <Link to={detailHref} className={primaryBtnClass}>
                          <FiPlay className="fill-current relative z-10 flex-shrink-0" size={16} />
                          <span className="relative z-10">{t('play_now')}</span>
                        </Link>
                      )}

                      {externalHref ? (
                        <a href={externalHref} target="_blank" rel="noopener noreferrer" className={secondaryBtnClass}>
                          <FiInfo size={16} className="flex-shrink-0" />
                          <span>{t('details')}</span>
                        </a>
                      ) : (
                        <Link to={detailHref} className={secondaryBtnClass}>
                          <FiInfo size={16} className="flex-shrink-0" />
                          <span>{t('details')}</span>
                        </Link>
                      )}
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-y-0 left-2 sm:left-4 md:left-6 lg:left-10 flex items-center z-30 pointer-events-none">
        <button
          type="button"
          onClick={prevSlide}
          aria-label="Previous slide"
          className="pointer-events-auto w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl bg-black/55 hover:bg-primary active:scale-95 text-white transition-all flex items-center justify-center border border-white/10 hover:border-primary group shadow-lg backdrop-blur-sm icon-btn no-min-h flex-shrink-0"
        >
          <FiChevronLeft className="group-hover:-translate-x-0.5 transition-transform" size={22} />
        </button>
      </div>
      <div className="absolute inset-y-0 right-2 sm:right-4 md:right-6 lg:right-10 flex items-center z-30 pointer-events-none">
        <button
          type="button"
          onClick={nextSlide}
          aria-label="Next slide"
          className="pointer-events-auto w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl bg-black/55 hover:bg-primary active:scale-95 text-white transition-all flex items-center justify-center border border-white/10 hover:border-primary group shadow-lg backdrop-blur-sm icon-btn no-min-h flex-shrink-0"
        >
          <FiChevronRight className="group-hover:translate-x-0.5 transition-transform" size={22} />
        </button>
      </div>

      <div className="absolute inset-x-0 bottom-16 sm:bottom-10 md:bottom-12 px-4 md:px-20 lg:px-32 flex items-center justify-center sm:justify-between z-20 pointer-events-none">
        <div className="hidden sm:block text-white/50 font-black tracking-[0.3em] text-[9px] sm:text-[10px] uppercase pointer-events-none">
          <span className="text-primary">{String(currentIndex + 1).padStart(2, '0')}</span>
          <span className="mx-2">/</span>
          {String(movies.length).padStart(2, '0')}
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
          {movies.map((_, idx) => (
            <button
              type="button"
              key={idx}
              aria-label={`Slide ${idx + 1}`}
              aria-current={idx === currentIndex ? 'true' : undefined}
              onClick={() => {
                setDirection(idx > currentIndex ? 1 : -1);
                setCurrentIndex(idx);
              }}
              className={`banner-dot no-min-h icon-btn flex-shrink-0 rounded-full transition-all duration-300 ${
                idx === currentIndex
                  ? 'h-1.5 w-6 sm:h-2 sm:w-8 bg-primary'
                  : 'h-1.5 w-1.5 sm:h-2 sm:w-2 bg-white/30 hover:bg-white/50'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default memo(BannerSlider);
