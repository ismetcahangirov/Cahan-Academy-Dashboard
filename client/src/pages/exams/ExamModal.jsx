import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar as CalendarIcon, Clock, Type, AlignLeft, Users } from 'lucide-react';
import { useCreateExamMutation, useUpdateExamMutation } from '../../features/exams/examsApi';
import { useGetGroupsQuery } from '../../features/groups/groupsApi';
import toast from 'react-hot-toast';

const examSchema = z.object({
  title: z.string().min(3, 'Başlıq ən azı 3 simvol olmalıdır'),
  description: z.string().optional(),
  group: z.string().min(1, 'Qrup seçilməlidir'),
  date: z.string().min(1, 'Tarix seçilməlidir'),
  time: z.string().min(1, 'Saat seçilməlidir'),
  duration: z.string().transform(val => Number(val)).refine(val => val > 0, { message: 'Müddət sıfırdan böyük olmalıdır' }),
  type: z.enum(['midterm', 'final', 'practice']),
});

const ExamModal = ({ isOpen, onClose, exam }) => {
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
    },
  });

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
      };

      if (isEditing) {
        await updateExam({ id: exam._id, data: payload }).unwrap();
        toast.success('İmtahan uğurla yeniləndi');
      } else {
        await createExam(payload).unwrap();
        toast.success('İmtahan uğurla yaradıldı');
      }
      onClose();
    } catch (error) {
      toast.error(error.data?.message || 'Xəta baş verdi');
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
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-lg bg-[#111] border border-white/10 rounded-2xl shadow-2xl p-6 overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">
              {isEditing ? 'İmtahanı Redaktə Et' : 'Yeni İmtahan'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Başlıq
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <AlignLeft size={18} />
                </div>
                <input
                  type="text"
                  {...register('title')}
                  className="w-full pl-10 pr-4 py-2.5 bg-black/50 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-bordo focus:ring-1 focus:ring-bordo transition-all"
                  placeholder="Məs: Fevral Ayı Sınaq İmtahanı"
                />
              </div>
              {errors.title && (
                <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>
              )}
            </div>

            {/* Group */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Qrup
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Users size={18} />
                </div>
                <select
                  {...register('group')}
                  className="w-full pl-10 pr-4 py-2.5 bg-black/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-bordo focus:ring-1 focus:ring-bordo transition-all appearance-none"
                >
                  <option value="">Qrup seçin</option>
                  {!isLoadingGroups && groups.map((g) => (
                    <option key={g._id} value={g._id}>
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
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                İmtahan Növü
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Type size={18} />
                </div>
                <select
                  {...register('type')}
                  className="w-full pl-10 pr-4 py-2.5 bg-black/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-bordo focus:ring-1 focus:ring-bordo transition-all appearance-none"
                >
                  <option value="practice">Sınaq İmtahanı</option>
                  <option value="midterm">Aralıq İmtahanı (Midterm)</option>
                  <option value="final">Yekun İmtahan (Final)</option>
                </select>
              </div>
              {errors.type && (
                <p className="mt-1 text-sm text-red-500">{errors.type.message}</p>
              )}
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Tarix
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <CalendarIcon size={18} />
                  </div>
                  <input
                    type="date"
                    {...register('date')}
                    className="w-full pl-10 pr-4 py-2.5 bg-black/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-bordo focus:ring-1 focus:ring-bordo transition-all"
                  />
                </div>
                {errors.date && (
                  <p className="mt-1 text-sm text-red-500">{errors.date.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Saat
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Clock size={18} />
                  </div>
                  <input
                    type="time"
                    {...register('time')}
                    className="w-full pl-10 pr-4 py-2.5 bg-black/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-bordo focus:ring-1 focus:ring-bordo transition-all"
                  />
                </div>
                {errors.time && (
                  <p className="mt-1 text-sm text-red-500">{errors.time.message}</p>
                )}
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Müddət (dəqiqə)
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Clock size={18} />
                </div>
                <input
                  type="number"
                  {...register('duration')}
                  className="w-full pl-10 pr-4 py-2.5 bg-black/50 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-bordo focus:ring-1 focus:ring-bordo transition-all"
                  placeholder="60"
                />
              </div>
              {errors.duration && (
                <p className="mt-1 text-sm text-red-500">{errors.duration.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Əlavə Məlumat (İstəyə bağlı)
              </label>
              <textarea
                {...register('description')}
                rows={3}
                className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-bordo focus:ring-1 focus:ring-bordo transition-all resize-none"
                placeholder="İmtahan haqqında qeydlər..."
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-white/10 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors font-medium"
              >
                Ləğv et
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-bordo hover:bg-bordo/90 text-white rounded-xl transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  isEditing ? 'Yenilə' : 'Yarat'
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
