import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Send, 
  X, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Plus,
  Trash2,
  UserCheck,
  Calendar,
  GraduationCap
} from 'lucide-react';
import { 
  useGetInvitationsQuery, 
  useSendInvitationMutation, 
  useDeleteInvitationMutation 
} from '../../features/invitations/invitationsApi';
import { toast } from 'react-hot-toast';
import { cn } from '../../lib/utils';
import { useTranslation } from 'react-i18next';

const getStatusConfig = (status, t) => {
  switch (status) {
    case 'pending': return { cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: <Clock size={12} />, label: t('invitations.statusPending') };
    case 'accepted': return { cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: <CheckCircle size={12} />, label: t('invitations.statusAccepted') };
    case 'expired': return { cls: 'bg-red-500/10 text-red-400 border-red-500/20', icon: <AlertCircle size={12} />, label: t('invitations.statusExpired') };
    case 'cancelled': return { cls: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20', icon: <XCircle size={12} />, label: t('invitations.statusCancelled') };
    default: return { cls: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20', icon: null, label: status };
  }
};

const Invitations = () => {
  const { t, i18n } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ email: '', role: 'student' });

  const { data, isLoading } = useGetInvitationsQuery();
  const [sendInvitation, { isLoading: isSending }] = useSendInvitationMutation();
  const [deleteInvitation] = useDeleteInvitationMutation();

  const handleSend = async (e) => {
    e.preventDefault();
    try {
      await sendInvitation(formData).unwrap();
      toast.success(t('invitations.sendSuccess'));
      setIsModalOpen(false);
      setFormData({ email: '', role: 'student' });
    } catch (error) {
      toast.error(error.data?.message || t('students.error'));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(t('invitations.deleteConfirm'))) {
      try {
        await deleteInvitation(id).unwrap();
        toast.success(t('invitations.deleteSuccess'));
      } catch {
        toast.error(t('students.error'));
      }
    }
  };

  return (
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">{t('invitations.title')}</h1>
          <p className="text-[var(--muted-foreground)]/60 text-sm mt-1">{t('invitations.subtitle')}</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-bordo hover:bg-bordo/90 text-white px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-bordo/20 font-medium text-sm shrink-0"
        >
          <Plus size={18} />
          {t('invitations.addNew')}
        </button>
      </div>

      {/* Table */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]/20">
                <th className="px-6 py-4 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">{t('invitations.tableEmail')}</th>
                <th className="px-6 py-4 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">{t('invitations.tableRole')}</th>
                <th className="px-6 py-4 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">{t('invitations.tableStatus')}</th>
                <th className="px-6 py-4 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">{t('invitations.tableInvitedBy')}</th>
                <th className="px-6 py-4 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">{t('invitations.tableExpiresAt')}</th>
                <th className="px-6 py-4 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider text-right">{t('invitations.tableActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {isLoading ? (
                Array(5).fill(0).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 w-48 bg-[var(--muted)] rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-20 bg-[var(--muted)] rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-6 w-24 bg-[var(--muted)] rounded-full"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-32 bg-[var(--muted)] rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-24 bg-[var(--muted)] rounded"></div></td>
                    <td className="px-6 py-4"></td>
                  </tr>
                ))
              ) : data?.data?.length > 0 ? (
                data.data.map((inv) => {
                  const statusConfig = getStatusConfig(inv.status, t);
                  return (
                    <motion.tr
                      key={inv._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="group hover:bg-[var(--muted)]/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[var(--muted)] border border-[var(--border)] flex items-center justify-center text-[var(--muted-foreground)]/40">
                            <Mail size={15} />
                          </div>
                          <span className="font-medium text-[var(--foreground)] text-sm">{inv.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          'px-2.5 py-0.5 rounded-full text-xs font-medium border',
                          inv.role === 'teacher'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        )}>
                          {inv.role === 'teacher' ? t('common.teacher') : t('common.student')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border', statusConfig.cls)}>
                          {statusConfig.icon}
                          <span>{statusConfig.label}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[var(--muted-foreground)] text-sm">{inv.invitedBy?.name || t('common.admin')}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-[var(--muted-foreground)] text-sm">
                          <Calendar size={13} />
                          {new Date(inv.expiresAt).toLocaleDateString(i18n.language === 'az' ? 'az-AZ' : i18n.language === 'ru' ? 'ru-RU' : 'en-US')}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {inv.status === 'pending' && (
                          <button
                            onClick={() => handleDelete(inv._id)}
                            className="p-2 text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-[var(--muted-foreground)]/40">
                      <Mail size={40} className="mb-2 opacity-20" />
                      <p>{t('invitations.noInvitations')}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Invitation Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="fixed inset-0 bg-background/60 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden z-10"
            >
              <div className="flex items-center justify-between p-6 border-b border-[var(--border)] bg-[var(--muted)]/20">
                <h2 className="text-xl font-semibold text-[var(--foreground)]">{t('invitations.modalTitle')}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-[var(--muted-foreground)]/40 hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded-lg transition-all"><X size={20} /></button>
              </div>
              <form onSubmit={handleSend} className="p-6 space-y-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--muted-foreground)]/70">{t('invitations.emailLabel')}</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]/20" size={18} />
                    <input
                      required type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder={t('auth.emailPlaceholder')}
                      className="w-full bg-[var(--input)] border border-[var(--border)] rounded-xl py-2.5 pl-10 pr-4 text-[var(--foreground)] text-sm focus:outline-none focus:border-bordo/50 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--muted-foreground)]/70">{t('invitations.roleLabel')}</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: 'teacher' })}
                      className={cn(
                        'flex items-center justify-center gap-2 p-3 rounded-xl border transition-all',
                        formData.role === 'teacher' ? 'border-bordo/50 bg-bordo/10 text-white' : 'border-[var(--border)] bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                      )}
                    >
                      <UserCheck size={18} /><span>{t('common.teacher')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: 'student' })}
                      className={cn(
                        'flex items-center justify-center gap-2 p-3 rounded-xl border transition-all',
                        formData.role === 'student' ? 'border-emerald-500/50 bg-emerald-500/10 text-white' : 'border-[var(--border)] bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                      )}
                    >
                      <GraduationCap size={18} /><span>{t('common.student')}</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border)]">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--muted-foreground)]/60 hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-all">{t('common.cancel')}</button>
                  <button type="submit" disabled={isSending} className="flex items-center gap-2 bg-bordo hover:bg-bordo/90 text-white px-6 py-2 rounded-xl transition-all shadow-lg shadow-bordo/20 font-medium text-sm disabled:opacity-50">
                    <Send size={16} />
                    {isSending ? t('invitations.sendingBtn') : t('invitations.sendBtn')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Invitations;
