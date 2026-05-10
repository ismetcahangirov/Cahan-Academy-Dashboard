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

// ─── Group Detail Modal ──────────────────────────────────────────────────────
const GroupDetailModal = ({ groupId, onClose }) => {
  const { t, i18n } = useTranslation();
  const [studentSearch, setStudentSearch] = useState('');
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');

  const { data: groupData, isLoading } = useGetGroupByIdQuery(groupId, { skip: !groupId });
  const { data: studentsData } = useGetStudentsQuery({ limit: 200 }, { skip: !showAddStudent });
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-[var(--card)] border border-[var(--border)] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between flex-shrink-0 bg-[var(--muted)]/30">
          <div>
            {isLoading ? (
              <div className="h-6 w-40 bg-[var(--muted)] rounded animate-pulse" />
            ) : (
              <>
                <h3 className="text-xl font-bold text-[var(--foreground)]">{group?.name}</h3>
                <p className="text-sm text-[var(--muted-foreground)]/60">{group?.course}</p>
              </>
            )}
          </div>
          <button onClick={onClose} className="p-2 text-[var(--muted-foreground)]/40 hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5">
          {isLoading ? (
            <div className="space-y-3">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="h-12 bg-[var(--muted)] rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {/* Info Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-bordo/10 border border-bordo/20 rounded-2xl p-4 flex items-center gap-3">
                  <div className="p-2 bg-white border border-bordo/20 rounded-lg">
                    <GraduationCap size={18} className="text-bordo" />
                  </div>
                  <div>
                    <p className="text-xs text-[var(--muted-foreground)]/60">{t('groups.teacher')}</p>
                    <p className="font-semibold text-[var(--foreground)] text-sm">{group?.teacher?.name || t('teachers.noTeachers')}</p>
                  </div>
                </div>
                <div className="bg-bordo/10 border border-bordo/20 rounded-2xl p-4 flex items-center gap-3">
                  <div className="p-2 bg-white border border-bordo/20 rounded-lg">
                    <Users size={18} className="text-bordo" />
                  </div>
                  <div>
                    <p className="text-xs text-[var(--muted-foreground)]/60">{t('groups.totalStudents')}</p>
                    <p className="font-semibold text-[var(--foreground)] text-sm">{group?.students?.length || 0} {t('common.user').toLowerCase()}</p>
                  </div>
                </div>
              </div>

              {/* Schedule */}
              {(group?.schedule?.days?.length > 0 || group?.schedule?.specificDate) && (
                <div className="bg-[var(--muted)]/30 border border-[var(--border)] rounded-xl p-4 space-y-2">
                  <p className="text-xs text-[var(--muted-foreground)]/60 flex items-center gap-1 mb-1">
                    <Calendar size={13} /> {t('groups.schedule')} ({group.schedule.type === 'online' ? t('groups.formatOnline') : t('groups.formatOffline')})
                    <span className="ml-auto px-1.5 py-0.5 rounded bg-[var(--muted)] border border-[var(--border)] text-[10px]">
                      {group.schedule.repetitionType === 'weekly' ? t('groups.repetitionWeekly') : t('groups.repetitionOnce')}
                    </span>
                  </p>
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    {group.schedule.repetitionType === 'weekly' 
                      ? group.schedule.days.join(', ')
                      : group.schedule.specificDate ? new Date(group.schedule.specificDate).toLocaleDateString(i18n.language === 'az' ? 'az-AZ' : i18n.language === 'ru' ? 'ru-RU' : 'en-US') : ''}
                    {(group.schedule.startTime || group.schedule.endTime) && ` — ${group.schedule.startTime || ''} - ${group.schedule.endTime || ''}`}
                  </p>
                  {group.schedule.note && (
                    <p className="text-xs text-[var(--muted-foreground)]/80 bg-[var(--input)] p-2 rounded-lg mt-2 border border-[var(--border)]">
                      {t('groups.note')}: {group.schedule.note}
                    </p>
                  )}
                </div>
              )}

              {/* Students List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-[var(--foreground)] text-sm">{t('sidebar.students')}</h4>
                  <button
                    onClick={() => setShowAddStudent(!showAddStudent)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-bordo hover:bg-bordo/90 text-white text-xs font-semibold rounded-lg transition-all"
                  >
                    <UserPlus size={13} />
                    {t('groups.addStudent')}
                  </button>
                </div>

                {/* Add Student Panel */}
                <AnimatePresence>
                  {showAddStudent && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden mb-3"
                    >
                      <div className="bg-bordo/10 border border-bordo/20 rounded-2xl p-4 space-y-3">
                        <p className="text-xs font-medium text-[var(--muted-foreground)]">{t('groups.selectStudent')}:</p>
                        <Select
                          value={selectedStudentId}
                          onChange={setSelectedStudentId}
                          options={[
                            { label: t('common.select') || 'Seçin...', value: '' },
                            ...availableStudents.map(s => ({ label: `${s.name} — ${s.email}`, value: s._id }))
                          ]}
                        />
                        <div className="flex gap-2">
                          <button onClick={() => setShowAddStudent(false)} className="flex-1 py-2 border border-[var(--border)] text-[var(--muted-foreground)] rounded-xl text-sm hover:bg-[var(--muted)]">{t('users.cancelBtn')}</button>
                          <button
                            onClick={handleAddStudent}
                            disabled={!selectedStudentId || isAdding}
                            className="flex-1 py-2 bg-bordo text-white rounded-xl text-sm font-semibold hover:bg-bordo/90 disabled:opacity-50"
                          >
                            {isAdding ? t('groups.adding') : t('groups.addBtn')}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Search */}
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]/40" size={15} />
                  <input
                    type="text"
                    placeholder={t('groups.searchStudents')}
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-[var(--muted)]/50 border border-[var(--border)] rounded-xl text-sm text-[var(--foreground)] outline-none focus:border-bordo/50 transition-all placeholder:text-[var(--muted-foreground)]/40"
                  />
                </div>

                {filteredStudents?.length === 0 ? (
                  <div className="text-center py-8 text-[var(--muted-foreground)]/40 text-sm">
                    <Users size={32} className="mx-auto mb-2 opacity-30" />
                    {t('groups.noStudentsGroup')}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredStudents?.map((student) => (
                      <div key={student._id} className="flex items-center gap-3 p-3 bg-[var(--muted)]/30 border border-[var(--border)] rounded-xl hover:bg-[var(--muted)]/50 transition-all">
                        <div className="w-8 h-8 rounded-full bg-bordo/20 flex items-center justify-center text-bordo font-bold text-sm flex-shrink-0">
                          {student.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[var(--foreground)] text-sm truncate">{student.name}</p>
                          <p className="text-xs text-[var(--muted-foreground)]/60 truncate">{student.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// ─── Main Groups Page ────────────────────────────────────────────────────────
const Groups = () => {
  const { t, i18n } = useTranslation();
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
  const { data: teachersData } = useGetTeachersQuery({ limit: 100 });
  const { data: studentsData } = useGetStudentsQuery({ limit: 500 });
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
        days: group.schedule?.days || [],
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

  const DAYS = [
    t('schedule.days.monday'),
    t('schedule.days.tuesday'),
    t('schedule.days.wednesday'),
    t('schedule.days.thursday'),
    t('schedule.days.friday'),
    t('schedule.days.saturday'),
    t('schedule.days.sunday')
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">{t('groups.title')}</h1>
          <p className="text-[var(--muted-foreground)]/60 text-sm mt-1">{t('groups.subtitle')}</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-bordo hover:bg-bordo/90 text-white px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-bordo/20 font-medium text-sm shrink-0"
          >
            <Plus size={18} />
            {t('groups.newGroup')}
          </button>
        )}
      </div>

      {/* Search */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]/40" size={18} />
          <input
            type="text"
            placeholder={t('groups.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[var(--input)] border border-[var(--border)] rounded-xl py-2 pl-10 pr-4 text-[var(--foreground)] text-sm focus:outline-none focus:border-bordo transition-colors"
          />
        </div>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading
          ? Array(6).fill(0).map((_, idx) => (
              <div key={idx} className="bg-[var(--card)] border border-[var(--border)] h-48 rounded-2xl animate-pulse" />
            ))
          : filteredGroups?.map((group) => (
              <motion.div
                key={group._id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 space-y-4 hover:border-bordo/30 transition-all"
              >
                <div className="flex justify-between items-start">
                  <div className="p-2.5 bg-bordo text-white rounded-xl shadow-sm shadow-bordo/20">
                    <BookOpen size={20} />
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditClick(group)}
                        className="p-1.5 text-[var(--muted-foreground)]/30 hover:text-bordo hover:bg-bordo/10 rounded-lg transition-all"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(group._id)}
                        className="p-1.5 text-[var(--muted-foreground)]/30 hover:text-bordo hover:bg-bordo/10 rounded-lg transition-all"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-base font-bold text-[var(--foreground)]">{group.name}</h3>
                  <p className="text-[var(--muted-foreground)]/60 text-sm">{group.course}</p>
                </div>

                  <div className="space-y-2 pt-3 border-t border-[var(--border)]">
                    <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]/60">
                      <User size={14} className="text-[var(--muted-foreground)]/30" />
                      <span>{group.teacher?.name || t('teachers.noTeachers')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]/60">
                      <Users size={14} className="text-[var(--muted-foreground)]/30" />
                      <span>{group.students?.length || 0} {t('sidebar.students')}</span>
                    </div>
                  {(group.schedule?.days?.length > 0 || group.schedule?.specificDate) && (
                    <div className="flex flex-col gap-1 text-sm text-[var(--muted-foreground)]/60">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-[var(--muted-foreground)]/30" />
                        <span>
                          {group.schedule.repetitionType === 'weekly' 
                            ? group.schedule.days.join(', ')
                            : group.schedule.specificDate ? new Date(group.schedule.specificDate).toLocaleDateString(i18n.language === 'az' ? 'az-AZ' : i18n.language === 'ru' ? 'ru-RU' : 'en-US') : ''}
                        </span>
                        <span className="text-[10px] text-[var(--muted-foreground)]/40 ml-auto">
                          {group.schedule.repetitionType === 'weekly' ? t('groups.repetitionWeekly') : t('groups.repetitionOnce')}
                        </span>
                      </div>
                      {(group.schedule.startTime || group.schedule.endTime) && (
                        <div className="flex items-center gap-2 pl-5 text-xs text-[var(--muted-foreground)]/60">
                          <span>{group.schedule.startTime || ''} - {group.schedule.endTime || ''}</span>
                          <span 
                            className="px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider border border-bordo/20"
                            style={{ 
                              backgroundColor: group.schedule.type === 'online' ? 'var(--bordo-muted)' : 'var(--background)',
                              color: 'var(--bordo-contrast)'
                            }}
                          >{group.schedule.type === 'online' ? t('groups.formatOnline') : t('groups.formatOffline')}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className={cn(
                    'px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border',
                    group.status === 'active'
                      ? 'bg-bordo text-white border-bordo'
                      : 'bg-white text-bordo border-bordo/30'
                  )}>
                    {group.status === 'active' ? t('groups.statusActive') : t('groups.statusCompleted')}
                  </span>
                  <button
                    onClick={() => setSelectedGroupId(group._id)}
                    className="flex items-center gap-1 text-bordo text-sm font-semibold hover:gap-2 transition-all"
                  >
                    {t('groups.details')} <ChevronRight size={15} />
                  </button>
                </div>
              </motion.div>
            ))}
      </div>

      {/* Group Detail Modal */}
      <AnimatePresence>
        {selectedGroupId && (
          <GroupDetailModal groupId={selectedGroupId} onClose={() => setSelectedGroupId(null)} />
        )}
      </AnimatePresence>

      {/* Create Group Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleCloseModal} className="fixed inset-0 bg-background/60 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="relative bg-[var(--card)] border border-[var(--border)] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden z-10 max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--muted)]/20">
                <h3 className="text-xl font-semibold text-[var(--foreground)]">{editingGroupId ? t('groups.editGroup') : t('groups.newGroup')}</h3>
                <button onClick={handleCloseModal} className="p-2 text-[var(--muted-foreground)]/40 hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-all"><X size={20} /></button>
              </div>

              <form onSubmit={handleCreate} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[var(--muted-foreground)]">{t('groups.groupName')}</label>
                    <input required type="text" placeholder={t('groups.groupNamePlaceholder')} value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-[var(--input)] border border-[var(--border)] rounded-xl py-2.5 px-4 text-[var(--foreground)] text-sm focus:outline-none focus:border-bordo/50 transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[var(--muted-foreground)]">{t('groups.course')}</label>
                    <input required type="text" placeholder={t('groups.coursePlaceholder')} value={formData.course}
                      onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                      className="w-full bg-[var(--input)] border border-[var(--border)] rounded-xl py-2.5 px-4 text-[var(--foreground)] text-sm focus:outline-none focus:border-bordo/50 transition-all" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--muted-foreground)]">{t('groups.selectTeacher')}</label>
                  <Select
                    value={formData.teacher}
                    onChange={(val) => setFormData({ ...formData, teacher: val })}
                    options={[
                      { label: t('common.select') || 'Seçin...', value: '' },
                      ...(teachersData?.data?.map(teacher => ({ label: teacher.name, value: teacher._id })) || [])
                    ]}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--muted-foreground)]">{t('sidebar.students')}</label>
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
                          <div key={studentId} className="flex items-center gap-2 px-3 py-1.5 bg-[var(--muted)] border border-[var(--border)] rounded-lg text-xs text-[var(--foreground)]">
                            <span>{student?.name || t('common.loading')}</span>
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, students: formData.students.filter(id => id !== studentId) })}
                              className="text-[var(--muted-foreground)]/40 hover:text-[var(--foreground)]"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--muted-foreground)]">{t('groups.repetitionType')}</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, schedule: { ...formData.schedule, repetitionType: 'weekly' } })}
                      className={cn(
                        'flex-1 py-2 rounded-xl text-xs font-medium transition-all border',
                        formData.schedule.repetitionType === 'weekly'
                          ? 'bg-bordo border-bordo/50 text-white'
                          : 'bg-[var(--muted)] border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--border)]'
                      )}
                    >
                      {t('groups.repetitionWeekly')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, schedule: { ...formData.schedule, repetitionType: 'once' } })}
                      className={cn(
                        'flex-1 py-2 rounded-xl text-xs font-medium transition-all border',
                        formData.schedule.repetitionType === 'once'
                          ? 'bg-bordo border-bordo/50 text-white'
                          : 'bg-[var(--muted)] border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--border)]'
                      )}
                    >
                      {t('groups.repetitionOnce')}
                    </button>
                  </div>
                </div>

                {formData.schedule.repetitionType === 'weekly' ? (
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[var(--muted-foreground)]">{t('groups.days')}</label>
                    <div className="flex flex-wrap gap-2">
                      {DAYS.map((day) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            const days = formData.schedule.days.includes(day)
                              ? formData.schedule.days.filter((d) => d !== day)
                              : [...formData.schedule.days, day];
                            setFormData({ ...formData, schedule: { ...formData.schedule, days } });
                          }}
                          className={cn(
                            'px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                            formData.schedule.days.includes(day)
                              ? 'bg-bordo border-bordo/50 text-white'
                              : 'bg-[var(--muted)] border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--border)]'
                          )}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[var(--muted-foreground)]">{t('groups.specificDate')}</label>
                    <input 
                      type="date" 
                      value={formData.schedule.specificDate}
                      onChange={(e) => setFormData({ ...formData, schedule: { ...formData.schedule, specificDate: e.target.value } })}
                      className="w-full bg-[var(--input)] border border-[var(--border)] rounded-xl py-2.5 px-4 text-[var(--foreground)] text-sm focus:outline-none focus:border-bordo/50 transition-all" 
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[var(--muted-foreground)]">{t('groups.startTime')}</label>
                    <input type="time" value={formData.schedule.startTime}
                      onChange={(e) => setFormData({ ...formData, schedule: { ...formData.schedule, startTime: e.target.value } })}
                      className="w-full bg-[var(--input)] border border-[var(--border)] rounded-xl py-2.5 px-4 text-[var(--foreground)] text-sm focus:outline-none focus:border-bordo/50 transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[var(--muted-foreground)]">{t('groups.endTime')}</label>
                    <input type="time" value={formData.schedule.endTime}
                      onChange={(e) => setFormData({ ...formData, schedule: { ...formData.schedule, endTime: e.target.value } })}
                      className="w-full bg-[var(--input)] border border-[var(--border)] rounded-xl py-2.5 px-4 text-[var(--foreground)] text-sm focus:outline-none focus:border-bordo/50 transition-all" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--muted-foreground)]">{t('groups.format')}</label>
                  <Select
                    value={formData.schedule.type}
                    onChange={(val) => setFormData({ ...formData, schedule: { ...formData.schedule, type: val } })}
                    options={[
                      { label: t('groups.formatOffline'), value: 'offline' },
                      { label: t('groups.formatOnline'), value: 'online' },
                    ]}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--muted-foreground)]">{t('groups.note')}</label>
                  <textarea placeholder={t('groups.notePlaceholder')} value={formData.schedule.note}
                    onChange={(e) => setFormData({ ...formData, schedule: { ...formData.schedule, note: e.target.value } })}
                    className="w-full bg-[var(--input)] border border-[var(--border)] rounded-xl py-2.5 px-4 text-[var(--foreground)] text-sm focus:outline-none focus:border-bordo/50 transition-all resize-none h-20" />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border)]">
                  <button type="button" onClick={handleCloseModal} className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-all">{t('users.cancelBtn')}</button>
                  <button type="submit" disabled={isCreating || isUpdating} className="bg-bordo hover:bg-bordo/90 text-white px-6 py-2 rounded-xl transition-all shadow-lg shadow-bordo/20 font-medium text-sm disabled:opacity-50">
                    {isCreating || isUpdating ? (editingGroupId ? t('groups.updating') : t('groups.creating')) : (editingGroupId ? t('users.saveBtn') : t('groups.newGroup'))}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Groups;
