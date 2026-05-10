import { useState } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Calendar, Users, FileText, Trash2, X, BookOpen, CheckCircle, Clock, Link, Pen
} from 'lucide-react';
import {
  useGetClassworksQuery,
  useCreateClassworkMutation,
  useUpdateClassworkMutation,
  useDeleteClassworkMutation,
  useSubmitClassworkMutation,
  useRemoveClassworkSubmissionMutation,
  useGradeClassworkMutation
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

// ─── Main Page ────────────────────────────────────────────────────
const Classworks = () => {
  const { t, i18n } = useTranslation();
  const user = useSelector(selectCurrentUser);
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createData, setCreateData] = useState({ title: '', description: '', group: '', dueDate: '' });
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [activeClasswork, setActiveClasswork] = useState(null);

  const { data: classworks = [], isLoading } = useGetClassworksQuery(selectedGroup || undefined);
  const { data: groupsResponse } = useGetGroupsQuery();
  const [createClasswork, { isLoading: isCreating }] = useCreateClassworkMutation();
  const [updateClasswork, { isLoading: isUpdating }] = useUpdateClassworkMutation();
  const [deleteClasswork] = useDeleteClassworkMutation();
  const [submitClasswork, { isLoading: isSubmitting }] = useSubmitClassworkMutation();
  const [removeClassworkSubmission, { isLoading: isRemoving }] = useRemoveClassworkSubmissionMutation();
  const [gradeClasswork, { isLoading: isGrading }] = useGradeClassworkMutation();

  const groups = groupsResponse?.data || [];
  const isAdminOrTeacher = user?.role === 'admin' || user?.role === 'teacher';

  const [submitNote, setSubmitNote] = useState('');
  const [submitLinks, setSubmitLinks] = useState(['']);
  const [gradeData, setGradeData] = useState({});

  const addLink = () => setSubmitLinks(prev => [...prev, '']);
  const removeLink = (i) => setSubmitLinks(prev => prev.filter((_, idx) => idx !== i));
  const updateLink = (i, val) => setSubmitLinks(prev => prev.map((l, idx) => idx === i ? val : l));

  const filtered = classworks.filter((cw) =>
    cw.title?.toLowerCase().includes(search.toLowerCase()) ||
    cw.description?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateClasswork = async (e) => {
    e.preventDefault();
    try {
      if (activeClasswork && isCreateModalOpen && createData._id) {
        await updateClasswork({ id: createData._id, data: createData }).unwrap();
        toast.success(t('classworks.updateSuccess') || 'Sinif işi uğurla yeniləndi');
      } else {
        await createClasswork(createData).unwrap();
        toast.success(t('classworks.createSuccess'));
      }
      setIsCreateModalOpen(false);
      setCreateData({ title: '', description: '', group: '', dueDate: '' });
      setActiveClasswork(null);
    } catch (error) {
      toast.error(error.data?.message || t('common.error'));
    }
  };

  const handleDeleteClasswork = async (id) => {
    if (window.confirm(t('common.deleteConfirm') || 'Silmək istədiyinizə əminsiniz?')) {
      try {
        await deleteClasswork(id).unwrap();
        toast.success(t('classworks.deleteSuccess') || 'Sinif işi uğurla silindi');
      } catch (error) {
        toast.error(error.data?.message || t('common.error'));
      }
    }
  };

  const openEditModal = (cw) => {
    setActiveClasswork(cw);
    setCreateData({
      _id: cw._id,
      title: cw.title,
      description: cw.description || '',
      group: typeof cw.group === 'object' ? cw.group._id : cw.group,
      dueDate: cw.dueDate ? new Date(cw.dueDate).toISOString().slice(0, 16) : ''
    });
    setIsCreateModalOpen(true);
  };

  const handleSubmitClasswork = async (e) => {
    e.preventDefault();
    if (!activeClasswork) return;
    try {
      const validLinks = submitLinks.filter(l => l.trim() !== '');
      if (validLinks.length === 0 && submitNote.trim() === '') {
        toast.error(t('classworks.submitEmptyError') || 'Zəhmət olmasa link və ya qeyd daxil edin');
        return;
      }
      const payload = { links: validLinks, note: submitNote };
      await submitClasswork({ id: activeClasswork._id, data: payload }).unwrap();
      toast.success(t('classworks.submitSuccess'));
      setIsSubmitModalOpen(false);
      setSubmitNote('');
      setSubmitLinks(['']);
      setActiveClasswork(null);
    } catch (error) {
      toast.error(error.data?.message || t('common.error'));
    }
  };

  const handleDeleteSubmission = async (id) => {
    if (window.confirm(t('common.deleteConfirm') || 'Silmək istədiyinizə əminsiniz?')) {
      try {
        await removeClassworkSubmission(id).unwrap();
        toast.success(t('classworks.deleteSuccess') || 'Göndəriş silindi');
      } catch (error) {
        toast.error(error.data?.message || t('common.error'));
      }
    }
  };

  const handleGradeSubmission = async (e, studentId) => {
    e.preventDefault();
    if (!activeClasswork) return;
    try {
      const gData = gradeData[studentId] || {};
      const payload = {
        studentId,
        grade: Number(gData.grade),
        feedback: gData.feedback || ''
      };
      await gradeClasswork({ id: activeClasswork._id, data: payload }).unwrap();
      toast.success(t('classworks.gradeSuccess'));
    } catch (error) {
      toast.error(error.data?.message || t('common.error'));
    }
  };

  const openSubmitModal = (cw) => {
    setActiveClasswork(cw);
    const mySub = cw.submissions?.find(s => s.student?._id === user._id || s.student === user._id);
    if (mySub) {
      setSubmitNote(mySub.note || '');
      setSubmitLinks(mySub.files?.length > 0 ? mySub.files : ['']);
    } else {
      setSubmitNote('');
      setSubmitLinks(['']);
    }
    setIsSubmitModalOpen(true);
  };

  const openGradeModal = (cw) => {
    setActiveClasswork(cw);
    const initialGrades = {};
    if (cw.submissions) {
      cw.submissions.forEach(sub => {
        initialGrades[sub.student._id] = {
          grade: sub.grade || '',
          feedback: sub.feedback || ''
        };
      });
    }
    setGradeData(initialGrades);
    setIsGradeModalOpen(true);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)] flex items-center gap-2">
              <BookOpen className="text-bordo" />
              {t('classworks.title')}
            </h1>
            <p className="text-[var(--muted-foreground)]/40 text-sm mt-1">{t('classworks.subtitle')}</p>
          </div>
          {isAdminOrTeacher && (
            <button
              onClick={() => {
                setActiveClasswork(null);
                setCreateData({ title: '', description: '', group: '', dueDate: '' });
                setIsCreateModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-bordo/80 text-white rounded-lg hover:bg-bordo transition-colors"
            >
              <Plus size={20} />
              <span>{t('classworks.addNew')}</span>
            </button>
          )}
        </div>

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
                className="group bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 hover:border-[var(--foreground)]/20 transition-all flex flex-col shadow-sm relative"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-base font-semibold text-[var(--foreground)] line-clamp-1 flex-1 mr-2">{cw.title}</h3>
                  {isAdminOrTeacher && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => openEditModal(cw)}
                        className="p-1.5 rounded-lg text-[var(--muted-foreground)]/40 hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-all"
                      >
                        <Pen size={14} />
                      </button>
                      <button 
                        onClick={() => handleDeleteClasswork(cw._id)}
                        className="p-1.5 rounded-lg text-[var(--muted-foreground)]/40 hover:text-red-500 hover:bg-red-500/10 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-[var(--muted-foreground)]/60 text-sm line-clamp-2 mb-4 flex-1">{cw.description}</p>

                <div className="space-y-2 text-xs text-[var(--muted-foreground)]/50 border-t border-[var(--border)] pt-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Users size={13} className="text-bordo shrink-0" />
                    <span>{t('common.group')}: {cw.group?.name || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={13} className="text-bordo shrink-0" />
                    <span>{cw.date ? format(new Date(cw.date), 'd MMM yyyy', { locale: dateLocales[i18n.language] || az }) : '—'}</span>
                  </div>
                  {cw.dueDate && (
                    <div className="flex items-center gap-2">
                      <Clock size={13} className="text-bordo shrink-0" />
                      <span>{t('classworks.dueDate')}: <span className="font-medium">{format(new Date(cw.dueDate), 'd MMM yyyy, HH:mm', { locale: dateLocales[i18n.language] || az })}</span></span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${cw.submissions?.length === (cw.group?.students?.length || 0) && (cw.group?.students?.length || 0) > 0 ? 'bg-green-500/20 text-green-400' : 'bg-bordo/20 text-bordo'}`}>
                      {t('classworks.submissionsCount', { count: cw.submissions?.length || 0, total: cw.group?.students?.length || 0 })}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--border)] flex flex-col justify-end mt-auto w-full">
                  {user.role === 'student' ? (
                    (() => {
                      const mySub = cw.submissions?.find(s => s.student?._id === user._id || s.student === user._id);
                      const isGraded = mySub?.status === 'graded';
                      
                      if (isGraded) {
                        return (
                          <div className="w-full flex flex-col gap-2">
                            <div className="flex items-center justify-between bg-bordo/10 border border-bordo/20 rounded-lg p-2.5">
                              <span className="text-xs font-medium text-bordo">
                                {t('classworks.graded') || 'Qiymətləndirilib'}
                              </span>
                              <span className="text-xs font-bold text-bordo">
                                {mySub.grade} / 100
                              </span>
                            </div>
                            {mySub.feedback && (
                              <div className="text-xs text-[var(--muted-foreground)] bg-[var(--muted)]/50 p-2.5 rounded-lg border border-[var(--border)] italic">
                                "{mySub.feedback}"
                              </div>
                            )}
                          </div>
                        );
                      }

                      const isPastDeadline = cw.dueDate ? new Date() > new Date(cw.dueDate) : false;
                      const hasSubmitted = !!mySub;
                      
                      if (isPastDeadline && !hasSubmitted) {
                        return (
                          <div className="w-full text-center py-1.5 text-xs text-[var(--muted-foreground)] font-medium bg-[var(--muted)]/50 rounded-lg">
                            {t('classworks.deadlinePassed') || 'Deadline bitib'}
                          </div>
                        );
                      }

                      return hasSubmitted ? (
                        <div className="flex gap-2 w-full">
                          <button 
                            onClick={() => openSubmitModal(cw)}
                            className="flex-1 py-1.5 bg-bordo/10 hover:bg-bordo/20 text-bordo rounded-lg transition-colors text-xs font-medium"
                          >
                            {t('common.edit') || 'Redaktə et'}
                          </button>
                          <button 
                            onClick={() => handleDeleteSubmission(cw._id)}
                            disabled={isRemoving}
                            className="flex-1 py-1.5 bg-[var(--input)] border border-[var(--border)] hover:bg-[var(--muted)] text-[var(--foreground)] rounded-lg transition-colors text-xs font-medium disabled:opacity-50"
                          >
                            {t('common.delete') || 'Sil'}
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => openSubmitModal(cw)}
                          className="w-full py-1.5 bg-[var(--muted)] hover:bg-[var(--muted)]/80 text-[var(--foreground)] rounded-lg transition-colors text-xs font-medium"
                        >
                          {t('classworks.submitClasswork')}
                        </button>
                      );
                    })()
                  ) : (
                    <button 
                      onClick={() => openGradeModal(cw)}
                      className="w-full py-1.5 bg-[var(--muted)] hover:bg-[var(--muted)]/80 text-[var(--foreground)] rounded-lg transition-colors text-xs font-medium"
                    >
                      {t('classworks.submissions')}
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl w-full max-w-md p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-[var(--foreground)]">
                  {createData._id ? t('common.edit') || 'Redaktə et' : t('classworks.newClasswork')}
                </h2>
                <button onClick={() => setIsCreateModalOpen(false)} className="p-2 rounded-lg text-[var(--muted-foreground)]/50 hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleCreateClasswork} className="space-y-4">
                <div>
                  <label className="block text-sm text-[var(--muted-foreground)] mb-1">{t('classworks.titleLabel')} *</label>
                  <input name="title" value={createData.title} onChange={(e) => setCreateData(p => ({...p, title: e.target.value}))} required
                    className="w-full bg-[var(--input)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-[var(--foreground)] text-sm focus:outline-none focus:border-bordo"
                    placeholder={t('classworks.placeholderTitle')} />
                </div>
                <div>
                  <label className="block text-sm text-[var(--muted-foreground)] mb-1">{t('classworks.groupLabel')} *</label>
                  <Select
                    value={createData.group}
                    onChange={(val) => setCreateData(p => ({ ...p, group: val }))}
                    options={[
                      { label: t('classworks.placeholderGroup'), value: '' },
                      ...groups.map(g => ({ label: g.name, value: g._id }))
                    ]}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-[var(--muted-foreground)] mb-1">{t('classworks.descLabel')} *</label>
                  <textarea value={createData.description} onChange={(e) => setCreateData(p => ({...p, description: e.target.value}))} required rows={3}
                    className="w-full bg-[var(--input)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-[var(--foreground)] text-sm focus:outline-none focus:border-bordo resize-none"
                    placeholder={t('classworks.placeholderDesc')} />
                </div>
                <div>
                  <label className="block text-sm text-[var(--muted-foreground)] mb-1">{t('classworks.dueDateLabel')} *</label>
                  <input type="datetime-local" value={createData.dueDate} onChange={(e) => setCreateData(p => ({...p, dueDate: e.target.value}))} required
                    className="w-full bg-[var(--input)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-[var(--foreground)] text-sm focus:outline-none focus:border-bordo" />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 text-sm text-[var(--muted-foreground)]/60 hover:text-[var(--foreground)] bg-[var(--muted)]/50 hover:bg-[var(--muted)] rounded-xl transition-colors">
                    {t('common.cancel')}
                  </button>
                  <button type="submit" disabled={isCreating || isUpdating}
                    className="px-4 py-2 text-sm text-white bg-bordo hover:bg-bordo/80 rounded-xl transition-colors disabled:opacity-50">
                    {createData._id 
                      ? (isUpdating ? t('common.updating') || 'Yenilənir...' : t('common.update') || 'Yenilə')
                      : (isCreating ? t('classworks.creatingBtn') : t('classworks.createBtn'))}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSubmitModalOpen && activeClasswork && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-[var(--foreground)]">{t('classworks.submitClasswork')}</h3>
                <button onClick={() => setIsSubmitModalOpen(false)} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                  <X size={20} />
                </button>
              </div>

              <div className="mb-5 p-4 bg-[var(--muted)]/50 rounded-lg border border-[var(--border)]">
                <h4 className="font-semibold text-[var(--foreground)] mb-1">{activeClasswork.title}</h4>
                <p className="text-sm text-[var(--muted-foreground)]">{activeClasswork.description}</p>
              </div>

              <form onSubmit={handleSubmitClasswork} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-1">
                    {t('classworks.noteLabel') || 'Qeyd / Şərh'}
                  </label>
                  <textarea
                    value={submitNote}
                    onChange={(e) => setSubmitNote(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 bg-[var(--input)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-bordo resize-none"
                    placeholder={t('classworks.notePlaceholder') || 'Müəllimə qeyd buraxın...'}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-[var(--muted-foreground)]">
                      {t('classworks.uploadFiles')}
                    </label>
                    <button
                      type="button"
                      onClick={addLink}
                      className="flex items-center gap-1 text-xs text-bordo hover:underline"
                    >
                      <Plus size={12} /> {t('classworks.addLink') || 'Link əlavə et'}
                    </button>
                  </div>
                  <div className="space-y-2">
                    {submitLinks.map((link, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <Link size={14} className="text-[var(--muted-foreground)]/50 shrink-0" />
                        <input
                          type="text"
                          value={link}
                          onChange={(e) => updateLink(i, e.target.value)}
                          className="flex-1 px-3 py-2 bg-[var(--input)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-bordo text-sm"
                          placeholder="https://drive.google.com/..."
                        />
                        {submitLinks.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeLink(i)}
                            className="text-[var(--muted-foreground)]/40 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsSubmitModalOpen(false)}
                    className="px-4 py-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-bordo text-white rounded-lg hover:bg-bordo/90 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? t('classworks.submittingBtn') : t('classworks.submitBtn')}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* GRADE MODAL (TEACHER) */}
      <AnimatePresence>
        {isGradeModalOpen && activeClasswork && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold text-[var(--foreground)]">{activeClasswork.title} - {t('classworks.submissions')}</h3>
                  <p className="text-sm text-[var(--muted-foreground)] mt-1">{t('common.group')}: {activeClasswork.group?.name}</p>
                </div>
                <button onClick={() => setIsGradeModalOpen(false)} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                  <X size={20} />
                </button>
              </div>

              {activeClasswork.submissions?.length === 0 ? (
                <div className="py-8 text-center text-[var(--muted-foreground)]">
                  <p>{t('classworks.noSubmissions')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeClasswork.submissions?.map((sub) => (
                    <div key={sub._id} className="p-4 border border-[var(--border)] rounded-lg bg-[var(--muted)]/20">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <div>
                          <div className="font-medium text-[var(--foreground)]">{sub.student?.name} {sub.student?.surname}</div>
                          <div className="text-xs text-[var(--muted-foreground)] mt-1">
                            {format(new Date(sub.submittedAt || sub.createdAt || new Date()), 'dd MMM yyyy, HH:mm')}
                            {sub.status === 'late' && (
                              <span className="ml-2 text-red-400">• {t('homeworks.late') || 'Gecikmiş'}</span>
                            )}
                            {sub.status === 'graded' && (
                              <span className="ml-2 text-bordo">• {t('classworks.graded') || 'Qiymətləndirilib'} ({sub.grade}/100)</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Student's Note */}
                      {sub.note && (
                        <div className="mb-4 bg-[var(--background)] p-3 rounded-lg border border-[var(--border)]">
                          <p className="text-sm font-medium text-[var(--muted-foreground)] mb-1">{t('classworks.noteLabel') || 'Qeyd / Şərh'}:</p>
                          <p className="text-sm text-[var(--foreground)] whitespace-pre-wrap">{sub.note}</p>
                        </div>
                      )}

                      {/* Submitted Links */}
                      {sub.files && sub.files.length > 0 && (
                        <div className="mb-4 space-y-2 bg-[var(--background)] p-3 rounded-lg border border-[var(--border)]">
                          <p className="text-sm font-medium text-[var(--muted-foreground)] mb-1">
                            {sub.files.length} {t('classworks.linkOrFile') || 'link'}
                          </p>
                          <div className="space-y-1">
                            {sub.files.map((file, idx) => (
                              <a
                                key={idx}
                                href={file}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-bordo hover:underline flex items-center gap-2 py-1"
                              >
                                <Link size={14} className="shrink-0" /> 
                                <span className="truncate">{file}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      

                      <form onSubmit={(e) => handleGradeSubmission(e, sub.student?._id)} className="flex flex-col sm:flex-row gap-3">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          placeholder={t('classworks.grade') || 'Xal (0-100)'}
                          value={gradeData[sub.student?._id]?.grade || ''}
                          onChange={(e) => setGradeData(prev => ({
                            ...prev,
                            [sub.student?._id]: { ...prev[sub.student?._id], grade: e.target.value }
                          }))}
                          className="w-full sm:w-28 px-3 py-2 bg-[var(--input)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-bordo"
                        />
                        <input
                          type="text"
                          placeholder={t('classworks.feedback')}
                          value={gradeData[sub.student?._id]?.feedback || ''}
                          onChange={(e) => setGradeData(prev => ({
                            ...prev,
                            [sub.student?._id]: { ...prev[sub.student?._id], feedback: e.target.value }
                          }))}
                          className="flex-1 px-3 py-2 bg-[var(--input)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-bordo"
                        />
                        <button
                          type="submit"
                          disabled={isGrading}
                          className="px-4 py-2 bg-bordo text-white rounded-lg hover:bg-bordo/90 transition-colors disabled:opacity-50 whitespace-nowrap"
                        >
                          {t('classworks.gradeBtn')}
                        </button>
                      </form>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Classworks;
