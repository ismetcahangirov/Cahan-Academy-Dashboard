import { useState } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Calendar, 
  Users, FileText, X, Trash2, Link
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { 
  useGetHomeworksQuery, 
  useCreateHomeworkMutation,
  useSubmitHomeworkMutation,
  useGradeHomeworkMutation
} from '../../features/homeworks/homeworksApi';
import { useGetGroupsQuery } from '../../features/groups/groupsApi';
import { selectCurrentUser } from '../../features/auth/authSlice';
import Select from '../../components/common/Select';
import Spinner from '../../components/common/Spinner';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const Homeworks = () => {
  const { t } = useTranslation();
  const user = useSelector(selectCurrentUser);
  
  const [selectedGroup, setSelectedGroup] = useState('');
  
  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  
  const [activeHomework, setActiveHomework] = useState(null);

  // Queries
  const { data: homeworksResponse, isLoading } = useGetHomeworksQuery(selectedGroup || undefined);
  const { data: groupsResponse } = useGetGroupsQuery();
  
  // Mutations
  const [createHomework, { isLoading: isCreating }] = useCreateHomeworkMutation();
  const [submitHomework, { isLoading: isSubmitting }] = useSubmitHomeworkMutation();
  const [gradeHomework, { isLoading: isGrading }] = useGradeHomeworkMutation();

  const homeworks = homeworksResponse || [];
  const groups = groupsResponse?.data || [];

  // Create Modal Form State
  const [createData, setCreateData] = useState({ title: '', description: '', group: '', dueDate: '' });
  
  // Submit Modal Form State — note + multiple links
  const [submitNote, setSubmitNote] = useState('');
  const [submitLinks, setSubmitLinks] = useState(['']);

  // Grade Modal Form State
  const [gradeData, setGradeData] = useState({});

  const handleCreateHomework = async (e) => {
    e.preventDefault();
    try {
      await createHomework(createData).unwrap();
      toast.success(t('homeworks.createSuccess'));
      setIsCreateModalOpen(false);
      setCreateData({ title: '', description: '', group: '', dueDate: '' });
    } catch (error) {
      toast.error(error.data?.message || t('common.error'));
    }
  };

  const handleSubmitHomework = async (e) => {
    e.preventDefault();
    if (!activeHomework) return;
    try {
      const validLinks = submitLinks.filter(l => l.trim() !== '');
      const payload = {
        links: validLinks,
        note: submitNote,
      };
      await submitHomework({ id: activeHomework._id, data: payload }).unwrap();
      toast.success(t('homeworks.submitSuccess'));
      setIsSubmitModalOpen(false);
      setSubmitNote('');
      setSubmitLinks(['']);
      setActiveHomework(null);
    } catch (error) {
      toast.error(error.data?.message || t('common.error'));
    }
  };

  const handleGradeSubmission = async (e, studentId) => {
    e.preventDefault();
    if (!activeHomework) return;
    try {
      const gData = gradeData[studentId] || {};
      const payload = {
        studentId,
        grade: Number(gData.grade),
        feedback: gData.feedback || ''
      };
      await gradeHomework({ id: activeHomework._id, data: payload }).unwrap();
      toast.success(t('homeworks.gradeSuccess'));
    } catch (error) {
      toast.error(error.data?.message || t('common.error'));
    }
  };

  const openSubmitModal = (hw) => {
    setActiveHomework(hw);
    setSubmitNote('');
    setSubmitLinks(['']);
    setIsSubmitModalOpen(true);
  };

  const openGradeModal = (hw) => {
    setActiveHomework(hw);
    const initialGrades = {};
    if (hw.submissions) {
      hw.submissions.forEach(sub => {
        initialGrades[sub.student._id] = {
          grade: sub.grade || '',
          feedback: sub.feedback || ''
        };
      });
    }
    setGradeData(initialGrades);
    setIsGradeModalOpen(true);
  };

  // Link list helpers
  const addLink = () => setSubmitLinks(prev => [...prev, '']);
  const removeLink = (i) => setSubmitLinks(prev => prev.filter((_, idx) => idx !== i));
  const updateLink = (i, val) => setSubmitLinks(prev => prev.map((l, idx) => idx === i ? val : l));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">{t('homeworks.title')}</h1>
          <p className="text-[var(--muted-foreground)] mt-1">
            {user.role === 'student' 
              ? t('homeworks.studentSubtitle') 
              : t('homeworks.teacherSubtitle')}
          </p>
        </div>

        {['admin', 'teacher'].includes(user.role) && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-bordo/80 text-white rounded-lg hover:bg-bordo transition-colors"
          >
            <Plus size={20} />
            <span>{t('homeworks.addNew')}</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]/40" size={20} />
          <input
            type="text"
            placeholder={t('homeworks.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2 bg-[var(--input)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/40 focus:outline-none focus:border-bordo transition-colors"
          />
        </div>
        
        {['admin', 'teacher'].includes(user.role) && (
          <div className="w-full">
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

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {homeworks.map((hw) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={hw._id}
              className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 hover:bg-[var(--muted)]/50 transition-all group relative flex flex-col"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-[var(--foreground)] line-clamp-1">{hw.title}</h3>
              </div>
              
              <p className="text-[var(--muted-foreground)] mb-6 line-clamp-2 text-sm flex-grow">{hw.description}</p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm text-[var(--muted-foreground)]">
                  <Users size={16} className="text-bordo" />
                  <span>{t('common.group')}: {hw.group?.name || t('common.unknown')}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-[var(--muted-foreground)]">
                  <Calendar size={16} className="text-bordo" />
                  <span>{t('homeworks.dueDateLabel')}: {hw.dueDate ? format(new Date(hw.dueDate), 'dd MMM yyyy, HH:mm') : '-'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-[var(--muted-foreground)]">
                  <FileText size={16} className="text-bordo" />
                  <span>{t('homeworks.attachmentCount', { count: hw.files?.length || 0 })}</span>
                </div>
              </div>

              {/* Action Area based on role */}
              <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between mt-auto">
                {user.role === 'student' ? (
                  <button 
                    onClick={() => openSubmitModal(hw)}
                    className="w-full py-2 bg-[var(--muted)] hover:bg-[var(--muted)]/80 text-[var(--foreground)] rounded-lg transition-colors text-sm font-medium"
                  >
                    {t('homeworks.viewAndSubmit')}
                  </button>
                ) : (
                  <div className="flex items-center justify-between w-full">
                    <div className="text-sm text-[var(--muted-foreground)]">
                      <span className="text-[var(--foreground)] font-medium">{t('homeworks.submissionsCount', { count: hw.submissions?.length || 0 })}</span>
                    </div>
                    <button 
                      onClick={() => openGradeModal(hw)}
                      className="px-4 py-2 bg-[var(--muted)] hover:bg-[var(--muted)]/80 text-[var(--foreground)] rounded-lg transition-colors text-sm font-medium"
                    >
                      {t('homeworks.checkBtn')}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          
          {homeworks.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-[var(--muted-foreground)]/40">
              <FileText size={48} className="mb-4 opacity-50" />
              <p>{t('homeworks.noHomeworks')}</p>
            </div>
          )}
        </div>
      )}

      {/* CREATE MODAL */}
      <AnimatePresence>
        {isCreateModalOpen && (
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
              className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 w-full max-w-md shadow-xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-[var(--foreground)]">{t('homeworks.newHomework')}</h3>
                <button onClick={() => setIsCreateModalOpen(false)} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateHomework} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-1">
                    {t('homeworks.titleLabel')}
                  </label>
                  <input
                    required
                    type="text"
                    value={createData.title}
                    onChange={(e) => setCreateData({ ...createData, title: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--input)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-bordo"
                    placeholder={t('homeworks.placeholderTitle')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-1">
                    {t('homeworks.descLabel')}
                  </label>
                  <textarea
                    required
                    value={createData.description}
                    onChange={(e) => setCreateData({ ...createData, description: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--input)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-bordo min-h-[100px]"
                    placeholder={t('homeworks.placeholderDesc')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-1">
                    {t('homeworks.groupLabel')}
                  </label>
                  <Select
                    value={createData.group}
                    onChange={(val) => setCreateData({ ...createData, group: val })}
                    options={[
                      { label: t('homeworks.placeholderGroup'), value: '' },
                      ...groups.map(g => ({ label: g.name, value: g._id }))
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-1">
                    {t('homeworks.dueDateLabel')}
                  </label>
                  <input
                    required
                    type="datetime-local"
                    value={createData.dueDate}
                    onChange={(e) => setCreateData({ ...createData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--input)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-bordo"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="px-4 py-2 bg-bordo text-white rounded-lg hover:bg-bordo/90 transition-colors disabled:opacity-50"
                  >
                    {isCreating ? t('homeworks.creatingBtn') : t('homeworks.createBtn')}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SUBMIT MODAL (STUDENT) */}
      <AnimatePresence>
        {isSubmitModalOpen && activeHomework && (
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
                <h3 className="text-xl font-bold text-[var(--foreground)]">{t('homeworks.submitHomework')}</h3>
                <button onClick={() => setIsSubmitModalOpen(false)} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                  <X size={20} />
                </button>
              </div>

              {/* Task info */}
              <div className="mb-5 p-4 bg-[var(--muted)]/50 rounded-lg border border-[var(--border)]">
                <h4 className="font-semibold text-[var(--foreground)] mb-1">{activeHomework.title}</h4>
                <p className="text-sm text-[var(--muted-foreground)]">{activeHomework.description}</p>
                <div className="mt-2 text-xs text-[var(--muted-foreground)]/70 flex items-center gap-1">
                  <Calendar size={12} />
                  {t('homeworks.dueDateLabel')}: {activeHomework.dueDate ? format(new Date(activeHomework.dueDate), 'dd MMM yyyy, HH:mm') : '-'}
                </div>
              </div>

              <form onSubmit={handleSubmitHomework} className="space-y-4">
                {/* Note / Comment */}
                <div>
                  <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-1">
                    {t('homeworks.noteLabel') || 'Qeyd / Şərh'}
                  </label>
                  <textarea
                    value={submitNote}
                    onChange={(e) => setSubmitNote(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 bg-[var(--input)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-bordo resize-none"
                    placeholder={t('homeworks.notePlaceholder') || 'Müəllimə qeyd bıraxın...'}
                  />
                </div>

                {/* File / Link list */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-[var(--muted-foreground)]">
                      {t('homeworks.uploadFiles')} ({t('homeworks.linkOrFile') || 'link və ya fayl URL'})
                    </label>
                    <button
                      type="button"
                      onClick={addLink}
                      className="flex items-center gap-1 text-xs text-bordo hover:underline"
                    >
                      <Plus size={12} /> {t('homeworks.addLink') || 'Link əlavə et'}
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
                    {isSubmitting ? t('homeworks.submittingBtn') : t('homeworks.submitBtn')}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GRADE MODAL (TEACHER) */}
      <AnimatePresence>
        {isGradeModalOpen && activeHomework && (
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
                  <h3 className="text-xl font-bold text-[var(--foreground)]">{activeHomework.title} - {t('homeworks.submissions')}</h3>
                  <p className="text-sm text-[var(--muted-foreground)] mt-1">{t('common.group')}: {activeHomework.group?.name}</p>
                </div>
                <button onClick={() => setIsGradeModalOpen(false)} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                  <X size={20} />
                </button>
              </div>

              {activeHomework.submissions?.length === 0 ? (
                <div className="py-8 text-center text-[var(--muted-foreground)]">
                  <p>{t('homeworks.noSubmissions')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeHomework.submissions?.map((sub) => (
                    <div key={sub._id} className="p-4 border border-[var(--border)] rounded-lg bg-[var(--muted)]/20">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                        <div>
                          <div className="font-medium text-[var(--foreground)]">{sub.student?.name} {sub.student?.surname}</div>
                          <div className="text-xs text-[var(--muted-foreground)] mt-0.5">
                            {format(new Date(sub.submittedAt || sub.createdAt || new Date()), 'dd MMM yyyy, HH:mm')}
                            {sub.status === 'late' && (
                              <span className="ml-2 text-red-400">• {t('homeworks.late') || 'Gecikmiş'}</span>
                            )}
                          </div>
                          {/* Student note */}
                          {sub.note && (
                            <div className="mt-2 text-sm text-[var(--muted-foreground)] italic border-l-2 border-bordo/40 pl-2">
                              "{sub.note}"
                            </div>
                          )}
                        </div>
                        {/* Submitted links */}
                        {sub.files && sub.files.length > 0 && (
                          <div className="flex flex-col gap-1">
                            {sub.files.map((f, fi) => (
                              <a 
                                key={fi}
                                href={f} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-bordo hover:underline flex items-center gap-1"
                              >
                                <FileText size={13} /> {t('homeworks.viewFile') || `Fayl ${fi + 1}`}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <form onSubmit={(e) => handleGradeSubmission(e, sub.student?._id)} className="flex flex-col sm:flex-row gap-3 mt-3 pt-3 border-t border-[var(--border)]">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          placeholder={t('homeworks.grade')}
                          value={gradeData[sub.student?._id]?.grade || ''}
                          onChange={(e) => setGradeData(prev => ({
                            ...prev,
                            [sub.student?._id]: { ...prev[sub.student?._id], grade: e.target.value }
                          }))}
                          className="w-full sm:w-24 px-3 py-2 bg-[var(--input)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-bordo"
                        />
                        <input
                          type="text"
                          placeholder={t('homeworks.feedback')}
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
                          {t('homeworks.gradeBtn')}
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

    </div>
  );
};

export default Homeworks;
