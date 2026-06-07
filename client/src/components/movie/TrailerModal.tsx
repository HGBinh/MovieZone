import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import { useEffect, useState } from 'react';
import movieService from '../../services/movieService';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';

interface TrailerModalProps {
  movieId: string | number;
  mediaType?: string;
  onClose: () => void;
}

const TrailerModal = ({ movieId, mediaType, onClose }: TrailerModalProps) => {
  const { i18n } = useTranslation();
  const { setIsModalOpen } = useAuth();
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.classList.add('trailer-modal-open');
    setIsModalOpen(true);
    return () => {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('trailer-modal-open');
      setIsModalOpen(false);
    };
  }, [setIsModalOpen]);

  useEffect(() => {
    const fetchTrailer = async () => {
      try {
        setLoading(true);
        const lang = i18n.language === 'vi' ? 'vi-VN' : 'en-US';
        const type = mediaType === 'tv' ? 'tv' : 'movie';

        const data = await movieService.getMovieDetails(movieId, lang, type);

        const videos = data.videos?.results || [];

        if (videos.length > 0) {
          const trailer =
            videos.find(v => v.type === 'Trailer' && v.site === 'YouTube') ||
            videos.find(v => v.type === 'Teaser' && v.site === 'YouTube') ||
            videos.find(v => v.type === 'Clip' && v.site === 'YouTube') ||
            videos.find(v => v.site === 'YouTube');

          if (trailer) {
            setTrailerKey(trailer.key);
          }
        }
      } catch (error) {
        console.error('Error fetching trailer:', error);
      } finally {
        setLoading(false);
      }
    };

    if (movieId) {
      fetchTrailer();
    }
  }, [movieId, mediaType, i18n.language]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-5xl aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-10 p-3 bg-white/10 hover:bg-primary text-white rounded-full transition-all hover:scale-110 active:scale-90"
          >
            <FiX size={24} />
          </button>

          {loading ? (
            <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              <p className="text-primary font-black uppercase tracking-[0.2em] text-[10px]">Đang tải trailer...</p>
            </div>
          ) : trailerKey ? (
            <iframe
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
              title="YouTube trailer"
              className="w-full h-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen; compute-pressure"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center space-y-4 text-neutral-500">
              <p className="font-black uppercase tracking-widest text-sm">Rất tiếc, không tìm thấy trailer cho phim này</p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TrailerModal;
