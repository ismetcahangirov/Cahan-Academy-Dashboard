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
  Users,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useGetTeacherByIdQuery } from '../../features/teachers/teachersApi';
import { cn } from '../../lib/utils';

/* ─── Helpers ────────────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  const { t } = useTranslation();
  const isActive = status === 'active';
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border',
      isActive
        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
        : 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'
    )}>
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
      <p className="text-xs text-[var(--muted-foreground)]/60 font-medium uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-sm text-[var(--foreground)] font-medium">{value ?? '—'}</p>
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
  const studentCount = group?.students?.length ?? 0;

  return (
    <div className="flex items-start gap-4 p-4 rounded-xl bg-[var(--muted)]/30 border border-[var(--border)] hover:bg-[var(--muted)]/60 transition-all">
      <div className="p-2.5 rounded-xl bg-blue-500/10 shrink-0">
        <BookOpen size={18} className="text-blue-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-[var(--foreground)] text-sm truncate">{group.name}</span>
          {group.status && (
            <span className={cn(
              'text-xs px-2 py-0.5 rounded-full border font-medium',
              group.status === 'active'
                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                : group.status === 'completed'
                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
            )}>
              {group.status}
            </span>
          )}
          {group?.schedule?.type && (
            <span className={cn(
              'text-xs px-2 py-0.5 rounded-full border font-medium inline-flex items-center gap-1',
              isOnline
                ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            )}>
              {isOnline ? <Wifi size={10} /> : <WifiOff size={10} />}
              {isOnline ? t('groups.online') : t('groups.offline')}
            </span>
          )}
        </div>
        {group.course && (
          <p className="text-xs text-[var(--muted-foreground)]/60 mt-0.5">{group.course}</p>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
          {days && <p className="text-xs text-[var(--muted-foreground)]/50">{days}</p>}
          {time && <p className="text-xs text-[var(--muted-foreground)]/50">{time}</p>}
        </div>
      </div>
      {/* Student count */}
      <div className="flex items-center gap-1.5 shrink-0 text-[var(--muted-foreground)]/60 text-xs">
        <Users size={13} />
        {studentCount}
      </div>
    </div>
  );
};

/* ─── Stats summary card ─────────────────────────────────────── */
const MiniStat = ({ label, value, color }) => (
  <div className="flex flex-col items-center gap-1 flex-1">
    <span className={cn('text-2xl font-bold', color)}>{value}</span>
    <span className="text-xs text-[var(--muted-foreground)]/60 text-center">{label}</span>
  </div>
);

/* ─── Page ───────────────────────────────────────────────────── */
const TeacherDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const { data, isLoading, isError } = useGetTeacherByIdQuery(id);
  const teacher = data?.data || data?.teacher || data;

  const formatDate = (date) => {
    if (!date) return '—';
    const lang = i18n.resolvedLanguage || i18n.language;
    const locale = lang.startsWith('ru') ? 'ru-RU' : lang.startsWith('az') ? 'az-AZ' : 'en-US';
    return new Date(date).toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const groups = teacher?.groups || [];
  const activeGroups    = groups.filter(g => g.status === 'active').length;
  const completedGroups = groups.filter(g => g.status === 'completed').length;
  const totalStudents   = groups.reduce((sum, g) => sum + (g.students?.length ?? 0), 0);

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

      {!isLoading && !isError && teacher && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

          {/* Profile header */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <img
              src={teacher.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(teacher.name || 'T')}&background=7B001C&color=fff&size=128`}
              alt={teacher.name}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-[var(--border)] shadow-lg"
            />
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-[var(--foreground)] truncate">{teacher.name}</h1>
              <p className="text-[var(--muted-foreground)]/60 text-sm mt-0.5 truncate">{teacher.email}</p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <StatusBadge status={teacher.status} />
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border bg-[var(--muted)] text-[var(--muted-foreground)] border-[var(--border)]">
                  <BookOpen size={12} />
                  {groups.length} {t('teachers.tableGroups')}
                </span>
              </div>
            </div>
          </div>

          {/* Quick stats */}
          {groups.length > 0 && (
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5">
              <div className="flex divide-x divide-[var(--border)]">
                <MiniStat label={t('detail.totalGroups')}     value={groups.length}   color="text-[var(--foreground)]" />
                <MiniStat label={t('detail.activeGroups')}    value={activeGroups}    color="text-emerald-400" />
                <MiniStat label={t('detail.completedGroups')} value={completedGroups} color="text-blue-400" />
                <MiniStat label={t('detail.totalStudents')}   value={totalStudents}   color="text-amber-400" />
              </div>
            </div>
          )}

          {/* Groups list */}
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
            <InfoRow icon={UserIcon} label={t('detail.name')}      value={teacher.name} />
            <InfoRow icon={Mail}     label={t('detail.email')}     value={teacher.email} />
            <InfoRow icon={Users}    label={t('teachers.tableGroups')} value={String(groups.length)} />
            <InfoRow icon={Calendar} label={t('detail.createdAt')} value={formatDate(teacher.createdAt)} />
            <InfoRow icon={Clock}    label={t('detail.updatedAt')} value={formatDate(teacher.updatedAt)} />
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default TeacherDetail;
