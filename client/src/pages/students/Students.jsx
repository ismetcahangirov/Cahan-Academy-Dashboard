import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users as UsersIcon, 
  Search, 
  Filter, 
  Plus, 
  Edit2, 
  Trash2,
  GraduationCap,
  TrendingUp,
  BookOpen,
  MoreHorizontal
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { 
  useGetStudentsQuery, 
  useDeleteStudentMutation,
  useInviteStudentMutation,
  useUpdateStudentMutation
} from '../../features/students/studentsApi';
import UserModal from '../users/UserModal';
import { toast } from 'react-hot-toast';
import { cn } from '../../lib/utils';

const StatusBadge = ({ status }) => {
  const { t } = useTranslation();
  const isActive = status === 'active';
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border',
      isActive 
        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
        : 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'
    )}>
      <span className={cn('w-1.5 h-1.5 rounded-full', isActive ? 'bg-emerald-500' : 'bg-zinc-500')}></span>
      {isActive ? t('students.active') : t('students.inactive')}
    </span>
  );
};

const Students = () => {
  const { t, i18n } = useTranslation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const { data, isLoading, isFetching } = useGetStudentsQuery({ page, limit: 10, search });
  const [deleteStudent] = useDeleteStudentMutation();
  const [inviteStudent, { isLoading: isAdding }] = useInviteStudentMutation();
  const [updateStudent, { isLoading: isUpdating }] = useUpdateStudentMutation();

  const handleEdit = (student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm(t('students.deleteConfirm'))) {
      try {
        await deleteStudent(id).unwrap();
        toast.success(t('students.deleteSuccess'));
      } catch (error) {
        toast.error(t('students.error'));
      }
    }
  };

  const handleModalSubmit = async (formData) => {
    try {
      if (selectedStudent) {
        await updateStudent({ id: selectedStudent._id, ...formData }).unwrap();
        toast.success(t('students.updateSuccess'));
      } else {
        await inviteStudent({ ...formData, role: 'student' }).unwrap();
        toast.success(t('students.createSuccess'));
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.data?.message || t('students.error'));
    }
  };

  const stats = [
    { title: t('students.totalStudents'), value: data?.pagination?.total || 0, icon: UsersIcon, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { title: t('students.activeStudents'), value: data?.data?.filter(t => t.status === 'active').length || 0, icon: GraduationCap, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { title: t('students.newStudents7Days'), value: data?.data?.filter(t => {
      const d = new Date(t.createdAt);
      const now = new Date();
      return d > new Date(now.setDate(now.getDate() - 7));
    }).length || 0, icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('students.title')}</h1>
          <p className="text-white/60 text-sm mt-1">{t('students.subtitle')}</p>
        </div>
        <button
          onClick={() => { setSelectedStudent(null); setIsModalOpen(true); }}
          className="flex items-center justify-center gap-2 bg-bordo hover:bg-bordo/90 text-white px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-bordo/20 font-medium text-sm shrink-0"
        >
          <Plus size={18} />
          {t('students.newStudent')}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center gap-4"
          >
            <div className={cn('p-3 rounded-xl', stat.bg)}>
              <stat.icon size={22} className={stat.color} />
            </div>
            <div>
              <p className="text-white/50 text-sm">{stat.title}</p>
              <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
          <input
            type="text"
            placeholder={t('students.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-bordo transition-colors"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm hover:text-white hover:bg-white/10 transition-all flex-1 md:flex-none">
          <Filter size={16} />
          {t('students.filterGroup')}
        </button>
      </div>

      {/* Table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-wider">{t('students.tableStudent')}</th>
                <th className="px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-wider">{t('students.tableEmail')}</th>
                <th className="px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-wider">{t('students.tableGroup')}</th>
                <th className="px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-wider">{t('students.tableStatus')}</th>
                <th className="px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-wider">{t('students.tableRegistration')}</th>
                <th className="px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-wider text-right">{t('students.tableActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading || isFetching ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-white/10"></div><div className="h-4 bg-white/10 rounded w-32"></div></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-white/10 rounded w-40"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-white/10 rounded w-20"></div></td>
                    <td className="px-6 py-4"><div className="h-6 bg-white/10 rounded w-16"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-white/10 rounded w-24"></div></td>
                    <td className="px-6 py-4"><div className="h-8 bg-white/10 rounded w-8 ml-auto"></div></td>
                  </tr>
                ))
              ) : data?.data?.length > 0 ? (
                data.data.map((student) => (
                  <tr key={student._id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={student.avatar || `https://ui-avatars.com/api/?name=${student.name}&background=7B001C&color=fff`}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover border border-white/10 group-hover:border-bordo/50 transition-colors"
                        />
                        <p className="text-sm font-medium text-white">{student.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white/50 text-sm">{student.email}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-blue-500/10 text-blue-400 border-blue-500/20">
                        <BookOpen size={12} />
                        {student.group || t('students.noGroup')}
                      </span>
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={student.status} /></td>
                    <td className="px-6 py-4 text-white/50 text-sm">{new Date(student.createdAt).toLocaleDateString(i18n.language === 'az' ? 'az-AZ' : i18n.language === 'ru' ? 'ru-RU' : 'en-US')}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEdit(student)} className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-all"><Edit2 size={16} /></button>
                        <button onClick={() => handleDelete(student._id)} className="p-2 text-white/40 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 size={16} /></button>
                        <button className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-all"><MoreHorizontal size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-white/40">
                      <GraduationCap size={40} className="mb-2 opacity-20" />
                      <p>{t('students.noStudents')}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-white/10 bg-white/[0.01] flex items-center justify-between">
          <p className="text-xs text-white/40">{t('students.totalCount', { count: data?.pagination?.total || 0 })}</p>
          <div className="flex items-center gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border border-white/10 rounded-lg text-white/40 hover:text-white hover:bg-white/5 disabled:opacity-30 text-sm transition-all">{t('students.prev')}</button>
            <button disabled={page === data?.pagination?.pages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border border-white/10 rounded-lg text-white/40 hover:text-white hover:bg-white/5 disabled:opacity-30 text-sm transition-all">{t('students.next')}</button>
          </div>
        </div>
      </div>

      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        user={selectedStudent}
        isLoading={isAdding || isUpdating}
      />
    </div>
  );
};

export default Students;
