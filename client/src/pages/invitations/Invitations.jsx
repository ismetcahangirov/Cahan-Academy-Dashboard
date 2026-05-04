import React, { useState } from 'react';
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
  Calendar
} from 'lucide-react';
import { 
  useGetInvitationsQuery, 
  useSendInvitationMutation, 
  useDeleteInvitationMutation 
} from '../../features/invitations/invitationsApi';
import { toast } from 'react-hot-toast';

const Invitations = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ email: '', role: 'student' });

  const { data, isLoading, refetch } = useGetInvitationsQuery();
  const [sendInvitation, { isLoading: isSending }] = useSendInvitationMutation();
  const [deleteInvitation] = useDeleteInvitationMutation();

  const handleSend = async (e) => {
    e.preventDefault();
    try {
      await sendInvitation(formData).unwrap();
      toast.success('Dəvət uğurla göndərildi');
      setIsModalOpen(false);
      setFormData({ email: '', role: 'student' });
    } catch (error) {
      toast.error(error.data?.message || 'Xəta baş verdi');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bu dəvəti ləğv etmək istədiyinizə əminsiniz?')) {
      try {
        await deleteInvitation(id).unwrap();
        toast.success('Dəvət ləğv edildi');
      } catch (error) {
        toast.error('Xəta baş verdi');
      }
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'accepted': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'expired': return 'bg-red-100 text-red-700 border-red-200';
      case 'cancelled': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock size={14} />;
      case 'accepted': return <CheckCircle size={14} />;
      case 'expired': return <AlertCircle size={14} />;
      case 'cancelled': return <XCircle size={14} />;
      default: return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dəvətlər Sistemi</h1>
          <p className="text-slate-500 text-sm">Müəllim və tələbələrə göndərilən qeydiyyat dəvətləri</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-bordo text-white rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-200"
        >
          <Plus size={20} />
          <span>Yeni Dəvət</span>
        </button>
      </div>

      {/* Invitations Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-sm uppercase tracking-wider font-semibold">
                <th className="px-6 py-4">E-poçt</th>
                <th className="px-6 py-4">Rol</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Göndərən</th>
                <th className="px-6 py-4">Bitmə Tarixi</th>
                <th className="px-6 py-4 text-right">Əməliyyat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array(5).fill(0).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 w-48 bg-slate-200 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-20 bg-slate-200 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-16 bg-slate-200 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-32 bg-slate-200 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-24 bg-slate-200 rounded"></div></td>
                    <td className="px-6 py-4"></td>
                  </tr>
                ))
              ) : (
                data?.data?.map((inv) => (
                  <motion.tr
                    key={inv._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                          <Mail size={16} />
                        </div>
                        <span className="font-medium text-slate-700">{inv.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        inv.role === 'teacher' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {inv.role === 'teacher' ? 'Müəllim' : 'Tələbə'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getStatusStyle(inv.status)}`}>
                        {getStatusIcon(inv.status)}
                        <span className="capitalize">{
                          inv.status === 'pending' ? 'Gözləyir' : 
                          inv.status === 'accepted' ? 'Qəbul edildi' : 
                          inv.status === 'expired' ? 'Vaxtı keçib' : 'Ləğv edilib'
                        }</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm">
                      {inv.invitedBy?.name || 'Sistem'}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} />
                        {new Date(inv.expiresAt).toLocaleDateString('az-AZ')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {inv.status === 'pending' && (
                        <button 
                          onClick={() => handleDelete(inv._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))
              )}
              {!isLoading && data?.data?.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                    Hələ heç bir dəvət göndərilməyib
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800">Yeni Dəvət Göndər</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSend} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">E-poçt ünvanı</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      required
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="nümunə@email.com"
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-bordo transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Rol seçin</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: 'teacher' })}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                        formData.role === 'teacher' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      <UserCheck size={18} />
                      <span>Müəllim</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: 'student' })}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                        formData.role === 'student' ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      <GraduationCap size={18} />
                      <span>Tələbə</span>
                    </button>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all"
                  >
                    Ləğv et
                  </button>
                  <button
                    type="submit"
                    disabled={isSending}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-bordo text-white rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-200 disabled:opacity-50"
                  >
                    <Send size={18} />
                    <span>{isSending ? 'Göndərilir...' : 'Göndər'}</span>
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
