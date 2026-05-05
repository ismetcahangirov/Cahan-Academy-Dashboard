import { useState, useEffect } from 'react';
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
  ChevronLeft,
  ChevronRight,
  Menu,
  GraduationCap,
  Mail,
  CheckCircle,
  FileText,
  ClipboardList,
  Trophy,
  PenTool
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTranslation } from 'react-i18next';

const Sidebar = ({ isMobileOpen, setIsMobileOpen }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch();
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getLinksByRole = (role) => {
    const baseLinks = [
      { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    ];

    if (role === 'admin') {
      baseLinks.push(
        { name: 'Müəllimlər', path: '/teachers', icon: GraduationCap },
        { name: 'Tələbələr', path: '/students', icon: Users },
        { name: 'Kurslar', path: '/courses', icon: BookOpen },
        { name: 'Davamiyyət', path: '/attendance', icon: CheckCircle },
        { name: 'Ev Tapşırıqları', path: '/homeworks', icon: FileText },
        { name: 'Sinif İşləri', path: '/classworks', icon: ClipboardList },
        { name: 'İmtahanlar', path: '/exams', icon: PenTool },
        { name: 'Quizlər', path: '/quizzes', icon: Trophy },
        { name: 'Cədvəl', path: '/schedule', icon: Calendar },
        { name: 'Bildirişlər', path: '/notifications', icon: Mail },
        { name: 'Dəvətlər', path: '/invitations', icon: Mail },
        { name: 'İstifadəçilər', path: '/users', icon: Users },
        { name: 'Qruplar', path: '/groups', icon: BookOpen },
        { name: 'Tənzimləmələr', path: '/settings', icon: Settings }
      );
    } else if (role === 'teacher') {
      baseLinks.push(
        { name: 'Tələbələrim', path: '/students', icon: Users },
        { name: 'Dərslərim', path: '/courses', icon: BookOpen },
        { name: 'İmtahanlar', path: '/exams', icon: PenTool },
        { name: 'Quizlər', path: '/quizzes', icon: Trophy },
        { name: 'Cədvəl', path: '/schedule', icon: Calendar },
        { name: 'Bildirişlər', path: '/notifications', icon: Mail },
        { name: 'Tənzimləmələr', path: '/settings', icon: Settings }
      );
    } else {
      baseLinks.push(
        { name: 'Kurslarım', path: '/courses', icon: BookOpen },
        { name: 'İmtahanlar', path: '/exams', icon: PenTool },
        { name: 'Quizlər', path: '/quizzes', icon: Trophy },
        { name: 'Cədvəlim', path: '/schedule', icon: Calendar },
        { name: 'Bildirişlər', path: '/notifications', icon: Mail },
        { name: 'Tənzimləmələr', path: '/settings', icon: Settings }
      );
    }

    return baseLinks;
  };

  const links = getLinksByRole(user?.role || 'student');

  const handleLogout = () => {
    dispatch(logout());
  };

  const isMobile = windowWidth < 1024;

  const sidebarVariants = {
    expanded: { width: '256px', x: 0, opacity: 1, transition: { duration: 0.3 } },
    collapsed: { width: '80px', x: 0, opacity: 1, transition: { duration: 0.3 } },
    mobileOpen: { x: 0, opacity: 1, transition: { duration: 0.3 } },
    mobileClosed: { x: '-100%', opacity: 1, transition: { duration: 0.3 } },
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Content */}
      <motion.aside
        initial={false}
        animate={
          isMobile
            ? isMobileOpen ? 'mobileOpen' : 'mobileClosed'
            : isCollapsed ? 'collapsed' : 'expanded'
        }
        variants={sidebarVariants}
        className={cn(
          'fixed lg:sticky top-0 left-0 h-screen z-50 bg-black border-r border-white/10 flex flex-col',
          !isMobile && 'translate-x-0 opacity-100' // Force visible on desktop
        )}
      >
        {/* Logo Area */}
        <div className="h-16 flex items-center px-4 border-b border-white/10">
          <div className={cn(
            "flex items-center gap-3 overflow-hidden w-full",
            isCollapsed && !isMobile ? "justify-center" : "justify-between"
          )}>
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-bordo flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-xl">C</span>
              </div>
              <span
                className={cn(
                  "text-white font-bold whitespace-nowrap",
                  isCollapsed && !isMobile ? "hidden" : "block"
                )}
              >
                Cahan Academy
              </span>
            </div>
            
            {/* Desktop Collapse Button */}
            {!isCollapsed && !isMobile && (
              <button
                onClick={() => setIsCollapsed(true)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
            )}
          </div>
          
          {isCollapsed && !isMobile && (
            <button
              onClick={() => setIsCollapsed(false)}
              className="absolute -right-4 top-20 w-8 h-8 rounded-full bg-bordo border border-white/10 flex items-center justify-center text-white shadow-lg z-50 transition-transform hover:scale-110"
            >
              <ChevronRight size={16} />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1 custom-scrollbar">
          {links.map((link) => {
            const Icon = link.icon;

            return (
              <NavLink
                key={link.path}
                to={link.path}
                title={isCollapsed && !isMobile ? link.name : undefined}
                onClick={() => setIsMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center rounded-xl transition-all duration-200 group relative min-h-[44px]',
                    isCollapsed && !isMobile
                      ? 'justify-center w-11 h-11 mx-auto'
                      : 'gap-3 px-3 py-2.5',
                    isActive
                      ? 'bg-bordo text-white shadow-lg shadow-bordo/20'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  )
                }
              >
                <Icon size={20} className="shrink-0 transition-colors" />
                
                <span
                  className={cn(
                    "whitespace-nowrap font-medium text-sm",
                    isCollapsed && !isMobile ? "hidden" : "block"
                  )}
                >
                  {link.name}
                </span>

                {/* Tooltips removed to prevent horizontal scroll overflow */}
              </NavLink>
            );
          })}
        </div>

        {/* Bottom Profile / Logout */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            title={isCollapsed && !isMobile ? "Çıxış et" : undefined}
            className={cn(
              "flex items-center rounded-xl text-white/60 hover:text-bordo hover:bg-bordo/10 transition-all group relative",
              isCollapsed && !isMobile ? "justify-center h-12 w-12 mx-auto" : "gap-3 px-3 py-3 w-full"
            )}
          >
            <LogOut size={20} className="shrink-0" />
            <span
              className={cn(
                "whitespace-nowrap font-medium text-sm",
                isCollapsed && !isMobile ? "hidden" : "block"
              )}
            >
              Çıxış et
            </span>
            
             {/* Tooltips removed to prevent horizontal scroll overflow */}
          </button>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;
