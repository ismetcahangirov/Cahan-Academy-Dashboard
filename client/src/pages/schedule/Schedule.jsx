import { Calendar, Clock, MapPin, Trash2 } from 'lucide-react';
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
import { PageShell, Card, Badge, Button } from '../../components/ui';
import { Timeline, TimelineItem } from '../../components/ornament/Timeline';
import { formatDate } from '../../utils/formatDate';

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

  // DELETE /api/schedule/:id is admin only
  const canDelete = user?.role === 'admin';

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
    if (!window.confirm(t('common.deleteConfirm'))) return;
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

  const todayIdx = (new Date().getDay() + 6) % 7;

  return (
    <PageShell title={t('schedule.title')}>
      <div className="grid gap-5 lg:grid-cols-2">
        {DAYS.map((day, dayIndex) => (
          <Card key={dayIndex} variant={dayIndex === todayIdx ? 'ornate' : 'plain'} className={dayIndex === todayIdx ? 'p-7' : 'p-5'}>
            <div className="mb-4 flex items-baseline gap-3 border-b border-line-hair pb-3">
              <span className="sc text-[0.9rem] text-accent-text">{day.short}</span>
              <h2 className="text-[1.2rem] font-semibold text-ink">{day.label}</h2>
              {byDay[dayIndex].length > 0 && (
                <span className="ml-auto text-sm text-ink-muted">
                  {t('schedule.lessonCount', { count: byDay[dayIndex].length })}
                </span>
              )}
            </div>

            {byDay[dayIndex].length === 0 ? (
              <p className="py-3 text-center text-sm text-ink-muted">{t('schedule.noLessons')}</p>
            ) : (
              <Timeline>
                {byDay[dayIndex].map((entry) => (
                  <TimelineItem
                    key={entry._id}
                    time={entry.startTime}
                    title={entry.subject}
                    state={dayIndex === todayIdx ? 'current' : 'upcoming'}
                    meta={
                      <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="inline-flex items-center gap-1">
                          <Clock size={13} aria-hidden="true" />
                          <span className="num">{entry.startTime} – {entry.endTime}</span>
                        </span>
                        {entry.room && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin size={13} aria-hidden="true" />
                            {entry.room}
                          </span>
                        )}
                        {entry.repetitionType === 'once' && entry.specificDate && (
                          <span className="inline-flex items-center gap-1">
                            <Calendar size={13} aria-hidden="true" />
                            {formatDate(entry.specificDate, 'd MMM')}
                          </span>
                        )}
                      </span>
                    }
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge>{entry.type === 'online' ? t('groups.formatOnline') : t('groups.formatOffline')}</Badge>
                      {entry.group && <Badge tone="accent">{entry.group.name}</Badge>}
                      {entry.teacher && <span className="text-sm text-ink-muted">{entry.teacher.name}</span>}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          iconOnly
                          icon={Trash2}
                          className="ml-auto"
                          onClick={() => handleDelete(entry._id)}
                          aria-label={t('common.delete')}
                          title={t('common.delete')}
                        />
                      )}
                    </div>
                    <JoinClassButton entry={entry} />
                    {entry.note && <p className="mt-1 line-clamp-1 text-sm italic text-ink-muted">{entry.note}</p>}
                  </TimelineItem>
                ))}
              </Timeline>
            )}
          </Card>
        ))}
      </div>
    </PageShell>
  );
};

export default Schedule;
