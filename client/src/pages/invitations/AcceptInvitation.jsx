import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { useLazyVerifyInvitationQuery } from '../../features/invitations/invitationsApi';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const AcceptInvitation = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [verifyInvitation, { data: verifyData, isLoading: isVerifying, isError }] = useLazyVerifyInvitationQuery();
  
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    confirmPassword: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (token) {
      verifyInvitation(token);
    }
  }, [token, verifyInvitation]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return toast.error('Parollar uyğun gəlmir');
    }

    setIsSubmitting(true);
    try {
      const response = await axios.post(`/api/auth/register-invitation/${token}`, {
        name: formData.name,
        password: formData.password,
      });
      
      toast.success('Qeydiyyat uğurla tamamlandı! İndi daxil ola bilərsiniz.');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Xəta baş verdi');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-bordo" size={48} />
          <p className="text-white/60">Dəvət yoxlanılır...</p>
        </div>
      </div>
    );
  }

  if (isError || !verifyData?.success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 p-8 rounded-3xl max-w-md w-full text-center space-y-6"
        >
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500">
            <AlertCircle size={40} />
          </div>
          <h2 className="text-2xl font-bold text-white">Yanlış və ya bitmiş dəvət</h2>
          <p className="text-white/60">
            Təəssüf ki, bu dəvət linki artıq etibarlı deyil. Zəhmət olmasa adminlə əlaqə saxlayın.
          </p>
          <Link 
            to="/login"
            className="block w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
          >
            Giriş səhifəsinə qayıt
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 bg-bordo rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-bordo/20"
          >
            <ShieldCheck size={40} className="text-white" />
          </motion.div>
          <h2 className="text-3xl font-bold text-white mb-2">Xoş Gəldiniz!</h2>
          <p className="text-white/60">
            Siz Cahan Academy-yə <span className="text-white font-bold">{verifyData.data.role === 'teacher' ? 'müəllim' : 'tələbə'}</span> olaraq dəvət edildiniz.
          </p>
          <p className="text-sm text-white/40 mt-1">{verifyData.data.email}</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-xl"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/70 ml-1">Tam adınız</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-bordo transition-colors" size={20} />
                <input
                  required
                  type="text"
                  placeholder="Ad və Soyad"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white outline-none focus:border-bordo/50 focus:ring-4 focus:ring-bordo/10 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/70 ml-1">Parol təyin edin</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-bordo transition-colors" size={20} />
                <input
                  required
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white outline-none focus:border-bordo/50 focus:ring-4 focus:ring-bordo/10 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/70 ml-1">Parolu təkrarla</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-bordo transition-colors" size={20} />
                <input
                  required
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white outline-none focus:border-bordo/50 focus:ring-4 focus:ring-bordo/10 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-bordo hover:bg-red-700 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-bordo/20 flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <span>Qeydiyyatı Tamamla</span>
                  <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </motion.div>

        <p className="text-center text-white/40 text-sm">
          Cahan Academy &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};

export default AcceptInvitation;
