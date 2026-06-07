import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiLogOut, FiX, FiSearch, FiSun, FiMoon, FiUser, FiHeart } from 'react-icons/fi';

const MobileMenu = ({
  isOpen,
  onClose,
  theme,
  toggleTheme,
  toggleLang,
  lang,
  t,
  user,
  navLinks,
  location,
  searchQuery,
  setSearchQuery,
  handleSearchSubmit,
  handleLogout,
}) => {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[99998]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'tween', duration: 0.25 }}
            className="lg:hidden fixed inset-y-0 right-0 w-full max-w-[min(100vw,28rem)] bg-white dark:bg-dark z-[99999] overflow-y-auto overscroll-contain transition-colors shadow-2xl"
          >
            <div className="sticky top-0 bg-white dark:bg-dark border-b border-gray-100 dark:border-white/5 p-4 z-10">
              <div className="flex justify-between items-center">
                <span className="text-2xl font-black text-primary">MOVIEZONE</span>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className={`p-2 rounded-full icon-btn no-min-h ${theme === 'dark' ? 'bg-white/5 text-yellow-500' : 'bg-gray-100 text-blue-600'}`}
                  >
                    {theme === 'dark' ? <FiSun size={20} /> : <FiMoon size={20} />}
                  </button>
                  <button type="button" onClick={onClose} className="text-dark dark:text-white p-2 icon-btn no-min-h">
                    <FiX size={24} />
                  </button>
                </div>
              </div>
              <form onSubmit={handleSearchSubmit} className="mt-4 relative">
                <input
                  type="text"
                  placeholder={t('search_placeholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary transition-all ${theme === 'dark' ? 'text-white' : 'text-dark'}`}
                />
                <FiSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
              </form>
            </div>

            <div className="p-4 space-y-4 pb-8">
              {navLinks.map((link) => (
                <div key={link.name}>
                  {link.type === 'dropdown' ? (
                    <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">{link.name}</p>
                      <div className="grid grid-cols-2 gap-3">
                        {link.items.map((item) => (
                          <Link
                            key={item}
                            to={`/search?q=${item}`}
                            onClick={onClose}
                            className="text-sm font-bold text-neutral-600 dark:text-neutral-300 py-2 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                          >
                            {item}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : (
                    (!link.protected || user) && (
                      <Link
                        to={link.path}
                        onClick={onClose}
                        className={`text-lg font-bold block py-3 px-4 rounded-xl transition-colors ${location.pathname === link.path ? 'bg-primary text-white' : 'text-dark dark:text-white hover:bg-gray-100 dark:hover:bg-white/5'}`}
                      >
                        {link.name}
                      </Link>
                    )
                  )}
                </div>
              ))}
              <div className="h-[1px] w-full bg-gray-200 dark:bg-white/5 my-4" />

              <button
                type="button"
                onClick={toggleLang}
                className={`flex items-center justify-center space-x-2 w-full py-3 px-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all ${theme === 'dark' ? 'bg-white/5 text-neutral-400 hover:bg-white/10' : 'bg-gray-100 text-neutral-600 hover:bg-gray-200'}`}
              >
                <span>{lang === 'vi' ? '🇻🇳 Tiếng Việt' : '🇺🇸 English'}</span>
              </button>

              {user ? (
                <>
                  <Link
                    to="/profile"
                    onClick={onClose}
                    className={`flex items-center space-x-3 py-3 px-4 rounded-xl font-bold transition-colors ${theme === 'dark' ? 'text-white hover:bg-white/5' : 'text-dark hover:bg-gray-100'}`}
                  >
                    <FiUser className="text-primary" />
                    <span>{t('profile')}</span>
                  </Link>
                  <Link
                    to="/favorites"
                    onClick={onClose}
                    className={`flex items-center space-x-3 py-3 px-4 rounded-xl font-bold transition-colors ${theme === 'dark' ? 'text-white hover:bg-white/5' : 'text-dark hover:bg-gray-100'}`}
                  >
                    <FiHeart className="text-primary" />
                    <span>{t('favorites')}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center space-x-2.5 py-3.5 px-4 rounded-xl font-black text-sm uppercase tracking-widest bg-primary text-white hover:bg-red-700 active:scale-[0.98] transition-all shadow-lg shadow-primary/25"
                  >
                    <FiLogOut size={18} />
                    <span>{t('logout')}</span>
                  </button>
                </>
              ) : (
                <div className="space-y-3">
                  <Link
                    to="/login"
                    onClick={onClose}
                    className={`block text-center py-3 px-4 rounded-xl font-bold transition-colors ${theme === 'dark' ? 'text-white hover:bg-white/5' : 'text-dark hover:bg-gray-100'}`}
                  >
                    {t('login')}
                  </Link>
                  <Link
                    to="/register"
                    onClick={onClose}
                    className="block text-center bg-primary text-white py-3 px-4 rounded-xl font-bold hover:bg-red-700 transition-colors"
                  >
                    {t('register')}
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default MobileMenu;
