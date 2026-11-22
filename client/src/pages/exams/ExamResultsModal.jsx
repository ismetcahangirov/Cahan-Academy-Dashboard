import { useState, useMemo } from 'react';
import { Search, Save, Eye } from 'lucide-react';
import { useAddExamResultsMutation, useGetExamByIdQuery } from '../../features/exams/examsApi';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Avatar from '../../components/common/Avatar';
import Spinner from '../../components/common/Spinner';
import AnswerReviewModal from '../../components/grading/AnswerReviewModal';
import { Button, EmptyState, Input, Modal, StatusPill, Table } from '../../components/ui';

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

  return (
    <>
      <Modal
        open={isOpen}
        // the nested review dialog owns Escape while it is open
        onClose={reviewStudentId ? () => {} : onClose}
        size="xl"
        title={`${t('exams.resultsModalTitle')}: ${exam.title}`}
        subtitle={`${examDetails?.group?.name || ''} • ${t('exams.studentCount')}: ${students.length}`}
        footer={(
          <>
            <Button variant="ghost" onClick={onClose}>{t('exams.close')}</Button>
            <Button icon={Save} onClick={handleSubmit} loading={isSubmitting} disabled={isLoadingExam}>
              {t('common.save')}
            </Button>
          </>
        )}
      >
        <div className="mb-4 max-w-md">
          <Input
            icon={Search}
            type="text"
            aria-label={t('exams.studentSearch')}
            placeholder={t('exams.studentSearch')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {isLoadingExam ? (
          <div className="flex h-40 items-center justify-center"><Spinner /></div>
        ) : filteredStudents.length === 0 ? (
          <EmptyState compact sketch="globe" title={t('exams.noStudentsFound')} />
        ) : (
          <Table caption={t('exams.resultsModalTitle')} tableClassName="min-w-[640px]">
            <thead>
              <tr>
                <th className="w-1/3">{t('exams.tableStudent')}</th>
                <th className="w-1/4">{t('exams.tableScore')}</th>
                <th>{t('exams.tableFeedback')}</th>
                <th>{t('exams.reviewTitle')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map(student => {
                const result = resultsData[student._id] || { score: '', feedback: '' };
                return (
                  <tr key={student._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar src={student.avatar} name={student.name} className="h-8 w-8 shrink-0" textSize="xs" />
                        <div className="min-w-0">
                          <div className="font-medium text-ink">{student.name}</div>
                          <div className="text-[0.85rem] text-ink-muted">{student.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        aria-label={`${t('exams.tableScore')}: ${student.name}`}
                        value={result.score}
                        onChange={(e) => handleScoreChange(student._id, e.target.value)}
                        placeholder="0"
                        className="num w-20 text-center"
                      />
                    </td>
                    <td>
                      <Input
                        type="text"
                        aria-label={`${t('exams.tableFeedback')}: ${student.name}`}
                        value={result.feedback}
                        onChange={(e) => handleFeedbackChange(student._id, e.target.value)}
                        placeholder={t('exams.feedbackPlaceholder')}
                      />
                    </td>
                    <td>
                      {answerInfo[student._id] ? (
                        <div className="flex flex-col items-start gap-1.5">
                          <Button variant="outline" motif={false} size="sm" icon={Eye}
                            onClick={() => setReviewStudentId(student._id)}>
                            {t('exams.viewAnswers')}
                          </Button>
                          {answerInfo[student._id].pending > 0 && (
                            <StatusPill status="pending">
                              {t('exams.pendingReview', { count: answerInfo[student._id].pending })}
                            </StatusPill>
                          )}
                        </div>
                      ) : (
                        <span className="text-ink-muted">—</span>
                      )}
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
          kind="exam"
          id={exam._id}
          studentId={reviewStudentId}
          canGrade
          onClose={() => setReviewStudentId(null)}
        />
      )}
    </>
  );
};

export default ExamResultsModal;
