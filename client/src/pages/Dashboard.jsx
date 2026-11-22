import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../features/auth/authSlice';
import { Users, GraduationCap, BookOpen, Clock, TrendingUp, Banknote, ArrowRight } from 'lucide-react';
import { useGetStatsQuery, useGetActivitiesQuery } from '../features/dashboard/dashboardApi';
import { useGetMyPaymentsQuery } from '../features/payments/paymentsApi';
import { useTranslation } from 'react-i18next';
import { formatDate } from '../utils/formatDate';
import { notificationText } from '../features/notifications/notificationText';
import { Badge, Button, Card, CardHeader, EmptyState, Skeleton, StatCard, StatusPill } from '../components/ui';
import { LaceEdge, ScriptTitle, Timeline, TimelineItem, WaveEdge } from '../components/ornament';
import ActivityChart from './dashboard/ActivityChart';
import TodayAgenda from './dashboard/TodayAgenda';

const formatHours = (hours, t, language) =>
  t('dashboard.hoursValue', {
    value: new Intl.NumberFormat(language || undefined, { maximumFractionDigits: 1 }).format(hours || 0),
  });

const trendProps = (trend, label) => {
  if (typeof trend !== 'number') return {};
  return {
    trend: trend > 0 ? 'up' : trend < 0 ? 'down' : 'flat',
    trendLabel: `${trend > 0 ? '+' : ''}${trend}%`,
    hint: label,
  };
};

const StatSkeleton = () => (
  <div className="card-ornate p-5 sm:p-6" aria-hidden="true">
    <div className="flex items-start gap-4">
      <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2.5">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-3.5 w-32" />
      </div>
    </div>
  </div>
);

// ─── Recent activity: newest notifications as a timeline ──────────────────────
const ActivityFeed = ({ activities, isLoading }) => {
  const { t, i18n } = useTranslation();
  const today = new Date();

  const stamp = (time) => {
    const date = new Date(time);
    return date.toDateString() === today.toDateString() ? formatDate(date, 'HH:mm') : formatDate(date, 'd MMM');
  };

  return (
    <Card className="flex h-full flex-col p-5 sm:p-6">
      <CardHeader
        title={t('dashboard.recentActivity')}
        actions={
          activities.length > 0 && (
            <Button as={Link} to="/notifications" variant="ghost" size="sm">
              {t('dashboard.viewAll')}
              <ArrowRight aria-hidden="true" />
            </Button>
          )
        }
      />

      <div className="mt-5 flex-1">
        {isLoading ? (
          <div className="space-y-5" aria-busy="true">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-4 w-12" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length > 0 ? (
          <Timeline className="-mb-6">
            {activities.map((activity, index) => {
              const translated = activity.key ? notificationText(activity, t, i18n) : null;
              return (
                <TimelineItem
                  key={activity.id}
                  time={stamp(activity.time)}
                  title={translated?.title || activity.message}
                  meta={translated?.title ? translated.message : undefined}
                  state={index === 0 ? 'current' : 'done'}
                />
              );
            })}
          </Timeline>
        ) : (
          <EmptyState compact sketch="notebook" title={t('dashboard.noActivity')} />
        )}
      </div>
    </Card>
  );
};

// ─── Student payment widget ───────────────────────────────────────────────────
const PaymentWidget = () => {
  const { t } = useTranslation();
  const { data, isLoading } = useGetMyPaymentsQuery();
  const payments = data?.data ?? [];

  const header = (
    <CardHeader
      title={
        <span className="flex items-center gap-2.5">
          <Banknote size={19} strokeWidth={1.5} aria-hidden="true" className="text-accent-text" />
          {t('payments.title')}
        </span>
      }
    />
  );

  if (isLoading) {
    return (
      <Card className="space-y-3 p-5 sm:p-6" aria-busy="true">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-12 w-full rounded-[var(--radius-md)]" />
      </Card>
    );
  }

  if (payments.length === 0) {
    return (
      <Card className="p-5 sm:p-6">
        {header}
        <p className="mt-3 text-[0.98rem] text-ink-muted">{t('payments.noActivePayments')}</p>
      </Card>
    );
  }

  // Most relevant entries across all plans
  const allEntries = payments.flatMap((plan) => plan.history.map((h) => ({ ...h, planAmount: plan.amount })));
  const overdue = allEntries.filter((e) => e.status === 'overdue');
  const pending = allEntries
    .filter((e) => e.status === 'pending')
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  const nextDue = pending[0];

  return (
    <Card className="p-5 sm:p-6">
      {header}

      <div className="mt-4 space-y-3">
        {overdue.length > 0 && (
          <StatusPill status="error">{t('payments.overdueAlert', { count: overdue.length })}</StatusPill>
        )}

        {nextDue ? (
          <div className="flex items-center justify-between gap-4 rounded-[var(--radius-md)] border border-line bg-surface-2 px-4 py-3">
            <div>
              <p className="sc text-[0.75rem] text-ink-muted">{t('payments.nextPayment')}</p>
              <p className="num mt-0.5 text-[1.25rem] font-semibold text-ink">{nextDue.planAmount} AZN</p>
            </div>
            <p className="time-italic text-right text-[1rem] text-accent-text">{formatDate(nextDue.dueDate, 'd MMMM yyyy')}</p>
          </div>
        ) : (
          overdue.length === 0 && <StatusPill status="success">{t('payments.allPaid')}</StatusPill>
        )}
      </div>
    </Card>
  );
};

