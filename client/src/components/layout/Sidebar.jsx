import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  LayoutDashboard, 
  Users, 
  UserSquare2, 
  GraduationCap, 
  BookOpen, 
  Calendar, 
  FileText, 
  CheckSquare, 
  Bell, 
  Settings, 
  LogOut, 
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  CreditCard,
  Mail,
  Home,
  MessageSquare
} from 'lucide-react';
import { logout } from '../../features/auth/authSlice';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = () => {
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.auth);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: t('sidebar.dashboard'), path: '/dashboard', roles: ['admin', 'teacher', 'student'] },
    { icon: Users, label: t('sidebar.students'), path: '/students', roles: ['admin', 'teacher'] },
    { icon: UserSquare2, label: t('sidebar.teachers'), path: '/teachers', roles: ['admin'] },
    { icon: GraduationCap, label: t('sidebar.groups'), path: '/groups', roles: ['admin', 'teacher'] },
    { icon: BookOpen, label: t('sidebar.courses'), path: '/courses', roles: ['admin'] },
    { icon: Calendar, label: t('sidebar.schedule'), path: '/schedule', roles: ['admin', 'teacher', 'student'] },
    { icon: FileText, label: t('sidebar.exams'), path: '/exams', roles: ['admin', 'teacher', 'student'] },
    { icon: CheckSquare, label: t('sidebar.classworks'), path: '/classworks', roles: ['admin', 'teacher', 'student'] },
    { icon: MessageSquare, label: t('sidebar.quizzes'), path: '/quizzes', roles: ['admin', 'teacher', 'student'] },
    { icon: Mail, label: t('sidebar.invitations'), path: '/invitations', roles: ['admin'] },
    { icon: CreditCard, label: t('sidebar.payments'), path: '/payments', roles: ['admin', 'student'] },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(userInfo?.role)
  );

  const NavItem = ({ item, isCollapsed }) => {
    const isActive = location.pathname === item.path;
    return (
      <Link
        to={item.path}
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group relative",
          isActive 
            ? "bg-bordo text-white shadow-lg shadow-bordo/20 font-bold" 
            : "text-[var(--muted-foreground)]/60 hover:text-bordo hover:bg-bordo/5"
        )}
      >
        <item.icon size={22} className={cn("shrink-0", isActive ? "animate-pulse" : "")} />
        {!isCollapsed && <span className="text-sm tracking-wide truncate">{item.label}</span>}
        {isCollapsed && (
          <div className="absolute left-full ml-4 px-3 py-2 bg-[var(--foreground)] text-[var(--background)] text-xs rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl font-bold">
            {item.label}
          </div>
        )}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-3 bg-[var(--card)] border border-[var(--border)] rounded-2xl text-bordo shadow-lg"
      >
        <Menu size={24} />
      </button>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 bg-background/60 backdrop-blur-md z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full bg-[var(--card)] border-r border-[var(--border)] transition-all duration-500 ease-in-out lg:static",
          isCollapsed ? "w-24" : "w-72",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full p-4">
          {/* Logo Section */}
          <div className="flex items-center justify-between mb-10 px-2 h-14">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 bg-bordo rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-bordo/20">
                <span className="text-white text-xl font-black">C</span>
              </div>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex flex-col"
                >
                  <span className="text-lg font-black text-[var(--foreground)] leading-none tracking-tight">CAHAN</span>
                  <span className="text-[10px] font-bold text-bordo uppercase tracking-[0.2em] mt-1">Academy</span>
                </motion.div>
              )}
            </div>
            <button
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-2 hover:bg-[var(--muted)] rounded-xl transition-colors text-[var(--muted-foreground)]"
            >
              <X size={20} />
            </button>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex p-2 hover:bg-[var(--muted)] rounded-xl transition-colors text-[var(--muted-foreground)]/40 hover:text-bordo"
            >
              {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-2 overflow-y-auto custom-scrollbar px-2 pb-6">
            <div className={cn("text-[10px] font-black text-[var(--muted-foreground)]/20 uppercase tracking-[0.3em] mb-4 mt-2 px-2", isCollapsed && "text-center")}>
              {isCollapsed ? "•" : t('sidebar.menu')}
            </div>
            {filteredMenuItems.map((item) => (
              <NavItem key={item.path} item={item} isCollapsed={isCollapsed} />
            ))}
          </nav>

          {/* User Profile & Logout */}
          <div className="mt-auto border-t border-[var(--border)] pt-6 px-2 space-y-4">
            <Link
              to="/profile"
              className={cn(
                "flex items-center gap-3 p-3 rounded-2xl hover:bg-[var(--muted)]/50 transition-all group",
                location.pathname === '/profile' && "bg-[var(--muted)]/80"
              )}
            >
              <div className="relative shrink-0">
                <img
                  src={userInfo?.avatar || `https://ui-avatars.com/api/?name=${userInfo?.name}&background=7B001C&color=fff`}
                  alt=""
                  className="w-10 h-10 rounded-xl object-cover ring-2 ring-transparent group-hover:ring-bordo/20 transition-all"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-[var(--card)] rounded-full"></span>
              </div>
              {!isCollapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-[var(--foreground)] truncate">{userInfo?.name}</span>
                  <span className="text-[10px] font-medium text-[var(--muted-foreground)]/60 uppercase tracking-wider">{userInfo?.role}</span>
                </div>
              )}
            </Link>

            <div className="space-y-1">
              <Link
                to="/settings"
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--muted-foreground)]/60 hover:text-bordo hover:bg-bordo/5 transition-all group relative",
                  location.pathname === '/settings' && "text-bordo bg-bordo/5"
                )}
              >
                <Settings size={20} className="shrink-0" />
                {!isCollapsed && <span className="text-sm font-medium">{t('sidebar.settings')}</span>}
                {isCollapsed && (
                  <div className="absolute left-full ml-4 px-3 py-2 bg-[var(--foreground)] text-[var(--background)] text-xs rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 font-bold">
                    {t('sidebar.settings')}
                  </div>
                )}
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--muted-foreground)]/60 hover:text-red-500 hover:bg-red-500/5 transition-all group relative"
              >
                <LogOut size={20} className="shrink-0" />
                {!isCollapsed && <span className="text-sm font-medium">{t('sidebar.logout')}</span>}
                {isCollapsed && (
                  <div className="absolute left-full ml-4 px-3 py-2 bg-red-500 text-white text-xs rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 font-bold">
                    {t('sidebar.logout')}
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
