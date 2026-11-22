import { useEffect, useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import Select from '../../components/common/Select';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Calendar as CalendarIcon, Clock, AlignLeft } from 'lucide-react';
import { useCreateExamMutation, useUpdateExamMutation } from '../../features/exams/examsApi';
import { useGetGroupsQuery } from '../../features/groups/groupsApi';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Button, FormField, Input, Modal, Textarea } from '../../components/ui';
import QuestionEditor from './assessment/QuestionEditor';

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
  const { data: groupsResponse } = useGetGroupsQuery();
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
        date: format(examDate, 'yyyy-MM-dd'),
        time: format(examDate, 'HH:mm'),
        duration: exam.duration.toString(),
        type: exam.type,
        questions: exam.questions?.map(q => ({
          ...q,
          correctAnswer: q.correctAnswer ?? '',
          points: q.points?.toString() || '1'
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

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      size="lg"
      title={isEditing ? t('exams.modalTitleEdit') : t('exams.modalTitleAdd')}
      footer={(
        <>
          <Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="submit" form="exam-form" loading={isSubmitting}>
            {isEditing ? t('exams.update') : t('exams.create')}
          </Button>
        </>
      )}
    >
      <form id="exam-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label={t('exams.examTitle')} error={errors.title?.message}>
          {(id, describedBy, invalid) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              invalid={invalid}
              icon={AlignLeft}
              type="text"
              {...register('title')}
              placeholder="Məs: Fevral Ayı Sınaq İmtahanı"
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
                      ...groups.map(g => ({ label: g.name, value: g._id }))
                    ]}
                    error={!!errors.group}
                  />
                )}
              />
            )}
          </FormField>

          <FormField label={t('exams.type')} error={errors.type?.message}>
            {() => (
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={[
                      { label: t('exams.practice'), value: 'practice' },
                      { label: t('exams.midterm'), value: 'midterm' },
                      { label: t('exams.final'), value: 'final' },
                    ]}
                  />
                )}
              />
            )}
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label={t('exams.date')} error={errors.date?.message}>
            {(id, describedBy, invalid) => (
              <Input id={id} aria-describedby={describedBy} invalid={invalid} icon={CalendarIcon} type="date" {...register('date')} />
            )}
          </FormField>
          <FormField label={t('exams.time')} error={errors.time?.message}>
            {(id, describedBy, invalid) => (
              <Input id={id} aria-describedby={describedBy} invalid={invalid} icon={Clock} type="time" {...register('time')} />
            )}
          </FormField>
        </div>

        <FormField label={`${t('exams.duration')} (${t('exams.minute')})`} error={errors.duration?.message}>
          {(id, describedBy, invalid) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              invalid={invalid}
              icon={Clock}
              type="number"
              {...register('duration')}
              placeholder={t('exams.durationPlaceholder')}
            />
          )}
        </FormField>

        <FormField label={t('exams.infoOptional')}>
          {(id) => (
            <Textarea id={id} rows={3} {...register('description')} placeholder={t('exams.notesPlaceholder')} />
          )}
        </FormField>

        <QuestionEditor
          ns="exams"
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

export default ExamModal;
