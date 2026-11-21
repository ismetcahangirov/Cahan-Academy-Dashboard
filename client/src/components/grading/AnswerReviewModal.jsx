import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useGetQuizAttemptQuery, useGradeQuizAttemptMutation } from '../../features/quizzes/quizzesApi';
import { useGetExamResultAnswersQuery, useGradeExamResultMutation } from '../../features/exams/examsApi';
import Spinner from '../common/Spinner';

// One student's submitted answers for a quiz or an exam. With canGrade the teacher
// can give points to open-ended answers; students get a read-only view.
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
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${a.isCorrect ? 'text-green-500' : 'text-red-400'}`}>
          {a.isCorrect ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
          {a.isCorrect ? t(`${ns}.answerCorrect`) : t(`${ns}.answerWrong`)}
          <span className="text-[var(--muted-foreground)]">
            · {t(`${ns}.awardedOf`, { awarded: a.awardedPoints ?? 0, points: a.points })}
          </span>
        </span>
      );
    }
    if (canGrade) {
      return (
        <label className="inline-flex flex-wrap items-center gap-2 text-xs text-[var(--muted-foreground)]">
          {t(`${ns}.points`)}
          <input
            type="number"
            min="0"
            max={a.points}
            step="0.5"
            value={valueFor(a)}
            onChange={(e) => setEdits((prev) => ({ ...prev, [a.questionId]: e.target.value }))}
            className="w-20 bg-[var(--input)] border border-[var(--border)] rounded-lg px-2 py-1 text-sm text-[var(--foreground)] text-center focus:outline-none focus:border-bordo transition-colors"
          />
          <span>/ {a.points}</span>
          {a.awardedPoints === null && (
            <span className="text-amber-500">{t(`${ns}.awaitingReview`)}</span>
          )}
        </label>
      );
    }
    return a.awardedPoints === null ? (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-500">
        <Clock size={14} />
        {t(`${ns}.awaitingReview`)}
      </span>
    ) : (
      <span className="text-xs text-[var(--muted-foreground)]">
        {t(`${ns}.awardedOf`, { awarded: a.awardedPoints, points: a.points })}
      </span>
    );
  };

  const renderBody = () => {
    if (isLoading) return <div className="flex justify-center py-12"><Spinner /></div>;
    if (isError || !review) {
      return (
        <p className="text-center py-12 text-[var(--muted-foreground)]">
          {error?.data?.message || t('common.error')}
        </p>
      );
    }
    if (answers.length === 0) {
      return <p className="text-center py-12 text-[var(--muted-foreground)]">{t(`${ns}.noOnlineAnswers`)}</p>;
    }
    return (
      <div className="space-y-4">
        {answers.map((a, i) => {
          const given = answerLabel(a);
          const correct = correctLabel(a);
          return (
            <div key={a.questionId} className="bg-[var(--muted)]/20 border border-[var(--border)] rounded-xl p-4 space-y-3">
              <p className="text-sm font-medium text-[var(--foreground)] whitespace-pre-wrap">
                <span className="text-bordo font-bold mr-2">{i + 1}.</span>
                {a.text}
                <span className="ml-2 text-xs text-[var(--muted-foreground)]">
                  ({t(`${ns}.pointsCount`, { count: a.points })})
                </span>
              </p>
              <div className="text-sm">
                <p className="text-xs text-[var(--muted-foreground)] mb-1">{t(`${ns}.studentAnswer`)}</p>
                {given === null ? (
                  <p className="italic text-[var(--muted-foreground)]">{t(`${ns}.noAnswer`)}</p>
                ) : (
                  <p className="text-[var(--foreground)] whitespace-pre-wrap break-words">{given}</p>
                )}
              </div>
              {correct !== null && (
                <p className="text-xs text-[var(--muted-foreground)]">
                  {t(`${ns}.correctAnswer`)}: <span className="text-[var(--foreground)]">{correct}</span>
                </p>
              )}
              <div>{renderStatus(a)}</div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-2xl bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
        >
          <div className="flex items-start justify-between gap-4 p-5 border-b border-[var(--border)]">
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-[var(--foreground)] truncate">
                {t(`${ns}.reviewTitle`)}{review?.student?.name ? `: ${review.student.name}` : ''}
              </h2>
              {review && (
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--muted-foreground)] mt-1">
                  <span>
                    {t(`${ns}.reviewSummary`, {
                      earned: review.earnedPoints,
                      total: review.totalPoints,
                      percent: review.percent,
                    })}
                  </span>
                  {review.pendingCount > 0 && (
                    <span className="text-amber-500">{t(`${ns}.pendingReview`, { count: review.pendingCount })}</span>
                  )}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              aria-label={t(`${ns}.close`)}
              className="p-2 text-[var(--muted-foreground)]/40 hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-5">{renderBody()}</div>

          <div className="flex gap-3 p-5 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-[var(--muted)]/50 hover:bg-[var(--muted)] text-[var(--foreground)] rounded-xl transition-colors font-medium"
            >
              {t(`${ns}.close`)}
            </button>
            {canGrade && openAnswers.length > 0 && (
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 py-2.5 bg-bordo hover:bg-bordo/90 text-white rounded-xl transition-colors font-medium disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {isSaving ? <Spinner size="sm" color="white" /> : (
                  <>
                    <Save size={18} />
                    <span>{t(`${ns}.saveGrades`)}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AnswerReviewModal;
