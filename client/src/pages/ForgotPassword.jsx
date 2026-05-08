import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { Mail, ChevronLeft, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Spinner from '../components/common/Spinner';

const forgotPasswordSchema = (t) => z.object({
  email: z.string().email(t('auth.emailInvalid')),
});

const ForgotPassword = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // Using a mock loading state since the endpoint logic will be implemented in backend later
  const isLoading = false;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema(t)),
  });

  const onSubmit = async (data) => {
    // This will be connected to the backend authApi later
    console.log(data);
    toast.success(t('forgotPassword.successMessage'));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-bordo rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute bottom-0 -right-4 w-72 h-72 bg-bordo rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

      <div className="w-full max-w-md bg-[var(--card)] backdrop-blur-xl rounded-2xl border border-[var(--border)] p-8 shadow-2xl relative z-10">
        <Link to="/login" className="inline-flex items-center text-[var(--muted-foreground)]/60 hover:text-[var(--foreground)] mb-6 transition-colors gap-1 text-sm">
           <ChevronLeft className="w-4 h-4" />
           {t('forgotPassword.backToLogin')}
         </Link>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">{t('forgotPassword.title')}</h1>
          <p className="text-[var(--muted-foreground)]/60 text-sm">{t('forgotPassword.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--foreground)]/80 block">{t('auth.email')}</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]/40" />
              <input
                {...register('email')}
                type="email"
                className={`w-full bg-[var(--input)] border ${errors.email ? 'border-bordo' : 'border-[var(--border)]'} rounded-lg py-3 pl-10 pr-4 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-bordo/50 transition-all`}
                placeholder={t('forgotPassword.emailPlaceholder')}
              />
            </div>
            {errors.email && <p className="text-xs text-bordo mt-1">{errors.email.message}</p>}
          </div>

          <button
            disabled={isLoading}
            type="submit"
            className="w-full bg-bordo hover:bg-bordo/90 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Spinner size="sm" color="white" />
            ) : (
              <>
                <Send className="w-5 h-5" />
                {t('forgotPassword.sendLink')}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
