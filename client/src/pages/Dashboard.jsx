import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../features/auth/authSlice';
import { motion } from 'framer-motion';
import { Users, GraduationCap, BookOpen, Clock, TrendingUp, Banknote, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useGetStatsQuery, useGetActivitiesQuery } from '../features/dashboard/dashboardApi';
import { useGetMyPaymentsQuery } from '../features/payments/paymentsApi';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';

const useDarkMode = () => {
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains('dark')
  );
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  return isDark;
};

const activityMonths = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul'];

const getActivityData = (stats) => {
  // Real aylıq data gəlirsə onu istifadə et
  if (stats?.monthlyActivity?.length > 0) {
    return stats.monthlyActivity.map(({ month, value }) => ({ month, value }));
  }
  // Fallback: statistikadan təxmini hesabla
  const users        = stats?.users?.total        || 0;
  const courses      = stats?.courses?.total      || 0;
  const groups       = stats?.groups?.total       || 0;
  const learningHours = stats?.learningHours?.total || 0;
  const base = Math.max(8, users + courses * 3 + groups * 2 + Math.round(learningHours / 6));
  return activityMonths.map((month, index) => {
    const wave = [0.42, 0.56, 0.5, 0.72, 0.64, 0.82, 1][index];
    return { month, value: Math.max(4, Math.round(base * wave)) };
  });
};

