import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  User as UserIcon,
  Mail,
  Shield,
  Calendar,
  Clock,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useGetUserByIdQuery } from '../../features/users/userApi';
import { cn } from '../../lib/utils';

const RoleBadge = ({ role }) => {
  const { t } = useTranslation();
  const styles = {
    admin: 'bg-red-500/10 text-red-500 border-red-500/20',
    teacher: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    student: 'bg-green-500/10 text-green-500 border-green-500/20',
  };
  const labels = {
    admin: t('common.admin'),
    teacher: t('common.teacher'),
    student: t('common.student'),
  };
  return (
    <span
      className={cn(
        'px-3 py-1 rounded-full text-sm font-medium border capitalize',
        styles[role] || styles.student
      )}
    >
      {labels[role] || role}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const { t } = useTranslation();
  const isActive = status === 'active';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border',
        isActive
          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
          : 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'
      )}
    >
      <span className={cn('w-2 h-2 rounded-full', isActive ? 'bg-emerald-500' : 'bg-zinc-500')} />
      {isActive ? t('students.active') : t('students.inactive')}
    </span>
  );
};

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 py-3 border-b border-[var(--border)] last:border-0">
    <div className="p-2 rounded-lg bg-[var(--muted)] shrink-0 mt-0.5">
      <Icon size={15} className="text-[var(--muted-foreground)]" />
    </div>
    <div>
      <p className="text-xs text-[var(--muted-foreground)]/60 font-medium uppercase tracking-wider mb-0.5">
        {label}
      </p>
      <p className="text-sm text-[var(--foreground)] font-medium">{value || '—'}</p>
    </div>
  </div>
);

const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const { data, isLoading, isError } = useGetUserByIdQuery(id);

  const user = data?.user || data;

  const formatDate = (date) => {
    if (!date) return '—';
    const lang = i18n.resolvedLanguage || i18n.language;
    const locale = lang.startsWith('ru') ? 'ru-RU' : lang.startsWith('az') ? 'az-AZ' : 'en-US';
    return new Date(date).toLocaleDateString(locale, {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors text-sm font-medium"
      >
        <ArrowLeft size={16} />
        {t('detail.back')}
      </button>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={36} className="animate-spin text-bordo" />
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-[var(--muted-foreground)]/60">
          <AlertCircle size={40} className="opacity-40" />
          <p>{t('detail.notFound')}</p>
        </div>
      )}

      {/* Content */}
      {!isLoading && !isError && user && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          {/* Header card */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <img
              src={
                user.avatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=7B001C&color=fff&size=128`
              }
              alt={user.name}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-[var(--border)] shadow-lg"
            />
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-[var(--foreground)] truncate">{user.name}</h1>
              <p className="text-[var(--muted-foreground)]/60 text-sm mt-0.5 truncate">
                {user.email}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <RoleBadge role={user.role} />
                <StatusBadge status={user.status} />
              </div>
            </div>
          </div>

          {/* Details card */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-[var(--foreground)] uppercase tracking-wider mb-4">
              {t('detail.info')}
            </h2>
            <InfoRow icon={UserIcon} label={t('detail.name')} value={user.name} />
            <InfoRow icon={Mail} label={t('detail.email')} value={user.email} />
            <InfoRow icon={Shield} label={t('users.role')} value={user.role} />
            <InfoRow icon={Calendar} label={t('detail.createdAt')} value={formatDate(user.createdAt)} />
            <InfoRow icon={Clock} label={t('detail.updatedAt')} value={formatDate(user.updatedAt)} />
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default UserDetail;
