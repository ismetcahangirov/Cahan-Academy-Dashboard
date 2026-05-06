import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Trophy, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Target, 
  TrendingUp,
  ChevronRight,
  Download,
  Share2,
  Calendar,
  User,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';

const ExamResultsModal = ({ isOpen, onClose, result }) => {
  const { t } = useTranslation();
  if (!isOpen || !result) return null;

  const score = Math.round((result.score / result.totalPoints) * 100);
  const isPassed = score >= 50;

  const stats = [
    { label: t('exams.score'), value: `${result.score}/${result.totalPoints}`, icon: Target, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: t('exams.percentage'), value: `${score}%`, icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: t('exams.timeSpent'), value: `${result.timeTaken}m`, icon: Clock, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: t('exams.accuracy'), value: '92%', icon: Zap, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-4xl bg-[var(--card)] border border-[var(--border)] rounded-[40px] shadow-2xl overflow-hidden z-10"
      >
        {/* Decorative elements */}
        <div className={cn(
          "absolute top-0 right-0 w-64 h-64 blur-3xl opacity-10 -mr-20 -mt-20",
          isPassed ? "bg-emerald-500" : "bg-red-500"
        )}></div>

        {/* Header Section */}
        <div className="relative p-10 flex flex-col md:flex-row items-center gap-8 border-b border-[var(--border)]">
          <div className="relative">
            <div className={cn(
              "w-32 h-32 md:w-40 md:h-40 rounded-[40px] flex items-center justify-center shadow-2xl",
              isPassed ? "bg-emerald-500 text-white shadow-emerald-500/20" : "bg-red-500 text-white shadow-red-500/20"
            )}>
              {isPassed ? <Trophy size={64} className="animate-bounce" /> : <TrendingUp size={64} />}
            </div>
            <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-[var(--card)] border border-[var(--border)] rounded-2xl flex items-center justify-center shadow-lg">
              {isPassed ? <CheckCircle2 className="text-emerald-500" size={24} /> : <XCircle className="text-red-500" size={24} />}
            </div>
          </div>

          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-bordo/5 border border-bordo/10 mb-4">
              <ShieldCheck size={14} className="text-bordo" />
              <span className="text-[10px] font-black text-bordo uppercase tracking-widest">{t('exams.officialResult')}</span>
            </div>
            <h2 className="text-4xl font-black text-[var(--foreground)] tracking-tight mb-3">
              {result.examTitle}
            </h2>
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <div className="flex items-center gap-2 text-sm font-bold text-[var(--muted-foreground)]/60">
                <Calendar size={16} className="text-bordo/40" />
                {new Date(result.completedAt).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-2 text-sm font-bold text-[var(--muted-foreground)]/60">
                <User size={16} className="text-bordo/40" />
                {result.studentName}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="absolute top-8 right-8 p-3 text-[var(--muted-foreground)]/40 hover:text-bordo hover:bg-bordo/5 rounded-2xl transition-all"
          >
            <X size={24} />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 border-b border-[var(--border)]">
          {stats.map((stat, idx) => (
            <div key={idx} className="p-8 border-r last:border-r-0 border-[var(--border)] flex flex-col items-center justify-center text-center group hover:bg-[var(--muted)]/20 transition-colors">
              <div className={cn("p-3 rounded-2xl mb-4 transition-transform group-hover:scale-110", stat.bg, stat.color)}>
                <stat.icon size={24} />
              </div>
              <p className="text-[10px] font-black text-[var(--muted-foreground)]/30 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
              <p className="text-2xl font-black text-[var(--foreground)]">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Detailed Breakdown */}
        <div className="p-10 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-[var(--foreground)] uppercase tracking-tight flex items-center gap-3">
              <span className="w-1.5 h-6 bg-bordo rounded-full"></span>
              {t('exams.performanceSummary')}
            </h3>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-4 py-2 bg-[var(--muted)] border border-[var(--border)] rounded-xl text-xs font-bold text-[var(--muted-foreground)]/60 hover:text-bordo hover:border-bordo/30 transition-all">
                <Download size={14} />
                PDF
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-[var(--muted)] border border-[var(--border)] rounded-xl text-xs font-bold text-[var(--muted-foreground)]/60 hover:text-bordo hover:border-bordo/30 transition-all">
                <Share2 size={14} />
                {t('common.share')}
              </button>
            </div>
          </div>

          <div className="bg-[var(--card)] border border-[var(--border)] rounded-[32px] overflow-hidden shadow-sm">
            <div className="p-8 space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <span className="text-sm font-black text-[var(--foreground)] uppercase tracking-widest">{t('exams.totalProgress')}</span>
                  <span className={cn("text-lg font-black", isPassed ? "text-emerald-500" : "text-red-500")}>{score}%</span>
                </div>
                <div className="h-4 bg-[var(--muted)] rounded-full overflow-hidden p-1 border border-[var(--border)]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={cn(
                      "h-full rounded-full relative",
                      isPassed ? "bg-emerald-500" : "bg-red-500"
                    )}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"></div>
                  </motion.div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-emerald-600/40 uppercase tracking-widest">{t('exams.correct')}</p>
                    <p className="text-lg font-black text-emerald-600">14 {t('exams.questions')}</p>
                  </div>
                </div>
                <div className="p-5 rounded-2xl bg-red-500/5 border border-red-500/10 flex items-center gap-4">
                  <div className="w-10 h-10 bg-red-500 text-white rounded-xl flex items-center justify-center">
                    <XCircle size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-red-600/40 uppercase tracking-widest">{t('exams.incorrect')}</p>
                    <p className="text-lg font-black text-red-600">2 {t('exams.questions')}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 bg-[var(--muted)]/20 border-t border-[var(--border)] text-center">
              <p className="text-sm font-bold text-[var(--muted-foreground)]/60 max-w-lg mx-auto leading-relaxed">
                {isPassed ? t('exams.passDescription') : t('exams.failDescription')}
              </p>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-10 border-t border-[var(--border)] bg-[var(--muted)]/10 flex items-center justify-center">
          <button
            onClick={onClose}
            className="group flex items-center gap-3 bg-bordo hover:bg-bordo/90 text-white px-12 py-5 rounded-[22px] font-black text-sm tracking-widest uppercase transition-all shadow-xl shadow-bordo/20 hover:shadow-bordo/40 hover:-translate-y-1 active:translate-y-0"
          >
            {t('common.close')}
            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ExamResultsModal;
