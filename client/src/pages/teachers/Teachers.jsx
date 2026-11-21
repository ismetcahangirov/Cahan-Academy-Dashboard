import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users as UsersIcon,
  Search,
  Plus,
  Eye,
  Edit2, 
  Trash2,
  GraduationCap,
  BookOpen,
  MoreHorizontal
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Avatar from '../../components/common/Avatar';
import { 
  useGetTeachersQuery, 
  useDeleteTeacherMutation,
  useInviteTeacherMutation,
  useUpdateTeacherMutation
} from '../../features/teachers/teachersApi';
import UserModal from '../users/UserModal';
import { toast } from 'react-hot-toast';
import { cn } from '../../lib/utils';
import Dropdown from '../../components/common/Dropdown';

const PAGE_SIZE = 10;

const StatusBadge = ({ status }) => {
  const { t } = useTranslation();
  const isActive = status === 'active';
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border',
      isActive 
        ? 'border-bordo/20' 
        : 'bg-[var(--muted)] text-[var(--muted-foreground)] border-[var(--border)]'
    )}
    style={{ color: 'var(--bordo-contrast)', backgroundColor: isActive ? 'var(--bordo-muted)' : undefined }}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', isActive ? 'bg-bordo' : 'bg-[var(--muted-foreground)]/40')}></span>
      {isActive ? t('students.active') : t('students.inactive')}
    </span>
  );
};

