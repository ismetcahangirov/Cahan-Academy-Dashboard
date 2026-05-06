import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Loader2, Save, User as UserIcon, Mail, Shield, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';

const userSchema = (t) => z.object({
  name: z.string().min(3, t('users.nameShort')),
  email: z.string().email(t('auth.emailInvalid')),
  role: z.enum(['student', 'teacher', 'admin']),
  status: z.enum(['active', 'inactive']),
  password: z.string().min(6, t('auth.passwordShort')).optional().or(z.literal('')),
});

const UserModal = ({ isOpen, onClose, onSubmit, user, isLoading }) => {
  const { t } = useTranslation();
  const isEdit = !!user;

  const {
    register,
    handleSubmit,
    reset,
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
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/[0.02]">
            <h2 className="text-xl font-semibold text-white">
              {isEdit ? t('users.editUser') : t('users.newUser')}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/70">{t('auth.fullName')}</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                <input
                  {...register('name')}
                  type="text"
                  placeholder={t('users.namePlaceholder')}
                  className={cn(
                    "w-full bg-black/40 border rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none transition-all",
                    errors.name ? "border-bordo" : "border-white/10 focus:border-bordo/50"
                  )}
                />
              </div>
              {errors.name && <p className="text-xs text-bordo">{errors.name.message}</p>}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/70">{t('auth.email')}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                <input
                  {...register('email')}
                  type="email"
                  placeholder={t('auth.emailPlaceholder')}
                  className={cn(
                    "w-full bg-black/40 border rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none transition-all",
                    errors.email ? "border-bordo" : "border-white/10 focus:border-bordo/50"
                  )}
                />
              </div>
              {errors.email && <p className="text-xs text-bordo">{errors.email.message}</p>}
            </div>

            {/* Password (Only for new user or optional for edit) */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/70">
                {isEdit ? t('users.passwordOptional') : t('auth.password')}
              </label>
              <div className="relative">
                <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                <input
                  {...register('password')}
                  type="password"
                  placeholder="••••••••"
                  className={cn(
                    "w-full bg-black/40 border rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none transition-all",
                    errors.password ? "border-bordo" : "border-white/10 focus:border-bordo/50"
                  )}
                />
              </div>
              {errors.password && <p className="text-xs text-bordo">{errors.password.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Role */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-white/70">{t('users.role')}</label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                  <select
                    {...register('role')}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-bordo/50 appearance-none transition-all"
                  >
                    <option value="student">{t('common.student')}</option>
                    <option value="teacher">{t('common.teacher')}</option>
                    <option value="admin">{t('common.admin')}</option>
                  </select>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-white/70">{t('users.status')}</label>
                <select
                  {...register('status')}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-bordo/50 appearance-none transition-all"
                >
                  <option value="active">{t('students.active')}</option>
                  <option value="inactive">{t('students.inactive')}</option>
                </select>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-all"
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
