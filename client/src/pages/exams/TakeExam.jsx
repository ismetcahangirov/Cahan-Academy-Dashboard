import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, AlertCircle, ArrowLeft } from 'lucide-react';
import { useGetExamByIdQuery, useSubmitStudentExamMutation } from '../../features/exams/examsApi';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import Spinner from '../../components/common/Spinner';

const formatRemaining = (ms) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
};

const TakeExam = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const { data: exam, isLoading, isError, refetch } = useGetExamByIdQuery(id);
  const [submitExam, { isLoading: isSubmitting }] = useSubmitStudentExamMutation();

  const [answers, setAnswers] = useState({});
  const [now, setNow] = useState(() => Date.now());
  const submittedRef = useRef(false);

  const start = exam ? new Date(exam.date).getTime() : 0;
  const end = exam ? start + (Number(exam.duration) || 0) * 60 * 1000 : 0;
  const hasResult = Boolean(exam?.results?.length);
  const questions = exam?.questions || [];
  const isActive = Boolean(exam) && !hasResult && now >= start && now <= end;

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Questions are only sent once the exam has started.
  const startedWithoutQuestions = Boolean(exam) && now >= start && now <= end
    && !hasResult && questions.length === 0 && exam.questionCount > 0;
  useEffect(() => {
    if (startedWithoutQuestions) refetch();
  }, [startedWithoutQuestions, refetch]);

  const submit = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    try {
      await submitExam({ id, data: { answers } }).unwrap();
      toast.success(t('exams.submitSuccess'));
      navigate('/exams');
    } catch (error) {
      submittedRef.current = false;
      toast.error(error.data?.message || t('common.error'));
    }
  }, [answers, id, navigate, submitExam, t]);

  // Auto-submit once when the time is up (the server accepts a short grace period).
  const autoSubmittedRef = useRef(false);
  useEffect(() => {
    if (exam && questions.length > 0 && !hasResult && now > end && now - end < 60 * 1000
      && !autoSubmittedRef.current) {
      autoSubmittedRef.current = true;
      submit();
    }
  }, [exam, questions.length, hasResult, now, end, submit]);

  const handleSubmit = () => {
    const answered = Object.values(answers).filter((v) => String(v).trim() !== '').length;
    if (answered < questions.length && !window.confirm(t('exams.incompleteWarning'))) {
      return;
    }
    submit();
  };

  const setAnswer = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const formatDateTime = (value) =>
    new Date(value).toLocaleString(i18n.language, {
      day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit',
    });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    );
  }

  const backButton = (
    <button
      onClick={() => navigate('/exams')}
      className="mt-6 px-4 py-2 bg-[var(--muted)] text-[var(--foreground)] rounded-lg hover:bg-[var(--muted)]/80"
    >
      {t('exams.goBack')}
    </button>
  );

  const renderState = (icon, message, extra = null) => (
    <div className="flex flex-col items-center justify-center h-64 text-[var(--muted-foreground)] text-center">
      {icon}
      <p className="text-lg">{message}</p>
      {extra}
      {backButton}
    </div>
  );

  if (isError || !exam) {
    return renderState(<AlertCircle size={48} className="mb-4 text-bordo opacity-50" />, t('exams.notFound'));
  }

  if (hasResult) {
    return renderState(
      <CheckCircle size={48} className="mb-4 text-green-500 opacity-50" />,
      t('exams.alreadySubmitted'),
      <p className="mt-2 text-xl font-bold text-[var(--foreground)]">
        {t('exams.yourScore', { score: exam.results[0].score })}
      </p>,
    );
  }

  if (!exam.questionCount) {
    return renderState(<AlertCircle size={48} className="mb-4 text-bordo opacity-50" />, t('exams.notOnline'));
  }

  if (now < start) {
    return renderState(
      <Clock size={48} className="mb-4 text-bordo opacity-50" />,
      t('exams.notStarted', { date: formatDateTime(exam.date) }),
    );
  }

  if (!isActive && now > end && !isSubmitting) {
    return renderState(<Clock size={48} className="mb-4 text-bordo opacity-50" />, t('exams.ended'));
  }

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* Header */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 mb-6 shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => navigate('/exams')}
            className="p-2 hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">{exam.title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-6 text-sm text-[var(--muted-foreground)]">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-bordo" />
            <span>
              {t('exams.timeLeft')}:{' '}
              <span className="font-semibold text-[var(--foreground)] tabular-nums">{formatRemaining(end - now)}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-bordo" />
            <span>{t('exams.questionsCount', { count: questions.length })}</span>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {questions.map((q, i) => (
          <motion.div
            key={q._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 shadow-sm"
          >
            <h3 className="text-lg font-medium text-[var(--foreground)] mb-4 whitespace-pre-wrap">
              <span className="text-bordo font-bold mr-2">{i + 1}.</span>
              {q.text}
            </h3>

            {q.type === 'open-ended' ? (
              <textarea
                value={answers[q._id] || ''}
                onChange={(e) => setAnswer(q._id, e.target.value)}
                rows={4}
                placeholder={t('exams.answerPlaceholder')}
                className="w-full px-4 py-3 bg-[var(--input)] border border-[var(--border)] rounded-xl text-[var(--foreground)] text-sm focus:outline-none focus:border-bordo transition-colors resize-y"
              />
            ) : (
              <div className="space-y-3">
                {(q.type === 'true-false'
                  ? [{ value: 'true', label: t('exams.true') }, { value: 'false', label: t('exams.false') }]
                  : (q.options || [])
                    .map((opt, optIndex) => ({ value: String(optIndex), label: opt }))
                    .filter((opt) => opt.label && opt.label.trim() !== '')
                ).map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      answers[q._id] === opt.value
                        ? 'border-bordo bg-bordo/5 text-[var(--foreground)]'
                        : 'border-[var(--border)] bg-[var(--input)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${q._id}`}
                      value={opt.value}
                      checked={answers[q._id] === opt.value}
                      onChange={() => setAnswer(q._id, opt.value)}
                      className="mt-1 w-4 h-4 text-bordo focus:ring-bordo border-[var(--border)]"
                    />
                    <span className="text-sm font-medium leading-relaxed">{opt.label}</span>
                  </label>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Submit Action */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="px-8 py-3 bg-bordo text-white rounded-xl font-medium hover:bg-bordo/90 transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
        >
          {isSubmitting && <Spinner size="sm" color="white" />}
          {t('exams.finishExam')}
        </button>
      </div>
    </div>
  );
};

export default TakeExam;
