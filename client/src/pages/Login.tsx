import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle, FiArrowRight, FiShield, FiUser } from 'react-icons/fi';

const loginSchema = z.object({
  email: z.string().min(1, 'error_required').email('error_email'),
  password: z.string().min(6, 'error_password_min'),
});

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showGateway, setShowGateway] = useState(false);
  const { login, t, theme, lang } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    const result = await login(data);
    setLoading(false);

    if (result.success) {
      toast.success(t('welcome_back'));
      const storedUser = JSON.parse(localStorage.getItem('moviezone_user') || 'null');
      if (storedUser?.role === 'admin') {
        setShowGateway(true);
      } else {
        navigate('/');
      }
    } else {
      toast.error(result.message === 'Invalid credentials' ? t('invalid_credentials') : result.message);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  const gatewayVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-black">
      {/* Cinematic Background */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1574267432553-4b4628081c31?q=80&w=1931&auto=format&fit=crop" 
          className="w-full h-full object-cover opacity-40 scale-110"
          alt="background"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60" />
      </div>

      <AnimatePresence mode="wait">
        {!showGateway ? (
          <motion.div
            key="login-form"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative z-10 w-full max-w-[450px] px-6 py-10 md:px-12 md:py-16"
          >
            {/* Glassmorphism Card */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-xl rounded-[2.5rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]" />
            
            <div className="relative z-20">
              <div className="text-center mb-10">
                <motion.h1 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-4xl font-black text-white mb-3 tracking-tighter"
                >
                  MOVIE<span className="text-primary">ZONE</span>
                </motion.h1>
                <p className="text-neutral-400 text-sm font-medium">{t('login_subtitle')}</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Email Input */}
                <div className="space-y-1">
                  <div className="relative group">
                    <div className={`absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none transition-colors ${errors.email ? 'text-red-500' : 'text-neutral-500 group-focus-within:text-primary'}`}>
                      <FiMail size={18} />
                    </div>
                    <input
                      {...register('email')}
                      type="email"
                      autoComplete="email"
                      placeholder={t('email')}
                      className={`w-full bg-white/5 border rounded-2xl py-4 pl-12 pr-5 text-white outline-none transition-all placeholder:text-neutral-600 ${errors.email ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-primary focus:bg-white/10'}`}
                    />
                  </div>
                  <AnimatePresence>
                    {errors.email && (
                      <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-red-500 text-[10px] font-bold uppercase tracking-widest pl-2 flex items-center">
                        <FiAlertCircle className="mr-1" /> {t(errors.email?.message || '')}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Password Input */}
                <div className="space-y-1">
                  <div className="relative group">
                    <div className={`absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none transition-colors ${errors.password ? 'text-red-500' : 'text-neutral-500 group-focus-within:text-primary'}`}>
                      <FiLock size={18} />
                    </div>
                    <input
                      {...register('password')}
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder={t('password')}
                      className={`w-full bg-white/5 border rounded-2xl py-4 pl-12 pr-12 text-white outline-none transition-all placeholder:text-neutral-600 ${errors.password ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-primary focus:bg-white/10'}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-5 flex items-center text-neutral-500 hover:text-white transition-colors"
                    >
                      {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                    </button>
                  </div>
                  <AnimatePresence>
                    {errors.password && (
                      <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-red-500 text-[10px] font-bold uppercase tracking-widest pl-2 flex items-center">
                        <FiAlertCircle className="mr-1" /> {t(errors.password?.message || '')}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex items-center justify-between px-2">
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <div className="relative w-5 h-5">
                      <input type="checkbox" className="peer hidden" />
                      <div className="absolute inset-0 bg-white/5 border border-white/10 rounded-md peer-checked:bg-primary peer-checked:border-primary transition-all" />
                      <svg className="absolute inset-0 w-5 h-5 text-white scale-0 peer-checked:scale-100 transition-transform p-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-xs font-bold text-neutral-400 group-hover:text-neutral-200 transition-colors uppercase tracking-widest">{t('remember_me')}</span>
                  </label>
                  <Link to="/forgot-password" className="text-xs font-bold text-neutral-500 hover:text-primary transition-colors uppercase tracking-widest">
                    {t('forgot_password')}
                  </Link>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-primary to-red-700 text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-[0_10px_30px_rgba(229,9,20,0.3)] hover:shadow-[0_15px_40px_rgba(229,9,20,0.4)] transition-all flex items-center justify-center space-x-3"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{t('login')}</span>
                      <FiArrowRight size={16} />
                    </>
                  )}
                </motion.button>
              </form>

              <div className="mt-12 text-center">
                <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">
                  {t('no_account')}{' '}
                  <Link to="/register" className="text-white hover:text-primary transition-colors ml-2 underline underline-offset-4 decoration-primary/50">
                    {t('register')}
                  </Link>
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="admin-gateway"
            variants={gatewayVariants}
            initial="hidden"
            animate="visible"
            className="relative z-10 w-full max-w-[600px] px-6"
          >
            <div className="bg-black/40 backdrop-blur-2xl rounded-[3rem] border border-white/10 p-10 md:p-16 text-center shadow-2xl">
              <div className="w-20 h-20 bg-primary/20 rounded-3xl flex items-center justify-center mx-auto mb-8">
                <FiShield className="text-primary" size={40} />
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tighter uppercase">
                {t('welcome_admin')}
              </h2>
              <p className="text-neutral-400 mb-12 font-medium">
                {t('choose_env')}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                  onClick={() => navigate('/admin')}
                  className="group relative p-8 rounded-3xl bg-primary hover:bg-red-700 transition-all text-left overflow-hidden shadow-xl shadow-primary/20"
                >
                  <div className="relative z-10">
                    <FiShield className="text-white/80 mb-4" size={24} />
                    <h4 className="text-white font-black uppercase tracking-widest text-sm mb-2">
                      {t('admin_dashboard_btn')}
                    </h4>
                    <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                      {t('manage_movies_desc')}
                    </p>
                  </div>
                  <div className="absolute right-[-20px] bottom-[-20px] opacity-10 group-hover:scale-110 transition-transform duration-500">
                    <FiShield size={120} />
                  </div>
                </button>

                <button
                  onClick={() => navigate('/')}
                  className="group relative p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-left overflow-hidden"
                >
                  <div className="relative z-10">
                    <FiUser className="text-neutral-400 mb-4" size={24} />
                    <h4 className="text-white font-black uppercase tracking-widest text-sm mb-2">
                      {t('user_page_btn')}
                    </h4>
                    <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                      {t('user_exp_desc')}
                    </p>
                  </div>
                  <div className="absolute right-[-20px] bottom-[-20px] opacity-5 group-hover:scale-110 transition-transform duration-500 text-white">
                    <FiUser size={120} />
                  </div>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Login;
