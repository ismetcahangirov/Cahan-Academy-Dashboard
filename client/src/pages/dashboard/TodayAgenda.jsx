import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useGetScheduleQuery } from '../../features/schedule/scheduleApi';
import { Badge, Button, Skeleton } from '../../components/ui';
import { OrnateFrame, Timeline, TimelineItem } from '../../components/ornament';
import { lessonsForDay, lessonState } from './agenda';

/**
 * TodayAgenda — "today" on the dashboard hero: the day's lessons from /schedule (role-scoped by the
 * API) as a Timeline; past = done, running = current (edelweiss), later = upcoming.
 */
const MAX_ITEMS = 4;

const TodayAgenda = ({ role, className }) => {
  const { t } = useTranslation();
  const { data: schedule = [], isLoading } = useGetScheduleQuery({});
  const now = new Date();
  const lessons = lessonsForDay(schedule, now);
  const shown = lessons.slice(0, MAX_ITEMS);
  const more = lessons.length - shown.length;

  return (
    <OrnateFrame corners="diagonal" cornerSize="h-6 w-6" className={className}>
      <div className="relative flex items-center justify-between gap-3 px-7 pt-6 sm:px-8">
        <h2 className="sc text-[0.95rem] text-ink">{t('dashboard.today')}</h2>
        {!isLoading && lessons.length > 0 && <Badge>{t('schedule.lessonCount', { count: lessons.length })}</Badge>}
      </div>

      <div className="relative px-4 pb-5 pt-4 sm:px-5">
        {isLoading ? (
          <div className="space-y-4 px-2 pb-2" aria-busy="true">
            {[0, 1].map((i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-4 w-12" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : lessons.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-2 pb-2 pt-1 text-center">
            <p className="font-script text-[1.9rem] leading-tight text-ink">{t('schedule.noLessons')}</p>
            <Button as={Link} to="/schedule" variant="ghost" size="sm">
              {t('schedule.title')}
              <ArrowRight aria-hidden="true" />
            </Button>
          </div>
        ) : (
          <>
            <Timeline className="-mb-2">
              {shown.map((lesson) => {
                const meta = [
                  `${lesson.startTime}–${lesson.endTime}`,
                  lesson.group?.name && lesson.group.name !== lesson.subject ? lesson.group.name : null,
                  lesson.room,
                  role !== 'teacher' ? lesson.teacher?.name : null,
                ]
                  .filter(Boolean)
                  .join(' · ');
                return (
                  <TimelineItem
                    key={lesson._id}
                    time={lesson.startTime}
                    title={lesson.subject}
                    meta={meta}
                    state={lessonState(lesson, now)}
                  />
                );
              })}
            </Timeline>
            <div className="flex justify-end">
              <Button as={Link} to="/schedule" variant="ghost" size="sm">
                {more > 0 ? t('dashboard.moreLessons', { count: more }) : t('schedule.title')}
                <ArrowRight aria-hidden="true" />
              </Button>
            </div>
          </>
        )}
      </div>
    </OrnateFrame>
  );
};

export default TodayAgenda;
