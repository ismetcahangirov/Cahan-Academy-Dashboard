import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Plus, 
  Trash2, 
  Loader2, 
  Save, 
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  BookOpen,
  Layout
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';

const ExamModal = ({ isOpen, onClose, onSubmit, exam, isLoading }) => {
  const { t } = useTranslation();
  const isEdit = !!exam;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: 60,
    course: '',
    questions: [
      {
        questionText: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        points: 1
      }
    ]
  });

  useEffect(() => {
    if (exam) {
      setFormData(exam);
    }
  }, [exam]);

  const addQuestion = () => {
    setFormData({
      ...formData,
      questions: [
        ...formData.questions,
        { questionText: '', options: ['', '', '', ''], correctAnswer: 0, points: 1 }
      ]
    });
  };

  const removeQuestion = (index) => {
    const newQuestions = formData.questions.filter((_, i) => i !== index);
    setFormData({ ...formData, questions: newQuestions });
  };

  const updateQuestion = (index, field, value) => {
    const newQuestions = [...formData.questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setFormData({ ...formData, questions: newQuestions });
  };

  const updateOption = (qIndex, oIndex, value) => {
    const newQuestions = [...formData.questions];
    newQuestions[qIndex].options[oIndex] = value;
    setFormData({ ...formData, questions: newQuestions });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-4xl bg-[var(--card)] border border-[var(--border)] rounded-[40px] shadow-2xl overflow-hidden z-10 my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-[var(--border)] bg-[var(--muted)]/20">
          <div>
            <h2 className="text-2xl font-black text-[var(--foreground)] tracking-tight">
              {isEdit ? t('exams.editExam') : t('exams.newExam')}
            </h2>
            <p className="text-[var(--muted-foreground)]/60 text-xs font-bold uppercase tracking-widest mt-1">
              {t('exams.examConfiguration')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-3 text-[var(--muted-foreground)]/40 hover:text-bordo hover:bg-bordo/5 rounded-2xl transition-all"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <form className="space-y-10">
            {/* General Info Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-xl bg-bordo/10 flex items-center justify-center text-bordo">
                  <Layout size={18} />
                </div>
                <h3 className="text-sm font-black text-[var(--foreground)] uppercase tracking-widest">{t('exams.generalInfo')}</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[var(--muted-foreground)]/40 uppercase tracking-[0.2em] ml-1">{t('exams.tableTitle')}</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-[var(--input)] border border-[var(--border)] rounded-2xl py-4 px-6 text-[var(--foreground)] text-sm font-bold focus:outline-none focus:border-bordo/50 transition-all"
                    placeholder={t('exams.titlePlaceholder')}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[var(--muted-foreground)]/40 uppercase tracking-[0.2em] ml-1">{t('exams.tableDuration')} (min)</label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                    className="w-full bg-[var(--input)] border border-[var(--border)] rounded-2xl py-4 px-6 text-[var(--foreground)] text-sm font-bold focus:outline-none focus:border-bordo/50 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[var(--muted-foreground)]/40 uppercase tracking-[0.2em] ml-1">{t('exams.tableDescription')}</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-[var(--input)] border border-[var(--border)] rounded-2xl py-4 px-6 text-[var(--foreground)] text-sm font-bold focus:outline-none focus:border-bordo/50 transition-all resize-none"
                  placeholder={t('exams.descPlaceholder')}
                />
              </div>
            </div>

            {/* Questions Section */}
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <HelpCircle size={18} />
                  </div>
                  <h3 className="text-sm font-black text-[var(--foreground)] uppercase tracking-widest">{t('exams.questions')}</h3>
                </div>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="flex items-center gap-2 text-xs font-black text-bordo bg-bordo/5 px-4 py-2 rounded-xl border border-bordo/10 hover:bg-bordo hover:text-white transition-all"
                >
                  <Plus size={16} />
                  {t('exams.addQuestion')}
                </button>
              </div>

              <div className="space-y-6">
                {formData.questions.map((question, qIndex) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={qIndex}
                    className="bg-[var(--card)] border border-[var(--border)] p-6 rounded-[32px] relative group hover:border-bordo/30 transition-all"
                  >
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => removeQuestion(qIndex)}
                        className="p-2 text-red-500 hover:bg-red-500/5 rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="space-y-6">
                      <div className="flex gap-4">
                        <span className="w-8 h-8 rounded-xl bg-[var(--muted)] flex items-center justify-center text-xs font-black text-[var(--muted-foreground)]/60 shrink-0">
                          {qIndex + 1}
                        </span>
                        <div className="flex-1 space-y-2">
                          <label className="text-[10px] font-black text-[var(--muted-foreground)]/40 uppercase tracking-widest ml-1">{t('exams.questionText')}</label>
                          <input
                            type="text"
                            value={question.questionText}
                            onChange={(e) => updateQuestion(qIndex, 'questionText', e.target.value)}
                            className="w-full bg-[var(--input)] border border-[var(--border)] rounded-2xl py-4 px-6 text-[var(--foreground)] text-sm font-bold focus:outline-none focus:border-bordo/50 transition-all"
                            placeholder={t('exams.questionPlaceholder')}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {question.options.map((option, oIndex) => (
                          <div key={oIndex} className="space-y-2">
                            <label className="text-[10px] font-black text-[var(--muted-foreground)]/40 uppercase tracking-widest ml-1">
                              {t('exams.option')} {String.fromCharCode(65 + oIndex)}
                            </label>
                            <div className="relative group/option">
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                                className={cn(
                                  "w-full bg-[var(--input)] border rounded-2xl py-3 px-12 text-[var(--foreground)] text-sm font-bold focus:outline-none transition-all",
                                  question.correctAnswer === oIndex 
                                    ? "border-emerald-500/50 ring-2 ring-emerald-500/5" 
                                    : "border-[var(--border)] focus:border-bordo/30"
                                )}
                              />
                              <button
                                type="button"
                                onClick={() => updateQuestion(qIndex, 'correctAnswer', oIndex)}
                                className={cn(
                                  "absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center",
                                  question.correctAnswer === oIndex 
                                    ? "bg-emerald-500 border-emerald-500 text-white" 
                                    : "border-[var(--border)] hover:border-bordo"
                                )}
                              >
                                {question.correctAnswer === oIndex && <CheckCircle2 size={12} />}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-[var(--border)] bg-[var(--muted)]/10 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-[var(--muted-foreground)]/40 uppercase tracking-widest">{t('exams.totalQuestions')}</span>
              <span className="text-xl font-black text-[var(--foreground)]">{formData.questions.length}</span>
            </div>
            <div className="w-px h-8 bg-[var(--border)]"></div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-[var(--muted-foreground)]/40 uppercase tracking-widest">{t('exams.totalPoints')}</span>
              <span className="text-xl font-black text-emerald-500">
                {formData.questions.reduce((acc, q) => acc + (q.points || 1), 0)}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-4 rounded-2xl text-sm font-bold text-[var(--muted-foreground)]/60 hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-all"
            >
              {t('common.cancel')}
            </button>
            <button
              disabled={isLoading}
              onClick={() => onSubmit(formData)}
              className="flex items-center gap-3 bg-bordo hover:bg-bordo/90 text-white px-10 py-4 rounded-2xl font-black text-sm tracking-wider transition-all shadow-xl shadow-bordo/20 hover:shadow-bordo/40 active:scale-95 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Save size={20} />
              )}
              {isEdit ? t('common.save') : t('common.create')}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ExamModal;
