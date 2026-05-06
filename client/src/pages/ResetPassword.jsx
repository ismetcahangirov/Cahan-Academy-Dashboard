import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, ArrowLeft, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const ResetPassword = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return toast.error(t('auth.passwordsDoNotMatch'));
    }

    setIsLoading(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/reset-password/${token}`, {
        password: formData.password
      });
      setIsSuccess(true);
      toast.success(t('auth.passwordResetSuccess'));
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      toast.error(err.response?.data?.message || t('auth.errorOccurred'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[440px]"
      >
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-[32px] p-8 md:p-10 shadow-2xl shadow-black/5">
          <div className="mb-10 text-center">
            <div className="w-16 h-16 bg-bordo/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              {isSuccess ? (
                <CheckCircle2 size={32} className="text-emerald-500" />
              ) : (
                <ShieldCheck size={32} className="text-bordo" />
              )}
            </div>
            <h1 className="text-3xl font-bold text-[var(--foreground)] tracking-tight mb-3">
              {isSuccess ? t('auth.success') : t('auth.resetPasswordTitle')}
            </h1>
            <p className="text-[var(--muted-foreground)]/60 text-sm leading-relaxed px-4">
              {isSuccess ? t('auth.successDescription') : t('auth.resetPasswordSubtitle')}
            </p>
          </div>

          {!isSuccess ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[var(--muted-foreground)] ml-1">
                  {t('auth.newPassword')}
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]/40 group-focus-within:text-bordo transition-colors">
                    <Lock size={20} />
                  </div>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-[var(--input)] border border-[var(--border)] rounded-2xl py-4 pl-12 pr-4 text-[var(--foreground)] text-sm focus:outline-none focus:border-bordo/50 focus:ring-4 focus:ring-bordo/5 transition-all placeholder:text-[var(--muted-foreground)]/30"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[var(--muted-foreground)] ml-1">
                  {t('auth.confirmNewPassword')}
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]/40 group-focus-within:text-bordo transition-colors">
                    <Lock size={20} />
                  </div>
                  <input
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full bg-[var(--input)] border border-[var(--border)] rounded-2xl py-4 pl-12 pr-4 text-[var(--foreground)] text-sm focus:outline-none focus:border-bordo/50 focus:ring-4 focus:ring-bordo/5 transition-all placeholder:text-[var(--muted-foreground)]/30"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-bordo hover:bg-bordo/90 text-white py-4 rounded-2xl font-bold text-sm transition-all shadow-xl shadow-bordo/20 hover:shadow-bordo/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
              >
                {isLoading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  t('auth.resetPasswordBtn')
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-[var(--muted-foreground)]/60 hover:text-bordo transition-colors mt-6"
              >
                <ArrowLeft size={18} />
                {t('auth.backToLogin')}
              </button>
            </form>
          ) : (
            <div className="text-center space-y-6">
              <div className="py-8 px-4 bg-emerald-500/5 rounded-3xl border border-emerald-500/10">
                <p className="text-emerald-600 font-medium text-sm">
                  {t('auth.redirecting')}...
                </p>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-bordo text-white py-4 rounded-2xl font-bold text-sm transition-all"
              >
                {t('auth.loginNow')}
              </button>
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-[var(--muted-foreground)]/40">
            © {new Date().getFullYear()} Cahan Academy. {t('auth.allRightsReserved')}
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
