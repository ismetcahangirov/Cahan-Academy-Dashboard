import { useState } from 'react';
import { Key, Bell, Globe, Check } from 'lucide-react';
import { useUpdatePasswordMutation } from '../../features/profile/profileApi';
import { PASSWORD_REGEX } from '../../features/auth/authApi';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Badge, Button, CardHeader, EmptyState, PageShell } from '../../components/ui';
import { EdelweissGlyph, OrnamentDivider } from '../../components/ornament';
import AuthPasswordField from '../auth/AuthPasswordField';
import { cn } from '../../lib/utils';

const TABS = [
  { id: 'security', icon: Key, label: 'settings.security' },
  { id: 'notifications', icon: Bell, label: 'settings.notifications' },
  { id: 'language', icon: Globe, label: 'settings.language' },
];

const LANGUAGES = [
  { code: 'az', name: 'Azərbaycan' },
  { code: 'en', name: 'English' },
  { code: 'ru', name: 'Русский' },
];

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
    if (!PASSWORD_REGEX.test(newPassword)) {
      toast.error(t('auth.passwordRule'));
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
    <PageShell width="narrow" title={t('settings.title')} className="max-w-5xl">
      <div className="flex flex-col gap-6 md:flex-row">
        {/* tabs: a vertical list on desktop, a scrollable row on mobile */}
        <div
          role="tablist"
          aria-orientation="vertical"
          aria-label={t('settings.title')}
          className="orn-stagger -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 md:mx-0 md:w-60 md:shrink-0 md:flex-col md:overflow-visible md:px-0"
        >
          {TABS.map(({ id, icon: Icon, label }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                id={`settings-tab-${id}`}
                aria-selected={active}
                aria-controls={`settings-panel-${id}`}
                onClick={() => setActiveTab(id)}
                className={cn(
                  'relative flex min-h-11 shrink-0 items-center gap-3 whitespace-nowrap rounded-[var(--radius-md)] border px-4 py-2.5 text-left text-[1rem] transition-colors duration-[var(--dur-1)]',
                  active
                    ? 'border-line-strong bg-surface font-semibold text-accent-text shadow-[var(--shadow-sm)]'
                    : 'border-transparent text-ink-muted hover:bg-surface-2 hover:text-ink'
                )}
              >
                <Icon size={18} strokeWidth={1.6} aria-hidden="true" />
                <span className="flex-1">{t(label)}</span>
                {active && <EdelweissGlyph className="hidden h-3.5 w-3.5 text-accent-text md:block" />}
              </button>
            );
          })}
        </div>

        {/* content */}
        <section
          role="tabpanel"
          id={`settings-panel-${activeTab}`}
          aria-labelledby={`settings-tab-${activeTab}`}
          className="card-paper orn-rise min-w-0 flex-1 p-5 sm:p-8"
          key={activeTab}
        >
          {activeTab === 'security' && (
            <div>
              <CardHeader title={t('settings.changePassword')} />
              <p className="mt-1.5 max-w-lg text-[0.98rem] text-ink-muted">{t('settings.passwordDesc')}</p>
              <OrnamentDivider align="start" className="my-6" />

              <form onSubmit={handlePasswordSubmit} className="max-w-md space-y-5">
                <AuthPasswordField
                  label={t('settings.currentPassword')}
                  name="currentPassword"
                  autoComplete="current-password"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                />
                <AuthPasswordField
                  label={t('settings.newPassword')}
                  name="newPassword"
                  autoComplete="new-password"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                />
                <AuthPasswordField
                  label={t('settings.confirmPassword')}
                  name="confirmPassword"
                  autoComplete="new-password"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                />

                <div className="pt-2">
                  <Button type="submit" loading={isUpdating} className="w-full sm:w-auto">
                    {t('settings.updatePassword')}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'notifications' && (
            <EmptyState
              sketch="notebook"
              title={t('settings.notifications')}
              description={t('settings.notifDesc')}
              action={<Badge>{t('settings.comingSoon')}</Badge>}
            />
          )}

          {activeTab === 'language' && (
            <div>
              <CardHeader title={t('settings.language')} />
              <p className="mt-1.5 text-[0.98rem] text-ink-muted">{t('settings.langDesc')}</p>
              <OrnamentDivider align="start" className="my-6" />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3" role="radiogroup" aria-label={t('settings.selectLang')}>
                {LANGUAGES.map((lang) => {
                  const active = i18n.language === lang.code;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      lang={lang.code}
                      onClick={() => i18n.changeLanguage(lang.code)}
                      className={cn(
                        'card-hover relative flex flex-row items-center gap-4 rounded-[var(--radius-lg)] border p-4 text-left sm:flex-col sm:gap-2 sm:p-6 sm:text-center',
                        active
                          ? 'card-ornate border-line-strong'
                          : 'border-line bg-surface hover:bg-surface-2'
                      )}
                    >
                      <span
                        className={cn(
                          'sc flex h-12 w-12 shrink-0 items-center justify-center rounded-full border text-[1.05rem]',
                          active ? 'border-accent bg-accent text-accent-fg' : 'border-line-strong text-accent-text'
                        )}
                      >
                        {lang.code}
                      </span>
                      <span className={cn('relative text-[1.05rem]', active ? 'font-semibold text-ink' : 'text-ink-muted')}>
                        {lang.name}
                      </span>
                      {active && (
                        <Check
                          size={18}
                          strokeWidth={2}
                          aria-hidden="true"
                          className="relative ml-auto text-accent-text sm:absolute sm:right-4 sm:top-4 sm:ml-0"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </div>
    </PageShell>
  );
};

export default Settings;
