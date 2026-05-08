import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Loader2, Save, User as UserIcon, Mail, Shield, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';
import Select from '../../components/common/Select';

const userSchema = (t) => z.object({
  name: z.string().min(3, t('users.nameShort')),
  email: z.string().email(t('auth.emailInvalid')),
  role: z.enum(['student', 'teacher', 'admin']),
  status: z.enum(['active', 'inactive', 'pending']),
  password: z.string().min(6, t('auth.passwordShort')).optional().or(z.literal('')),
});

const UserModal = ({ isOpen, onClose, onSubmit, user, isLoading }) => {
  const { t } = useTranslation();
  const isEdit = !!user;

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(userSchema(t)),
    defaultValues: {
      name: '',
      email: '',
      role: 'student',
      status: 'active',
      password: '',
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        password: '',
      });
    } else {
      reset({
        name: '',
        email: '',
        role: 'student',
        status: 'active',
        password: '',
      });
    }
  }, [user, reset, isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence mode="wait">
      <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-background/60 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative z-10 my-4 flex max-h-[calc(100vh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[var(--border)] bg-[var(--muted)]/20">
            <h2 className="text-xl font-semibold text-[var(--foreground)]">
              {isEdit ? t('users.editUser') : t('users.newUser')}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-all"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="custom-scrollbar space-y-5 overflow-y-auto p-6">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--muted-foreground)]">{t('auth.fullName')}</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]/40" size={18} />
                <input
                  {...register('name')}
                  type="text"
                  placeholder={t('users.namePlaceholder')}
                  className={cn(
                    "w-full bg-[var(--input)] border rounded-xl py-2.5 pl-10 pr-4 text-[var(--foreground)] text-sm focus:outline-none transition-all",
                    errors.name ? "border-bordo" : "border-[var(--border)] focus:border-bordo/50"
                  )}
                />
              </div>
              {errors.name && <p className="text-xs text-bordo">{errors.name.message}</p>}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--muted-foreground)]">{t('auth.email')}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]/40" size={18} />
                <input
                  {...register('email')}
                  type="email"
                  placeholder={t('auth.emailPlaceholder')}
                  className={cn(
                    "w-full bg-[var(--input)] border rounded-xl py-2.5 pl-10 pr-4 text-[var(--foreground)] text-sm focus:outline-none transition-all",
                    errors.email ? "border-bordo" : "border-[var(--border)] focus:border-bordo/50"
                  )}
                />
              </div>
              {errors.email && <p className="text-xs text-bordo">{errors.email.message}</p>}
            </div>

            {/* Password (Only for new user or optional for edit) */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--muted-foreground)]">
                {isEdit ? t('users.passwordOptional') : t('auth.password')}
              </label>
              <div className="relative">
                <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]/40" size={18} />
                <input
                  {...register('password')}
                  type="password"
                  placeholder="••••••••"
                  className={cn(
                    "w-full bg-[var(--input)] border rounded-xl py-2.5 pl-10 pr-4 text-[var(--foreground)] text-sm focus:outline-none transition-all",
                    errors.password ? "border-bordo" : "border-[var(--border)] focus:border-bordo/50"
                  )}
                />
              </div>
              {errors.password && <p className="text-xs text-bordo">{errors.password.message}</p>}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Role */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[var(--muted-foreground)]">{t('users.role')}</label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]/40 z-10" size={18} />
                  <Controller
                    name="role"
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        options={[
                          { label: t('common.student'), value: 'student' },
                          { label: t('common.teacher'), value: 'teacher' },
                          { label: t('common.admin'), value: 'admin' },
                        ]}
                        buttonClassName="pl-10"
                        error={!!errors.role}
                      />
                    )}
                  />
                </div>
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[var(--muted-foreground)]">{t('users.status')}</label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      options={[
                        { label: t('users.pending'), value: 'pending' },
                        { label: t('students.active'), value: 'active' },
                        { label: t('students.inactive'), value: 'inactive' },
                      ]}
                      error={!!errors.status}
                    />
                  )}
                />
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border)] mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-all"
              >
                {t('users.cancelBtn')}
              </button>
              <button
                disabled={isLoading}
                type="submit"
                className="flex items-center gap-2 bg-bordo hover:bg-bordo/90 text-white px-6 py-2 rounded-xl transition-all shadow-lg shadow-bordo/20 font-medium text-sm disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                {isEdit ? t('users.saveBtn') : t('users.createBtn')}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default UserModal;
