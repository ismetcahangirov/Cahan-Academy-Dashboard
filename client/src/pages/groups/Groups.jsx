import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Search, 
  Plus, 
  Calendar, 
  Clock, 
  MoreVertical, 
  BookOpen, 
  User,
  CheckCircle2,
  AlertCircle,
  X,
  Edit2,
  Trash2
} from 'lucide-react';
import { 
  useGetGroupsQuery, 
  useCreateGroupMutation, 
  useDeleteGroupMutation 
} from '../../features/groups/groupsApi';
import { useGetTeachersQuery } from '../../features/teachers/teachersApi';
import { toast } from 'react-hot-toast';

const Groups = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    teacher: '',
    course: '',
    schedule: { days: [], time: '' }
  });

  const { data: groupsData, isLoading } = useGetGroupsQuery();
  const { data: teachersData } = useGetTeachersQuery({ limit: 100 });
  const [createGroup, { isLoading: isCreating }] = useCreateGroupMutation();
  const [deleteGroup] = useDeleteGroupMutation();

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createGroup(formData).unwrap();
      toast.success('Qrup uğurla yaradıldı');
      setIsModalOpen(false);
      setFormData({ name: '', teacher: '', course: '', schedule: { days: [], time: '' } });
    } catch (error) {
      toast.error(error.data?.message || 'Xəta baş verdi');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bu qrupu silmək istədiyinizə əminsiniz?')) {
      try {
        await deleteGroup(id).unwrap();
        toast.success('Qrup silindi');
      } catch (error) {
        toast.error('Xəta baş verdi');
      }
    }
  };

  const filteredGroups = groupsData?.data?.filter(group => 
    group.name.toLowerCase().includes(search.toLowerCase()) ||
    group.course.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Qruplar</h1>
          <p className="text-slate-500 text-sm">Akademiyanın tədris qrupları və cədvəli</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
        >
          <Plus size={20} />
          <span>Yeni Qrup</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Qrup və ya kurs axtar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
          />
        </div>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array(6).fill(0).map((_, idx) => (
            <div key={idx} className="bg-white h-48 rounded-2xl border border-slate-100 animate-pulse"></div>
          ))
        ) : (
          filteredGroups?.map((group) => (
            <motion.div
              key={group._id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all p-5 space-y-4 group"
            >
              <div className="flex justify-between items-start">
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                  <BookOpen size={24} />
                </div>
                <div className="flex gap-1">
                  <button className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(group._id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-800">{group.name}</h3>
                <p className="text-slate-500 text-sm">{group.course}</p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-50">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <User size={16} className="text-slate-400" />
                  <span className="font-medium">{group.teacher?.name || 'Müəllim təyin edilməyib'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Users size={16} className="text-slate-400" />
                  <span>{group.students?.length || 0} Tələbə</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Calendar size={16} className="text-slate-400" />
                  <span>{group.schedule?.days?.join(', ') || 'Cədvəl təyin edilməyib'}</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                  group.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                }`}>
                  {group.status === 'active' ? 'Aktiv' : 'Tamamlanıb'}
                </span>
                <button className="text-indigo-600 text-sm font-semibold hover:underline">
                  Detallar
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* New Group Modal */}
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
                <h3 className="text-xl font-bold text-slate-800">Yeni Qrup Yarat</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreate} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Qrup Adı</label>
                    <input
                      required
                      type="text"
                      placeholder="Məs: FE-202"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Kurs</label>
                    <input
                      required
                      type="text"
                      placeholder="Məs: Frontend Development"
                      value={formData.course}
                      onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Müəllim Seçin</label>
                  <select
                    required
                    value={formData.teacher}
                    onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="">Seçin...</option>
                    {teachersData?.data?.map(teacher => (
                      <option key={teacher._id} value={teacher._id}>{teacher.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Günlər</label>
                  <div className="flex flex-wrap gap-2">
                    {['B.ertəsi', 'Çərşənbə A.', 'Çərşənbə', 'Cümə A.', 'Cümə', 'Şənbə', 'Bazar'].map(day => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          const days = formData.schedule.days.includes(day)
                            ? formData.schedule.days.filter(d => d !== day)
                            : [...formData.schedule.days, day];
                          setFormData({ ...formData, schedule: { ...formData.schedule, days } });
                        }}
                        className={`px-3 py-1 rounded-lg text-xs transition-all ${
                          formData.schedule.days.includes(day) 
                            ? 'bg-indigo-600 text-white' 
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
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
                    {isCreating ? 'Yaradılır...' : 'Qrupu Yarat'}
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

export default Groups;
