import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Search, 
  Filter, 
  Plus, 
  Clock, 
  Calendar,
  CheckCircle2,
  AlertCircle,
  MoreHorizontal,
  Download,
  Trash2,
  Edit2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';

const Classworks = () => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const stats = [
    { label: t('classworks.total'), value: '24', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: t('classworks.completed'), value: '18', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: t('classworks.pending'), value: '6', icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ];

  const classworks = [
    { id: 1, title: 'Mathematics Homework #4', subject: 'Mathematics', group: 'A1', deadline: '2024-05-10', status: 'pending', priority: 'high' },
    { id: 2, title: 'English Grammar Quiz', subject: 'English', group: 'B2', deadline: '2024-05-12', status: 'completed', priority: 'medium' },
    { id: 3, title: 'Physics Lab Report', subject: 'Physics', group: 'C1', deadline: '2024-05-08', status: 'pending', priority: 'high' },
    { id: 4, title: 'History Presentation', subject: 'History', group: 'A1', deadline: '2024-05-15', status: 'pending', priority: 'low' },
  ];

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-[var(--foreground)] tracking-tight">{t('sidebar.classworks')}</h1>
          <p className="text-[var(--muted-foreground)]/60 text-sm mt-1 font-medium">{t('classworks.subtitle')}</p>
        </div>
        <button className="flex items-center justify-center gap-2 bg-bordo hover:bg-bordo/90 text-white px-6 py-4 rounded-2xl transition-all shadow-xl shadow-bordo/20 font-bold text-sm hover:-translate-y-0.5 active:translate-y-0">
          <Plus size={20} />
          {t('classworks.newClasswork')}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-[var(--card)] border border-[var(--border)] p-6 rounded-[32px] shadow-sm hover:border-bordo/20 transition-all group"
          >
            <div className="flex items-center gap-5">
              <div className={cn("p-4 rounded-2xl transition-all duration-500 group-hover:scale-110", stat.bg, stat.color)}>
                <stat.icon size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-[var(--muted-foreground)]/30 uppercase tracking-[0.2em]">{stat.label}</p>
                <h3 className="text-3xl font-black text-[var(--foreground)] mt-0.5">{stat.value}</h3>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="bg-[var(--card)] border border-[var(--border)] p-4 rounded-[28px] shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]/30 group-focus-within:text-bordo transition-colors" size={20} />
          <input
            type="text"
            placeholder={t('classworks.searchPlaceholder')}
            className="w-full bg-[var(--input)] border border-[var(--border)] rounded-2xl py-3.5 pl-12 pr-4 text-[var(--foreground)] text-sm font-medium focus:outline-none focus:border-bordo/50 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select 
            className="bg-[var(--input)] border border-[var(--border)] rounded-2xl py-3.5 px-4 text-sm font-bold text-[var(--foreground)] focus:outline-none focus:border-bordo/50 transition-all flex-1 md:w-40 appearance-none text-center"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">{t('classworks.filterAll')}</option>
            <option value="pending">{t('classworks.filterPending')}</option>
            <option value="completed">{t('classworks.filterCompleted')}</option>
          </select>
        </div>
      </div>

      {/* List Container */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {classworks.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-[var(--card)] border border-[var(--border)] p-6 rounded-[32px] hover:border-bordo/30 transition-all group relative overflow-hidden shadow-sm"
          >
            {/* Status Indicator */}
            <div className={cn(
              "absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full blur-3xl opacity-10",
              item.status === 'completed' ? "bg-emerald-500" : "bg-amber-500"
            )}></div>

            <div className="flex items-start justify-between relative z-10 mb-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                    item.status === 'completed' 
                      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                      : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                  )}>
                    {t(`classworks.status_${item.status}`)}
                  </span>
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    item.priority === 'high' ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "bg-emerald-500"
                  )}></span>
                </div>
                <h3 className="text-xl font-black text-[var(--foreground)] leading-tight group-hover:text-bordo transition-colors">
                  {item.title}
                </h3>
              </div>
              <div className="flex items-center gap-1">
                <button className="p-2 text-[var(--muted-foreground)]/40 hover:text-bordo hover:bg-bordo/5 rounded-xl transition-all">
                  <Edit2 size={18} />
                </button>
                <button className="p-2 text-[var(--muted-foreground)]/40 hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-[var(--muted-foreground)]/20 uppercase tracking-widest">{t('classworks.subject')}</p>
                <p className="text-sm font-bold text-[var(--foreground)]">{item.subject}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-[var(--muted-foreground)]/20 uppercase tracking-widest">{t('classworks.group')}</p>
                <p className="text-sm font-bold text-[var(--foreground)]">{item.group}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-[var(--muted-foreground)]/20 uppercase tracking-widest">{t('classworks.deadline')}</p>
                <div className="flex items-center gap-2 text-sm font-bold text-[var(--foreground)]">
                  <Calendar size={14} className="text-bordo/40" />
                  {item.deadline}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-[var(--muted-foreground)]/20 uppercase tracking-widest">{t('classworks.assignedOn')}</p>
                <p className="text-sm font-bold text-[var(--foreground)]">2024-05-01</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-[var(--border)]">
              <div className="flex -space-x-3">
                {[1, 2, 3].map((_, i) => (
                  <img
                    key={i}
                    src={`https://ui-avatars.com/api/?name=U${i}&background=random&color=fff`}
                    className="w-8 h-8 rounded-xl border-2 border-[var(--card)] relative z-10"
                    alt=""
                  />
                ))}
                <div className="w-8 h-8 rounded-xl bg-[var(--muted)] border-2 border-[var(--card)] flex items-center justify-center text-[10px] font-black text-[var(--muted-foreground)]/60 relative z-0">
                  +12
                </div>
              </div>
              <button className="flex items-center gap-2 text-sm font-black text-bordo hover:translate-x-1 transition-transform">
                {t('classworks.viewDetails')}
                <ChevronRight size={18} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Classworks;
