import { useState } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, MoreVertical, Calendar, 
  Users, FileText
} from 'lucide-react';
import { 
  useGetHomeworksQuery, 
  useCreateHomeworkMutation,
  useSubmitHomeworkMutation,
  useGradeHomeworkMutation
} from '../../features/homeworks/homeworksApi';
import { useGetGroupsQuery } from '../../features/groups/groupsApi';
import { selectCurrentUser } from '../../features/auth/authSlice';

import { format } from 'date-fns';

const Homeworks = () => {
  const user = useSelector(selectCurrentUser);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState('');
  
  const { data: homeworksResponse, isLoading } = useGetHomeworksQuery(selectedGroup || undefined);
  const { data: groupsResponse } = useGetGroupsQuery();
  
  const homeworks = homeworksResponse || [];
  const groups = groupsResponse?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Ev Tapşırıqları</h1>
          <p className="text-gray-400 mt-1">
            {user.role === 'student' 
              ? 'Aktiv və tamamlanmış tapşırıqlarınız' 
              : 'Qruplar üzrə verilmiş tapşırıqlar'}
          </p>
        </div>

        {['admin', 'teacher'].includes(user.role) && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-bordo/80 text-white rounded-lg hover:bg-bordo transition-colors"
          >
            <Plus size={20} />
            <span>Yeni Tapşırıq</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Tapşırıq axtar..."
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

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-bordo border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {homeworks.map((hw) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={hw._id}
              className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/[0.07] transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-white line-clamp-1">{hw.title}</h3>
                {['admin', 'teacher'].includes(user.role) && (
                  <button className="text-gray-400 hover:text-white transition-colors">
                    <MoreVertical size={20} />
                  </button>
                )}
              </div>
              
              <p className="text-gray-400 mb-6 line-clamp-2 text-sm">{hw.description}</p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm text-gray-300">
                  <Users size={16} className="text-bordo" />
                  <span>Qrup: {hw.group?.name || 'Bilinmir'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-300">
                  <Calendar size={16} className="text-bordo" />
                  <span>Son tarix: {format(new Date(hw.dueDate), 'dd MMM yyyy, HH:mm')}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-300">
                  <FileText size={16} className="text-bordo" />
                  <span>{hw.files?.length || 0} əlavə fayl</span>
                </div>
              </div>

              {/* Action Area based on role */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                {user.role === 'student' ? (
                  <button className="w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm font-medium">
                    Tapşırığa Bax / Təhvil Ver
                  </button>
                ) : (
                  <div className="flex items-center justify-between w-full">
                    <div className="text-sm text-gray-400">
                      <span className="text-white font-medium">{hw.submissions?.length || 0}</span> təhvil
                    </div>
                    <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm font-medium">
                      Yoxla
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          
          {homeworks.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-400">
              <FileText size={48} className="mb-4 opacity-50" />
              <p>Hələ kiç tapşırıq yoxdur</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Homeworks;
