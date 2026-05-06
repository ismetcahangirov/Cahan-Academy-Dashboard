import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Search, 
  Plus, 
  Layers, 
  ChevronRight,
  Edit2,
  Trash2,
  X,
  PlayCircle,
  BarChart,
  MoreHorizontal
} from 'lucide-react';
import { 
  useGetCoursesQuery, 
  useCreateCourseMutation, 
  useDeleteCourseMutation 
} from '../../features/courses/coursesApi';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';

const getLevelConfig = (t) => ({
  Beginner: { label: t('courses.levels.Beginner'), cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  Intermediate: { label: t('courses.levels.Intermediate'), cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  Advanced: { label: t('courses.levels.Advanced'), cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
});

const DarkInput = ({ label, ...props }) => (
  <div className="space-y-1.5">
    {label && <label className="text-sm font-medium text-[var(--muted-foreground)]/70">{label}</label>}
    <input
      {...props}
      className="w-full bg-[var(--input)] border border-[var(--border)] rounded-xl py-2.5 px-4 text-[var(--foreground)] text-sm focus:outline-none focus:border-bordo/50 transition-all"
    />
  </div>
);

const DarkSelect = ({ label, children, ...props }) => (
  <div className="space-y-1.5">
    {label && <label className="text-sm font-medium text-[var(--muted-foreground)]/70">{label}</label>}
    <select
      {...props}
      className="w-full bg-[var(--input)] border border-[var(--border)] rounded-xl py-2.5 px-4 text-[var(--foreground)] text-sm focus:outline-none focus:border-bordo/50 appearance-none transition-all"
    >
      {children}
    </select>
  </div>
);

const Courses = () => {
  const { t } = useTranslation();
  const levelConfig = getLevelConfig(t);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({ title: '', description: '', category: '', level: 'Beginner' });

  const { data: coursesData, isLoading } = useGetCoursesQuery();
  const [createCourse, { isLoading: isCreating }] = useCreateCourseMutation();
  const [deleteCourse] = useDeleteCourseMutation();

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createCourse(formData).unwrap();
      toast.success(t('courses.addSuccess'));
      setIsModalOpen(false);
      setFormData({ title: '', description: '', category: '', level: 'Beginner' });
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

  const filteredCourses = coursesData?.data?.filter(course => 
    course.title.toLowerCase().includes(search.toLowerCase()) ||
    course.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">{t('courses.title')}</h1>
          <p className="text-[var(--muted-foreground)]/60 text-sm mt-1">{t('courses.subtitle')}</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-bordo hover:bg-bordo/90 text-white px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-bordo/20 font-medium text-sm shrink-0"
        >
          <Plus size={18} />
          {t('courses.newCourse')}
        </button>
      </div>

      {/* Search & Filter */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]/40" size={18} />
          <input
            type="text"
            placeholder={t('courses.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[var(--input)] border border-[var(--border)] rounded-xl py-2 pl-10 pr-4 text-[var(--foreground)] text-sm focus:outline-none focus:border-bordo transition-colors"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {['All', 'Frontend', 'Backend', 'Design', 'Mobile'].map(cat => (
            <button
              key={cat}
              className="px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all bg-[var(--muted)] border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/80"
            >
              {t(`courses.categories.${cat}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array(6).fill(0).map((_, idx) => (
            <div key={idx} className="bg-[var(--card)] border border-[var(--border)] h-64 rounded-2xl animate-pulse" />
          ))
        ) : filteredCourses?.length > 0 ? (
          filteredCourses.map((course) => (
            <motion.div
              key={course._id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden group hover:border-bordo/30 transition-all"
            >
              <div className="relative h-40 overflow-hidden bg-[var(--muted)]">
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                />
                <div className="absolute top-3 left-3">
                  <span className={cn('px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border', levelConfig[course.level]?.cls)}>
                    {levelConfig[course.level]?.label || course.level}
                  </span>
                </div>
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1.5 bg-background/50 backdrop-blur-sm rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)]"><Edit2 size={14} /></button>
                  <button onClick={() => handleDelete(course._id)} className="p-1.5 bg-background/50 backdrop-blur-sm rounded-lg text-[var(--muted-foreground)] hover:text-red-400"><Trash2 size={14} /></button>
                </div>
              </div>

              <div className="p-5 space-y-3">
                <div>
                  <span className="text-[10px] font-bold text-bordo uppercase tracking-widest">{course.category}</span>
                  <h3 className="text-base font-bold text-[var(--foreground)] line-clamp-1">{course.title}</h3>
                </div>
                <p className="text-[var(--muted-foreground)] text-sm line-clamp-2 min-h-[40px]">{course.description}</p>
                <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-[var(--muted-foreground)]/40 text-xs">
                      <PlayCircle size={14} />
                      <span>{course.lessons?.length || 0} {t('courses.lessons')}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[var(--muted-foreground)]/40 text-xs">
                      <BarChart size={14} />
                      <span>{course.status === 'published' ? t('groups.statusActive') : t('groups.statusCompleted')}</span>
                    </div>
                  </div>
                  <Link to={`/courses/${course._id}`} className="flex items-center gap-1 text-bordo text-sm font-medium hover:gap-2 transition-all">
                    {t('courses.content')} <ChevronRight size={16} />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-16 text-center">
            <BookOpen size={48} className="mx-auto mb-3 text-[var(--muted-foreground)]/20" />
            <p className="text-[var(--muted-foreground)]/40">{t('courses.noCourses')}</p>
          </div>
        )}
      </div>

      {/* New Course Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="fixed inset-0 bg-background/60 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden z-10"
            >
              <div className="flex items-center justify-between p-6 border-b border-[var(--border)] bg-[var(--muted)]/20">
                <h2 className="text-xl font-semibold text-[var(--foreground)]">{t('courses.createCourse')}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-[var(--muted-foreground)]/40 hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-all"><X size={20} /></button>
              </div>
              <form onSubmit={handleCreate} className="p-6 space-y-5">
                <DarkInput label={t('courses.courseName')} required type="text" placeholder="Məs: React Native Mastery" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--muted-foreground)]/70">{t('courses.description')}</label>
                  <textarea
                    required rows="3"
                    placeholder={t('courses.descriptionPlaceholder')}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-[var(--input)] border border-[var(--border)] rounded-xl py-2.5 px-4 text-[var(--foreground)] text-sm focus:outline-none focus:border-bordo/50 resize-none transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <DarkSelect label={t('courses.category')} required value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                    <option value="" className="bg-[var(--card)]">{t('common.select') || 'Seçin...'}</option>
                    <option value="Frontend" className="bg-[var(--card)]">Frontend</option>
                    <option value="Backend" className="bg-[var(--card)]">Backend</option>
                    <option value="Design" className="bg-[var(--card)]">Design</option>
                    <option value="Mobile" className="bg-[var(--card)]">Mobile</option>
                  </DarkSelect>
                  <DarkSelect label={t('courses.level')} value={formData.level} onChange={(e) => setFormData({ ...formData, level: e.target.value })}>
                    <option value="Beginner" className="bg-[var(--card)]">{t('courses.levels.Beginner')}</option>
                    <option value="Intermediate" className="bg-[var(--card)]">{t('courses.levels.Intermediate')}</option>
                    <option value="Advanced" className="bg-[var(--card)]">{t('courses.levels.Advanced')}</option>
                  </DarkSelect>
                </div>
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border)]">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--muted-foreground)]/60 hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-all">{t('users.cancelBtn')}</button>
                  <button type="submit" disabled={isCreating} className="flex items-center gap-2 bg-bordo hover:bg-bordo/90 text-white px-6 py-2 rounded-xl transition-all shadow-lg shadow-bordo/20 font-medium text-sm disabled:opacity-50">
                    {isCreating ? t('groups.creating') : t('courses.newCourse')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Courses;
