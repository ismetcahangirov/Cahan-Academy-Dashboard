import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Lock, 
  CheckCircle2, 
  Loader2, 
  ShieldCheck,
  ChevronRight,
  GraduationCap
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const AcceptInvitation = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [isLoading, setIsLoading] = useState(false);
  const [invitationData, setInvitationData] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/invitations/verify/${token}`);
        setInvitationData(res.data);
        setFormData(prev => ({ ...prev, name: res.data.name || '' }));
      } catch (err) {
        toast.error(t('invitations.invalidToken'));
        navigate('/login');
      }
    };
    if (token) verifyToken();
  }, [token, navigate, t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return toast.error(t('auth.passwordsDoNotMatch'));
    }

    setIsLoading(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/invitations/accept`, {
        token,
        name: formData.name,
        password: formData.password
      });
      toast.success(t('invitations.acceptSuccess'));
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || t('invitations.error'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!invitationData) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="animate-spin text-bordo" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 md:p-8 font-sans selection:bg-bordo selection:text-white">
      {/* Decorative Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-bordo/5 rounded-full blur-[120px]"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[480px] relative z-10"
      >
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-[40px] p-8 md:p-12 shadow-2xl shadow-black/5 backdrop-blur-sm">
          <div className="mb-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-bordo/5 border border-bordo/10 mb-6">
              <ShieldCheck size={16} className="text-bordo" />
              <span className="text-[10px] font-black text-bordo uppercase tracking-[0.2em]">{t('invitations.welcome')}</span>
            </div>
            <h1 className="text-4xl font-black text-[var(--foreground)] tracking-tight mb-3">
              {t('invitations.completeRegistration')}
            </h1>
            <p className="text-[var(--muted-foreground)]/60 text-sm leading-relaxed max-w-[280px] mx-auto font-medium">
              {t('invitations.invitedAs')} <span className="text-bordo font-black uppercase tracking-widest">{invitationData.role}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-bold text-[var(--muted-foreground)]/80 ml-1">
                {t('auth.fullName')}
              </label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]/30 group-focus-within:text-bordo transition-colors">
                  <User size={20} />
                </div>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[var(--input)] border border-[var(--border)] rounded-[22px] py-4.5 pl-14 pr-6 text-[var(--foreground)] text-sm font-bold focus:outline-none focus:border-bordo/50 focus:ring-4 focus:ring-bordo/5 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-[var(--muted-foreground)]/80 ml-1">
                {t('auth.email')}
              </label>
              <div className="relative">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]/20">
                  <Mail size={20} />
                </div>
                <input
                  type="email"
                  disabled
                  value={invitationData.email}
                  className="w-full bg-[var(--muted)]/30 border border-[var(--border)] rounded-[22px] py-4.5 pl-14 pr-6 text-[var(--muted-foreground)]/40 text-sm font-bold cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-[var(--muted-foreground)]/80 ml-1">
                {t('auth.password')}
              </label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]/30 group-focus-within:text-bordo transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-[var(--input)] border border-[var(--border)] rounded-[22px] py-4.5 pl-14 pr-6 text-[var(--foreground)] text-sm font-bold focus:outline-none focus:border-bordo/50 focus:ring-4 focus:ring-bordo/5 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-[var(--muted-foreground)]/80 ml-1">
                {t('auth.confirmPassword')}
              </label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]/30 group-focus-within:text-bordo transition-colors">
                  <CheckCircle2 size={18} />
                </div>
                <input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full bg-[var(--input)] border border-[var(--border)] rounded-[22px] py-4.5 pl-14 pr-6 text-[var(--foreground)] text-sm font-bold focus:outline-none focus:border-bordo/50 focus:ring-4 focus:ring-bordo/5 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-bordo hover:bg-bordo/90 text-white py-5 rounded-[22px] font-black text-sm tracking-wider transition-all shadow-xl shadow-bordo/20 hover:shadow-bordo/40 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mt-4"
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  {t('invitations.joinNow')}
                  <ChevronRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-8 flex flex-col items-center gap-4">
          <p className="text-[10px] font-black text-[var(--muted-foreground)]/20 uppercase tracking-[0.3em]">
            © {new Date().getFullYear()} Cahan Academy
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default AcceptInvitation;
