import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Camera, Shield } from 'lucide-react';
import { useGetProfileQuery, useUpdateProfileMutation } from '../../features/profile/profileApi';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../features/auth/authSlice';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Avatar from '../../components/common/Avatar';
import Spinner from '../../components/common/Spinner';

const Profile = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { data: profileResponse, isLoading } = useGetProfileQuery();
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();

  const [form, setForm] = useState({
    name: '',
    email: '',
    role: '',
    avatar: ''
  });

  useEffect(() => {
    if (profileResponse?.data) {
      const user = profileResponse.data;
      setForm({
        name: user.name || '',
        email: user.email || '',
        role: user.role || '',
        avatar: user.avatar || ''
      });
    }
  }, [profileResponse]);

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error(t('profile.nameRequired'));
      return;
    }
    
    try {
      const res = await updateProfile({ name: form.name, avatar: form.avatar }).unwrap();
      if (res.success) {
        toast.success(t('profile.updateSuccess'));
        // Update global auth state to reflect changes in Header
        dispatch(setCredentials({ user: res.data, token: localStorage.getItem('token') }));
      }
    } catch (err) {
      toast.error(err?.data?.message || t('students.error'));
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <User className="text-bordo w-8 h-8" />
        <h1 className="text-2xl font-bold text-[var(--foreground)]">{t('profile.title')}</h1>
      </div>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden">
        {/* Banner */}
        <div className="h-32 bg-gradient-to-r from-bordo/40 to-black relative"></div>
        
        <form onSubmit={handleSubmit} className="px-6 pb-8 sm:px-10 sm:pb-10">
          {/* Avatar Section */}
          <div className="relative flex justify-center sm:justify-start -mt-12 mb-8">
            <div className="relative">
              <Avatar
                src={form.avatar}
                name={form.name}
                className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-[var(--card)] bg-[var(--card)]"
                textSize="3xl"
              />
              <div className="absolute bottom-0 right-0 bg-bordo p-2 rounded-full border-2 border-[var(--card)] text-white shadow-lg">
                <Camera size={16} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm text-[var(--muted-foreground)]/70">{t('profile.fullName')}</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]/30" size={18} />
                <input 
                  type="text" 
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full bg-[var(--input)] border border-[var(--border)] rounded-xl pl-10 pr-4 py-3 text-[var(--foreground)] focus:outline-none focus:border-bordo transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-[var(--muted-foreground)]/70">{t('profile.emailLocked')}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]/30" size={18} />
                <input 
                  type="email" 
                  value={form.email}
                  disabled
                  className="w-full bg-[var(--input)] border border-[var(--border)] rounded-xl pl-10 pr-4 py-3 text-[var(--foreground)]/50 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-[var(--muted-foreground)]/70">{t('profile.roleLocked')}</label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]/30" size={18} />
                <input 
                  type="text" 
                  value={t(`sidebar.roles.${form.role}`)}
                  disabled
                  className="w-full bg-[var(--input)] border border-[var(--border)] rounded-xl pl-10 pr-4 py-3 text-[var(--foreground)]/50 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-[var(--muted-foreground)]/70">{t('profile.avatarUrl')}</label>
              <div className="relative">
                <Camera className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]/30" size={18} />
                <input 
                  type="text" 
                  name="avatar"
                  value={form.avatar}
                  onChange={handleChange}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full bg-[var(--input)] border border-[var(--border)] rounded-xl pl-10 pr-4 py-3 text-[var(--foreground)] focus:outline-none focus:border-bordo transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button 
              type="submit" 
              disabled={isUpdating}
              className="flex items-center gap-2 bg-bordo hover:bg-bordo/80 text-white px-6 py-3 rounded-xl transition-colors font-medium disabled:opacity-50"
            >
              {isUpdating && <Spinner size="sm" color="white" />}
              {t('profile.saveBtn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
