import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Search,
  Plus,
  Calendar,
  BookOpen,
  User,
  X,
  Edit2,
  Trash2,
  UserPlus,
  ChevronRight,
  GraduationCap,
} from 'lucide-react';
import {
  useGetGroupsQuery,
  useGetGroupByIdQuery,
  useCreateGroupMutation,
  useUpdateGroupMutation,
  useDeleteGroupMutation,
  useAddStudentToGroupMutation,
} from '../../features/groups/groupsApi';
import { useGetStudentsQuery } from '../../features/students/studentsApi';
import { useGetTeachersQuery } from '../../features/teachers/teachersApi';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../features/auth/authSlice';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';
import Select from '../../components/common/Select';
import Avatar from '../../components/common/Avatar';
import { PageShell, Card, Button, Badge, StatusPill, Modal, FormField, Input, Textarea, EmptyState, Skeleton } from '../../components/ui';
import { DAY_KEYS, DAY_NAMES, formatDays, toDayName } from '../../utils/days';
import { formatDate } from '../../utils/formatDate';

// Days are stored as language-neutral English names; labels follow the UI language
const getDays = (t) => DAY_NAMES.map((value, i) => ({ value, label: t(`schedule.days.${DAY_KEYS[i]}`) }));

// ─── Group Detail Modal ──────────────────────────────────────────────────────
const GroupDetailModal = ({ groupId, onClose, isAdmin }) => {
  const { t } = useTranslation();
  const [studentSearch, setStudentSearch] = useState('');
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');

  const { data: groupData, isLoading } = useGetGroupByIdQuery(groupId, { skip: !groupId });
  const { data: studentsData } = useGetStudentsQuery({ limit: 200 }, { skip: !isAdmin || !showAddStudent });
  const [addStudentToGroup, { isLoading: isAdding }] = useAddStudentToGroupMutation();

  const group = groupData?.data;
  const existingStudentIds = group?.students?.map((s) => s._id) || [];
  const availableStudents = studentsData?.data?.filter((s) => !existingStudentIds.includes(s._id)) || [];

  const handleAddStudent = async () => {
    if (!selectedStudentId) return;
    try {
      await addStudentToGroup({ groupId, studentId: selectedStudentId }).unwrap();
      toast.success(t('groups.studentAdded'));
      setSelectedStudentId('');
      setShowAddStudent(false);
    } catch (err) {
      toast.error(err?.data?.message || t('students.error'));
    }
  };

  const filteredStudents = group?.students?.filter((s) =>
    s.name?.toLowerCase().includes(studentSearch.toLowerCase())
  );

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={isLoading ? t('common.loading') : group?.name}
      subtitle={isLoading ? undefined : group?.course}
    >
      {isLoading ? (
        <div className="space-y-3">
          {Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-[var(--radius-md)]" />
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          {/* Info Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card variant="paper" className="flex items-center gap-3 p-4">
              <GraduationCap size={20} className="text-accent-text" aria-hidden="true" />
              <div>
                <p className="sc text-[0.8rem] text-ink-muted">{t('groups.teacher')}</p>
                <p className="font-semibold text-ink">{group?.teacher?.name || t('teachers.noTeachers')}</p>
              </div>
            </Card>
            <Card variant="paper" className="flex items-center gap-3 p-4">
              <Users size={20} className="text-accent-text" aria-hidden="true" />
              <div>
                <p className="sc text-[0.8rem] text-ink-muted">{t('groups.totalStudents')}</p>
                <p className="font-semibold text-ink">{group?.students?.length || 0} {t('common.user').toLowerCase()}</p>
              </div>
            </Card>
          </div>

          {/* Schedule */}
          {(group?.schedule?.days?.length > 0 || group?.schedule?.specificDate) && (
            <div className="space-y-2 rounded-[var(--radius-md)] border border-line p-4">
              <p className="sc flex items-center gap-1 text-[0.85rem] text-ink-muted">
                <Calendar size={13} aria-hidden="true" /> {t('groups.schedule')} ({group.schedule.type === 'online' ? t('groups.formatOnline') : t('groups.formatOffline')})
                <Badge className="ml-auto">
                  {group.schedule.repetitionType === 'weekly' ? t('groups.repetitionWeekly') : t('groups.repetitionOnce')}
                </Badge>
              </p>
              <p className="font-medium text-ink">
                {group.schedule.repetitionType === 'weekly'
                  ? formatDays(group.schedule.days, t)
                  : formatDate(group.schedule.specificDate, 'd MMMM yyyy')}
                {(group.schedule.startTime || group.schedule.endTime) && ` — ${group.schedule.startTime || ''} - ${group.schedule.endTime || ''}`}
              </p>
              {group.schedule.note && (
                <p className="mt-2 rounded-[var(--radius-sm)] border border-line-hair bg-surface-2 p-2 text-sm text-ink-muted">
                  {t('groups.note')}: {group.schedule.note}
                </p>
              )}
            </div>
          )}

          {/* Students List */}
          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h4 className="sc text-[0.95rem] text-accent-text">{t('sidebar.students')}</h4>
              {isAdmin && (
                <Button size="sm" icon={UserPlus} onClick={() => setShowAddStudent(!showAddStudent)}>
                  {t('groups.addStudent')}
                </Button>
              )}
            </div>

            {/* Add Student Panel (POST /groups/:id/students is admin only) */}
            <AnimatePresence>
              {isAdmin && showAddStudent && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mb-3 overflow-hidden"
                >
                  <div className="space-y-3 rounded-[var(--radius-md)] border border-line bg-surface-2 p-4">
                    <p className="field-label">{t('groups.selectStudent')}:</p>
                    <Select
                      value={selectedStudentId}
                      onChange={setSelectedStudentId}
                      options={[
                        { label: t('common.select'), value: '' },
                        ...availableStudents.map(s => ({ label: `${s.name} — ${s.email}`, value: s._id }))
                      ]}
                    />
                    <div className="flex gap-2">
                      <Button variant="ghost" className="flex-1" onClick={() => setShowAddStudent(false)}>{t('users.cancelBtn')}</Button>
                      <Button className="flex-1" onClick={handleAddStudent} disabled={!selectedStudentId} loading={isAdding}>
                        {isAdding ? t('groups.adding') : t('groups.addBtn')}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Search */}
            <div className="mb-3">
              <Input
                icon={Search}
                type="text"
                placeholder={t('groups.searchStudents')}
                aria-label={t('groups.searchStudents')}
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
              />
            </div>

            {filteredStudents?.length === 0 ? (
              <EmptyState compact sketch="globe" title={t('groups.noStudentsGroup')} />
            ) : (
              <ul className="divide-y divide-line-hair rounded-[var(--radius-md)] border border-line">
                {filteredStudents?.map((student) => (
                  <li key={student._id} className="flex items-center gap-3 p-3">
                    <Avatar name={student.name} className="h-9 w-9 shrink-0 rounded-full" textSize="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-ink">{student.name}</p>
                      <p className="truncate text-sm text-ink-muted">{student.email}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};

// ─── Main Groups Page ────────────────────────────────────────────────────────
const Groups = () => {
  const { t } = useTranslation();
  const DAYS = getDays(t);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    teacher: '',
    course: '',
    students: [],
    schedule: { 
      repetitionType: 'weekly',
      days: [], 
      specificDate: '',
      startTime: '', 
      endTime: '', 
      type: 'offline', 
      note: '' 
    },
  });

  const user = useSelector(selectCurrentUser);
  const isAdmin = user?.role === 'admin';

  const { data: groupsData, isLoading } = useGetGroupsQuery();
  // Only the admin form needs these lists (and only admins may fetch teachers)
  const { data: teachersData } = useGetTeachersQuery({ limit: 100 }, { skip: !isAdmin });
  const { data: studentsData } = useGetStudentsQuery({ limit: 500 }, { skip: !isAdmin });
  const [createGroup, { isLoading: isCreating }] = useCreateGroupMutation();
  const [updateGroup, { isLoading: isUpdating }] = useUpdateGroupMutation();
  const [deleteGroup] = useDeleteGroupMutation();

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      if (editingGroupId) {
        await updateGroup({ id: editingGroupId, ...formData }).unwrap();
        toast.success(t('groups.updateSuccess'));
      } else {
        await createGroup(formData).unwrap();
        toast.success(t('groups.addSuccess'));
      }
      handleCloseModal();
    } catch (error) {
      toast.error(error.data?.message || t('students.error'));
    }
  };

  const handleEditClick = (group) => {
    setEditingGroupId(group._id);
    setFormData({
      name: group.name,
      teacher: group.teacher?._id || group.teacher,
      course: group.course,
      students: group.students?.map(s => typeof s === 'object' ? s._id : s) || [],
      schedule: {
        repetitionType: group.schedule?.repetitionType || 'weekly',
        // Older groups stored localized names; normalise so the day buttons match
        days: [...new Set((group.schedule?.days || []).map(toDayName).filter(Boolean))],
        specificDate: group.schedule?.specificDate ? new Date(group.schedule.specificDate).toISOString().split('T')[0] : '',
        startTime: group.schedule?.startTime || '',
        endTime: group.schedule?.endTime || '',
        type: group.schedule?.type || 'offline',
        note: group.schedule?.note || ''
      },
    });
    setIsCreateModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setEditingGroupId(null);
    setFormData({ 
      name: '', 
      teacher: '', 
      course: '', 
      students: [],
      schedule: { 
        repetitionType: 'weekly',
        days: [], 
        specificDate: '',
        startTime: '', 
        endTime: '', 
        type: 'offline', 
        note: '' 
      } 
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm(t('groups.deleteConfirm'))) {
      try {
        await deleteGroup(id).unwrap();
        toast.success(t('groups.deleteSuccess'));
      } catch {
        toast.error(t('students.error'));
      }
    }
  };

  const filteredGroups = groupsData?.data?.filter(
    (group) =>
      group.name.toLowerCase().includes(search.toLowerCase()) ||
      group.course?.toLowerCase().includes(search.toLowerCase())
  );



  const chip = (active) =>
    cn(
      'sc min-h-10 rounded-full border px-4 text-[0.9rem] transition-colors',
      active
        ? 'border-accent bg-accent text-accent-fg'
        : 'border-line-strong bg-transparent text-accent-text hover:bg-surface-2'
    );

  const featuredId = filteredGroups?.find((g) => g.status === 'active')?._id;

  return (
    <PageShell
      title={t('groups.title')}
      subtitle={t('groups.subtitle')}
      actions={isAdmin && (
        <Button icon={Plus} onClick={() => setIsCreateModalOpen(true)}>
          {t('groups.newGroup')}
        </Button>
      )}
    >
      {/* Search */}
      <Card className="p-4">
        <Input
          icon={Search}
          type="text"
          placeholder={t('groups.searchPlaceholder')}
          aria-label={t('groups.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Card>

      {/* Groups Grid */}
      <div className="orn-stagger grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array(6).fill(0).map((_, idx) => (
              <Skeleton key={idx} className="h-48 rounded-[var(--radius-lg)]" />
            ))
          : filteredGroups?.length === 0 ? (
              <Card className="col-span-full">
                <EmptyState sketch="globe" title={t('groups.noGroups')} />
              </Card>
            )
          : filteredGroups?.map((group) => (
              <Card
                key={group._id}
                variant={group._id === featuredId ? 'featured' : 'plain'}
                hover
                className="space-y-4 p-5"
              >
                <div className="flex items-start justify-between">
                  <BookOpen size={22} className="text-accent-text" aria-hidden="true" />
                  {isAdmin && (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" iconOnly icon={Edit2} onClick={() => handleEditClick(group)} aria-label={t('common.edit')} />
                      <Button variant="ghost" size="sm" iconOnly icon={Trash2} onClick={() => handleDelete(group._id)} aria-label={t('common.delete')} />
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-[1.2rem] font-semibold text-ink">{group.name}</h3>
                  <p className="text-ink-muted">{group.course}</p>
                </div>

                <div className="space-y-2 border-t border-line-hair pt-3">
                  <div className="flex items-center gap-2 text-ink-muted">
                    <User size={14} aria-hidden="true" />
                    <span>{group.teacher?.name || t('teachers.noTeachers')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-ink-muted">
                    <Users size={14} aria-hidden="true" />
                    <span>{group.students?.length || 0} {t('sidebar.students')}</span>
                  </div>
                  {(group.schedule?.days?.length > 0 || group.schedule?.specificDate) && (
                    <div className="flex flex-col gap-1 text-ink-muted">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} aria-hidden="true" />
                        <span>
                          {group.schedule.repetitionType === 'weekly'
                            ? formatDays(group.schedule.days, t)
                            : formatDate(group.schedule.specificDate, 'd MMMM yyyy')}
                        </span>
                        <span className="sc ml-auto text-[0.75rem]">
                          {group.schedule.repetitionType === 'weekly' ? t('groups.repetitionWeekly') : t('groups.repetitionOnce')}
                        </span>
                      </div>
                      {(group.schedule.startTime || group.schedule.endTime) && (
                        <div className="flex items-center gap-2 pl-5 text-sm">
                          <span className="num">{group.schedule.startTime || ''} - {group.schedule.endTime || ''}</span>
                          <Badge>{group.schedule.type === 'online' ? t('groups.formatOnline') : t('groups.formatOffline')}</Badge>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <StatusPill status={group.status === 'active' ? 'success' : 'neutral'}>
                    {group.status === 'active' ? t('groups.statusActive') : t('groups.statusCompleted')}
                  </StatusPill>
                  <button
                    onClick={() => setSelectedGroupId(group._id)}
                    className="sc flex min-h-10 items-center gap-1 text-[0.9rem] text-accent-text hover:underline"
                  >
                    {t('groups.details')} <ChevronRight size={15} aria-hidden="true" />
                  </button>
                </div>
              </Card>
            ))}
      </div>

      {/* Group Detail Modal */}
      {selectedGroupId && (
        <GroupDetailModal groupId={selectedGroupId} isAdmin={isAdmin} onClose={() => setSelectedGroupId(null)} />
      )}

      {/* Create Group Modal */}
      <Modal
        open={isCreateModalOpen}
        onClose={handleCloseModal}
        title={editingGroupId ? t('groups.editGroup') : t('groups.newGroup')}
        footer={
          <>
            <Button variant="ghost" onClick={handleCloseModal}>{t('users.cancelBtn')}</Button>
            <Button type="submit" form="group-form" loading={isCreating || isUpdating}>
              {isCreating || isUpdating ? (editingGroupId ? t('groups.updating') : t('groups.creating')) : (editingGroupId ? t('users.saveBtn') : t('groups.newGroup'))}
            </Button>
          </>
        }
      >
        <form id="group-form" onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label={t('groups.groupName')}>
              <Input required type="text" placeholder={t('groups.groupNamePlaceholder')} value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </FormField>
            <FormField label={t('groups.course')}>
              <Input required type="text" placeholder={t('groups.coursePlaceholder')} value={formData.course}
                onChange={(e) => setFormData({ ...formData, course: e.target.value })} />
            </FormField>
          </div>

          <div>
            <span className="field-label">{t('groups.selectTeacher')}</span>
            <Select
              value={formData.teacher}
              onChange={(val) => setFormData({ ...formData, teacher: val })}
              options={[
                { label: t('common.select'), value: '' },
                ...(teachersData?.data?.map(teacher => ({ label: teacher.name, value: teacher._id })) || [])
              ]}
              required
            />
          </div>

          <div>
            <span className="field-label">{t('sidebar.students')}</span>
            <div className="space-y-3">
              <Select
                value=""
                onChange={(val) => {
                  if (val && !formData.students.includes(val)) {
                    setFormData({ ...formData, students: [...formData.students, val] });
                  }
                }}
                options={[
                  { label: t('groups.addStudentsDesc'), value: '' },
                  ...(studentsData?.data?.filter(s => !formData.students.includes(s._id)).map(student => ({ label: student.name, value: student._id })) || [])
                ]}
              />

              <div className="flex flex-wrap gap-2">
                {formData.students.map((studentId) => {
                  const student = studentsData?.data?.find(s => s._id === studentId);
                  return (
                    <div key={studentId} className="flex items-center gap-2 rounded-full border border-line-strong px-3 py-1 text-sm text-ink">
                      <span>{student?.name || t('common.loading')}</span>
                      <button
                        type="button"
                        aria-label={t('common.delete')}
                        onClick={() => setFormData({ ...formData, students: formData.students.filter(id => id !== studentId) })}
                        className="text-ink-muted hover:text-ink"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <span className="field-label">{t('groups.repetitionType')}</span>
            <div className="flex gap-2">
              <button
                type="button"
                aria-pressed={formData.schedule.repetitionType === 'weekly'}
                onClick={() => setFormData({ ...formData, schedule: { ...formData.schedule, repetitionType: 'weekly' } })}
                className={cn('flex-1', chip(formData.schedule.repetitionType === 'weekly'))}
              >
                {t('groups.repetitionWeekly')}
              </button>
              <button
                type="button"
                aria-pressed={formData.schedule.repetitionType === 'once'}
                onClick={() => setFormData({ ...formData, schedule: { ...formData.schedule, repetitionType: 'once' } })}
                className={cn('flex-1', chip(formData.schedule.repetitionType === 'once'))}
              >
                {t('groups.repetitionOnce')}
              </button>
            </div>
          </div>

          {formData.schedule.repetitionType === 'weekly' ? (
            <div>
              <span className="field-label">{t('groups.days')}</span>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    aria-pressed={formData.schedule.days.includes(day.value)}
                    onClick={() => {
                      const days = formData.schedule.days.includes(day.value)
                        ? formData.schedule.days.filter((d) => d !== day.value)
                        : DAY_NAMES.filter((d) => d === day.value || formData.schedule.days.includes(d));
                      setFormData({ ...formData, schedule: { ...formData.schedule, days } });
                    }}
                    className={chip(formData.schedule.days.includes(day.value))}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <FormField label={t('groups.specificDate')}>
              <Input
                type="date"
                value={formData.schedule.specificDate}
                onChange={(e) => setFormData({ ...formData, schedule: { ...formData.schedule, specificDate: e.target.value } })}
              />
            </FormField>
          )}

          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('groups.startTime')}>
              <Input type="time" value={formData.schedule.startTime}
                onChange={(e) => setFormData({ ...formData, schedule: { ...formData.schedule, startTime: e.target.value } })} />
            </FormField>
            <FormField label={t('groups.endTime')}>
              <Input type="time" value={formData.schedule.endTime}
                onChange={(e) => setFormData({ ...formData, schedule: { ...formData.schedule, endTime: e.target.value } })} />
            </FormField>
          </div>

          <div>
            <span className="field-label">{t('groups.format')}</span>
            <Select
              value={formData.schedule.type}
              onChange={(val) => setFormData({ ...formData, schedule: { ...formData.schedule, type: val } })}
              options={[
                { label: t('groups.formatOffline'), value: 'offline' },
                { label: t('groups.formatOnline'), value: 'online' },
              ]}
            />
          </div>

          <FormField label={t('groups.note')}>
            <Textarea rows={3} placeholder={t('groups.notePlaceholder')} value={formData.schedule.note}
              onChange={(e) => setFormData({ ...formData, schedule: { ...formData.schedule, note: e.target.value } })} />
          </FormField>
        </form>
      </Modal>
    </PageShell>
  );
};

export default Groups;
