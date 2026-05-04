import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../features/auth/authSlice';
import { motion } from 'framer-motion';
import { Users, GraduationCap, BookOpen, Clock, TrendingUp } from 'lucide-react';
import { useGetStatsQuery, useGetActivitiesQuery } from '../features/dashboard/dashboardApi';

const StatCard = ({ title, value, icon: Icon, trend, delay, isLoading }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all group relative overflow-hidden"
  >
    {isLoading ? (
      <div className="animate-pulse space-y-4">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="h-4 bg-white/10 rounded w-20"></div>
            <div className="h-8 bg-white/10 rounded w-16"></div>
          </div>
          <div className="w-12 h-12 bg-white/10 rounded-xl"></div>
        </div>
        <div className="h-4 bg-white/10 rounded w-32 mt-4"></div>
      </div>
    ) : (
      <>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-white/60 text-sm mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-white">{value}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-bordo/10 flex items-center justify-center text-bordo group-hover:scale-110 transition-transform">
            <Icon size={24} />
          </div>
        </div>
        {trend !== undefined && (
          <div className="mt-4 flex items-center gap-2">
            <div className="flex items-center text-green-500 text-xs font-medium">
              <TrendingUp size={14} className="mr-1" />
              {trend}%
            </div>
            <span className="text-white/40 text-xs">Keçən aydan bəri</span>
          </div>
        )}
      </>
    )}
  </motion.div>
);

const ActivityItem = ({ activity }) => {
  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000 / 60); // minutes
    
    if (diff < 60) return `${diff} dəqiqə əvvəl`;
    if (diff < 1440) return `${Math.floor(diff / 60)} saat əvvəl`;
    return `${Math.floor(diff / 1440)} gün əvvəl`;
  };

  return (
    <div className="flex gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors border-l-2 border-transparent hover:border-bordo">
      <div className="w-2 h-2 rounded-full bg-bordo mt-2 shrink-0"></div>
      <div>
        <p className="text-white text-sm">{activity.message}</p>
        <p className="text-white/40 text-xs mt-1">{getTimeAgo(activity.time)}</p>
      </div>
    </div>
  );
};

const Dashboard = () => {
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
          className="text-3xl font-bold text-white mb-2"
        >
          Xoş gəldiniz, {user?.name}! 👋
        </motion.h1>
        <p className="text-white/60">Bu gün üçün təlim planınız və statistikalarınız.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Ümumi İstifadəçilər" 
          value={stats?.users?.total || 0} 
          icon={Users} 
          trend={12} 
          delay={0.1} 
          isLoading={statsLoading}
        />
        <StatCard 
          title="Aktiv Kurslar" 
          value={stats?.courses?.total || 0} 
          icon={BookOpen} 
          trend={stats?.courses?.trend || 0} 
          delay={0.2} 
          isLoading={statsLoading}
        />
        <StatCard 
          title="Qruplar" 
          value={stats?.groups?.total || 0} 
          icon={GraduationCap} 
          trend={stats?.groups?.trend || 0} 
          delay={0.3} 
          isLoading={statsLoading}
        />
        <StatCard 
          title="Öyrənmə Saatı" 
          value={`${stats?.learningHours?.total || 0}s`} 
          icon={Clock} 
          trend={stats?.learningHours?.trend || 0} 
          delay={0.4} 
          isLoading={statsLoading}
        />
      </div>

      {/* Activity and Content Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 h-[400px] flex items-center justify-center relative overflow-hidden">
             {/* Subtle glowing effect */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-bordo/20 rounded-full blur-3xl"></div>
            <p className="text-white/40 italic z-10">Aktivlik qrafiki burada olacaq</p>
          </div>
        </div>
        
        {/* Recent Activity */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col h-[400px]">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
            Son Aktivlik
            <span className="text-xs font-normal text-bordo bg-bordo/10 px-2 py-1 rounded-full">Yeni</span>
          </h3>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 -mr-2 space-y-1">
            {activitiesLoading ? (
              // Activity Skeletons
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-4 p-4 animate-pulse">
                  <div className="w-2 h-2 rounded-full bg-white/20 mt-2 shrink-0"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-white/10 rounded w-full"></div>
                    <div className="h-3 bg-white/10 rounded w-20"></div>
                  </div>
                </div>
              ))
            ) : activities.length > 0 ? (
              activities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-white/40">
                <Clock size={32} className="mb-2 opacity-50" />
                <p>Aktivlik yoxdur</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
