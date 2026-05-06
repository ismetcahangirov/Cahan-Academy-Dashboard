import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Loader2, CheckCircle2, ShieldQuestion, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const ForgotPassword = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/forgot-password`, { email });
      setIsSent(true);
      toast.success(t('auth.resetEmailSent'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('auth.errorOccurred'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 md:p-8 font-sans selection:bg-bordo selection:text-white">
      {/* Background Decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-bordo/5 rounded-full blur-[120px]"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[460px] relative z-10"
      >
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-[40px] p-8 md:p-12 shadow-2xl shadow-black/5 backdrop-blur-sm">
          <div className="mb-10 text-center">
            <div className="w-20 h-20 bg-bordo/5 rounded-[28px] border border-bordo/10 flex items-center justify-center mx-auto mb-8 relative">
              <div className="absolute inset-0 bg-bordo/5 rounded-[28px] animate-ping opacity-20"></div>
              {isSent ? (
                <CheckCircle2 size={36} className="text-emerald-500 relative z-10" />
              ) : (
                <ShieldQuestion size={36} className="text-bordo relative z-10" />
              )}
            </div>
            
            <h1 className="text-3xl font-black text-[var(--foreground)] tracking-tight mb-4">
              {isSent ? t('auth.checkEmailTitle') : t('auth.forgotPasswordTitle')}
            </h1>
            <p className="text-[var(--muted-foreground)]/60 text-sm leading-relaxed max-w-[300px] mx-auto font-medium">
              {isSent ? t('auth.checkEmailSubtitle', { email }) : t('auth.forgotPasswordSubtitle')}
            </p>
          </div>

          {!isSent ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-[var(--muted-foreground)]/80 ml-1">
                  {t('auth.emailAddress')}
                </label>
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]/30 group-focus-within:text-bordo transition-colors">
                    <Mail size={20} />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[var(--input)] border border-[var(--border)] rounded-[22px] py-4.5 pl-14 pr-6 text-[var(--foreground)] text-sm font-semibold focus:outline-none focus:border-bordo/50 focus:ring-4 focus:ring-bordo/5 transition-all placeholder:text-[var(--muted-foreground)]/20"
                    placeholder="example@cahan.edu.az"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !email}
                className="w-full bg-bordo hover:bg-bordo/90 text-white py-5 rounded-[22px] font-black text-sm tracking-wider transition-all shadow-xl shadow-bordo/20 hover:shadow-bordo/40 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {isLoading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <>
                    {t('auth.sendResetLink')}
                    <ChevronRight size={18} />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full flex items-center justify-center gap-2 text-sm font-bold text-[var(--muted-foreground)]/40 hover:text-bordo transition-all mt-4 group"
              >
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                {t('auth.backToLogin')}
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="p-6 bg-emerald-500/5 rounded-3xl border border-emerald-500/10 text-center">
                <p className="text-emerald-600/80 text-xs font-bold leading-relaxed uppercase tracking-widest">
                  {t('auth.resendInstructions')}
                </p>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => setIsSent(false)}
                  className="w-full bg-[var(--muted)]/50 text-[var(--foreground)] py-4 rounded-2xl font-bold text-sm hover:bg-[var(--muted)] transition-all border border-[var(--border)]"
                >
                  {t('auth.tryDifferentEmail')}
                </button>
                
                <button
                  onClick={() => navigate('/login')}
                  className="w-full bg-bordo text-white py-4 rounded-2xl font-black text-sm shadow-lg shadow-bordo/20"
                >
                  {t('auth.returnToLogin')}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-10 text-center">
          <p className="text-[10px] font-black text-[var(--muted-foreground)]/20 uppercase tracking-[0.4em]">
            © {new Date().getFullYear()} Cahan Academy
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
