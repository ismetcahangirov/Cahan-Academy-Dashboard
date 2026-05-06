import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar as CalendarIcon, Clock, Type, AlignLeft, Users, Plus, Trash2, ChevronDown, ChevronUp, CheckCircle2, Circle, MessageSquare } from 'lucide-react';
import { useCreateExamMutation, useUpdateExamMutation } from '../../features/exams/examsApi';
import { useGetGroupsQuery } from '../../features/groups/groupsApi';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const questionSchema = z.object({
  text: z.string().min(1, 'Sual mətni boş ola bilməz'),
  type: z.enum(['multiple-choice', 'true-false', 'open-ended']),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().optional(),
  points: z.string().transform(val => Number(val)).default('1'),
});

const examSchema = z.object({
  title: z.string().min(3, 'Başlıq ən azı 3 simvol olmalıdır'),
  description: z.string().optional(),
  group: z.string().min(1, 'Qrup seçilməlidir'),
  date: z.string().min(1, 'Tarix seçilməlidir'),
  time: z.string().min(1, 'Saat seçilməlidir'),
  duration: z.string().transform(val => Number(val)).refine(val => val > 0, { message: 'Müddət sıfırdan böyük olmalıdır' }),
  type: z.enum(['midterm', 'final', 'practice']),
  questions: z.array(questionSchema).optional(),
});

