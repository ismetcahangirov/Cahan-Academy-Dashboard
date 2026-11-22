import { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Plus, Search, Calendar,
  Users, FileText, Trash2, Link, Pen
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { 
  useGetHomeworksQuery, 
  useCreateHomeworkMutation,
  useUpdateHomeworkMutation,
  useDeleteHomeworkMutation,
  useSubmitHomeworkMutation,
  useRemoveHomeworkSubmissionMutation,
  useGradeHomeworkMutation
} from '../../features/homeworks/homeworksApi';
import { useGetGroupsQuery } from '../../features/groups/groupsApi';
import { selectCurrentUser } from '../../features/auth/authSlice';
import Select from '../../components/common/Select';
import Spinner from '../../components/common/Spinner';
import { PageShell, Card, Button, Badge, StatusPill, Modal, FormField, Input, Textarea, EmptyState } from '../../components/ui';
import toast from 'react-hot-toast';
import { useProgressiveList } from '../../lib/useProgressiveList';
import { formatDate, toDateTimeInputValue, fromDateTimeInputValue } from '../../utils/formatDate';

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
  const [removeSubmission, { isLoading: isRemoving }] = useRemoveHomeworkSubmissionMutation();
  const [gradeHomework, { isLoading: isGrading }] = useGradeHomeworkMutation();

  const homeworks = homeworksResponse || [];
  const visibleHomeworks = useProgressiveList(homeworks);
  const groups = groupsResponse?.data || [];
  // The grade modal follows the list, so a saved grade shows up without reopening it
  const gradingHomework = homeworks.find((hw) => hw._id === activeHomework?._id) || activeHomework;

  // Create Modal Form State
  const [createData, setCreateData] = useState({ title: '', description: '', group: '', dueDate: '' });
  
  // Submit Modal Form State — note + multiple links
  const [submitNote, setSubmitNote] = useState('');
  const [submitLinks, setSubmitLinks] = useState(['']);

  // Grade Modal Form State
  const [gradeData, setGradeData] = useState({});

  const [deleteHomework] = useDeleteHomeworkMutation();
  const [updateHomework, { isLoading: isUpdating }] = useUpdateHomeworkMutation();

  const handleCreateHomework = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...createData, dueDate: fromDateTimeInputValue(createData.dueDate) };
      if (activeHomework && isCreateModalOpen && createData._id) {
        // Edit mode
        await updateHomework({ id: createData._id, data: payload }).unwrap();
        toast.success(t('homeworks.updateSuccess') || 'Ev tapşırığı uğurla yeniləndi');
      } else {
        await createHomework(payload).unwrap();
        toast.success(t('homeworks.createSuccess'));
      }
      setIsCreateModalOpen(false);
      setCreateData({ title: '', description: '', group: '', dueDate: '' });
      setActiveHomework(null);
    } catch (error) {
      toast.error(error.data?.message || t('common.error'));
    }
  };

  const handleDeleteHomework = async (id) => {
    if (window.confirm(t('common.deleteConfirm') || 'Silmək istədiyinizə əminsiniz?')) {
      try {
        await deleteHomework(id).unwrap();
        toast.success(t('homeworks.deleteSuccess') || 'Ev tapşırığı uğurla silindi');
      } catch (error) {
        toast.error(error.data?.message || t('common.error'));
      }
    }
  };

  const openEditModal = (hw) => {
    setActiveHomework(hw);
    setCreateData({
      _id: hw._id,
      title: hw.title,
      description: hw.description || '',
      group: typeof hw.group === 'object' ? hw.group._id : hw.group,
      dueDate: toDateTimeInputValue(hw.dueDate)
    });
    setIsCreateModalOpen(true);
  };

  const handleSubmitHomework = async (e) => {
    e.preventDefault();
    if (!activeHomework) return;
    try {
      const validLinks = submitLinks.filter(l => l.trim() !== '');
      if (validLinks.length === 0 && submitNote.trim() === '') {
        toast.error(t('homeworks.submitEmptyError') || 'Zəhmət olmasa link və ya qeyd daxil edin');
        return;
      }
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

  const handleDeleteSubmission = async (id) => {
    if (window.confirm(t('common.deleteConfirm') || 'Silmək istədiyinizə əminsiniz?')) {
      try {
        await removeSubmission(id).unwrap();
        toast.success(t('homeworks.deleteSuccess') || 'Göndəriş silindi');
      } catch (error) {
        toast.error(error.data?.message || t('common.error'));
      }
    }
  };

  const handleGradeSubmission = async (e, studentId) => {
    e.preventDefault();
    if (!activeHomework) return;
    const gData = gradeData[studentId] || {};
    const grade = Number(gData.grade);
    if (gData.grade == null || gData.grade === '' || !Number.isFinite(grade) || grade < 0 || grade > 100) {
      toast.error(t('homeworks.gradeInvalid'));
      return;
    }
    try {
      const payload = {
        studentId,
        grade,
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
    const mySub = hw.submissions?.find(s => s.student?._id === user._id || s.student === user._id);
    if (mySub) {
      setSubmitNote(mySub.note || '');
      setSubmitLinks(mySub.files?.length > 0 ? mySub.files : ['']);
    } else {
      setSubmitNote('');
      setSubmitLinks(['']);
    }
    setIsSubmitModalOpen(true);
  };

  const openGradeModal = (hw) => {
    setActiveHomework(hw);
    const initialGrades = {};
    if (hw.submissions) {
      hw.submissions.forEach(sub => {
        initialGrades[sub.student._id] = {
          grade: sub.grade ?? '',
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

  const isStaff = ['admin', 'teacher'].includes(user.role);

  return (
    <PageShell
      title={t('homeworks.title')}
      subtitle={user.role === 'student' ? t('homeworks.studentSubtitle') : t('homeworks.teacherSubtitle')}
      actions={isStaff && (
        <Button
          icon={Plus}
          onClick={() => {
            setActiveHomework(null);
            setCreateData({ title: '', description: '', group: '', dueDate: '' });
            setIsCreateModalOpen(true);
          }}
        >
          {t('homeworks.addNew')}
        </Button>
      )}
    >
      {/* Filters */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          icon={Search}
          type="text"
          aria-label={t('homeworks.searchPlaceholder')}
          placeholder={t('homeworks.searchPlaceholder')}
        />

        {isStaff && (
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
        <div className="orn-stagger grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {visibleHomeworks.map((hw) => (
            <Card key={hw._id} hover className="group relative flex flex-col p-6">
              <div className="mb-4 flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-3">
                  <FileText size={20} className="shrink-0 text-accent-text" aria-hidden="true" />
                  <h3 className="line-clamp-1 text-[1.2rem] font-semibold text-ink">{hw.title}</h3>
                </div>
                {isStaff && (
                  <div className="flex items-center gap-1 transition-opacity focus-within:opacity-100 group-hover:opacity-100 pointer-fine:opacity-0">
                    <Button variant="ghost" size="sm" iconOnly icon={Pen} onClick={() => openEditModal(hw)} aria-label={t('common.edit')} title={t('common.edit')} />
                    <Button variant="ghost" size="sm" iconOnly icon={Trash2} onClick={() => handleDeleteHomework(hw._id)} aria-label={t('common.delete')} title={t('common.delete')} />
                  </div>
                )}
              </div>

              <p className="mb-6 line-clamp-2 flex-grow text-[0.95rem] text-ink-muted">{hw.description}</p>

              <div className="mb-6 space-y-3 text-[0.95rem] text-ink-muted">
                <div className="flex items-center gap-3">
                  <Users size={16} className="text-accent-text" aria-hidden="true" />
                  <span>{t('common.group')}: {hw.group?.name || t('common.unknown')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar size={16} className="text-accent-text" aria-hidden="true" />
                  <span>{t('homeworks.dueDateLabel')}: <span className="num">{formatDate(hw.dueDate, 'dd MMM yyyy, HH:mm') || '-'}</span></span>
                </div>
                <div className="flex items-center gap-3">
                  <FileText size={16} className="text-accent-text" aria-hidden="true" />
                  <span>{t('homeworks.attachmentCount', { count: hw.files?.length || 0 })}</span>
                </div>
              </div>

              {/* Action Area based on role */}
              <div className="mt-auto flex w-full flex-col justify-end border-t border-line-hair pt-4">
                {user.role === 'student' ? (
                  (() => {
                    const mySub = hw.submissions?.find(s => s.student?._id === user._id || s.student === user._id);
                    const isGraded = mySub?.status === 'graded';

                    if (isGraded) {
                      return (
                        <div className="flex w-full flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <StatusPill status="success">{t('homeworks.graded') || 'Qiymətləndirilib'}</StatusPill>
                            <span className="num font-semibold text-ink">{mySub.grade} / 100</span>
                          </div>
                          {mySub.feedback && (
                            <div className="rounded-[var(--radius-sm)] border border-line-hair bg-surface-2 p-3 text-sm italic text-ink-muted">
                              "{mySub.feedback}"
                            </div>
                          )}
                        </div>
                      );
                    }

                    const isPastDeadline = hw.dueDate ? new Date() > new Date(hw.dueDate) : false;
                    const hasSubmitted = !!mySub;

                    if (isPastDeadline && !hasSubmitted) {
                      return (
                        <div className="flex w-full justify-center">
                          <StatusPill status="error">{t('classworks.deadlinePassed') || 'Deadline bitib'}</StatusPill>
                        </div>
                      );
                    }

                    return hasSubmitted ? (
                      <div className="flex w-full gap-2">
                        <Button variant="outline" className="flex-1" motif={false} onClick={() => openSubmitModal(hw)}>
                          {t('common.edit') || 'Redaktə et'}
                        </Button>
                        <Button variant="ghost" className="flex-1" onClick={() => handleDeleteSubmission(hw._id)} disabled={isRemoving}>
                          {t('common.delete') || 'Sil'}
                        </Button>
                      </div>
                    ) : (
                      <Button variant="outline" block onClick={() => openSubmitModal(hw)}>
                        {t('homeworks.submitHomework')}
                      </Button>
                    );
                  })()
                ) : (
                  <div className="flex w-full items-center justify-between gap-2">
                    <Badge>{t('homeworks.submissionsCount', { count: hw.submissions?.length || 0 })}</Badge>
                    <Button variant="outline" size="sm" onClick={() => openGradeModal(hw)}>
                      {t('homeworks.checkBtn')}
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}

          {homeworks.length === 0 && (
            <Card className="col-span-full">
              <EmptyState sketch="inkwell" title={t('homeworks.noHomeworks')} />
            </Card>
          )}
        </div>
      )}

      {/* CREATE MODAL */}
      <Modal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={createData._id ? t('common.edit') || 'Redaktə et' : t('homeworks.newHomework')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>{t('common.cancel')}</Button>
            <Button type="submit" form="homework-form" loading={isCreating || isUpdating}>
              {createData._id
                ? (isUpdating ? t('common.updating') || 'Yenilənir...' : t('common.update') || 'Yenilə')
                : (isCreating ? t('homeworks.creatingBtn') : t('homeworks.createBtn'))}
            </Button>
          </>
        }
      >
        <form id="homework-form" onSubmit={handleCreateHomework} className="space-y-4">
          <FormField label={t('homeworks.titleLabel')}>
            <Input
              required
              type="text"
              value={createData.title}
              onChange={(e) => setCreateData({ ...createData, title: e.target.value })}
              placeholder={t('homeworks.placeholderTitle')}
            />
          </FormField>

          <FormField label={t('homeworks.descLabel')}>
            <Textarea
              required
              rows={4}
              value={createData.description}
              onChange={(e) => setCreateData({ ...createData, description: e.target.value })}
              placeholder={t('homeworks.placeholderDesc')}
            />
          </FormField>

          <div>
            <span className="field-label">{t('homeworks.groupLabel')}</span>
            <Select
              value={createData.group}
              onChange={(val) => setCreateData({ ...createData, group: val })}
              options={[
                { label: t('homeworks.placeholderGroup'), value: '' },
                ...groups.map(g => ({ label: g.name, value: g._id }))
              ]}
            />
          </div>

          <FormField label={t('homeworks.dueDateLabel')}>
            <Input
              required
              type="datetime-local"
              value={createData.dueDate}
              onChange={(e) => setCreateData({ ...createData, dueDate: e.target.value })}
            />
          </FormField>
        </form>
      </Modal>

      {/* SUBMIT MODAL (STUDENT) */}
      <Modal
        open={Boolean(isSubmitModalOpen && activeHomework)}
        onClose={() => setIsSubmitModalOpen(false)}
        title={t('homeworks.submitHomework')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsSubmitModalOpen(false)}>{t('common.cancel')}</Button>
            <Button type="submit" form="submit-form" loading={isSubmitting}>
              {isSubmitting ? t('homeworks.submittingBtn') : t('homeworks.submitBtn')}
            </Button>
          </>
        }
      >
        {activeHomework && (
          <>
            {/* Task info */}
            <div className="mb-5 rounded-[var(--radius-md)] border border-line bg-surface-2 p-4">
              <h4 className="mb-1 font-semibold text-ink">{activeHomework.title}</h4>
              <p className="text-[0.95rem] text-ink-muted">{activeHomework.description}</p>
              <div className="mt-2 flex items-center gap-1 text-sm text-ink-muted">
                <Calendar size={13} aria-hidden="true" />
                {t('homeworks.dueDateLabel')}: <span className="num">{formatDate(activeHomework.dueDate, 'dd MMM yyyy, HH:mm') || '-'}</span>
              </div>
            </div>

            <form id="submit-form" onSubmit={handleSubmitHomework} className="space-y-4">
              {/* Note / Comment */}
              <FormField label={t('homeworks.noteLabel') || 'Qeyd / Şərh'}>
                <Textarea
                  value={submitNote}
                  onChange={(e) => setSubmitNote(e.target.value)}
                  rows={3}
                  placeholder={t('homeworks.notePlaceholder') || 'Müəllimə qeyd bıraxın...'}
                />
              </FormField>

              {/* File / Link list */}
              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="field-label !mb-0">
                    {t('homeworks.uploadFiles')} ({t('homeworks.linkOrFile') || 'link və ya fayl URL'})
                  </span>
                  <Button type="button" variant="ghost" size="sm" icon={Plus} onClick={addLink}>
                    {t('homeworks.addLink') || 'Link əlavə et'}
                  </Button>
                </div>

                <div className="space-y-2">
                  {submitLinks.map((link, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        icon={Link}
                        className="flex-1"
                        type="text"
                        value={link}
                        onChange={(e) => updateLink(i, e.target.value)}
                        placeholder="https://drive.google.com/..."
                      />
                      {submitLinks.length > 1 && (
                        <Button type="button" variant="ghost" size="sm" iconOnly icon={Trash2} onClick={() => removeLink(i)} aria-label={t('common.delete')} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </form>
          </>
        )}
      </Modal>

      {/* GRADE MODAL (TEACHER) */}
      <Modal
        open={Boolean(isGradeModalOpen && gradingHomework)}
        onClose={() => setIsGradeModalOpen(false)}
        size="lg"
        title={t('homeworks.submissions')}
        entity={gradingHomework?.title}
        subtitle={gradingHomework ? `${t('common.group')}: ${gradingHomework.group?.name ?? ''}` : undefined}
      >
        {gradingHomework && (!gradingHomework.submissions?.length ? (
          <EmptyState compact sketch="inkwell" title={t('homeworks.noSubmissions')} />
        ) : (
          <div className="space-y-4">
            {gradingHomework.submissions.map((sub) => (
              <div key={sub._id} className="rounded-[var(--radius-md)] border border-line p-4">
                <div className="mb-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div>
                    <div className="font-medium text-ink">{sub.student?.name} {sub.student?.surname}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-ink-muted">
                      <span className="num">{formatDate(sub.submittedAt || sub.createdAt || new Date(), 'dd MMM yyyy, HH:mm')}</span>
                      {sub.status === 'late' && (
                        <StatusPill status="late">{t('homeworks.late') || 'Gecikmiş'}</StatusPill>
                      )}
                      {sub.status === 'graded' && (
                        <StatusPill status="success">{t('homeworks.graded') || 'Qiymətləndirilib'} ({sub.grade}/100)</StatusPill>
                      )}
                    </div>
                    {/* Student note */}
                    {sub.note && (
                      <div className="mt-2 border-l-2 border-line-strong pl-2 text-[0.95rem] italic text-ink-muted">
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
                          className="flex items-center gap-1 text-accent-text underline-offset-2 hover:underline"
                        >
                          <FileText size={14} aria-hidden="true" /> {t('homeworks.viewFile') || `Fayl ${fi + 1}`}
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                <form onSubmit={(e) => handleGradeSubmission(e, sub.student?._id)} className="mt-3 flex flex-col gap-3 border-t border-line-hair pt-3 sm:flex-row">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    className="sm:w-28"
                    aria-label={t('homeworks.grade') || 'Xal (0-100)'}
                    placeholder={t('homeworks.grade') || 'Xal (0-100)'}
                    value={gradeData[sub.student?._id]?.grade ?? ''}
                    onChange={(e) => setGradeData(prev => ({
                      ...prev,
                      [sub.student?._id]: { ...prev[sub.student?._id], grade: e.target.value }
                    }))}
                  />
                  <Input
                    type="text"
                    className="flex-1"
                    aria-label={t('homeworks.feedback')}
                    placeholder={t('homeworks.feedback')}
                    value={gradeData[sub.student?._id]?.feedback || ''}
                    onChange={(e) => setGradeData(prev => ({
                      ...prev,
                      [sub.student?._id]: { ...prev[sub.student?._id], feedback: e.target.value }
                    }))}
                  />
                  <Button type="submit" loading={isGrading}>
                    {t('homeworks.gradeBtn')}
                  </Button>
                </form>
              </div>
            ))}
          </div>
        ))}
      </Modal>
    </PageShell>
  );
};

export default Homeworks;
