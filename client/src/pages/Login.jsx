import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useLoginMutation, useGoogleLoginMutation } from '../features/auth/authApi';
import { setCredentials, selectIsAuthenticated } from '../features/auth/authSlice';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { Mail, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PasswordInput from '../components/common/PasswordInput';
import GoogleButton from '../components/common/GoogleButton';
import { Button, FormField, Input } from '../components/ui';
import { ScriptTitle, EdelweissGlyph } from '../components/ornament';
import AuthLayout from './auth/AuthLayout';

const loginSchema = (t) => z.object({
  email: z.string().email(t('auth.emailInvalid')),
  password: z.string().min(6, t('auth.passwordShort')),
});

const Login = () => {
  const { t } = useTranslation();
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
    <AuthLayout>
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
    </AuthLayout>
  );
};

export default Login;
