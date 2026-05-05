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

const Exams = () => {
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
    if (window.confirm('Bu imtahanı silmək istədiyinizə əminsiniz? Bütün nəticələr də silinəcək.')) {
      try {
        await deleteExam(id).unwrap();
        toast.success('İmtahan uğurla silindi');
      } catch (err) {
        toast.error(err.data?.message || 'İmtahan silinərkən xəta baş verdi');
      }
    }
  };

  const handleOpenResults = (exam) => {
    setExamForResults(exam);
    setIsResultsModalOpen(true);
  };

  const formatExamType = (type) => {
    const types = {
      midterm: 'Aralıq İmtahanı (Midterm)',
      final: 'Yekun İmtahan (Final)',
      practice: 'Sınaq İmtahanı'
    };
    return types[type] || type;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">İmtahanlar</h1>
          <p className="text-gray-400 mt-1">
            Müxtəlif imtahanlar və nəticələr
          </p>
        </div>

        {['admin', 'teacher'].includes(user.role) && (
          <button 
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-bordo/80 text-white rounded-lg hover:bg-bordo transition-colors"
          >
            <Plus size={20} />
            <span>Yeni İmtahan</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="İmtahan axtar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-bordo transition-colors"
          />
        </div>
        
        {['admin', 'teacher'].includes(user.role) && (
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="w-full px-4 py-2 bg-dark border border-white/10 rounded-lg text-white focus:outline-none focus:border-bordo transition-colors"
          >
            <option value="">Bütün Qruplar</option>
            {groups.map(group => (
              <option key={group._id} value={group._id}>{group.name}</option>
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
              className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/[0.07] transition-all group flex flex-col h-full relative"
            >
              {['admin', 'teacher'].includes(user.role) && (
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                  <button 
                    onClick={() => handleEdit(exam)}
                    className="p-1.5 bg-blue-500/20 text-blue-400 hover:bg-blue-500/40 rounded-lg transition-colors"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(exam._id)}
                    className="p-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/40 rounded-lg transition-colors"
                  >
                    Sil
                  </button>
                </div>
              )}

              <div className="flex justify-between items-start mb-4 pr-16">
                <h3 className="text-xl font-bold text-white line-clamp-2">{exam.title}</h3>
              </div>
              
              <p className="text-gray-400 mb-6 line-clamp-2 text-sm flex-grow">{exam.description || 'Təsvir yoxdur'}</p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm text-gray-300">
                  <Users size={16} className="text-bordo" />
                  <span>Qrup: {exam.group?.name || 'Bilinmir'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-300">
                  <Calendar size={16} className="text-bordo" />
                  <span>Tarix: {new Date(exam.date).toLocaleDateString('az-AZ')} {new Date(exam.date).toLocaleTimeString('az-AZ', {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-300">
                  <Clock size={16} className="text-bordo" />
                  <span>Müddət: {exam.duration} dəqiqə</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-300">
                  <HelpCircle size={16} className="text-bordo" />
                  <span>Növ: {formatExamType(exam.type)}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between mt-auto">
                {user.role === 'student' ? (
                  <div className="w-full flex items-center justify-between">
                    {exam.results && exam.results.length > 0 ? (
                      <div className="text-sm font-medium text-green-400 bg-green-400/10 px-3 py-1.5 rounded-lg flex items-center gap-2">
                        <PenTool size={16} />
                        Nəticə: {exam.results[0].score}/100
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400 italic">Nəticə yoxdur</div>
                    )}
                  </div>
                ) : (
                  <button 
                    onClick={() => handleOpenResults(exam)}
                    className="w-full flex justify-center items-center gap-2 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    Nəticələri İdarə Et ({exam.results?.length || 0})
                  </button>
                )}
              </div>
            </motion.div>
          ))}
          
          {filteredExams.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-400">
              <PenTool size={48} className="mb-4 opacity-50" />
              <p>Hələ ki imtahan yoxdur</p>
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
