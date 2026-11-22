import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, AlertCircle, ArrowLeft, ListChecks } from 'lucide-react';
import { useGetExamByIdQuery, useSubmitStudentExamMutation } from '../../features/exams/examsApi';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import Spinner from '../../components/common/Spinner';
import { Button, Card, Textarea } from '../../components/ui';
import { OrnamentDivider } from '../../components/ornament';
import { ChoiceList, ExamClock, QuestionHeading, ScoreSeal } from './assessment/AssessmentParts';

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
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const renderState = (Icon, message, extra = null) => (
    <div className="mx-auto max-w-xl">
      <Card variant="paper" className="flex flex-col items-center px-6 py-12 text-center">
        <Icon size={44} strokeWidth={1.3} aria-hidden="true" className="mb-4 text-accent-text" />
        <p className="text-[1.15rem] text-ink">{message}</p>
        {extra}
        <OrnamentDivider draw={false} className="my-4" />
        <Button variant="outline" icon={ArrowLeft} motif={false} onClick={() => navigate('/exams')}>
          {t('exams.goBack')}
        </Button>
      </Card>
    </div>
  );

  if (isError || !exam) {
    return renderState(AlertCircle, t('exams.notFound'));
  }

  if (hasResult) {
    return (
      <div className="mx-auto max-w-xl space-y-5">
        <ScoreSeal
          eyebrow={t('exams.alreadySubmitted')}
          score={exam.results[0].score}
          total={100}
          caption={t('exams.yourScore', { score: exam.results[0].score })}
        >
          <Button variant="outline" icon={ArrowLeft} motif={false} className="mt-5" onClick={() => navigate('/exams')}>
            {t('exams.goBack')}
          </Button>
        </ScoreSeal>
      </div>
    );
  }

  if (!exam.questionCount) {
    return renderState(AlertCircle, t('exams.notOnline'));
  }

  if (now < start) {
    return renderState(Clock, t('exams.notStarted', { date: formatDateTime(exam.date) }));
  }

  if (!isActive && now > end && !isSubmitting) {
    return renderState(Clock, t('exams.ended'));
  }

  const answeredCount = Object.values(answers).filter((v) => String(v).trim() !== '').length;

  return (
    <div className="mx-auto max-w-3xl pb-20">
      {/* Header: sticky title bar with the framed clock */}
      <div className="card sticky top-0 z-10 mb-6 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <div className="flex min-w-0 items-center gap-2">
            <Button variant="ghost" iconOnly size="sm" icon={ArrowLeft} aria-label={t('exams.goBack')}
              onClick={() => navigate('/exams')} />
            <h1 className="min-w-0 break-words text-[1.35rem] font-semibold leading-tight text-ink">{exam.title}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="sc inline-flex items-center gap-2 text-[0.82rem] text-ink-muted">
              <ListChecks size={16} strokeWidth={1.6} aria-hidden="true" className="text-accent-text" />
              {t('exams.questionsCount', { count: questions.length })}
              <span className="num">({answeredCount}/{questions.length})</span>
            </span>
            <ExamClock remainingMs={end - now} label={t('exams.timeLeft')} />
          </div>
        </div>
      </div>

      {/* Questions: calm parchment paper */}
      <div className="paper space-y-8 rounded-[var(--radius-lg)] border border-line px-5 py-7 sm:px-9 sm:py-10">
        {questions.map((q, i) => (
          <fieldset key={q._id} className="min-w-0 space-y-4 border-0 p-0">
            <legend className="w-full">
              <QuestionHeading index={i + 1} text={q.text} className="text-[1.2rem]" />
            </legend>

            <div className="sm:pl-11">
              {q.type === 'open-ended' ? (
                <Textarea
                  value={answers[q._id] || ''}
                  onChange={(e) => setAnswer(q._id, e.target.value)}
                  rows={4}
                  aria-label={q.text}
                  placeholder={t('exams.answerPlaceholder')}
                  className="resize-y"
                />
              ) : (
                <ChoiceList
                  name={`question-${q._id}`}
                  value={answers[q._id]}
                  onChange={(v) => setAnswer(q._id, v)}
                  options={q.type === 'true-false'
                    ? [{ value: 'true', label: t('exams.true') }, { value: 'false', label: t('exams.false') }]
                    : (q.options || [])
                      .map((opt, optIndex) => ({ value: String(optIndex), label: opt }))
                      .filter((opt) => opt.label && opt.label.trim() !== '')}
                />
              )}
            </div>
            {i < questions.length - 1 && <OrnamentDivider draw={false} motif="dot" className="pt-4" />}
          </fieldset>
        ))}
      </div>

      {/* Submit Action */}
      <div className="mt-8 flex justify-end">
        <Button size="lg" icon={CheckCircle} onClick={handleSubmit} loading={isSubmitting}>
          {t('exams.finishExam')}
        </Button>
      </div>
    </div>
  );
};

export default TakeExam;
