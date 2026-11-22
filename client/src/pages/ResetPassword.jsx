import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { AlertOctagon, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PASSWORD_REGEX, useResetPasswordMutation } from '../features/auth/authApi';
import { Button } from '../components/ui';
import { ScriptTitle } from '../components/ornament';
import AuthLayout from './auth/AuthLayout';
import AuthPasswordField from './auth/AuthPasswordField';

const resetPasswordSchema = (t) => z.object({
  password: z.string().regex(PASSWORD_REGEX, t('auth.passwordRule')),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: t('auth.passwordsDoNotMatch'),
  path: ['confirmPassword'],
});

const ResetPassword = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token } = useParams();
  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const [linkInvalid, setLinkInvalid] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema(t)),
  });

  const onSubmit = async (data) => {
    try {
      await resetPassword({ token, password: data.password }).unwrap();
      toast.success(t('auth.passwordResetSuccess'));
      navigate('/login');
    } catch (err) {
      // The password rule is checked above, so a 400 here means the link is invalid or expired.
      if (err?.status === 400) {
        setLinkInvalid(true);
        toast.error(t('resetPassword.invalidLink'));
      } else if (err?.status === 429) {
        toast.error(t('auth.tooManyRequests'));
      } else {
        toast.error(t('resetPassword.error'));
      }
    }
  };

  return (
    <AuthLayout>
      <ScriptTitle align="center" size="page" title={t('auth.newPassword')} subtitle={t('auth.enterNewPassword')} />

      {linkInvalid && (
        <div
          role="alert"
          className="orn-rise mt-6 flex gap-3 rounded-[var(--radius-md)] border-[1.5px] border-accent-text bg-accent-soft p-4 text-[0.98rem] text-ink"
        >
          <AlertOctagon size={20} strokeWidth={2} aria-hidden="true" className="mt-0.5 shrink-0 text-accent-text" />
          <div>
            <p className="font-semibold">{t('resetPassword.invalidLink')}</p>
            <Link to="/forgot-password" className="link mt-1 inline-block font-semibold">
              {t('resetPassword.requestNewLink')}
            </Link>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="orn-rise mt-8 space-y-5" noValidate>
        <AuthPasswordField
          label={t('auth.newPassword')}
          error={errors.password?.message}
          autoComplete="new-password"
          placeholder="••••••••"
          {...register('password')}
        />
        <AuthPasswordField
          label={t('auth.confirmPassword')}
          error={errors.confirmPassword?.message}
          autoComplete="new-password"
          placeholder="••••••••"
          {...register('confirmPassword')}
        />

        <div className="pt-2">
          <Button type="submit" size="lg" block loading={isLoading} motif>
            {t('auth.savePassword')}
          </Button>
        </div>
      </form>

      <div className="mt-8 flex justify-center">
        <Button as={Link} to="/login" variant="ghost" icon={ArrowLeft}>
          {t('forgotPassword.backToLogin')}
        </Button>
      </div>
    </AuthLayout>
  );
};

export default ResetPassword;
