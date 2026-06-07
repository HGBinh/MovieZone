import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../services/authService';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMail, FiLock, FiShield, FiArrowLeft, FiCheckCircle } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); 
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { theme, t } = useAuth();
  const navigate = useNavigate();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const trimmedEmail = email.toLowerCase().trim();
    try {
      const data = await authService.checkEmail(trimmedEmail) as any;
      
      if (data.success) {
        setUsername(data.username);
        setGeneratedOtp(data.otp);
        toast.success(t('otp_sent'));
        setStep(2);
      }
    } catch (error: any) {
      console.error('Forgot Password Error:', error);
      const errorMsg = error.response?.data?.message || t('email_not_found');
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.trim() === generatedOtp) {
      setStep(3);
    } else {
      toast.error(t('otp_invalid'));
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const trimmedEmail = email.toLowerCase().trim();
    try {
      const data = await authService.resetPassword(trimmedEmail, newPassword) as any;
      
      if (data.success) {
        toast.success(t('password_reset_success'));
        navigate('/login');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error');
    } finally {
      setLoading(false);
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
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-[450px] px-6 py-10 md:px-12 md:py-16"
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-xl rounded-[2.5rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]" />
        
        <div className="relative z-20">
          <div className="text-center mb-8">
            <Link to="/login" className="inline-flex items-center text-neutral-400 hover:text-primary transition-colors mb-6 text-sm font-bold uppercase tracking-widest">
              <FiArrowLeft className="mr-2" /> {t('back')}
            </Link>
            <h1 className="text-3xl font-black text-white mb-3 tracking-tighter uppercase">
              {step === 1 ? t('forgot_password_title') : step === 2 ? t('enter_otp') : t('reset_password_title')}
            </h1>
            <p className="text-neutral-400 text-sm font-medium">
              {step === 1 ? t('forgot_password_subtitle') : step === 2 ? `${t('otp_sent')}: ${email}` : t('enter_new_password')}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.form 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleSendOtp} 
                className="space-y-5"
              >
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-neutral-500 group-focus-within:text-primary transition-colors">
                    <FiMail size={18} />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('email')}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-5 text-white outline-none focus:border-primary focus:bg-white/10 transition-all placeholder:text-neutral-600"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : t('send_otp')}
                </button>
              </motion.form>
            )}

            {step === 2 && (
              <motion.form 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleVerifyOtp} 
                className="space-y-5"
              >
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-neutral-500 group-focus-within:text-primary transition-colors">
                    <FiShield size={18} />
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder={t('enter_otp')}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-5 text-white outline-none focus:border-primary focus:bg-white/10 transition-all placeholder:text-neutral-600 tracking-[0.5em] text-center font-black"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-primary text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-primary/20 flex items-center justify-center"
                >
                  {t('verify_otp')}
                </button>
                <button 
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full text-neutral-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
                >
                  {t('resend_otp')}
                </button>
              </motion.form>
            )}

            {step === 3 && (
              <motion.form 
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleResetPassword} 
                className="space-y-5"
              >
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-neutral-500 group-focus-within:text-primary transition-colors">
                    <FiLock size={18} />
                  </div>
                  <input
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t('new_password')}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-5 text-white outline-none focus:border-primary focus:bg-white/10 transition-all placeholder:text-neutral-600"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : t('reset_password_btn')}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;