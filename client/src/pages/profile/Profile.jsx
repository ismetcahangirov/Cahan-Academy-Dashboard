import { useState } from 'react';
import { User, Mail, Camera, Shield, Pencil, X } from 'lucide-react';
import { useGetProfileQuery, useUpdateProfileMutation } from '../../features/profile/profileApi';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../features/auth/authSlice';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Avatar from '../../components/common/Avatar';
import { Badge, Button, FormField, Input, PageShell, Skeleton } from '../../components/ui';
import { OrnamentDivider, WaveEdge } from '../../components/ornament';

const Profile = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  // transformResponse in profileApi returns response directly (already the user object)
  const { data: profileData, isLoading } = useGetProfileQuery();
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: '', avatar: '' });

  // Reset the form whenever fresh profile data arrives (adjusting state during render, no effect)
  const [syncedProfile, setSyncedProfile] = useState(null);
  if (profileData && profileData !== syncedProfile) {
    setSyncedProfile(profileData);
    // profileData is the user directly (due to transformResponse)
    const user = profileData.data ?? profileData;
    setForm({
      name: user.name || '',
      email: user.email || '',
      role: user.role || '',
      avatar: user.avatar || '',
    });
  }

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleCancel = () => {
    if (profileData) {
      const user = profileData.data ?? profileData;
      setForm({ name: user.name || '', email: user.email || '', role: user.role || '', avatar: user.avatar || '' });
    }
    setIsEditing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error(t('profile.nameRequired'));
      return;
    }

    try {
      const result = await updateProfile({ name: form.name, avatar: form.avatar }).unwrap();
      // After transformResponse, result is response.data (the user)
      const updatedUser = result?.data ?? result;
      toast.success(t('profile.updateSuccess'));
      // Sync Redux auth state so the header updates too
      dispatch(setCredentials({ user: updatedUser, token: localStorage.getItem('token') }));
      setIsEditing(false);
    } catch (err) {
      toast.error(err?.data?.message || t('common.error'));
    }
  };

  const roleLabel = form.role ? t(`common.${form.role}`) || form.role : '';

  return (
    <PageShell
      width="narrow"
      title={t('profile.title')}
      actions={
        isLoading ? null : !isEditing ? (
          <Button variant="outline" icon={Pencil} onClick={() => setIsEditing(true)}>
            {t('profile.editBtn')}
          </Button>
        ) : (
          <Button variant="ghost" icon={X} onClick={handleCancel}>
            {t('common.cancel')}
          </Button>
        )
      }
    >
      <section className="theme-light card-paper orn-rise overflow-hidden">
        {/* wine band flowing into the parchment on a wave */}
        <div className="theme-wine login-hero relative h-32 sm:h-36" aria-hidden="true">
          <WaveEdge fill="var(--paper-light)" className="absolute inset-x-0 -bottom-px" />
        </div>

        {isLoading ? (
          <div className="px-5 pb-8 sm:px-10" aria-busy="true">
            <Skeleton className="relative -mt-14 h-28 w-28 rounded-full" />
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-11 w-full rounded-[var(--radius-md)]" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-5 pb-8 sm:px-10 sm:pb-10">
            {/* identity row: avatar overlapping the wave */}
            <div className="relative -mt-16 flex flex-col items-center gap-4 text-center sm:-mt-14 sm:flex-row sm:items-end sm:text-left">
              <div className="relative shrink-0">
                <Avatar src={form.avatar} name={form.name} className="h-28 w-28 sm:h-32 sm:w-32" textSize="3xl" />
                {isEditing && (
                  <span className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-[var(--paper-light)] bg-accent text-accent-fg">
                    <Camera size={16} strokeWidth={1.6} aria-hidden="true" />
                  </span>
                )}
              </div>
              <div className="min-w-0 pb-1">
                <p className="break-words text-[1.6rem] font-semibold leading-tight text-ink">{form.name}</p>
                <div className="mt-1.5 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  {roleLabel && <Badge tone="accent">{roleLabel}</Badge>}
                  <span className="break-all text-[0.98rem] text-ink-muted">{form.email}</span>
                </div>
              </div>
            </div>

            <OrnamentDivider align="start" className="mb-6 mt-7" />

            <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
              <FormField label={t('profile.fullName')}>
                {(id, describedBy) => (
                  <Input
                    id={id}
                    aria-describedby={describedBy}
                    icon={User}
                    type="text"
                    name="name"
                    autoComplete="name"
                    value={form.name}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                )}
              </FormField>

              {/* Email — always locked */}
              <FormField label={t('profile.emailLocked')}>
                {(id, describedBy) => (
                  <Input id={id} aria-describedby={describedBy} icon={Mail} type="email" value={form.email} disabled />
                )}
              </FormField>

              {/* Role — always locked */}
              <FormField label={t('profile.roleLocked')}>
                {(id, describedBy) => (
                  <Input id={id} aria-describedby={describedBy} icon={Shield} type="text" value={roleLabel} disabled />
                )}
              </FormField>

              <FormField label={t('profile.avatarUrl')}>
                {(id, describedBy) => (
                  <Input
                    id={id}
                    aria-describedby={describedBy}
                    icon={Camera}
                    type="text"
                    name="avatar"
                    value={form.avatar}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="https://example.com/avatar.jpg"
                  />
                )}
              </FormField>
            </div>

            {isEditing && (
              <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button variant="ghost" onClick={handleCancel}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" loading={isUpdating}>
                  {t('profile.saveBtn')}
                </Button>
              </div>
            )}
          </form>
        )}
      </section>
    </PageShell>
  );
};

export default Profile;
