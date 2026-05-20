import { useState, createContext, useContext } from 'react';
import { Outlet, useLocation } from 'react-router';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileBottomNav } from './MobileBottomNav';
import { useIsMobile } from './ui/use-mobile';

interface SidebarContextType {
  expanded: boolean;
  toggle: () => void;
}

const SidebarContext = createContext<SidebarContextType>({ expanded: false, toggle: () => {} });

export function useSidebar() {
  return useContext(SidebarContext);
}

const breadcrumbMap: Record<string, string> = {
  '/': 'Dashboard',
  '/cages': 'Cage Management',
  '/egg-logging': 'Egg Logging',
  '/environment': 'Environment',
  '/feed': 'Feed & Nutrition',
  '/analytics': 'Analytics',
  '/forecast': 'Forecast',
  '/reports': 'Reports',
};

export function Layout() {
  const [expanded, setExpanded] = useState(true);
  const isMobile = useIsMobile();
  const location = useLocation();
  const breadcrumb = breadcrumbMap[location.pathname] || 'Dashboard';

  return (
    <SidebarContext.Provider value={{ expanded, toggle: () => setExpanded(e => !e) }}>
      <div className="min-h-screen bg-transparent flex">
        {!isMobile && <Sidebar />}
        <div className="flex-1 flex flex-col min-w-0 bg-transparent">
          <Header breadcrumb={breadcrumb} />
          <div className="flex-1 min-h-0 [&>main]:pb-5">
            <Outlet />
          </div>
          {isMobile && <MobileBottomNav />}
        </div>
      </div>
    </SidebarContext.Provider>
  );
}
