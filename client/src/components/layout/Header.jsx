import { Link } from 'react-router-dom';
import { Menu, Bell, Search, Globe, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectCurrentUser } from '../../features/auth/authSlice';
import { useGetUnreadCountQuery } from '../../features/notifications/notificationsApi';
import { useTranslation } from 'react-i18next';
import Dropdown from '../common/Dropdown';
import Avatar from '../common/Avatar';

const Header = ({ setIsMobileOpen }) => {
  const user = useSelector(selectCurrentUser);
  const navigate = useNavigate();
  const { data: countData } = useGetUnreadCountQuery(undefined, {
    pollingInterval: 30000,
  });
  const { t, i18n } = useTranslation();
  
  const unreadCount = countData?.count || 0;


  const languages = [
    { code: 'az', name: 'AZE', flag: '🇦🇿' },
    { code: 'en', name: 'ENG', flag: '🇺🇸' },
    { code: 'ru', name: 'RUS', flag: '🇷🇺' }
  ];

  const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

  return (
    <header className="h-16 border-b border-[var(--border)] bg-[var(--card)]/50 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 lg:px-8">
      <div className="flex items-center gap-4">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileOpen(true)}
          className="lg:hidden p-2 -ml-2 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
        >
          <Menu size={24} />
        </button>

        {/* Search Bar (Desktop) */}
        <div className="hidden md:flex items-center gap-2 bg-[var(--muted)]/50 border border-[var(--border)] rounded-full px-4 py-2 w-64 focus-within:ring-1 focus-within:ring-bordo focus-within:border-bordo transition-all">
          <Search size={16} className="text-[var(--muted-foreground)]/40" />
          <input
            type="text"
            placeholder={t('common.search')}
            className="bg-transparent border-none outline-none text-sm text-[var(--foreground)] w-full placeholder:text-[var(--muted-foreground)]/40"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button 
          onClick={() => navigate('/notifications')}
          className="p-2 rounded-full text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors relative"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center bg-bordo rounded-full text-[10px] font-bold text-white border border-[var(--background)]">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Language Selector */}
        <Dropdown
          label={currentLang.code}
          icon={<span className="text-lg">{currentLang.flag}</span>}
          items={languages.map(lang => ({
            label: lang.name,
            icon: lang.flag,
            active: i18n.language === lang.code,
            onClick: () => i18n.changeLanguage(lang.code)
          }))}
          buttonClassName="px-3 py-1.5 rounded-lg bg-[var(--muted)] border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--border)] transition-all"
          menuClassName="w-40"
        />

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-4 border-l border-[var(--border)]">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-medium text-[var(--foreground)]">{user?.name || t('common.user')}</span>
            <span className="text-xs text-[var(--muted-foreground)]/60 capitalize">{t(`common.${user?.role || 'student'}`)}</span>
          </div>
          <Link to="/profile">
            <Avatar
              src={user?.avatar}
              name={user?.name}
              className="w-9 h-9 rounded-full border border-[var(--border)] cursor-pointer hover:border-bordo transition-colors"
              textSize="xs"
            />
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
