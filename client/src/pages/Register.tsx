import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FiMail, FiLock, FiUser, FiEye, FiEyeOff, FiAlertCircle, FiArrowRight } from 'react-icons/fi';
import { FaFacebook, FaGoogle, FaApple } from 'react-icons/fa';

const registerSchema = z.object({
  username: z.string().min(3, 'Tên đăng nhập phải có ít nhất 3 ký tự'),
  email: z.string().min(1, 'error_required').email('error_email'),
  password: z.string().min(6, 'error_password_min'),
});

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register: registerUser, t, theme, lang } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    const result = await registerUser(data);
    setLoading(false);

    if (result.success) {
      toast.success(t('reg_success'));
      navigate('/');
    } else {
      toast.error(result.message);
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

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-black">
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1574267432553-4b4628081c31?q=80&w=1931&auto=format&fit=crop" 
          className="w-full h-full object-cover opacity-40 scale-110"
          alt="background"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60" />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-[500px] px-6 py-10 md:px-12 md:py-16 my-10"
      >
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
            <p className="text-neutral-400 text-sm font-medium">{t('register_subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Username Input */}
            <div className="space-y-1">
              <div className="relative group">
                <div className={`absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none transition-colors ${errors.username ? 'text-red-500' : 'text-neutral-500 group-focus-within:text-primary'}`}>
                  <FiUser size={18} />
                </div>
                <input
                  {...register('username')}
                  type="text"
                  placeholder={t('username')}
                  className={`w-full bg-white/5 border rounded-2xl py-4 pl-12 pr-5 text-white outline-none transition-all placeholder:text-neutral-600 ${errors.username ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-primary focus:bg-white/10'}`}
                />
              </div>
              <AnimatePresence>
                {errors.username && (
                  <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-red-500 text-[10px] font-bold uppercase tracking-widest pl-2 flex items-center">
                    <FiAlertCircle className="mr-1" /> {errors.username.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Email Input */}
            <div className="space-y-1">
              <div className="relative group">
                <div className={`absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none transition-colors ${errors.email ? 'text-red-500' : 'text-neutral-500 group-focus-within:text-primary'}`}>
                  <FiMail size={18} />
                </div>
                <input
                  {...register('email')}
                  type="email"
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

            <motion.button
              whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(229,9,20,0.4)" }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-red-700 text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-[0_10px_30px_rgba(229,9,20,0.3)] transition-all flex items-center justify-center space-x-3"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{t('register')}</span>
                  <FiArrowRight size={16} />
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-12 text-center">
            <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">
              {t('have_account')}{' '}
              <Link to="/login" className="text-white hover:text-primary transition-colors ml-2 underline underline-offset-4 decoration-primary/50">
                {t('login')}
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
