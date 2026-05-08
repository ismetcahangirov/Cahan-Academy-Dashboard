import { useState } from 'react';
import { Shield, Key, Bell, Globe } from 'lucide-react';
import { useUpdatePasswordMutation } from '../../features/profile/profileApi';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Spinner from '../../components/common/Spinner';

const Settings = () => {
  const { t, i18n } = useTranslation();
  const [updatePassword, { isLoading: isUpdating }] = useUpdatePasswordMutation();
  const [activeTab, setActiveTab] = useState('security');
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handlePasswordChange = (e) => {
    setPasswordForm(p => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error(t('settings.fillAll'));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t('settings.passMismatch'));
      return;
    }
    if (newPassword.length < 6) {
      toast.error(t('settings.passShort'));
      return;
    }

    try {
      const res = await updatePassword({ currentPassword, newPassword }).unwrap();
      if (res.success) {
        toast.success(res.message || t('settings.passUpdated'));
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      toast.error(err?.data?.message || t('settings.passUpdateError'));
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="text-bordo w-8 h-8" />
        <h1 className="text-2xl font-bold text-[var(--foreground)]">{t('settings.title')}</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 space-y-2">
          <button 
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left ${activeTab === 'security' ? 'bg-bordo text-white' : 'text-[var(--muted-foreground)]/60 hover:bg-[var(--muted)] hover:text-[var(--foreground)]'}`}
          >
            <Key size={18} />
            <span className="font-medium">{t('settings.security')}</span>
          </button>
          <button 
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left ${activeTab === 'notifications' ? 'bg-bordo text-white' : 'text-[var(--muted-foreground)]/60 hover:bg-[var(--muted)] hover:text-[var(--foreground)]'}`}
          >
            <Bell size={18} />
            <span className="font-medium">{t('settings.notifications')}</span>
          </button>
          <button 
            onClick={() => setActiveTab('language')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left ${activeTab === 'language' ? 'bg-bordo text-white' : 'text-[var(--muted-foreground)]/60 hover:bg-[var(--muted)] hover:text-[var(--foreground)]'}`}
          >
            <Globe size={18} />
            <span className="font-medium">{t('settings.language')}</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 sm:p-8">
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-[var(--foreground)] mb-1">{t('settings.changePassword')}</h2>
                <p className="text-sm text-[var(--muted-foreground)]/50">{t('settings.passwordDesc')}</p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-5 max-w-md">
                <div className="space-y-2">
                  <label className="text-sm text-[var(--muted-foreground)]/70">{t('settings.currentPassword')}</label>
                  <input 
                    type="password" 
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    className="w-full bg-[var(--input)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-[var(--foreground)] focus:outline-none focus:border-bordo transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-[var(--muted-foreground)]/70">{t('settings.newPassword')}</label>
                  <input 
                    type="password" 
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    className="w-full bg-[var(--input)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-[var(--foreground)] focus:outline-none focus:border-bordo transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-[var(--muted-foreground)]/70">{t('settings.confirmPassword')}</label>
                  <input 
                    type="password" 
                    name="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    className="w-full bg-[var(--input)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-[var(--foreground)] focus:outline-none focus:border-bordo transition-colors"
                  />
                </div>

                <div className="pt-2">
                  <button 
                    type="submit" 
                    disabled={isUpdating}
                    className="flex items-center justify-center gap-2 w-full sm:w-auto bg-bordo hover:bg-bordo/80 text-white px-6 py-2.5 rounded-xl transition-colors font-medium disabled:opacity-50"
                  >
                    {isUpdating && <Spinner size="sm" color="white" />}
                    {t('settings.updatePassword')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Bell className="w-16 h-16 text-[var(--muted-foreground)]/10 mb-4" />
              <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">{t('settings.notifications')}</h3>
              <p className="text-[var(--muted-foreground)]/50 max-w-sm">{t('settings.notifDesc')}</p>
            </div>
          )}

          {activeTab === 'language' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-[var(--foreground)] mb-1">{t('settings.language')}</h2>
                <p className="text-sm text-[var(--muted-foreground)]/50">{t('settings.langDesc')}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { code: 'az', name: 'Azərbaycan' },
                  { code: 'en', name: 'English' },
                  { code: 'ru', name: 'Русский' }
                ].map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => i18n.changeLanguage(lang.code)}
                    className={`flex flex-col items-center justify-center p-6 rounded-2xl border transition-all duration-300 group ${
                      i18n.language === lang.code 
                        ? 'bg-bordo/10 border-bordo text-[var(--foreground)]' 
                        : 'bg-[var(--input)] border-[var(--border)] text-[var(--muted-foreground)]/60 hover:bg-[var(--muted)] hover:border-[var(--muted-foreground)]/20'
                    }`}
                  >
                    <span className="text-2xl font-bold text-bordo mb-3 uppercase group-hover:scale-110 transition-transform">{lang.code}</span>
                    <span className="font-medium">{lang.name}</span>
                    {i18n.language === lang.code && (
                      <div className="mt-2 w-1.5 h-1.5 rounded-full bg-bordo shadow-[0_0_8px_rgba(123,0,28,0.8)]" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
