import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  UserPlus, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Shield, 
  User as UserIcon,
  Filter,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal
} from 'lucide-react';
import { 
  useGetUsersQuery, 
  useDeleteUserMutation,
  useAddUserMutation,
  useUpdateUserMutation 
} from '../../features/users/userApi';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';
import UserModal from './UserModal';

const RoleBadge = ({ role }) => {
  const styles = {
    admin: 'bg-red-500/10 text-red-500 border-red-500/20',
    teacher: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    student: 'bg-green-500/10 text-green-500 border-green-500/20',
  };

  return (
    <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize', styles[role] || styles.student)}>
      {role}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const isActive = status === 'active';
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border',
      isActive 
        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
        : 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'
    )}>
      <span className={cn('w-1.5 h-1.5 rounded-full', isActive ? 'bg-emerald-500' : 'bg-zinc-500')}></span>
      {isActive ? 'Aktiv' : 'Deaktiv'}
    </span>
  );
};

const Users = () => {
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const { data, isLoading, isFetching } = useGetUsersQuery({ 
    page, 
    keyword,
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
    if (window.confirm('Bu istifadəçini silmək istədiyinizə əminsiniz?')) {
      try {
        await deleteUser(id).unwrap();
        toast.success('İstifadəçi uğurla silindi');
      } catch (err) {
        toast.error(err.data?.message || 'Xəta baş verdi');
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

  const handleModalSubmit = async (formData) => {
    try {
      if (selectedUser) {
        await updateUser({ id: selectedUser._id, ...formData }).unwrap();
        toast.success('İstifadəçi məlumatları yeniləndi');
      } else {
        await addUser(formData).unwrap();
        toast.success('Yeni istifadəçi yaradıldı');
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.data?.message || 'Xəta baş verdi');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">İstifadəçilər</h1>
          <p className="text-white/60 text-sm mt-1">Sistemdəki bütün istifadəçilərin idarə edilməsi.</p>
        </div>
        <button 
          onClick={handleAddUser}
          className="flex items-center justify-center gap-2 bg-bordo hover:bg-bordo/90 text-white px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-bordo/20 font-medium text-sm shrink-0"
        >
          <UserPlus size={18} />
          Yeni İstifadəçi
        </button>
      </div>

      {/* Filters Section */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center">
        <form onSubmit={handleSearch} className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
          <input
            type="text"
            placeholder="Ad və ya email ilə axtar..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-bordo transition-colors"
          />
        </form>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm hover:text-white hover:bg-white/10 transition-all flex-1 md:flex-none">
            <Filter size={16} />
            Filtrlər
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden relative">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-wider">İstifadəçi</th>
                <th className="px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-wider">Rol</th>
                <th className="px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-wider text-right">Əməliyyatlar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading || isFetching ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/10"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-white/10 rounded w-32"></div>
                          <div className="h-3 bg-white/10 rounded w-24"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><div className="h-6 bg-white/10 rounded w-16"></div></td>
                    <td className="px-6 py-4"><div className="h-6 bg-white/10 rounded w-16"></div></td>
                    <td className="px-6 py-4"><div className="h-8 bg-white/10 rounded w-8 ml-auto"></div></td>
                  </tr>
                ))
              ) : data?.users?.length > 0 ? (
                data.users.map((user) => (
                  <tr key={user._id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=7B001C&color=fff`} 
                          alt="" 
                          className="w-10 h-10 rounded-full object-cover border border-white/10 group-hover:border-bordo/50 transition-colors"
                        />
                        <div>
                          <p className="text-sm font-medium text-white">{user.name}</p>
                          <p className="text-xs text-white/40">{user.email}</p>
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
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleEditUser(user)}
                          className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(user._id)}
                          className="p-2 text-white/40 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                        <button className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                          <MoreHorizontal size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-white/40">
                      <UserIcon size={40} className="mb-2 opacity-20" />
                      <p>İstifadəçi tapılmadı</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.pages > 1 && (
          <div className="px-6 py-4 border-t border-white/10 bg-white/[0.01] flex items-center justify-between">
            <p className="text-xs text-white/40">
              Cəmi <span className="text-white">{data.total}</span> nəticədən {((page - 1) * 10) + 1}-{Math.min(page * 10, data.total)} arası göstərilir
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="p-2 rounded-lg border border-white/10 text-white/40 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
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
                        : 'text-white/40 hover:text-white hover:bg-white/5'
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                disabled={page === data.pages}
                onClick={() => setPage(p => p + 1)}
                className="p-2 rounded-lg border border-white/10 text-white/40 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
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
