import { useState } from 'react';
import {
  Search,
  Plus,
  ChevronRight,
  Edit2,
  Trash2,
  PlayCircle,
  BarChart,
} from 'lucide-react';
import {
  useGetCoursesQuery,
  useCreateCourseMutation,
  useUpdateCourseMutation,
  useDeleteCourseMutation
} from '../../features/courses/coursesApi';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../features/auth/authSlice';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';
import Select from '../../components/common/Select';
import { PageShell, Card, Button, Badge, Modal, FormField, Input, Textarea, EmptyState, Skeleton } from '../../components/ui';
import { SketchIllustration } from '../../components/ornament';
import { courseThumbnail } from '../../lib/courseThumbnail';
import { useGetCategoriesQuery, categoryName, courseCategoryLabel } from '../../features/categories/categoriesApi';

// Course cover: the uploaded image, or a parchment panel with the books sketch when there is none
// (empty, placeholder-service URL, or the image fails to load).
const CourseCover = ({ course }) => {
  const src = courseThumbnail(course);
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className="paper flex h-full w-full items-center justify-center">
        <SketchIllustration name="books" className="w-28" />
      </div>
    );
  }
  return (
    <img
      data-user-image
      src={src}
      alt={course.title}
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
    />
  );
};

const getLevelConfig = (t) => ({
  Beginner: { label: t('courses.levels.Beginner') },
  Intermediate: { label: t('courses.levels.Intermediate') },
  Advanced: { label: t('courses.levels.Advanced') },
});

const EMPTY_FORM = { title: '', description: '', category: '', level: 'Beginner' };

