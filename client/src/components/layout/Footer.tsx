import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiMail, FiFacebook, FiTwitter, FiInstagram, FiYoutube } from 'react-icons/fi';

const Footer = () => {
  const { theme, t, lang } = useAuth();

  return (
    <footer className={`transition-colors duration-300 border-t ${theme === 'dark' ? 'bg-[#0a0a0a] border-white/5' : 'bg-white border-gray-100'}`}>
      <div className="container mx-auto px-4 sm:px-6 md:px-10 py-12 sm:py-16 md:py-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12 lg:gap-20">
          
          {/* Brand Section */}
          <div className="space-y-6 sm:space-y-8">
            <Link to="/" className="flex items-center">
              <span className="text-2xl sm:text-3xl font-black text-primary tracking-tighter">MOVIE<span className={theme === 'dark' ? 'text-white' : 'text-dark'}>ZONE</span></span>
            </Link>
            <p className="text-neutral-500 text-xs sm:text-sm font-medium leading-relaxed max-w-xs">
              {t('footer_desc')}
            </p>
            <div className="flex items-center space-x-3 sm:space-x-4">
              {[FiFacebook, FiTwitter, FiInstagram, FiYoutube].map((Icon, i) => (
                <a key={i} href="#" className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all ${theme === 'dark' ? 'bg-white/5 text-neutral-400 hover:bg-primary hover:text-white' : 'bg-gray-100 text-neutral-600 hover:bg-primary hover:text-white'}`}>
                  <Icon size={16} sm:size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Explore Links */}
          <div className="space-y-6 sm:space-y-8">
            <h4 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-primary">{t('explore')}</h4>
            <ul className="space-y-3 sm:space-y-4">
              {[t('movies'), t('series'), t('actors'), t('awards')].map(item => (
                <li key={item}>
                  <Link to="/search" className="text-neutral-500 hover:text-primary transition-colors text-xs sm:text-sm font-bold uppercase tracking-widest">{item}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div className="space-y-6 sm:space-y-8">
            <h4 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-primary">{t('support')}</h4>
            <ul className="space-y-3 sm:space-y-4">
              {[t('help_center'), t('terms'), t('privacy'), t('content_policy')].map(item => (
                <li key={item}>
                  <button 
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="text-neutral-500 hover:text-primary transition-colors text-xs sm:text-sm font-bold uppercase tracking-widest"
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-6 sm:space-y-8">
            <h4 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-primary">{t('newsletter')}</h4>
            <p className="text-neutral-500 text-xs sm:text-sm font-medium">{t('newsletter_desc')}</p>
            <form className="relative group">
              <input 
                type="email" 
                placeholder={t('email_addr')}
                className={`w-full p-3 sm:p-4 pr-24 sm:pr-32 rounded-xl sm:rounded-2xl border outline-none transition-all ${theme === 'dark' ? 'bg-black/40 border-white/10 text-white focus:border-primary placeholder:text-neutral-700' : 'bg-gray-50 border-gray-200 text-dark focus:border-primary placeholder:text-gray-400'}`}
              />
              <button className="absolute right-2 top-2 bottom-2 bg-primary text-white px-4 sm:px-6 rounded-xl font-black uppercase tracking-widest text-[9px] sm:text-[10px] hover:bg-red-700 transition-all shadow-lg shadow-primary/20">
                {t('join')}
              </button>
            </form>
          </div>

        </div>

        <div className={`mt-12 sm:mt-20 pt-8 sm:pt-10 border-t flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}`}>
          <p className="text-neutral-600 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-center sm:text-left">
            © 2026 MOVIEZONE. ALL RIGHTS RESERVED.
          </p>
          <div className="flex items-center space-x-4 sm:space-x-8 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-neutral-600">
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-primary transition-colors">Sitemap</button>
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-primary transition-colors">Cookies</button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;