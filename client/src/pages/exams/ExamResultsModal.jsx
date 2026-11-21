import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Save, Eye } from 'lucide-react';
import { useAddExamResultsMutation, useGetExamByIdQuery } from '../../features/exams/examsApi';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Avatar from '../../components/common/Avatar';
import Spinner from '../../components/common/Spinner';
import AnswerReviewModal from '../../components/grading/AnswerReviewModal';

const ExamResultsModal = ({ isOpen, onClose, exam }) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [edits, setEdits] = useState({});
  const [reviewStudentId, setReviewStudentId] = useState(null);

  // transformResponse already unwraps `data`
  const { data: examDetails, isLoading: isLoadingExam } = useGetExamByIdQuery(exam?._id, {
    skip: !exam?._id || !isOpen,
  });

  const [addExamResults, { isLoading: isSubmitting }] = useAddExamResultsMutation();

  const students = examDetails?.group?.students || [];

  // Saved results, overlaid with the teacher's unsaved edits
  const savedData = useMemo(() => {
    const initialData = {};
    (examDetails?.results || []).forEach(result => {
      if (!result.student) return;
      initialData[result.student._id || result.student] = {
        score: result.score.toString(),
        feedback: result.feedback || ''
      };
    });
    return initialData;
  }, [examDetails]);

  // Online answers per student, with the number of open answers still to grade
  const answerInfo = useMemo(() => {
    const openIds = new Set((examDetails?.questions || []).filter((q) => q.type === 'open-ended').map((q) => q._id));
    const info = {};
    (examDetails?.results || []).forEach((result) => {
      if (!result.student || !result.answers?.length) return;
      info[result.student._id || result.student] = {
        pending: result.answers.filter((a) => openIds.has(a.questionId)
          && (a.awardedPoints === null || a.awardedPoints === undefined)).length,
      };
    });
    return info;
  }, [examDetails]);
  const resultsData = { ...savedData, ...edits };

  const handleScoreChange = (studentId, value) => {
    // Only allow numbers 0-100
    if (value === '' || (Number(value) >= 0 && Number(value) <= 100)) {
      setEdits(prev => ({
        ...prev,
        [studentId]: {
          feedback: '',
          ...savedData[studentId],
          ...prev[studentId],
          score: value
        }
      }));
    }
  };

  const handleFeedbackChange = (studentId, value) => {
    setEdits(prev => ({
      ...prev,
      [studentId]: {
        score: '',
        ...savedData[studentId],
        ...prev[studentId],
        feedback: value
      }
    }));
  };

  const handleSubmit = async () => {
    try {
      // Only send rows the teacher changed, so untouched results do not re-notify students
      const formattedResults = Object.entries(edits)
        .filter(([, data]) => data.score !== '' && data.score !== undefined)
        .map(([studentId, data]) => ({
          student: studentId,
          score: Number(data.score),
          feedback: data.feedback
        }));

      if (formattedResults.length === 0) {
        toast.error(t('exams.noResultsEntered'));
        return;
      }

      await addExamResults({
        id: exam._id,
        data: { results: formattedResults }
      }).unwrap();
      
      toast.success(t('exams.resultsSavedSuccess'));
      onClose();
    } catch (error) {
      toast.error(error.data?.message || t('students.error'));
    }
  };

  const filteredStudents = students.filter(student => 
    student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div key="results" className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
          className="relative w-full max-w-4xl bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[85vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
            <div>
              <h2 className="text-xl font-bold text-[var(--foreground)] mb-1">
                {t('exams.resultsModalTitle')}: {exam.title}
              </h2>
              <p className="text-sm text-[var(--muted-foreground)]">
                {examDetails?.group?.name} • {t('exams.studentCount')}: {students.length}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-[var(--muted-foreground)]/40 hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-[var(--border)] bg-[var(--muted)]/20">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" size={20} />
              <input
                type="text"
                placeholder={t('exams.studentSearch')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[var(--input)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-bordo transition-colors"
              />
            </div>
          </div>

          {/* Table Area */}
          <div className="flex-1 overflow-auto custom-scrollbar p-6">
            {isLoadingExam ? (
              <div className="flex justify-center items-center h-full">
                <Spinner />
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center text-[var(--muted-foreground)] py-12">
                {t('exams.noStudentsFound')}
              </div>
            ) : (
              <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[640px]">
                  <thead>
                    <tr className="bg-[var(--muted)]/10 text-[var(--muted-foreground)] text-sm border-b border-[var(--border)]">
                      <th className="p-4 font-medium w-1/3">{t('exams.tableStudent')}</th>
                      <th className="p-4 font-medium w-1/4">{t('exams.tableScore')}</th>
                      <th className="p-4 font-medium">{t('exams.tableFeedback')}</th>
                      <th className="p-4 font-medium">{t('exams.reviewTitle')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {filteredStudents.map(student => {
                      const result = resultsData[student._id] || { score: '', feedback: '' };
                      return (
                        <tr key={student._id} className="hover:bg-[var(--muted)]/20 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <Avatar
                                src={student.avatar}
                                name={student.name}
                                className="w-8 h-8 rounded-full border border-[var(--border)]"
                                textSize="xs"
                              />
                              <div>
                                <div className="text-[var(--foreground)] text-sm font-medium">{student.name}</div>
                                <div className="text-[var(--muted-foreground)]/50 text-xs">{student.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={result.score}
                              onChange={(e) => handleScoreChange(student._id, e.target.value)}
                              placeholder="0"
                              className="w-20 bg-[var(--input)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-[var(--foreground)] focus:outline-none focus:border-bordo transition-colors text-center"
                            />
                          </td>
                          <td className="p-4">
                            <input
                              type="text"
                              value={result.feedback}
                              onChange={(e) => handleFeedbackChange(student._id, e.target.value)}
                              placeholder={t('exams.feedbackPlaceholder')}
                              className="w-full bg-[var(--input)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-[var(--foreground)] focus:outline-none focus:border-bordo transition-colors text-sm"
                            />
                          </td>
                          <td className="p-4">
                            {answerInfo[student._id] ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setReviewStudentId(student._id)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--muted)]/50 hover:bg-[var(--muted)] text-[var(--foreground)] rounded-lg transition-colors text-xs font-medium whitespace-nowrap"
                                >
                                  <Eye size={14} />
                                  {t('exams.viewAnswers')}
                                </button>
                                {answerInfo[student._id].pending > 0 && (
                                  <div className="mt-1 text-xs text-amber-500">
                                    {t('exams.pendingReview', { count: answerInfo[student._id].pending })}
                                  </div>
                                )}
                              </>
                            ) : (
                              <span className="text-xs text-[var(--muted-foreground)]">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer Action */}
          <div className="p-6 border-t border-[var(--border)] bg-[var(--muted)]/20 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-[var(--muted)]/50 hover:bg-[var(--muted)] text-[var(--foreground)] rounded-xl transition-colors font-medium"
            >
              {t('exams.close')}
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || isLoadingExam}
              className="px-6 py-2.5 bg-bordo hover:bg-bordo/90 text-white rounded-xl transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <Spinner size="sm" color="white" />
              ) : (
                <>
                  <Save size={18} />
                  <span>{t('common.save')}</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
      {reviewStudentId && (
        <AnswerReviewModal
          key="review"
          kind="exam"
          id={exam._id}
          studentId={reviewStudentId}
          canGrade
          onClose={() => setReviewStudentId(null)}
        />
      )}
    </AnimatePresence>
  );
};

export default ExamResultsModal;
