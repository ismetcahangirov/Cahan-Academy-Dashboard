import { useState } from 'react';
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
  ClipboardList
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTranslation } from 'react-i18next';

const Sidebar = ({ isMobileOpen, setIsMobileOpen }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch();
  const location = useLocation();
  const { t } = useTranslation();

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
        { name: 'Dəvətlər', path: '/invitations', icon: Mail },
        { name: 'İstifadəçilər', path: '/users', icon: Settings },
        { name: 'Qruplar', path: '/groups', icon: BookOpen },
        { name: 'Tənzimləmələr', path: '/settings', icon: Settings }
      );
    } else if (role === 'teacher') {
      baseLinks.push(
        { name: 'Tələbələrim', path: '/students', icon: Users },
        { name: 'Dərslərim', path: '/courses', icon: BookOpen },
        { name: 'Cədvəl', path: '/schedule', icon: Calendar },
        { name: 'Tənzimləmələr', path: '/settings', icon: Settings }
      );
    } else {
      // student
      baseLinks.push(
        { name: 'Dərslərim', path: '/my-courses', icon: BookOpen },
        { name: 'Cədvəlim', path: '/my-schedule', icon: Calendar },
        { name: 'Tənzimləmələr', path: '/settings', icon: Settings }
      );
    }

    return baseLinks;
  };

  const links = getLinksByRole(user?.role || 'student');

  const handleLogout = () => {
    dispatch(logout());
  };

  const sidebarVariants = {
    expanded: { width: '256px', transition: { duration: 0.3 } },
    collapsed: { width: '80px', transition: { duration: 0.3 } },
  };

  const mobileSidebarVariants = {
    open: { x: 0, transition: { duration: 0.3 } },
    closed: { x: '-100%', transition: { duration: 0.3 } },
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
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
          typeof window !== 'undefined' && window.innerWidth < 1024
            ? isMobileOpen ? 'open' : 'closed'
            : isCollapsed ? 'collapsed' : 'expanded'
        }
        variants={typeof window !== 'undefined' && window.innerWidth < 1024 ? mobileSidebarVariants : sidebarVariants}
        className={cn(
          'fixed lg:sticky top-0 left-0 h-screen z-50 bg-black border-r border-white/10 flex flex-col transition-colors',
          'lg:translate-x-0' // Ensure it's visible on desktop
        )}
      >
        {/* Logo Area */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-bordo flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-xl">C</span>
            </div>
            <AnimatePresence mode="wait">
              {(!isCollapsed || (typeof window !== 'undefined' && window.innerWidth < 1024)) && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="text-white font-bold whitespace-nowrap"
                >
                  Cahan Academy
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          
          {/* Desktop Collapse Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 items-center justify-center text-white/70 hover:text-white transition-colors"
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-2 custom-scrollbar">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;

            return (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={() => setIsMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative',
                    isActive
                      ? 'bg-bordo text-white shadow-lg shadow-bordo/20'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  )
                }
              >
                <Icon
                  size={20}
                  className={cn(
                    'shrink-0 transition-colors',
                    isActive ? 'text-white' : 'text-white/60 group-hover:text-white'
                  )}
                />
                
                <AnimatePresence mode="wait">
                  {(!isCollapsed || (typeof window !== 'undefined' && window.innerWidth < 1024)) && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="whitespace-nowrap font-medium text-sm"
                    >
                      {link.name}
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Tooltip for collapsed state */}
                {isCollapsed && typeof window !== 'undefined' && window.innerWidth >= 1024 && (
                  <div className="absolute left-full ml-4 px-3 py-1.5 bg-white text-black text-sm rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                    {link.name}
                  </div>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Bottom Profile / Logout */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 w-full px-3 py-3 rounded-xl text-white/60 hover:text-bordo hover:bg-bordo/10 transition-all group relative",
              isCollapsed && typeof window !== 'undefined' && window.innerWidth >= 1024 ? "justify-center" : ""
            )}
          >
            <LogOut size={20} className="shrink-0" />
            <AnimatePresence mode="wait">
              {(!isCollapsed || (typeof window !== 'undefined' && window.innerWidth < 1024)) && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="whitespace-nowrap font-medium text-sm"
                >
                  Çıxış et
                </motion.span>
              )}
            </AnimatePresence>
            
             {/* Tooltip for collapsed state */}
             {isCollapsed && typeof window !== 'undefined' && window.innerWidth >= 1024 && (
                <div className="absolute left-full ml-4 px-3 py-1.5 bg-white text-black text-sm rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  Çıxış et
                </div>
              )}
          </button>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;
