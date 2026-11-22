import { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Plus, Search, Calendar, Users, Trash2, BookOpen, Clock, Link, Pen
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
import { PageShell, Card, Button, StatusPill, Modal, FormField, Input, Textarea, EmptyState } from '../../components/ui';
import Select from '../../components/common/Select';
import Spinner from '../../components/common/Spinner';
import { useProgressiveList } from '../../lib/useProgressiveList';
import { formatDate, toDateTimeInputValue, fromDateTimeInputValue } from '../../utils/formatDate';

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
  // The grade modal follows the list, so a saved grade shows up without reopening it
  const gradingClasswork = classworks.find((cw) => cw._id === activeClasswork?._id) || activeClasswork;

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
  const visibleClassworks = useProgressiveList(filtered);

  const handleCreateClasswork = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...createData, dueDate: fromDateTimeInputValue(createData.dueDate) };
      if (activeClasswork && isCreateModalOpen && createData._id) {
        await updateClasswork({ id: createData._id, data: payload }).unwrap();
        toast.success(t('classworks.updateSuccess') || 'Sinif işi uğurla yeniləndi');
      } else {
        await createClasswork(payload).unwrap();
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
      dueDate: toDateTimeInputValue(cw.dueDate)
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
    const gData = gradeData[studentId] || {};
    const grade = Number(gData.grade);
    if (gData.grade == null || gData.grade === '' || !Number.isFinite(grade) || grade < 0 || grade > 100) {
      toast.error(t('classworks.gradeInvalid'));
      return;
    }
    try {
      const payload = {
        studentId,
        grade,
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
          grade: sub.grade ?? '',
          feedback: sub.feedback || ''
        };
      });
    }
    setGradeData(initialGrades);
    setIsGradeModalOpen(true);
  };

  const loc = { locale: dateLocales[i18n.language] || az };

  return (
    <PageShell
      title={t('classworks.title')}
      subtitle={t('classworks.subtitle')}
      actions={isAdminOrTeacher && (
        <Button
          icon={Plus}
          onClick={() => {
            setActiveClasswork(null);
            setCreateData({ title: '', description: '', group: '', dueDate: '' });
            setIsCreateModalOpen(true);
          }}
        >
          {t('classworks.addNew')}
        </Button>
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <Input
            icon={Search}
            type="text"
            aria-label={t('classworks.searchPlaceholder')}
            placeholder={t('classworks.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
        <Card>
          <EmptyState sketch="notebook" title={t('classworks.noClassworks')} />
        </Card>
      ) : (
        <div className="orn-stagger grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {visibleClassworks.map((cw) => {
            const total = cw.group?.students?.length || 0;
            const allIn = cw.submissions?.length === total && total > 0;
            return (
              <Card key={cw._id} hover className="group relative flex flex-col p-5">
                <div className="mb-4 flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-3">
                    <BookOpen size={20} className="shrink-0 text-accent-text" aria-hidden="true" />
                    <h3 className="line-clamp-1 text-[1.2rem] font-semibold text-ink">{cw.title}</h3>
                  </div>
                  {isAdminOrTeacher && (
                    <div className="flex items-center gap-1 transition-opacity focus-within:opacity-100 group-hover:opacity-100 pointer-fine:opacity-0">
                      <Button variant="ghost" size="sm" iconOnly icon={Pen} onClick={() => openEditModal(cw)} aria-label={t('common.edit')} title={t('common.edit')} />
                      <Button variant="ghost" size="sm" iconOnly icon={Trash2} onClick={() => handleDeleteClasswork(cw._id)} aria-label={t('common.delete')} title={t('common.delete')} />
                    </div>
                  )}
                </div>

                <p className="mb-4 line-clamp-2 flex-1 text-[0.95rem] text-ink-muted">{cw.description}</p>

                <div className="mb-4 space-y-2 border-t border-line-hair pt-3 text-[0.95rem] text-ink-muted">
                  <div className="flex items-center gap-2">
                    <Users size={14} className="shrink-0 text-accent-text" aria-hidden="true" />
                    <span>{t('common.group')}: {cw.group?.name || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="shrink-0 text-accent-text" aria-hidden="true" />
                    <span className="num">{cw.date ? format(new Date(cw.date), 'd MMM yyyy', loc) : '—'}</span>
                  </div>
                  {cw.dueDate && (
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="shrink-0 text-accent-text" aria-hidden="true" />
                      <span>{t('classworks.dueDate')}: <span className="num font-medium text-ink">{format(new Date(cw.dueDate), 'd MMM yyyy, HH:mm', loc)}</span></span>
                    </div>
                  )}
                  {isAdminOrTeacher && (
                    <div className="flex items-center gap-2">
                      <StatusPill status={allIn ? 'success' : 'partial'}>
                        {t('classworks.submissionsCount', { count: cw.submissions?.length || 0, total })}
                      </StatusPill>
                    </div>
                  )}
                </div>

                <div className="mt-auto flex w-full flex-col justify-end border-t border-line-hair pt-3">
                  {user.role === 'student' ? (
                    (() => {
                      const mySub = cw.submissions?.find(s => s.student?._id === user._id || s.student === user._id);
                      const isGraded = mySub?.status === 'graded';

                      if (isGraded) {
                        return (
                          <div className="flex w-full flex-col gap-2">
                            <div className="flex items-center justify-between">
                              <StatusPill status="success">{t('classworks.graded') || 'Qiymətləndirilib'}</StatusPill>
                              <span className="num font-semibold text-ink">{mySub.grade} / 100</span>
                            </div>
                            {mySub.feedback && (
                              <div className="rounded-[var(--radius-sm)] border border-line-hair bg-surface-2 p-2.5 text-sm italic text-ink-muted">
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
                          <div className="flex w-full justify-center">
                            <StatusPill status="error">{t('classworks.deadlinePassed') || 'Deadline bitib'}</StatusPill>
                          </div>
                        );
                      }

                      return hasSubmitted ? (
                        <div className="flex w-full gap-2">
                          <Button variant="outline" className="flex-1" motif={false} onClick={() => openSubmitModal(cw)}>
                            {t('common.edit') || 'Redaktə et'}
                          </Button>
                          <Button variant="ghost" className="flex-1" onClick={() => handleDeleteSubmission(cw._id)} disabled={isRemoving}>
                            {t('common.delete') || 'Sil'}
                          </Button>
                        </div>
                      ) : (
                        <Button variant="outline" block onClick={() => openSubmitModal(cw)}>
                          {t('classworks.submitClasswork')}
                        </Button>
                      );
                    })()
                  ) : (
                    <Button variant="outline" block onClick={() => openGradeModal(cw)}>
                      {t('classworks.submissions')}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* CREATE MODAL */}
      <Modal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={createData._id ? t('common.edit') || 'Redaktə et' : t('classworks.newClasswork')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>{t('common.cancel')}</Button>
            <Button type="submit" form="classwork-form" loading={isCreating || isUpdating}>
              {createData._id
                ? (isUpdating ? t('common.updating') || 'Yenilənir...' : t('common.update') || 'Yenilə')
                : (isCreating ? t('classworks.creatingBtn') : t('classworks.createBtn'))}
            </Button>
          </>
        }
      >
        <form id="classwork-form" onSubmit={handleCreateClasswork} className="space-y-4">
          <FormField label={t('classworks.titleLabel')} required>
            <Input name="title" value={createData.title} onChange={(e) => setCreateData(p => ({...p, title: e.target.value}))} required
              placeholder={t('classworks.placeholderTitle')} />
          </FormField>
          <div>
            <span className="field-label">{t('classworks.groupLabel')} *</span>
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
          <FormField label={t('classworks.descLabel')} required>
            <Textarea value={createData.description} onChange={(e) => setCreateData(p => ({...p, description: e.target.value}))} required rows={3}
              placeholder={t('classworks.placeholderDesc')} />
          </FormField>
          <FormField label={t('classworks.dueDateLabel')} required>
            <Input type="datetime-local" value={createData.dueDate} onChange={(e) => setCreateData(p => ({...p, dueDate: e.target.value}))} required />
          </FormField>
        </form>
      </Modal>

      {/* SUBMIT MODAL (STUDENT) */}
      <Modal
        open={Boolean(isSubmitModalOpen && activeClasswork)}
        onClose={() => setIsSubmitModalOpen(false)}
        title={t('classworks.submitClasswork')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsSubmitModalOpen(false)}>{t('common.cancel')}</Button>
            <Button type="submit" form="cw-submit-form" loading={isSubmitting}>
              {isSubmitting ? t('classworks.submittingBtn') : t('classworks.submitBtn')}
            </Button>
          </>
        }
      >
        {activeClasswork && (
          <>
            <div className="mb-5 rounded-[var(--radius-md)] border border-line bg-surface-2 p-4">
              <h4 className="mb-1 font-semibold text-ink">{activeClasswork.title}</h4>
              <p className="text-[0.95rem] text-ink-muted">{activeClasswork.description}</p>
            </div>

            <form id="cw-submit-form" onSubmit={handleSubmitClasswork} className="space-y-4">
              <FormField label={t('classworks.noteLabel') || 'Qeyd / Şərh'}>
                <Textarea
                  value={submitNote}
                  onChange={(e) => setSubmitNote(e.target.value)}
                  rows={3}
                  placeholder={t('classworks.notePlaceholder') || 'Müəllimə qeyd buraxın...'}
                />
              </FormField>

              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="field-label !mb-0">{t('classworks.uploadFiles')}</span>
                  <Button type="button" variant="ghost" size="sm" icon={Plus} onClick={addLink}>
                    {t('classworks.addLink') || 'Link əlavə et'}
                  </Button>
                </div>
                <div className="space-y-2">
                  {submitLinks.map((link, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        icon={Link}
                        wrapperClassName="flex-1"
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
        open={Boolean(isGradeModalOpen && gradingClasswork)}
        onClose={() => setIsGradeModalOpen(false)}
        size="lg"
        title={gradingClasswork ? `${gradingClasswork.title} - ${t('classworks.submissions')}` : ''}
        subtitle={gradingClasswork ? `${t('common.group')}: ${gradingClasswork.group?.name ?? ''}` : undefined}
      >
        {gradingClasswork && (!gradingClasswork.submissions?.length ? (
          <EmptyState compact sketch="notebook" title={t('classworks.noSubmissions')} />
        ) : (
          <div className="space-y-4">
            {gradingClasswork.submissions.map((sub) => (
              <div key={sub._id} className="rounded-[var(--radius-md)] border border-line p-4">
                <div className="mb-4">
                  <div className="font-medium text-ink">{sub.student?.name} {sub.student?.surname}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-muted">
                    <span className="num">{formatDate(sub.submittedAt || sub.createdAt || new Date(), 'dd MMM yyyy, HH:mm')}</span>
                    {sub.status === 'late' && (
                      <StatusPill status="late">{t('homeworks.late') || 'Gecikmiş'}</StatusPill>
                    )}
                    {sub.status === 'graded' && (
                      <StatusPill status="success">{t('classworks.graded') || 'Qiymətləndirilib'} ({sub.grade}/100)</StatusPill>
                    )}
                  </div>
                </div>

                {/* Student's Note */}
                {sub.note && (
                  <div className="mb-4 rounded-[var(--radius-sm)] border border-line-hair bg-surface-2 p-3">
                    <p className="sc mb-1 text-[0.8rem] text-ink-muted">{t('classworks.noteLabel') || 'Qeyd / Şərh'}:</p>
                    <p className="whitespace-pre-wrap text-ink">{sub.note}</p>
                  </div>
                )}

                {/* Submitted Links */}
                {sub.files && sub.files.length > 0 && (
                  <div className="mb-4 space-y-2 rounded-[var(--radius-sm)] border border-line-hair bg-surface-2 p-3">
                    <p className="sc mb-1 text-[0.8rem] text-ink-muted">
                      {sub.files.length} {t('classworks.linkOrFile') || 'link'}
                    </p>
                    <div className="space-y-1">
                      {sub.files.map((file, idx) => (
                        <a
                          key={idx}
                          href={file}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 py-1 text-accent-text underline-offset-2 hover:underline"
                        >
                          <Link size={14} className="shrink-0" aria-hidden="true" />
                          <span className="truncate">{file}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <form onSubmit={(e) => handleGradeSubmission(e, sub.student?._id)} className="flex flex-col gap-3 sm:flex-row">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    className="sm:w-28"
                    aria-label={t('classworks.grade') || 'Xal (0-100)'}
                    placeholder={t('classworks.grade') || 'Xal (0-100)'}
                    value={gradeData[sub.student?._id]?.grade ?? ''}
                    onChange={(e) => setGradeData(prev => ({
                      ...prev,
                      [sub.student?._id]: { ...prev[sub.student?._id], grade: e.target.value }
                    }))}
                  />
                  <Input
                    type="text"
                    className="flex-1"
                    aria-label={t('classworks.feedback')}
                    placeholder={t('classworks.feedback')}
                    value={gradeData[sub.student?._id]?.feedback || ''}
                    onChange={(e) => setGradeData(prev => ({
                      ...prev,
                      [sub.student?._id]: { ...prev[sub.student?._id], feedback: e.target.value }
                    }))}
                  />
                  <Button type="submit" loading={isGrading}>
                    {t('classworks.gradeBtn')}
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

export default Classworks;
