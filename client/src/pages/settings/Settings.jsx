import { useState } from 'react';
import { Shield, Key, Bell, Globe, Loader2 } from 'lucide-react';
import { useUpdatePasswordMutation } from '../../features/profile/profileApi';
import toast from 'react-hot-toast';

const Settings = () => {
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
      toast.error('Bütün sahələri doldurun');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Yeni şifrələr uyğun gəlmir');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Yeni şifrə ən az 6 simvol olmalıdır');
      return;
    }

    try {
      const res = await updatePassword({ currentPassword, newPassword }).unwrap();
      if (res.success) {
        toast.success(res.message || 'Şifrə uğurla dəyişdirildi');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      toast.error(err?.data?.message || 'Şifrə dəyişdirilərkən xəta baş verdi');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="text-bordo w-8 h-8" />
        <h1 className="text-2xl font-bold text-white">Tənzimləmələr</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 space-y-2">
          <button 
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left ${activeTab === 'security' ? 'bg-bordo text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
          >
            <Key size={18} />
            <span className="font-medium">Təhlükəsizlik</span>
          </button>
          <button 
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left ${activeTab === 'notifications' ? 'bg-bordo text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
          >
            <Bell size={18} />
            <span className="font-medium">Bildirişlər (Tezliklə)</span>
          </button>
          <button 
            onClick={() => setActiveTab('language')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left ${activeTab === 'language' ? 'bg-bordo text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
          >
            <Globe size={18} />
            <span className="font-medium">Dil Seçimi (Tezliklə)</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-[#111] border border-white/10 rounded-2xl p-6 sm:p-8">
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">Şifrəni Dəyiş</h2>
                <p className="text-sm text-white/50">Hesabınızın təhlükəsizliyini qorumaq üçün şifrənizi mütəmadi olaraq yeniləyin.</p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-5 max-w-md">
                <div className="space-y-2">
                  <label className="text-sm text-white/70">Cari Şifrə</label>
                  <input 
                    type="password" 
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-bordo transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-white/70">Yeni Şifrə</label>
                  <input 
                    type="password" 
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-bordo transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-white/70">Yeni Şifrə (Təkrar)</label>
                  <input 
                    type="password" 
                    name="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-bordo transition-colors"
                  />
                </div>

                <div className="pt-2">
                  <button 
                    type="submit" 
                    disabled={isUpdating}
                    className="flex items-center justify-center gap-2 w-full sm:w-auto bg-bordo hover:bg-bordo/80 text-white px-6 py-2.5 rounded-xl transition-colors font-medium disabled:opacity-50"
                  >
                    {isUpdating && <Loader2 size={18} className="animate-spin" />}
                    Şifrəni Yenilə
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Bell className="w-16 h-16 text-white/10 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Bildiriş Parametrləri</h3>
              <p className="text-white/50 max-w-sm">Bu bölmə üzərində işlər davam edir. Yaxın gələcəkdə e-poçt və sistem bildirişlərini buradan tənzimləyə biləcəksiniz.</p>
            </div>
          )}

          {activeTab === 'language' && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Globe className="w-16 h-16 text-white/10 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Dil Parametrləri</h3>
              <p className="text-white/50 max-w-sm">Sistem dilini dəyişdirmək funksiyası tezliklə əlavə ediləcək (i18n inteqrasiyası).</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