// ─── Hero: greeting + today's agenda on a wine band ──────────────────────────
const DashboardHero = ({ user }) => {
  const { t } = useTranslation();
  const firstName = user?.name?.trim().split(/\s+/)[0] || '';

  return (
    <section className="theme-wine login-hero relative isolate overflow-hidden rounded-t-[var(--radius-xl)]">
      <div className="relative grid gap-6 px-5 pb-24 pt-7 sm:px-8 sm:pt-9 lg:grid-cols-[minmax(0,1fr)_minmax(0,25rem)] lg:items-center lg:gap-10 xl:px-10">
        <div className="min-w-0">
          <ScriptTitle
            size="page"
            eyebrow={formatDate(new Date(), 'EEEE, d MMMM')}
            title={t('dashboard.greeting', { name: firstName })}
            subtitle={t('dashboard.subtitle')}
          />
          {user?.role && (
            <div className="orn-rise mt-4 flex flex-wrap items-center gap-2">
              <Badge tone="accent">{t(`common.${user.role}`)}</Badge>
              {user?.name && <span className="text-[1.02rem] text-ink-muted">{user.name}</span>}
            </div>
          )}
        </div>
        <TodayAgenda role={user?.role} className="orn-rise" />
      </div>

      {/* lace trim + wave into the page */}
      <LaceEdge direction="up" size={22} className="absolute inset-x-0 bottom-9" />
      <WaveEdge fill="var(--page-base)" className="absolute inset-x-0 -bottom-px" />
    </section>
  );
};

const Dashboard = () => {
  const { t, i18n } = useTranslation();
  const user = useSelector(selectCurrentUser);
  const { data: statsResponse, isLoading: statsLoading } = useGetStatsQuery();
  const { data: activitiesResponse, isLoading: activitiesLoading } = useGetActivitiesQuery();

  const stats = statsResponse?.data;
  const activities = activitiesResponse?.data || [];
  const learningHours = formatHours(stats?.learningHours?.total, t, i18n?.language);
  const hoursTrend = trendProps(stats?.learningHours?.trend, t('dashboard.hoursVsLastMonth'));
  const countTrend = (trend) => trendProps(trend, t('dashboard.vsLastMonth'));

  let cards = [];
  if (user?.role === 'admin') {
    cards = [
      { label: t('dashboard.totalUsers'), value: stats?.users?.total || 0, icon: Users, ...countTrend(stats?.users?.trend) },
      { label: t('dashboard.activeCourses'), value: stats?.courses?.total || 0, icon: BookOpen, ...countTrend(stats?.courses?.trend) },
      { label: t('dashboard.groups'), value: stats?.groups?.total || 0, icon: GraduationCap, ...countTrend(stats?.groups?.trend) },
      { label: t('dashboard.learningHours'), value: learningHours, icon: Clock, ...hoursTrend },
    ];
  } else if (user?.role === 'teacher') {
    cards = [
      { label: t('dashboard.myGroups'), value: stats?.groups?.total || 0, icon: GraduationCap },
      { label: t('dashboard.myStudents'), value: stats?.students?.total || 0, icon: Users },
      { label: t('dashboard.avgAttendance'), value: `${stats?.avgAttendance?.total || 0}%`, icon: TrendingUp },
      { label: t('dashboard.learningHours'), value: learningHours, icon: Clock, ...hoursTrend },
    ];
  } else if (user?.role === 'student') {
    cards = [
      { label: t('dashboard.enrolledGroups'), value: stats?.enrolledGroups?.total || 0, icon: GraduationCap },
      { label: t('dashboard.myAttendance'), value: `${stats?.myAttendance?.total || 0}%`, icon: TrendingUp },
      { label: t('dashboard.myLearningHours'), value: learningHours, icon: Clock, ...hoursTrend },
    ];
  }

  const chartTitle =
    user?.role === 'student' ? t('dashboard.myActivity') : user?.role === 'teacher' ? t('dashboard.groupActivity') : undefined;
  const chartSubtitle =
    user?.role === 'student'
      ? t('dashboard.myActivitySubtitle')
      : user?.role === 'teacher'
        ? t('dashboard.groupActivitySubtitle')
        : undefined;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      <DashboardHero user={user} />

      {/* stat cards — wrappers carry the staggered entrance so the cards keep their hover lift */}
      <div className={`orn-stagger grid gap-5 sm:grid-cols-2 ${cards.length === 3 ? 'xl:grid-cols-3' : 'xl:grid-cols-4'}`}>
        {cards.map((card) => (
          <div key={card.label}>{statsLoading ? <StatSkeleton /> : <StatCard className="h-full" {...card} />}</div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 xl:grid-cols-5">
        <div className="orn-rise space-y-6 lg:col-span-2 xl:col-span-3">
          <ActivityChart stats={stats} isLoading={statsLoading} title={chartTitle} subtitle={chartSubtitle} />
          {user?.role === 'student' && <PaymentWidget />}
        </div>
        <div className="orn-rise [animation-delay:80ms] xl:col-span-2">
          <ActivityFeed activities={activities} isLoading={activitiesLoading} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
