import { useState } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { 
  Plus, Search, MoreVertical, Clock, 
  Users, HelpCircle, Trophy
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { 
  useGetQuizzesQuery, 
} from '../../features/quizzes/quizzesApi';
import { useGetGroupsQuery } from '../../features/groups/groupsApi';
import { selectCurrentUser } from '../../features/auth/authSlice';

const Quizzes = () => {
  const { t } = useTranslation();
  const user = useSelector(selectCurrentUser);
  const [selectedGroup, setSelectedGroup] = useState('');
  
  const { data: quizzesResponse, isLoading } = useGetQuizzesQuery(selectedGroup || undefined);
  const { data: groupsResponse } = useGetGroupsQuery();
  
  const quizzes = quizzesResponse || [];
  const groups = groupsResponse?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('quizzes.title')}</h1>
          <p className="text-gray-400 mt-1">
            {t('quizzes.subtitle')}
          </p>
        </div>

        {['admin', 'teacher'].includes(user.role) && (
          <button className="flex items-center gap-2 px-4 py-2 bg-bordo/80 text-white rounded-lg hover:bg-bordo transition-colors">
            <Plus size={20} />
            <span>{t('quizzes.addNew')}</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder={t('quizzes.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-bordo transition-colors"
          />
        </div>
        
        {['admin', 'teacher'].includes(user.role) && (
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="w-full px-4 py-2 bg-dark border border-white/10 rounded-lg text-white focus:outline-none focus:border-bordo transition-colors"
          >
            <option value="">{t('exams.allGroups')}</option>
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
          {quizzes.map((quiz) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={quiz._id}
              className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/[0.07] transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-white line-clamp-1">{quiz.title}</h3>
                <button className="text-gray-400 hover:text-white transition-colors">
                  <MoreVertical size={20} />
                </button>
              </div>
              
              <p className="text-gray-400 mb-6 line-clamp-2 text-sm">{quiz.description}</p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm text-gray-300">
                  <Users size={16} className="text-bordo" />
                  <span>{t('common.group')}: {quiz.group?.name || t('common.unknown')}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-300">
                  <Clock size={16} className="text-bordo" />
                  <span>{t('quizzes.duration')}: {t('quizzes.minutes', { count: quiz.timeLimit })}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-300">
                  <HelpCircle size={16} className="text-bordo" />
                  <span>{t('quizzes.questions')}: {quiz.questions?.length || 0}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                {user.role === 'student' ? (
                  <button className="w-full flex items-center justify-center gap-2 py-2 bg-bordo/20 hover:bg-bordo/40 text-white rounded-lg transition-colors text-sm font-medium">
                    <Trophy size={16} />
                    <span>{t('quizzes.startNow')}</span>
                  </button>
                ) : (
                  <div className="flex items-center justify-between w-full">
                    <div className="text-sm text-gray-400">
                      <span className="text-white font-medium">{t('quizzes.attemptsCount', { count: quiz.attempts?.length || 0 })}</span>
                    </div>
                    <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm font-medium">
                      {t('quizzes.resultsBtn')}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          
          {quizzes.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-400">
              <HelpCircle size={48} className="mb-4 opacity-50" />
              <p>{t('quizzes.noQuizzes')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Quizzes;
