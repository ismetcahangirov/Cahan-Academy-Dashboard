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
  CheckCircle,
  XCircle,
  TrendingUp,
  Users,
  Wifi,
  WifiOff,
} from 'lucide-react';
import {
  useGetStudentByIdQuery,
  useGetStudentAttendanceStatsQuery,
} from '../../features/students/studentsApi';
import { cn } from '../../lib/utils';
import Avatar from '../../components/common/Avatar';
import Spinner from '../../components/common/Spinner';

/* ─── Helpers ─────────────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  const { t } = useTranslation();
  const isActive = status === 'active';
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border',
      isActive
        ? 'bg-bordo/10 text-bordo border-bordo/30'
        : 'bg-[var(--muted)] text-[var(--muted-foreground)] border-[var(--border)]'
    )}>
      <span className={cn('w-2 h-2 rounded-full', isActive ? 'bg-bordo' : 'bg-[var(--muted-foreground)]')} />
      {isActive ? t('students.active') : t('students.inactive')}
    </span>
  );
};

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 py-3 border-b border-[var(--border)] last:border-0">
    <div className="p-2 rounded-lg bg-bordo/8 shrink-0 mt-0.5">
      <Icon size={15} className="text-bordo" />
    </div>
    <div>
      <p className="text-xs text-[var(--muted-foreground)]/60 font-medium uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-sm text-[var(--foreground)] font-medium">{value ?? '—'}</p>
    </div>
  </div>
);

const StatCard = ({ icon: Icon, label, value, dimmed }) => (
  <div className={cn(
    'border border-[var(--border)] rounded-xl p-4 flex items-center gap-3',
    dimmed ? 'bg-[var(--muted)]/30' : 'bg-bordo/8'
  )}>
    <div className={cn('p-2.5 rounded-xl', dimmed ? 'bg-[var(--muted)]' : 'bg-bordo/15')}>
      <Icon size={18} className={dimmed ? 'text-[var(--muted-foreground)]' : 'text-bordo'} />
    </div>
    <div>
      <p className="text-xs text-[var(--muted-foreground)]/60">{label}</p>
      <p className="text-2xl font-bold text-[var(--foreground)]">{value}</p>
    </div>
  </div>
);

const GroupCard = ({ group }) => {
  const { t } = useTranslation();
  const days = group?.schedule?.days?.join(', ') || '';
  const time = group?.schedule?.startTime
    ? `${group.schedule.startTime}${group.schedule.endTime ? ' – ' + group.schedule.endTime : ''}`
    : null;
  const isOnline = group?.schedule?.type === 'online';

  return (
    <div className="flex items-start gap-4 p-4 rounded-xl bg-[var(--muted)]/30 border border-[var(--border)] hover:bg-bordo/5 transition-all">
      <div className="p-2.5 rounded-xl bg-bordo/10 shrink-0">
        <BookOpen size={18} className="text-bordo" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-[var(--foreground)] text-sm truncate">{group.name}</span>
          {group.status && (
            <span className={cn(
              'text-xs px-2 py-0.5 rounded-full border font-medium',
              group.status === 'active'
                ? 'bg-bordo/10 text-bordo border-bordo/30'
                : 'bg-[var(--muted)] text-[var(--muted-foreground)] border-[var(--border)]'
            )}>
              {group.status}
            </span>
          )}
          {group?.schedule?.type && (
            <span className="text-xs px-2 py-0.5 rounded-full border font-medium inline-flex items-center gap-1 bg-[var(--muted)] text-[var(--muted-foreground)] border-[var(--border)]">
              {isOnline ? <Wifi size={10} /> : <WifiOff size={10} />}
              {isOnline ? t('groups.online') : t('groups.offline')}
            </span>
          )}
        </div>
        {group.course && (
          <p className="text-xs text-[var(--muted-foreground)]/60 mt-0.5">{group.course}</p>
        )}
        {group.teacher && (
          <p className="text-xs text-[var(--muted-foreground)]/60 mt-0.5">
            {t('teachers.pageTitle')}: {group.teacher?.name || '—'}
          </p>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
          {days && <p className="text-xs text-[var(--muted-foreground)]/50">{days}</p>}
          {time && <p className="text-xs text-[var(--muted-foreground)]/50">{time}</p>}
        </div>
      </div>
    </div>
  );
};

/* ─── Page ────────────────────────────────────────────────────── */
const StudentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const { data: studentData, isLoading, isError } = useGetStudentByIdQuery(id);
  const { data: statsData, isLoading: statsLoading } = useGetStudentAttendanceStatsQuery(id);

  const student = studentData?.data || studentData?.student || studentData;
  const stats   = statsData?.data || statsData;

  const present = stats?.present ?? 0;
  const absent  = stats?.absent  ?? 0;
  const late    = stats?.late    ?? 0;
  const total   = present + absent + late;
  const attendanceRate = total > 0 ? Math.round((present / total) * 100) : null;

  const formatDate = (date) => {
    if (!date) return '—';
    const lang   = i18n.resolvedLanguage || i18n.language;
    const locale = lang.startsWith('ru') ? 'ru-RU' : lang.startsWith('az') ? 'az-AZ' : 'en-US';
    return new Date(date).toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const groups = student?.groups || [];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-[var(--muted-foreground)] hover:text-bordo transition-colors text-sm font-medium"
      >
        <ArrowLeft size={16} />
        {t('detail.back')}
      </button>

      {isLoading && (
        <div className="flex items-center justify-center py-24">
          <Spinner />
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-[var(--muted-foreground)]/60">
          <AlertCircle size={40} className="text-bordo opacity-40" />
          <p>{t('detail.notFound')}</p>
        </div>
      )}

      {!isLoading && !isError && student && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

          {/* Profile header */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <Avatar
              src={student.avatar}
              name={student.name}
              className="w-20 h-20 rounded-2xl border-2 border-bordo/30 shadow-lg"
              textSize="2xl"
            />
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-[var(--foreground)] truncate">{student.name}</h1>
              <p className="text-[var(--muted-foreground)]/60 text-sm mt-0.5 truncate">{student.email}</p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <StatusBadge status={student.status} />
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border bg-[var(--muted)] text-[var(--muted-foreground)] border-[var(--border)]">
                  <Users size={12} />
                  {groups.length} {t('students.tableGroup')}
                </span>
              </div>
            </div>
          </div>

          {/* Attendance stats */}
          {!statsLoading && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[var(--foreground)] uppercase tracking-wider">
                  {t('detail.attendance')}
                </h2>
                {attendanceRate !== null && (
                  <span className="text-sm font-bold px-3 py-1 rounded-full bg-bordo/10 text-bordo">
                    {attendanceRate}% {t('detail.rate')}
                  </span>
                )}
              </div>

              {/* Progress bar: present=bordo, late=bordo/50, absent=muted */}
              {total > 0 && (
                <div className="h-2 rounded-full bg-[var(--muted)] overflow-hidden flex">
                  <div style={{ width: `${(present / total) * 100}%` }} className="bg-bordo transition-all" />
                  <div style={{ width: `${(late / total) * 100}%` }}    className="bg-bordo/40 transition-all" />
                  <div style={{ width: `${(absent / total) * 100}%` }}  className="bg-[var(--muted-foreground)]/20 transition-all" />
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <StatCard icon={CheckCircle} label={t('attendance.present')} value={present} />
                <StatCard icon={TrendingUp}  label={t('attendance.late')}    value={late}    dimmed />
                <StatCard icon={XCircle}     label={t('attendance.absent')}  value={absent}  dimmed />
              </div>
            </div>
          )}

          {/* Groups */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-[var(--foreground)] uppercase tracking-wider mb-4">
              {t('detail.groups')} ({groups.length})
            </h2>
            {groups.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]/50 py-4 text-center">{t('detail.noGroups')}</p>
            ) : (
              <div className="space-y-3">
                {groups.map((g) => <GroupCard key={g._id} group={g} />)}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-[var(--foreground)] uppercase tracking-wider mb-4">{t('detail.info')}</h2>
            <InfoRow icon={UserIcon} label={t('detail.name')}      value={student.name} />
            <InfoRow icon={Mail}     label={t('detail.email')}     value={student.email} />
            <InfoRow icon={Calendar} label={t('detail.createdAt')} value={formatDate(student.createdAt)} />
            <InfoRow icon={Clock}    label={t('detail.updatedAt')} value={formatDate(student.updatedAt)} />
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default StudentDetail;
