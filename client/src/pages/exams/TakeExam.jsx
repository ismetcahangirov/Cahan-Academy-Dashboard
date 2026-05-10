import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, AlertCircle, ArrowLeft } from 'lucide-react';
import { useGetExamByIdQuery, useSubmitStudentExamMutation } from '../../features/exams/examsApi';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import Spinner from '../../components/common/Spinner';

const TakeExam = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const { data: examResponse, isLoading, isError } = useGetExamByIdQuery(id);
  const [submitExam, { isLoading: isSubmitting }] = useSubmitStudentExamMutation();
  
  const [answers, setAnswers] = useState({});
  
  const exam = examResponse?.data || examResponse;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    );
  }

  if (isError || !exam) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-[var(--muted-foreground)]">
        <AlertCircle size={48} className="mb-4 text-bordo opacity-50" />
        <p className="text-lg">{t('exams.notFound') || 'İmtahan tapılmadı'}</p>
        <button 
          onClick={() => navigate('/exams')}
          className="mt-4 px-4 py-2 bg-[var(--muted)] text-[var(--foreground)] rounded-lg"
        >
          {t('common.goBack') || 'Geri qayıt'}
        </button>
      </div>
    );
  }

  // If already submitted, prevent taking again (though Exam.jsx also hides the button, it's good to check)
  if (exam.results && exam.results.length > 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-[var(--muted-foreground)]">
        <CheckCircle size={48} className="mb-4 text-green-500 opacity-50" />
        <p className="text-lg">{t('exams.alreadySubmitted') || 'Siz artıq bu imtahanı vermisiniz.'}</p>
        <p className="mt-2 text-xl font-bold text-[var(--foreground)]">Nəticə: {exam.results[0].score}/100</p>
        <button 
          onClick={() => navigate('/exams')}
          className="mt-6 px-4 py-2 bg-[var(--muted)] text-[var(--foreground)] rounded-lg hover:bg-[var(--muted)]/80"
        >
          {t('common.goBack') || 'Geri qayıt'}
        </button>
      </div>
    );
  }

  const handleOptionSelect = (questionId, optionIndex) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const handleSubmit = async () => {
    // Check if all questions are answered
    if (Object.keys(answers).length < exam.questions.length) {
      if (!window.confirm(t('exams.incompleteWarning') || 'Bütün suallara cavab verməmisiniz. Yenə də bitirmək istəyirsiniz?')) {
        return;
      }
    }

    try {
      const formattedAnswers = Object.entries(answers).map(([questionId, selectedOption]) => ({
        questionId,
        selectedOption
      }));

      await submitExam({ id, data: { answers: formattedAnswers } }).unwrap();
      toast.success(t('exams.submitSuccess') || 'İmtahan uğurla bitirildi');
      navigate('/exams');
    } catch (error) {
      toast.error(error.data?.message || t('common.error'));
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* Header */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 mb-6 shadow-sm">
        <div className="flex items-center gap-4 mb-4">
          <button 
            onClick={() => navigate('/exams')}
            className="p-2 hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">{exam.title}</h1>
        </div>
        <div className="flex items-center gap-6 text-sm text-[var(--muted-foreground)]">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-bordo" />
            <span>{exam.duration} {t('exams.minute') || 'dəqiqə'}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-bordo" />
            <span>{exam.questions?.length || 0} {t('exams.questionsCount') || 'sual'}</span>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {exam.questions?.map((q, i) => (
          <motion.div 
            key={q._id || i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 shadow-sm"
          >
            <h3 className="text-lg font-medium text-[var(--foreground)] mb-4">
              <span className="text-bordo font-bold mr-2">{i + 1}.</span> 
              {q.question}
            </h3>
            <div className="space-y-3">
              {q.options?.map((opt, optIndex) => (
                <label 
                  key={optIndex}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    answers[q._id] === optIndex 
                      ? 'border-bordo bg-bordo/5 text-[var(--foreground)]' 
                      : 'border-[var(--border)] bg-[var(--input)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]'
                  }`}
                >
                  <input 
                    type="radio"
                    name={`question-${q._id}`}
                    value={optIndex}
                    checked={answers[q._id] === optIndex}
                    onChange={() => handleOptionSelect(q._id, optIndex)}
                    className="mt-1 w-4 h-4 text-bordo focus:ring-bordo border-[var(--border)]"
                  />
                  <span className="text-sm font-medium leading-relaxed">{opt}</span>
                </label>
              ))}
            </div>
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
          {isSubmitting && <Spinner className="w-4 h-4 border-2" />}
          {t('exams.finishExam') || 'İmtahanı bitir'}
        </button>
      </div>
    </div>
  );
};

export default TakeExam;
