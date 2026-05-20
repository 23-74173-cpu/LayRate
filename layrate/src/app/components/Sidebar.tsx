import {
  Home, Feather, Thermometer, BarChart3, Link2, TrendingUp,
  ClipboardList, Settings, User, Egg
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router';
import { useSidebar } from './Layout';

const navItems = [
  { icon: Home, path: '/', label: 'Dashboard' },
  { icon: Feather, path: '/cages', label: 'Cages' },
  { icon: Egg, path: '/egg-logging', label: 'Egg Logging' },
  { icon: Thermometer, path: '/environment', label: 'Environment' },
  { icon: Link2, path: '/feed', label: 'Feed & Nutrition' },
  { icon: BarChart3, path: '/analytics', label: 'Analytics' },
  { icon: TrendingUp, path: '/forecast', label: 'Forecast' },
  { icon: ClipboardList, path: '/reports', label: 'Reports' },
];

const bottomItems = [
  { icon: Settings, path: '#', label: 'Settings' },
  { icon: User, path: '#', label: 'Profile' },
];

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { expanded } = useSidebar();

  return (
    <aside
      className={`${
        expanded ? 'w-52' : 'w-14'
      } bg-[#102A4C] flex flex-col py-3 shrink-0 justify-between transition-all duration-200 ease-in-out`}
    >
      {/* Top section */}
      <div className={`flex flex-col gap-1 ${expanded ? 'px-2' : 'items-center'}`}>
        {/* Logo + title */}
        <div className={`flex items-center gap-2.5 mb-4 ${expanded ? 'px-1.5' : 'justify-center'}`}>
          <div className="w-9 h-9 rounded-lg bg-[#1F4B7D] flex items-center justify-center shrink-0 border border-white/25">
            <Feather className="w-5 h-5 text-white" />
          </div>
          {expanded && (
            <div className="overflow-hidden whitespace-nowrap">
              <div className="text-white text-sm font-semibold">LayRate</div>
              <div className="text-white/75 text-[10px]">Farm Monitor</div>
            </div>
          )}
        </div>

        {/* Nav items */}
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => item.path !== '#' && navigate(item.path)}
              className={`group flex items-center gap-2.5 rounded-lg transition-colors ${
                expanded ? 'px-2.5 py-2.5' : 'w-10 h-10 justify-center mx-auto'
              } ${
                active
                  ? 'bg-white/20 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.25)]'
                  : 'text-white/85 hover:text-white hover:bg-white/10'
              }`}
              title={!expanded ? item.label : undefined}
            >
              <item.icon className="w-[19px] h-[19px] shrink-0 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:scale-110" strokeWidth={2.25} />
              {expanded && (
                <span className="text-sm font-medium whitespace-nowrap overflow-hidden">{item.label}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom section */}
      <div className={`flex flex-col gap-1 ${expanded ? 'px-2' : 'items-center'}`}>
        {bottomItems.map((item) => (
          <button
            key={item.label}
            onClick={() => item.path !== '#' && navigate(item.path)}
            className={`group flex items-center gap-2.5 rounded-lg text-white/85 hover:text-white hover:bg-white/10 transition-colors ${
              expanded ? 'px-2.5 py-2.5' : 'w-10 h-10 justify-center mx-auto'
            }`}
            title={!expanded ? item.label : undefined}
          >
            <item.icon className="w-[19px] h-[19px] shrink-0 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:scale-110" strokeWidth={2.25} />
            {expanded && (
              <span className="text-sm font-medium whitespace-nowrap overflow-hidden">{item.label}</span>
            )}
          </button>
        ))}
      </div>
    </aside>
  );
}