const Teachers = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  const { data, isLoading, isFetching } = useGetTeachersQuery({ page, limit: PAGE_SIZE, search });
  const meta = data?.meta;
  const pages = meta?.pages || 1;

  const handleSearch = (value) => {
    setSearch(value);
    setPage(1);
  };
  const [deleteTeacher] = useDeleteTeacherMutation();
  const [inviteTeacher, { isLoading: isAdding }] = useInviteTeacherMutation();
  const [updateTeacher, { isLoading: isUpdating }] = useUpdateTeacherMutation();

  const handleEdit = (teacher) => {
    setSelectedTeacher(teacher);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm(t('teachers.deleteConfirm'))) {
      try {
        await deleteTeacher(id).unwrap();
        toast.success(t('teachers.deleteSuccess'));
      } catch {
        toast.error(t('students.error'));
      }
    }
  };

  const handleModalSubmit = async (formData) => {
    try {
      if (selectedTeacher) {
        await updateTeacher({ id: selectedTeacher._id, ...formData }).unwrap();
        toast.success(t('teachers.updateSuccess'));
      } else {
        await inviteTeacher({ ...formData, role: 'teacher' }).unwrap();
        toast.success(t('teachers.createSuccess'));
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.data?.message || t('students.error'));
    }
  };

  const stats = [
    { title: t('teachers.totalTeachers'), value: meta?.total || 0, icon: UsersIcon },
    { title: t('teachers.activeTeachers'), value: meta?.active || 0, icon: GraduationCap },
    { title: t('teachers.groupsTotal'), value: meta?.groupsTotal || 0, icon: BookOpen },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] flex items-center gap-3">
            <div className="p-2 bg-bordo text-white rounded-lg shadow-sm">
              <UsersIcon size={20} />
            </div>
            {t('teachers.title')}
          </h1>
          <p className="text-[var(--muted-foreground)]/60 text-sm mt-1">{t('teachers.subtitle')}</p>
        </div>
        <button
          onClick={() => { setSelectedTeacher(null); setIsModalOpen(true); }}
          className="flex items-center justify-center gap-2 bg-bordo hover:bg-bordo/90 text-white px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-bordo/20 font-medium text-sm shrink-0"
        >
          <Plus size={18} />
          {t('teachers.newTeacher')}
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
            className="bg-bordo border border-bordo rounded-2xl p-5 flex items-center gap-4 text-white shadow-lg shadow-bordo/20"
          >
            <div className="p-3 rounded-xl bg-white text-bordo shadow-sm">
              <stat.icon size={22} />
            </div>
            <div>
              <p className="text-white/75 text-sm">{stat.title}</p>
              <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]/40" size={18} />
          <input
            type="text"
            placeholder={t('teachers.searchPlaceholder')}
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full bg-[var(--input)] border border-[var(--border)] rounded-xl py-2 pl-10 pr-4 text-[var(--foreground)] text-sm focus:outline-none focus:border-bordo transition-colors"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden relative">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]/20">
                <th className="px-6 py-4 text-xs font-semibold text-[var(--muted-foreground)]/40 uppercase tracking-wider">{t('teachers.tableTeacher')}</th>
                <th className="px-6 py-4 text-xs font-semibold text-[var(--muted-foreground)]/40 uppercase tracking-wider">{t('students.tableEmail')}</th>
                <th className="px-6 py-4 text-xs font-semibold text-[var(--muted-foreground)]/40 uppercase tracking-wider">{t('students.tableStatus')}</th>
                <th className="px-6 py-4 text-xs font-semibold text-[var(--muted-foreground)]/40 uppercase tracking-wider">{t('teachers.tableGroups')}</th>
                <th className="px-6 py-4 text-xs font-semibold text-[var(--muted-foreground)]/40 uppercase tracking-wider text-right">{t('students.tableActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {isLoading || isFetching ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[var(--muted)]"></div>
                        <div className="h-4 bg-[var(--muted)] rounded w-32"></div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><div className="h-4 bg-[var(--muted)] rounded w-40"></div></td>
                    <td className="px-6 py-4"><div className="h-6 bg-[var(--muted)] rounded w-16"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-[var(--muted)] rounded w-8"></div></td>
                    <td className="px-6 py-4"><div className="h-8 bg-[var(--muted)] rounded w-8 ml-auto"></div></td>
                  </tr>
                ))
              ) : data?.data?.length > 0 ? (
                data.data.map((teacher) => (
                  <tr key={teacher._id} className="group hover:bg-[var(--muted)]/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={teacher.avatar}
                          name={teacher.name}
                          className="w-10 h-10 rounded-full border border-[var(--border)] group-hover:border-bordo/50 transition-colors"
                          textSize="sm"
                        />
                        <p className="text-sm font-medium text-[var(--foreground)]">{teacher.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[var(--muted-foreground)]/60 text-sm">{teacher.email}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={teacher.status} />
                    </td>
                    <td className="px-6 py-4 text-[var(--muted-foreground)]/80 text-sm">{teacher.groupCount || 0}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end">
                        <Dropdown
                          trigger={
                            <button className="p-2 text-[var(--muted-foreground)]/40 hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-all">
                              <MoreHorizontal size={16} />
                            </button>
                          }
                          items={[
                            { label: t('common.view'), icon: <Eye size={14} />, onClick: () => navigate(`/teachers/${teacher._id}`) },
                            { label: t('common.edit'), icon: <Edit2 size={14} />, onClick: () => handleEdit(teacher) },
                            { label: t('common.delete'), icon: <Trash2 size={14} />, onClick: () => handleDelete(teacher._id), className: 'text-bordo hover:bg-bordo/10' }
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-[var(--muted-foreground)]/40">
                      <GraduationCap size={40} className="mb-2 opacity-20" />
                      <p>{t('teachers.noTeachers')}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--muted)]/10 flex items-center justify-between">
          <p className="text-xs text-[var(--muted-foreground)]/40">{t('teachers.totalCount', { count: meta?.total || 0 })}</p>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border border-[var(--border)] rounded-lg text-[var(--muted-foreground)]/40 hover:text-[var(--foreground)] hover:bg-[var(--muted)] disabled:opacity-30 text-sm transition-all">{t('students.prev')}</button>
            <button disabled={page >= pages || isFetching} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border border-[var(--border)] rounded-lg text-[var(--muted-foreground)]/40 hover:text-[var(--foreground)] hover:bg-[var(--muted)] disabled:opacity-30 text-sm transition-all">{t('students.next')}</button>
          </div>
        </div>
      </div>

      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        user={selectedTeacher}
        isLoading={isAdding || isUpdating}
      />
    </div>
  );
};

export default Teachers;
