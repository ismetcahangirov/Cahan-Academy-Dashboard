import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  AlertCircle,
  BookOpen,
  Calendar,
  Clock,
  GraduationCap,
  Layers,
  PlayCircle,
  User as UserIcon,
  Users,
} from 'lucide-react';
import { useGetCourseByIdQuery } from '../../features/courses/coursesApi';
import { cn } from '../../lib/utils';
import Spinner from '../../components/common/Spinner';
import { formatDays } from '../../utils/days';
import { formatDate } from '../../utils/formatDate';

const LEVEL_CLS = {
  Beginner: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Intermediate: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Advanced: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const Section = ({ icon: Icon, title, count, children }) => (
  <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden">
    <div className="flex items-center gap-3 px-5 py-3 border-b border-[var(--border)] bg-[var(--muted)]/20">
      <Icon size={16} className="text-bordo" />
      <h2 className="text-sm font-semibold text-[var(--foreground)]">{title}</h2>
      {count > 0 && <span className="ml-auto text-xs text-[var(--muted-foreground)]/50">{count}</span>}
    </div>
    <div className="p-4">{children}</div>
  </div>
);

const GroupRow = ({ group }) => {
  const { t } = useTranslation();
  const schedule = group.schedule || {};
  const when = schedule.repetitionType === 'once'
    ? formatDate(schedule.specificDate, 'd MMMM yyyy')
    : formatDays(schedule.days, t);
  const time = schedule.startTime ? `${schedule.startTime}${schedule.endTime ? ` – ${schedule.endTime}` : ''}` : '';

  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--muted)]/30 border border-[var(--border)]">
      <div className="p-2 rounded-lg bg-bordo text-white shrink-0 shadow-sm shadow-bordo/20">
        <Layers size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm text-[var(--foreground)] truncate">{group.name}</span>
          <span className={cn(
            'text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider',
            group.status === 'active'
              ? 'bg-bordo text-white border-bordo'
              : 'bg-[var(--muted)] text-[var(--muted-foreground)] border-[var(--border)]'
          )}>
            {group.status === 'active' ? t('groups.statusActive') : t('groups.statusCompleted')}
          </span>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-[var(--muted-foreground)]/60">
          {group.teacher?.name && (
            <span className="flex items-center gap-1"><UserIcon size={12} />{group.teacher.name}</span>
          )}
          <span className="flex items-center gap-1"><Users size={12} />{t('courses.studentCount', { count: group.studentCount || 0 })}</span>
          {when && <span className="flex items-center gap-1"><Calendar size={12} />{when}</span>}
          {time && <span className="flex items-center gap-1"><Clock size={12} />{time}</span>}
        </div>
      </div>
    </div>
  );
};

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data, isLoading, isError } = useGetCourseByIdQuery(id);

  const course = data?.data;
  const lessons = [...(course?.lessons || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const groups = course?.groups || [];
  // The model's default thumbnail points at a dead placeholder service
  const thumbnail = course?.thumbnail && !course.thumbnail.includes('via.placeholder.com') ? course.thumbnail : null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/courses')}
        className="flex items-center gap-2 text-[var(--muted-foreground)] hover:text-bordo transition-colors text-sm font-medium"
      >
        <ArrowLeft size={16} />
        {t('courses.backToCourses')}
      </button>

      {isLoading && (
        <div className="flex items-center justify-center py-24">
          <Spinner />
        </div>
      )}

      {!isLoading && (isError || !course) && (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-[var(--muted-foreground)]/60">
          <AlertCircle size={40} className="text-bordo opacity-40" />
          <p>{t('courses.noCourses')}</p>
        </div>
      )}

      {!isLoading && course && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden">
            {thumbnail && (
              <div className="h-48 bg-[var(--muted)]">
                <img src={thumbnail} alt={course.title} className="w-full h-full object-cover opacity-90" />
              </div>
            )}
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-4">
                {!thumbnail && (
                  <div className="p-3 bg-bordo text-white rounded-xl shadow-sm shadow-bordo/20 shrink-0">
                    <BookOpen size={22} />
                  </div>
                )}
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-bordo uppercase tracking-widest">{course.category}</span>
                  <h1 className="text-2xl font-bold text-[var(--foreground)]">{course.title}</h1>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {course.level && (
                      <span className={cn('px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border', LEVEL_CLS[course.level])}>
                        {t(`courses.levels.${course.level}`)}
                      </span>
                    )}
                    {course.status && (
                      <span className="px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border bg-[var(--muted)] text-[var(--muted-foreground)] border-[var(--border)]">
                        {t(`courses.statuses.${course.status}`)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {course.description && (
                <p className="text-sm text-[var(--muted-foreground)] whitespace-pre-line">{course.description}</p>
              )}

              {course.instructor?.name && (
                <p className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                  <GraduationCap size={15} className="text-bordo" />
                  {t('courses.instructor')}: <span className="text-[var(--foreground)] font-medium">{course.instructor.name}</span>
                </p>
              )}
            </div>
          </div>

          <Section icon={PlayCircle} title={t('courses.lessonsTitle')} count={lessons.length}>
            {lessons.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]/40 text-center py-3">{t('courses.noLessons')}</p>
            ) : (
              <ol className="space-y-2">
                {lessons.map((lesson, idx) => (
                  <li key={lesson._id} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--muted)]/30 border border-[var(--border)]">
                    <span className="w-7 h-7 rounded-lg bg-bordo/10 text-bordo text-xs font-bold flex items-center justify-center shrink-0">{idx + 1}</span>
                    <span className="flex-1 text-sm font-medium text-[var(--foreground)] truncate">{lesson.title}</span>
                    {lesson.duration > 0 && (
                      <span className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]/60 shrink-0">
                        <Clock size={12} />{t('courses.minutes', { count: lesson.duration })}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </Section>

          <Section icon={Layers} title={t('courses.groupsTitle')} count={groups.length}>
            {groups.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]/40 text-center py-3">{t('courses.noGroups')}</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {groups.map((group) => <GroupRow key={group._id} group={group} />)}
              </div>
            )}
          </Section>
        </motion.div>
      )}
    </div>
  );
};

export default CourseDetail;
