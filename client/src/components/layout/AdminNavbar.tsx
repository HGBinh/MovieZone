import { Link, useNavigate } from 'react-router-dom';
import { FiLogOut, FiExternalLink, FiSun, FiMoon, FiShield } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../common/Avatar';
import { toast } from 'react-toastify';

const AdminNavbar = () => {
  const { user, logout, theme, lang, toggleTheme, toggleLang, t } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.info(t('logout_admin_success'));
  };

  const iconBtn =
    'icon-btn no-min-h w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all shrink-0';

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
        theme === 'dark' ? 'bg-black/80 border-white/10' : 'bg-white/80 border-gray-100'
      } backdrop-blur-xl`}
    >
      <div className="container mx-auto px-3 sm:px-4 md:px-10 h-14 sm:h-16 md:h-20 flex items-center gap-2 sm:gap-3 overflow-hidden">
        {/* Logo — không chiếm flex-1 để tránh đè lên nút bên phải */}
        <Link
          to="/admin"
          className="flex items-center gap-1.5 sm:gap-2 min-w-0 shrink max-w-[42%] sm:max-w-[50%] md:max-w-none"
        >
          <FiShield className="text-primary shrink-0" size={20} />
          <span className="text-xs sm:text-sm md:text-xl font-black tracking-tighter uppercase truncate">
            Admin<span className="text-primary">Zone</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shrink-0">
          <span className="relative flex h-2 w-2 mr-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>
          {t('system_online')}
        </div>

        {/* Actions — luôn nằm bên phải, không shrink */}
        <div className="flex items-center gap-1 sm:gap-1.5 ml-auto shrink-0 flex-nowrap">
          <button
            type="button"
            onClick={toggleLang}
            aria-label={lang === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
            className={`${iconBtn} text-[9px] sm:text-[10px] font-black uppercase ${
              theme === 'dark'
                ? 'bg-white/5 text-neutral-300 hover:bg-white/10'
                : 'bg-gray-100 text-neutral-600 hover:bg-gray-200'
            }`}
          >
            {lang === 'vi' ? 'VI' : 'EN'}
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            className={`${iconBtn} ${
              theme === 'dark'
                ? 'bg-white/5 text-yellow-500 hover:bg-white/10'
                : 'bg-gray-100 text-blue-600 hover:bg-gray-200'
            }`}
          >
            {theme === 'dark' ? <FiSun size={17} /> : <FiMoon size={17} />}
          </button>

          <div
            className={`flex items-center gap-1.5 sm:gap-2 pl-1 sm:pl-2 border-l shrink-0 ${
              theme === 'dark' ? 'border-white/10' : 'border-gray-200'
            }`}
          >
            <Avatar src={user?.avatar} size={32} className="border-2 border-primary shrink-0" />
            <div className="hidden min-[420px]:flex min-w-0 max-w-[5.5rem] sm:max-w-[8rem] md:max-w-[10rem] lg:max-w-none flex-col leading-tight">
              <p
                className={`text-[9px] sm:text-[10px] font-black uppercase tracking-wide truncate ${
                  theme === 'dark' ? 'text-white' : 'text-dark'
                }`}
                title={user?.username}
              >
                {user?.username}
              </p>
              <p className="text-[8px] sm:text-[9px] font-bold text-primary uppercase tracking-tighter truncate">
                {t('admin_role')}
              </p>
            </div>
          </div>

          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className={`${iconBtn} ${
              theme === 'dark'
                ? 'bg-white/5 border border-white/10 text-neutral-400 hover:bg-white/10 hover:text-white'
                : 'bg-gray-100 border border-gray-200 text-neutral-600 hover:bg-gray-200'
            }`}
            title={t('preview_site')}
          >
            <FiExternalLink size={16} />
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className={`${iconBtn} bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white`}
            title={t('logout')}
          >
            <FiLogOut size={16} />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;
