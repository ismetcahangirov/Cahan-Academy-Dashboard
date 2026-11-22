import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Save, User as UserIcon, Mail, Shield, UserCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Select from '../../components/common/Select';
import PasswordInput from '../../components/common/PasswordInput';
import { PASSWORD_REGEX } from '../../features/auth/authApi';
import { Button, FormField, Input, Modal } from '../../components/ui';

// Password is required when creating; when editing, empty keeps the current one.
const userSchema = (t, isEdit) => z.object({
  name: z.string().min(3, t('users.nameShort')),
  email: z.string().email(t('auth.emailInvalid')),
  role: z.enum(['student', 'teacher', 'admin']),
  status: z.enum(['active', 'inactive', 'pending']),
  password: isEdit
    ? z.string().regex(PASSWORD_REGEX, t('auth.passwordRule')).optional().or(z.literal(''))
    : z.string().regex(PASSWORD_REGEX, t('auth.passwordRule')),
});

// defaultRole / title: Students and Teachers open the same form pre-set to their role
const UserModal = ({ isOpen, onClose, onSubmit, user, isLoading, defaultRole = 'student', title }) => {
  const { t } = useTranslation();
  const isEdit = !!user;

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(userSchema(t, isEdit)),
    defaultValues: {
      name: '',
      email: '',
      role: defaultRole,
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
        role: defaultRole,
        status: 'active',
        password: '',
      });
    }
  }, [user, reset, isOpen, defaultRole]);

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={isEdit ? t('users.editUser') : title || t('users.newUser')}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('users.cancelBtn')}
          </Button>
          <Button type="submit" form="user-form" icon={Save} loading={isLoading}>
            {isEdit ? t('users.saveBtn') : t('users.createBtn')}
          </Button>
        </>
      }
    >
      <form id="user-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <FormField label={t('auth.fullName')} error={errors.name?.message}>
          {(id, describedBy, invalid) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              invalid={invalid}
              icon={UserIcon}
              type="text"
              placeholder={t('users.namePlaceholder')}
              {...register('name')}
            />
          )}
        </FormField>

        <FormField label={t('auth.email')} error={errors.email?.message}>
          {(id, describedBy, invalid) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              invalid={invalid}
              icon={Mail}
              type="email"
              placeholder={t('auth.emailPlaceholder')}
              {...register('email')}
            />
          )}
        </FormField>

        {/* Password (required for a new user, optional when editing) */}
        <FormField label={isEdit ? t('users.passwordOptional') : t('auth.password')} error={errors.password?.message}>
          {(id, describedBy, invalid) => (
            <div className="relative">
              <UserCheck
                aria-hidden="true"
                strokeWidth={1.6}
                className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-[1.05rem] w-[1.05rem] -translate-y-1/2 text-ink-subtle"
              />
              <PasswordInput
                id={id}
                aria-describedby={describedBy}
                aria-invalid={invalid || undefined}
                placeholder="••••••••"
                className="field field-icon"
                {...register('password')}
              />
            </div>
          )}
        </FormField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label={t('users.role')} error={errors.role?.message}>
            <div className="relative">
              <Shield
                aria-hidden="true"
                strokeWidth={1.6}
                className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-[1.05rem] w-[1.05rem] -translate-y-1/2 text-ink-subtle"
              />
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
          </FormField>

          <FormField label={t('users.status')} error={errors.status?.message}>
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
          </FormField>
        </div>
      </form>
    </Modal>
  );
};

export default UserModal;
