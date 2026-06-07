import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiLogOut, FiMenu, FiX, FiSearch, FiChevronDown, FiSun, FiMoon, FiUser, FiHeart } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import Avatar from '../common/Avatar';
import MobileMenu from './MobileMenu';

const Navbar = () => {
  const { user, logout, theme, toggleTheme, lang, toggleLang, t, isModalOpen } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isModalOpen) {
      setIsMobileMenuOpen(false);
    }
  }, [isModalOpen]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isMobileMenuOpen]);

  // Search Suggestions Logic
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.length > 1) {
        try {
          const res = await axios.get(`http://localhost:5000/api/movies/search?query=${searchQuery}`);
          setSuggestions(res.data.results.slice(0, 5));
        } catch (error) {
          console.error(error);
        }
      } else {
        setSuggestions([]);
      }
    };

    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleLogout = () => {
    setIsMobileMenuOpen(false);
    logout();
    navigate('/login');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${searchQuery}`);
      setSuggestions([]);
      setSearchQuery('');
    }
  };

  const genres = lang === 'vi' ? ['Hành Động', 'Cổ Trang', 'Chiến Tranh', 'Viễn Tưởng', 'Kinh Dị', 'Hài Hước', 'Hoạt Hình', 'Tâm Lý'] : ['Action', 'Historical', 'War', 'Sci-Fi', 'Horror', 'Comedy', 'Animation', 'Drama'];
  const countries = lang === 'vi' ? ['Trung Quốc', 'Hàn Quốc', 'Nhật Bản', 'Mỹ', 'Thái Lan', 'Âu Mỹ'] : ['China', 'Korea', 'Japan', 'USA', 'Thailand', 'Western'];

  const navLinks = [
    { name: t('home'), path: '/' },
    { name: t('genres'), type: 'dropdown', items: genres },
    { name: t('countries'), type: 'dropdown', items: countries },
    { name: t('movies'), path: `/search?q=${t('movies')}&type=movie` },
    { name: t('series'), path: `/search?q=${t('series')}&type=tv` },
    { name: t('favorites'), path: '/favorites', protected: true },
  ];

  return (
    <nav className={`fixed top-0 w-full z-[9999] isolation: isolate transition-all duration-500 ${isScrolled ? 'py-2 bg-white dark:bg-black border-b border-white/5 shadow-2xl' : 'py-4 bg-gradient-to-b from-black/60 via-black/30 to-transparent'}`}>
      <div className="container mx-auto px-4 md:px-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6 xl:gap-10 flex-shrink-0">
          <Link to="/" className="flex items-center flex-shrink-0 group">
            <span className="text-2xl md:text-3xl font-black text-primary tracking-tighter">MOVIE<span className={theme === 'dark' || !isScrolled ? 'text-white' : 'text-dark'}>ZONE</span></span>
          </Link>

          <div className="hidden lg:flex items-center gap-4 xl:gap-8">
            {navLinks.map((link) => (
              (!link.protected || user) && (
                <div key={link.name} className="relative group" onMouseEnter={() => link.type === 'dropdown' && setActiveDropdown(link.name)} onMouseLeave={() => setActiveDropdown(null)}>
                  {link.type === 'dropdown' ? (
                    <button className={`flex items-center space-x-1 text-xs xl:text-[13px] font-black uppercase tracking-widest transition-colors py-2 whitespace-nowrap ${theme === 'dark' || !isScrolled ? 'text-neutral-300 hover:text-primary' : 'text-neutral-600 hover:text-primary'}`}>
                      <span>{link.name}</span>
                      <FiChevronDown className={`transition-transform duration-300 ${activeDropdown === link.name ? 'rotate-180' : ''}`} size={14} />
                    </button>
                  ) : (
                    <Link to={link.path} className={`text-xs xl:text-[13px] font-black uppercase tracking-widest transition-colors py-2 whitespace-nowrap ${location.pathname === link.path ? 'text-primary' : theme === 'dark' || !isScrolled ? 'text-neutral-300 hover:text-primary' : 'text-neutral-600 hover:text-primary'}`}>{link.name}</Link>
                  )}
                  {link.type === 'dropdown' && (
                    <AnimatePresence>
                      {activeDropdown === link.name && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className={`absolute top-full left-0 w-64 p-4 grid grid-cols-2 gap-2 rounded-2xl shadow-2xl border ${theme === 'dark' ? 'bg-neutral-950 border-white/10' : 'bg-white border-gray-100'}`}>
                          {link.items.map(item => (
                            <Link key={item} to={`/search?q=${item}`} className={`text-[11px] font-black uppercase tracking-widest px-3 py-2 rounded-lg transition-all ${theme === 'dark' ? 'text-neutral-400 hover:text-primary hover:bg-white/5' : 'text-neutral-600 hover:text-primary hover:bg-gray-50'}`}>{item}</Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}
                </div>
              )
            ))}
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-3 xl:gap-5 flex-shrink-0">
          <form onSubmit={handleSearchSubmit} className="relative group">
            <input 
              type="text" 
              placeholder={t('search_placeholder')} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`bg-white/5 border border-white/10 rounded-full py-2 px-5 text-xs w-32 xl:w-48 focus:w-48 xl:focus:w-64 focus:outline-none focus:border-primary transition-all placeholder:text-neutral-500 font-bold ${theme === 'dark' || !isScrolled ? 'text-white' : 'text-dark bg-gray-100'}`}
            />
            <FiSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500" size={14} />
            
            {/* Suggestions Dropdown */}
            <AnimatePresence>
              {suggestions.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-full mt-2 left-0 w-full bg-white dark:bg-neutral-900 border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden">
                  {suggestions.map(movie => (
                    <Link key={movie.id} to={`/movie/${movie.id}`} onClick={() => setSuggestions([])} className="flex items-center space-x-3 p-3 hover:bg-primary/10 transition-colors">
                      <img src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`} className="w-8 h-12 object-cover rounded" alt={movie.title} />
                      <div className="flex-grow">
                        <p className="text-xs font-bold text-dark dark:text-white line-clamp-1">{movie.title}</p>
                        <p className="text-[10px] text-neutral-500">{movie.release_date?.split('-')[0]}</p>
                      </div>
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          <button onClick={toggleTheme} className={`p-2 rounded-full transition-all flex-shrink-0 ${theme === 'dark' ? 'bg-white/5 text-yellow-500 hover:bg-white/10' : 'bg-gray-100 text-blue-600 hover:bg-gray-200'}`}>
            {theme === 'dark' ? <FiSun size={16} /> : <FiMoon size={16} />}
          </button>

          <button onClick={toggleLang} className={`flex items-center space-x-1 px-2 xl:px-3 py-1.5 rounded-xl transition-all font-black text-[9px] xl:text-[10px] uppercase tracking-widest whitespace-nowrap flex-shrink-0 ${theme === 'dark' ? 'bg-white/5 text-neutral-400 hover:text-white' : 'bg-gray-100 text-neutral-500 hover:text-dark'}`}>
            <span>{lang === 'vi' ? '🇻🇳 VI' : '🇺🇸 EN'}</span>
          </button>
          
          {user ? (
            <div className="flex items-center flex-shrink-0">
              <div className="relative group">
                <Link to="/profile" className="flex items-center space-x-3 group/user">
                  <div className="relative flex-shrink-0">
                    <Avatar 
                      src={user.avatar} 
                      alt={user.username}
                      size={36}
                      className="border-2 border-primary/50 group-hover/user:border-primary transition-all shadow-lg" 
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-dark rounded-full shadow-sm"></div>
                  </div>
                  <div className="hidden xl:flex flex-col items-start -space-y-0.5">
                    <p className={`text-[9px] font-black uppercase tracking-[0.2em] transition-colors whitespace-nowrap ${theme === 'dark' || !isScrolled ? 'text-neutral-400' : 'text-neutral-500'}`}>{t('welcome')}</p>
                    <p className={`text-[12px] font-black tracking-tight transition-colors whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px] ${theme === 'dark' || !isScrolled ? 'text-white' : 'text-dark'}`}>{user.username}</p>
                  </div>
                </Link>
                
                {/* Simple Hover Dropdown for smoothness - Removed mt-4 to close gap */}
                <div className="absolute top-full right-0 mt-0 pt-2 w-48 bg-transparent opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300 z-50">
                  <div className={`rounded-2xl shadow-2xl py-2 border transition-all ${theme === 'dark' ? 'bg-neutral-900 border-white/5' : 'bg-white border-gray-100'}`}>
                    <Link to="/profile" className={`flex items-center space-x-3 px-4 py-3 text-xs font-bold transition-all ${theme === 'dark' ? 'hover:bg-white/5 text-white' : 'hover:bg-gray-50 text-dark'}`}><FiUser className="text-primary" /><span>{t('profile')}</span></Link>
                    <Link to="/favorites" className={`flex items-center space-x-3 px-4 py-3 text-xs font-bold transition-all ${theme === 'dark' ? 'hover:bg-white/5 text-white' : 'hover:bg-gray-50 text-dark'}`}><FiHeart className="text-primary" /><span>{t('favorites')}</span></Link>
                    <div className={`h-[1px] my-1 mx-4 ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}></div>
                    <button onClick={handleLogout} className="mx-2 mb-2 w-[calc(100%-1rem)] flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-primary text-white hover:bg-red-700 active:scale-[0.98] transition-all shadow-md shadow-primary/20"><FiLogOut size={14} /><span>{t('logout')}</span></button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Link to="/login" className={`text-xs font-bold ${theme === 'dark' ? 'text-neutral-300' : 'text-neutral-600'} hover:text-primary`}>{t('login')}</Link>
              <Link to="/register" className="bg-primary text-white px-5 py-2 rounded-lg text-xs font-bold hover:bg-red-700 transition-all">{t('register')}</Link>
            </div>
          )}
        </div>

        {!isModalOpen && (
          <button
            type="button"
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            className="lg:hidden text-dark dark:text-white p-2 icon-btn no-min-h"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        )}
      </div>
      
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        theme={theme}
        toggleTheme={toggleTheme}
        toggleLang={toggleLang}
        lang={lang}
        t={t}
        user={user}
        navLinks={navLinks}
        location={location}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleSearchSubmit={handleSearchSubmit}
        handleLogout={handleLogout}
      />
    </nav>
  );
};

export default Navbar;
