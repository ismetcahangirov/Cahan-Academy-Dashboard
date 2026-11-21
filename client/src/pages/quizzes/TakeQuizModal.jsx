import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useGetQuizByIdQuery, useSubmitQuizMutation } from '../../features/quizzes/quizzesApi';
import Spinner from '../../components/common/Spinner';

const formatRemaining = (ms) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const TakeQuizModal = ({ quizId, onClose }) => {
  const { t } = useTranslation();
  const { data: quiz, isLoading, isError } = useGetQuizByIdQuery(quizId, { refetchOnMountOrArgChange: true });
  const [submitQuiz, { isLoading: isSubmitting }] = useSubmitQuizMutation();

  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [openedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const submittedRef = useRef(false);
  const autoSubmittedRef = useRef(false);

  const questions = quiz?.questions || [];
  const attempt = result || quiz?.attempts?.[0] || null;
  const deadline = openedAt + (Number(quiz?.timeLimit) || 30) * 60 * 1000;
  const inProgress = Boolean(quiz) && !attempt && questions.length > 0;

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
    if (inProgress && now >= deadline && !autoSubmittedRef.current) {
      autoSubmittedRef.current = true;
      submit();
    }
  }, [inProgress, now, deadline, submit]);

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
      return <p className="text-center py-12 text-[var(--muted-foreground)]">{t('quizzes.notFound')}</p>;
    }
    if (attempt) {
      const correct = (attempt.answers || []).filter((a) => a.isCorrect).length;
      return (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Trophy size={48} className="mb-4 text-bordo" />
          <p className="text-[var(--muted-foreground)]">{t('quizzes.yourResult')}</p>
          <p className="text-3xl font-bold text-[var(--foreground)] mt-2">
            {t('quizzes.scoreOf', { score: attempt.score, total: attempt.totalPoints })}
          </p>
          <p className="text-sm text-[var(--muted-foreground)] mt-2">
            {t('quizzes.correctCount', { correct, count: questions.length })}
          </p>
        </div>
      );
    }
    if (questions.length === 0) {
      return <p className="text-center py-12 text-[var(--muted-foreground)]">{t('quizzes.noQuestions')}</p>;
    }
    return (
      <div className="space-y-5">
        {questions.map((q, i) => (
          <div key={q._id} className="bg-[var(--muted)]/20 border border-[var(--border)] rounded-xl p-4">
            <p className="text-sm font-medium text-[var(--foreground)] mb-3 whitespace-pre-wrap">
              <span className="text-bordo font-bold mr-2">{i + 1}.</span>
              {q.text}
              <span className="ml-2 text-xs text-[var(--muted-foreground)]">
                ({t('quizzes.pointsCount', { count: q.points || 1 })})
              </span>
            </p>
            {q.type === 'open-ended' ? (
              <textarea
                value={answers[q._id] || ''}
                onChange={(e) => setAnswer(q._id, e.target.value)}
                rows={3}
                placeholder={t('quizzes.answerPlaceholder')}
                className="w-full px-3 py-2 bg-[var(--input)] border border-[var(--border)] rounded-lg text-[var(--foreground)] text-sm focus:outline-none focus:border-bordo transition-colors resize-y"
              />
            ) : (
              <div className="space-y-2">
                {optionsFor(q).map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors text-sm ${
                      answers[q._id] === opt.value
                        ? 'border-bordo bg-bordo/5 text-[var(--foreground)]'
                        : 'border-[var(--border)] bg-[var(--input)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`quiz-question-${q._id}`}
                      value={opt.value}
                      checked={answers[q._id] === opt.value}
                      onChange={() => setAnswer(q._id, opt.value)}
                      className="mt-0.5 w-4 h-4 text-bordo focus:ring-bordo border-[var(--border)]"
                    />
                    <span className="leading-relaxed">{opt.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/60 backdrop-blur-sm"
          onClick={handleClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-2xl bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
        >
          <div className="flex items-center justify-between gap-4 p-5 border-b border-[var(--border)]">
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-[var(--foreground)] truncate">{quiz?.title}</h2>
              {inProgress && (
                <p className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] mt-1">
                  <Clock size={14} className="text-bordo" />
                  {t('quizzes.timeLeft')}:{' '}
                  <span className="font-semibold text-[var(--foreground)] tabular-nums">
                    {formatRemaining(deadline - now)}
                  </span>
                </p>
              )}
            </div>
            <button
              onClick={handleClose}
              aria-label={t('quizzes.close')}
              className="p-2 text-[var(--muted-foreground)]/40 hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-5">{renderBody()}</div>

          <div className="flex gap-3 p-5 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2.5 bg-[var(--muted)]/50 hover:bg-[var(--muted)] text-[var(--foreground)] rounded-xl transition-colors font-medium"
            >
              {t('quizzes.close')}
            </button>
            {inProgress && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-bordo hover:bg-bordo/90 text-white rounded-xl transition-colors font-medium disabled:opacity-50 flex justify-center items-center"
              >
                {isSubmitting ? <Spinner size="sm" color="white" /> : t('quizzes.finish')}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TakeQuizModal;
