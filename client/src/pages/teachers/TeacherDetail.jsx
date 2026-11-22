import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, User as UserIcon, Mail, BookOpen, Calendar, Clock, Users, Wifi, WifiOff } from 'lucide-react';
import { useGetTeacherByIdQuery } from '../../features/teachers/teachersApi';
import Avatar from '../../components/common/Avatar';
import Spinner from '../../components/common/Spinner';
import { formatDays } from '../../utils/days';
import { formatDate } from '../../utils/formatDate';
import { Badge, Button, Card, EmptyState, PageShell, Section, StatCard, StatusPill } from '../../components/ui';
import OrnateFrame from '../../components/ornament/OrnateFrame';
import { USER_STATUS } from '../users/peopleStatus';

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 border-b border-line-hair py-3 last:border-0">
    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line-strong text-accent-text">
      <Icon size={16} strokeWidth={1.5} aria-hidden="true" />
    </span>
    <div className="min-w-0">
      <p className="sc text-[0.8rem] text-ink-muted">{label}</p>
      <p className="break-words font-medium text-ink">{value ?? '—'}</p>
    </div>
  </div>
);

const GROUP_STATUS = { active: 'success', completed: 'neutral' };

const GroupCard = ({ group }) => {
  const { t } = useTranslation();
  const days = formatDays(group?.schedule?.days, t);
  const time = group?.schedule?.startTime
    ? `${group.schedule.startTime}${group.schedule.endTime ? ' – ' + group.schedule.endTime : ''}`
    : null;
  const isOnline = group?.schedule?.type === 'online';

  return (
    <Card className="flex items-start gap-4 p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line-strong text-accent-text">
        <BookOpen size={18} strokeWidth={1.5} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate font-semibold text-ink">{group.name}</span>
          {group.status && <StatusPill status={GROUP_STATUS[group.status] || 'neutral'}>{group.status}</StatusPill>}
          {group?.schedule?.type && (
            <Badge className="inline-flex items-center gap-1">
              {isOnline ? <Wifi size={11} aria-hidden="true" /> : <WifiOff size={11} aria-hidden="true" />}
              {isOnline ? t('groups.online') : t('groups.offline')}
            </Badge>
          )}
        </div>
        {group.course && <p className="mt-0.5 text-sm text-ink-muted">{group.course}</p>}
        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-muted">
          {days && <p>{days}</p>}
          {time && <p className="time-italic">{time}</p>}
        </div>
      </div>
      <div className="num flex shrink-0 items-center gap-1 text-sm text-ink-muted">
        <Users size={14} aria-hidden="true" />
        {group?.students?.length ?? 0}
      </div>
    </Card>
  );
};

const TeacherDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data, isLoading, isError } = useGetTeacherByIdQuery(id);
  const teacher = data?.data || data?.teacher || data;

  const fmt = (date) => formatDate(date, 'dd MMMM yyyy') || '—';

  const groups = teacher?.groups || [];
  const active = groups.filter((g) => g.status === 'active').length;
  const completed = groups.filter((g) => g.status === 'completed').length;
  const students = groups.reduce((s, g) => s + (g.students?.length ?? 0), 0);

  const back = (
    <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={() => navigate(-1)}>
      {t('detail.back')}
    </Button>
  );

  if (isLoading) {
    return (
      <PageShell width="narrow">
        {back}
        <div className="flex items-center justify-center py-24">
          <Spinner />
        </div>
      </PageShell>
    );
  }
  if (isError || !teacher) {
    return (
      <PageShell width="narrow">
        {back}
        <EmptyState sketch="notebook" title={t('detail.notFound')} />
      </PageShell>
    );
  }

  return (
    <PageShell width="narrow" title={teacher.name} subtitle={t('common.teacher')} actions={back}>
      <OrnateFrame className="p-6" corners="diagonal">
        <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
          <Avatar src={teacher.avatar} name={teacher.name} className="h-24 w-24 shrink-0" textSize="2xl" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg text-ink-muted">{teacher.email}</p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <StatusPill status={USER_STATUS[teacher.status] || 'neutral'}>
                {teacher.status === 'active' ? t('students.active') : t('students.inactive')}
              </StatusPill>
              <Badge className="inline-flex items-center gap-1">
                <BookOpen size={12} aria-hidden="true" />
                <span className="num">{groups.length}</span> {t('teachers.tableGroups')}
              </Badge>
            </div>
          </div>
        </div>
      </OrnateFrame>

      {groups.length > 0 && (
        <div className="orn-stagger grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label={t('detail.totalGroups')} value={groups.length} />
          <StatCard label={t('detail.activeGroups')} value={active} />
          <StatCard label={t('detail.completedGroups')} value={completed} />
          <StatCard label={t('detail.totalStudents')} value={students} />
        </div>
      )}

      <Section title={`${t('detail.groups')} (${groups.length})`}>
        {groups.length === 0 ? (
          <Card>
            <EmptyState compact sketch="books" title={t('detail.noGroups')} />
          </Card>
        ) : (
          <div className="space-y-3">
            {groups.map((g) => (
              <GroupCard key={g._id} group={g} />
            ))}
          </div>
        )}
      </Section>

      <Section title={t('detail.info')} variant="paper">
        <InfoRow icon={UserIcon} label={t('detail.name')} value={teacher.name} />
        <InfoRow icon={Mail} label={t('detail.email')} value={teacher.email} />
        <InfoRow icon={Users} label={t('teachers.tableGroups')} value={String(groups.length)} />
        <InfoRow icon={Calendar} label={t('detail.createdAt')} value={fmt(teacher.createdAt)} />
        <InfoRow icon={Clock} label={t('detail.updatedAt')} value={fmt(teacher.updatedAt)} />
      </Section>
    </PageShell>
  );
};

export default TeacherDetail;
