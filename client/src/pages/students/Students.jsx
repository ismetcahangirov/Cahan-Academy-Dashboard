import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Users as UsersIcon,
  Search,
  Plus,
  Eye,
  Edit2,
  Trash2,
  GraduationCap,
  TrendingUp,
  BookOpen,
  MoreHorizontal,
  Banknote,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Avatar from '../../components/common/Avatar';
import {
  useGetStudentsQuery,
  useDeleteStudentMutation,
  useInviteStudentMutation,
  useUpdateStudentMutation,
} from '../../features/students/studentsApi';
import UserModal from '../users/UserModal';
import { toast } from 'react-hot-toast';
import Dropdown from '../../components/common/Dropdown';
import Select from '../../components/common/Select';
import { selectCurrentUser } from '../../features/auth/authSlice';
import { useGetGroupsQuery } from '../../features/groups/groupsApi';
import { formatDate } from '../../utils/formatDate';
import { Badge, Button, Card, EmptyState, Input, PageShell, Skeleton, StatCard, StatusPill, Table } from '../../components/ui';
import { Pagination } from '../users/PeopleBits';
import { USER_STATUS } from '../users/peopleStatus';

const PAGE_SIZE = 10;

const Students = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const isAdmin = user?.role === 'admin';
  // The search lives in the URL so the header search box can open /students?search=...
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('search') || '';
  const [page, setPage] = useState(1);
  const [groupId, setGroupId] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Back to the first page whenever the search changes (also when it comes from the header)
  const [prevSearch, setPrevSearch] = useState(search);
  if (search !== prevSearch) {
    setPrevSearch(search);
    setPage(1);
  }

  const setSearch = (value) => {
    setSearchParams(value ? { search: value } : {}, { replace: true });
  };

  const { data, isLoading, isFetching } = useGetStudentsQuery({
    page,
    limit: PAGE_SIZE,
    search,
    ...(groupId && { groupId }),
  });
  const { data: groupsData } = useGetGroupsQuery();
  const meta = data?.meta;
  const total = meta?.total || 0;
  const pages = meta?.pages || 1;
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
      } catch {
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
    { title: t('students.totalStudents'), value: total, icon: UsersIcon },
    { title: t('students.activeStudents'), value: meta?.active || 0, icon: GraduationCap },
    { title: t('students.newStudents7Days'), value: meta?.recent || 0, icon: TrendingUp },
  ];

  const rowActions = (student) => [
    { label: t('common.view'), icon: <Eye size={14} />, onClick: () => navigate(`/students/${student._id}`) },
    ...(isAdmin
      ? [
          { label: t('payments.title'), icon: <Banknote size={14} />, onClick: () => navigate(`/students/${student._id}/payments`) },
          { label: t('common.edit'), icon: <Edit2 size={14} />, onClick: () => handleEdit(student) },
          { label: t('common.delete'), icon: <Trash2 size={14} />, onClick: () => handleDelete(student._id), className: 'text-accent-text' },
        ]
      : []),
  ];

  const students = data?.data || [];
  const loading = isLoading || isFetching;
  const statusPill = (s) => (
    <StatusPill status={USER_STATUS[s] || 'neutral'}>{s === 'active' ? t('students.active') : s === 'pending' ? t('users.pending') : t('students.inactive')}</StatusPill>
  );
  // one line, truncated, full group name(s) in the tooltip: long names no longer wrap into 2-line pills
  const groupBadge = (student) => (
    <Badge tone="accent" className="inline-flex max-w-[15rem] items-center gap-1.5 whitespace-nowrap" title={student.group || undefined}>
      <BookOpen size={12} aria-hidden="true" className="shrink-0" />
      <span className="min-w-0 truncate">{student.group || t('students.noGroup')}</span>
    </Badge>
  );
  const actionsMenu = (student) => (
    <Dropdown
      trigger={<Button variant="ghost" iconOnly size="sm" icon={MoreHorizontal} aria-label={t('students.tableActions')} />}
      items={rowActions(student)}
    />
  );

  return (
    <PageShell
      title={t('students.title')}
      subtitle={t('students.subtitle')}
      actions={
        isAdmin && (
          <Button icon={Plus} onClick={() => { setSelectedStudent(null); setIsModalOpen(true); }}>
            {t('students.newStudent')}
          </Button>
        )
      }
    >
      <div className="orn-stagger grid grid-cols-1 gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <StatCard key={stat.title} label={stat.title} value={stat.value} icon={stat.icon} />
        ))}
      </div>

      <Card className="flex flex-col gap-4 p-4 md:flex-row md:items-center">
        <div className="w-full flex-1">
          <Input
            icon={Search}
            type="text"
            aria-label={t('students.searchPlaceholder')}
            placeholder={t('students.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={groupId}
          onChange={(val) => { setGroupId(val); setPage(1); }}
          placeholder={t('students.filterGroup')}
          className="w-full md:w-56"
          options={[
            { label: t('students.allGroups'), value: '' },
            ...(groupsData?.data?.map((g) => ({ label: g.name, value: g._id })) || []),
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
        ) : students.length === 0 ? (
          <Card>
            <EmptyState sketch="globe" title={t('students.noStudents')} />
          </Card>
        ) : (
          <>
            <div className="hidden sm:block">
              <Table caption={t('students.title')}>
                <thead>
                  <tr>
                    <th>{t('students.tableStudent')}</th>
                    <th>{t('students.tableEmail')}</th>
                    <th>{t('students.tableGroup')}</th>
                    <th>{t('students.tableStatus')}</th>
                    <th>{t('students.tableRegistration')}</th>
                    <th className="text-right">{t('students.tableActions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student._id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <Avatar src={student.avatar} name={student.name} className="h-10 w-10" textSize="sm" />
                          <p className="font-semibold text-ink">{student.name}</p>
                        </div>
                      </td>
                      <td className="text-ink-muted">{student.email}</td>
                      <td>{groupBadge(student)}</td>
                      <td>{statusPill(student.status)}</td>
                      <td className="text-ink-muted">{formatDate(student.createdAt, 'd MMM yyyy')}</td>
                      <td className="text-right">{actionsMenu(student)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            <ul className="space-y-3 sm:hidden">
              {students.map((student) => (
                <li key={student._id}>
                  <Card className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar src={student.avatar} name={student.name} className="h-11 w-11 shrink-0" textSize="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-ink">{student.name}</p>
                        <p className="truncate text-sm text-ink-muted">{student.email}</p>
                      </div>
                      {actionsMenu(student)}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {groupBadge(student)}
                      {statusPill(student.status)}
                    </div>
                    <p className="num mt-2 text-sm text-ink-muted">{formatDate(student.createdAt, 'd MMM yyyy')}</p>
                  </Card>
                </li>
              ))}
            </ul>
            <Pagination page={page} pages={pages} total={total} pageSize={PAGE_SIZE} onChange={setPage} />
          </>
        )}
      </section>

      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        user={selectedStudent}
        isLoading={isAdding || isUpdating}
        defaultRole="student"
        title={t('students.newStudent')}
      />
    </PageShell>
  );
};

export default Students;
