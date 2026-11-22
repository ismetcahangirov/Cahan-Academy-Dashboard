import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Plus, Search, Clock, Users, HelpCircle, Calendar, Eye, Pencil, Trash2 } from 'lucide-react';
import {
  useGetExamsQuery,
  useDeleteExamMutation
} from '../../features/exams/examsApi';
import { useGetGroupsQuery } from '../../features/groups/groupsApi';
import { selectCurrentUser } from '../../features/auth/authSlice';
import ExamModal from './ExamModal';
import ExamResultsModal from './ExamResultsModal';
import AnswerReviewModal from '../../components/grading/AnswerReviewModal';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Select from '../../components/common/Select';
import { Badge, Button, Card, EmptyState, Input, PageShell, Skeleton, StatusPill } from '../../components/ui';
import { formatDate } from '../../utils/formatDate';

const Exams = () => {
  const { t, i18n } = useTranslation();
  const user = useSelector(selectCurrentUser);
  const [now] = useState(() => Date.now());
  const [selectedGroup, setSelectedGroup] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [examToEdit, setExamToEdit] = useState(null);

  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);
  const [examForResults, setExamForResults] = useState(null);
  const [reviewExamId, setReviewExamId] = useState(null);

  // Students see their answers once the exam (and the server's 2-minute grace) is over
  const answersVisible = (exam) => exam.results?.[0]?.answers?.length > 0
    && now > new Date(exam.date).getTime() + (exam.duration + 2) * 60000;

  const { data: examsResponse, isLoading } = useGetExamsQuery({
    groupId: selectedGroup || undefined
  });
  const { data: groupsResponse } = useGetGroupsQuery();
  const [deleteExam] = useDeleteExamMutation();

  const exams = examsResponse?.data || examsResponse || [];
  const groups = groupsResponse?.data || [];

  const filteredExams = Array.isArray(exams) ? exams.filter(exam =>
    exam.title?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const isStaff = ['admin', 'teacher'].includes(user.role);

  const handleCreate = () => {
    setExamToEdit(null);
    setIsExamModalOpen(true);
  };

  const handleEdit = (exam) => {
    setExamToEdit(exam);
    setIsExamModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm(t('exams.deleteConfirm'))) {
      try {
        await deleteExam(id).unwrap();
        toast.success(t('exams.deleteSuccess'));
      } catch (err) {
        toast.error(err.data?.message || t('students.error'));
      }
    }
  };

  const handleOpenResults = (exam) => {
    setExamForResults(exam);
    setIsResultsModalOpen(true);
  };

  const formatExamType = (type) => {
    const types = {
      midterm: t('exams.midterm'),
      final: t('exams.final'),
      practice: t('exams.practice')
    };
    return types[type] || type;
  };

  const meta = (Icon, text) => (
    <div className="flex items-center gap-3 text-[0.95rem] text-ink-muted">
      <Icon size={16} strokeWidth={1.6} aria-hidden="true" className="shrink-0 text-accent-text" />
      <span>{text}</span>
    </div>
  );

  return (
    <PageShell
      title={t('exams.title')}
      subtitle={t('exams.subtitle')}
      actions={isStaff && (
        <Button icon={Plus} onClick={handleCreate}>{t('exams.addNew')}</Button>
      )}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          icon={Search}
          type="text"
          aria-label={t('exams.searchPlaceholder')}
          placeholder={t('exams.searchPlaceholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {isStaff && (
          <Select
            value={selectedGroup}
            onChange={setSelectedGroup}
            options={[
              { label: t('exams.allGroups'), value: '' },
              ...groups.map(group => ({ label: group.name, value: group._id }))
            ]}
          />
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-72 w-full" />)}
        </div>
      ) : filteredExams.length === 0 ? (
        <Card variant="paper">
          <EmptyState sketch="cap" title={t('exams.noExams')} />
        </Card>
      ) : (
        <div className="orn-stagger grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredExams.map((exam) => (
            <Card key={exam._id} className="flex h-full flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Badge>{formatExamType(exam.type)}</Badge>
                  <h3 className="mt-2 line-clamp-2 text-[1.2rem] font-semibold leading-snug text-ink">{exam.title}</h3>
                </div>
                {isStaff && (
                  <div className="-mr-1.5 -mt-1 flex shrink-0 items-center">
                    <Button variant="ghost" iconOnly size="sm" icon={Pencil}
                      aria-label={t('common.edit')} onClick={() => handleEdit(exam)} />
                    <Button variant="ghost" iconOnly size="sm" icon={Trash2}
                      aria-label={t('common.delete')} onClick={() => handleDelete(exam._id)} />
                  </div>
                )}
              </div>

              <p className="mb-5 mt-2 line-clamp-2 flex-grow text-[0.98rem] text-ink-muted">
                {exam.description || t('exams.noDescription')}
              </p>

              <div className="mb-5 space-y-2.5">
                {meta(Users, `${t('common.group')}: ${exam.group?.name || t('common.unknown')}`)}
                {meta(Calendar, `${t('schedule.date')}: ${formatDate(exam.date, 'd MMM yyyy, HH:mm', i18n.language)}`)}
                {meta(Clock, `${t('exams.duration')}: ${exam.duration} ${t('exams.minute')}`)}
                {meta(HelpCircle, `${t('exams.type')}: ${formatExamType(exam.type)}`)}
              </div>

              <div className="mt-auto border-t border-line-hair pt-4">
                {user.role === 'student' ? (
                  exam.results && exam.results.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      <StatusPill status="success" className="justify-center">
                        {t('exams.result')}: <span className="num">{exam.results[0].score}/100</span>
                      </StatusPill>
                      {answersVisible(exam) && (
                        <Button variant="outline" motif={false} icon={Eye} block
                          onClick={() => setReviewExamId(exam._id)}>
                          {t('exams.myAnswers')}
                        </Button>
                      )}
                    </div>
                  ) : exam.questionCount > 0 && now <= new Date(exam.date).getTime() + exam.duration * 60000 ? (
                    <Button as={Link} to={`/exams/${exam._id}/take`} block>
                      {t('exams.takeExam')}
                    </Button>
                  ) : (
                    <StatusPill status="absent" className="w-full justify-center">{t('exams.noResult')}</StatusPill>
                  )
                ) : (
                  <Button variant="outline" block onClick={() => handleOpenResults(exam)}>
                    {t('exams.manageResults')} ({exam.results?.length || 0})
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modals */}
      {isExamModalOpen && (
        <ExamModal
          isOpen={isExamModalOpen}
          onClose={() => setIsExamModalOpen(false)}
          exam={examToEdit}
        />
      )}

      {isResultsModalOpen && examForResults && (
        <ExamResultsModal
          isOpen={isResultsModalOpen}
          onClose={() => setIsResultsModalOpen(false)}
          exam={examForResults}
        />
      )}

      {reviewExamId && (
        <AnswerReviewModal
          kind="exam"
          id={reviewExamId}
          studentId={user._id}
          onClose={() => setReviewExamId(null)}
        />
      )}
    </PageShell>
  );
};

export default Exams;
