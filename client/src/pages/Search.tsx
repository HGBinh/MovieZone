import { useState, useEffect, useCallback, memo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import movieService from '../services/movieService';
import MovieCard from '../components/movie/MovieCard';
import TrailerModal from '../components/movie/TrailerModal';
import { FiSearch, FiX, FiFilter, FiChevronRight, FiGrid, FiList, FiChevronLeft } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const Search = () => {
  const { theme, lang, t } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [type, setType] = useState(searchParams.get('type') || '');
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isFocused, setIsFocused] = useState(false);

  const [filterGenre, setFilterGenre] = useState('');
  const [filterYear, setFilterYear] = useState('');

  const [selectedTrailer, setSelectedTrailer] = useState<any>(null);

  const genres = [
    { id: '28', name: 'Hành Động' },
    { id: '35', name: 'Hài Hước' },
    { id: '27', name: 'Kinh Dị' },
    { id: '878', name: 'Viễn Tưởng' },
    { id: '18', name: 'Tâm Lý' },
    { id: '16', name: 'Hoạt Hình' },
    { id: '10749', name: 'Lãng Mạn' },
    { id: '9648', name: 'Bí Ẩn' }
  ];
  
  const years = Array.from({ length: 15 }, (_, i) => (2024 - i).toString());

  const fetchMovies = useCallback(async (searchQuery: string, pageNum: number, searchType: string, isLoadMore = false) => {
    setLoading(true);
    try {
      const apiLang = lang === 'vi' ? 'vi-VN' : 'en-US';
      let data;
      
      const params = {
        page: pageNum,
        language: apiLang,
        type: searchType || 'movie'
      };

      if (searchQuery) {
        data = await movieService.searchMovies(searchQuery, pageNum, searchType || 'movie', apiLang);
      } else if (filterGenre || filterYear) {
        data = await movieService.discoverMovies({
          ...params,
          genre: filterGenre,
          year: filterYear
        });
      } else {
        data = await movieService.getPopularMovies(pageNum, apiLang, searchType || 'movie');
      }
      
      const results = data.results || [];

      if (isLoadMore) {
        setMovies(prev => [...prev, ...results]);
      } else {
        setMovies(results);
      }
      const cappedTotalPages = (data.total_pages || 0) > 500 ? 500 : (data.total_pages || 0);
      setTotalPages(cappedTotalPages);
      setPage(pageNum);
    } catch (error) { 
      console.error('Error searching movies:', error);
    } finally {
      setLoading(false);
    }
  }, [filterGenre, filterYear, lang]);

  useEffect(() => {
    const q = searchParams.get('q') || '';
    const t = searchParams.get('type') || '';
    setQuery(q);
    setType(t);
    fetchMovies(q, 1, t);
  }, [searchParams, fetchMovies, lang]);

  useEffect(() => {
    if (!query) {
      fetchMovies('', 1, type);
    }
  }, [filterGenre, filterYear, type]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query && query !== searchParams.get('q')) {
        const newParams: any = { q: query };
        if (type) newParams.type = type;
        setSearchParams(newParams);
      } else if (!query && !type && searchParams.get('q')) {
        setSearchParams({});
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [query, type, setSearchParams, searchParams]);

  const handleLoadMore = () => {
    if (loading || page >= totalPages) return;
    fetchMovies(query, page + 1, type, true);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === page) return;
    fetchMovies(query, newPage, type, false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const maxVisiblePages = 5;
    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex flex-wrap items-center justify-center gap-2 mt-12 sm:mt-16 mb-8 sm:mb-10">
        <button
          onClick={() => handlePageChange(page - 1)}
          disabled={page === 1}
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all ${
            page === 1 
              ? 'opacity-20 cursor-not-allowed' 
              : theme === 'dark' ? 'bg-white/5 hover:bg-primary text-white' : 'bg-gray-100 hover:bg-primary text-dark hover:text-white'
          }`}
        >
          <FiChevronLeft size={18} />
        </button>

        {startPage > 1 && (
          <>
            <button
              onClick={() => handlePageChange(1)}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-[10px] sm:text-xs font-black transition-all ${
                theme === 'dark' ? 'bg-white/5 hover:bg-primary text-white' : 'bg-gray-100 hover:bg-primary text-dark hover:text-white'
              }`}
            >
              1
            </button>
            {startPage > 2 && <span className="text-neutral-500 font-bold px-1 text-xs sm:text-sm">...</span>}
          </>
        )}

        {pages.map((p) => (
          <button
            key={p}
            onClick={() => handlePageChange(p)}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-[10px] sm:text-xs font-black transition-all ${
              page === p
                ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-110'
                : theme === 'dark' ? 'bg-white/5 hover:bg-primary text-white' : 'bg-gray-100 hover:bg-primary text-dark hover:text-white'
            }`}
          >
            {p}
          </button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="text-neutral-500 font-bold px-1 text-xs sm:text-sm">...</span>}
            <button
              onClick={() => handlePageChange(totalPages)}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-[10px] sm:text-xs font-black transition-all ${
                theme === 'dark' ? 'bg-white/5 hover:bg-primary text-white' : 'bg-gray-100 hover:bg-primary text-dark hover:text-white'
              }`}
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          onClick={() => handlePageChange(page + 1)}
          disabled={page === totalPages}
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all ${
            page === totalPages 
              ? 'opacity-20 cursor-not-allowed' 
              : theme === 'dark' ? 'bg-white/5 hover:bg-primary text-white' : 'bg-gray-100 hover:bg-primary text-dark hover:text-white'
          }`}
        >
          <FiChevronRight size={18} />
        </button>
      </div>
    );
  };

  const clearSearch = () => {
    setQuery('');
    setMovies([]);
    setSearchParams({});
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-[#f8f9fa]'} pb-20`}>
      <div className={`py-3 sm:py-4 transition-colors ${theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-white'} border-b ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'} mb-8 sm:mb-12`}>
        <div className="container mx-auto px-4 sm:px-6 md:px-10 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-neutral-500">
            <Link to="/" className="hover:text-primary transition-colors">MovieZone</Link>
            <FiChevronRight size={12} />
            <span className="text-primary">Tìm Kiếm Nâng Cao</span>
          </div>
          <div className="hidden md:flex items-center space-x-4 text-[10px] font-black uppercase tracking-widest text-neutral-500">
            <span>{movies.length} Kết quả</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 md:px-10">
        <div className="max-w-6xl mx-auto mb-12 sm:mb-16 space-y-6 sm:space-y-8">
          <div className="flex-grow max-w-4xl mx-auto w-full relative group">
            <div className="absolute inset-y-0 left-0 pl-4 sm:pl-6 flex items-center pointer-events-none text-primary/50 group-focus-within:text-primary transition-colors">
              <FiSearch size={24} />
            </div>
            <input 
              type="text" 
              placeholder={t('search_home_placeholder')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className={`w-full bg-white/5 border rounded-[1.5rem] sm:rounded-[2rem] py-4 sm:py-6 pl-12 sm:pl-16 pr-12 sm:pr-16 text-base sm:text-xl outline-none transition-all duration-500 font-medium ${isFocused ? 'bg-white/10 border-primary shadow-[0_0_40px_rgba(229,9,20,0.2)]' : 'border-white/10'}`}
            />
            {query && (
              <button onClick={clearSearch} className="absolute inset-y-0 right-0 pr-4 sm:pr-6 flex items-center text-neutral-500 hover:text-white transition-colors">
                <FiX size={24} />
              </button>
            )}
          </div>

          {/* Advanced Filters Bar */}
          <div className={`p-4 sm:p-6 md:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] border flex flex-wrap items-center gap-4 sm:gap-8 transition-all duration-300 ${theme === 'dark' ? 'bg-white/5 border-white/10 shadow-2xl backdrop-blur-md' : 'bg-white border-gray-100 shadow-xl'}`}>
            <div className="flex items-center space-x-2 sm:space-x-3 text-primary border-r border-white/10 pr-4 sm:pr-6">
              <FiFilter size={20} />
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em]">Bộ lọc:</span>
            </div>
            <select value={filterGenre} onChange={(e) => setFilterGenre(e.target.value)} className={`bg-transparent text-[10px] sm:text-[11px] font-black uppercase outline-none cursor-pointer hover:text-primary transition-colors appearance-none ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'}`}>
              <option value="" className="bg-dark text-white">Tất cả thể loại</option>
              {genres.map(g => <option key={g.id} value={g.id} className="bg-dark text-white">{g.name}</option>)}
            </select>
            <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className={`bg-transparent text-[10px] sm:text-[11px] font-black uppercase outline-none cursor-pointer hover:text-primary transition-colors appearance-none ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'}`}>
              <option value="" className="bg-dark text-white">Năm phát hành</option>
              {years.map(y => <option key={y} value={y} className="bg-dark text-white">{y}</option>)}
            </select>
            <div className="ml-auto flex items-center space-x-4 sm:space-x-6 border-l border-white/10 pl-4 sm:pl-8">
              <button className="text-primary hover:scale-110 transition-transform"><FiGrid size={24} /></button>
              <button className="text-neutral-600 hover:text-white transition-all"><FiList size={24} /></button>
            </div>
          </div>
        </div>

        {loading && page === 1 ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-6">
            <div className="w-16 h-16 border-4 border-primary/10 border-t-primary rounded-full animate-spin"></div>
            <p className="text-primary font-black uppercase tracking-[0.3em] text-[10px]">Đang tìm kiếm dữ liệu...</p>
          </div>
        ) : (
          <>
            {movies.length > 0 && (
              <div className="mb-8 sm:mb-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <h2 className={`text-lg sm:text-2xl font-black uppercase tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-dark'}`}>
                  {query ? (
                    <>Kết quả tìm kiếm cho: <span className="text-primary">"{query}"</span></>
                  ) : type === 'movie' ? (
                    <><span className="text-primary">Phim Lẻ</span> Phổ Biến</>
                  ) : type === 'tv' ? (
                    <><span className="text-primary">Phim Bộ</span> Đang Hot</>
                  ) : (
                    "Khám Phá Phim"
                  )}
                </h2>
                <div className="px-3 py-1 sm:px-4 sm:py-1 bg-primary/10 rounded-full text-primary text-[9px] sm:text-[10px] font-black uppercase">{movies.length} Phim</div>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
              <AnimatePresence mode="popLayout">
                {movies.map((movie, index) => (
                  <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: (index % 12) * 0.05 }} key={`${movie.id}-${index}`}>
                    <MovieCard 
                      movie={movie} 
                      onTrailerClick={(m) => setSelectedTrailer(m)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {movies.length === 0 && query && !loading && (
              <div className="text-center py-24 sm:py-40 max-w-xl mx-auto space-y-4 sm:space-y-6">
                <div className="w-16 h-16 sm:w-24 sm:h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary"><FiSearch size={40} /></div>
                <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tighter text-white">Không tìm thấy phim</h3>
                <p className="text-sm sm:text-base text-neutral-500 font-medium px-4">Chúng tôi không tìm thấy kết quả nào phù hợp với "{query}". Vui lòng thử từ khóa khác hoặc sử dụng bộ lọc.</p>
              </div>
            )}

            {renderPagination()}
          </>
        )}
      </div>

      {selectedTrailer && (
        <TrailerModal 
          movieId={selectedTrailer.id} 
          mediaType={selectedTrailer.media_type || (selectedTrailer.name ? 'tv' : 'movie')}
          onClose={() => setSelectedTrailer(null)}
        />
      )}
    </div>
  );
};

export default Search;
