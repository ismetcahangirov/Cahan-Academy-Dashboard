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
import toast from 'react-hot-toast';

const DAYS = [
  { label: 'Bazar ertəsi', short: 'B.E' },
  { label: 'Çərşənbə axşamı', short: 'Ç.A' },
  { label: 'Çərşənbə', short: 'Ç' },
  { label: 'Cümə axşamı', short: 'C.A' },
  { label: 'Cümə', short: 'C' },
  { label: 'Şənbə', short: 'Ş' },
  { label: 'Bazar', short: 'B' },
];

const AddEntryModal = ({ onClose, onSubmit, isLoading }) => {
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.subject || !form.startTime || !form.endTime) {
      toast.error('Bütün məcburi sahələri doldurun');
      return;
    }
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#111] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-6"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-white">Yeni Dərs Əlavə Et</h2>
          <button onClick={onClose} className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-white/70 mb-1">Fənn *</label>
            <input name="subject" value={form.subject} onChange={handleChange}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-bordo"
              placeholder="Riyaziyyat, İngilis dili..." required />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white/70">Təkrar növü</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, repetitionType: 'weekly' })}
                className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all border ${
                  form.repetitionType === 'weekly' ? 'bg-bordo border-bordo/50 text-white' : 'bg-white/5 border-white/10 text-white/50'
                }`}
              >
                Hər həftə
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, repetitionType: 'once' })}
                className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all border ${
                  form.repetitionType === 'once' ? 'bg-bordo border-bordo/50 text-white' : 'bg-white/5 border-white/10 text-white/50'
                }`}
              >
                Bir dəfəlik
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {form.repetitionType === 'weekly' ? (
              <div>
                <label className="block text-sm text-white/70 mb-1">Gün *</label>
                <select name="dayOfWeek" value={form.dayOfWeek} onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-bordo">
                  {DAYS.map((d, i) => (
                    <option key={i} value={i} className="bg-[#111]">{d.label}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-sm text-white/70 mb-1">Tarix *</label>
                <input 
                  type="date" 
                  name="specificDate" 
                  value={form.specificDate} 
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-bordo"
                  required 
                />
              </div>
            )}
            <div>
              <label className="block text-sm text-white/70 mb-1">Dərs formatı</label>
              <select name="type" value={form.type} onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-bordo">
                <option value="offline" className="bg-[#111]">Offline</option>
                <option value="online" className="bg-[#111]">Online</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1">Otaq / Link</label>
            <input name="room" value={form.room} onChange={handleChange}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-bordo"
              placeholder={form.type === 'online' ? "Meet linki..." : "101, A-2..."} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/70 mb-1">Başlanğıc *</label>
              <input type="time" name="startTime" value={form.startTime} onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-bordo"
                required />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">Bitmə *</label>
              <input type="time" name="endTime" value={form.endTime} onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-bordo"
                required />
            </div>
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1">Qeyd</label>
            <textarea name="note" value={form.note} onChange={handleChange}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-bordo resize-none h-20"
              placeholder="Dərs haqqında əlavə qeyd..." />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
              İmtina
            </button>
            <button type="submit" disabled={isLoading}
              className="px-4 py-2 text-sm text-white bg-bordo hover:bg-bordo/80 rounded-xl transition-colors disabled:opacity-50">
              {isLoading ? 'Əlavə edilir...' : 'Əlavə et'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const Schedule = () => {
  const user = useSelector(selectCurrentUser);
  const [showModal, setShowModal] = useState(false);
  const { data: schedule = [], isLoading } = useGetScheduleQuery({});
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
      toast.success('Dərs əlavə edildi');
      setShowModal(false);
    } catch (error) {
      toast.error(error?.data?.message || 'Xəta baş verdi');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteEntry(id).unwrap();
      toast.success('Dərs silindi');
    } catch (error) {
      toast.error(error?.data?.message || 'Xəta baş verdi');
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
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Calendar className="text-bordo" />
            Cədvəl
          </h1>
          {isAdminOrTeacher && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-bordo hover:bg-bordo/80 text-white rounded-xl text-sm transition-colors"
            >
              <Plus size={16} />
              Dərs əlavə et
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
              className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden"
            >
              <div className="flex items-center gap-3 px-5 py-3 border-b border-white/10 bg-white/5">
                <span className="text-sm font-semibold text-bordo">{day.short}</span>
                <h2 className="text-sm font-medium text-white">{day.label}</h2>
                {byDay[dayIndex].length > 0 && (
                  <span className="ml-auto text-xs text-white/40">{byDay[dayIndex].length} dərs</span>
                )}
              </div>

              <div className="p-4">
                {byDay[dayIndex].length === 0 ? (
                  <p className="text-sm text-white/30 text-center py-3">Bu gün dərs yoxdur</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {byDay[dayIndex].map((entry) => (
                      <div
                        key={entry._id}
                        className="group relative flex items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all"
                      >
                        <div className="p-2 rounded-lg bg-bordo/20 text-bordo shrink-0">
                          <BookOpen size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate flex items-center gap-2">
                            {entry.subject}
                            {entry.repetitionType === 'once' && entry.specificDate && (
                              <span className="text-[10px] bg-white/10 text-white/50 px-1.5 py-0.5 rounded font-normal">
                                {new Date(entry.specificDate).toLocaleDateString('az-AZ', { day: 'numeric', month: 'short' })}
                              </span>
                            )}
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="flex items-center gap-1 text-xs text-white/50">
                              <Clock size={11} />
                              {entry.startTime} – {entry.endTime}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider border ${
                              entry.type === 'online' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                            }`}>
                              {entry.type === 'online' ? 'Online' : 'Offline'}
                            </span>
                            {entry.room && (
                              <span className="flex items-center gap-1 text-xs text-white/50">
                                <MapPin size={11} />
                                {entry.room}
                              </span>
                            )}
                          </div>
                          {entry.note && (
                            <p className="text-[10px] text-white/30 mt-1 italic line-clamp-1">{entry.note}</p>
                          )}
                          {entry.teacher && (
                            <p className="text-xs text-white/40 mt-1 truncate">{entry.teacher.name}</p>
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
                            className="absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 text-white/40 hover:text-red-500 hover:bg-red-500/10 transition-all"
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
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default Schedule;
