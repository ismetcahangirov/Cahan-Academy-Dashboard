import { useState } from 'react';
import { Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useGetQuizByIdQuery } from '../../features/quizzes/quizzesApi';
import Avatar from '../../components/common/Avatar';
import Spinner from '../../components/common/Spinner';
import AnswerReviewModal from '../../components/grading/AnswerReviewModal';
import { Button, EmptyState, Modal, StatusPill, Table } from '../../components/ui';

const QuizResultsModal = ({ quizId, onClose }) => {
  const { t, i18n } = useTranslation();
  const { data: quiz, isLoading } = useGetQuizByIdQuery(quizId, { refetchOnMountOrArgChange: true });
  const [reviewStudentId, setReviewStudentId] = useState(null);

  const attempts = [...(quiz?.attempts || [])].sort((a, b) => (b.score || 0) - (a.score || 0));
  const openQuestionIds = new Set(
    (quiz?.questions || []).filter((q) => q.type === 'open-ended').map((q) => q._id),
  );
  const pendingCount = (attempt) => (attempt.answers || [])
    .filter((a) => openQuestionIds.has(a.questionId) && (a.awardedPoints === null || a.awardedPoints === undefined))
    .length;

  return (
    <>
      <Modal
        open
        // the nested review dialog owns Escape while it is open
        onClose={reviewStudentId ? () => {} : onClose}
        size="xl"
        title={`${t('quizzes.resultsTitle')}: ${quiz?.title || ''}`}
        subtitle={`${quiz?.group?.name || ''} • ${t('quizzes.attemptsCount', { count: attempts.length })}`}
        footer={<Button variant="ghost" onClick={onClose}>{t('quizzes.close')}</Button>}
      >
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : attempts.length === 0 ? (
          <EmptyState compact sketch="cap" title={t('quizzes.noAttempts')} />
        ) : (
          <Table caption={t('quizzes.resultsTitle')} tableClassName="min-w-[600px]">
            <thead>
              <tr>
                <th>{t('quizzes.tableStudent')}</th>
                <th>{t('quizzes.tableScore')}</th>
                <th>{t('quizzes.tableDate')}</th>
                <th>{t('quizzes.reviewTitle')}</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((attempt) => {
                const student = typeof attempt.student === 'object' ? attempt.student : null;
                const studentId = student?._id || attempt.student;
                const pending = pendingCount(attempt);
                const percent = attempt.totalPoints > 0
                  ? Math.round((attempt.score / attempt.totalPoints) * 100)
                  : 0;
                return (
                  <tr key={attempt._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar src={student?.avatar} name={student?.name} className="h-8 w-8 shrink-0" textSize="xs" />
                        <div className="min-w-0">
                          <div className="truncate font-medium text-ink">{student?.name || t('common.unknown')}</div>
                          <div className="truncate text-[0.85rem] text-ink-muted">{student?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="num">
                      {t('quizzes.scoreOf', { score: attempt.score, total: attempt.totalPoints })}
                      <span className="ml-2 text-ink-muted">({percent}%)</span>
                    </td>
                    <td className="time-italic text-ink-muted">
                      {attempt.completedAt
                        ? new Date(attempt.completedAt).toLocaleString(i18n.language, {
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                        })
                        : '—'}
                    </td>
                    <td>
                      <div className="flex flex-col items-start gap-1.5">
                        <Button variant="outline" motif={false} size="sm" icon={Eye}
                          onClick={() => setReviewStudentId(studentId)}>
                          {t('quizzes.viewAnswers')}
                        </Button>
                        {pending > 0 && (
                          <StatusPill status="pending">{t('quizzes.pendingReview', { count: pending })}</StatusPill>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Modal>
      {reviewStudentId && (
        <AnswerReviewModal
          kind="quiz"
          id={quizId}
          studentId={reviewStudentId}
          canGrade
          onClose={() => setReviewStudentId(null)}
        />
      )}
    </>
  );
};

export default QuizResultsModal;
