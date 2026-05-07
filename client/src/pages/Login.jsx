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
import { motion } from 'framer-motion';
import Dropdown from '../components/common/Dropdown';

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
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4 relative overflow-hidden">
      {/* Background Orbs */}
      {/* Language Switcher (Floating) */}
      <div className="absolute top-8 right-8 z-50">
        <Dropdown
          label={currentLang.code}
          icon={<span className="text-xl">{currentLang.flag}</span>}
          items={languages.map(lang => ({
            label: lang.name,
            icon: lang.flag,
            active: i18n.language === lang.code,
            onClick: () => i18n.changeLanguage(lang.code)
          }))}
          buttonClassName="px-4 py-2 rounded-xl bg-[var(--card)] backdrop-blur-md border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-all shadow-xl"
          menuClassName="w-44"
        />
      </div>

      <div className="w-full max-w-md bg-[var(--card)] backdrop-blur-xl rounded-2xl border border-[var(--border)] p-8 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">{t('auth.loginTitle')}</h1>
          <p className="text-[var(--muted-foreground)]/60">{t('auth.loginSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--muted-foreground)]/80 block">{t('auth.email')}</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]/40" />
              <input
                {...register('email')}
                type="email"
                className={`w-full bg-[var(--input)] border ${errors.email ? 'border-bordo' : 'border-[var(--border)]'} rounded-lg py-3 pl-10 pr-4 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-bordo/50 transition-all`}
                placeholder={t('auth.emailPlaceholder')}
              />
            </div>
            {errors.email && <p className="text-xs text-bordo mt-1">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-[var(--muted-foreground)]/80 block">{t('auth.password')}</label>
              <Link to="/forgot-password" title={t('auth.forgotPassword')} className="text-xs text-bordo hover:underline">
                {t('auth.forgotPassword')}
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]/40" />
              <input
                {...register('password')}
                type="password"
                className={`w-full bg-[var(--input)] border ${errors.password ? 'border-bordo' : 'border-[var(--border)]'} rounded-lg py-3 pl-10 pr-4 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-bordo/50 transition-all`}
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
              <div className="w-full border-t border-[var(--border)]"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[var(--card)] px-2 text-[var(--muted-foreground)]/40">{t('auth.or')}</span>
            </div>
          </div>

          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={onGoogleSuccess}
              onError={() => toast.error(t('auth.googleLoginError'))}
              theme="outline"
              shape="pill"
              text="signin_with"
            />
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-[var(--muted-foreground)]/60 text-sm">
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
