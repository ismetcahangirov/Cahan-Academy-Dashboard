import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, User as UserIcon, Mail, BookOpen, Calendar, Clock, Users, Wifi, WifiOff } from 'lucide-react';
import { useGetStudentByIdQuery, useGetStudentAttendanceStatsQuery } from '../../features/students/studentsApi';
import Avatar from '../../components/common/Avatar';
import Spinner from '../../components/common/Spinner';
import { formatDays } from '../../utils/days';
import { formatDate } from '../../utils/formatDate';
import { Badge, Button, Card, EmptyState, PageShell, Section, StatusPill } from '../../components/ui';
import { StatusDot } from '../../components/ui';
import OrnateFrame from '../../components/ornament/OrnateFrame';
import CornerFlourish from '../../components/ornament/CornerFlourish';
import { USER_STATUS } from '../users/PeopleBits';

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

// Attendance figure: dot (same non-colour pattern as the bar) + small-caps label + number
const AttendanceStat = ({ status, label, value }) => (
  <Card className="relative p-4">
    <CornerFlourish corner="tr" className="absolute right-2 top-2 h-5 w-5" />
    <div className="flex items-center gap-2">
      <StatusDot status={status} />
      <p className="sc text-[0.8rem] text-ink-muted">{label}</p>
    </div>
    <p className="num mt-1 text-[2rem] font-semibold leading-none text-ink">{value}</p>
  </Card>
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
        {group.teacher && (
          <p className="mt-0.5 text-sm text-ink-muted">
            {t('teachers.pageTitle')}: {group.teacher?.name || '—'}
          </p>
        )}
        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-muted">
          {days && <p>{days}</p>}
          {time && <p className="time-italic">{time}</p>}
        </div>
      </div>
    </Card>
  );
};

const StudentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { data: studentData, isLoading, isError } = useGetStudentByIdQuery(id);
  const { data: statsData, isLoading: statsLoading } = useGetStudentAttendanceStatsQuery(id);

  const student = studentData?.data || studentData?.student || studentData;
  const stats = statsData?.data || statsData;

  const present = stats?.present ?? 0;
  const absent = stats?.absent ?? 0;
  const late = stats?.late ?? 0;
  const total = present + absent + late;
  const attendanceRate = total > 0 ? Math.round((present / total) * 100) : null;

  const fmt = (date) => formatDate(date, 'dd MMMM yyyy') || '—';
  const groups = student?.groups || [];

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
  if (isError || !student) {
    return (
      <PageShell width="narrow">
        {back}
        <EmptyState sketch="notebook" title={t('detail.notFound')} />
      </PageShell>
    );
  }

  return (
    <PageShell width="narrow" title={student.name} subtitle={t('common.student')} actions={back}>
      <OrnateFrame className="p-6" corners="diagonal">
        <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
          <Avatar src={student.avatar} name={student.name} className="h-24 w-24 shrink-0" textSize="2xl" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg text-ink-muted">{student.email}</p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <StatusPill status={USER_STATUS[student.status] || 'neutral'}>
                {student.status === 'active' ? t('students.active') : t('students.inactive')}
              </StatusPill>
              <Badge className="inline-flex items-center gap-1">
                <Users size={12} aria-hidden="true" />
                <span className="num">{groups.length}</span> {t('students.tableGroup')}
              </Badge>
            </div>
          </div>
        </div>
      </OrnateFrame>

      {!statsLoading && (
        <Section
          title={t('detail.attendance')}
          actions={
            attendanceRate !== null && (
              <Badge tone="accent" className="num">
                {attendanceRate}% {t('detail.rate')}
              </Badge>
            )
          }
        >
          {/* present = solid, late = striped, absent = outline */}
          {total > 0 && (
            <div
              className="mb-4 flex h-3 overflow-hidden rounded-full border border-line-strong"
              role="img"
              aria-label={`${t('attendance.present')} ${present}, ${t('attendance.late')} ${late}, ${t('attendance.absent')} ${absent}`}
            >
              <div style={{ width: `${(present / total) * 100}%` }} className="bg-accent-text" />
              <div
                style={{
                  width: `${(late / total) * 100}%`,
                  backgroundImage:
                    'repeating-linear-gradient(135deg, var(--accent-text) 0 3px, transparent 3px 6px)',
                }}
              />
              <div style={{ width: `${(absent / total) * 100}%` }} />
            </div>
          )}
          <div className="orn-stagger grid grid-cols-3 gap-3">
            <AttendanceStat status="present" label={t('attendance.present')} value={present} />
            <AttendanceStat status="late" label={t('attendance.late')} value={late} />
            <AttendanceStat status="absent" label={t('attendance.absent')} value={absent} />
          </div>
        </Section>
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
        <InfoRow icon={UserIcon} label={t('detail.name')} value={student.name} />
        <InfoRow icon={Mail} label={t('detail.email')} value={student.email} />
        <InfoRow icon={Calendar} label={t('detail.createdAt')} value={fmt(student.createdAt)} />
        <InfoRow icon={Clock} label={t('detail.updatedAt')} value={fmt(student.updatedAt)} />
      </Section>
    </PageShell>
  );
};

export default StudentDetail;
