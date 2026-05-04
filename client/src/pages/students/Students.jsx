import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users as UsersIcon, 
  Search, 
  Filter, 
  Plus, 
  Edit2, 
  Trash2, 
  UserPlus,
  GraduationCap,
  School,
  TrendingUp
} from 'lucide-react';
import { 
  useGetStudentsQuery, 
  useDeleteStudentMutation 
} from '../../features/students/studentsApi';
import UserModal from '../users/UserModal';
import { toast } from 'react-hot-toast';

const Students = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const { data, isLoading, isError, refetch } = useGetStudentsQuery({
    page,
    limit: 10,
    search,
  });

  const [deleteStudent] = useDeleteStudentMutation();

  const handleEdit = (student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bu tələbəni silmək istədiyinizə əminsiniz?')) {
      try {
        await deleteStudent(id).unwrap();
        toast.success('Tələbə uğurla silindi');
      } catch (error) {
        toast.error('Xəta baş verdi');
      }
    }
  };

  const stats = [
    { title: 'Ümumi Tələbələr', value: data?.pagination?.total || 0, icon: UsersIcon, color: 'bg-indigo-500' },
    { title: 'Aktiv Tələbələr', value: data?.data?.filter(t => t.isActive).length || 0, icon: GraduationCap, color: 'bg-emerald-500' },
    { title: 'Yeni Tələbələr', value: data?.data?.filter(t => {
      const createdDate = new Date(t.createdAt);
      const now = new Date();
      return createdDate > new Date(now.setDate(now.getDate() - 7));
    }).length || 0, icon: TrendingUp, color: 'bg-orange-500' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Tələbələr</h1>
          <p className="text-slate-500 text-sm">Akademiyanın bütün tələbələrinin siyahısı</p>
        </div>
        <button
          onClick={() => { setSelectedStudent(null); setIsModalOpen(true); }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
        >
          <Plus size={20} />
          <span>Yeni Tələbə</span>
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
            placeholder="Tələbə axtar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
          />
        </div>
        <button className="flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all">
          <Filter size={20} />
          <span>Qruplar üzrə filter</span>
        </button>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-sm uppercase tracking-wider font-semibold">
                <th className="px-6 py-4">Tələbə</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Qrup</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Qeydiyyat Tarixi</th>
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
                      <td className="px-6 py-4"><div className="h-4 w-20 bg-slate-200 rounded"></div></td>
                      <td className="px-6 py-4"><div className="h-4 w-16 bg-slate-200 rounded"></div></td>
                      <td className="px-6 py-4"><div className="h-4 w-24 bg-slate-200 rounded"></div></td>
                      <td className="px-6 py-4"></td>
                    </tr>
                  ))
                ) : (
                  data?.data?.map((student) => (
                    <motion.tr
                      key={student._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={student.avatar || 'https://via.placeholder.com/40'}
                            alt={student.name}
                            className="w-10 h-10 rounded-full border border-slate-200 object-cover"
                          />
                          <span className="font-semibold text-slate-700">{student.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-sm">{student.email}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-indigo-600 font-medium bg-indigo-50 px-2 py-1 rounded-lg w-fit">
                          <School size={14} />
                          <span className="text-xs">{student.group || 'Qrupsuz'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          student.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 
                          student.status === 'pending' ? 'bg-amber-100 text-amber-700' : 
                          'bg-red-100 text-red-700'
                        }`}>
                          {student.status === 'active' ? 'Aktiv' : 
                           student.status === 'pending' ? 'Gözləyir' : 'Passiv'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-sm">
                        {new Date(student.createdAt).toLocaleDateString('az-AZ')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleEdit(student)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(student._id)}
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
        
        {/* Pagination Info */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Cəmi <span className="font-semibold">{data?.pagination?.total || 0}</span> tələbə
          </p>
          <div className="flex gap-2">
            <button 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1 border border-slate-200 rounded-lg text-sm hover:bg-white disabled:opacity-50 transition-all"
            >
              Əvvəlki
            </button>
            <button 
              disabled={page === data?.pagination?.pages}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 border border-slate-200 rounded-lg text-sm hover:bg-white disabled:opacity-50 transition-all"
            >
              Növbəti
            </button>
          </div>
        </div>
      </div>

      {/* User Modal for Add/Edit */}
      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={selectedStudent}
        onSuccess={refetch}
      />
    </div>
  );
};

export default Students;
