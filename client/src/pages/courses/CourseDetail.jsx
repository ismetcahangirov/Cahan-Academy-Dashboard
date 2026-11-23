import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Calendar,
  Clock,
  GraduationCap,
  Layers,
  User as UserIcon,
  Users,
} from 'lucide-react';
import { useGetCourseByIdQuery } from '../../features/courses/coursesApi';
import { useGetCategoriesQuery, courseCategoryLabel } from '../../features/categories/categoriesApi';
import Spinner from '../../components/common/Spinner';
import { PageShell, Section, Card, Button, Badge, StatusPill, EmptyState } from '../../components/ui';
import { formatDays } from '../../utils/days';
import { formatDate } from '../../utils/formatDate';
import { courseThumbnail } from '../../lib/courseThumbnail';

const GroupRow = ({ group }) => {
  const { t } = useTranslation();
  const schedule = group.schedule || {};
  const when = schedule.repetitionType === 'once'
    ? formatDate(schedule.specificDate, 'd MMMM yyyy')
    : formatDays(schedule.days, t);
  const time = schedule.startTime ? `${schedule.startTime}${schedule.endTime ? ` – ${schedule.endTime}` : ''}` : '';

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Layers size={16} className="text-accent-text" aria-hidden="true" />
        <span className="truncate font-semibold text-ink">{group.name}</span>
        <StatusPill status={group.status === 'active' ? 'success' : 'neutral'} className="ml-auto">
          {group.status === 'active' ? t('groups.statusActive') : t('groups.statusCompleted')}
        </StatusPill>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-muted">
        {group.teacher?.name && (
          <span className="flex items-center gap-1"><UserIcon size={13} aria-hidden="true" />{group.teacher.name}</span>
        )}
        <span className="flex items-center gap-1"><Users size={13} aria-hidden="true" />{t('courses.studentCount', { count: group.studentCount || 0 })}</span>
        {when && <span className="flex items-center gap-1"><Calendar size={13} aria-hidden="true" />{when}</span>}
        {time && <span className="num flex items-center gap-1"><Clock size={13} aria-hidden="true" />{time}</span>}
      </div>
    </Card>
  );
};

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { data: categoriesData } = useGetCategoriesQuery();
  const { data, isLoading, isError } = useGetCourseByIdQuery(id);

  const course = data?.data;
  const lessons = [...(course?.lessons || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const groups = course?.groups || [];
  // The model's default thumbnail points at a dead placeholder service
  const thumbnail = courseThumbnail(course);

  const back = (
    <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate('/courses')}>
      {t('courses.backToCourses')}
    </Button>
  );

  if (isLoading) {
    return (
      <PageShell width="narrow">
        <div>{back}</div>
        <div className="flex items-center justify-center py-24">
          <Spinner />
        </div>
      </PageShell>
    );
  }

  if (isError || !course) {
    return (
      <PageShell width="narrow">
        <div>{back}</div>
        <Card>
          <EmptyState sketch="books" title={t('courses.noCourses')} />
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell
      width="narrow"
      eyebrow={courseCategoryLabel(course.category, categoriesData?.data, i18n.language)}
      title={course.title}
      subtitle={course.level ? t(`courses.levels.${course.level}`) : undefined}
      actions={back}
    >
      <Card variant="ornate" className="overflow-hidden">
        {thumbnail && (
          <div className="h-48 bg-surface-2">
            <img data-user-image src={thumbnail} alt={course.title} loading="lazy" className="h-full w-full object-cover" />
          </div>
        )}
        <div className="space-y-4 p-6">
          <div className="flex flex-wrap items-center gap-2">
            {course.level && <Badge>{t(`courses.levels.${course.level}`)}</Badge>}
            {course.status && (
              <StatusPill status={course.status === 'published' ? 'success' : 'neutral'}>
                {t(`courses.statuses.${course.status}`)}
              </StatusPill>
            )}
          </div>

          {course.description && (
            <p className="whitespace-pre-line text-ink-muted">{course.description}</p>
          )}

          {course.instructor?.name && (
            <p className="flex items-center gap-2 text-ink-muted">
              <GraduationCap size={16} className="text-accent-text" aria-hidden="true" />
              {t('courses.instructor')}: <span className="font-medium text-ink">{course.instructor.name}</span>
            </p>
          )}
        </div>
      </Card>

      <Section
        title={t('courses.lessonsTitle')}
        variant="paper"
        actions={lessons.length > 0 ? <Badge>{lessons.length}</Badge> : null}
      >
        {lessons.length === 0 ? (
          <p className="py-3 text-center text-ink-muted">{t('courses.noLessons')}</p>
        ) : (
          <ol className="divide-y divide-line-hair">
            {lessons.map((lesson, idx) => (
              <li key={lesson._id} className="flex items-center gap-3 py-3">
                <span className="time-italic w-7 shrink-0 text-right text-[1.1rem] text-accent-text">{idx + 1}</span>
                <span className="flex-1 truncate font-medium text-ink">{lesson.title}</span>
                {lesson.duration > 0 && (
                  <span className="flex shrink-0 items-center gap-1 text-sm text-ink-muted">
                    <Clock size={13} aria-hidden="true" />{t('courses.minutes', { count: lesson.duration })}
                  </span>
                )}
              </li>
            ))}
          </ol>
        )}
      </Section>

      <Section
        title={t('courses.groupsTitle')}
        actions={groups.length > 0 ? <Badge>{groups.length}</Badge> : null}
      >
        {groups.length === 0 ? (
          <p className="py-3 text-center text-ink-muted">{t('courses.noGroups')}</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {groups.map((group) => <GroupRow key={group._id} group={group} />)}
          </div>
        )}
      </Section>
    </PageShell>
  );
};

export default CourseDetail;
