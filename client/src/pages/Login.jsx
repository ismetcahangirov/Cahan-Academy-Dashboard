import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useLoginMutation } from '../features/auth/authApi';
import { setCredentials, selectIsAuthenticated } from '../features/auth/authSlice';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { Mail, Lock, LogIn, Loader2, Globe, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useRef } from 'react';

import { GoogleLogin } from '@react-oauth/google';
import { useGoogleLoginMutation } from '../features/auth/authApi';

const loginSchema = (t) => z.object({
  email: z.string().email(t('auth.emailInvalid')),
  password: z.string().min(6, t('auth.passwordShort')),
});

const Login = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const langRef = useRef(null);

  const [login, { isLoading }] = useLoginMutation();
  const [googleLogin, { isLoading: isGoogleLoading }] = useGoogleLoginMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema(t)),
  });

  const languages = [
    { code: 'az', name: 'AZE', flag: '🇦🇿' },
    { code: 'en', name: 'ENG', flag: '🇺🇸' },
    { code: 'ru', name: 'RUS', flag: '🇷🇺' }
  ];

  const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (langRef.current && !langRef.current.contains(event.target)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (data) => {
    try {
      const userData = await login(data).unwrap();
      dispatch(setCredentials(userData.data));
      toast.success(t('auth.welcomeBack'));
      navigate('/');
    } catch (err) {
      toast.error(err?.data?.message || t('auth.loginError'));
    }
  };

  const onGoogleSuccess = async (response) => {
    try {
      const userData = await googleLogin({ token: response.credential }).unwrap();
      dispatch(setCredentials(userData.data));
      toast.success(t('auth.googleLoginSuccess'));
      navigate('/');
    } catch (err) {
      toast.error(err?.data?.message || t('auth.googleLoginError'));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4 relative overflow-hidden">
      {/* Background Orbs */}
      {/* Language Switcher (Floating) */}
      <div className="absolute top-8 right-8 z-50" ref={langRef}>
        <button
          onClick={() => setIsLangOpen(!isLangOpen)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all shadow-xl"
        >
          <span className="text-xl">{currentLang.flag}</span>
          <span className="text-sm font-bold uppercase tracking-wider">{currentLang.code}</span>
          <ChevronDown size={16} className={`transition-transform duration-300 ${isLangOpen ? 'rotate-180' : ''}`} />
        </button>

        {isLangOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="absolute right-0 mt-2 w-44 bg-[#111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden py-2 backdrop-blur-2xl"
          >
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  i18n.changeLanguage(lang.code);
                  setIsLangOpen(false);
                }}
                className={`flex items-center gap-4 w-full px-5 py-3 text-sm transition-all ${
                  i18n.language === lang.code 
                    ? 'bg-bordo text-white' 
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="text-xl">{lang.flag}</span>
                <span className="font-semibold">{lang.name}</span>
                {i18n.language === lang.code && (
                  <div className="ml-auto w-2 h-2 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </div>

      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{t('auth.loginTitle')}</h1>
          <p className="text-white/60">{t('auth.loginSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80 block">{t('auth.email')}</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                {...register('email')}
                type="email"
                className={`w-full bg-black/40 border ${errors.email ? 'border-bordo' : 'border-white/10'} rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-bordo/50 transition-all`}
                placeholder={t('auth.emailPlaceholder')}
              />
            </div>
            {errors.email && <p className="text-xs text-bordo mt-1">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-white/80 block">{t('auth.password')}</label>
              <Link to="/forgot-password" title={t('auth.forgotPassword')} className="text-xs text-bordo hover:underline">
                {t('auth.forgotPassword')}
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                {...register('password')}
                type="password"
                className={`w-full bg-black/40 border ${errors.password ? 'border-bordo' : 'border-white/10'} rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-bordo/50 transition-all`}
                placeholder={t('auth.passwordPlaceholder')}
              />
            </div>
            {errors.password && <p className="text-xs text-bordo mt-1">{errors.password.message}</p>}
          </div>

          <button
            disabled={isLoading || isGoogleLoading}
            type="submit"
            className="w-full bg-bordo hover:bg-bordo/90 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                {t('auth.loginBtn')}
              </>
            )}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-black/20 backdrop-blur-sm px-2 text-white/40">{t('auth.or')}</span>
            </div>
          </div>

          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={onGoogleSuccess}
              onError={() => toast.error(t('auth.googleLoginError'))}
              theme="filled_black"
              shape="pill"
              text="signin_with"
              width="100%"
            />
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-white/60 text-sm">
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="text-bordo font-semibold hover:underline">
              {t('auth.registerLink')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
