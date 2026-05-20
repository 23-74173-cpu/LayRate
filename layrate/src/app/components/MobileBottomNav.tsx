import { useEffect, useState, type ComponentType } from 'react';
import { useLocation, useNavigate } from 'react-router';
import {
  Home,
  Feather,
  Egg,
  Thermometer,
  Plus,
  Link2,
  BarChart3,
  TrendingUp,
  ClipboardList,
} from 'lucide-react';

const primaryItems = [
  { icon: Home, path: '/', label: 'Home' },
  { icon: Feather, path: '/cages', label: 'Cages' },
  { icon: Egg, path: '/egg-logging', label: 'Egg Log' },
  { icon: Thermometer, path: '/environment', label: 'Env' },
];

const secondaryItems = [
  { icon: Link2, path: '/feed', label: 'Feeds' },
  { icon: BarChart3, path: '/analytics', label: 'Analytics' },
  { icon: TrendingUp, path: '/forecast', label: 'Forecast' },
  { icon: ClipboardList, path: '/reports', label: 'Reports' },
];

export function MobileBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const isMoreActive = secondaryItems.some((item) => item.path === location.pathname);

  useEffect(() => {
    setMoreOpen(false);
  }, [location.pathname]);

  return (
    <>
      {moreOpen && (
        <button
          type="button"
          aria-label="Close more options"
          onClick={() => setMoreOpen(false)}
          className="md:hidden fixed inset-0 z-[55] bg-transparent"
        />
      )}

      <nav className="md:hidden print:hidden sticky bottom-0 z-[60] w-full border-t border-[#D9D9D9] bg-[rgba(255,255,255,0.97)] pb-[env(safe-area-inset-bottom)]">
      <div className="w-full relative">
        <div
          className={`absolute z-[65] left-3 right-3 bottom-[calc(100%+0.45rem)] rounded-2xl border border-[#D9D9D9] bg-[rgba(255,255,255,0.98)] shadow-[0_10px_22px_rgba(16,42,76,0.16)] px-2 py-1.5 transition-all duration-200 ${
            moreOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-2 pointer-events-none'
          }`}
        >
          <div className="flex items-center justify-center gap-1.5 overflow-x-auto scrollbar-hide">
            {secondaryItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className={`group shrink-0 inline-flex items-center justify-center gap-1.5 h-8 px-2.5 rounded-full text-[11px] border transition-colors ${
                    active
                      ? 'bg-[#1F4B7D] border-[#1F4B7D] text-white'
                      : 'bg-white border-transparent text-[#475569] hover:bg-[#F5F6F8]'
                  }`}
                >
                  <item.icon className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:scale-110" strokeWidth={2.3} aria-hidden="true" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative px-2 py-1">
          <div className="grid grid-cols-5 items-end h-[56px]">
            <BottomNavItem
              icon={primaryItems[0].icon}
              label={primaryItems[0].label}
              active={location.pathname === primaryItems[0].path}
              onClick={() => navigate(primaryItems[0].path)}
            />
            <BottomNavItem
              icon={primaryItems[1].icon}
              label={primaryItems[1].label}
              active={location.pathname === primaryItems[1].path}
              onClick={() => navigate(primaryItems[1].path)}
            />

            <div className="flex flex-col items-center justify-end -mt-3.5">
              <button
                type="button"
                onClick={() => setMoreOpen((v) => !v)}
                className={`group relative size-[50px] rounded-full border-[3px] border-white shadow-[0_8px_18px_rgba(16,42,76,0.24)] flex items-center justify-center transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#102A4C]/40 ${
                  isMoreActive || moreOpen ? 'bg-[#1F4B7D] text-white' : 'bg-[#102A4C] text-white'
                }`}
                aria-label="Toggle more options"
              >
                <span className="absolute -inset-[3px] rounded-full border border-[#9FB1C9]/80 pointer-events-none" />
                <Plus className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${moreOpen ? 'rotate-45' : ''}`} strokeWidth={2.6} aria-hidden="true" />
              </button>
              <span className="text-[11px] leading-none mt-0.5 text-[#6B7280]">More</span>
            </div>

            <BottomNavItem
              icon={primaryItems[2].icon}
              label={primaryItems[2].label}
              active={location.pathname === primaryItems[2].path}
              onClick={() => navigate(primaryItems[2].path)}
            />
            <BottomNavItem
              icon={primaryItems[3].icon}
              label={primaryItems[3].label}
              active={location.pathname === primaryItems[3].path}
              onClick={() => navigate(primaryItems[3].path)}
            />
          </div>
        </div>
      </div>
    </nav>
    </>
  );
}

function BottomNavItem({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex flex-col items-center justify-end gap-0.5 min-h-[48px] rounded-xl py-0.5 transition-colors ${
        active ? 'text-[#1F4B7D]' : 'text-[#6B7280] hover:text-[#102A4C]'
      }`}
      aria-label={label}
    >
      {active && <span className="absolute -top-1 h-0.5 w-7 rounded-full bg-[#1F4B7D]" />}
      <Icon className="w-5 h-5 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:scale-110" strokeWidth={2.4} aria-hidden="true" />
      <span className={`text-[11px] leading-none max-[360px]:hidden ${active ? 'font-medium' : ''}`}>{label}</span>
    </button>
  );
}
