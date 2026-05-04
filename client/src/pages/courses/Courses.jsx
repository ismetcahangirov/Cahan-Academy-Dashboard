import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Search, 
  Plus, 
  Layers, 
  Clock, 
  ChevronRight,
  MoreVertical,
  Edit2,
  Trash2,
  X,
  PlayCircle,
  BarChart
} from 'lucide-react';
import { 
  useGetCoursesQuery, 
  useCreateCourseMutation, 
  useDeleteCourseMutation 
} from '../../features/courses/coursesApi';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';

const Courses = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    level: 'Beginner'
  });

  const { data: coursesData, isLoading } = useGetCoursesQuery();
  const [createCourse, { isLoading: isCreating }] = useCreateCourseMutation();
  const [deleteCourse] = useDeleteCourseMutation();

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createCourse(formData).unwrap();
      toast.success('Kurs uğurla yaradıldı');
      setIsModalOpen(false);
      setFormData({ title: '', description: '', category: '', level: 'Beginner' });
    } catch (error) {
      toast.error(error.data?.message || 'Xəta baş verdi');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bu kursu və ona aid bütün dərsləri silmək istədiyinizə əminsiniz?')) {
      try {
        await deleteCourse(id).unwrap();
        toast.success('Kurs silindi');
      } catch (error) {
        toast.error('Xəta baş verdi');
      }
    }
  };

  const filteredCourses = coursesData?.data?.filter(course => 
    course.title.toLowerCase().includes(search.toLowerCase()) ||
    course.category.toLowerCase().includes(search.toLowerCase())
  );

  const levelColors = {
    Beginner: 'bg-emerald-100 text-emerald-700',
    Intermediate: 'bg-amber-100 text-amber-700',
    Advanced: 'bg-rose-100 text-rose-700'
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Kurslar</h1>
          <p className="text-slate-500 text-sm">Akademiyanın təhsil proqramları və materialları</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
        >
          <Plus size={20} />
          <span>Yeni Kurs</span>
        </button>
      </div>

      {/* Search & Filter */}
      <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Kurs və ya kateqoriya axtar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
          {['Hamısı', 'Frontend', 'Backend', 'Design', 'Marketing'].map(cat => (
            <button 
              key={cat}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                cat === 'Hamısı' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array(6).fill(0).map((_, idx) => (
            <div key={idx} className="bg-white h-64 rounded-2xl border border-slate-100 animate-pulse"></div>
          ))
        ) : (
          filteredCourses?.map((course) => (
            <motion.div
              key={course._id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all overflow-hidden group border-b-4 border-b-transparent hover:border-b-indigo-500"
            >
              <div className="relative h-40 overflow-hidden bg-slate-100">
                <img 
                  src={course.thumbnail} 
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3">
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm ${levelColors[course.level]}`}>
                    {course.level}
                  </span>
                </div>
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2 bg-white/90 backdrop-blur-sm rounded-lg text-slate-600 hover:text-indigo-600 shadow-sm">
                    <Edit2 size={14} />
                  </button>
                  <button 
                    onClick={() => handleDelete(course._id)}
                    className="p-2 bg-white/90 backdrop-blur-sm rounded-lg text-slate-600 hover:text-red-600 shadow-sm"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="p-5 space-y-3">
                <div>
                  <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{course.category}</span>
                  <h3 className="text-lg font-bold text-slate-800 line-clamp-1">{course.title}</h3>
                </div>
                
                <p className="text-slate-500 text-sm line-clamp-2 min-h-[40px]">
                  {course.description}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-slate-500 text-xs">
                      <PlayCircle size={14} />
                      <span>{course.lessons?.length || 0} Dərs</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-500 text-xs">
                      <BarChart size={14} />
                      <span>{course.status === 'published' ? 'Aktiv' : 'Qaralama'}</span>
                    </div>
                  </div>
                  <Link 
                    to={`/courses/${course._id}`}
                    className="flex items-center gap-1 text-indigo-600 text-sm font-bold hover:gap-2 transition-all"
                  >
                    Məzmun <ChevronRight size={16} />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* New Course Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800">Yeni Kurs Yarat</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreate} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Kursun Adı</label>
                  <input
                    required
                    type="text"
                    placeholder="Məs: React Native Mastery"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Təsvir</label>
                  <textarea
                    required
                    rows="3"
                    placeholder="Kurs haqqında qısa məlumat..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  ></textarea>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Kateqoriya</label>
                    <select
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="">Seçin...</option>
                      <option value="Frontend">Frontend</option>
                      <option value="Backend">Backend</option>
                      <option value="Design">Design</option>
                      <option value="Mobile">Mobile</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Dərəcə</label>
                    <select
                      value={formData.level}
                      onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="Beginner">Başlanğıc</option>
                      <option value="Intermediate">Orta</option>
                      <option value="Advanced">Yüksək</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50"
                  >
                    Ləğv et
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 disabled:opacity-50"
                  >
                    {isCreating ? 'Yaradılır...' : 'Kursu Yarat'}
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
