import { Menu, WifiOff, Bell, Settings, User } from 'lucide-react';
import { useSidebar } from './Layout';

export function Header({ breadcrumb }: { breadcrumb: string }) {
  const { toggle } = useSidebar();

  return (
    <header className="h-12 bg-white border-b border-[#D9D9D9] flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        <button onClick={toggle} className="hover:text-[#0B203A] transition-colors p-0.5 rounded" aria-label="Toggle sidebar">
          <Menu className="w-4.5 h-4.5 text-[#102A4C]" strokeWidth={2.3} />
        </button>
        <span className="text-xs sm:text-sm text-[#6B7280] tracking-[0.01em] max-w-[50vw] sm:max-w-none truncate">Home / <span className="text-[#102A4C] font-semibold">{breadcrumb}</span></span>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="hidden sm:flex items-center gap-2 bg-[#E6EDF7] text-[#102A4C] text-xs px-3 py-1 rounded-full border border-[#D9D9D9]">
          <WifiOff className="w-3.5 h-3.5" strokeWidth={2.25} />
          Offline - Local Network
        </div>
        <span className="hidden md:block text-xs text-[#6B7280] font-medium">Last sync 2 mins ago</span>
        <div className="relative">
          <Bell className="w-4.5 h-4.5 text-[#102A4C]" strokeWidth={2.25} />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 text-white text-[7px] rounded-full flex items-center justify-center">2</span>
        </div>
        <button
          type="button"
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-[#D9D9D9] text-[#102A4C] hover:bg-[#F5F6F8] transition-colors"
          aria-label="Settings"
          title="Settings"
        >
          <Settings className="w-4 h-4" strokeWidth={2.2} />
        </button>
        <button
          type="button"
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-[#D9D9D9] text-[#102A4C] hover:bg-[#F5F6F8] transition-colors"
          aria-label="Profile"
          title="Profile"
        >
          <User className="w-4 h-4" strokeWidth={2.2} />
        </button>
      </div>
    </header>
  );
}
