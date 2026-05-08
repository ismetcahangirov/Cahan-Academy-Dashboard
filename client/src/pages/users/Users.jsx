import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Search, 
  UserPlus, 
  Eye,
  Edit2, 
  Trash2, 
  CheckCircle2,
  User as UserIcon,
  Filter,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Avatar from '../../components/common/Avatar';
import { 
  useGetUsersQuery, 
  useDeleteUserMutation,
  useAddUserMutation,
  useUpdateUserMutation 
} from '../../features/users/userApi';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';
import UserModal from './UserModal';
import Dropdown from '../../components/common/Dropdown';

const RoleBadge = ({ role }) => {
  const { t } = useTranslation();
  const roleLabel = {
    admin: t('common.admin'),
    teacher: t('common.teacher'),
    student: t('common.student'),
  };

  return (
    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize bg-bordo/10 text-bordo border-bordo/20">
      {roleLabel[role] || role}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const { t } = useTranslation();
  const styles = {
    active: 'bg-bordo text-white border-bordo',
    inactive: 'bg-[var(--muted)] text-bordo border-bordo/20',
    pending: 'bg-bordo/10 text-bordo border-bordo/20',
  };
  const dots = {
    active: 'bg-white',
    inactive: 'bg-bordo',
    pending: 'bg-bordo',
  };
  const labels = {
    active: t('students.active'),
    inactive: t('students.inactive'),
    pending: t('users.pending'),
  };

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border',
      styles[status] || styles.inactive
    )}>
      <span className={cn('w-1.5 h-1.5 rounded-full', dots[status] || dots.inactive)}></span>
      {labels[status] || status}
    </span>
  );
};

