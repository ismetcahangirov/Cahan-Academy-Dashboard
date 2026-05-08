import { useState } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, MoreVertical, Calendar, 
  Users, FileText
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { 
  useGetHomeworksQuery, 
  useCreateHomeworkMutation,
  useSubmitHomeworkMutation,
  useGradeHomeworkMutation
} from '../../features/homeworks/homeworksApi';
import { useGetGroupsQuery } from '../../features/groups/groupsApi';
import { selectCurrentUser } from '../../features/auth/authSlice';
import Select from '../../components/common/Select';
import Spinner from '../../components/common/Spinner';

import { format } from 'date-fns';

const Homeworks = () => {
  const { t } = useTranslation();
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
          <h1 className="text-2xl font-bold text-[var(--foreground)]">{t('homeworks.title')}</h1>
          <p className="text-[var(--muted-foreground)] mt-1">
            {user.role === 'student' 
              ? t('homeworks.studentSubtitle') 
              : t('homeworks.teacherSubtitle')}
          </p>
        </div>

        {['admin', 'teacher'].includes(user.role) && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-bordo/80 text-white rounded-lg hover:bg-bordo transition-colors"
          >
            <Plus size={20} />
            <span>{t('homeworks.addNew')}</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]/40" size={20} />
          <input
            type="text"
            placeholder={t('homeworks.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2 bg-[var(--input)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/40 focus:outline-none focus:border-bordo transition-colors"
          />
        </div>
        
        {['admin', 'teacher'].includes(user.role) && (
          <div className="w-full">
            <Select
              value={selectedGroup}
              onChange={setSelectedGroup}
              options={[
                { label: t('exams.allGroups'), value: '' },
                ...groups.map(group => ({ label: group.name, value: group._id }))
              ]}
            />
          </div>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {homeworks.map((hw) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={hw._id}
              className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 hover:bg-[var(--muted)]/50 transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-[var(--foreground)] line-clamp-1">{hw.title}</h3>
                {['admin', 'teacher'].includes(user.role) && (
                  <button className="text-[var(--muted-foreground)]/40 hover:text-[var(--foreground)] transition-colors">
                    <MoreVertical size={20} />
                  </button>
                )}
              </div>
              
              <p className="text-[var(--muted-foreground)] mb-6 line-clamp-2 text-sm">{hw.description}</p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm text-[var(--muted-foreground)]">
                  <Users size={16} className="text-bordo" />
                  <span>{t('common.group')}: {hw.group?.name || t('common.unknown')}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-[var(--muted-foreground)]">
                  <Calendar size={16} className="text-bordo" />
                  <span>{t('homeworks.dueDate')}: {format(new Date(hw.dueDate), 'dd MMM yyyy, HH:mm')}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-[var(--muted-foreground)]">
                  <FileText size={16} className="text-bordo" />
                  <span>{t('homeworks.attachmentCount', { count: hw.files?.length || 0 })}</span>
                </div>
              </div>

              {/* Action Area based on role */}
              <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between">
                {user.role === 'student' ? (
                  <button className="w-full py-2 bg-[var(--muted)] hover:bg-[var(--muted)]/80 text-[var(--foreground)] rounded-lg transition-colors text-sm font-medium">
                    {t('homeworks.viewAndSubmit')}
                  </button>
                ) : (
                  <div className="flex items-center justify-between w-full">
                    <div className="text-sm text-[var(--muted-foreground)]">
                      <span className="text-[var(--foreground)] font-medium">{t('homeworks.submissionsCount', { count: hw.submissions?.length || 0 })}</span>
                    </div>
                    <button className="px-4 py-2 bg-[var(--muted)] hover:bg-[var(--muted)]/80 text-[var(--foreground)] rounded-lg transition-colors text-sm font-medium">
                      {t('homeworks.checkBtn')}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          
          {homeworks.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-[var(--muted-foreground)]/40">
              <FileText size={48} className="mb-4 opacity-50" />
              <p>{t('homeworks.noHomeworks')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Homeworks;
