import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { EdelweissCorner } from '../ornament';

const AppLayout = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-page text-ink">
      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />

      <div className="relative flex min-w-0 flex-1 flex-col">
        <Header setIsMobileOpen={setIsMobileOpen} />

        {/* faint edelweiss cluster in the top-right corner of the workspace; behind content, desktop only */}
        <div aria-hidden="true" className="pointer-events-none absolute right-0 top-16 hidden opacity-40 xl:block">
          <EdelweissCorner corner="tr" className="w-36" />
        </div>

        <main className="relative z-[1] flex-1 overflow-x-hidden px-4 pb-12 pt-6 sm:px-6 lg:px-10 lg:pt-8">
          {/* route transition: fade + 8px rise as a CSS animation (compositor only, no JS frame loop),
              once per navigation; `backwards` fill leaves no transform behind afterwards */}
          <div key={location.pathname} className="route-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
