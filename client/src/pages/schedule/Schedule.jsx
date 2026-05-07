import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Plus, Clock, MapPin, BookOpen, Trash2, X } from 'lucide-react';
import {
  useGetScheduleQuery,
  useCreateScheduleEntryMutation,
  useDeleteScheduleEntryMutation,
} from '../../features/schedule/scheduleApi';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../features/auth/authSlice';
import { useGetGroupsQuery } from '../../features/groups/groupsApi';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Select from '../../components/common/Select';

const getDays = (t) => [
  { label: t('schedule.days.monday'), short: t('schedule.days.mon') },
  { label: t('schedule.days.tuesday'), short: t('schedule.days.tue') },
  { label: t('schedule.days.wednesday'), short: t('schedule.days.wed') },
  { label: t('schedule.days.thursday'), short: t('schedule.days.thu') },
  { label: t('schedule.days.friday'), short: t('schedule.days.fri') },
  { label: t('schedule.days.saturday'), short: t('schedule.days.sat') },
  { label: t('schedule.days.sunday'), short: t('schedule.days.sun') },
];

const AddEntryModal = ({ onClose, onSubmit, isLoading, groups = [] }) => {
  const { t } = useTranslation();
  const DAYS = getDays(t);
  const [form, setForm] = useState({
    subject: '',
    group: '',
    teacher: '',
    dayOfWeek: 0,
    startTime: '',
    endTime: '',
    room: '',
    type: 'offline',
    note: '',
    repetitionType: 'weekly',
    specificDate: '',
  });

  const handleChange = (name, value) => {
    if (name === 'group' && value) {
      const selectedGroup = groups.find(g => g._id === value);
      if (selectedGroup) {
        setForm(prev => ({
          ...prev,
          group: value,
          subject: selectedGroup.name,
          teacher: selectedGroup.teacher?._id || selectedGroup.teacher // handle populated or ID
        }));
        return;
      }
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.subject || !form.startTime || !form.endTime) {
      toast.error(t('groups.fillAllFields'));
      return;
    }
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl w-full max-w-md p-6"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">{t('schedule.addNew')}</h2>
          <button onClick={onClose} className="p-2 rounded-lg text-[var(--muted-foreground)]/50 hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
          <div className="space-y-1.5">
            <label className="block text-sm text-[var(--muted-foreground)]/70">{t('common.group')} ({t('common.optional')})</label>
            <Select
              value={form.group}
              onChange={(val) => handleChange('group', val)}
              options={[
                { label: t('groups.selectGroup'), value: '' },
                ...groups.map(g => ({ label: g.name, value: g._id }))
              ]}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm text-[var(--muted-foreground)]/70">{t('schedule.subject')} *</label>
            <input name="subject" value={form.subject} onChange={(e) => handleChange('subject', e.target.value)}
              className="w-full bg-[var(--input)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-[var(--foreground)] text-sm focus:outline-none focus:border-bordo"
              placeholder={t('schedule.subjectPlaceholder')} required />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--muted-foreground)]/70">{t('schedule.repetition')}</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, repetitionType: 'weekly' })}
                className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all border ${
                  form.repetitionType === 'weekly' ? 'bg-bordo border-bordo/50 text-white' : 'bg-[var(--muted)] border-[var(--border)] text-[var(--muted-foreground)]'
                }`}
              >
                {t('schedule.weekly')}
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, repetitionType: 'once' })}
                className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all border ${
                  form.repetitionType === 'once' ? 'bg-bordo border-bordo/50 text-white' : 'bg-[var(--muted)] border-[var(--border)] text-[var(--muted-foreground)]'
                }`}
              >
                {t('schedule.once')}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {form.repetitionType === 'weekly' ? (
              <div className="space-y-1.5">
                <label className="block text-sm text-[var(--muted-foreground)]/70">{t('schedule.day')} *</label>
                <Select
                  value={form.dayOfWeek}
                  onChange={(val) => handleChange('dayOfWeek', val)}
                  options={DAYS.map((d, i) => ({ label: d.label, value: i }))}
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="block text-sm text-[var(--muted-foreground)]/70">{t('schedule.date')} *</label>
                <input 
                  type="date" 
                  name="specificDate" 
                  value={form.specificDate} 
                  onChange={(e) => handleChange('specificDate', e.target.value)}
                  className="w-full bg-[var(--input)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-[var(--foreground)] text-sm focus:outline-none focus:border-bordo"
                  required 
                />
              </div>
            )}
            <div className="space-y-1.5">
              <label className="block text-sm text-[var(--muted-foreground)]/70">{t('schedule.format')}</label>
              <Select
                value={form.type}
                onChange={(val) => handleChange('type', val)}
                options={[
                  { label: 'Offline', value: 'offline' },
                  { label: 'Online', value: 'online' },
                ]}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm text-[var(--muted-foreground)]/70">{t('schedule.room')}</label>
            <input name="room" value={form.room} onChange={(e) => handleChange('room', e.target.value)}
              className="w-full bg-[var(--input)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-[var(--foreground)] text-sm focus:outline-none focus:border-bordo"
              placeholder={form.type === 'online' ? t('schedule.linkPlaceholder') : t('schedule.roomPlaceholder')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm text-[var(--muted-foreground)]/70">{t('schedule.startTime')} *</label>
              <input type="time" name="startTime" value={form.startTime} onChange={(e) => handleChange('startTime', e.target.value)}
                className="w-full bg-[var(--input)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-[var(--foreground)] text-sm focus:outline-none focus:border-bordo"
                required />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm text-[var(--muted-foreground)]/70">{t('schedule.endTime')} *</label>
              <input type="time" name="endTime" value={form.endTime} onChange={(e) => handleChange('endTime', e.target.value)}
                className="w-full bg-[var(--input)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-[var(--foreground)] text-sm focus:outline-none focus:border-bordo"
                required />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm text-[var(--muted-foreground)]/70">{t('groups.note')}</label>
            <textarea name="note" value={form.note} onChange={(e) => handleChange('note', e.target.value)}
              className="w-full bg-[var(--input)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-[var(--foreground)] text-sm focus:outline-none focus:border-bordo resize-none h-20"
              placeholder={t('schedule.notePlaceholder')} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-[var(--muted-foreground)]/60 hover:text-[var(--foreground)] bg-[var(--muted)] hover:bg-[var(--muted)]/80 rounded-xl transition-colors">
              {t('common.cancel')}
            </button>
            <button type="submit" disabled={isLoading}
              className="px-4 py-2 text-sm text-white bg-bordo hover:bg-bordo/80 rounded-xl transition-colors disabled:opacity-50">
              {isLoading ? t('schedule.adding') : t('common.add')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const Schedule = () => {
  const { t } = useTranslation();
  const DAYS = getDays(t);
  const user = useSelector(selectCurrentUser);
  const [showModal, setShowModal] = useState(false);
  const { data: schedule = [], isLoading } = useGetScheduleQuery({});
  const { data: groupsData } = useGetGroupsQuery();
  const groups = groupsData?.data || [];
  const [createEntry, { isLoading: isCreating }] = useCreateScheduleEntryMutation();
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

  const handleAdd = async (data) => {
    try {
      const payload = {
        ...data,
        teacher: user?._id,
      };

      if (data.repetitionType === 'weekly') {
        payload.dayOfWeek = Number(data.dayOfWeek);
        delete payload.specificDate;
      } else {
        delete payload.dayOfWeek;
      }

      await createEntry(payload).unwrap();
      toast.success(t('schedule.addSuccess'));
      setShowModal(false);
    } catch (error) {
      toast.error(error?.data?.message || t('students.error'));
    }
  };

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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-bordo"></div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center gap-4">
          <h1 className="text-2xl font-bold text-[var(--foreground)] flex items-center gap-2">
            <Calendar className="text-bordo" />
            {t('schedule.title')}
          </h1>
          {isAdminOrTeacher && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center justify-center gap-2 bg-bordo hover:bg-bordo/90 text-white px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-bordo/20 font-medium text-sm shrink-0"
            >
              <Plus size={18} />
              {t('schedule.addNew')}
            </button>
          )}
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
                        <div className="p-2 rounded-lg bg-bordo/20 text-bordo shrink-0">
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

      <AnimatePresence>
        {showModal && (
          <AddEntryModal
            onClose={() => setShowModal(false)}
            onSubmit={handleAdd}
            isLoading={isCreating}
            groups={groups}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default Schedule;
