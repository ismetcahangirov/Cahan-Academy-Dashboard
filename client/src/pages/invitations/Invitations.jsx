import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Search, 
  Filter, 
  Plus, 
  Send, 
  Clock, 
  CheckCircle2, 
  XCircle,
  MoreHorizontal,
  X,
  Trash2,
  RefreshCcw,
  Loader2,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { 
  useGetInvitationsQuery, 
  useInviteUserMutation, 
  useRevokeInvitationMutation,
  useResendInvitationMutation
} from '../../features/invitations/invitationsApi';
import { toast } from 'react-hot-toast';
import { cn } from '../../lib/utils';

const InviteModal = ({ isOpen, onClose, onSubmit, isLoading }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    email: '',
    role: 'student',
    name: ''
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[var(--card)] border border-[var(--border)] rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-8 border-b border-[var(--border)] bg-[var(--muted)]/20">
          <h3 className="text-2xl font-black text-[var(--foreground)] tracking-tight">{t('invitations.newInvitation')}</h3>
          <button onClick={onClose} className="p-2 hover:bg-[var(--muted)] rounded-xl transition-colors">
            <X size={20} className="text-[var(--muted-foreground)]" />
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-[var(--muted-foreground)]/40 uppercase tracking-widest ml-1">{t('auth.fullName')}</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-[var(--input)] border border-[var(--border)] rounded-2xl py-4 px-6 text-[var(--foreground)] text-sm font-bold focus:outline-none focus:border-bordo/50 transition-all"
              placeholder={t('auth.fullNamePlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-[var(--muted-foreground)]/40 uppercase tracking-widest ml-1">{t('auth.email')}</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-[var(--input)] border border-[var(--border)] rounded-2xl py-4 px-6 text-[var(--foreground)] text-sm font-bold focus:outline-none focus:border-bordo/50 transition-all"
              placeholder="example@cahan.edu.az"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-[var(--muted-foreground)]/40 uppercase tracking-widest ml-1">{t('users.role')}</label>
            <div className="grid grid-cols-2 gap-4">
              {['student', 'teacher'].map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setFormData({ ...formData, role })}
                  className={cn(
                    "py-4 rounded-2xl text-sm font-black tracking-widest uppercase transition-all border",
                    formData.role === role 
                      ? "bg-bordo text-white border-bordo shadow-lg shadow-bordo/20" 
                      : "bg-[var(--card)] text-[var(--muted-foreground)]/60 border-[var(--border)] hover:border-bordo/30"
                  )}
                >
                  {t(`common.${role}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 pt-6 mt-4 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-4 rounded-2xl text-sm font-bold text-[var(--muted-foreground)]/60 hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-all"
            >
              {t('common.cancel')}
            </button>
            <button
              disabled={isLoading}
              type="submit"
              className="flex items-center gap-3 bg-bordo hover:bg-bordo/90 text-white px-10 py-4 rounded-2xl font-black text-sm tracking-wider transition-all shadow-xl shadow-bordo/20 hover:shadow-bordo/40 disabled:opacity-50"
            >
              {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
              {t('invitations.sendBtn')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const Invitations = () => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');

  const { data: invitations, isLoading: isTableLoading } = useGetInvitationsQuery({ search });
  const [inviteUser, { isLoading: isInviting }] = useInviteUserMutation();
  const [revokeInvitation] = useRevokeInvitationMutation();
  const [resendInvitation] = useResendInvitationMutation();

  const handleInvite = async (formData) => {
    try {
      await inviteUser(formData).unwrap();
      toast.success(t('invitations.sendSuccess'));
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.data?.message || t('common.error'));
    }
  };

  const handleRevoke = async (id) => {
    if (window.confirm(t('invitations.revokeConfirm'))) {
      try {
        await revokeInvitation(id).unwrap();
        toast.success(t('invitations.revokeSuccess'));
      } catch (err) {
        toast.error(t('common.error'));
      }
    }
  };

  const handleResend = async (id) => {
    try {
      await resendInvitation(id).unwrap();
      toast.success(t('invitations.resendSuccess'));
    } catch (err) {
      toast.error(t('common.error'));
    }
  };

  const StatusBadge = ({ status }) => {
    const configs = {
      pending: { color: 'text-amber-500', bg: 'bg-amber-500/10', icon: Clock, label: t('invitations.status_pending') },
      accepted: { color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: CheckCircle2, label: t('invitations.status_accepted') },
      expired: { color: 'text-red-500', bg: 'bg-red-500/10', icon: XCircle, label: t('invitations.status_expired') }
    };
    const config = configs[status] || configs.pending;
    return (
      <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border", config.bg, config.color, `border-${config.color.split('-')[1]}-500/20`)}>
        <config.icon size={12} />
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-[var(--foreground)] tracking-tight">{t('sidebar.invitations')}</h1>
          <p className="text-[var(--muted-foreground)]/60 text-sm mt-1 font-medium">{t('invitations.subtitle')}</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-bordo hover:bg-bordo/90 text-white px-8 py-4 rounded-2xl transition-all shadow-xl shadow-bordo/20 font-black text-sm hover:-translate-y-0.5 active:translate-y-0"
        >
          <Plus size={22} />
          {t('invitations.newInvitation')}
        </button>
      </div>

      {/* Search & Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className="lg:col-span-8 bg-[var(--card)] border border-[var(--border)] p-4 rounded-[28px] shadow-sm flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]/30 group-focus-within:text-bordo transition-colors" size={20} />
            <input
              type="text"
              placeholder={t('invitations.searchPlaceholder')}
              className="w-full bg-[var(--input)] border border-[var(--border)] rounded-2xl py-3.5 pl-12 pr-4 text-[var(--foreground)] text-sm font-bold focus:outline-none focus:border-bordo/50 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[var(--muted)] border border-[var(--border)] text-[var(--muted-foreground)] text-sm font-bold hover:text-bordo hover:border-bordo/30 transition-all">
            <Filter size={18} />
            {t('common.filter')}
          </button>
        </div>

        <div className="lg:col-span-4 grid grid-cols-2 gap-4">
          <div className="bg-[var(--card)] border border-[var(--border)] p-5 rounded-[28px] shadow-sm">
            <p className="text-[10px] font-black text-[var(--muted-foreground)]/30 uppercase tracking-[0.2em] mb-1">{t('invitations.pending')}</p>
            <p className="text-2xl font-black text-amber-500">{invitations?.filter(i => i.status === 'pending').length || 0}</p>
          </div>
          <div className="bg-[var(--card)] border border-[var(--border)] p-5 rounded-[28px] shadow-sm">
            <p className="text-[10px] font-black text-[var(--muted-foreground)]/30 uppercase tracking-[0.2em] mb-1">{t('invitations.accepted')}</p>
            <p className="text-2xl font-black text-emerald-500">{invitations?.filter(i => i.status === 'accepted').length || 0}</p>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-[40px] shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--muted)]/20 border-b border-[var(--border)]">
                <th className="px-8 py-6 text-[10px] font-black text-[var(--muted-foreground)]/30 uppercase tracking-[0.2em]">{t('auth.fullName')}</th>
                <th className="px-8 py-6 text-[10px] font-black text-[var(--muted-foreground)]/30 uppercase tracking-[0.2em]">{t('auth.email')}</th>
                <th className="px-8 py-6 text-[10px] font-black text-[var(--muted-foreground)]/30 uppercase tracking-[0.2em]">{t('users.role')}</th>
                <th className="px-8 py-6 text-[10px] font-black text-[var(--muted-foreground)]/30 uppercase tracking-[0.2em]">{t('users.status')}</th>
                <th className="px-8 py-6 text-[10px] font-black text-[var(--muted-foreground)]/30 uppercase tracking-[0.2em] text-right">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {isTableLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="5" className="px-8 py-6 h-20 bg-[var(--muted)]/5"></td>
                  </tr>
                ))
              ) : invitations?.length > 0 ? (
                invitations.map((inv) => (
                  <tr key={inv._id} className="group hover:bg-[var(--muted)]/10 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-bordo/5 border border-bordo/10 flex items-center justify-center text-bordo font-black text-sm">
                          {inv.name?.charAt(0) || 'U'}
                        </div>
                        <span className="text-sm font-black text-[var(--foreground)] tracking-tight">{inv.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-sm font-bold text-[var(--muted-foreground)]/60">{inv.email}</td>
                    <td className="px-8 py-6">
                      <span className="text-[10px] font-black text-bordo bg-bordo/5 px-2 py-1 rounded-md border border-bordo/10 uppercase tracking-widest">
                        {inv.role}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {inv.status === 'pending' && (
                          <button
                            onClick={() => handleResend(inv._id)}
                            className="p-2.5 text-emerald-500 hover:bg-emerald-500/5 rounded-xl transition-all"
                            title={t('invitations.resendBtn')}
                          >
                            <RefreshCcw size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => handleRevoke(inv._id)}
                          className="p-2.5 text-red-500 hover:bg-red-500/5 rounded-xl transition-all"
                          title={t('common.delete')}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-20 h-20 bg-[var(--muted)] rounded-[30px] flex items-center justify-center mb-6">
                        <Mail size={40} className="text-[var(--muted-foreground)]/20" />
                      </div>
                      <h3 className="text-xl font-black text-[var(--foreground)] mb-2">{t('invitations.noInvitations')}</h3>
                      <p className="text-sm text-[var(--muted-foreground)]/60">{t('invitations.noInvitationsDesc')}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <InviteModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSubmit={handleInvite}
            isLoading={isInviting}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Invitations;