const ExamModal = ({ isOpen, onClose, exam }) => {
  const { t } = useTranslation();
  const isEditing = !!exam;
  const { data: groupsResponse, isLoading: isLoadingGroups } = useGetGroupsQuery();
  const groups = groupsResponse?.data || [];

  const [createExam, { isLoading: isCreating }] = useCreateExamMutation();
  const [updateExam, { isLoading: isUpdating }] = useUpdateExamMutation();
  const isSubmitting = isCreating || isUpdating;

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(examSchema),
    defaultValues: {
      title: '',
      description: '',
      group: '',
      date: '',
      time: '',
      duration: '60',
      type: 'practice',
      questions: [],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: 'questions',
  });

  const [expandedQuestion, setExpandedQuestion] = useState(null);

  useEffect(() => {
    if (exam && isOpen) {
      const examDate = new Date(exam.date);
      reset({
        title: exam.title,
        description: exam.description || '',
        group: typeof exam.group === 'object' ? exam.group._id : exam.group,
        date: examDate.toISOString().split('T')[0],
        time: examDate.toTimeString().slice(0, 5),
        duration: exam.duration.toString(),
        type: exam.type,
        questions: exam.questions?.map(q => ({
          ...q,
          points: q.points.toString()
        })) || [],
      });
    } else if (isOpen) {
      reset({
        title: '',
        description: '',
        group: '',
        date: '',
        time: '',
        duration: '60',
        type: 'practice',
        questions: [],
      });
    }
  }, [exam, isOpen, reset]);


  const onSubmit = async (data) => {
    try {
      // Combine date and time
      const dateTime = new Date(`${data.date}T${data.time}`);
      
      const payload = {
        title: data.title,
        description: data.description,
        group: data.group,
        date: dateTime.toISOString(),
        duration: Number(data.duration),
        type: data.type,
        questions: data.questions || [],
      };

      if (isEditing) {
        await updateExam({ id: exam._id, data: payload }).unwrap();
        toast.success(t('exams.updateSuccess'));
      } else {
        await createExam(payload).unwrap();
        toast.success(t('exams.createSuccess'));
      }
      onClose();
    } catch (error) {
      toast.error(error.data?.message || t('students.error'));
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
          className="relative w-full max-w-lg bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl p-6 overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[var(--foreground)]">
              {isEditing ? t('exams.modalTitleEdit') : t('exams.modalTitleAdd')}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-[var(--muted-foreground)]/40 hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-[var(--muted-foreground)]/80 mb-1.5">
                {t('exams.examTitle')}
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]/40">
                  <AlignLeft size={18} />
                </div>
                <input
                  type="text"
                  {...register('title')}
                  className="w-full pl-10 pr-4 py-2.5 bg-[var(--input)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/30 focus:outline-none focus:border-bordo focus:ring-1 focus:ring-bordo transition-all"
                  placeholder="Məs: Fevral Ayı Sınaq İmtahanı"
                />
              </div>
              {errors.title && (
                <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>
              )}
            </div>

            {/* Group */}
            <div>
              <label className="block text-sm font-medium text-[var(--muted-foreground)]/80 mb-1.5">
                {t('common.group')}
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]/40">
                  <Users size={18} />
                </div>
                <select
                  {...register('group')}
                  className="w-full pl-10 pr-4 py-2.5 bg-[var(--input)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none focus:border-bordo focus:ring-1 focus:ring-bordo transition-all appearance-none"
                >
                  <option value="" className="bg-[var(--card)]">{t('groups.selectGroup')}</option>
                  {!isLoadingGroups && groups.map((g) => (
                    <option key={g._id} value={g._id} className="bg-[var(--card)]">
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
              {errors.group && (
                <p className="mt-1 text-sm text-red-500">{errors.group.message}</p>
              )}
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-[var(--muted-foreground)]/80 mb-1.5">
                {t('exams.type')}
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]/40">
                  <Type size={18} />
                </div>
                <select
                  {...register('type')}
                  className="w-full pl-10 pr-4 py-2.5 bg-[var(--input)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none focus:border-bordo focus:ring-1 focus:ring-bordo transition-all appearance-none"
                >
                  <option value="practice" className="bg-[var(--card)]">{t('exams.practice')}</option>
                  <option value="midterm" className="bg-[var(--card)]">{t('exams.midterm')}</option>
                  <option value="final" className="bg-[var(--card)]">{t('exams.final')}</option>
                </select>
              </div>
              {errors.type && (
                <p className="mt-1 text-sm text-red-500">{errors.type.message}</p>
              )}
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--muted-foreground)]/80 mb-1.5">
                  {t('exams.date')}
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]/40">
                    <CalendarIcon size={18} />
                  </div>
                  <input
                    type="date"
                    {...register('date')}
                    className="w-full pl-10 pr-4 py-2.5 bg-[var(--input)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none focus:border-bordo focus:ring-1 focus:ring-bordo transition-all"
                  />
                </div>
                {errors.date && (
                  <p className="mt-1 text-sm text-red-500">{errors.date.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--muted-foreground)]/80 mb-1.5">
                  {t('exams.time')}
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]/40">
                    <Clock size={18} />
                  </div>
                  <input
                    type="time"
                    {...register('time')}
                    className="w-full pl-10 pr-4 py-2.5 bg-[var(--input)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none focus:border-bordo focus:ring-1 focus:ring-bordo transition-all"
                  />
                </div>
                {errors.time && (
                  <p className="mt-1 text-sm text-red-500">{errors.time.message}</p>
                )}
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-[var(--muted-foreground)]/80 mb-1.5">
                {t('exams.duration')} ({t('exams.minute')})
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]/40">
                  <Clock size={18} />
                </div>
                <input
                  type="number"
                  {...register('duration')}
                  className="w-full pl-10 pr-4 py-2.5 bg-[var(--input)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/30 focus:outline-none focus:border-bordo focus:ring-1 focus:ring-bordo transition-all"
                  placeholder={t('exams.durationPlaceholder')}
                />
              </div>
              {errors.duration && (
                <p className="mt-1 text-sm text-red-500">{errors.duration.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-[var(--muted-foreground)]/80 mb-1.5">
                {t('exams.infoOptional')}
              </label>
              <textarea
                {...register('description')}
                rows={3}
                className="w-full px-4 py-2.5 bg-[var(--input)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/30 focus:outline-none focus:border-bordo focus:ring-1 focus:ring-bordo transition-all resize-none"
                placeholder={t('exams.notesPlaceholder')}
              />
            </div>

            {/* Questions Section */}
            <div className="pt-6 border-t border-[var(--border)] mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
                  <MessageSquare size={20} className="text-bordo" />
                  {t('exams.questions')} ({fields.length})
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    append({ text: '', type: 'multiple-choice', options: ['', '', '', ''], correctAnswer: '0', points: '1' });
                    setExpandedQuestion(fields.length);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-bordo/10 text-bordo hover:bg-bordo/20 rounded-lg transition-all text-xs font-semibold border border-bordo/20"
                >
                  <Plus size={14} />
                  {t('exams.addQuestion')}
                </button>
              </div>

              <div className="space-y-4">
                {fields.map((field, index) => (
                  <motion.div
                    key={field.id}
                    layout
                    className="bg-[var(--muted)]/20 border border-[var(--border)] rounded-xl overflow-hidden"
                  >
                    <div 
                      className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-[var(--muted)]/30 transition-colors"
                      onClick={() => setExpandedQuestion(expandedQuestion === index ? null : index)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-[var(--muted)] flex items-center justify-center text-xs font-bold text-[var(--muted-foreground)]/50">
                          {index + 1}
                        </span>
                        <span className="text-sm font-medium text-[var(--foreground)] truncate max-w-[200px]">
                          {watch(`questions.${index}.text`) || t('exams.newQuestion')}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-[var(--muted)] border border-[var(--border)] text-[10px] text-[var(--muted-foreground)]/40 uppercase tracking-wider">
                          {watch(`questions.${index}.type`) === 'multiple-choice' ? t('exams.multipleChoice') : 
                           watch(`questions.${index}.type`) === 'true-false' ? t('exams.trueFalse') : t('exams.openEnded')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            remove(index);
                          }}
                          className="p-1.5 text-[var(--muted-foreground)]/20 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                        {expandedQuestion === index ? <ChevronUp size={18} className="text-[var(--muted-foreground)]/40" /> : <ChevronDown size={18} className="text-[var(--muted-foreground)]/40" />}
                      </div>
                    </div>

                    <AnimatePresence>
                      {expandedQuestion === index && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="px-4 pb-4 border-t border-[var(--border)] pt-4 space-y-4"
                        >
                          {/* Question Text */}
                          <div>
                            <label className="block text-xs font-medium text-[var(--muted-foreground)]/60 mb-1.5">
                              {t('exams.questionText')}
                            </label>
                            <textarea
                              {...register(`questions.${index}.text`)}
                              className="w-full px-3 py-2 bg-[var(--input)] border border-[var(--border)] rounded-lg text-[var(--foreground)] text-sm focus:outline-none focus:border-bordo transition-all resize-none h-20"
                              placeholder={t('exams.questionPlaceholder')}
                            />
                          </div>

                          {/* Type and Points */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-[var(--muted-foreground)]/60 mb-1.5">
                                {t('exams.type')}
                              </label>
                              <select
                                {...register(`questions.${index}.type`)}
                                className="w-full px-3 py-2 bg-[var(--input)] border border-[var(--border)] rounded-lg text-[var(--foreground)] text-sm focus:outline-none focus:border-bordo transition-all"
                                onChange={(e) => {
                                  const type = e.target.value;
                                  if (type === 'true-false') {
                                    update(index, { ...watch(`questions.${index}`), type, options: ['Düzdür', 'Səhvdir'], correctAnswer: 'true' });
                                  } else if (type === 'multiple-choice') {
                                    update(index, { ...watch(`questions.${index}`), type, options: ['', '', '', ''], correctAnswer: '0' });
                                  } else {
                                    update(index, { ...watch(`questions.${index}`), type, options: [], correctAnswer: '' });
                                  }
                                }}
                              >
                                <option value="multiple-choice">{t('exams.multipleChoice')}</option>
                                <option value="true-false">{t('exams.trueFalse')}</option>
                                <option value="open-ended">{t('exams.openEnded')}</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-[var(--muted-foreground)]/60 mb-1.5">
                                {t('exams.points')}
                              </label>
                              <input
                                type="number"
                                {...register(`questions.${index}.points`)}
                                className="w-full px-3 py-2 bg-[var(--input)] border border-[var(--border)] rounded-lg text-[var(--foreground)] text-sm focus:outline-none focus:border-bordo transition-all"
                                placeholder="1"
                              />
                            </div>
                          </div>

                          {/* Options for Multiple Choice */}
                          {watch(`questions.${index}.type`) === 'multiple-choice' && (
                            <div className="space-y-2">
                              <label className="block text-xs font-medium text-[var(--muted-foreground)]/60 mb-1.5">
                                {t('exams.options')} ({t('exams.correctOption')})
                              </label>
                              {[0, 1, 2, 3].map((optIndex) => (
                                <div key={optIndex} className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => update(index, { ...watch(`questions.${index}`), correctAnswer: optIndex.toString() })}
                                    className={`p-1.5 rounded-full transition-all ${
                                      watch(`questions.${index}.correctAnswer`) === optIndex.toString() 
                                        ? "text-emerald-500 bg-emerald-500/10" 
                                        : "text-[var(--muted-foreground)]/20 hover:text-[var(--muted-foreground)]/40"
                                    }`}
                                  >
                                    {watch(`questions.${index}.correctAnswer`) === optIndex.toString() ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                                  </button>
                                  <input
                                    {...register(`questions.${index}.options.${optIndex}`)}
                                    className="flex-1 px-3 py-1.5 bg-[var(--input)] border border-[var(--border)] rounded-lg text-[var(--foreground)] text-xs focus:outline-none focus:border-bordo transition-all"
                                    placeholder={`${String.fromCharCode(65 + optIndex)} variantı...`}
                                  />
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Options for True/False */}
                          {watch(`questions.${index}.type`) === 'true-false' && (
                            <div className="flex gap-4 pt-2">
                              <button
                                type="button"
                                onClick={() => update(index, { ...watch(`questions.${index}`), correctAnswer: 'true' })}
                                className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                                  watch(`questions.${index}.correctAnswer`) === 'true'
                                    ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-500"
                                    : "bg-[var(--muted)]/50 border-[var(--border)] text-[var(--muted-foreground)]/40 hover:bg-[var(--muted)]"
                                }`}
                              >
                                {t('exams.true')}
                              </button>
                              <button
                                type="button"
                                onClick={() => update(index, { ...watch(`questions.${index}`), correctAnswer: 'false' })}
                                className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                                  watch(`questions.${index}.correctAnswer`) === 'false'
                                    ? "bg-red-500/10 border-red-500/50 text-red-500"
                                    : "bg-[var(--muted)]/50 border-[var(--border)] text-[var(--muted-foreground)]/40 hover:bg-[var(--muted)]"
                                }`}
                              >
                                {t('exams.false')}
                              </button>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-[var(--border)] mt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 bg-[var(--muted)]/50 hover:bg-[var(--muted)] text-[var(--foreground)] rounded-xl transition-colors font-medium"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-bordo hover:bg-bordo/90 text-white rounded-xl transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  isEditing ? t('common.update') : t('common.create')
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ExamModal;