const ActivityChart = ({ stats, isLoading, title, subtitle }) => {
  const { t } = useTranslation();
  const isDark = useDarkMode();
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Dark modda rənglər əks olunur: ağ ↔ bordo
  const C_LINE  = isDark ? '#FFFFFF' : '#7B001C';
  const C_DOT   = isDark ? '#7B001C' : '#FFFFFF';
  const GRAD_OP0 = isDark ? '0.30'   : '0.35';
  const GRAD_OP1 = isDark ? '0.04'   : '0.05';
  const data = getActivityData(stats);
  const maxValue = Math.max(...data.map((item) => item.value), 1);
  const points = data.map((item, index) => {
    const x = 24 + index * 52;
    const y = 152 - (item.value / maxValue) * 104;
    return { ...item, x, y };
  });
  const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} 168 L ${points[0].x} 168 Z`;

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 h-[400px] text-[var(--foreground)] overflow-hidden">
      {isLoading ? (
        <div className="h-full animate-pulse flex flex-col">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="h-5 bg-bordo/20 rounded w-40"></div>
              <div className="h-3 bg-bordo/10 rounded w-56"></div>
            </div>
            <div className="h-8 bg-bordo/20 rounded-full w-24"></div>
          </div>
          <div className="flex-1 grid grid-cols-7 gap-3 items-end pt-10">
            {[58, 72, 64, 84, 76, 92, 100].map((height, index) => (
              <div key={index} className="bg-bordo/20 rounded-t-xl" style={{ height: `${height}%` }}></div>
            ))}
          </div>
        </div>
      ) : (
        <div className="h-full flex flex-col">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-[var(--foreground)]">{title || t('dashboard.activityChart')}</h3>
              <p className="text-[var(--muted-foreground)] text-sm mt-1">{subtitle || t('dashboard.activityChartSubtitle')}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold leading-none text-bordo">{points[points.length - 1].value}</p>
              <p className="text-[var(--muted-foreground)] text-xs mt-1">{t('dashboard.thisMonth')}</p>
            </div>
          </div>

          <div className="relative flex-1 min-h-0">
            {/* Tooltip */}
            {hoveredPoint && (
              <div
                className="pointer-events-none absolute z-10 transition-all duration-150"
                style={{
                  left: `calc(${(hoveredPoint.x / 360) * 100}% - 48px)`,
                  top: `calc(${(hoveredPoint.y / 210) * 100}% - 64px)`,
                }}
              >
                <div
                  className="rounded-xl px-3 py-2 text-center shadow-xl min-w-[96px]"
                  style={{
                    background: isDark ? '#7B001C' : '#7B001C',
                    color: '#FFFFFF',
                    border: '1.5px solid rgba(255,255,255,0.18)',
                  }}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-widest opacity-80">
                    {t(`dashboard.months.${hoveredPoint.month}`)}
                  </p>
                  <p className="text-xl font-bold leading-tight">{hoveredPoint.value}</p>
                  <p className="text-[10px] opacity-70">{title || t('dashboard.activityChart')}</p>
                  {/* Arrow */}
                  <div
                    className="absolute left-1/2 -translate-x-1/2 w-2 h-2 rotate-45"
                    style={{
                      bottom: '-5px',
                      background: '#7B001C',
                      borderRight: '1.5px solid rgba(255,255,255,0.18)',
                      borderBottom: '1.5px solid rgba(255,255,255,0.18)',
                    }}
                  />
                </div>
              </div>
            )}

            <svg
              className="w-full h-full"
              viewBox="0 0 360 210"
              role="img"
              aria-label={title || t('dashboard.activityChart')}
              onMouseLeave={() => setHoveredPoint(null)}
            >
              <defs>
                <linearGradient id="activityArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C_LINE} stopOpacity={GRAD_OP0} />
                  <stop offset="100%" stopColor={C_LINE} stopOpacity={GRAD_OP1} />
                </linearGradient>
              </defs>

              {[48, 88, 128, 168].map((y) => (
                <line key={y} x1="24" x2="336" y1={y} y2={y} stroke={C_LINE} strokeOpacity="0.18" strokeWidth="1" strokeDasharray="4 4" />
              ))}

              {points.map((point) => {
                const barHeight = 168 - point.y;
                return (
                  <rect
                    key={point.month}
                    x={point.x - 12}
                    y={point.y}
                    width="24"
                    height={barHeight}
                    rx="8"
                    fill={C_LINE}
                    opacity={hoveredPoint?.month === point.month ? '0.28' : '0.14'}
                    style={{ transition: 'opacity 0.15s' }}
                  />
                );
              })}

              <path d={areaPath} fill="url(#activityArea)" />
              <path d={linePath} fill="none" stroke={C_LINE} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

              {points.map((point) => (
                <g key={`${point.month}-point`}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={hoveredPoint?.month === point.month ? '8' : '6'}
                    fill={C_DOT}
                    stroke={C_LINE}
                    strokeWidth="3"
                    style={{ transition: 'r 0.15s' }}
                  />
                  <text x={point.x} y="196" textAnchor="middle" fill={C_LINE} opacity="0.9" fontSize="11" fontWeight="600">
                    {t(`dashboard.months.${point.month}`)}
                  </text>
                  {/* Invisible large hover target */}
                  <rect
                    x={point.x - 22}
                    y="0"
                    width="44"
                    height="210"
                    fill="transparent"
                    style={{ cursor: 'crosshair' }}
                    onMouseEnter={() => setHoveredPoint(point)}
                  />
                </g>
              ))}
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, trend, delay, isLoading }) => {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="bg-bordo border border-bordo rounded-2xl p-6 text-white shadow-lg shadow-bordo/20 transition-all group relative overflow-hidden"
    >
      {isLoading ? (
        <div className="animate-pulse space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <div className="h-4 bg-white/25 rounded w-20"></div>
              <div className="h-8 bg-white/35 rounded w-16"></div>
            </div>
            <div className="w-12 h-12 bg-white/25 rounded-xl"></div>
          </div>
          <div className="h-4 bg-white/25 rounded w-32 mt-4"></div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/75 text-sm mb-1">{title}</p>
              <h3 className="text-2xl font-bold text-white">{value}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-bordo group-hover:scale-110 transition-transform">
              <Icon size={24} />
            </div>
          </div>
          {trend !== undefined && (
            <div className="mt-4 flex items-center gap-2">
              <div className="flex items-center text-white text-xs font-medium">
                <TrendingUp size={14} className="mr-1" />
                {trend}%
              </div>
              <span className="text-white/65 text-xs">{t('dashboard.sinceLastMonth')}</span>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
};

const ActivityItem = ({ activity }) => {
  const { t } = useTranslation();
  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000 / 60); // minutes
    
    if (diff < 60) return t('dashboard.minutesAgo', { count: diff });
    if (diff < 1440) return t('dashboard.hoursAgo', { count: Math.floor(diff / 60) });
    return t('dashboard.daysAgo', { count: Math.floor(diff / 1440) });
  };

  return (
    <div className="flex gap-4 p-4 rounded-xl hover:bg-[var(--muted)]/50 transition-colors border-l-2 border-transparent hover:border-bordo">
      <div className="w-2 h-2 rounded-full bg-bordo mt-2 shrink-0"></div>
      <div>
        <p className="text-[var(--foreground)] text-sm">{activity.message}</p>
        <p className="text-[var(--muted-foreground)]/60 text-xs mt-1">{getTimeAgo(activity.time)}</p>
      </div>
    </div>
  );
};

// ─── Student Payment Widget ─────────────────────────────────────────────────
const PaymentWidget = () => {
  const { t, i18n } = useTranslation();
  const { data, isLoading } = useGetMyPaymentsQuery();
  const payments = data?.data ?? [];

  const fmtDate = (d) =>
    new Date(d).toLocaleDateString(
      i18n.language === 'az' ? 'az-AZ' : i18n.language === 'ru' ? 'ru-RU' : 'en-US'
    );

  if (isLoading) {
    return (
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 animate-pulse">
        <div className="h-4 bg-[var(--muted)] rounded w-32 mb-3" />
        <div className="h-10 bg-[var(--muted)] rounded w-full" />
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Banknote size={16} className="text-bordo" />
          <h3 className="text-sm font-semibold text-[var(--foreground)]">{t('payments.title')}</h3>
        </div>
        <p className="text-xs text-[var(--muted-foreground)]/60">{t('payments.noActivePayments')}</p>
      </div>
    );
  }

  // Find most relevant entries across all plans
  const allEntries = payments.flatMap((plan) =>
    plan.history.map((h) => ({ ...h, planAmount: plan.amount }))
  );
  const overdue = allEntries.filter((e) => e.status === 'overdue');
  const pending = allEntries
    .filter((e) => e.status === 'pending')
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  const nextDue = pending[0];

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg bg-bordo/10">
          <Banknote size={15} className="text-bordo" />
        </div>
        <h3 className="text-sm font-semibold text-[var(--foreground)]">{t('payments.title')}</h3>
      </div>

      {/* Overdue alert */}
      {overdue.length > 0 && (
        <div className="flex items-start gap-2 bg-[var(--destructive)]/10 border border-[var(--destructive)]/20 rounded-xl p-3 mb-3">
          <AlertCircle size={15} className="text-[var(--destructive)] shrink-0 mt-0.5" />
          <p className="text-xs text-[var(--destructive)] font-medium">
            {t('payments.overdueAlert', { count: overdue.length })}
          </p>
        </div>
      )}

      {/* Next payment */}
      {nextDue ? (
        <div className="flex items-center justify-between bg-bordo/5 border border-bordo/10 rounded-xl px-3 py-2.5">
          <div>
            <p className="text-xs text-[var(--muted-foreground)]/60">{t('payments.nextPayment')}</p>
            <p className="text-sm font-semibold text-[var(--foreground)] mt-0.5">
              {nextDue.planAmount} AZN
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-bordo font-medium">{fmtDate(nextDue.dueDate)}</p>
          </div>
        </div>
      ) : (
        overdue.length === 0 && (
          <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]/60">
            <CheckCircle2 size={14} className="text-bordo" />
            {t('payments.allPaid')}
          </div>
        )
      )}
    </div>
  );
};

const Dashboard = () => {
  const { t } = useTranslation();
  const user = useSelector(selectCurrentUser);
  const { data: statsResponse, isLoading: statsLoading } = useGetStatsQuery();
  const { data: activitiesResponse, isLoading: activitiesLoading } = useGetActivitiesQuery();

  const stats = statsResponse?.data;
  const activities = activitiesResponse?.data || [];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-3xl font-bold text-[var(--foreground)] mb-2"
        >
          {t('dashboard.welcome', { name: user?.name })}
        </motion.h1>
        <p className="text-[var(--muted-foreground)]">{t('dashboard.subtitle')}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {user?.role === 'admin' && (
          <>
            <StatCard 
              title={t('dashboard.totalUsers')} 
              value={stats?.users?.total || 0} 
              icon={Users} 
              trend={12} 
              delay={0.1} 
              isLoading={statsLoading}
            />
            <StatCard 
              title={t('dashboard.activeCourses')} 
              value={stats?.courses?.total || 0} 
              icon={BookOpen} 
              trend={stats?.courses?.trend || 0} 
              delay={0.2} 
              isLoading={statsLoading}
            />
            <StatCard 
              title={t('dashboard.groups')} 
              value={stats?.groups?.total || 0} 
              icon={GraduationCap} 
              trend={stats?.groups?.trend || 0} 
              delay={0.3} 
              isLoading={statsLoading}
            />
            <StatCard 
              title={t('dashboard.learningHours')} 
              value={`${stats?.learningHours?.total || 0}s`} 
              icon={Clock} 
              trend={stats?.learningHours?.trend || 0} 
              delay={0.4} 
              isLoading={statsLoading}
            />
          </>
        )}

        {user?.role === 'teacher' && (
          <>
            <StatCard 
              title={t('dashboard.myGroups')} 
              value={stats?.groups?.total || 0} 
              icon={GraduationCap} 
              delay={0.1} 
              isLoading={statsLoading}
            />
            <StatCard 
              title={t('dashboard.myStudents')} 
              value={stats?.students?.total || 0} 
              icon={Users} 
              delay={0.2} 
              isLoading={statsLoading}
            />
            <StatCard 
              title={t('dashboard.avgAttendance')} 
              value={`${stats?.avgAttendance?.total || 0}%`} 
              icon={TrendingUp} 
              delay={0.3} 
              isLoading={statsLoading}
            />
            <div className="hidden lg:block"></div>
          </>
        )}

        {user?.role === 'student' && (
          <>
            <StatCard 
              title={t('dashboard.enrolledGroups')} 
              value={stats?.enrolledGroups?.total || 0} 
              icon={GraduationCap} 
              delay={0.1} 
              isLoading={statsLoading}
            />
            <StatCard 
              title={t('dashboard.myAttendance')} 
              value={`${stats?.myAttendance?.total || 0}%`} 
              icon={TrendingUp} 
              delay={0.2} 
              isLoading={statsLoading}
            />
            <div className="hidden lg:block" />
            <div className="hidden lg:block" />
          </>
        )}
      </div>

      {/* Activity and Content Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <ActivityChart 
            stats={stats} 
            isLoading={statsLoading} 
            title={user?.role === 'student' ? t('dashboard.myActivity') : user?.role === 'teacher' ? t('dashboard.groupActivity') : undefined}
            subtitle={user?.role === 'student' ? t('dashboard.myActivitySubtitle') : user?.role === 'teacher' ? t('dashboard.groupActivitySubtitle') : undefined}
          />
          {/* Payment widget only for students */}
          {user?.role === 'student' && <PaymentWidget />}
        </div>
        
        {/* Recent Activity */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 flex flex-col h-[400px]">
          <h3 className="text-lg font-bold text-[var(--foreground)] mb-4 flex items-center justify-between">
            {t('dashboard.recentActivity')}
            <span className="text-xs font-normal text-bordo bg-bordo/10 px-2 py-1 rounded-full">{t('dashboard.new')}</span>
          </h3>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 -mr-2 space-y-1">
            {activitiesLoading ? (
              // Activity Skeletons
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-4 p-4 animate-pulse">
                  <div className="w-2 h-2 rounded-full bg-[var(--muted)] mt-2 shrink-0"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-[var(--muted)] rounded w-full"></div>
                    <div className="h-3 bg-[var(--muted)] rounded w-20"></div>
                  </div>
                </div>
              ))
            ) : activities.length > 0 ? (
              activities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-[var(--muted-foreground)]/40">
                <Clock size={32} className="mb-2 opacity-50" />
                <p>{t('dashboard.noActivity')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
