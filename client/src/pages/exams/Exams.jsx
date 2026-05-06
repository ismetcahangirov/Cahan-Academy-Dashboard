import { useState } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { 
  Plus, Search, MoreVertical, Clock, 
  Users, HelpCircle, PenTool, Calendar
} from 'lucide-react';
import { 
  useGetExamsQuery, 
  useDeleteExamMutation 
} from '../../features/exams/examsApi';
import { useGetGroupsQuery } from '../../features/groups/groupsApi';
import { selectCurrentUser } from '../../features/auth/authSlice';
import ExamModal from './ExamModal';
import ExamResultsModal from './ExamResultsModal';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const Exams = () => {
  const { t } = useTranslation();
  const user = useSelector(selectCurrentUser);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals state
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [examToEdit, setExamToEdit] = useState(null);
  
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);
  const [examForResults, setExamForResults] = useState(null);

  const { data: examsResponse, isLoading } = useGetExamsQuery({
    groupId: selectedGroup || undefined
  });
  const { data: groupsResponse } = useGetGroupsQuery();
  const [deleteExam] = useDeleteExamMutation();
  
  const exams = examsResponse?.data || examsResponse || [];
  const groups = groupsResponse?.data || [];

  const filteredExams = Array.isArray(exams) ? exams.filter(exam => 
    exam.title?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const handleCreate = () => {
    setExamToEdit(null);
    setIsExamModalOpen(true);
  };

  const handleEdit = (exam) => {
    setExamToEdit(exam);
    setIsExamModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm(t('exams.deleteConfirm'))) {
      try {
        await deleteExam(id).unwrap();
        toast.success(t('exams.deleteSuccess'));
      } catch (err) {
        toast.error(err.data?.message || t('students.error'));
      }
    }
  };

  const handleOpenResults = (exam) => {
    setExamForResults(exam);
    setIsResultsModalOpen(true);
  };

  const formatExamType = (type) => {
    const types = {
      midterm: t('exams.midterm'),
      final: t('exams.final'),
      practice: t('exams.practice')
    };
    return types[type] || type;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">{t('exams.title')}</h1>
          <p className="text-[var(--muted-foreground)] mt-1">
            {t('exams.subtitle')}
          </p>
        </div>

        {['admin', 'teacher'].includes(user.role) && (
          <button 
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-bordo/80 text-white rounded-lg hover:bg-bordo transition-colors"
          >
            <Plus size={20} />
            <span>{t('exams.addNew')}</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" size={20} />
          <input
            type="text"
            placeholder={t('exams.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[var(--input)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-bordo transition-colors"
          />
        </div>
        
        {['admin', 'teacher'].includes(user.role) && (
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="w-full px-4 py-2 bg-[var(--input)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-bordo transition-colors"
          >
            <option value="" className="bg-[var(--card)]">{t('exams.allGroups')}</option>
            {groups.map(group => (
              <option key={group._id} value={group._id} className="bg-[var(--card)]">{group.name}</option>
            ))}
          </select>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-bordo border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExams.map((exam) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={exam._id}
              className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 hover:bg-[var(--muted)]/20 transition-all group flex flex-col h-full relative shadow-sm"
            >
              {['admin', 'teacher'].includes(user.role) && (
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                  <button 
                    onClick={handleEdit}
                    className="p-1.5 bg-blue-500/20 text-blue-400 hover:bg-blue-500/40 rounded-lg transition-colors"
                  >
                    {t('exams.edit')}
                  </button>
                  <button 
                    onClick={() => handleDelete(exam._id)}
                    className="p-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/40 rounded-lg transition-colors"
                  >
                    {t('exams.delete')}
                  </button>
                </div>
              )}

              <div className="flex justify-between items-start mb-4 pr-16">
                <h3 className="text-xl font-bold text-[var(--foreground)] line-clamp-2">{exam.title}</h3>
              </div>
              
              <p className="text-[var(--muted-foreground)] mb-6 line-clamp-2 text-sm flex-grow">{exam.description || t('exams.noDescription')}</p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm text-[var(--muted-foreground)]/80">
                  <Users size={16} className="text-bordo" />
                  <span>{t('common.group')}: {exam.group?.name || t('common.unknown')}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-[var(--muted-foreground)]/80">
                  <Calendar size={16} className="text-bordo" />
                  <span>{t('schedule.date')}: {new Date(exam.date).toLocaleDateString(t('common.locale') === 'az' ? 'az-AZ' : t('common.locale') === 'ru' ? 'ru-RU' : 'en-US')} {new Date(exam.date).toLocaleTimeString(t('common.locale') === 'az' ? 'az-AZ' : t('common.locale') === 'ru' ? 'ru-RU' : 'en-US', {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-[var(--muted-foreground)]/80">
                  <Clock size={16} className="text-bordo" />
                  <span>{t('exams.duration')}: {exam.duration} {t('exams.minute')}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-[var(--muted-foreground)]/80">
                  <HelpCircle size={16} className="text-bordo" />
                  <span>{t('exams.type')}: {formatExamType(exam.type)}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between mt-auto">
                {user.role === 'student' ? (
                  <div className="w-full flex items-center justify-between">
                    {exam.results && exam.results.length > 0 ? (
                      <div className="text-sm font-medium text-green-400 bg-green-400/10 px-3 py-1.5 rounded-lg flex items-center gap-2">
                        <PenTool size={16} />
                        {t('exams.result')}: {exam.results[0].score}/100
                      </div>
                    ) : (
                      <div className="text-sm text-[var(--muted-foreground)] italic">{t('exams.noResult')}</div>
                    )}
                  </div>
                ) : (
                  <button 
                    onClick={() => handleOpenResults(exam)}
                    className="w-full flex justify-center items-center gap-2 py-2 bg-[var(--muted)]/50 hover:bg-[var(--muted)] text-[var(--foreground)] rounded-lg transition-colors text-sm font-medium"
                  >
                    {t('exams.manageResults')} ({exam.results?.length || 0})
                  </button>
                )}
              </div>
            </motion.div>
          ))}
          
          {filteredExams.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-[var(--muted-foreground)]">
              <PenTool size={48} className="mb-4 opacity-50" />
              <p>{t('exams.noExams')}</p>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {isExamModalOpen && (
        <ExamModal 
          isOpen={isExamModalOpen} 
          onClose={() => setIsExamModalOpen(false)} 
          exam={examToEdit} 
        />
      )}

      {isResultsModalOpen && examForResults && (
        <ExamResultsModal 
          isOpen={isResultsModalOpen} 
          onClose={() => setIsResultsModalOpen(false)} 
          exam={examForResults} 
        />
      )}
    </div>
  );
};

export default Exams;
