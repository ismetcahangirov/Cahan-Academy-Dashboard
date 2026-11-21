import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useGetQuizByIdQuery } from '../../features/quizzes/quizzesApi';
import Avatar from '../../components/common/Avatar';
import Spinner from '../../components/common/Spinner';

const QuizResultsModal = ({ quizId, onClose }) => {
  const { t, i18n } = useTranslation();
  const { data: quiz, isLoading } = useGetQuizByIdQuery(quizId, { refetchOnMountOrArgChange: true });

  const attempts = [...(quiz?.attempts || [])].sort((a, b) => (b.score || 0) - (a.score || 0));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-3xl bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl flex flex-col max-h-[85vh]"
        >
          <div className="flex items-center justify-between gap-4 p-5 border-b border-[var(--border)]">
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-[var(--foreground)] truncate">
                {t('quizzes.resultsTitle')}: {quiz?.title}
              </h2>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">
                {quiz?.group?.name} • {t('quizzes.attemptsCount', { count: attempts.length })}
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label={t('quizzes.close')}
              className="p-2 text-[var(--muted-foreground)]/40 hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-auto custom-scrollbar p-5">
            {isLoading ? (
              <div className="flex justify-center py-12"><Spinner /></div>
            ) : attempts.length === 0 ? (
              <p className="text-center py-12 text-[var(--muted-foreground)]">{t('quizzes.noAttempts')}</p>
            ) : (
              <div className="rounded-xl border border-[var(--border)] overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[480px]">
                  <thead>
                    <tr className="bg-[var(--muted)]/10 text-[var(--muted-foreground)] text-sm border-b border-[var(--border)]">
                      <th className="p-3 font-medium">{t('quizzes.tableStudent')}</th>
                      <th className="p-3 font-medium">{t('quizzes.tableScore')}</th>
                      <th className="p-3 font-medium">{t('quizzes.tableDate')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {attempts.map((attempt) => {
                      const student = typeof attempt.student === 'object' ? attempt.student : null;
                      const percent = attempt.totalPoints > 0
                        ? Math.round((attempt.score / attempt.totalPoints) * 100)
                        : 0;
                      return (
                        <tr key={attempt._id} className="hover:bg-[var(--muted)]/20 transition-colors">
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <Avatar
                                src={student?.avatar}
                                name={student?.name}
                                className="w-8 h-8 rounded-full border border-[var(--border)]"
                                textSize="xs"
                              />
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-[var(--foreground)] truncate">
                                  {student?.name || t('common.unknown')}
                                </div>
                                <div className="text-xs text-[var(--muted-foreground)]/60 truncate">{student?.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-sm text-[var(--foreground)]">
                            {t('quizzes.scoreOf', { score: attempt.score, total: attempt.totalPoints })}
                            <span className="ml-2 text-[var(--muted-foreground)]">({percent}%)</span>
                          </td>
                          <td className="p-3 text-sm text-[var(--muted-foreground)]">
                            {attempt.completedAt
                              ? new Date(attempt.completedAt).toLocaleString(i18n.language, {
                                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                              })
                              : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default QuizResultsModal;
