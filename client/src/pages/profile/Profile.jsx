import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Mail, 
  Camera, 
  Shield, 
  Calendar, 
  GraduationCap,
  Bell,
  Lock,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Save,
  Loader2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUpdateProfileMutation } from '../../features/auth/authApi';
import { setCredentials } from '../../features/auth/authSlice';
import { toast } from 'react-hot-toast';
import { cn } from '../../lib/utils';

const Profile = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.auth);
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();

  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState({
    name: userInfo?.name || '',
    email: userInfo?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const tabs = [
    { id: 'general', label: t('profile.general'), icon: User },
    { id: 'security', label: t('profile.security'), icon: Shield },
    { id: 'notifications', label: t('profile.notifications'), icon: Bell },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (activeTab === 'security' && formData.newPassword !== formData.confirmPassword) {
      return toast.error(t('auth.passwordsDoNotMatch'));
    }

    try {
      const res = await updateProfile({
        name: formData.name,
        email: formData.email,
        ...(activeTab === 'security' && formData.newPassword && {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      }).unwrap();
      
      dispatch(setCredentials({ ...res }));
      toast.success(t('profile.updateSuccess'));
      setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
    } catch (err) {
      toast.error(err?.data?.message || t('profile.errorOccurred'));
    }
  };

  const InfoCard = ({ label, value, icon: Icon }) => (
    <div className="bg-[var(--card)] border border-[var(--border)] p-4 rounded-2xl shadow-sm hover:border-bordo/30 transition-all group">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-[var(--muted)]/50 text-[var(--muted-foreground)] group-hover:text-bordo group-hover:bg-bordo/5 transition-all">
          <Icon size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-black text-[var(--muted-foreground)]/30 uppercase tracking-[0.2em]">{label}</p>
          <p className="text-sm font-bold text-[var(--foreground)] truncate mt-0.5">{value}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header Profile Section */}
      <div className="relative rounded-[40px] bg-[var(--card)] border border-[var(--border)] p-8 md:p-12 overflow-hidden shadow-2xl shadow-black/5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-bordo/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end gap-8">
          <div className="relative group">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-[40px] overflow-hidden ring-4 ring-[var(--background)] shadow-2xl">
              <img 
                src={userInfo?.avatar || `https://ui-avatars.com/api/?name=${userInfo?.name}&background=7B001C&color=fff`} 
                alt={userInfo?.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>
            <button className="absolute -bottom-2 -right-2 p-3 bg-bordo text-white rounded-2xl shadow-xl hover:bg-bordo/90 transition-all hover:scale-110 active:scale-95">
              <Camera size={20} />
            </button>
          </div>

          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{t('profile.activeStatus')}</span>
            </div>
            <h1 className="text-4xl font-black text-[var(--foreground)] tracking-tight mb-2">{userInfo?.name}</h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <div className="flex items-center gap-2 text-[var(--muted-foreground)]/60 text-sm font-bold">
                <Mail size={16} className="text-bordo/50" />
                {userInfo?.email}
              </div>
              <div className="flex items-center gap-2 text-[var(--muted-foreground)]/60 text-sm font-bold">
                <Shield size={16} className="text-bordo/50" />
                {userInfo?.role.toUpperCase()}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 shrink-0 w-full md:w-auto">
            <button className="px-8 py-4 bg-[var(--foreground)] text-[var(--background)] rounded-2xl text-sm font-black tracking-wider hover:opacity-90 transition-all shadow-xl shadow-black/10">
              {t('profile.viewPublic')}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Navigation Tabs */}
        <div className="lg:col-span-3 space-y-2">
          <p className="text-[10px] font-black text-[var(--muted-foreground)]/20 uppercase tracking-[0.3em] mb-4 ml-4">
            {t('profile.accountSettings')}
          </p>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all duration-300 group",
                activeTab === tab.id 
                  ? "bg-bordo text-white shadow-xl shadow-bordo/20 font-bold scale-[1.02]" 
                  : "bg-[var(--card)] border border-[var(--border)] text-[var(--muted-foreground)]/60 hover:text-bordo hover:border-bordo/30"
              )}
            >
              <div className="flex items-center gap-3">
                <tab.icon size={20} className={cn(activeTab === tab.id ? "text-white" : "group-hover:text-bordo")} />
                <span className="text-sm tracking-wide">{tab.label}</span>
              </div>
              <ChevronRight size={16} className={cn(activeTab === tab.id ? "opacity-100" : "opacity-0 group-hover:opacity-100 transition-opacity")} />
            </button>
          ))}
        </div>

        {/* Content Section */}
        <div className="lg:col-span-9">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-[var(--card)] border border-[var(--border)] rounded-[40px] p-8 md:p-10 shadow-2xl shadow-black/5"
            >
              <div className="mb-8">
                <h2 className="text-2xl font-black text-[var(--foreground)] tracking-tight">
                  {tabs.find(t => t.id === activeTab).label}
                </h2>
                <p className="text-[var(--muted-foreground)]/60 text-sm mt-1 font-medium">
                  {t(`profile.${activeTab}Subtitle`)}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                {activeTab === 'general' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-[var(--muted-foreground)]/40 uppercase tracking-widest ml-1">
                        {t('auth.fullName')}
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-[var(--input)] border border-[var(--border)] rounded-2xl py-4 px-6 text-[var(--foreground)] text-sm font-bold focus:outline-none focus:border-bordo/50 focus:ring-4 focus:ring-bordo/5 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-[var(--muted-foreground)]/40 uppercase tracking-widest ml-1">
                        {t('auth.email')}
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-[var(--input)] border border-[var(--border)] rounded-2xl py-4 px-6 text-[var(--foreground)] text-sm font-bold focus:outline-none focus:border-bordo/50 focus:ring-4 focus:ring-bordo/5 transition-all"
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'security' && (
                  <div className="space-y-6">
                    <div className="p-6 bg-bordo/5 rounded-3xl border border-bordo/10 flex gap-4">
                      <AlertCircle className="text-bordo shrink-0" size={24} />
                      <div>
                        <p className="text-sm font-bold text-bordo">{t('profile.securityNotice')}</p>
                        <p className="text-xs text-bordo/60 mt-1 leading-relaxed">{t('profile.securityNoticeDesc')}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-[var(--muted-foreground)]/40 uppercase tracking-widest ml-1">
                          {t('profile.currentPassword')}
                        </label>
                        <input
                          type="password"
                          value={formData.currentPassword}
                          onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                          className="w-full bg-[var(--input)] border border-[var(--border)] rounded-2xl py-4 px-6 text-[var(--foreground)] text-sm font-bold focus:outline-none focus:border-bordo/50"
                          placeholder="••••••••"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-[var(--muted-foreground)]/40 uppercase tracking-widest ml-1">
                          {t('profile.newPassword')}
                        </label>
                        <input
                          type="password"
                          value={formData.newPassword}
                          onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                          className="w-full bg-[var(--input)] border border-[var(--border)] rounded-2xl py-4 px-6 text-[var(--foreground)] text-sm font-bold focus:outline-none focus:border-bordo/50"
                          placeholder="••••••••"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-[var(--muted-foreground)]/40 uppercase tracking-widest ml-1">
                          {t('profile.confirmNewPassword')}
                        </label>
                        <input
                          type="password"
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                          className="w-full bg-[var(--input)] border border-[var(--border)] rounded-2xl py-4 px-6 text-[var(--foreground)] text-sm font-bold focus:outline-none focus:border-bordo/50"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-4 pt-6 border-t border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="px-8 py-4 rounded-2xl text-sm font-bold text-[var(--muted-foreground)]/60 hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-all"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    disabled={isLoading}
                    type="submit"
                    className="flex items-center gap-3 bg-bordo hover:bg-bordo/90 text-white px-10 py-4 rounded-2xl font-black text-sm tracking-wider transition-all shadow-xl shadow-bordo/20 hover:shadow-bordo/40 active:scale-95 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <>
                        <Save size={20} />
                        {t('profile.saveChanges')}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </AnimatePresence>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <InfoCard label={t('profile.joinedOn')} value="March 12, 2024" icon={Calendar} />
            <InfoCard label={t('profile.userRole')} value={userInfo?.role} icon={Shield} />
            <InfoCard label={t('profile.completedCourses')} value="14 Courses" icon={GraduationCap} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
