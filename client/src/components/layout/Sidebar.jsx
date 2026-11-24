import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
  Bell,
  Tags,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTranslation } from 'react-i18next';
import { BrandLockup, BrandMark } from '../brand';
import { OrnamentDivider } from '../ornament';
import { DUR, EASE } from '../../lib/motion';
import { isolateWheel } from '../../lib/scrollIsolation';

const Sidebar = ({ isMobileOpen, setIsMobileOpen }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const navRef = useRef(null);
  const asideRef = useRef(null);
  // the sidebar and the main column scroll independently: a wheel over the sidebar never scrolls the page
  useEffect(() => (asideRef.current ? isolateWheel(asideRef.current) : undefined), []);
  // Geometry of every nav link, measured once (mount, resize, collapse) and cached, so a route
  // change only moves the marker with a transform and never forces a layout read.
  const [geometry, setGeometry] = useState([]);
  const [markerReady, setMarkerReady] = useState(false);

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
        { name: t('sidebar.categories'), path: '/categories', icon: Tags },
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
  const linkKey = links.map((l) => l.path).join('|');
  const activeIndex = links.findIndex((l) =>
    l.path === '/' ? pathname === '/' : pathname === l.path || pathname.startsWith(`${l.path}/`)
  );

  const measureLinks = useCallback(() => {
    const nav = navRef.current;
    if (!nav) return;
    const next = [...nav.querySelectorAll('a[data-nav-link]')].map((a) => ({
      x: a.offsetLeft,
      y: a.offsetTop,
      w: a.offsetWidth,
      h: a.offsetHeight,
    }));
    setGeometry((prev) =>
      prev.length === next.length && prev.every((p, i) => p.x === next[i].x && p.y === next[i].y && p.w === next[i].w && p.h === next[i].h)
        ? prev
        : next
    );
  }, []);

  useLayoutEffect(() => {
    measureLinks();
    const nav = navRef.current;
    if (!nav || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(() => measureLinks());
    ro.observe(nav);
    return () => ro.disconnect();
  }, [measureLinks, linkKey, isCollapsed]);

  // first placement without a slide; later route changes glide
  useEffect(() => {
    if (!geometry.length || markerReady) return undefined;
    const id = requestAnimationFrame(() => setMarkerReady(true));
    return () => cancelAnimationFrame(id);
  }, [geometry.length, markerReady]);

  const marker = activeIndex >= 0 ? geometry[activeIndex] : null;

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

      {/* Desktop: the column runs the full page height (wine to the bottom of long pages)
          while the panel itself stays sticky to the viewport. Mobile: the panel is a fixed drawer. */}
      <div className="sidebar-column lg:relative lg:z-40 lg:shrink-0">
      <motion.aside
        ref={asideRef}
        initial={false}
        animate={isMobile ? (isMobileOpen ? 'mobileOpen' : 'mobileClosed') : isCollapsed ? 'collapsed' : 'expanded'}
        variants={sidebarVariants}
        className="theme-wine sidebar-wine fixed left-0 top-0 z-50 flex h-screen w-[264px] flex-col lg:sticky"
      >
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
        <nav ref={navRef} className="custom-scrollbar relative flex flex-1 flex-col gap-0.5 overflow-y-auto overscroll-contain px-3 py-3">
          {/* active marker + satin bookmark ribbon: one element, moved with a transform (compositor only) */}
          {marker && (
            <span
              aria-hidden="true"
              className={cn('sidebar-active sidebar-marker', markerReady && 'is-ready')}
              style={{ width: marker.w, height: marker.h, transform: `translate3d(${marker.x}px, ${marker.y}px, 0)` }}
            >
              <span className="sidebar-ribbon" />
            </span>
          )}
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.path}
                to={link.path}
                data-nav-link=""
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

        {/* Footer: logout */}
        <div
          className={cn(
            'relative border-t border-line-hair',
            compact ? 'space-y-1 px-2 py-4' : 'flex items-center gap-3 px-4 py-4'
          )}
        >
          <div className={cn('min-w-0', compact ? 'space-y-1' : 'flex-1 space-y-0.5')}>
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
      </div>
    </>
  );
};

export default Sidebar;
