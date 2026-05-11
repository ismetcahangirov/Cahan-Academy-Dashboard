import { useEffect, useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import Select from '../../components/common/Select';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Clock, AlignLeft, Users, Plus, Trash2,
  ChevronDown, ChevronUp, CheckCircle2, Circle, MessageSquare,
} from 'lucide-react';
import { useCreateQuizMutation, useUpdateQuizMutation } from '../../features/quizzes/quizzesApi';
import { useGetGroupsQuery } from '../../features/groups/groupsApi';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Spinner from '../../components/common/Spinner';

const questionSchema = z.object({
  text: z.string().min(1, 'Sual mətni boş ola bilməz'),
  type: z.enum(['multiple-choice', 'true-false', 'open-ended']),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().optional(),
  points: z.string().transform((val) => Number(val)).default('1'),
});

const quizSchema = z.object({
  title: z.string().min(3, 'Başlıq ən azı 3 simvol olmalıdır'),
  description: z.string().min(1, 'Təsvir boş ola bilməz'),
  group: z.string().min(1, 'Qrup seçilməlidir'),
  timeLimit: z
    .string()
    .transform((val) => Number(val))
    .refine((val) => val > 0, { message: 'Müddət sıfırdan böyük olmalıdır' }),
  questions: z.array(questionSchema).optional(),
});

