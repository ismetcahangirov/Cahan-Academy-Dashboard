import { Link, useNavigate } from 'react-router-dom';
import { Menu, Bell, Search, Globe } from 'lucide-react';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../features/auth/authSlice';
import { useGetUnreadCountQuery } from '../../features/notifications/notificationsApi';
import { useTranslation } from 'react-i18next';
import Dropdown from '../common/Dropdown';
import Avatar from '../common/Avatar';
import { BrandLockup } from '../brand';
import { EdelweissGlyph } from '../ornament';

const Header = ({ setIsMobileOpen }) => {
  const user = useSelector(selectCurrentUser);
  const navigate = useNavigate();
  const { data: countData } = useGetUnreadCountQuery(undefined, {
    pollingInterval: 30000,
  });
  const { t, i18n } = useTranslation();

  const unreadCount = countData?.count || 0;
  // The global search looks up students, which only staff can list
  const canSearch = user?.role === 'admin' || user?.role === 'teacher';
  const [query, setQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/students?search=${encodeURIComponent(q)}` : '/students');
  };

  const languages = [
    { code: 'az', name: 'Azərbaycanca' },
    { code: 'en', name: 'English' },
    { code: 'ru', name: 'Русский' },
  ];

  const currentLang = languages.find((l) => l.code === i18n.language) || languages[0];

  return (
    <header className="app-header sticky top-0 z-30 flex h-16 items-center justify-between gap-3 px-4 lg:px-8">
      {/* small flourish sitting on the hairline */}
      <span aria-hidden="true" className="pointer-events-none absolute -bottom-[9px] left-1/2 -translate-x-1/2 bg-page px-2">
        <EdelweissGlyph className="h-4 w-4" />
      </span>

      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={() => setIsMobileOpen(true)}
          aria-label={t('common.openMenu')}
          className="btn btn-ghost btn-icon -ml-2 lg:hidden"
        >
          <Menu size={22} strokeWidth={1.5} />
        </button>

        <Link to="/" className="text-accent-text lg:hidden dark:text-ink" aria-label="Cahan Academy">
          <BrandLockup title={null} className="h-8 w-auto" />
        </Link>

        {canSearch && (
          <form role="search" onSubmit={handleSearch} className="relative hidden w-72 md:block">
            <Search
              size={16}
              strokeWidth={1.6}
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-subtle"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('students.searchPlaceholder')}
              aria-label={t('students.searchPlaceholder')}
              className="field field-icon min-h-0 rounded-full py-1.5 text-[0.95rem]"
            />
          </form>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
        <button
          type="button"
          onClick={() => navigate('/notifications')}
          aria-label={unreadCount > 0 ? `${t('notifications.title')} (${unreadCount})` : t('notifications.title')}
          title={t('notifications.title')}
          className="btn btn-ghost btn-icon relative"
        >
          <Bell size={19} strokeWidth={1.5} />
          {unreadCount > 0 && (
            <span className="count-badge absolute right-0.5 top-0.5">{unreadCount > 99 ? '99+' : unreadCount}</span>
          )}
        </button>

        <Dropdown
          label={currentLang.code.toUpperCase()}
          icon={<Globe size={15} strokeWidth={1.5} />}
          items={languages.map((lang) => ({
            label: lang.name,
            active: i18n.language === lang.code,
            onClick: () => i18n.changeLanguage(lang.code),
          }))}
          menuClassName="w-44"
        />

        <div className="flex items-center gap-3 border-l border-line pl-3 sm:pl-4">
          <div className="hidden flex-col items-end leading-tight md:flex">
            <span className="text-[1rem] font-semibold text-ink">{user?.name || t('common.user')}</span>
            <span className="sc text-[0.75rem] text-ink-muted">{t(`common.${user?.role || 'student'}`)}</span>
          </div>
          <Link to="/profile" aria-label={t('common.profile')} className="rounded-full">
            <Avatar src={user?.avatar} name={user?.name} className="h-9 w-9" textSize="xs" />
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
