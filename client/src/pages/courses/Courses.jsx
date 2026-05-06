import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal,
  Clock,
  Users,
  Star,
  ChevronRight,
  X,
  Trash2,
  Edit2,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  BookMarked
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { 
  useGetCoursesQuery, 
  useCreateCourseMutation, 
  useDeleteCourseMutation, 
  useUpdateCourseMutation 
} from '../../features/courses/coursesApi';
import { toast } from 'react-hot-toast';
import { cn } from '../../lib/utils';

const CourseModal = ({ isOpen, onClose, onSubmit, course, isLoading }) => {
  const { t } = useTranslation();
  const isEdit = !!course;
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: '',
    level: 'beginner',
    price: '',
    status: 'active'
  });

  useState(() => {
    if (course) {
      setFormData({
        name: course.name,
        description: course.description,
        duration: course.duration,
        level: course.level,
        price: course.price,
        status: course.status
      });
    }
  }, [course]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[var(--card)] border border-[var(--border)] rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-8 border-b border-[var(--border)] bg-[var(--muted)]/20">
          <h3 className="text-2xl font-black text-[var(--foreground)] tracking-tight">
            {isEdit ? t('courses.editCourse') : t('courses.newCourse')}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-[var(--muted)] rounded-xl transition-colors">
            <X size={20} className="text-[var(--muted-foreground)]" />
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-[var(--muted-foreground)]/40 uppercase tracking-widest ml-1">{t('courses.tableName')}</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-[var(--input)] border border-[var(--border)] rounded-2xl py-4 px-6 text-[var(--foreground)] text-sm font-bold focus:outline-none focus:border-bordo/50 transition-all"
              placeholder={t('courses.namePlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-[var(--muted-foreground)]/40 uppercase tracking-widest ml-1">{t('courses.tableDescription')}</label>
            <textarea
              required
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-[var(--input)] border border-[var(--border)] rounded-2xl py-4 px-6 text-[var(--foreground)] text-sm font-bold focus:outline-none focus:border-bordo/50 transition-all resize-none"
              placeholder={t('courses.descPlaceholder')}
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-[var(--muted-foreground)]/40 uppercase tracking-widest ml-1">{t('courses.tableDuration')}</label>
              <input
                type="text"
                required
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="w-full bg-[var(--input)] border border-[var(--border)] rounded-2xl py-4 px-6 text-[var(--foreground)] text-sm font-bold focus:outline-none focus:border-bordo/50 transition-all"
                placeholder="3 months"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-[var(--muted-foreground)]/40 uppercase tracking-widest ml-1">{t('courses.tableLevel')}</label>
              <select
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                className="w-full bg-[var(--input)] border border-[var(--border)] rounded-2xl py-4 px-6 text-[var(--foreground)] text-sm font-bold focus:outline-none focus:border-bordo/50 transition-all appearance-none"
              >
                <option value="beginner">{t('courses.level_beginner')}</option>
                <option value="intermediate">{t('courses.level_intermediate')}</option>
                <option value="advanced">{t('courses.level_advanced')}</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 pt-6 mt-4 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-4 rounded-2xl text-sm font-bold text-[var(--muted-foreground)]/60 hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-all"
            >
              {t('common.cancel')}
            </button>
            <button
              disabled={isLoading}
              type="submit"
              className="flex items-center gap-3 bg-bordo hover:bg-bordo/90 text-white px-10 py-4 rounded-2xl font-black text-sm tracking-wider transition-all shadow-xl shadow-bordo/20 hover:shadow-bordo/40 disabled:opacity-50"
            >
              {isLoading ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
              {isEdit ? t('common.save') : t('common.create')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const Courses = () => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [search, setSearch] = useState('');

  const { data, isLoading: isTableLoading } = useGetCoursesQuery({ search });
  const [createCourse, { isLoading: isCreating }] = useCreateCourseMutation();
  const [updateCourse, { isLoading: isUpdating }] = useUpdateCourseMutation();
  const [deleteCourse] = useDeleteCourseMutation();

  const handleCreate = async (formData) => {
    try {
      await createCourse(formData).unwrap();
      toast.success(t('courses.createSuccess'));
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.data?.message || t('common.error'));
    }
  };

  const handleUpdate = async (formData) => {
    try {
      await updateCourse({ id: selectedCourse._id, ...formData }).unwrap();
      toast.success(t('courses.updateSuccess'));
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.data?.message || t('common.error'));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(t('courses.deleteConfirm'))) {
      try {
        await deleteCourse(id).unwrap();
        toast.success(t('courses.deleteSuccess'));
      } catch (err) {
        toast.error(t('common.error'));
      }
    }
  };

  const stats = [
    { label: t('courses.totalCourses'), value: data?.pagination?.total || 0, icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: t('courses.activeCourses'), value: data?.data?.filter(c => c.status === 'active').length || 0, icon: BookMarked, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: t('courses.avgRating'), value: '4.8', icon: Star, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ];

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-[var(--foreground)] tracking-tight">{t('sidebar.courses')}</h1>
          <p className="text-[var(--muted-foreground)]/60 text-sm mt-1 font-medium">{t('courses.subtitle')}</p>
        </div>
        <button
          onClick={() => { setSelectedCourse(null); setIsModalOpen(true); }}
          className="flex items-center justify-center gap-2 bg-bordo hover:bg-bordo/90 text-white px-8 py-4 rounded-2xl transition-all shadow-xl shadow-bordo/20 font-black text-sm hover:-translate-y-0.5 active:translate-y-0"
        >
          <Plus size={22} />
          {t('courses.newCourse')}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-[var(--card)] border border-[var(--border)] p-6 rounded-[32px] shadow-sm hover:border-bordo/20 transition-all group"
          >
            <div className="flex items-center gap-5">
              <div className={cn("p-4 rounded-2xl transition-all duration-500 group-hover:scale-110", stat.bg, stat.color)}>
                <stat.icon size={26} />
              </div>
              <div>
                <p className="text-[10px] font-black text-[var(--muted-foreground)]/30 uppercase tracking-[0.2em]">{stat.label}</p>
                <h3 className="text-3xl font-black text-[var(--foreground)] mt-0.5">{stat.value}</h3>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="bg-[var(--card)] border border-[var(--border)] p-4 rounded-[28px] shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]/30 group-focus-within:text-bordo transition-colors" size={20} />
          <input
            type="text"
            placeholder={t('courses.searchPlaceholder')}
            className="w-full bg-[var(--input)] border border-[var(--border)] rounded-2xl py-4 pl-12 pr-4 text-[var(--foreground)] text-sm font-bold focus:outline-none focus:border-bordo/50 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-[var(--muted)] border border-[var(--border)] text-[var(--muted-foreground)] text-sm font-bold hover:text-bordo hover:border-bordo/30 transition-all group">
          <Filter size={18} className="group-hover:rotate-180 transition-transform duration-500" />
          {t('common.filter')}
        </button>
      </div>

      {/* Course Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {isTableLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-[var(--card)] border border-[var(--border)] rounded-[40px] h-[420px] animate-pulse"></div>
          ))
        ) : data?.data?.length > 0 ? (
          data.data.map((course, idx) => (
            <motion.div
              key={course._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-[var(--card)] border border-[var(--border)] rounded-[40px] overflow-hidden group hover:border-bordo/30 transition-all shadow-sm hover:shadow-2xl hover:shadow-bordo/5"
            >
              <div className="h-52 bg-[var(--muted)] relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10 opacity-60"></div>
                <img
                  src={course.image || `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  alt={course.name}
                />
                <div className="absolute top-6 left-6 z-20">
                  <span className={cn(
                    "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border backdrop-blur-md",
                    course.level === 'beginner' ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                    course.level === 'intermediate' ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                    "bg-amber-500/20 text-amber-400 border-amber-500/30"
                  )}>
                    {t(`courses.level_${course.level}`)}
                  </span>
                </div>
                
                {/* Overlay Controls */}
                <div className="absolute inset-0 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 z-30 transition-all duration-300 scale-90 group-hover:scale-100">
                  <button 
                    onClick={() => { setSelectedCourse(course); setIsModalOpen(true); }}
                    className="w-12 h-12 bg-white text-bordo rounded-2xl flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all"
                  >
                    <Edit2 size={20} />
                  </button>
                  <button 
                    onClick={() => handleDelete(course._id)}
                    className="w-12 h-12 bg-bordo text-white rounded-2xl flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>

              <div className="p-8 space-y-6">
                <div>
                  <h3 className="text-2xl font-black text-[var(--foreground)] tracking-tight line-clamp-1 group-hover:text-bordo transition-colors">
                    {course.name}
                  </h3>
                  <p className="text-[var(--muted-foreground)]/60 text-sm mt-2 line-clamp-2 leading-relaxed font-medium">
                    {course.description}
                  </p>
                </div>

                <div className="flex items-center justify-between py-6 border-y border-[var(--border)]">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-[var(--muted-foreground)]/30 uppercase tracking-[0.2em]">{t('courses.tableDuration')}</span>
                    <div className="flex items-center gap-2 text-sm font-bold text-[var(--foreground)]">
                      <Clock size={16} className="text-bordo/50" />
                      {course.duration}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-black text-[var(--muted-foreground)]/30 uppercase tracking-[0.2em]">{t('courses.tableStudents')}</span>
                    <div className="flex items-center gap-2 text-sm font-bold text-[var(--foreground)]">
                      <Users size={16} className="text-bordo/50" />
                      {course.studentCount || 0}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-[var(--muted-foreground)]/30 uppercase tracking-[0.2em]">{t('courses.tablePrice')}</span>
                    <p className="text-2xl font-black text-bordo tracking-tighter">₼ {course.price || 0}</p>
                  </div>
                  <button className="flex items-center gap-2 text-xs font-black text-bordo uppercase tracking-widest hover:translate-x-1 transition-transform">
                    {t('common.details')}
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-24 bg-[var(--card)] border border-dashed border-[var(--border)] rounded-[40px] flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 bg-[var(--muted)] rounded-[40px] flex items-center justify-center mb-8">
              <BookOpen size={48} className="text-[var(--muted-foreground)]/20" />
            </div>
            <h3 className="text-2xl font-black text-[var(--foreground)] mb-2">{t('courses.noCourses')}</h3>
            <p className="text-sm text-[var(--muted-foreground)]/60 max-w-sm">{t('courses.noCoursesDesc')}</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <CourseModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSubmit={selectedCourse ? handleUpdate : handleCreate}
            course={selectedCourse}
            isLoading={isCreating || isUpdating}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Courses;
