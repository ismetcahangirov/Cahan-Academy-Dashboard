import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, BookOpen, Trash2 } from 'lucide-react';
import {
  useGetScheduleQuery,
  useDeleteScheduleEntryMutation,
} from '../../features/schedule/scheduleApi';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../features/auth/authSlice';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Spinner from '../../components/common/Spinner';
import JoinClassButton from '../../components/schedule/JoinClassButton';

const getDays = (t) => [
  { label: t('schedule.days.monday'), short: t('schedule.days.mon') },
  { label: t('schedule.days.tuesday'), short: t('schedule.days.tue') },
  { label: t('schedule.days.wednesday'), short: t('schedule.days.wed') },
  { label: t('schedule.days.thursday'), short: t('schedule.days.thu') },
  { label: t('schedule.days.friday'), short: t('schedule.days.fri') },
  { label: t('schedule.days.saturday'), short: t('schedule.days.sat') },
  { label: t('schedule.days.sunday'), short: t('schedule.days.sun') },
];


const Schedule = () => {
  const { t } = useTranslation();
  const DAYS = getDays(t);
  const user = useSelector(selectCurrentUser);
  const { data: schedule = [], isLoading } = useGetScheduleQuery({});
  const [deleteEntry] = useDeleteScheduleEntryMutation();

  const isAdminOrTeacher = user?.role === 'admin' || user?.role === 'teacher';

  // Group lessons by day
  const byDay = DAYS.map((_, i) =>
    schedule.filter((s) => {
      if (s.repetitionType === 'once' && s.specificDate) {
        // Map specific date to day of week (0-6)
        // Adjust for Azerbaijani week if necessary (Monday=0 in DAYS)
        const date = new Date(s.specificDate);
        let day = date.getDay(); // 0 is Sunday, 1 is Monday...
        day = day === 0 ? 6 : day - 1; // Map Sunday to 6, others shift by 1 to make Monday=0
        return day === i;
      }
      return s.dayOfWeek === i;
    }).sort((a, b) => a.startTime.localeCompare(b.startTime))
  );



  const handleDelete = async (id) => {
    try {
      await deleteEntry(id).unwrap();
      toast.success(t('schedule.deleteSuccess'));
    } catch (error) {
      toast.error(error?.data?.message || t('students.error'));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center gap-4">
          <h1 className="text-2xl font-bold text-[var(--foreground)] flex items-center gap-3">
            <div className="p-2 bg-bordo text-white rounded-lg shadow-sm">
              <Calendar size={20} />
            </div>
            {t('schedule.title')}
          </h1>

        </div>

        <div className="grid gap-4">
          {DAYS.map((day, dayIndex) => (
            <motion.div
              key={dayIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: dayIndex * 0.05 }}
              className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm"
            >
              <div className="flex items-center gap-3 px-5 py-3 border-b border-[var(--border)] bg-[var(--muted)]/20">
                <span className="text-sm font-semibold text-bordo">{day.short}</span>
                <h2 className="text-sm font-medium text-[var(--foreground)]">{day.label}</h2>
                {byDay[dayIndex].length > 0 && (
                  <span className="ml-auto text-xs text-[var(--muted-foreground)]/40">{byDay[dayIndex].length} {t('schedule.lessonCount')}</span>
                )}
              </div>

              <div className="p-4">
                {byDay[dayIndex].length === 0 ? (
                  <p className="text-sm text-[var(--muted-foreground)]/30 text-center py-3">{t('schedule.noLessons')}</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {byDay[dayIndex].map((entry) => (
                      <div
                        key={entry._id}
                        className="group relative flex items-start gap-3 p-3 rounded-xl bg-[var(--muted)] hover:bg-[var(--muted)]/80 border border-[var(--border)] transition-all"
                      >
                        <div className="p-2 rounded-lg bg-bordo text-white shrink-0 shadow-sm shadow-bordo/20">
                          <BookOpen size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[var(--foreground)] truncate flex items-center gap-2">
                            {entry.subject}
                            {entry.repetitionType === 'once' && entry.specificDate && (
                              <span className="text-[10px] bg-[var(--muted)] text-[var(--muted-foreground)]/50 px-1.5 py-0.5 rounded font-normal">
                                {new Date(entry.specificDate).toLocaleDateString(t('common.locale') === 'az' ? 'az-AZ' : t('common.locale') === 'ru' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short' })}
                              </span>
                            )}
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]/50">
                              <Clock size={11} />
                              {entry.startTime} – {entry.endTime}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider border ${
                              entry.type === 'online' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                            }`}>
                              {entry.type === 'online' ? t('groups.formatOnline') : t('groups.formatOffline')}
                            </span>
                            {entry.room && (
                              <span className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]/50">
                                <MapPin size={11} />
                                {entry.room}
                              </span>
                            )}
                          </div>
                          <JoinClassButton entry={entry} />
                          {entry.note && (
                            <p className="text-[10px] text-[var(--muted-foreground)]/30 mt-1 italic line-clamp-1">{entry.note}</p>
                          )}
                          {entry.teacher && (
                            <p className="text-xs text-[var(--muted-foreground)]/40 mt-1 truncate">{entry.teacher.name}</p>
                          )}
                          {entry.group && (
                            <span className="inline-block text-xs bg-bordo/20 text-bordo px-2 py-0.5 rounded-full mt-1">
                              {entry.group.name}
                            </span>
                          )}
                        </div>
                        {isAdminOrTeacher && (
                          <button
                            onClick={() => handleDelete(entry._id)}
                            className="absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 text-[var(--muted-foreground)]/40 hover:text-red-500 hover:bg-red-500/10 transition-all"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>


    </>
  );
};

export default Schedule;