const Courses = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const levelConfig = getLevelConfig(t);
  const user = useSelector(selectCurrentUser);
  const isAdmin = user?.role === 'admin';
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [formData, setFormData] = useState(EMPTY_FORM);

  const { data: coursesData, isLoading } = useGetCoursesQuery();
  const { data: categoriesData } = useGetCategoriesQuery();
  const categories = categoriesData?.data ?? [];
  const labelOf = (value) => courseCategoryLabel(value, categories, lang);
  // chips: every shared category, plus any older free-text value a course still holds
  const chips = [
    ...categories.map((c) => ({ value: c.slug, label: categoryName(c, lang) })),
    ...[...new Set((coursesData?.data ?? []).map((c) => c.category).filter(Boolean))]
      .filter((v) => !categories.some((c) => c.slug === v))
      .map((v) => ({ value: v, label: v })),
  ];
  const [createCourse, { isLoading: isCreating }] = useCreateCourseMutation();
  const [updateCourse, { isLoading: isUpdating }] = useUpdateCourseMutation();
  const [deleteCourse] = useDeleteCourseMutation();

  const openCreate = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setIsModalOpen(true);
  };

  const openEdit = (course) => {
    setEditingId(course._id);
    setFormData({
      title: course.title || '',
      description: course.description || '',
      category: course.category || '',
      level: course.level || 'Beginner',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData(EMPTY_FORM);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateCourse({ id: editingId, ...formData }).unwrap();
        toast.success(t('courses.updateSuccess'));
      } else {
        await createCourse(formData).unwrap();
        toast.success(t('courses.addSuccess'));
      }
      closeModal();
    } catch (error) {
      toast.error(error.data?.message || t('students.error'));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(t('courses.deleteConfirm'))) {
      try {
        await deleteCourse(id).unwrap();
        toast.success(t('courses.deleteSuccess'));
      } catch {
        toast.error(t('students.error'));
      }
    }
  };

  const q = search.toLowerCase();
  const filteredCourses = coursesData?.data?.filter(course =>
    (category === 'All' || course.category === category) &&
    (course.title.toLowerCase().includes(q) ||
      (course.category || '').toLowerCase().includes(q) ||
      labelOf(course.category).toLowerCase().includes(q))
  );

  const featuredId = filteredCourses?.find((c) => c.status === 'published')?._id;

  return (
    <PageShell
      title={t('courses.title')}
      subtitle={t('courses.subtitle')}
      actions={isAdmin && (
        <Button onClick={openCreate} icon={Plus}>
          {t('courses.newCourse')}
        </Button>
      )}
    >
      {/* Search & Filter */}
      <Card className="flex flex-col items-stretch gap-4 p-4 md:flex-row md:items-center">
        <div className="w-full flex-1 md:min-w-[16rem]">
          <Input
            icon={Search}
            type="text"
            placeholder={t('courses.searchPlaceholder')}
            aria-label={t('courses.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="custom-scrollbar flex min-w-0 gap-2 overflow-x-auto pb-1">
          {[{ value: 'All', label: t('courses.categories.All') }, ...chips].map(chip => (
            <button
              key={chip.value}
              type="button"
              onClick={() => setCategory(chip.value)}
              aria-pressed={category === chip.value}
              className={cn(
                'sc min-h-10 whitespace-nowrap rounded-full border px-4 text-[0.9rem] transition-colors',
                category === chip.value
                  ? 'border-accent bg-accent text-accent-fg'
                  : 'border-line-strong bg-transparent text-accent-text hover:bg-surface-2'
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Courses Grid */}
      <div className="orn-stagger grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array(6).fill(0).map((_, idx) => (
            <Skeleton key={idx} className="h-64 rounded-[var(--radius-lg)]" />
          ))
        ) : filteredCourses?.length > 0 ? (
          filteredCourses.map((course) => (
            <Card
              key={course._id}
              variant={course._id === featuredId ? 'featured' : 'plain'}
              hover
              className="group overflow-hidden"
            >
              <div className="relative h-40 overflow-hidden bg-surface-2">
                <CourseCover course={course} />
                <div className="absolute left-3 top-3">
                  <Badge className="bg-surface">{levelConfig[course.level]?.label || course.level}</Badge>
                </div>
                {isAdmin && (
                  <div className="absolute right-3 top-3 flex gap-1 transition-opacity focus-within:opacity-100 group-hover:opacity-100 pointer-fine:opacity-0">
                    <Button variant="outline" size="sm" iconOnly icon={Edit2} motif={false} className="bg-surface" onClick={() => openEdit(course)} aria-label={t('courses.editCourse')} />
                    <Button variant="outline" size="sm" iconOnly icon={Trash2} motif={false} className="bg-surface" onClick={() => handleDelete(course._id)} aria-label={t('common.delete')} />
                  </div>
                )}
              </div>

              <div className="space-y-3 p-5">
                <div>
                  <span className="sc text-[0.8rem] text-accent-text">{labelOf(course.category)}</span>
                  <h3 className="line-clamp-2 break-words text-[1.2rem] font-semibold leading-snug text-ink" title={course.title}>{course.title}</h3>
                </div>
                <p className="line-clamp-2 min-h-[3rem] text-[0.95rem] text-ink-muted">{course.description}</p>
                <div className="flex items-center justify-between border-t border-line-hair pt-3">
                  <div className="flex items-center gap-3 text-sm text-ink-muted">
                    <div className="flex items-center gap-1">
                      <PlayCircle size={14} aria-hidden="true" />
                      <span>{course.lessons?.length || 0} {t('courses.lessons')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BarChart size={14} aria-hidden="true" />
                      <span>{t(`courses.statuses.${course.status || 'draft'}`)}</span>
                    </div>
                  </div>
                  <Link to={`/courses/${course._id}`} className="sc flex items-center gap-1 text-[0.9rem] text-accent-text hover:underline">
                    {t('courses.content')} <ChevronRight size={16} aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="col-span-full">
            <EmptyState sketch="books" title={t('courses.noCourses')} />
          </Card>
        )}
      </div>

      {/* New Course Modal */}
      <Modal
        open={isModalOpen}
        onClose={closeModal}
        title={editingId ? t('courses.editCourse') : t('courses.createCourse')}
        footer={
          <>
            <Button variant="ghost" onClick={closeModal}>{t('users.cancelBtn')}</Button>
            <Button type="submit" form="course-form" loading={isCreating || isUpdating}>
              {isCreating || isUpdating ? (editingId ? t('groups.updating') : t('groups.creating')) : (editingId ? t('users.saveBtn') : t('courses.newCourse'))}
            </Button>
          </>
        }
      >
        <form id="course-form" onSubmit={handleCreate} className="space-y-5">
          <FormField label={t('courses.courseName')} required>
            <Input required type="text" placeholder="Məs: React Native Mastery" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
          </FormField>
          <FormField label={t('courses.description')} required>
            <Textarea
              required rows="3"
              placeholder={t('courses.descriptionPlaceholder')}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </FormField>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <span className="field-label">{t('courses.category')}</span>
              <Select
                value={formData.category}
                onChange={(val) => setFormData({ ...formData, category: val })}
                options={[
                  ...categories.map((c) => ({ label: categoryName(c, lang), value: c.slug })),
                  ...(formData.category && !categories.some((c) => c.slug === formData.category)
                    ? [{ label: formData.category, value: formData.category }]
                    : []),
                ]}
                placeholder={t('common.select')}
              />
            </div>
            <div>
              <span className="field-label">{t('courses.level')}</span>
              <Select
                value={formData.level}
                onChange={(val) => setFormData({ ...formData, level: val })}
                options={[
                  { label: t('courses.levels.Beginner'), value: 'Beginner' },
                  { label: t('courses.levels.Intermediate'), value: 'Intermediate' },
                  { label: t('courses.levels.Advanced'), value: 'Advanced' },
                ]}
              />
            </div>
          </div>
        </form>
      </Modal>
    </PageShell>
  );
};

export default Courses;
