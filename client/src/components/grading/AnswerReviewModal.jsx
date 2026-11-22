import { useState } from 'react';
import { Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useGetQuizAttemptQuery, useGradeQuizAttemptMutation } from '../../features/quizzes/quizzesApi';
import { useGetExamResultAnswersQuery, useGradeExamResultMutation } from '../../features/exams/examsApi';
import { Button, Input, Modal, StatusPill } from '../ui';
import Spinner from '../common/Spinner';

// One student's submitted answers for a quiz or an exam. With canGrade the teacher
// can give points to open-ended answers; students get a read-only view.
// Correct / wrong use the non-colour status system: filled + check vs outline + cross.
const AnswerReviewModal = ({ kind, id, studentId, canGrade = false, onClose }) => {
  const { t } = useTranslation();
  const ns = kind === 'quiz' ? 'quizzes' : 'exams';
  const args = { id, studentId };

  const quizReview = useGetQuizAttemptQuery(args, { skip: kind !== 'quiz', refetchOnMountOrArgChange: true });
  const examReview = useGetExamResultAnswersQuery(args, { skip: kind !== 'exam', refetchOnMountOrArgChange: true });
  const [gradeQuiz, { isLoading: isSavingQuiz }] = useGradeQuizAttemptMutation();
  const [gradeExam, { isLoading: isSavingExam }] = useGradeExamResultMutation();
  const { data: review, isLoading, isError, error } = kind === 'quiz' ? quizReview : examReview;
  const isSaving = isSavingQuiz || isSavingExam;

  const [edits, setEdits] = useState({});

  const answers = review?.answers || [];
  const openAnswers = answers.filter((a) => !a.autoGraded);
  const valueFor = (a) => edits[a.questionId] ?? (a.awardedPoints ?? '');

  const answerLabel = (a) => {
    if (a.answer === '' || a.answer === undefined || a.answer === null) return null;
    if (a.type === 'true-false') return a.answer === 'true' ? t(`${ns}.true`) : t(`${ns}.false`);
    if (a.type === 'multiple-choice') return a.options?.[Number(a.answer)] ?? a.answer;
    return a.answer;
  };

  const correctLabel = (a) => {
    if (!a.autoGraded || a.correctAnswer === undefined || a.correctAnswer === '') return null;
    return answerLabel({ ...a, answer: a.correctAnswer });
  };

  const handleSave = async () => {
    const grades = [];
    for (const a of openAnswers) {
      const raw = valueFor(a);
      if (raw === '') continue;
      const points = Number(raw);
      if (!Number.isFinite(points) || points < 0 || points > a.points) {
        toast.error(t(`${ns}.pointsRange`, { max: a.points }));
        return;
      }
      grades.push({ questionId: a.questionId, points });
    }
    if (grades.length === 0) {
      toast.error(t(`${ns}.noGradesEntered`));
      return;
    }
    try {
      const save = kind === 'quiz' ? gradeQuiz : gradeExam;
      await save({ id, studentId, grades }).unwrap();
      setEdits({});
      toast.success(t(`${ns}.gradesSaved`));
    } catch (err) {
      toast.error(err.data?.message || t('common.error'));
    }
  };

  const renderStatus = (a) => {
    if (a.autoGraded) {
      return (
        <span className="inline-flex flex-wrap items-center gap-2">
          <StatusPill status={a.isCorrect ? 'success' : 'absent'}>
            {a.isCorrect ? t(`${ns}.answerCorrect`) : t(`${ns}.answerWrong`)}
          </StatusPill>
          <span className="num text-[0.9rem] text-ink-muted">
            {t(`${ns}.awardedOf`, { awarded: a.awardedPoints ?? 0, points: a.points })}
          </span>
        </span>
      );
    }
    if (canGrade) {
      return (
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 text-[0.95rem] text-ink-muted">
            <span className="sc text-[0.8rem]">{t(`${ns}.points`)}</span>
            <Input
              type="number"
              min="0"
              max={a.points}
              step="0.5"
              value={valueFor(a)}
              onChange={(e) => setEdits((prev) => ({ ...prev, [a.questionId]: e.target.value }))}
              className="num w-24 text-center"
            />
            <span className="num">/ {a.points}</span>
          </label>
          {a.awardedPoints === null && (
            <StatusPill status="pending">{t(`${ns}.awaitingReview`)}</StatusPill>
          )}
        </div>
      );
    }
    return a.awardedPoints === null ? (
      <StatusPill status="pending">{t(`${ns}.awaitingReview`)}</StatusPill>
    ) : (
      <span className="num text-[0.95rem] text-ink-muted">
        {t(`${ns}.awardedOf`, { awarded: a.awardedPoints, points: a.points })}
      </span>
    );
  };

  const renderBody = () => {
    if (isLoading) return <div className="flex justify-center py-12"><Spinner /></div>;
    if (isError || !review) {
      return (
        <p className="py-12 text-center text-ink-muted">
          {error?.data?.message || t('common.error')}
        </p>
      );
    }
    if (answers.length === 0) {
      return <p className="py-12 text-center text-ink-muted">{t(`${ns}.noOnlineAnswers`)}</p>;
    }
    return (
      <div className="space-y-4">
        {answers.map((a, i) => {
          const given = answerLabel(a);
          const correct = correctLabel(a);
          return (
            <div key={a.questionId} className="card-paper space-y-3 p-4">
              <p className="flex items-baseline gap-3 text-[1.05rem] font-medium text-ink">
                <span className="time-italic w-7 shrink-0 text-right text-[1.5rem] leading-none text-accent-text dark:text-ink">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 whitespace-pre-wrap break-words">
                  {a.text}
                  <span className="num ml-2 text-[0.85rem] font-normal text-ink-muted">
                    ({t(`${ns}.pointsCount`, { count: a.points })})
                  </span>
                </span>
              </p>
              <div className="pl-10">
                <p className="sc mb-1 text-[0.78rem] text-ink-muted">{t(`${ns}.studentAnswer`)}</p>
                {given === null ? (
                  <p className="italic text-ink-muted">{t(`${ns}.noAnswer`)}</p>
                ) : (
                  <p className="whitespace-pre-wrap break-words text-ink">{given}</p>
                )}
                {correct !== null && (
                  <p className="mt-2 text-[0.95rem] text-ink-muted">
                    {t(`${ns}.correctAnswer`)}: <span className="font-semibold text-ink">{correct}</span>
                  </p>
                )}
                <div className="mt-3">{renderStatus(a)}</div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const subtitle = review ? (
    <span className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
      <span className="num">
        {t(`${ns}.reviewSummary`, {
          earned: review.earnedPoints,
          total: review.totalPoints,
          percent: review.percent,
        })}
      </span>
      {review.pendingCount > 0 && (
        <StatusPill status="pending">{t(`${ns}.pendingReview`, { count: review.pendingCount })}</StatusPill>
      )}
    </span>
  ) : undefined;

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={`${t(`${ns}.reviewTitle`)}${review?.student?.name ? `: ${review.student.name}` : ''}`}
      subtitle={subtitle}
      footer={(
        <>
          <Button variant="ghost" onClick={onClose}>{t(`${ns}.close`)}</Button>
          {canGrade && openAnswers.length > 0 && (
            <Button icon={Save} onClick={handleSave} loading={isSaving}>
              {t(`${ns}.saveGrades`)}
            </Button>
          )}
        </>
      )}
    >
      {renderBody()}
    </Modal>
  );
};

export default AnswerReviewModal;
