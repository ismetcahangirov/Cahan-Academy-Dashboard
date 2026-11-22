import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users as UsersIcon, Search, Plus, Eye, Edit2, Trash2, GraduationCap, BookOpen, MoreHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Avatar from '../../components/common/Avatar';
import {
  useGetTeachersQuery,
  useDeleteTeacherMutation,
  useInviteTeacherMutation,
  useUpdateTeacherMutation,
} from '../../features/teachers/teachersApi';
import UserModal from '../users/UserModal';
import { toast } from 'react-hot-toast';
import Dropdown from '../../components/common/Dropdown';
import { Button, Card, EmptyState, Input, PageShell, Skeleton, StatCard, StatusPill, Table } from '../../components/ui';
import { Pagination } from '../users/PeopleBits';
import { USER_STATUS } from '../users/peopleStatus';

const PAGE_SIZE = 10;

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

  const teachers = data?.data || [];
  const loading = isLoading || isFetching;
  const statusPill = (s) => (
    <StatusPill status={USER_STATUS[s] || 'neutral'}>{s === 'active' ? t('students.active') : s === 'pending' ? t('users.pending') : t('students.inactive')}</StatusPill>
  );
  const actionsMenu = (teacher) => (
    <Dropdown
      trigger={<Button variant="ghost" iconOnly size="sm" icon={MoreHorizontal} aria-label={t('students.tableActions')} />}
      items={[
        { label: t('common.view'), icon: <Eye size={14} />, onClick: () => navigate(`/teachers/${teacher._id}`) },
        { label: t('common.edit'), icon: <Edit2 size={14} />, onClick: () => handleEdit(teacher) },
        { label: t('common.delete'), icon: <Trash2 size={14} />, onClick: () => handleDelete(teacher._id), className: 'text-accent-text' },
      ]}
    />
  );

  return (
    <PageShell
      title={t('teachers.title')}
      subtitle={t('teachers.subtitle')}
      actions={
        <Button icon={Plus} onClick={() => { setSelectedTeacher(null); setIsModalOpen(true); }}>
          {t('teachers.newTeacher')}
        </Button>
      }
    >
      <div className="orn-stagger grid grid-cols-1 gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <StatCard key={stat.title} label={stat.title} value={stat.value} icon={stat.icon} />
        ))}
      </div>

      <Card className="p-4">
        <Input
          icon={Search}
          type="text"
          aria-label={t('teachers.searchPlaceholder')}
          placeholder={t('teachers.searchPlaceholder')}
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </Card>

      <section>
        {loading ? (
          <div className="space-y-3" aria-busy="true">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : teachers.length === 0 ? (
          <Card>
            <EmptyState sketch="globe" title={t('teachers.noTeachers')} />
          </Card>
        ) : (
          <>
            <div className="hidden sm:block">
              <Table caption={t('teachers.title')}>
                <thead>
                  <tr>
                    <th>{t('teachers.tableTeacher')}</th>
                    <th>{t('students.tableEmail')}</th>
                    <th>{t('students.tableStatus')}</th>
                    <th className="num">{t('teachers.tableGroups')}</th>
                    <th className="text-right">{t('students.tableActions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((teacher) => (
                    <tr key={teacher._id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <Avatar src={teacher.avatar} name={teacher.name} className="h-10 w-10" textSize="sm" />
                          <p className="font-semibold text-ink">{teacher.name}</p>
                        </div>
                      </td>
                      <td className="text-ink-muted">{teacher.email}</td>
                      <td>{statusPill(teacher.status)}</td>
                      <td className="num">{teacher.groupCount || 0}</td>
                      <td className="text-right">{actionsMenu(teacher)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            <ul className="space-y-3 sm:hidden">
              {teachers.map((teacher) => (
                <li key={teacher._id}>
                  <Card className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar src={teacher.avatar} name={teacher.name} className="h-11 w-11 shrink-0" textSize="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-ink">{teacher.name}</p>
                        <p className="truncate text-sm text-ink-muted">{teacher.email}</p>
                      </div>
                      {actionsMenu(teacher)}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      {statusPill(teacher.status)}
                      <span className="sc text-[0.8rem] text-ink-muted">
                        {t('teachers.tableGroups')}: <span className="num text-ink">{teacher.groupCount || 0}</span>
                      </span>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
            <Pagination page={page} pages={pages} total={meta?.total || 0} pageSize={PAGE_SIZE} onChange={setPage} />
          </>
        )}
      </section>

      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        user={selectedTeacher}
        isLoading={isAdding || isUpdating}
      />
    </PageShell>
  );
};

export default Teachers;
