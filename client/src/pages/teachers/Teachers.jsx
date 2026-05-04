import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users as UsersIcon, 
  Search, 
  Filter, 
  Plus, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  UserPlus,
  Mail,
  GraduationCap,
  BookOpen
} from 'lucide-react';
import { 
  useGetTeachersQuery, 
  useDeleteTeacherMutation 
} from '../../features/teachers/teachersApi';
import UserModal from '../users/UserModal';
import { toast } from 'react-hot-toast';

const Teachers = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  const { data, isLoading, isError, refetch } = useGetTeachersQuery({
    page,
    limit: 10,
    search,
  });

  const [deleteTeacher] = useDeleteTeacherMutation();

  const handleEdit = (teacher) => {
    setSelectedTeacher(teacher);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bu müəllimi silmək istədiyinizə əminsiniz?')) {
      try {
        await deleteTeacher(id).unwrap();
        toast.success('Müəllim uğurla silindi');
      } catch (error) {
        toast.error('Xəta baş verdi');
      }
    }
  };

  const stats = [
    { title: 'Ümumi Müəllimlər', value: data?.pagination?.total || 0, icon: UsersIcon, color: 'bg-blue-500' },
    { title: 'Aktiv Müəllimlər', value: data?.data?.filter(t => t.isActive).length || 0, icon: GraduationCap, color: 'bg-emerald-500' },
    { title: 'Ümumi Qruplar', value: 0, icon: BookOpen, color: 'bg-amber-500' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Müəllimlər</h1>
          <p className="text-slate-500 text-sm">Sistemdəki müəllimlərin idarə edilməsi</p>
        </div>
        <button
          onClick={() => { setSelectedTeacher(null); setIsModalOpen(true); }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
        >
          <Plus size={20} />
          <span>Yeni Müəllim</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4"
          >
            <div className={`${stat.color} p-3 rounded-xl text-white shadow-lg`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-slate-500 text-sm">{stat.title}</p>
              <h3 className="text-2xl font-bold text-slate-800">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Müəllim axtar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
          />
        </div>
        <button className="flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all">
          <Filter size={20} />
          <span>Filtrlər</span>
        </button>
      </div>

      {/* Teachers Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-sm uppercase tracking-wider font-semibold">
                <th className="px-6 py-4">Müəllim</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Qruplar</th>
                <th className="px-6 py-4">Tələbələr</th>
                <th className="px-6 py-4 text-right">Əməliyyat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <AnimatePresence mode='popLayout'>
                {isLoading ? (
                  Array(5).fill(0).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td className="px-6 py-4"><div className="h-10 w-10 bg-slate-200 rounded-full"></div></td>
                      <td className="px-6 py-4"><div className="h-4 w-32 bg-slate-200 rounded"></div></td>
                      <td className="px-6 py-4"><div className="h-4 w-16 bg-slate-200 rounded"></div></td>
                      <td className="px-6 py-4"><div className="h-4 w-12 bg-slate-200 rounded"></div></td>
                      <td className="px-6 py-4"><div className="h-4 w-12 bg-slate-200 rounded"></div></td>
                      <td className="px-6 py-4"></td>
                    </tr>
                  ))
                ) : (
                  data?.data?.map((teacher) => (
                    <motion.tr
                      key={teacher._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={teacher.avatar || 'https://via.placeholder.com/40'}
                            alt={teacher.name}
                            className="w-10 h-10 rounded-full border border-slate-200 object-cover"
                          />
                          <span className="font-semibold text-slate-700">{teacher.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500">{teacher.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          teacher.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 
                          teacher.status === 'pending' ? 'bg-amber-100 text-amber-700' : 
                          'bg-red-100 text-red-700'
                        }`}>
                          {teacher.status === 'active' ? 'Aktiv' : 
                           teacher.status === 'pending' ? 'Gözləyir' : 'Passiv'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-600">{teacher.groupCount || 0}</td>
                      <td className="px-6 py-4 font-medium text-slate-600">{teacher.studentCount || 0}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleEdit(teacher)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(teacher._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* User Modal for Add/Edit */}
      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={selectedTeacher}
        onSuccess={refetch}
      />
    </div>
  );
};

export default Teachers;
