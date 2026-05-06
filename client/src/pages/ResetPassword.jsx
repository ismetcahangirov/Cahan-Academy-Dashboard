import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { Lock, Loader2, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const resetPasswordSchema = (t) => z.object({
  password: z.string().min(6, t('auth.passwordShort')),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: t('auth.passwordsDoNotMatch'),
  path: ['confirmPassword'],
});

const ResetPassword = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token } = useParams();
  const isLoading = false;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema(t)),
  });

  const onSubmit = async (data) => {
    // This will be connected to the backend later
    console.log(data, token);
    toast.success(t('auth.passwordResetSuccess'));
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-bordo rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute bottom-0 -right-4 w-72 h-72 bg-bordo rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

      <div className="w-full max-w-md bg-[var(--card)] backdrop-blur-xl rounded-2xl border border-[var(--border)] p-8 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">{t('auth.newPassword')}</h1>
          <p className="text-[var(--muted-foreground)] text-sm">{t('auth.enterNewPassword')}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--foreground)] block">{t('auth.newPassword')}</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]/40" />
              <input
                {...register('password')}
                type="password"
                className={`w-full bg-[var(--input)] border ${errors.password ? 'border-bordo' : 'border-[var(--border)]'} rounded-lg py-3 pl-10 pr-4 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-bordo/50 transition-all`}
                placeholder="••••••••"
              />
            </div>
            {errors.password && <p className="text-xs text-bordo mt-1">{errors.password.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--foreground)] block">{t('auth.confirmPassword')}</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]/40" />
              <input
                {...register('confirmPassword')}
                type="password"
                className={`w-full bg-[var(--input)] border ${errors.confirmPassword ? 'border-bordo' : 'border-[var(--border)]'} rounded-lg py-3 pl-10 pr-4 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-bordo/50 transition-all`}
                placeholder="••••••••"
              />
            </div>
            {errors.confirmPassword && <p className="text-xs text-bordo mt-1">{errors.confirmPassword.message}</p>}
          </div>

          <button
            disabled={isLoading}
            type="submit"
            className="w-full bg-bordo hover:bg-bordo/90 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" />
                {t('auth.savePassword')}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
