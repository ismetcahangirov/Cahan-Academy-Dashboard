import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  User as UserIcon,
  Mail,
  BookOpen,
  Calendar,
  Clock,
  AlertCircle,
  Loader2,
  CheckCircle,
  XCircle,
  TrendingUp,
} from 'lucide-react';
import { useGetStudentByIdQuery } from '../../features/students/studentsApi';
import { cn } from '../../lib/utils';

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

const InfoRow = ({ icon: Icon, label, value, valueClass }) => (
  <div className="flex items-start gap-3 py-3 border-b border-[var(--border)] last:border-0">
    <div className="p-2 rounded-lg bg-[var(--muted)] shrink-0 mt-0.5">
      <Icon size={15} className="text-[var(--muted-foreground)]" />
    </div>
    <div>
      <p className="text-xs text-[var(--muted-foreground)]/60 font-medium uppercase tracking-wider mb-0.5">
        {label}
      </p>
      <p className={cn('text-sm font-medium', valueClass || 'text-[var(--foreground)]')}>
        {value || '—'}
      </p>
    </div>
  </div>
);

const StatCard = ({ icon: Icon, label, value, color, bg }) => (
  <div className="bg-[var(--muted)]/40 border border-[var(--border)] rounded-xl p-4 flex items-center gap-3">
    <div className={cn('p-2.5 rounded-xl', bg)}>
      <Icon size={18} className={color} />
    </div>
    <div>
      <p className="text-xs text-[var(--muted-foreground)]/60">{label}</p>
      <p className="text-xl font-bold text-[var(--foreground)]">{value}</p>
    </div>
  </div>
);

const StudentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const { data, isLoading, isError } = useGetStudentByIdQuery(id);

  // API may return { student: {...} } or the object directly
  const student = data?.student || data?.data || data;

  const formatDate = (date) => {
    if (!date) return '—';
    const lang = i18n.resolvedLanguage || i18n.language;
    const locale = lang.startsWith('ru') ? 'ru-RU' : lang.startsWith('az') ? 'az-AZ' : 'en-US';
    return new Date(date).toLocaleDateString(locale, {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  // Attendance stats from student data (if backend includes them)
  const attendance = student?.attendanceStats || null;
  const presentCount = attendance?.present ?? student?.presentCount ?? null;
  const absentCount = attendance?.absent ?? student?.absentCount ?? null;
  const lateCount = attendance?.late ?? student?.lateCount ?? null;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors text-sm font-medium"
      >
        <ArrowLeft size={16} />
        {t('detail.back')}
      </button>

      {isLoading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={36} className="animate-spin text-bordo" />
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-[var(--muted-foreground)]/60">
          <AlertCircle size={40} className="opacity-40" />
          <p>{t('detail.notFound')}</p>
        </div>
      )}

      {!isLoading && !isError && student && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          {/* Profile header */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <img
              src={
                student.avatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name || 'S')}&background=7B001C&color=fff&size=128`
              }
              alt={student.name}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-[var(--border)] shadow-lg"
            />
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-[var(--foreground)] truncate">
                {student.name}
              </h1>
              <p className="text-[var(--muted-foreground)]/60 text-sm mt-0.5 truncate">
                {student.email}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <StatusBadge status={student.status} />
                {student.group && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border bg-blue-500/10 text-blue-400 border-blue-500/20">
                    <BookOpen size={12} />
                    {student.group}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Attendance stats — shown only if data available */}
          {(presentCount !== null || absentCount !== null || lateCount !== null) && (
            <div className="grid grid-cols-3 gap-3">
              <StatCard
                icon={CheckCircle}
                label={t('attendance.present')}
                value={presentCount ?? 0}
                color="text-emerald-400"
                bg="bg-emerald-500/10"
              />
              <StatCard
                icon={XCircle}
                label={t('attendance.absent')}
                value={absentCount ?? 0}
                color="text-red-400"
                bg="bg-red-500/10"
              />
              <StatCard
                icon={TrendingUp}
                label={t('attendance.late')}
                value={lateCount ?? 0}
                color="text-amber-400"
                bg="bg-amber-500/10"
              />
            </div>
          )}

          {/* Info card */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-[var(--foreground)] uppercase tracking-wider mb-4">
              {t('detail.info')}
            </h2>
            <InfoRow icon={UserIcon} label={t('detail.name')} value={student.name} />
            <InfoRow icon={Mail} label={t('detail.email')} value={student.email} />
            <InfoRow
              icon={BookOpen}
              label={t('students.tableGroup')}
              value={student.group || t('students.noGroup')}
            />
            <InfoRow
              icon={Calendar}
              label={t('detail.createdAt')}
              value={formatDate(student.createdAt)}
            />
            <InfoRow
              icon={Clock}
              label={t('detail.updatedAt')}
              value={formatDate(student.updatedAt)}
            />
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default StudentDetail;
