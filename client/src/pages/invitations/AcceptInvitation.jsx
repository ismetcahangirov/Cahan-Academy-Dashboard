import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { User, AlertOctagon, ArrowLeft } from 'lucide-react';
import { useLazyVerifyInvitationQuery } from '../../features/invitations/invitationsApi';
import { PASSWORD_REGEX, useRegisterViaInvitationMutation } from '../../features/auth/authApi';
import { toast } from 'react-hot-toast';
import { useTranslation, Trans } from 'react-i18next';
import Spinner from '../../components/common/Spinner';
import { Button, FormField, Input } from '../../components/ui';
import { ScriptTitle, OrnamentDivider } from '../../components/ornament';
import AuthLayout from '../auth/AuthLayout';
import AuthPasswordField from '../auth/AuthPasswordField';

const AcceptInvitation = () => {
  const { t } = useTranslation();
  const { token } = useParams();
  const navigate = useNavigate();

  const [verifyInvitation, { data: verifyData, isUninitialized, isFetching: isVerifying, isError }] = useLazyVerifyInvitationQuery();
  const [registerViaInvitation, { isLoading: isSubmitting }] = useRegisterViaInvitationMutation();

  const [formData, setFormData] = useState({
    name: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (token) {
      verifyInvitation(token);
    }
  }, [token, verifyInvitation]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!PASSWORD_REGEX.test(formData.password)) {
      return toast.error(t('auth.passwordRule'));
    }
    if (formData.password !== formData.confirmPassword) {
      return toast.error(t('acceptInvitation.passwordMismatch'));
    }

    try {
      await registerViaInvitation({
        token,
        name: formData.name.trim(),
        password: formData.password,
      }).unwrap();

      toast.success(t('acceptInvitation.successMessage'));
      navigate('/login');
    } catch (error) {
      toast.error(error?.data?.message || t('students.error'));
    }
  };

  if ((isUninitialized && token) || isVerifying) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center gap-4 py-16 text-center" role="status">
          <Spinner size="lg" />
          <p className="sc text-[0.9rem] text-ink-muted">{t('acceptInvitation.verifying')}</p>
        </div>
      </AuthLayout>
    );
  }

  if (isError || !verifyData?.success) {
    return (
      <AuthLayout>
        <div className="orn-rise flex flex-col items-center gap-4 text-center" role="alert">
          <span className="flex h-16 w-16 items-center justify-center rounded-full border-[1.5px] border-accent-text bg-accent-soft text-accent-text">
            <AlertOctagon size={28} strokeWidth={1.6} aria-hidden="true" />
          </span>
          <h1 className="text-[1.5rem] font-semibold leading-snug text-ink">{t('acceptInvitation.errorTitle')}</h1>
          <OrnamentDivider draw={false} />
          <p className="max-w-sm text-[1rem] text-ink-muted">{t('acceptInvitation.errorMessage')}</p>
          <Button as={Link} to="/login" variant="outline" icon={ArrowLeft} className="mt-2">
            {t('acceptInvitation.backToLogin')}
          </Button>
        </div>
      </AuthLayout>
    );
  }

  const role = verifyData.data.role === 'teacher' ? t('common.teacher') : t('common.student');

  return (
    <AuthLayout>
      <ScriptTitle align="center" size="page" title={t('acceptInvitation.welcomeTitle')} />
      <div className="orn-rise mt-4 text-center">
        <p className="text-[1.02rem] text-ink-muted">
          <Trans
            i18nKey="acceptInvitation.invitationText"
            values={{ role: role.toLowerCase() }}
            components={[<span key="role" className="font-semibold text-ink" />]}
          />
        </p>
        <p className="mt-1 text-[0.98rem] italic text-ink-muted">{verifyData.data.email}</p>
      </div>

      <form onSubmit={handleSubmit} className="orn-rise mt-8 space-y-5">
        <FormField label={t('acceptInvitation.fullNameLabel')} required>
          {(id, describedBy) => (
            <Input
              id={id}
              required
              type="text"
              autoComplete="name"
              icon={User}
              aria-describedby={describedBy}
              placeholder={t('acceptInvitation.fullNamePlaceholder')}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          )}
        </FormField>

        <AuthPasswordField
          label={t('acceptInvitation.passwordLabel')}
          required
          autoComplete="new-password"
          placeholder="••••••••"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        />
        <AuthPasswordField
          label={t('acceptInvitation.confirmPasswordLabel')}
          required
          autoComplete="new-password"
          placeholder="••••••••"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
        />

        <div className="pt-2">
          <Button type="submit" size="lg" block loading={isSubmitting} motif>
            {t('acceptInvitation.completeBtn')}
          </Button>
        </div>
      </form>

      <p className="sc mt-8 text-center text-[0.8rem] text-ink-subtle">Cahan Academy &copy; {new Date().getFullYear()}</p>
    </AuthLayout>
  );
};

export default AcceptInvitation;
