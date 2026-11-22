import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft, MailCheck, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useForgotPasswordMutation } from '../features/auth/authApi';
import { Button, FormField, Input } from '../components/ui';
import { ScriptTitle } from '../components/ornament';
import AuthLayout from './auth/AuthLayout';

const forgotPasswordSchema = (t) => z.object({
  email: z.string().email(t('auth.emailInvalid')),
});

const ForgotPassword = () => {
  const { t } = useTranslation();
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  const [sentTo, setSentTo] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema(t)),
  });

  const onSubmit = async (data) => {
    try {
      await forgotPassword({ email: data.email }).unwrap();
      setSentTo(data.email);
      toast.success(t('forgotPassword.successMessage'));
    } catch (err) {
      toast.error(err?.status === 429 ? t('auth.tooManyRequests') : t('forgotPassword.error'));
    }
  };

  return (
    <AuthLayout>
      <ScriptTitle align="center" size="page" title={t('forgotPassword.title')} />
      <p className="orn-rise mx-auto mt-4 max-w-sm text-center text-[1rem] text-ink-muted">{t('forgotPassword.subtitle')}</p>

      {sentTo ? (
        <div className="orn-rise mt-8 flex flex-col items-center gap-4 text-center" role="status">
          <span className="flex h-16 w-16 items-center justify-center rounded-full border border-line-strong bg-surface text-accent-text shadow-[var(--glow-inset)]">
            <MailCheck size={28} strokeWidth={1.4} aria-hidden="true" />
          </span>
          <p className="text-[1rem] text-ink">{t('forgotPassword.sentDescription', { email: sentTo })}</p>
          <Button variant="outline" icon={RotateCcw} onClick={() => setSentTo(null)}>
            {t('forgotPassword.sendAgain')}
          </Button>
        </div>
      ) : (
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
                placeholder={t('forgotPassword.emailPlaceholder')}
                {...register('email')}
              />
            )}
          </FormField>

          <Button type="submit" size="lg" block loading={isLoading} motif>
            {t('forgotPassword.sendLink')}
          </Button>
        </form>
      )}

      <div className="mt-8 flex justify-center">
        <Button as={Link} to="/login" variant="ghost" icon={ArrowLeft}>
          {t('forgotPassword.backToLogin')}
        </Button>
      </div>
    </AuthLayout>
  );
};

export default ForgotPassword;
