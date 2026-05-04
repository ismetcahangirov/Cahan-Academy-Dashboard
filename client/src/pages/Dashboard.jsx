import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../features/auth/authSlice';
import { motion } from 'framer-motion';
import { Users, GraduationCap, BookOpen, Clock, TrendingUp } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, trend, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all group"
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-white/60 text-sm mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-white">{value}</h3>
      </div>
      <div className="w-12 h-12 rounded-xl bg-bordo/10 flex items-center justify-center text-bordo group-hover:scale-110 transition-transform">
        <Icon size={24} />
      </div>
    </div>
    <div className="mt-4 flex items-center gap-2">
      <div className="flex items-center text-green-500 text-xs font-medium">
        <TrendingUp size={14} className="mr-1" />
        {trend}%
      </div>
      <span className="text-white/40 text-xs">Keçən aydan bəri</span>
    </div>
  </motion.div>
);

const Dashboard = () => {
  const user = useSelector(selectCurrentUser);

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
        <StatCard title="Ümumi Tələbələr" value="1,284" icon={Users} trend="12" delay={0.1} />
        <StatCard title="Aktiv Kurslar" value="42" icon={BookOpen} trend="8" delay={0.2} />
        <StatCard title="Tamamlanan Dərslər" value="856" icon={GraduationCap} trend="15" delay={0.3} />
        <StatCard title="Öyrənmə Saatı" value="2.4k" icon={Clock} trend="5" delay={0.4} />
      </div>

      {/* Recent Activity Section (Placeholder) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 h-[400px] flex items-center justify-center">
            <p className="text-white/40 italic">Aktivlik qrafiki burada olacaq</p>
          </div>
        </div>
        <div className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 h-[400px] flex items-center justify-center">
            <p className="text-white/40 italic">Bildirişlər və tapşırıqlar</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
