import { useState } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Calendar, Users, FileText, Trash2, X, BookOpen, CheckCircle, Clock
} from 'lucide-react';
import {
  useGetClassworksQuery,
  useCreateClassworkMutation,
  useDeleteClassworkMutation,
} from '../../features/classworks/classworksApi';
import { useGetGroupsQuery } from '../../features/groups/groupsApi';
import { selectCurrentUser } from '../../features/auth/authSlice';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { az, enUS, ru } from 'date-fns/locale';
import toast from 'react-hot-toast';
import Select from '../../components/common/Select';
import Spinner from '../../components/common/Spinner';

const dateLocales = {
  az: az,
  en: enUS,
  ru: ru
};

// ─── Create Modal ────────────────────────────────────────────────
const CreateModal = ({ groups, onClose, onSubmit, isLoading }) => {
  const { t } = useTranslation();
  const [form, setForm] = useState({ title: '', description: '', group: '' });

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.group) {
      toast.error(t('settings.fillAll'));
      return;
    }
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl w-full max-w-md p-6"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">{t('classworks.newClasswork')}</h2>
          <button onClick={onClose} className="p-2 rounded-lg text-[var(--muted-foreground)]/50 hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-[var(--muted-foreground)] mb-1">{t('classworks.titleLabel')} *</label>
            <input name="title" value={form.title} onChange={handleChange} required
              className="w-full bg-[var(--input)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-[var(--foreground)] text-sm focus:outline-none focus:border-bordo"
              placeholder={t('classworks.placeholderTitle')} />
          </div>
          <div>
            <label className="block text-sm text-[var(--muted-foreground)] mb-1">{t('classworks.groupLabel')} *</label>
            <Select
              value={form.group}
              onChange={(val) => setForm(p => ({ ...p, group: val }))}
              options={[
                { label: t('classworks.placeholderGroup'), value: '' },
                ...groups.map(g => ({ label: g.name, value: g._id }))
              ]}
              required
            />
          </div>
          <div>
            <label className="block text-sm text-[var(--muted-foreground)] mb-1">{t('classworks.descLabel')} *</label>
            <textarea name="description" value={form.description} onChange={handleChange} required rows={3}
              className="w-full bg-[var(--input)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-[var(--foreground)] text-sm focus:outline-none focus:border-bordo resize-none"
              placeholder={t('classworks.placeholderDesc')} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-[var(--muted-foreground)]/60 hover:text-[var(--foreground)] bg-[var(--muted)]/50 hover:bg-[var(--muted)] rounded-xl transition-colors">
              {t('common.cancel')}
            </button>
            <button type="submit" disabled={isLoading}
              className="px-4 py-2 text-sm text-white bg-bordo hover:bg-bordo/80 rounded-xl transition-colors disabled:opacity-50">
              {isLoading ? t('classworks.creatingBtn') : t('classworks.createBtn')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// ─── Status Badge ────────────────────────────────────────────────
const StatusBadge = ({ count, total }) => {
  const { t } = useTranslation();
  if (total === 0) return <span className="text-xs text-[var(--muted-foreground)]/30">{t('classworks.noSubmissions')}</span>;
  const pct = Math.round((count / total) * 100);
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${pct === 100 ? 'bg-green-500/20 text-green-400' : 'bg-bordo/20 text-bordo'}`}>
      {t('classworks.submissionsCount', { count, total })}
    </span>
  );
};

// ─── Main Page ────────────────────────────────────────────────────
const Classworks = () => {
  const { t, i18n } = useTranslation();
  const user = useSelector(selectCurrentUser);
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const { data: classworks = [], isLoading } = useGetClassworksQuery(selectedGroup || undefined);
  const { data: groupsResponse } = useGetGroupsQuery();
  const [createClasswork, { isLoading: isCreating }] = useCreateClassworkMutation();
  const [deleteClasswork] = useDeleteClassworkMutation();

  const groups = groupsResponse?.data || [];
  const isAdminOrTeacher = user?.role === 'admin' || user?.role === 'teacher';

  const filtered = classworks.filter((cw) =>
    cw.title?.toLowerCase().includes(search.toLowerCase()) ||
    cw.description?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (data) => {
    try {
      await createClasswork(data).unwrap();
      toast.success(t('classworks.createSuccess'));
      setShowCreate(false);
    } catch (err) {
      toast.error(err?.data?.message || t('students.error'));
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteClasswork(id).unwrap();
      toast.success(t('classworks.deleteSuccess'));
    } catch (err) {
      toast.error(err?.data?.message || t('students.error'));
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)] flex items-center gap-2">
              <BookOpen className="text-bordo" />
              {t('classworks.title')}
            </h1>
            <p className="text-[var(--muted-foreground)]/40 text-sm mt-1">{t('classworks.subtitle')}</p>
          </div>
          {isAdminOrTeacher && (
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 bg-bordo hover:bg-bordo/80 text-white rounded-xl text-sm transition-colors">
              <Plus size={16} />
              {t('classworks.addNew')}
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]/30" size={16} />
            <input type="text" placeholder={t('classworks.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[var(--input)] border border-[var(--border)] rounded-xl text-[var(--foreground)] text-sm focus:outline-none focus:border-bordo transition-colors" />
          </div>
          {isAdminOrTeacher && (
            <div className="min-w-[180px]">
              <Select
                value={selectedGroup}
                onChange={setSelectedGroup}
                options={[
                  { label: t('exams.allGroups'), value: '' },
                  ...groups.map(g => ({ label: g.name, value: g._id }))
                ]}
              />
            </div>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-[var(--muted-foreground)]/30">
            <FileText size={48} className="mb-4 opacity-40" />
            <p className="text-lg font-medium">{t('classworks.noClassworks')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((cw, i) => (
              <motion.div key={cw._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="group bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 hover:border-[var(--foreground)]/20 transition-all flex flex-col shadow-sm"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-base font-semibold text-[var(--foreground)] line-clamp-1 flex-1 mr-2">{cw.title}</h3>
                  {isAdminOrTeacher && (
                    <button onClick={() => handleDelete(cw._id)}
                      className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 text-[var(--muted-foreground)]/40 hover:text-red-500 hover:bg-red-500/10 transition-all">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <p className="text-[var(--muted-foreground)]/60 text-sm line-clamp-2 mb-4 flex-1">{cw.description}</p>

                <div className="space-y-2 text-xs text-[var(--muted-foreground)]/50 border-t border-[var(--border)] pt-3">
                  <div className="flex items-center gap-2">
                    <Users size={13} className="text-bordo shrink-0" />
                    <span>{t('common.group')}: {cw.group?.name || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={13} className="text-bordo shrink-0" />
                    <span>{cw.date ? format(new Date(cw.date), 'd MMM yyyy', { locale: dateLocales[i18n.language] || az }) : '—'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* ... */}
                    <StatusBadge count={cw.submissions?.length || 0} total={cw.group?.students?.length || 0} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showCreate && (
          <CreateModal
            groups={groups}
            onClose={() => setShowCreate(false)}
            onSubmit={handleCreate}
            isLoading={isCreating}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default Classworks;
