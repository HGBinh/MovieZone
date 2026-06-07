import { useRef, useMemo } from 'react';
import MovieCard from './MovieCard';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import type { Movie } from '../../types';

interface MovieRowProps {
  title: string;
  movies: Movie[];
  onLoadMore?: () => void;
}

const MovieRow = ({ title, movies, onLoadMore }: MovieRowProps) => {
  const { theme } = useAuth();
  const rowRef = useRef<HTMLDivElement>(null);

  const slide = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth, scrollWidth } = rowRef.current;

      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;

      if (direction === 'right' && scrollLeft + clientWidth >= scrollWidth - 500 && onLoadMore) {
        onLoadMore();
      }

      rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  const uniqueMovies = useMemo(() => {
    if (!movies?.length) return [];
    const seen = new Set<string | number>();
    return movies.filter((movie) => {
      const id = movie.id ?? movie._id;
      if (id == null || seen.has(id as string | number)) return false;
      seen.add(id as string | number);
      return true;
    });
  }, [movies]);

  if (!uniqueMovies.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      className="group relative w-full max-w-full overflow-x-hidden"
    >
      <div className="flex items-end justify-between mb-6 px-3 sm:px-6 md:px-8 lg:px-16 xl:px-32 min-w-0">
        <div className="flex items-center space-x-3">
          <div className="w-1.5 h-6 sm:h-8 bg-primary rounded-full"></div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tighter dark:text-white text-dark">
            {title}
          </h2>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={() => slide('left')}
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border flex items-center justify-center transition-all active:scale-90 shadow-lg icon-btn no-min-h flex-shrink-0 ${theme === 'dark' ? 'border-white/10 bg-black/60 text-neutral-400 hover:text-white hover:bg-white/10' : 'border-gray-200 bg-white/60 text-gray-400 hover:text-dark hover:bg-gray-100'}`}
          >
            <FiChevronLeft size={20} />
          </button>
          <button
            onClick={() => slide('right')}
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border flex items-center justify-center transition-all active:scale-90 shadow-lg icon-btn no-min-h flex-shrink-0 ${theme === 'dark' ? 'border-white/10 bg-black/60 text-neutral-400 hover:text-white hover:bg-white/10' : 'border-gray-200 bg-white/60 text-gray-400 hover:text-dark hover:bg-gray-100'}`}
          >
            <FiChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="relative">
        <div
          ref={rowRef}
          className="flex space-x-3 sm:space-x-4 md:space-x-6 lg:space-x-8 overflow-x-auto no-scrollbar px-3 sm:px-4 md:px-8 lg:px-16 pb-6 sm:pb-8"
        >
          {uniqueMovies.map((movie, index) => (
            <div key={`${movie.id ?? movie._id}-${index}`} className="w-[120px] sm:w-[140px] md:w-[180px] lg:w-[220px] flex-shrink-0">
              <MovieCard movie={movie} />
            </div>
          ))}
        </div>

        {/* Subtle Edge Gradients */}
        <div className="absolute left-0 top-0 bottom-0 w-24 sm:w-32 bg-gradient-to-r dark:from-[#0a0a0a] from-[#f8f9fa] to-transparent pointer-events-none z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 hidden md:block"></div>
        <div className="absolute right-0 top-0 bottom-0 w-24 sm:w-32 bg-gradient-to-l dark:from-[#0a0a0a] from-[#f8f9fa] to-transparent pointer-events-none z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 hidden md:block"></div>
      </div>
    </motion.div>
  );
};

export default MovieRow;
