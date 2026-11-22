import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useLoginMutation, useGoogleLoginMutation } from '../features/auth/authApi';
import { setCredentials, selectIsAuthenticated } from '../features/auth/authSlice';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { Mail, Lock, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Dropdown from '../components/common/Dropdown';
import PasswordInput from '../components/common/PasswordInput';
import GoogleButton from '../components/common/GoogleButton';
import { Button, FormField, Input } from '../components/ui';
import { BrandLogo } from '../components/brand';
import {
  DrapedRibbon,
  LaceCorner,
  LaceEdge,
  OrnamentDivider,
  ScriptTitle,
  WaveEdge,
  WaxSeal,
  EdelweissGlyph,
} from '../components/ornament';
import PetalField from '../components/three/PetalField';

const loginSchema = (t) => z.object({
  email: z.string().email(t('auth.emailInvalid')),
  password: z.string().min(6, t('auth.passwordShort')),
});

const languages = [
  { code: 'az', name: 'Azərbaycanca' },
  { code: 'en', name: 'English' },
  { code: 'ru', name: 'Русский' },
];

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

  const currentLang = languages.find((l) => l.code === i18n.language) || languages[0];

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
      const userData = await googleLogin({ credential: response.credential }).unwrap();
      dispatch(setCredentials(userData.data));
      toast.success(t('auth.googleLoginSuccess'));
      navigate('/');
    } catch (err) {
      toast.error(err?.data?.message || t('auth.googleLoginError'));
    }
  };

  const busy = isLoading || isGoogleLoading;

  return (
    <div className="relative min-h-screen bg-paper lg:grid lg:grid-cols-[minmax(0,46fr)_minmax(0,54fr)]">
      {/* ---------------------------------------------------------------- wine hero */}
      <aside className="theme-wine login-hero relative isolate overflow-hidden lg:min-h-screen">
        <PetalField className="absolute inset-0 -z-10" />
        <LaceCorner corner="tl" className="absolute left-0 top-0 w-32 sm:w-44 lg:w-60" />
        <LaceCorner corner="bl" className="absolute bottom-0 left-0 hidden w-52 lg:block" />
        <DrapedRibbon className="absolute -right-10 -top-3 w-52 sm:w-64 lg:hidden" />
        <div className="absolute left-4 top-4 z-30 lg:hidden">
          <Dropdown
            label={currentLang.code.toUpperCase()}
            icon={<Globe size={15} strokeWidth={1.5} />}
            items={languages.map((lang) => ({
              label: lang.name,
              active: i18n.language === lang.code,
              onClick: () => i18n.changeLanguage(lang.code),
            }))}
            align="left"
            menuClassName="w-44"
          />
        </div>

        <div className="relative flex flex-col items-center px-6 pb-20 pt-12 text-center sm:pb-24 lg:min-h-screen lg:justify-center lg:pb-16 lg:pt-16">
          <BrandLogo className="orn-rise h-32 w-auto text-white sm:h-40 lg:h-56" />
          <p className="orn-rise mt-6 font-script text-[2.3rem] leading-none text-white sm:text-[2.7rem] lg:mt-10 lg:text-[3.2rem]">
            {t('auth.heroLine')}
          </p>
          <OrnamentDivider className="mt-4 hidden sm:flex" />
          <p className="sc mt-3 hidden text-[0.85rem] text-ink-muted sm:block lg:text-[0.95rem]">{t('auth.heroSub')}</p>
          <WaxSeal size={92} className="mt-10 hidden lg:inline-block" />
        </div>

        {/* lace trim + wave into the parchment (bottom on mobile, right edge on desktop) */}
        <LaceEdge direction="up" size={22} className="absolute inset-x-0 bottom-9 lg:hidden" />
        <WaveEdge fill="var(--paper-base)" className="absolute inset-x-0 -bottom-px lg:hidden" />
        <WaveEdge vertical fill="var(--paper-base)" className="absolute inset-y-0 -right-px hidden lg:block" />
      </aside>

      {/* ribbon draped over the join of the two panels (desktop) */}
      <DrapedRibbon className="absolute left-[46%] top-[-14px] z-20 hidden w-72 -translate-x-[42%] lg:block" />

      {/* ---------------------------------------------------------------- parchment form */}
      <main className="paper relative flex flex-col items-center px-5 pb-12 sm:px-8 lg:min-h-screen lg:justify-center lg:py-16">
        <WaxSeal size={72} className="relative z-10 -mt-12 mb-2 lg:hidden" />

        <div className="absolute right-6 top-6 z-30 hidden lg:block">
          <Dropdown
            label={currentLang.code.toUpperCase()}
            icon={<Globe size={15} strokeWidth={1.5} />}
            items={languages.map((lang) => ({
              label: lang.name,
              active: i18n.language === lang.code,
              onClick: () => i18n.changeLanguage(lang.code),
            }))}
            menuClassName="w-44"
          />
        </div>

        <div className="w-full max-w-[26rem] pt-4 lg:pt-0">
          <ScriptTitle align="center" size="page" title={t('auth.welcomeScript')} subtitle={t('auth.loginSubtitle')} />

          <form onSubmit={handleSubmit(onSubmit)} className="orn-rise mt-8 space-y-5" noValidate>
            <FormField label={t('auth.email')} error={errors.email?.message}>
              {(id, describedBy, invalid) => (
                <Input
                  id={id}
                  type="email"
                  autoComplete="email"
                  icon={Mail}
                  invalid={invalid}
                  aria-describedby={describedBy}
                  placeholder={t('auth.emailPlaceholder')}
                  {...register('email')}
                />
              )}
            </FormField>

            <FormField
              error={errors.password?.message}
              label={
                <span className="flex items-baseline justify-between gap-3">
                  <span>{t('auth.password')}</span>
                  <Link to="/forgot-password" className="link font-serif text-[0.9rem] font-normal tracking-normal">
                    {t('auth.forgotPassword')}
                  </Link>
                </span>
              }
            >
              {(id, describedBy, invalid) => (
                <div className="relative">
                  <Lock
                    aria-hidden="true"
                    strokeWidth={1.6}
                    className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-[1.05rem] w-[1.05rem] -translate-y-1/2 text-ink-subtle"
                  />
                  <PasswordInput
                    id={id}
                    autoComplete="current-password"
                    aria-invalid={invalid || undefined}
                    aria-describedby={describedBy}
                    className="field field-icon"
                    placeholder={t('auth.passwordPlaceholder')}
                    {...register('password')}
                  />
                </div>
              )}
            </FormField>

            <Button type="submit" size="lg" block loading={isLoading} disabled={busy} motif>
              {t('auth.loginBtn')}
            </Button>
          </form>

          <div className="my-7 flex items-center gap-3 text-ornament" role="separator">
            <span className="h-px flex-1 bg-line-strong" />
            <EdelweissGlyph className="h-3.5 w-3.5" />
            <span className="sc text-[0.8rem] text-ink-muted">{t('auth.or')}</span>
            <EdelweissGlyph className="h-3.5 w-3.5" />
            <span className="h-px flex-1 bg-line-strong" />
          </div>

          <GoogleButton
            label={t('auth.googleContinue')}
            disabled={busy}
            onSuccess={onGoogleSuccess}
            onError={() => toast.error(t('auth.googleLoginError'))}
          />

          <p className="mt-8 text-center text-[0.98rem] text-ink-muted">
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="link font-semibold">
              {t('auth.registerLink')}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default Login;
