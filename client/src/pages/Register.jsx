import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useRegisterMutation } from '../features/auth/authApi';
import { selectIsAuthenticated } from '../features/auth/authSlice';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { Mail, Lock, User as UserIcon, LogIn, Globe, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useRef } from 'react';
import { motion } from 'framer-motion';
import Spinner from '../components/common/Spinner';

const registerSchema = (t) => z.object({
  name: z.string().min(2, t('auth.nameShort')),
  email: z.string().email(t('auth.emailInvalid')),
  password: z.string().min(6, t('auth.passwordShort')),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: t('auth.passMismatch'),
  path: ['confirmPassword'],
});

const Register = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const langRef = useRef(null);

  const [registerUser, { isLoading }] = useRegisterMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema(t)),
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
      await registerUser(data).unwrap();
      toast.success(t('auth.registerPending'));
      navigate('/login');
    } catch (err) {
      toast.error(err?.data?.message || t('auth.registerError'));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-bordo rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute bottom-0 -right-4 w-72 h-72 bg-bordo rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

      <div className="w-full max-w-md bg-[var(--card)] backdrop-blur-xl rounded-2xl border border-[var(--border)] p-8 shadow-2xl relative z-10">
      {/* Language Switcher (Floating) */}
      <div className="absolute top-8 right-8 z-50" ref={langRef}>
        <button
          onClick={() => setIsLangOpen(!isLangOpen)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--muted)]/50 backdrop-blur-md border border-[var(--border)] text-[var(--muted-foreground)]/70 hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-all shadow-xl"
        >
          <span className="text-xl">{currentLang.flag}</span>
          <span className="text-sm font-bold uppercase tracking-wider">{currentLang.code}</span>
          <ChevronDown size={16} className={`transition-transform duration-300 ${isLangOpen ? 'rotate-180' : ''}`} />
        </button>

        {isLangOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="absolute right-0 mt-2 w-44 bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden py-2 backdrop-blur-2xl"
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
                    : 'text-[var(--muted-foreground)]/60 hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
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

        <div className="text-center mb-8">
          <img
            src="/cahan-logo.svg"
            alt="Cahan Academy"
            className="mx-auto mb-4 h-16 w-16 object-contain"
          />
          <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">{t('auth.registerTitle')}</h1>
          <p className="text-[var(--muted-foreground)]/60">{t('auth.registerSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--foreground)]/80 block">{t('auth.fullName')}</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]/40" />
              <input
                {...register('name')}
                type="text"
                className={`w-full bg-[var(--input)] border ${errors.name ? 'border-bordo' : 'border-[var(--border)]'} rounded-lg py-2.5 pl-10 pr-4 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-bordo/50 transition-all`}
                placeholder={t('auth.fullNamePlaceholder')}
              />
            </div>
            {errors.name && <p className="text-xs text-bordo mt-1">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--foreground)]/80 block">{t('auth.email')}</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]/40" />
              <input
                {...register('email')}
                type="email"
                className={`w-full bg-[var(--input)] border ${errors.email ? 'border-bordo' : 'border-[var(--border)]'} rounded-lg py-2.5 pl-10 pr-4 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-bordo/50 transition-all`}
                placeholder={t('auth.emailPlaceholder')}
              />
            </div>
            {errors.email && <p className="text-xs text-bordo mt-1">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--foreground)]/80 block">{t('auth.password')}</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]/40" />
              <input
                {...register('password')}
                type="password"
                className={`w-full bg-[var(--input)] border ${errors.password ? 'border-bordo' : 'border-[var(--border)]'} rounded-lg py-2.5 pl-10 pr-4 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-bordo/50 transition-all`}
                placeholder={t('auth.passwordPlaceholder')}
              />
            </div>
            {errors.password && <p className="text-xs text-bordo mt-1">{errors.password.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--foreground)]/80 block">{t('auth.confirmPassword')}</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]/40" />
              <input
                {...register('confirmPassword')}
                type="password"
                className={`w-full bg-[var(--input)] border ${errors.confirmPassword ? 'border-bordo' : 'border-[var(--border)]'} rounded-lg py-2.5 pl-10 pr-4 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-bordo/50 transition-all`}
                placeholder={t('auth.passwordPlaceholder')}
              />
            </div>
            {errors.confirmPassword && <p className="text-xs text-bordo mt-1">{errors.confirmPassword.message}</p>}
          </div>

          <button
            disabled={isLoading}
            type="submit"
            className="w-full bg-bordo hover:bg-bordo/90 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {isLoading ? (
              <Spinner size="sm" color="white" />
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                {t('auth.registerBtn')}
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-[var(--muted-foreground)]/60 text-sm">
            {t('auth.haveAccount')}{' '}
            <Link to="/login" className="text-bordo font-semibold hover:underline">
              {t('auth.loginLink')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
