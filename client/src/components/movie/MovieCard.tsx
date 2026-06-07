import { memo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiStar, FiPlay } from 'react-icons/fi';
import type { Movie } from '../../types';

interface MovieCardProps {
  movie: Movie;
  onTrailerClick?: (movie: Movie) => void;
}

const MovieCard = ({ movie, onTrailerClick }: MovieCardProps) => {
  const title = (movie.title || movie.name || 'Untitled') as string;
  const releaseDate = (movie.release_date || movie.first_air_date || '') as string;

  const imageUrl = movie.isLocal
    ? (movie.poster_path as string)
    : (movie.poster_path
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : 'https://placehold.co/500x750/1a1a1a/e50914?text=No+Poster');

  const handleTrailerClick = (e: React.MouseEvent) => {
    if (onTrailerClick) {
      e.preventDefault();
      e.stopPropagation();
      onTrailerClick(movie);
    }
  };

  const movieId = movie.id ?? movie._id;

  return (
    <motion.div
      whileHover={{
        y: -5,
        transition: { duration: 0.2 },
      }}
      className="relative flex-shrink-0 w-full rounded-lg overflow-hidden shadow-lg group cursor-pointer dark:bg-[#1a1a1a] bg-white border dark:border-white/5 border-gray-100"
      style={{ aspectRatio: '2/3' }}
    >
      <Link to={movie.isLocal ? `/movie/local_${movieId}` : (movie.name ? `/movie/tv/${movieId}` : `/movie/${movieId}`)}>
        <div className="relative aspect-[2/3] overflow-hidden">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = 'https://placehold.co/500x750/1a1a1a/e50914?text=No+Poster';
            }}
          />

          {/* Overlays */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center space-y-3">
            <button
              onClick={handleTrailerClick}
              className="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-full flex items-center justify-center scale-75 group-hover:scale-100 transition-transform duration-300 hover:scale-110 active:scale-95 shadow-xl shadow-primary/40 border-none outline-none"
            >
              <FiPlay className="fill-current text-white ml-1" size={16} sm:size={20} />
            </button>
          </div>

          {/* Mọt Phim Style Labels */}
          <div className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2 flex flex-col space-y-1">
            <span className="bg-[#ff9800] text-white text-[8px] sm:text-[10px] font-bold px-1 sm:px-1.5 py-0.5 rounded shadow-md uppercase">
              HD
            </span>
            <span className="bg-blue-600 text-white text-[8px] sm:text-[10px] font-bold px-1 sm:px-1.5 py-0.5 rounded shadow-md uppercase">
              {movie.name ? 'Series' : 'Vietsub'}
            </span>
          </div>

          {/* Rating Badge */}
          <div className="absolute bottom-1.5 sm:bottom-2 right-1.5 sm:right-2 bg-black/70 text-yellow-500 text-[9px] sm:text-[10px] font-bold px-1 sm:px-1.5 py-0.5 rounded flex items-center space-x-1">
            <FiStar className="fill-current" size={10} sm:size={12} />
            <span>{movie.vote_average ? Number(movie.vote_average).toFixed(1) : '0.0'}</span>
          </div>
        </div>

        {/* Info Area */}
        <div className="p-2 sm:p-3">
          <h3 className="text-[11px] sm:text-sm font-bold dark:text-neutral-200 text-dark line-clamp-1 group-hover:text-primary transition-colors leading-tight">
            {title}
          </h3>
          <p className="text-[9px] sm:text-[11px] dark:text-neutral-500 text-gray-500 mt-1.5 flex justify-between items-center leading-none">
            <span className="truncate">{releaseDate?.split('-')[0] || 'N/A'}</span>
            <span className="dark:text-neutral-400 text-gray-400 flex-shrink-0 ml-2">HD 4K</span>
          </p>
        </div>
      </Link>
    </motion.div>
  );
};

export default memo(MovieCard);
