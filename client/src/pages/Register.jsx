import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { PASSWORD_REGEX, useRegisterMutation } from '../features/auth/authApi';
import { selectIsAuthenticated } from '../features/auth/authSlice';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { Mail, User as UserIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button, FormField, Input } from '../components/ui';
import { ScriptTitle } from '../components/ornament';
import AuthLayout from './auth/AuthLayout';
import AuthPasswordField from './auth/AuthPasswordField';

const registerSchema = (t) => z.object({
  name: z.string().min(2, t('auth.nameShort')),
  email: z.string().email(t('auth.emailInvalid')),
  password: z.string().regex(PASSWORD_REGEX, t('auth.passwordRule')),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: t('auth.passMismatch'),
  path: ['confirmPassword'],
});

const Register = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const [registerUser, { isLoading }] = useRegisterMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema(t)),
  });

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
    <AuthLayout>
      <ScriptTitle align="center" size="page" title={t('auth.registerTitle')} subtitle={t('auth.registerSubtitle')} />

      <form onSubmit={handleSubmit(onSubmit)} className="orn-rise mt-8 space-y-5" noValidate>
        <FormField label={t('auth.fullName')} error={errors.name?.message}>
          {(id, describedBy, invalid) => (
            <Input
              id={id}
              type="text"
              autoComplete="name"
              icon={UserIcon}
              invalid={invalid}
              aria-describedby={describedBy}
              placeholder={t('auth.fullNamePlaceholder')}
              {...register('name')}
            />
          )}
        </FormField>

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

        <AuthPasswordField
          label={t('auth.password')}
          error={errors.password?.message}
          autoComplete="new-password"
          placeholder={t('auth.passwordPlaceholder')}
          {...register('password')}
        />

        <AuthPasswordField
          label={t('auth.confirmPassword')}
          error={errors.confirmPassword?.message}
          autoComplete="new-password"
          placeholder={t('auth.passwordPlaceholder')}
          {...register('confirmPassword')}
        />

        <div className="pt-2">
          <Button type="submit" size="lg" block loading={isLoading} motif>
            {t('auth.registerBtn')}
          </Button>
        </div>
      </form>

      <p className="mt-8 text-center text-[0.98rem] text-ink-muted">
        {t('auth.haveAccount')}{' '}
        <Link to="/login" className="link font-semibold">
          {t('auth.loginLink')}
        </Link>
      </p>
    </AuthLayout>
  );
};

export default Register;
