import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const AppLayout = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-black text-white selection:bg-bordo selection:text-white">
      {/* Background Orbs for overall layout */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-bordo rounded-full mix-blend-multiply filter blur-[120px] opacity-10 pointer-events-none"></div>
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-bordo rounded-full mix-blend-multiply filter blur-[120px] opacity-10 pointer-events-none"></div>

      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />
      
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <Header setIsMobileOpen={setIsMobileOpen} />
        
        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