const Users = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const { data, isLoading, isFetching } = useGetUsersQuery({ 
    page, 
    keyword,
    status: statusFilter,
    pageSize: 10 
  });

  const [deleteUser] = useDeleteUserMutation();
  const [addUser, { isLoading: isAdding }] = useAddUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();

  const handleSearch = (e) => {
    e.preventDefault();
    setKeyword(searchInput);
    setPage(1);
  };

  const handleDelete = async (id) => {
    if (window.confirm(t('students.deleteConfirm'))) {
      try {
        await deleteUser(id).unwrap();
        toast.success(t('users.deleteSuccess'));
      } catch (err) {
        toast.error(err.data?.message || t('students.error'));
      }
    }
  };

  const handleAddUser = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setPage(1);
  };

  const handleApproveUser = async (user) => {
    try {
      await updateUser({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: 'active',
      }).unwrap();
      toast.success(t('users.approveSuccess'));
    } catch (err) {
      toast.error(err?.data?.message || t('students.error'));
    }
  };

  const handleModalSubmit = async (formData) => {
    try {
      if (selectedUser) {
        await updateUser({ id: selectedUser._id, ...formData }).unwrap();
        toast.success(t('users.editSuccess'));
      } else {
        await addUser(formData).unwrap();
        toast.success(t('users.addSuccess'));
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.data?.message || t('students.error'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">{t('users.title')}</h1>
          <p className="text-[var(--muted-foreground)] text-sm mt-1">{t('users.subtitle')}</p>
        </div>
        <button 
          onClick={handleAddUser}
          className="flex items-center justify-center gap-2 bg-bordo hover:bg-bordo/90 text-white px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-bordo/20 font-medium text-sm shrink-0"
        >
          <UserPlus size={18} />
          {t('users.newUser')}
        </button>
      </div>

      {/* Filters Section */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center">
        <form onSubmit={handleSearch} className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]/40" size={18} />
          <input
            type="text"
            placeholder={t('auth.emailPlaceholder')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full bg-[var(--input)] border border-[var(--border)] rounded-xl py-2 pl-10 pr-4 text-[var(--foreground)] text-sm focus:outline-none focus:border-bordo transition-colors"
          />
        </form>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {[
            { label: t('users.allStatuses'), value: '' },
            { label: t('users.pending'), value: 'pending' },
            { label: t('students.active'), value: 'active' },
            { label: t('students.inactive'), value: 'inactive' },
          ].map((item) => (
            <button
              key={item.value || 'all'}
              type="button"
              onClick={() => handleStatusFilter(item.value)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl border text-sm transition-all flex-1 md:flex-none',
                statusFilter === item.value
                  ? 'bg-bordo text-white border-bordo shadow-lg shadow-bordo/20'
                  : 'bg-[var(--muted)] border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--border)]'
              )}
            >
              <Filter size={16} />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden relative">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                <th className="px-6 py-4 text-xs font-semibold text-[var(--muted-foreground)]/60 uppercase tracking-wider">{t('common.user')}</th>
                <th className="px-6 py-4 text-xs font-semibold text-[var(--muted-foreground)]/60 uppercase tracking-wider">{t('users.role')}</th>
                <th className="px-6 py-4 text-xs font-semibold text-[var(--muted-foreground)]/60 uppercase tracking-wider">{t('students.tableStatus')}</th>
                <th className="px-6 py-4 text-xs font-semibold text-[var(--muted-foreground)]/60 uppercase tracking-wider text-right">{t('students.tableActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {isLoading || isFetching ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[var(--muted)]"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-[var(--muted)] rounded w-32"></div>
                          <div className="h-3 bg-[var(--muted)] rounded w-24"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><div className="h-6 bg-[var(--muted)] rounded w-16"></div></td>
                    <td className="px-6 py-4"><div className="h-6 bg-[var(--muted)] rounded w-16"></div></td>
                    <td className="px-6 py-4"><div className="h-8 bg-[var(--muted)] rounded w-8 ml-auto"></div></td>
                  </tr>
                ))
              ) : data?.users?.length > 0 ? (
                data.users.map((user) => (
                  <tr key={user._id} className="group hover:bg-[var(--muted)]/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={user.avatar}
                          name={user.name}
                          className="w-10 h-10 rounded-full border border-[var(--border)] group-hover:border-bordo/50 transition-colors"
                          textSize="sm"
                        />
                        <div>
                          <p className="text-sm font-medium text-[var(--foreground)]">{user.name}</p>
                          <p className="text-xs text-[var(--muted-foreground)]/60">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={user.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end">
                        <Dropdown
                          trigger={
                            <button className="p-2 text-[var(--muted-foreground)]/40 hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-all">
                              <MoreHorizontal size={16} />
                            </button>
                          }
                          items={[
                            ...(user.status === 'pending'
                              ? [{ label: t('users.approve'), icon: <CheckCircle2 size={14} />, onClick: () => handleApproveUser(user), className: 'text-bordo hover:bg-bordo/10' }]
                              : []),
                            { label: t('common.view'), icon: <Eye size={14} />, onClick: () => navigate(`/users/${user._id}`) },
                            { label: t('common.edit'), icon: <Edit2 size={14} />, onClick: () => handleEditUser(user) },
                            { label: t('common.delete'), icon: <Trash2 size={14} />, onClick: () => handleDelete(user._id), className: 'text-bordo hover:bg-bordo/10' }
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-[var(--muted-foreground)]/40">
                      <UserIcon size={40} className="mb-2 opacity-20" />
                      <p>{t('students.noStudents')}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.pages > 1 && (
          <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--muted)]/10 flex items-center justify-between">
            <p className="text-xs text-[var(--muted-foreground)]/60">
              {t('students.totalCount', { 
                total: data.total, 
                from: ((page - 1) * 10) + 1, 
                to: Math.min(page * 10, data.total) 
              })}
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="p-2 rounded-lg border border-[var(--border)] text-[var(--muted-foreground)]/40 hover:text-[var(--foreground)] hover:bg-[var(--muted)] disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: data.pages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={cn(
                      'w-8 h-8 rounded-lg text-xs font-medium transition-all',
                      page === i + 1 
                        ? 'bg-bordo text-white shadow-lg shadow-bordo/20' 
                        : 'text-[var(--muted-foreground)]/40 hover:text-[var(--foreground)] hover:bg-[var(--muted)]'
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                disabled={page === data.pages}
                onClick={() => setPage(p => p + 1)}
                className="p-2 rounded-lg border border-[var(--border)] text-[var(--muted-foreground)]/40 hover:text-[var(--foreground)] hover:bg-[var(--muted)] disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        user={selectedUser}
        isLoading={isAdding || isUpdating}
      />
    </div>
  );
};

export default Users;
