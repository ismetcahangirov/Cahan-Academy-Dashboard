import { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  Plus, Search, MoreVertical, Clock,
  Users, HelpCircle, Trophy, Pencil, Trash2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  useGetQuizzesQuery,
  useDeleteQuizMutation,
} from '../../features/quizzes/quizzesApi';
import { useGetGroupsQuery } from '../../features/groups/groupsApi';
import { selectCurrentUser } from '../../features/auth/authSlice';
import Select from '../../components/common/Select';
import Spinner from '../../components/common/Spinner';
import QuizModal from './QuizModal';
import toast from 'react-hot-toast';

// ─── Dropdown menu per quiz card ────────────────────────────────────────────
const QuizDropdown = ({ quiz, onEdit, onDelete }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((p) => !p); }}
        className="text-[var(--muted-foreground)]/40 hover:text-[var(--foreground)] transition-colors p-1 rounded-lg hover:bg-[var(--muted)]/50"
      >
        <MoreVertical size={20} />
      </button>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute right-0 top-8 z-20 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-lg overflow-hidden min-w-[140px]"
        >
          <button
            onClick={() => { setOpen(false); onEdit(quiz); }}
            className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-[var(--foreground)] hover:bg-[var(--muted)]/50 transition-colors"
          >
            <Pencil size={14} className="text-bordo" />
            {t('quizzes.edit')}
          </button>
          <button
            onClick={() => { setOpen(false); onDelete(quiz); }}
            className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 size={14} />
            {t('quizzes.delete')}
          </button>
        </motion.div>
      )}
    </div>
  );
};

// ─── Main Page ───────────────────────────────────────────────────────────────
const Quizzes = () => {
  const { t } = useTranslation();
  const user = useSelector(selectCurrentUser);

  const [selectedGroup, setSelectedGroup] = useState('');
  const [searchTerm, setSearchTerm]       = useState('');
  const [modalOpen, setModalOpen]         = useState(false);
  const [editingQuiz, setEditingQuiz]     = useState(null);

  const { data: quizzesResponse, isLoading } = useGetQuizzesQuery(selectedGroup || undefined);
  const { data: groupsResponse }             = useGetGroupsQuery();
  const [deleteQuiz]                         = useDeleteQuizMutation();

  const quizzes = (quizzesResponse || []).filter((q) =>
    q.title?.toLowerCase().includes(searchTerm.toLowerCase()),
  );
  const groups = groupsResponse?.data || [];

  const isAdminOrTeacher = ['admin', 'teacher'].includes(user.role);

  const handleOpenCreate = () => {
    setEditingQuiz(null);
    setModalOpen(true);
  };

  const handleEdit = (quiz) => {
    setEditingQuiz(quiz);
    setModalOpen(true);
  };

  const handleDelete = async (quiz) => {
    if (!window.confirm(t('quizzes.deleteConfirm'))) return;
    try {
      await deleteQuiz(quiz._id).unwrap();
      toast.success(t('quizzes.deleteSuccess'));
    } catch {
      toast.error(t('common.error'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">{t('quizzes.title')}</h1>
          <p className="text-[var(--muted-foreground)] mt-1">{t('quizzes.subtitle')}</p>
        </div>

        {isAdminOrTeacher && (
          <button
            id="quiz-add-new-btn"
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-bordo/80 text-white rounded-lg hover:bg-bordo transition-colors"
          >
            <Plus size={20} />
            <span>{t('quizzes.addNew')}</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]/40"
            size={20}
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('quizzes.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2 bg-[var(--input)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/40 focus:outline-none focus:border-bordo transition-colors"
          />
        </div>

        {isAdminOrTeacher && (
          <div className="w-full md:w-64">
            <Select
              value={selectedGroup}
              onChange={setSelectedGroup}
              options={[
                { label: t('exams.allGroups'), value: '' },
                ...groups.map((group) => ({ label: group.name, value: group._id })),
              ]}
            />
          </div>
        )}
      </div>

      {/* Quiz Cards */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={quiz._id}
              className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 hover:bg-[var(--muted)]/50 transition-all group"
            >
              {/* Card Header */}
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-[var(--foreground)] line-clamp-1">
                  {quiz.title}
                </h3>
                {isAdminOrTeacher && (
                  <QuizDropdown quiz={quiz} onEdit={handleEdit} onDelete={handleDelete} />
                )}
              </div>

              <p className="text-[var(--muted-foreground)] mb-6 line-clamp-2 text-sm">
                {quiz.description}
              </p>

              {/* Meta info */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm text-[var(--muted-foreground)]">
                  <Users size={16} className="text-bordo" />
                  <span>
                    {t('common.group')}: {quiz.group?.name || t('common.unknown')}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-[var(--muted-foreground)]">
                  <Clock size={16} className="text-bordo" />
                  <span>
                    {t('quizzes.duration')}:{' '}
                    {t('quizzes.minutes', { count: quiz.timeLimit })}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-[var(--muted-foreground)]">
                  <HelpCircle size={16} className="text-bordo" />
                  <span>
                    {t('quizzes.questions')}: {quiz.questions?.length || 0}
                  </span>
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between">
                {user.role === 'student' ? (
                  <button className="w-full flex items-center justify-center gap-2 py-2 bg-bordo/20 hover:bg-bordo/40 text-[var(--foreground)] rounded-lg transition-colors text-sm font-medium">
                    <Trophy size={16} />
                    <span>{t('quizzes.startNow')}</span>
                  </button>
                ) : (
                  <div className="flex items-center justify-between w-full">
                    <div className="text-sm text-[var(--muted-foreground)]">
                      <span className="text-[var(--foreground)] font-medium">
                        {t('quizzes.attemptsCount', { count: quiz.attempts?.length || 0 })}
                      </span>
                    </div>
                    <button className="px-4 py-2 bg-[var(--muted)] hover:bg-[var(--muted)]/80 text-[var(--foreground)] rounded-lg transition-colors text-sm font-medium">
                      {t('quizzes.resultsBtn')}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {quizzes.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-[var(--muted-foreground)]/40">
              <HelpCircle size={48} className="mb-4 opacity-50" />
              <p>{t('quizzes.noQuizzes')}</p>
            </div>
          )}
        </div>
      )}

      {/* Quiz Modal */}
      <QuizModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingQuiz(null); }}
        quiz={editingQuiz}
      />
    </div>
  );
};

export default Quizzes;
