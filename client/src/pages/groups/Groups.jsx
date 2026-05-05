import React, { useState } from 'react';
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
  const availableStudents = studentsData?.data?.filter(
    (s) => !existingStudentIds.includes(s._id)
  ) || [];

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
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div>
            {isLoading ? (
              <div className="h-6 w-40 bg-slate-200 rounded animate-pulse" />
            ) : (
              <>
                <h3 className="text-xl font-bold text-slate-800">{group?.name}</h3>
                <p className="text-sm text-slate-500">{group?.course}</p>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {isLoading ? (
            <div className="space-y-3">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {/* Info Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-indigo-50 rounded-2xl p-4 flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <GraduationCap size={20} className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Müəllim</p>
                    <p className="font-semibold text-slate-800 text-sm">
                      {group?.teacher?.name || 'Təyin edilməyib'}
                    </p>
                  </div>
                </div>
                <div className="bg-emerald-50 rounded-2xl p-4 flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <Users size={20} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Tələbə sayı</p>
                    <p className="font-semibold text-slate-800 text-sm">
                      {group?.students?.length || 0} nəfər
                    </p>
                  </div>
                </div>
              </div>

              {/* Schedule */}
              {group?.schedule?.days?.length > 0 && (
                <div className="bg-slate-50 rounded-2xl p-4">
                  <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                    <Calendar size={14} /> Cədvəl
                  </p>
                  <p className="text-sm font-medium text-slate-700">
                    {group.schedule.days.join(', ')}
                    {group.schedule.time && ` — ${group.schedule.time}`}
                  </p>
                </div>
              )}

              {/* Students List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-slate-700">Tələbələr</h4>
                  <button
                    onClick={() => setShowAddStudent(!showAddStudent)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-all"
                  >
                    <UserPlus size={14} />
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
                      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 space-y-3">
                        <p className="text-xs font-medium text-indigo-700">Tələbə seçin:</p>
                        <select
                          value={selectedStudentId}
                          onChange={(e) => setSelectedStudentId(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                        >
                          <option value="">Seçin...</option>
                          {availableStudents.map((s) => (
                            <option key={s._id} value={s._id}>
                              {s.name} — {s.email}
                            </option>
                          ))}
                        </select>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowAddStudent(false)}
                            className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-slate-50"
                          >
                            Ləğv et
                          </button>
                          <button
                            onClick={handleAddStudent}
                            disabled={!selectedStudentId || isAdding}
                            className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
                          >
                            {isAdding ? 'Əlavə edilir...' : 'Əlavə et'}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Search within students */}
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    placeholder="Tələbə axtar..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>

                {filteredStudents?.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    <Users size={32} className="mx-auto mb-2 opacity-40" />
                    Bu qrupda hələ tələbə yoxdur
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredStudents?.map((student) => (
                      <div
                        key={student._id}
                        className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all"
                      >
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0">
                          {student.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-800 text-sm truncate">{student.name}</p>
                          <p className="text-xs text-slate-500 truncate">{student.email}</p>
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
    schedule: { days: [], time: '' },
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
      setFormData({ name: '', teacher: '', course: '', schedule: { days: [], time: '' } });
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

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Qruplar</h1>
          <p className="text-slate-500 text-sm">Akademiyanın tədris qrupları</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
          >
            <Plus size={20} />
            <span>Yeni Qrup</span>
          </button>
        )}
      </div>

      {/* Search */}
      <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Qrup və ya kurs axtar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
          />
        </div>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading
          ? Array(6)
              .fill(0)
              .map((_, idx) => (
                <div key={idx} className="bg-white h-48 rounded-2xl border border-slate-100 animate-pulse" />
              ))
          : filteredGroups?.map((group) => (
              <motion.div
                key={group._id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all p-5 space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                    <BookOpen size={24} />
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleDelete(group._id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-800">{group.name}</h3>
                  <p className="text-slate-500 text-sm">{group.course}</p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-50">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <User size={16} className="text-slate-400" />
                    <span className="font-medium">{group.teacher?.name || 'Müəllim təyin edilməyib'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Users size={16} className="text-slate-400" />
                    <span>{group.students?.length || 0} Tələbə</span>
                  </div>
                  {group.schedule?.days?.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Calendar size={16} className="text-slate-400" />
                      <span>{group.schedule.days.join(', ')}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span
                    className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      group.status === 'active'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {group.status === 'active' ? 'Aktiv' : 'Tamamlanıb'}
                  </span>
                  <button
                    onClick={() => setSelectedGroupId(group._id)}
                    className="flex items-center gap-1 text-indigo-600 text-sm font-semibold hover:underline"
                  >
                    Detallar
                    <ChevronRight size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
      </div>

      {/* Group Detail Modal */}
      <AnimatePresence>
        {selectedGroupId && (
          <GroupDetailModal
            groupId={selectedGroupId}
            onClose={() => setSelectedGroupId(null)}
          />
        )}
      </AnimatePresence>

      {/* Create Group Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800">Yeni Qrup Yarat</h3>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreate} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Qrup Adı</label>
                    <input
                      required
                      type="text"
                      placeholder="Məs: FE-202"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Kurs</label>
                    <input
                      required
                      type="text"
                      placeholder="Məs: Frontend Development"
                      value={formData.course}
                      onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Müəllim Seçin</label>
                  <select
                    required
                    value={formData.teacher}
                    onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="">Seçin...</option>
                    {teachersData?.data?.map((teacher) => (
                      <option key={teacher._id} value={teacher._id}>
                        {teacher.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Günlər</label>
                  <div className="flex flex-wrap gap-2">
                    {['B.ertəsi', 'Çərşənbə A.', 'Çərşənbə', 'Cümə A.', 'Cümə', 'Şənbə', 'Bazar'].map(
                      (day) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            const days = formData.schedule.days.includes(day)
                              ? formData.schedule.days.filter((d) => d !== day)
                              : [...formData.schedule.days, day];
                            setFormData({ ...formData, schedule: { ...formData.schedule, days } });
                          }}
                          className={`px-3 py-1 rounded-lg text-xs transition-all ${
                            formData.schedule.days.includes(day)
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {day}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Saat</label>
                  <input
                    type="text"
                    placeholder="Məs: 10:00 - 12:00"
                    value={formData.schedule.time}
                    onChange={(e) =>
                      setFormData({ ...formData, schedule: { ...formData.schedule, time: e.target.value } })
                    }
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50"
                  >
                    Ləğv et
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 disabled:opacity-50"
                  >
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
