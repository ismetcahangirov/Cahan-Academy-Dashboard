import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  MapPin, 
  Users, 
  BookOpen,
  X,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, parseISO } from 'date-fns';
import { az, enUS, ru } from 'date-fns/locale';
import { cn } from '../../lib/utils';

const ScheduleModal = ({ isOpen, onClose, date, events = [] }) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[var(--card)] border border-[var(--border)] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)] bg-[var(--muted)]/20">
          <div>
            <h3 className="text-xl font-bold text-[var(--foreground)]">{format(date, 'd MMMM yyyy')}</h3>
            <p className="text-sm text-[var(--muted-foreground)]/60">{t('schedule.dailySchedule')}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--muted)] rounded-xl transition-colors">
            <X size={20} className="text-[var(--muted-foreground)]" />
          </button>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-4">
          {events.length > 0 ? (
            events.map((event, idx) => (
              <div key={idx} className="group p-4 bg-[var(--muted)]/30 border border-[var(--border)] rounded-xl hover:border-bordo/30 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-bordo animate-pulse"></span>
                      <h4 className="font-semibold text-[var(--foreground)]">{event.title}</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]/60">
                        <Clock size={14} />
                        {event.time}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]/60">
                        <MapPin size={14} />
                        {event.room}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]/60">
                        <Users size={14} />
                        {event.group}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]/60">
                        <BookOpen size={14} />
                        {event.teacher}
                      </div>
                    </div>
                  </div>
                  <div className="px-2 py-1 bg-bordo/10 text-bordo rounded text-[10px] font-bold uppercase tracking-wider">
                    {event.type}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-[var(--muted)] rounded-full flex items-center justify-center mx-auto mb-4">
                <CalendarIcon className="text-[var(--muted-foreground)]/20" size={32} />
              </div>
              <p className="text-[var(--muted-foreground)]/40 font-medium">{t('schedule.noEvents')}</p>
            </div>
          )}
        </div>

        <div className="p-6 bg-[var(--muted)]/10 border-t border-[var(--border)] flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-bordo text-white rounded-xl text-sm font-medium hover:bg-bordo/90 transition-all shadow-lg shadow-bordo/20"
          >
            {t('common.close')}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const Schedule = () => {
  const { t, i18n } = useTranslation();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [view, setView] = useState('calendar'); // 'calendar' or 'list'

  const locales = { az, en: enUS, ru };
  const currentLocale = locales[i18n.language] || az;

  // Mock data - in real app, fetch from API
  const events = {
    '2026-05-06': [
      { title: 'Mathematics Advanced', time: '10:00 - 11:30', room: 'Room 204', group: 'Group A1', teacher: 'John Doe', type: 'lesson' },
      { title: 'Physics Lab', time: '14:00 - 15:30', room: 'Lab 1', group: 'Group B2', teacher: 'Sarah Wilson', type: 'lab' }
    ],
    '2026-05-08': [
      { title: 'English Literature', time: '11:00 - 12:30', room: 'Room 105', group: 'Group C3', teacher: 'Emily Brown', type: 'lesson' }
    ]
  };

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const renderHeader = () => (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-3xl font-bold text-[var(--foreground)] tracking-tight">{t('schedule.title')}</h1>
        <p className="text-[var(--muted-foreground)]/60 mt-1">{t('schedule.subtitle')}</p>
      </div>
      
      <div className="flex items-center gap-3 bg-[var(--card)] p-1.5 rounded-2xl border border-[var(--border)] shadow-sm">
        <button
          onClick={() => setView('calendar')}
          className={cn(
            "px-4 py-2 rounded-xl text-sm font-medium transition-all",
            view === 'calendar' ? "bg-bordo text-white shadow-lg shadow-bordo/20" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          )}
        >
          {t('schedule.calendarView')}
        </button>
        <button
          onClick={() => setView('list')}
          className={cn(
            "px-4 py-2 rounded-xl text-sm font-medium transition-all",
            view === 'list' ? "bg-bordo text-white shadow-lg shadow-bordo/20" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          )}
        >
          {t('schedule.listView')}
        </button>
      </div>
    </div>
  );

  const renderDays = () => {
    const days = [];
    const startDate = startOfWeek(currentMonth, { weekStartsOn: 1 });
    const weekDays = [
      t('schedule.mon'), t('schedule.tue'), t('schedule.wed'), 
      t('schedule.thu'), t('schedule.fri'), t('schedule.sat'), t('schedule.sun')
    ];

    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={i} className="text-center py-4 text-xs font-bold text-[var(--muted-foreground)]/40 uppercase tracking-widest bg-[var(--muted)]/10">
          {weekDays[i]}
        </div>
      );
    }
    return <div className="grid grid-cols-7 border-x border-t border-[var(--border)] rounded-t-2xl overflow-hidden">{days}</div>;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const formattedDate = format(day, 'yyyy-MM-dd');
        const dayEvents = events[formattedDate] || [];
        const isSelected = isSameDay(day, selectedDate);
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isToday = isSameDay(day, new Date());

        days.push(
          <div
            key={day}
            className={cn(
              "relative min-h-[120px] p-3 border-r border-b border-[var(--border)] transition-all cursor-pointer group",
              !isCurrentMonth ? "bg-[var(--muted)]/5 opacity-30" : "bg-[var(--card)] hover:bg-[var(--muted)]/30",
              isSelected && "bg-bordo/5"
            )}
            onClick={() => {
              setSelectedDate(day);
              setIsModalOpen(true);
            }}
          >
            <div className="flex justify-between items-start mb-2">
              <span className={cn(
                "text-sm font-semibold flex items-center justify-center w-8 h-8 rounded-full transition-all",
                isToday ? "bg-bordo text-white shadow-lg shadow-bordo/20" : "text-[var(--foreground)]",
                !isCurrentMonth && "text-[var(--muted-foreground)]/40"
              )}>
                {format(day, 'd')}
              </span>
              {dayEvents.length > 0 && (
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-bordo"></span>
                  {dayEvents.length > 1 && <span className="w-1.5 h-1.5 rounded-full bg-bordo/50"></span>}
                </div>
              )}
            </div>
            
            <div className="space-y-1.5 mt-2 overflow-hidden">
              {dayEvents.slice(0, 2).map((event, idx) => (
                <div key={idx} className="text-[10px] p-1.5 rounded-lg bg-[var(--muted)] border border-[var(--border)] text-[var(--foreground)] truncate font-medium group-hover:border-bordo/20 transition-colors">
                  {event.time.split(' ')[0]} - {event.title}
                </div>
              ))}
              {dayEvents.length > 2 && (
                <p className="text-[9px] text-bordo font-bold ml-1">+{dayEvents.length - 2} more</p>
              )}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(<div className="grid grid-cols-7" key={day}>{days}</div>);
      days = [];
    }
    return <div className="border-l border-[var(--border)] shadow-2xl rounded-b-2xl overflow-hidden">{rows}</div>;
  };

  const renderListView = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        {Object.entries(events).sort().map(([date, dayEvents]) => (
          <div key={date} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-[var(--border)]"></div>
              <span className="text-xs font-bold text-[var(--muted-foreground)]/40 uppercase tracking-widest">
                {format(parseISO(date), 'EEEE, d MMMM', { locale: currentLocale })}
              </span>
              <div className="h-px flex-1 bg-[var(--border)]"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dayEvents.map((event, idx) => (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={idx}
                  className="bg-[var(--card)] border border-[var(--border)] p-5 rounded-2xl hover:border-bordo/30 transition-all group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-bordo/10 px-3 py-1 rounded-lg text-bordo text-[10px] font-bold uppercase tracking-wider">
                      {event.type}
                    </div>
                    <span className="text-xs font-medium text-[var(--muted-foreground)]/60 bg-[var(--muted)] px-2 py-1 rounded-lg border border-[var(--border)]">
                      {event.time}
                    </span>
                  </div>
                  <h4 className="font-bold text-[var(--foreground)] mb-4 text-lg">{event.title}</h4>
                  <div className="grid grid-cols-2 gap-y-3">
                    <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]/60">
                      <MapPin size={14} className="text-bordo/50" />
                      {event.room}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]/60">
                      <Users size={14} className="text-bordo/50" />
                      {event.group}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]/60">
                      <BookOpen size={14} className="text-bordo/50" />
                      {event.teacher}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        <div className="bg-[var(--card)] border border-[var(--border)] p-6 rounded-2xl shadow-sm">
          <h3 className="text-lg font-bold text-[var(--foreground)] mb-6 flex items-center gap-2">
            <Filter size={18} className="text-bordo" />
            {t('schedule.upcomingDeadlines')}
          </h3>
          <div className="space-y-4">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="flex gap-4 p-3 rounded-xl hover:bg-[var(--muted)]/50 transition-colors border border-transparent hover:border-[var(--border)]">
                <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center shrink-0">
                  <AlertCircle size={20} className="text-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[var(--foreground)] line-clamp-1">Mathematics Assignment #3</p>
                  <p className="text-xs text-[var(--muted-foreground)]/60 mt-1">Due in 2 days</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-bordo p-6 rounded-2xl text-white relative overflow-hidden shadow-xl shadow-bordo/20">
          <div className="relative z-10">
            <h3 className="text-lg font-bold mb-2">{t('schedule.needHelp')}</h3>
            <p className="text-white/70 text-xs mb-6 leading-relaxed">{t('schedule.helpDescription')}</p>
            <button className="w-full bg-white text-bordo py-3 rounded-xl text-sm font-bold hover:bg-white/90 transition-all">
              {t('schedule.contactSupport')}
            </button>
          </div>
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8">
      {renderHeader()}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 bg-[var(--card)] border border-[var(--border)] p-1 rounded-xl">
            <button onClick={prevMonth} className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors text-[var(--muted-foreground)]">
              <ChevronLeft size={20} />
            </button>
            <button onClick={nextMonth} className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors text-[var(--muted-foreground)]">
              <ChevronRight size={20} />
            </button>
          </div>
          <h2 className="text-xl font-bold text-[var(--foreground)] capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: currentLocale })}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]/40" size={18} />
            <input
              type="text"
              placeholder={t('schedule.searchEvents')}
              className="bg-[var(--card)] border border-[var(--border)] pl-10 pr-4 py-2.5 rounded-xl text-sm text-[var(--foreground)] focus:outline-none focus:border-bordo/50 transition-all w-64"
            />
          </div>
          <button className="flex items-center gap-2 bg-bordo text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-bordo/90 transition-all shadow-lg shadow-bordo/20">
            <Plus size={18} />
            <span className="hidden sm:inline">{t('schedule.newEvent')}</span>
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {view === 'calendar' ? (
          <motion.div
            key="calendar"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="rounded-2xl overflow-hidden"
          >
            {renderDays()}
            {renderCells()}
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {renderListView()}
          </motion.div>
        )}
      </AnimatePresence>

      <ScheduleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        date={selectedDate}
        events={events[format(selectedDate, 'yyyy-MM-dd')] || []}
      />
    </div>
  );
};

export default Schedule;
