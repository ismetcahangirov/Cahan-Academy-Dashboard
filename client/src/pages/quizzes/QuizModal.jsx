import { useEffect, useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import Select from '../../components/common/Select';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Clock, AlignLeft } from 'lucide-react';
import { useCreateQuizMutation, useUpdateQuizMutation } from '../../features/quizzes/quizzesApi';
import { useGetGroupsQuery } from '../../features/groups/groupsApi';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Button, FormField, Input, Modal, Textarea } from '../../components/ui';
import QuestionEditor from '../exams/assessment/QuestionEditor';

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
            correctAnswer: q.correctAnswer ?? '',
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
    }
  }, [quiz, isOpen, reset]);

  const handleClose = () => {
    setExpandedQuestion(null);
    onClose();
  };

  const onSubmit = async (data) => {
    try {
      const payload = {
        title: data.title,
        description: data.description,
        group: data.group,
        timeLimit: Number(data.timeLimit),
        questions: (data.questions || []).map((q, i) => ({
          _id: fields[i]?._id,
          text: q.text,
          type: q.type,
          options: q.options || [],
          correctAnswer: q.correctAnswer ?? '',
          points: Number(q.points) || 1,
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

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      size="lg"
      title={isEditing ? t('quizzes.modalTitleEdit') : t('quizzes.modalTitleAdd')}
      footer={(
        <>
          <Button variant="ghost" onClick={handleClose}>{t('common.cancel')}</Button>
          <Button type="submit" form="quiz-form" loading={isSubmitting}>
            {isEditing ? t('quizzes.updating') : t('quizzes.creating')}
          </Button>
        </>
      )}
    >
      <form id="quiz-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label={t('quizzes.quizTitle')} error={errors.title?.message}>
          {(id, describedBy, invalid) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              invalid={invalid}
              icon={AlignLeft}
              type="text"
              {...register('title')}
              placeholder={t('quizzes.titlePlaceholder')}
            />
          )}
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label={t('common.group')} error={errors.group?.message}>
            {() => (
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
                    error={!!errors.group}
                  />
                )}
              />
            )}
          </FormField>

          <FormField label={t('quizzes.timeLimitLabel')} error={errors.timeLimit?.message}>
            {(id, describedBy, invalid) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                invalid={invalid}
                icon={Clock}
                type="number"
                min="1"
                {...register('timeLimit')}
                placeholder={t('quizzes.timeLimitPlaceholder')}
              />
            )}
          </FormField>
        </div>

        <FormField label={t('quizzes.description')} error={errors.description?.message}>
          {(id, describedBy, invalid) => (
            <Textarea
              id={id}
              aria-describedby={describedBy}
              invalid={invalid}
              rows={3}
              {...register('description')}
              placeholder={t('quizzes.descriptionPlaceholder')}
            />
          )}
        </FormField>

        <QuestionEditor
          ns="quizzes"
          control={control}
          register={register}
          watch={watch}
          fields={fields}
          append={append}
          remove={remove}
          update={update}
          expanded={expandedQuestion}
          setExpanded={setExpandedQuestion}
        />
      </form>
    </Modal>
  );
};

export default QuizModal;
