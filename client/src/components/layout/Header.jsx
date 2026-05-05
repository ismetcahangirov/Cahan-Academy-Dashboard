import { Link } from 'react-router-dom';
import { Menu, Bell, Search } from 'lucide-react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { selectCurrentUser } from '../../features/auth/authSlice';
import { useGetUnreadCountQuery } from '../../features/notifications/notificationsApi';

const Header = ({ setIsMobileOpen }) => {
  const user = useSelector(selectCurrentUser);
  const navigate = useNavigate();
  const { data: countData } = useGetUnreadCountQuery(undefined, {
    pollingInterval: 30000, // Poll every 30 seconds
  });
  
  const unreadCount = countData?.count || 0;

  return (
    <header className="h-16 border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 lg:px-8">
      <div className="flex items-center gap-4">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileOpen(true)}
          className="lg:hidden p-2 -ml-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
        >
          <Menu size={24} />
        </button>

        {/* Search Bar (Desktop) */}
        <div className="hidden md:flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 w-64 focus-within:ring-1 focus-within:ring-bordo focus-within:border-bordo transition-all">
          <Search size={16} className="text-white/40" />
          <input
            type="text"
            placeholder="Axtarış..."
            className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-white/40"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button 
          onClick={() => navigate('/notifications')}
          className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors relative"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center bg-bordo rounded-full text-[10px] font-bold text-white border border-black">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-4 border-l border-white/10">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-medium text-white">{user?.name || 'İstifadəçi'}</span>
            <span className="text-xs text-white/50 capitalize">{user?.role || 'Tələbə'}</span>
          </div>
          <Link to="/profile">
            <img
              src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name || 'U'}&background=7B001C&color=fff`}
              alt="Profile"
              className="w-9 h-9 rounded-full object-cover border border-white/20 cursor-pointer hover:border-bordo transition-colors"
            />
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