const QuizModal = ({ isOpen, onClose, quiz }) => {
  const { t } = useTranslation();
  const isEditing = !!quiz;

  const { data: groupsResponse } = useGetGroupsQuery();
  const groups = groupsResponse?.data || [];

  const [createQuiz, { isLoading: isCreating }] = useCreateQuizMutation();
  const [updateQuiz, { isLoading: isUpdating }] = useUpdateQuizMutation();
  const isSubmitting = isCreating || isUpdating;

  const [expandedQuestion, setExpandedQuestion] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(quizSchema),
    defaultValues: {
      title: '',
      description: '',
      group: '',
      timeLimit: '30',
      questions: [],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: 'questions',
  });

  useEffect(() => {
    if (quiz && isOpen) {
      reset({
        title: quiz.title,
        description: quiz.description || '',
        group: typeof quiz.group === 'object' ? quiz.group._id : quiz.group,
        timeLimit: quiz.timeLimit?.toString() || '30',
        questions:
          quiz.questions?.map((q) => ({
            ...q,
            points: q.points?.toString() || '1',
          })) || [],
      });
    } else if (isOpen) {
      reset({
        title: '',
        description: '',
        group: '',
        timeLimit: '30',
        questions: [],
      });
      setExpandedQuestion(null);
    }
  }, [quiz, isOpen, reset]);

  const onSubmit = async (data) => {
    try {
      const payload = {
        title: data.title,
        description: data.description,
        group: data.group,
        timeLimit: Number(data.timeLimit),
        questions: (data.questions || []).map(q => ({
          text: q.text,
          type: q.type,
          options: q.options,
          correctAnswer: String(q.correctAnswer),
          points: Number(q.points)
        })),
      };

      if (isEditing) {
        await updateQuiz({ id: quiz._id, data: payload }).unwrap();
        toast.success(t('quizzes.updateSuccess'));
      } else {
        await createQuiz(payload).unwrap();
        toast.success(t('quizzes.createSuccess'));
      }
      onClose();
    } catch (error) {
      toast.error(error.data?.message || t('common.error'));
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-lg bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl p-6 overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[var(--foreground)]">
              {isEditing ? t('quizzes.modalTitleEdit') : t('quizzes.modalTitleAdd')}
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
                {t('quizzes.quizTitle')}
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]/40">
                  <AlignLeft size={18} />
                </div>
                <input
                  type="text"
                  {...register('title')}
                  className="w-full pl-10 pr-4 py-2.5 bg-[var(--input)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/30 focus:outline-none focus:border-bordo focus:ring-1 focus:ring-bordo transition-all"
                  placeholder={t('quizzes.titlePlaceholder')}
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
              <Controller
                name="group"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={[
                      { label: t('attendance.selectGroup'), value: '' },
                      ...groups.map((g) => ({ label: g.name, value: g._id })),
                    ]}
                    icon={<Users size={18} />}
                    error={errors.group?.message}
                  />
                )}
              />
            </div>

            {/* Time Limit */}
            <div>
              <label className="block text-sm font-medium text-[var(--muted-foreground)]/80 mb-1.5">
                {t('quizzes.timeLimitLabel')}
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]/40">
                  <Clock size={18} />
                </div>
                <input
                  type="number"
                  min="1"
                  {...register('timeLimit')}
                  className="w-full pl-10 pr-4 py-2.5 bg-[var(--input)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/30 focus:outline-none focus:border-bordo focus:ring-1 focus:ring-bordo transition-all"
                  placeholder={t('quizzes.timeLimitPlaceholder')}
                />
              </div>
              {errors.timeLimit && (
                <p className="mt-1 text-sm text-red-500">{errors.timeLimit.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-[var(--muted-foreground)]/80 mb-1.5">
                {t('quizzes.description')}
              </label>
              <textarea
                {...register('description')}
                rows={3}
                className="w-full px-4 py-2.5 bg-[var(--input)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/30 focus:outline-none focus:border-bordo focus:ring-1 focus:ring-bordo transition-all resize-none"
                placeholder={t('quizzes.descriptionPlaceholder')}
              />
            </div>

            {/* Questions Section */}
            <div className="pt-6 border-t border-[var(--border)] mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
                  <MessageSquare size={20} className="text-bordo" />
                  {t('quizzes.questions')} ({fields.length})
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    append({
                      text: '',
                      type: 'multiple-choice',
                      options: ['', '', '', ''],
                      correctAnswer: '0',
                      points: '1',
                    });
                    setExpandedQuestion(fields.length);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-bordo/10 text-bordo hover:bg-bordo/20 rounded-lg transition-all text-xs font-semibold border border-bordo/20"
                >
                  <Plus size={14} />
                  {t('quizzes.addQuestion')}
                </button>
              </div>

              <div className="space-y-4">
                {fields.map((field, index) => (
                  <motion.div
                    key={field.id}
                    layout
                    className="bg-[var(--muted)]/20 border border-[var(--border)] rounded-xl overflow-hidden"
                  >
                    {/* Question Header (collapsed row) */}
                    <div
                      className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-[var(--muted)]/30 transition-colors"
                      onClick={() =>
                        setExpandedQuestion(expandedQuestion === index ? null : index)
                      }
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-[var(--muted)] flex items-center justify-center text-xs font-bold text-[var(--muted-foreground)]/50">
                          {index + 1}
                        </span>
                        <span className="text-sm font-medium text-[var(--foreground)] truncate max-w-[200px]">
                          {watch(`questions.${index}.text`) || t('quizzes.newQuestion')}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-[var(--muted)] border border-[var(--border)] text-[10px] text-[var(--muted-foreground)]/40 uppercase tracking-wider">
                          {watch(`questions.${index}.type`) === 'multiple-choice'
                            ? t('quizzes.multipleChoice')
                            : watch(`questions.${index}.type`) === 'true-false'
                            ? t('quizzes.trueFalse')
                            : t('quizzes.openEnded')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            remove(index);
                            if (expandedQuestion === index) setExpandedQuestion(null);
                          }}
                          className="p-1.5 text-[var(--muted-foreground)]/20 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                        {expandedQuestion === index ? (
                          <ChevronUp size={18} className="text-[var(--muted-foreground)]/40" />
                        ) : (
                          <ChevronDown size={18} className="text-[var(--muted-foreground)]/40" />
                        )}
                      </div>
                    </div>

                    {/* Expanded Question Body */}
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
                              {t('quizzes.questionText')}
                            </label>
                            <textarea
                              {...register(`questions.${index}.text`)}
                              className="w-full px-3 py-2 bg-[var(--input)] border border-[var(--border)] rounded-lg text-[var(--foreground)] text-sm focus:outline-none focus:border-bordo transition-all resize-none h-20"
                              placeholder={t('quizzes.questionPlaceholder')}
                            />
                          </div>

                          {/* Type and Points */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-[var(--muted-foreground)]/60 mb-1.5">
                                {t('quizzes.questionType')}
                              </label>
                              <Controller
                                name={`questions.${index}.type`}
                                control={control}
                                render={({ field }) => (
                                  <Select
                                    {...field}
                                    onChange={(val) => {
                                      field.onChange(val);
                                      if (val === 'true-false') {
                                        update(index, {
                                          ...watch(`questions.${index}`),
                                          type: val,
                                          options: ['Düzdür', 'Səhvdir'],
                                          correctAnswer: 'true',
                                        });
                                      } else if (val === 'multiple-choice') {
                                        update(index, {
                                          ...watch(`questions.${index}`),
                                          type: val,
                                          options: ['', '', '', ''],
                                          correctAnswer: '0',
                                        });
                                      } else {
                                        update(index, {
                                          ...watch(`questions.${index}`),
                                          type: val,
                                          options: [],
                                          correctAnswer: '',
                                        });
                                      }
                                    }}
                                    options={[
                                      {
                                        label: t('quizzes.multipleChoice'),
                                        value: 'multiple-choice',
                                      },
                                      {
                                        label: t('quizzes.trueFalse'),
                                        value: 'true-false',
                                      },
                                      {
                                        label: t('quizzes.openEnded'),
                                        value: 'open-ended',
                                      },
                                    ]}
                                  />
                                )}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-[var(--muted-foreground)]/60 mb-1.5">
                                {t('quizzes.points')}
                              </label>
                              <input
                                type="number"
                                min="1"
                                {...register(`questions.${index}.points`)}
                                className="w-full px-3 py-2 bg-[var(--input)] border border-[var(--border)] rounded-lg text-[var(--foreground)] text-sm focus:outline-none focus:border-bordo transition-all"
                                placeholder="1"
                              />
                            </div>
                          </div>

                          {/* Multiple Choice Options */}
                          {watch(`questions.${index}.type`) === 'multiple-choice' && (
                            <div className="space-y-2">
                              <label className="block text-xs font-medium text-[var(--muted-foreground)]/60 mb-1.5">
                                {t('quizzes.options')} — {t('quizzes.correctOption')}
                              </label>
                              {[0, 1, 2, 3].map((optIndex) => (
                                <div key={optIndex} className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      update(index, {
                                        ...watch(`questions.${index}`),
                                        correctAnswer: optIndex.toString(),
                                      })
                                    }
                                    className={`p-1.5 rounded-full transition-all ${
                                      watch(`questions.${index}.correctAnswer`) ===
                                      optIndex.toString()
                                        ? 'text-bordo bg-bordo/10'
                                        : 'text-[var(--muted-foreground)]/20 hover:text-[var(--muted-foreground)]/40'
                                    }`}
                                  >
                                    {watch(`questions.${index}.correctAnswer`) ===
                                    optIndex.toString() ? (
                                      <CheckCircle2 size={16} />
                                    ) : (
                                      <Circle size={16} />
                                    )}
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

                          {/* True / False Options */}
                          {watch(`questions.${index}.type`) === 'true-false' && (
                            <div className="flex gap-4 pt-2">
                              <button
                                type="button"
                                onClick={() =>
                                  update(index, {
                                    ...watch(`questions.${index}`),
                                    correctAnswer: 'true',
                                  })
                                }
                                className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                                  watch(`questions.${index}.correctAnswer`) === 'true'
                                    ? 'bg-bordo/10 border-bordo/50 text-bordo'
                                    : 'bg-[var(--muted)]/50 border-[var(--border)] text-[var(--muted-foreground)]/40 hover:bg-[var(--muted)]'
                                }`}
                              >
                                {t('quizzes.true')}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  update(index, {
                                    ...watch(`questions.${index}`),
                                    correctAnswer: 'false',
                                  })
                                }
                                className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                                  watch(`questions.${index}.correctAnswer`) === 'false'
                                    ? 'bg-bordo/10 border-bordo/50 text-bordo'
                                    : 'bg-[var(--muted)]/50 border-[var(--border)] text-[var(--muted-foreground)]/40 hover:bg-[var(--muted)]'
                                }`}
                              >
                                {t('quizzes.false')}
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

            {/* Action Buttons */}
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
                  <Spinner size="sm" color="white" />
                ) : isEditing ? (
                  t('quizzes.updating')
                ) : (
                  t('quizzes.creating')
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default QuizModal;
