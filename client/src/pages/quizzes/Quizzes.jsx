import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Plus, Search, Clock, Users, HelpCircle, Trophy, Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  useGetQuizzesQuery,
  useDeleteQuizMutation,
} from '../../features/quizzes/quizzesApi';
import { useGetGroupsQuery } from '../../features/groups/groupsApi';
import { selectCurrentUser } from '../../features/auth/authSlice';
import Select from '../../components/common/Select';
import { Button, Card, EmptyState, Input, PageShell, Skeleton } from '../../components/ui';
import QuizModal from './QuizModal';
import TakeQuizModal from './TakeQuizModal';
import QuizResultsModal from './QuizResultsModal';
import toast from 'react-hot-toast';

const Quizzes = () => {
  const { t } = useTranslation();
  const user = useSelector(selectCurrentUser);

  const [selectedGroup, setSelectedGroup] = useState('');
  const [searchTerm, setSearchTerm]       = useState('');
  const [modalOpen, setModalOpen]         = useState(false);
  const [editingQuiz, setEditingQuiz]     = useState(null);
  const [takingQuizId, setTakingQuizId]   = useState(null);
  const [resultsQuizId, setResultsQuizId] = useState(null);

  const { data: quizzesResponse, isLoading } = useGetQuizzesQuery(selectedGroup || undefined);
  const { data: groupsResponse }             = useGetGroupsQuery();
  const [deleteQuiz]                         = useDeleteQuizMutation();

  const quizzes = (quizzesResponse || []).filter((q) =>
    q.title?.toLowerCase().includes(searchTerm.toLowerCase()),
  );
  const groups = groupsResponse?.data || [];

  const isAdminOrTeacher = ['admin', 'teacher'].includes(user.role);

  const handleOpenCreate = () => {
    setEditingQuiz(null);
    setModalOpen(true);
  };

  const handleEdit = (quiz) => {
    setEditingQuiz(quiz);
    setModalOpen(true);
  };

  const handleDelete = async (quiz) => {
    if (!window.confirm(t('quizzes.deleteConfirm'))) return;
    try {
      await deleteQuiz(quiz._id).unwrap();
      toast.success(t('quizzes.deleteSuccess'));
    } catch {
      toast.error(t('common.error'));
    }
  };

  const meta = (Icon, text) => (
    <div className="flex items-center gap-3 text-[0.95rem] text-ink-muted">
      <Icon size={16} strokeWidth={1.6} aria-hidden="true" className="shrink-0 text-accent-text" />
      <span>{text}</span>
    </div>
  );

  return (
    <PageShell
      title={t('quizzes.title')}
      subtitle={t('quizzes.subtitle')}
      actions={isAdminOrTeacher && (
        <Button id="quiz-add-new-btn" icon={Plus} onClick={handleOpenCreate}>
          {t('quizzes.addNew')}
        </Button>
      )}
    >
      {/* Filters */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          icon={Search}
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          aria-label={t('quizzes.searchPlaceholder')}
          placeholder={t('quizzes.searchPlaceholder')}
        />
        {isAdminOrTeacher && (
          <Select
            value={selectedGroup}
            onChange={setSelectedGroup}
            options={[
              { label: t('exams.allGroups'), value: '' },
              ...groups.map((group) => ({ label: group.name, value: group._id })),
            ]}
          />
        )}
      </div>

      {/* Quiz Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-64 w-full" />)}
        </div>
      ) : quizzes.length === 0 ? (
        <Card variant="paper">
          <EmptyState sketch="notebook" title={t('quizzes.noQuizzes')} />
        </Card>
      ) : (
        <div className="orn-stagger grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz) => (
            <Card key={quiz._id} className="flex h-full flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="line-clamp-2 text-[1.2rem] font-semibold leading-snug text-ink">{quiz.title}</h3>
                {isAdminOrTeacher && (
                  <div className="-mr-1.5 -mt-1 flex shrink-0 items-center">
                    <Button variant="ghost" iconOnly size="sm" icon={Pencil}
                      aria-label={t('quizzes.edit')} onClick={() => handleEdit(quiz)} />
                    <Button variant="ghost" iconOnly size="sm" icon={Trash2}
                      aria-label={t('quizzes.delete')} onClick={() => handleDelete(quiz)} />
                  </div>
                )}
              </div>

              <p className="mb-5 mt-2 line-clamp-2 text-[0.98rem] text-ink-muted">{quiz.description}</p>

              <div className="mb-5 space-y-2.5">
                {meta(Users, `${t('common.group')}: ${quiz.group?.name || t('common.unknown')}`)}
                {meta(Clock, `${t('quizzes.duration')}: ${t('quizzes.minutes', { count: quiz.timeLimit })}`)}
                {meta(HelpCircle, `${t('quizzes.questions')}: ${quiz.questionCount ?? quiz.questions?.length ?? 0}`)}
              </div>

              <div className="mt-auto border-t border-line-hair pt-4">
                {user.role === 'student' ? (
                  quiz.attempts?.length > 0 ? (
                    <Button variant="outline" motif={false} icon={Trophy} block
                      onClick={() => setTakingQuizId(quiz._id)}>
                      {t('quizzes.yourResult')}:{' '}
                      <span className="num">
                        {t('quizzes.scoreOf', { score: quiz.attempts[0].score, total: quiz.attempts[0].totalPoints })}
                      </span>
                    </Button>
                  ) : (
                    <Button icon={Trophy} block onClick={() => setTakingQuizId(quiz._id)}>
                      {t('quizzes.startNow')}
                    </Button>
                  )
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-ink">
                      {t('quizzes.attemptsCount', { count: quiz.attempts?.length || 0 })}
                    </span>
                    <Button variant="outline" onClick={() => setResultsQuizId(quiz._id)}>
                      {t('quizzes.resultsBtn')}
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Quiz Modal */}
      <QuizModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingQuiz(null); }}
        quiz={editingQuiz}
      />

      {takingQuizId && (
        <TakeQuizModal quizId={takingQuizId} onClose={() => setTakingQuizId(null)} />
      )}

      {resultsQuizId && (
        <QuizResultsModal quizId={resultsQuizId} onClose={() => setResultsQuizId(null)} />
      )}
    </PageShell>
  );
};

export default Quizzes;
