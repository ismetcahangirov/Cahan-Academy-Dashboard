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
  useDeleteGroupMutation,
  useAddStudentToGroupMutation,
} from '../../features/groups/groupsApi';
import { useGetStudentsQuery } from '../../features/students/studentsApi';
import { useGetTeachersQuery } from '../../features/teachers/teachersApi';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../features/auth/authSlice';
import { toast } from 'react-hot-toast';
import { cn } from '../../lib/utils';

// ─── Group Detail Modal ──────────────────────────────────────────────────────
const GroupDetailModal = ({ groupId, onClose }) => {
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
      toast.success('Tələbə qrupa əlavə edildi');
      setSelectedStudentId('');
      setShowAddStudent(false);
    } catch (err) {
      toast.error(err?.data?.message || 'Xəta baş verdi');
    }
  };

  const filteredStudents = group?.students?.filter((s) =>
    s.name?.toLowerCase().includes(studentSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-zinc-900 border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between flex-shrink-0 bg-white/[0.02]">
          <div>
            {isLoading ? (
              <div className="h-6 w-40 bg-white/10 rounded animate-pulse" />
            ) : (
              <>
                <h3 className="text-xl font-bold text-white">{group?.name}</h3>
                <p className="text-sm text-white/50">{group?.course}</p>
              </>
            )}
          </div>
          <button onClick={onClose} className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5">
          {isLoading ? (
            <div className="space-y-3">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="h-12 bg-white/5 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {/* Info Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <GraduationCap size={18} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-white/40">Müəllim</p>
                    <p className="font-semibold text-white text-sm">{group?.teacher?.name || 'Təyin edilməyib'}</p>
                  </div>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/20 rounded-lg">
                    <Users size={18} className="text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs text-white/40">Tələbə sayı</p>
                    <p className="font-semibold text-white text-sm">{group?.students?.length || 0} nəfər</p>
                  </div>
                </div>
              </div>

              {/* Schedule */}
              {(group?.schedule?.days?.length > 0 || group?.schedule?.specificDate) && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
                  <p className="text-xs text-white/40 flex items-center gap-1 mb-1">
                    <Calendar size={13} /> Cədvəl ({group.schedule.type === 'online' ? 'Online' : 'Offline'})
                    <span className="ml-auto px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px]">
                      {group.schedule.repetitionType === 'weekly' ? 'Hər həftə' : 'Bir dəfə'}
                    </span>
                  </p>
                  <p className="text-sm font-medium text-white">
                    {group.schedule.repetitionType === 'weekly' 
                      ? group.schedule.days.join(', ')
                      : group.schedule.specificDate ? new Date(group.schedule.specificDate).toLocaleDateString('az-AZ') : ''}
                    {(group.schedule.startTime || group.schedule.endTime) && ` — ${group.schedule.startTime || ''} - ${group.schedule.endTime || ''}`}
                  </p>
                  {group.schedule.note && (
                    <p className="text-xs text-white/60 bg-black/20 p-2 rounded-lg mt-2 border border-white/5">
                      Qeyd: {group.schedule.note}
                    </p>
                  )}
                </div>
              )}

              {/* Students List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-white text-sm">Tələbələr</h4>
                  <button
                    onClick={() => setShowAddStudent(!showAddStudent)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-bordo hover:bg-bordo/90 text-white text-xs font-semibold rounded-lg transition-all"
                  >
                    <UserPlus size={13} />
                    Tələbə əlavə et
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
                        <p className="text-xs font-medium text-white/70">Tələbə seçin:</p>
                        <select
                          value={selectedStudentId}
                          onChange={(e) => setSelectedStudentId(e.target.value)}
                          className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:border-bordo/50 outline-none"
                        >
                          <option value="">Seçin...</option>
                          {availableStudents.map((s) => (
                            <option key={s._id} value={s._id}>{s.name} — {s.email}</option>
                          ))}
                        </select>
                        <div className="flex gap-2">
                          <button onClick={() => setShowAddStudent(false)} className="flex-1 py-2 border border-white/10 text-white/60 rounded-xl text-sm hover:bg-white/5">Ləğv et</button>
                          <button
                            onClick={handleAddStudent}
                            disabled={!selectedStudentId || isAdding}
                            className="flex-1 py-2 bg-bordo text-white rounded-xl text-sm font-semibold hover:bg-bordo/90 disabled:opacity-50"
                          >
                            {isAdding ? 'Əlavə edilir...' : 'Əlavə et'}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Search */}
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={15} />
                  <input
                    type="text"
                    placeholder="Tələbə axtar..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-bordo/50 transition-all placeholder:text-white/30"
                  />
                </div>

                {filteredStudents?.length === 0 ? (
                  <div className="text-center py-8 text-white/40 text-sm">
                    <Users size={32} className="mx-auto mb-2 opacity-30" />
                    Bu qrupda hələ tələbə yoxdur
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredStudents?.map((student) => (
                      <div key={student._id} className="flex items-center gap-3 p-3 bg-white/[0.03] border border-white/5 rounded-xl hover:bg-white/[0.05] transition-all">
                        <div className="w-8 h-8 rounded-full bg-bordo/20 flex items-center justify-center text-bordo font-bold text-sm flex-shrink-0">
                          {student.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white text-sm truncate">{student.name}</p>
                          <p className="text-xs text-white/40 truncate">{student.email}</p>
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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    teacher: '',
    course: '',
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
  const [createGroup, { isLoading: isCreating }] = useCreateGroupMutation();
  const [deleteGroup] = useDeleteGroupMutation();

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createGroup(formData).unwrap();
      toast.success('Qrup uğurla yaradıldı');
      setIsCreateModalOpen(false);
      setFormData({ 
        name: '', 
        teacher: '', 
        course: '', 
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
    } catch (error) {
      toast.error(error.data?.message || 'Xəta baş verdi');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bu qrupu silmək istədiyinizə əminsiniz?')) {
      try {
        await deleteGroup(id).unwrap();
        toast.success('Qrup silindi');
      } catch {
        toast.error('Xəta baş verdi');
      }
    }
  };

  const filteredGroups = groupsData?.data?.filter(
    (group) =>
      group.name.toLowerCase().includes(search.toLowerCase()) ||
      group.course?.toLowerCase().includes(search.toLowerCase())
  );

  const DAYS = ['B.ertəsi', 'Çərşənbə A.', 'Çərşənbə', 'Cümə A.', 'Cümə', 'Şənbə', 'Bazar'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Qruplar</h1>
          <p className="text-white/60 text-sm mt-1">Akademiyanın tədris qrupları.</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-bordo hover:bg-bordo/90 text-white px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-bordo/20 font-medium text-sm shrink-0"
          >
            <Plus size={18} />
            Yeni Qrup
          </button>
        )}
      </div>

      {/* Search */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
          <input
            type="text"
            placeholder="Qrup və ya kurs axtar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-bordo transition-colors"
          />
        </div>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading
          ? Array(6).fill(0).map((_, idx) => (
              <div key={idx} className="bg-white/5 border border-white/10 h-48 rounded-2xl animate-pulse" />
            ))
          : filteredGroups?.map((group) => (
              <motion.div
                key={group._id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4 hover:border-bordo/30 transition-all"
              >
                <div className="flex justify-between items-start">
                  <div className="p-2.5 bg-bordo/10 border border-bordo/20 rounded-xl text-bordo">
                    <BookOpen size={20} />
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(group._id)}
                      className="p-1.5 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>

                <div>
                  <h3 className="text-base font-bold text-white">{group.name}</h3>
                  <p className="text-white/50 text-sm">{group.course}</p>
                </div>

                <div className="space-y-2 pt-3 border-t border-white/10">
                  <div className="flex items-center gap-2 text-sm text-white/50">
                    <User size={14} className="text-white/30" />
                    <span>{group.teacher?.name || 'Müəllim təyin edilməyib'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/50">
                    <Users size={14} className="text-white/30" />
                    <span>{group.students?.length || 0} Tələbə</span>
                  </div>
                  {(group.schedule?.days?.length > 0 || group.schedule?.specificDate) && (
                    <div className="flex flex-col gap-1 text-sm text-white/50">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-white/30" />
                        <span>
                          {group.schedule.repetitionType === 'weekly' 
                            ? group.schedule.days.join(', ')
                            : group.schedule.specificDate ? new Date(group.schedule.specificDate).toLocaleDateString('az-AZ') : ''}
                        </span>
                        <span className="text-[10px] text-white/20 ml-auto">
                          {group.schedule.repetitionType === 'weekly' ? 'Haftəlik' : 'Bir dəfə'}
                        </span>
                      </div>
                      {(group.schedule.startTime || group.schedule.endTime) && (
                        <div className="flex items-center gap-2 pl-5 text-xs text-white/40">
                          <span>{group.schedule.startTime || ''} - {group.schedule.endTime || ''}</span>
                          <span className={cn(
                            "px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider border",
                            group.schedule.type === 'online' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-orange-500/10 text-orange-400 border-orange-500/20"
                          )}>{group.schedule.type === 'online' ? 'Online' : 'Offline'}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className={cn(
                    'px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border',
                    group.status === 'active'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                  )}>
                    {group.status === 'active' ? 'Aktiv' : 'Tamamlanıb'}
                  </span>
                  <button
                    onClick={() => setSelectedGroupId(group._id)}
                    className="flex items-center gap-1 text-bordo text-sm font-semibold hover:gap-2 transition-all"
                  >
                    Detallar <ChevronRight size={15} />
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCreateModalOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="relative bg-zinc-900 border border-white/10 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden z-10"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
                <h3 className="text-xl font-semibold text-white">Yeni Qrup Yarat</h3>
                <button onClick={() => setIsCreateModalOpen(false)} className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-all"><X size={20} /></button>
              </div>

              <form onSubmit={handleCreate} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-white/70">Qrup Adı</label>
                    <input required type="text" placeholder="Məs: FE-202" value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-bordo/50 transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-white/70">Kurs</label>
                    <input required type="text" placeholder="Məs: Frontend Development" value={formData.course}
                      onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-bordo/50 transition-all" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-white/70">Müəllim Seçin</label>
                  <select required value={formData.teacher} onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-bordo/50 appearance-none transition-all">
                    <option value="">Seçin...</option>
                    {teachersData?.data?.map((teacher) => (
                      <option key={teacher._id} value={teacher._id}>{teacher.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-white/70">Təkrar növü</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, schedule: { ...formData.schedule, repetitionType: 'weekly' } })}
                      className={cn(
                        'flex-1 py-2 rounded-xl text-xs font-medium transition-all border',
                        formData.schedule.repetitionType === 'weekly'
                          ? 'bg-bordo border-bordo/50 text-white'
                          : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                      )}
                    >
                      Hər həftə
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, schedule: { ...formData.schedule, repetitionType: 'once' } })}
                      className={cn(
                        'flex-1 py-2 rounded-xl text-xs font-medium transition-all border',
                        formData.schedule.repetitionType === 'once'
                          ? 'bg-bordo border-bordo/50 text-white'
                          : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                      )}
                    >
                      Bir dəfəlik
                    </button>
                  </div>
                </div>

                {formData.schedule.repetitionType === 'weekly' ? (
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-white/70">Günlər</label>
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
                              : 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/10'
                          )}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-white/70">Konkret Tarix</label>
                    <input 
                      type="date" 
                      value={formData.schedule.specificDate}
                      onChange={(e) => setFormData({ ...formData, schedule: { ...formData.schedule, specificDate: e.target.value } })}
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-bordo/50 transition-all" 
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-white/70">Başlama saatı</label>
                    <input type="time" value={formData.schedule.startTime}
                      onChange={(e) => setFormData({ ...formData, schedule: { ...formData.schedule, startTime: e.target.value } })}
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-bordo/50 transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-white/70">Bitmə saatı</label>
                    <input type="time" value={formData.schedule.endTime}
                      onChange={(e) => setFormData({ ...formData, schedule: { ...formData.schedule, endTime: e.target.value } })}
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-bordo/50 transition-all" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-white/70">Dərs formatı</label>
                  <select value={formData.schedule.type} onChange={(e) => setFormData({ ...formData, schedule: { ...formData.schedule, type: e.target.value } })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-bordo/50 appearance-none transition-all">
                    <option value="offline">Offline</option>
                    <option value="online">Online</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-white/70">Cədvəl üçün qeyd</label>
                  <textarea placeholder="Məs: Həftəsonu əlavə dərslər ola bilər" value={formData.schedule.note}
                    onChange={(e) => setFormData({ ...formData, schedule: { ...formData.schedule, note: e.target.value } })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-bordo/50 transition-all resize-none h-20" />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-all">Ləğv et</button>
                  <button type="submit" disabled={isCreating} className="bg-bordo hover:bg-bordo/90 text-white px-6 py-2 rounded-xl transition-all shadow-lg shadow-bordo/20 font-medium text-sm disabled:opacity-50">
                    {isCreating ? 'Yaradılır...' : 'Qrupu Yarat'}
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
