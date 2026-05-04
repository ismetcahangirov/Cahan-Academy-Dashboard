import { useState } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { 
  Plus, Search, MoreVertical, Calendar, 
  Users, FileText
} from 'lucide-react';
import { 
  useGetClassworksQuery, 
} from '../../features/classworks/classworksApi';
import { useGetGroupsQuery } from '../../features/groups/groupsApi';
import { selectCurrentUser } from '../../features/auth/authSlice';
import { format } from 'date-fns';

const Classworks = () => {
  const user = useSelector(selectCurrentUser);
  const [selectedGroup, setSelectedGroup] = useState('');
  
  const { data: classworksResponse, isLoading } = useGetClassworksQuery(selectedGroup || undefined);
  const { data: groupsResponse } = useGetGroupsQuery();
  
  const classworks = classworksResponse || [];
  const groups = groupsResponse?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Sinif İşləri</h1>
          <p className="text-gray-400 mt-1">
            Dərs zamanı yerinə yetirilən tapşırıqlar
          </p>
        </div>

        {['admin', 'teacher'].includes(user.role) && (
          <button className="flex items-center gap-2 px-4 py-2 bg-bordo/80 text-white rounded-lg hover:bg-bordo transition-colors">
            <Plus size={20} />
            <span>Yeni Sinif İşi</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Sinif işi axtar..."
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
          {classworks.map((cw) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={cw._id}
              className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/[0.07] transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-white line-clamp-1">{cw.title}</h3>
                <button className="text-gray-400 hover:text-white transition-colors">
                  <MoreVertical size={20} />
                </button>
              </div>
              
              <p className="text-gray-400 mb-6 line-clamp-2 text-sm">{cw.description}</p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm text-gray-300">
                  <Users size={16} className="text-bordo" />
                  <span>Qrup: {cw.group?.name || 'Bilinmir'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-300">
                  <Calendar size={16} className="text-bordo" />
                  <span>Tarix: {format(new Date(cw.date), 'dd MMM yyyy')}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <button className="w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm font-medium">
                  Detallara Bax
                </button>
              </div>
            </motion.div>
          ))}
          
          {classworks.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-400">
              <FileText size={48} className="mb-4 opacity-50" />
              <p>Hələ ki sinif işi yoxdur</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Classworks;
