import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus, Eye, Edit2, Trash2, CheckCircle2, MoreHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Avatar from '../../components/common/Avatar';
import {
  useGetUsersQuery,
  useDeleteUserMutation,
  useAddUserMutation,
  useUpdateUserMutation,
} from '../../features/users/userApi';
import toast from 'react-hot-toast';
import UserModal from './UserModal';
import Dropdown from '../../components/common/Dropdown';
import { Button, Card, EmptyState, Input, PageShell, Skeleton, StatusPill, Table } from '../../components/ui';
import { FilterChips, Pagination, RoleBadge, USER_STATUS } from './PeopleBits';

const PAGE_SIZE = 10;

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
    pageSize: PAGE_SIZE,
  });

  const [deleteUser] = useDeleteUserMutation();
  const [addUser, { isLoading: isAdding }] = useAddUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();

  const statusLabels = {
    active: t('students.active'),
    inactive: t('students.inactive'),
    pending: t('users.pending'),
  };

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

  const menuItems = (user) => [
    ...(user.status === 'pending'
      ? [{ label: t('users.approve'), icon: <CheckCircle2 size={14} />, onClick: () => handleApproveUser(user), className: 'text-accent-text' }]
      : []),
    { label: t('common.view'), icon: <Eye size={14} />, onClick: () => navigate(`/users/${user._id}`) },
    { label: t('common.edit'), icon: <Edit2 size={14} />, onClick: () => handleEditUser(user) },
    { label: t('common.delete'), icon: <Trash2 size={14} />, onClick: () => handleDelete(user._id), className: 'text-accent-text' },
  ];

  const actionsMenu = (user) => (
    <Dropdown
      trigger={<Button variant="ghost" iconOnly size="sm" icon={MoreHorizontal} aria-label={t('students.tableActions')} />}
      items={menuItems(user)}
    />
  );

  const users = data?.users || [];
  const loading = isLoading || isFetching;

  return (
    <PageShell
      title={t('users.title')}
      subtitle={t('users.subtitle')}
      actions={
        <Button icon={UserPlus} onClick={handleAddUser}>
          {t('users.newUser')}
        </Button>
      }
    >
      <Card className="flex flex-col gap-4 p-4 md:flex-row md:items-center">
        <form onSubmit={handleSearch} className="w-full flex-1" role="search">
          <Input
            icon={Search}
            type="text"
            aria-label={t('auth.emailPlaceholder')}
            placeholder={t('auth.emailPlaceholder')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </form>
        <FilterChips
          value={statusFilter}
          onChange={handleStatusFilter}
          items={[
            { label: t('users.allStatuses'), value: '' },
            { label: t('users.pending'), value: 'pending' },
            { label: t('students.active'), value: 'active' },
            { label: t('students.inactive'), value: 'inactive' },
          ]}
        />
      </Card>

      <section>
        {loading ? (
          <div className="space-y-3" aria-busy="true">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <Card>
            <EmptyState sketch="globe" title={t('students.noStudents')} />
          </Card>
        ) : (
          <>
            {/* >= 640px: table */}
            <div className="hidden sm:block">
              <Table caption={t('users.title')}>
                <thead>
                  <tr>
                    <th>{t('common.user')}</th>
                    <th>{t('users.role')}</th>
                    <th>{t('students.tableStatus')}</th>
                    <th className="text-right">{t('students.tableActions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <Avatar src={user.avatar} name={user.name} className="h-10 w-10" textSize="sm" />
                          <div className="min-w-0">
                            <p className="font-semibold text-ink">{user.name}</p>
                            <p className="text-sm text-ink-muted">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <RoleBadge role={user.role} />
                      </td>
                      <td>
                        <StatusPill status={USER_STATUS[user.status] || 'neutral'}>
                          {statusLabels[user.status] || user.status}
                        </StatusPill>
                      </td>
                      <td className="text-right">{actionsMenu(user)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            {/* < 640px: card list */}
            <ul className="space-y-3 sm:hidden">
              {users.map((user) => (
                <li key={user._id}>
                  <Card className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar src={user.avatar} name={user.name} className="h-11 w-11 shrink-0" textSize="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-ink">{user.name}</p>
                        <p className="truncate text-sm text-ink-muted">{user.email}</p>
                      </div>
                      {actionsMenu(user)}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <RoleBadge role={user.role} />
                      <StatusPill status={USER_STATUS[user.status] || 'neutral'}>
                        {statusLabels[user.status] || user.status}
                      </StatusPill>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
            <Pagination page={page} pages={data?.pages} total={data?.total} pageSize={PAGE_SIZE} onChange={setPage} />
          </>
        )}
      </section>

      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        user={selectedUser}
        isLoading={isAdding || isUpdating}
      />
    </PageShell>
  );
};

export default Users;
