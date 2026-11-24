import { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Clock, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  useGetQuizByIdQuery,
  useStartQuizMutation,
  useSubmitQuizMutation,
} from '../../features/quizzes/quizzesApi';
import { selectCurrentUser } from '../../features/auth/authSlice';
import Spinner from '../../components/common/Spinner';
import AnswerReviewModal from '../../components/grading/AnswerReviewModal';
import { Button, Modal, StatusPill, Textarea } from '../../components/ui';
import { ChoiceList, ExamClock, QuestionHeading, ScoreSeal } from '../exams/assessment/AssessmentParts';

const TakeQuizModal = ({ quizId, onClose }) => {
  const { t } = useTranslation();
  const user = useSelector(selectCurrentUser);
  const { data: quiz, isLoading, isError } = useGetQuizByIdQuery(quizId, { refetchOnMountOrArgChange: true });
  const [startQuiz, { isError: startFailed }] = useStartQuizMutation();
  const [submitQuiz, { isLoading: isSubmitting }] = useSubmitQuizMutation();

  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  // { questions, deadline } from the server; deadline is local ms, null without a time limit
  const [session, setSession] = useState(null);
  const [now, setNow] = useState(() => Date.now());
  const [showAnswers, setShowAnswers] = useState(false);
  const startedRef = useRef(false);
  const submittedRef = useRef(false);
  const autoSubmittedRef = useRef(false);

  const attempt = result || quiz?.attempts?.[0] || null;
  const questions = session?.questions || quiz?.questions || [];
  const canStart = Boolean(quiz) && !attempt && quiz.questionCount > 0;
  const deadline = session?.deadline ?? null;
  const inProgress = Boolean(session) && !attempt && questions.length > 0;
  const timeUp = inProgress && deadline !== null && now >= deadline;

  // The server keeps the first start time, so reopening the quiz resumes the same timer.
  useEffect(() => {
    if (!canStart || startedRef.current) return;
    startedRef.current = true;
    startQuiz(quizId).unwrap()
      .then((data) => {
        const remaining = data.endsAt
          ? new Date(data.endsAt).getTime() - new Date(data.serverNow).getTime()
          : null;
        setSession({
          questions: data.questions || [],
          deadline: remaining === null ? null : Date.now() + remaining,
        });
      })
      .catch((error) => toast.error(error.data?.message || t('common.error')));
  }, [canStart, quizId, startQuiz, t]);

  useEffect(() => {
    if (!inProgress) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [inProgress]);

  const submit = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    try {
      const response = await submitQuiz({ id: quizId, data: { answers } }).unwrap();
      setResult(response.data);
      toast.success(t('quizzes.submitSuccess'));
    } catch (error) {
      submittedRef.current = false;
      toast.error(error.data?.message || t('common.error'));
    }
  }, [answers, quizId, submitQuiz, t]);

  useEffect(() => {
    if (timeUp && !autoSubmittedRef.current) {
      autoSubmittedRef.current = true;
      submit();
    }
  }, [timeUp, submit]);

  const handleSubmit = () => {
    const answered = Object.values(answers).filter((v) => String(v).trim() !== '').length;
    if (answered < questions.length && !window.confirm(t('quizzes.incompleteWarning'))) return;
    submit();
  };

  const handleClose = () => {
    if (inProgress && Object.keys(answers).length > 0 && !window.confirm(t('quizzes.leaveWarning'))) return;
    onClose();
  };

  const setAnswer = (questionId, value) => setAnswers((prev) => ({ ...prev, [questionId]: value }));

  const optionsFor = (q) => (q.type === 'true-false'
    ? [{ value: 'true', label: t('quizzes.true') }, { value: 'false', label: t('quizzes.false') }]
    : (q.options || [])
      .map((label, index) => ({ value: String(index), label }))
      .filter((opt) => opt.label && opt.label.trim() !== ''));

  const renderBody = () => {
    if (isLoading) {
      return <div className="flex justify-center py-12"><Spinner /></div>;
    }
    if (isError || !quiz) {
      return <p className="py-12 text-center text-ink-muted">{t('quizzes.notFound')}</p>;
    }
    if (attempt) {
      const correct = (attempt.answers || []).filter((a) => a.isCorrect).length;
      const pending = (attempt.answers || [])
        .filter((a) => a.isCorrect === null && (a.awardedPoints === null || a.awardedPoints === undefined))
        .length;
      const percent = attempt.totalPoints > 0 ? Math.round((attempt.score / attempt.totalPoints) * 100) : 0;
      return (
        <ScoreSeal
          eyebrow={t('quizzes.yourResult')}
          score={attempt.score}
          total={attempt.totalPoints}
          percent={percent}
          caption={t('quizzes.correctCount', { correct, count: questions.length })}
        >
          {pending > 0 && (
            <StatusPill status="pending" className="mt-3">{t('quizzes.pendingReview', { count: pending })}</StatusPill>
          )}
          <Button variant="outline" motif={false} icon={Eye} className="mt-5" onClick={() => setShowAnswers(true)}>
            {t('quizzes.myAnswers')}
          </Button>
        </ScoreSeal>
      );
    }
    if (!quiz.questionCount) {
      return <p className="py-12 text-center text-ink-muted">{t('quizzes.noQuestions')}</p>;
    }
    if (!session) {
      return startFailed
        ? <p className="py-12 text-center text-ink-muted">{t('common.error')}</p>
        : <div className="flex justify-center py-12"><Spinner /></div>;
    }
    if (timeUp) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center text-ink-muted">
          <Clock size={40} strokeWidth={1.4} aria-hidden="true" className="mb-3 text-accent-text" />
          <p>{t('quizzes.timeUp')}</p>
          {isSubmitting && <Spinner size="sm" className="mt-4" />}
        </div>
      );
    }
    return (
      <div className="space-y-4">
        {deadline !== null && (
          <div className="sticky top-0 z-10 -mx-1 flex justify-center bg-surface px-1 pb-3 pt-1">
            <ExamClock remainingMs={deadline - now} label={t('quizzes.timeLeft')} />
          </div>
        )}
        <div className="theme-light paper space-y-7 rounded-[var(--radius-lg)] border border-line p-5 sm:p-6">
          {questions.map((q, i) => (
            <fieldset key={q._id} className="min-w-0 space-y-3 border-0 p-0">
              <legend className="w-full">
                <QuestionHeading
                  index={i + 1}
                  text={q.text}
                  extra={`(${t('quizzes.pointsCount', { count: q.points || 1 })})`}
                />
              </legend>
              {q.type === 'open-ended' ? (
                <Textarea
                  value={answers[q._id] || ''}
                  onChange={(e) => setAnswer(q._id, e.target.value)}
                  rows={3}
                  aria-label={q.text}
                  placeholder={t('quizzes.answerPlaceholder')}
                />
              ) : (
                <ChoiceList
                  name={`quiz-question-${q._id}`}
                  options={optionsFor(q)}
                  value={answers[q._id]}
                  onChange={(v) => setAnswer(q._id, v)}
                />
              )}
            </fieldset>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <Modal
        open
        // the nested review dialog owns Escape while it is open
        onClose={showAnswers ? () => {} : handleClose}
        size="lg"
        title={t('quizzes.takeTitle')}
        entity={quiz?.title}
        footer={(
          <>
            <Button variant="ghost" onClick={handleClose}>{t('quizzes.close')}</Button>
            {inProgress && (
              <Button onClick={handleSubmit} loading={isSubmitting}>{t('quizzes.finish')}</Button>
            )}
          </>
        )}
      >
        {renderBody()}
      </Modal>
      {showAnswers && user?._id && (
        <AnswerReviewModal kind="quiz" id={quizId} studentId={user._id} onClose={() => setShowAnswers(false)} />
      )}
    </>
  );
};

export default TakeQuizModal;
