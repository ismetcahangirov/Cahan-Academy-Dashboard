import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Lock, 
  ArrowRight, 
  Loader2, 
  CheckCircle2, 
  ShieldCheck,
  ChevronRight,
  Globe,
  AlertCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLoginMutation } from '../features/auth/authApi';
import { setCredentials } from '../features/auth/authSlice';
import { toast } from 'react-hot-toast';

const Login = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();
  const { userInfo } = useSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const languages = [
    { code: 'az', label: 'AZ', name: 'Azərbaycan' },
    { code: 'en', label: 'EN', name: 'English' },
    { code: 'ru', label: 'RU', name: 'Pусский' }
  ];

  useEffect(() => {
    if (userInfo) navigate('/dashboard');
  }, [navigate, userInfo]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await login({ email, password }).unwrap();
      dispatch(setCredentials({ ...res }));
      toast.success(t('auth.loginSuccess'));
      navigate('/dashboard');
    } catch (err) {
      toast.error(err?.data?.message || t('auth.errorOccurred'));
    }
  };

  const cn = (...classes) => classes.filter(Boolean).join(' ');

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 md:p-8 font-sans selection:bg-bordo selection:text-white">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-bordo/5 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-bordo/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[460px] relative z-10"
      >
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-[40px] p-8 md:p-12 shadow-2xl shadow-black/5 backdrop-blur-sm">
          {/* Language Switcher */}
          <div className="flex justify-end mb-8">
            <div className="inline-flex bg-[var(--muted)]/50 p-1 rounded-2xl border border-[var(--border)] relative">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => i18n.changeLanguage(lang.code)}
                  className={cn(
                    "relative z-10 px-4 py-1.5 rounded-xl text-xs font-bold transition-all duration-300",
                    i18n.language === lang.code 
                      ? "text-[var(--background)]" 
                      : "text-[var(--muted-foreground)]/60 hover:text-[var(--foreground)]"
                  )}
                >
                  {lang.label}
                  {i18n.language === lang.code && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-[var(--foreground)] rounded-xl -z-10 shadow-lg shadow-black/10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-bordo/5 border border-bordo/10 mb-6">
              <ShieldCheck size={16} className="text-bordo" />
              <span className="text-[10px] font-bold text-bordo uppercase tracking-[0.2em]">{t('auth.securePortal')}</span>
            </div>
            <h1 className="text-4xl font-black text-[var(--foreground)] tracking-tight mb-3">
              {t('auth.welcomeBack')}
            </h1>
            <p className="text-[var(--muted-foreground)]/60 text-sm leading-relaxed max-w-[260px] mx-auto font-medium">
              {t('auth.loginSubtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-[var(--muted-foreground)]/80 ml-1">
                {t('auth.email')}
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

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-sm font-bold text-[var(--muted-foreground)]/80">
                  {t('auth.password')}
                </label>
                <Link to="/forgot-password" title={t('auth.forgotPassword')} className="text-xs font-bold text-bordo/60 hover:text-bordo transition-colors">
                  {t('auth.forgotPasswordLink')}
                </Link>
              </div>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]/30 group-focus-within:text-bordo transition-colors">
                  <Lock size={20} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[var(--input)] border border-[var(--border)] rounded-[22px] py-4.5 pl-14 pr-6 text-[var(--foreground)] text-sm font-semibold focus:outline-none focus:border-bordo/50 focus:ring-4 focus:ring-bordo/5 transition-all placeholder:text-[var(--muted-foreground)]/20"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 px-1">
              <input type="checkbox" className="w-4 h-4 rounded border-[var(--border)] text-bordo focus:ring-bordo/20 cursor-pointer" />
              <label className="text-xs font-bold text-[var(--muted-foreground)]/40 uppercase tracking-widest">{t('auth.rememberMe')}</label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-bordo hover:bg-bordo/90 text-white py-5 rounded-[22px] font-black text-sm tracking-wider transition-all shadow-xl shadow-bordo/20 hover:shadow-bordo/40 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  {t('auth.signIn')}
                  <ChevronRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-[var(--border)] text-center">
            <p className="text-sm font-medium text-[var(--muted-foreground)]/60">
              {t('auth.noAccount')}{' '}
              <Link to="/register" className="text-bordo font-black hover:underline decoration-bordo/30 underline-offset-4 transition-all ml-1">
                {t('auth.registerNow')}
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center gap-4">
          <div className="flex items-center gap-6">
            <Link to="/help" className="text-xs font-bold text-[var(--muted-foreground)]/40 hover:text-bordo transition-colors uppercase tracking-widest">{t('auth.help')}</Link>
            <div className="w-1 h-1 rounded-full bg-[var(--border)]"></div>
            <Link to="/privacy" className="text-xs font-bold text-[var(--muted-foreground)]/40 hover:text-bordo transition-colors uppercase tracking-widest">{t('auth.privacy')}</Link>
          </div>
          <p className="text-[10px] font-black text-[var(--muted-foreground)]/20 uppercase tracking-[0.4em]">
            © {new Date().getFullYear()} Cahan Academy
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
