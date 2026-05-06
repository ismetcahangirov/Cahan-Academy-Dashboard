import { Link } from 'react-router-dom';
import { Menu, Bell, Search, Globe, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectCurrentUser } from '../../features/auth/authSlice';
import { useGetUnreadCountQuery } from '../../features/notifications/notificationsApi';
import { useTranslation } from 'react-i18next';

const Header = ({ setIsMobileOpen }) => {
  const user = useSelector(selectCurrentUser);
  const navigate = useNavigate();
  const { data: countData } = useGetUnreadCountQuery(undefined, {
    pollingInterval: 30000,
  });
  const { t, i18n } = useTranslation();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const langRef = useRef(null);
  
  const unreadCount = countData?.count || 0;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (langRef.current && !langRef.current.contains(event.target)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        <div className="relative" ref={langRef}>
          <button
            onClick={() => setIsLangOpen(!isLangOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--muted)] border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--border)] transition-all"
          >
            <span className="text-lg">{currentLang.flag}</span>
            <span className="text-xs font-bold uppercase">{currentLang.code}</span>
            <ChevronDown size={14} className={`transition-transform duration-200 ${isLangOpen ? 'rotate-180' : ''}`} />
          </button>

          {isLangOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden z-50 py-1 backdrop-blur-xl">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    i18n.changeLanguage(lang.code);
                    setIsLangOpen(false);
                  }}
                  className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors ${
                    i18n.language === lang.code 
                      ? 'bg-bordo text-white' 
                      : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
                  }`}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span className="font-medium">{lang.name}</span>
                  {i18n.language === lang.code && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-4 border-l border-[var(--border)]">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-medium text-[var(--foreground)]">{user?.name || t('common.user')}</span>
            <span className="text-xs text-[var(--muted-foreground)]/60 capitalize">{t(`common.${user?.role || 'student'}`)}</span>
          </div>
          <Link to="/profile">
            <img
              src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name || 'U'}&background=7B001C&color=fff`}
              alt="Profile"
              className="w-9 h-9 rounded-full object-cover border border-[var(--border)] cursor-pointer hover:border-bordo transition-colors"
            />
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
