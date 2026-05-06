import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users as UsersIcon, 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal,
  ChevronRight,
  User,
  BookOpen,
  Calendar,
  X,
  Trash2,
  Edit2,
  Shield,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { 
  useGetGroupsQuery, 
  useCreateGroupMutation, 
  useDeleteGroupMutation,
  useUpdateGroupMutation 
} from '../../features/groups/groupsApi';
import { useGetTeachersQuery } from '../../features/teachers/teachersApi';
import { useGetCoursesQuery } from '../../features/courses/coursesApi';
import { toast } from 'react-hot-toast';
import { cn } from '../../lib/utils';

const GroupModal = ({ isOpen, onClose, onSubmit, group, isLoading }) => {
  const { t } = useTranslation();
  const isEdit = !!group;
  const { data: teachers } = useGetTeachersQuery({ limit: 100 });
  const { data: courses } = useGetCoursesQuery({ limit: 100 });

  const [formData, setFormData] = useState({
    name: '',
    course: '',
    teacher: '',
    schedule: '',
    status: 'active'
  });

  useState(() => {
    if (group) {
      setFormData({
        name: group.name,
        course: group.course?._id || group.course,
        teacher: group.teacher?._id || group.teacher,
        schedule: group.schedule,
        status: group.status
      });
    }
  }, [group]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[var(--card)] border border-[var(--border)] rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-8 border-b border-[var(--border)] bg-[var(--muted)]/20">
          <h3 className="text-2xl font-black text-[var(--foreground)] tracking-tight">
            {isEdit ? t('groups.editGroup') : t('groups.newGroup')}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-[var(--muted)] rounded-xl transition-colors">
            <X size={20} className="text-[var(--muted-foreground)]" />
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-[var(--muted-foreground)]/40 uppercase tracking-widest ml-1">{t('groups.tableName')}</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-[var(--input)] border border-[var(--border)] rounded-2xl py-4 px-6 text-[var(--foreground)] text-sm font-bold focus:outline-none focus:border-bordo/50 transition-all"
              placeholder={t('groups.namePlaceholder')}
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-[var(--muted-foreground)]/40 uppercase tracking-widest ml-1">{t('sidebar.courses')}</label>
              <select
                required
                value={formData.course}
                onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                className="w-full bg-[var(--input)] border border-[var(--border)] rounded-2xl py-4 px-6 text-[var(--foreground)] text-sm font-bold focus:outline-none focus:border-bordo/50 transition-all appearance-none"
              >
                <option value="">{t('groups.selectCourse')}</option>
                {courses?.data?.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-[var(--muted-foreground)]/40 uppercase tracking-widest ml-1">{t('sidebar.teachers')}</label>
              <select
                required
                value={formData.teacher}
                onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
                className="w-full bg-[var(--input)] border border-[var(--border)] rounded-2xl py-4 px-6 text-[var(--foreground)] text-sm font-bold focus:outline-none focus:border-bordo/50 transition-all appearance-none"
              >
                <option value="">{t('groups.selectTeacher')}</option>
                {teachers?.data?.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-[var(--muted-foreground)]/40 uppercase tracking-widest ml-1">{t('schedule.title')}</label>
            <input
              type="text"
              required
              value={formData.schedule}
              onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
              className="w-full bg-[var(--input)] border border-[var(--border)] rounded-2xl py-4 px-6 text-[var(--foreground)] text-sm font-bold focus:outline-none focus:border-bordo/50 transition-all"
              placeholder="Mon, Wed, Fri - 15:00"
            />
          </div>

          <div className="flex items-center justify-end gap-4 pt-6 mt-4 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-4 rounded-2xl text-sm font-bold text-[var(--muted-foreground)]/60 hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-all"
            >
              {t('common.cancel')}
            </button>
            <button
              disabled={isLoading}
              type="submit"
              className="flex items-center gap-3 bg-bordo hover:bg-bordo/90 text-white px-10 py-4 rounded-2xl font-black text-sm tracking-wider transition-all shadow-xl shadow-bordo/20 hover:shadow-bordo/40 disabled:opacity-50"
            >
              {isLoading ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
              {isEdit ? t('common.save') : t('common.create')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const Groups = () => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [search, setSearch] = useState('');

  const { data, isLoading: isTableLoading } = useGetGroupsQuery({ search });
  const [createGroup, { isLoading: isCreating }] = useCreateGroupMutation();
  const [updateGroup, { isLoading: isUpdating }] = useUpdateGroupMutation();
  const [deleteGroup] = useDeleteGroupMutation();

  const handleCreate = async (formData) => {
    try {
      await createGroup(formData).unwrap();
      toast.success(t('groups.createSuccess'));
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.data?.message || t('common.error'));
    }
  };

  const handleUpdate = async (formData) => {
    try {
      await updateGroup({ id: selectedGroup._id, ...formData }).unwrap();
      toast.success(t('groups.updateSuccess'));
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.data?.message || t('common.error'));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(t('groups.deleteConfirm'))) {
      try {
        await deleteGroup(id).unwrap();
        toast.success(t('groups.deleteSuccess'));
      } catch (err) {
        toast.error(t('common.error'));
      }
    }
  };

  const stats = [
    { label: t('groups.totalGroups'), value: data?.pagination?.total || 0, icon: UsersIcon, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: t('groups.activeGroups'), value: data?.data?.filter(g => g.status === 'active').length || 0, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: t('groups.avgStudents'), value: '12.4', icon: User, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ];

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-[var(--foreground)] tracking-tight">{t('sidebar.groups')}</h1>
          <p className="text-[var(--muted-foreground)]/60 text-sm mt-1 font-medium">{t('groups.subtitle')}</p>
        </div>
        <button
          onClick={() => { setSelectedGroup(null); setIsModalOpen(true); }}
          className="flex items-center justify-center gap-2 bg-bordo hover:bg-bordo/90 text-white px-8 py-4 rounded-2xl transition-all shadow-xl shadow-bordo/20 font-black text-sm hover:-translate-y-0.5 active:translate-y-0"
        >
          <Plus size={22} />
          {t('groups.newGroup')}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-[var(--card)] border border-[var(--border)] p-6 rounded-[32px] shadow-sm hover:border-bordo/20 transition-all group"
          >
            <div className="flex items-center gap-5">
              <div className={cn("p-4 rounded-2xl transition-all duration-500 group-hover:scale-110", stat.bg, stat.color)}>
                <stat.icon size={26} />
              </div>
              <div>
                <p className="text-[10px] font-black text-[var(--muted-foreground)]/30 uppercase tracking-[0.2em]">{stat.label}</p>
                <h3 className="text-3xl font-black text-[var(--foreground)] mt-0.5">{stat.value}</h3>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="bg-[var(--card)] border border-[var(--border)] p-4 rounded-[28px] shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]/30 group-focus-within:text-bordo transition-colors" size={20} />
          <input
            type="text"
            placeholder={t('groups.searchPlaceholder')}
            className="w-full bg-[var(--input)] border border-[var(--border)] rounded-2xl py-4 pl-12 pr-4 text-[var(--foreground)] text-sm font-bold focus:outline-none focus:border-bordo/50 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-[var(--muted)] border border-[var(--border)] text-[var(--muted-foreground)] text-sm font-bold hover:text-bordo hover:border-bordo/30 transition-all group">
          <Filter size={18} className="group-hover:rotate-180 transition-transform duration-500" />
          {t('common.filter')}
        </button>
      </div>

      {/* Groups List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isTableLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-[var(--card)] border border-[var(--border)] rounded-[32px] p-6 h-64 animate-pulse">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-2xl bg-[var(--muted)]"></div>
                <div className="w-20 h-6 rounded-full bg-[var(--muted)]"></div>
              </div>
              <div className="space-y-3">
                <div className="w-2/3 h-6 bg-[var(--muted)] rounded-lg"></div>
                <div className="w-full h-4 bg-[var(--muted)] rounded-lg"></div>
              </div>
            </div>
          ))
        ) : data?.data?.length > 0 ? (
          data.data.map((group, idx) => (
            <motion.div
              key={group._id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-[var(--card)] border border-[var(--border)] rounded-[32px] p-6 shadow-sm hover:border-bordo/30 transition-all group relative overflow-hidden"
            >
              {/* Background Accent */}
              <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 bg-bordo/5 rounded-full blur-2xl group-hover:bg-bordo/10 transition-colors"></div>

              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="w-12 h-12 bg-bordo/10 rounded-2xl flex items-center justify-center text-bordo group-hover:scale-110 transition-transform duration-500">
                  <UsersIcon size={24} />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setSelectedGroup(group); setIsModalOpen(true); }}
                    className="p-2 text-[var(--muted-foreground)]/40 hover:text-bordo hover:bg-bordo/5 rounded-xl transition-all"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(group._id)}
                    className="p-2 text-[var(--muted-foreground)]/40 hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="space-y-4 relative z-10">
                <div>
                  <h3 className="text-xl font-black text-[var(--foreground)] tracking-tight group-hover:text-bordo transition-colors">
                    {group.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-500 mt-1">
                    <CheckCircle2 size={12} />
                    {group.course?.name || t('groups.noCourse')}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center gap-3 text-sm font-bold text-[var(--muted-foreground)]/60">
                    <div className="w-8 h-8 rounded-lg bg-[var(--muted)] flex items-center justify-center">
                      <User size={14} className="text-bordo" />
                    </div>
                    {group.teacher?.name || t('groups.noTeacher')}
                  </div>
                  <div className="flex items-center gap-3 text-sm font-bold text-[var(--muted-foreground)]/60">
                    <div className="w-8 h-8 rounded-lg bg-[var(--muted)] flex items-center justify-center">
                      <Calendar size={14} className="text-bordo" />
                    </div>
                    {group.schedule}
                  </div>
                </div>

                <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-3">
                      {[1, 2, 3].map((_, i) => (
                        <img
                          key={i}
                          src={`https://ui-avatars.com/api/?name=S${i}&background=random&color=fff`}
                          className="w-8 h-8 rounded-xl border-2 border-[var(--card)]"
                          alt=""
                        />
                      ))}
                    </div>
                    <span className="text-[10px] font-black text-[var(--muted-foreground)]/40 uppercase tracking-widest ml-1">
                      {group.students?.length || 0} {t('sidebar.students')}
                    </span>
                  </div>
                  <button className="flex items-center gap-2 text-xs font-black text-bordo hover:translate-x-1 transition-transform">
                    {t('common.details')}
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-20 bg-[var(--card)] border border-dashed border-[var(--border)] rounded-[40px] flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-[var(--muted)] rounded-[30px] flex items-center justify-center mb-6">
              <UsersIcon size={40} className="text-[var(--muted-foreground)]/20" />
            </div>
            <h3 className="text-xl font-black text-[var(--foreground)] mb-2">{t('groups.noGroups')}</h3>
            <p className="text-sm text-[var(--muted-foreground)]/60 max-w-xs">{t('groups.noGroupsDesc')}</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <GroupModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSubmit={selectedGroup ? handleUpdate : handleCreate}
            group={selectedGroup}
            isLoading={isCreating || isUpdating}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Groups;
