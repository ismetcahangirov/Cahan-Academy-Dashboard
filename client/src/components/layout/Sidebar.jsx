import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser, logout } from '../../features/auth/authSlice';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Calendar,
  Settings,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
  GraduationCap,
  Layers,
  UserCog,
  Mail,
  CheckCircle,
  FileText,
  ClipboardList,
  Trophy,
  PenTool,
  Sun,
  Moon,
  Bell,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/useTheme';
import { BrandLockup, BrandMark } from '../brand';
import { LaceEdge, WaxSeal, OrnamentDivider } from '../ornament';
import { DUR, EASE } from '../../lib/motion';

const Sidebar = ({ isMobileOpen, setIsMobileOpen }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getLinksByRole = (role) => {
    const baseLinks = [
      { name: t('sidebar.dashboard'), path: '/', icon: LayoutDashboard },
    ];

    // Keep in sync with the RoleRoute guards in App.jsx and the server's authorize(...) rules
    if (role === 'admin') {
      baseLinks.push(
        { name: t('sidebar.teachers'), path: '/teachers', icon: GraduationCap },
        { name: t('sidebar.students'), path: '/students', icon: Users },
        { name: t('sidebar.groups'), path: '/groups', icon: Layers },
        { name: t('sidebar.courses'), path: '/courses', icon: BookOpen },
        { name: t('sidebar.attendance'), path: '/attendance', icon: CheckCircle },
        { name: t('sidebar.homeworks'), path: '/homeworks', icon: FileText },
        { name: t('sidebar.classworks'), path: '/classworks', icon: ClipboardList },
        { name: t('sidebar.exams'), path: '/exams', icon: PenTool },
        { name: t('sidebar.quizzes'), path: '/quizzes', icon: Trophy },
        { name: t('sidebar.schedule'), path: '/schedule', icon: Calendar },
        { name: t('sidebar.notifications'), path: '/notifications', icon: Bell },
        { name: t('sidebar.invitations'), path: '/invitations', icon: Mail },
        { name: t('sidebar.users'), path: '/users', icon: UserCog },
        { name: t('sidebar.settings'), path: '/settings', icon: Settings }
      );
    } else if (role === 'teacher') {
      baseLinks.push(
        { name: t('sidebar.myStudents'), path: '/students', icon: Users },
        { name: t('sidebar.groups'), path: '/groups', icon: Layers },
        { name: t('sidebar.attendance'), path: '/attendance', icon: CheckCircle },
        { name: t('sidebar.courses'), path: '/courses', icon: BookOpen },
        { name: t('sidebar.homeworks'), path: '/homeworks', icon: FileText },
        { name: t('sidebar.classworks'), path: '/classworks', icon: ClipboardList },
        { name: t('sidebar.exams'), path: '/exams', icon: PenTool },
        { name: t('sidebar.quizzes'), path: '/quizzes', icon: Trophy },
        { name: t('sidebar.schedule'), path: '/schedule', icon: Calendar },
        { name: t('sidebar.notifications'), path: '/notifications', icon: Bell },
        { name: t('sidebar.settings'), path: '/settings', icon: Settings }
      );
    } else {
      baseLinks.push(
        { name: t('sidebar.groups'), path: '/groups', icon: Layers },
        { name: t('sidebar.myCourses'), path: '/courses', icon: BookOpen },
        { name: t('sidebar.homeworks'), path: '/homeworks', icon: FileText },
        { name: t('sidebar.classworks'), path: '/classworks', icon: ClipboardList },
        { name: t('sidebar.exams'), path: '/exams', icon: PenTool },
        { name: t('sidebar.quizzes'), path: '/quizzes', icon: Trophy },
        { name: t('sidebar.mySchedule'), path: '/schedule', icon: Calendar },
        { name: t('sidebar.notifications'), path: '/notifications', icon: Bell },
        { name: t('sidebar.settings'), path: '/settings', icon: Settings }
      );
    }

    return baseLinks;
  };

  const links = getLinksByRole(user?.role || 'student');

  const handleLogout = () => {
    if (window.confirm(t('common.logoutConfirm'))) {
      dispatch(logout());
    }
  };

  const isMobile = windowWidth < 1024;
  const compact = isCollapsed && !isMobile;

  const sidebarVariants = {
    expanded: { width: 264, x: 0, transition: { duration: DUR.slow, ease: EASE.silk } },
    collapsed: { width: 84, x: 0, transition: { duration: DUR.slow, ease: EASE.silk } },
    mobileOpen: { x: 0, transition: { duration: DUR.slow, ease: EASE.silk } },
    mobileClosed: { x: '-110%', transition: { duration: DUR.base, ease: EASE.silk } },
  };

  const footerBtn = cn(
    'flex items-center rounded-[10px] text-ink-muted transition-colors duration-[var(--dur-1)] hover:bg-surface-2 hover:text-white',
    compact ? 'mx-auto h-10 w-10 justify-center' : 'w-full gap-2.5 px-2.5 py-1.5'
  );

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobileOpen && isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="modal-backdrop z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={isMobile ? (isMobileOpen ? 'mobileOpen' : 'mobileClosed') : isCollapsed ? 'collapsed' : 'expanded'}
        variants={sidebarVariants}
        className="theme-wine sidebar-wine fixed left-0 top-0 z-50 flex h-screen w-[264px] flex-col lg:sticky"
      >
        {/* lace trim hanging over the content edge */}
        <LaceEdge vertical size={16} className="absolute -right-[15px] top-0 z-10 h-full" />

        {/* Brand */}
        <div className={cn('relative flex items-center pb-3 pt-6', compact ? 'flex-col gap-3 px-2' : 'justify-between gap-2 pl-5 pr-3')}>
          <span className="sr-only">Cahan Academy</span>
          {compact ? (
            <BrandMark title={null} className="h-9 w-auto text-white" />
          ) : (
            <BrandLockup title={null} className="h-12 w-auto text-white" />
          )}

          {!isMobile && (
            <button
              type="button"
              onClick={() => setIsCollapsed((c) => !c)}
              aria-label={isCollapsed ? t('common.expandMenu') : t('common.collapseMenu')}
              title={isCollapsed ? t('common.expandMenu') : t('common.collapseMenu')}
              className="btn btn-ghost btn-icon btn-sm"
            >
              {isCollapsed ? <ChevronsRight size={16} strokeWidth={1.6} /> : <ChevronsLeft size={16} strokeWidth={1.6} />}
            </button>
          )}
        </div>
        {!compact && <OrnamentDivider draw={false} className="relative pb-1 [&>svg]:w-20" />}

        {/* Navigation */}
        <nav className="custom-scrollbar relative flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-3">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.path === '/'}
                title={compact ? link.name : undefined}
                onClick={() => setIsMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'group relative flex min-h-[42px] items-center rounded-[10px] transition-colors duration-[var(--dur-1)]',
                    compact ? 'mx-auto h-11 w-11 justify-center' : 'gap-3 px-3.5 py-2',
                    isActive ? 'text-white' : 'text-ink-muted hover:bg-surface-2 hover:text-white'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="sidebar-active"
                        transition={EASE.spring}
                        aria-hidden="true"
                        className="sidebar-active absolute inset-0 rounded-[10px]"
                      >
                        {/* satin bookmark ribbon marking the current page */}
                        <span className="sidebar-ribbon" />
                      </motion.span>
                    )}
                    <Icon size={19} strokeWidth={1.5} className="relative shrink-0" />
                    <span
                      className={cn(
                        'relative whitespace-nowrap text-[1.02rem]',
                        compact ? 'hidden' : 'block',
                        isActive && 'font-semibold'
                      )}
                    >
                      {link.name}
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer: seal + theme + logout */}
        <div
          className={cn(
            'relative border-t border-line-hair',
            compact ? 'space-y-1 px-2 py-4' : 'flex items-center gap-3 px-4 py-4'
          )}
        >
          <WaxSeal size={compact ? 40 : 54} className={cn(compact && 'mx-auto mb-2 block')} />
          <div className={cn('min-w-0', compact ? 'space-y-1' : 'flex-1 space-y-0.5')}>
            <button
              type="button"
              onClick={toggleTheme}
              title={compact ? (theme === 'dark' ? t('common.lightMode') : t('common.darkMode')) : undefined}
              className={footerBtn}
            >
              {theme === 'dark' ? <Sun size={17} strokeWidth={1.5} /> : <Moon size={17} strokeWidth={1.5} />}
              <span className={cn('whitespace-nowrap text-[0.95rem]', compact && 'sr-only')}>
                {theme === 'dark' ? t('common.lightMode') : t('common.darkMode')}
              </span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              title={compact ? t('common.logout') : undefined}
              className={footerBtn}
            >
              <LogOut size={17} strokeWidth={1.5} className="shrink-0" />
              <span className={cn('whitespace-nowrap text-[0.95rem]', compact && 'sr-only')}>{t('common.logout')}</span>
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;
