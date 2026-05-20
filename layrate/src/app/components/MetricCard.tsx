import { ReactNode } from 'react';

export function MetricCard({ label, value, sub, children }: { label: string; value: string; sub: string; children?: ReactNode }) {
  return (
    <div className="bg-white min-w-0 h-full min-h-[104px] sm:min-h-[132px] p-2 sm:p-4 rounded-lg border border-[#D9D9D9] relative [&_svg]:w-3 [&_svg]:h-3 sm:[&_svg]:w-4 sm:[&_svg]:h-4">
      <div className="text-[8px] sm:text-[10px] tracking-wider text-[#6B7280] mb-1 truncate">{label}</div>
      <div className="text-[clamp(0.85rem,2.9vw,1.25rem)] sm:text-2xl leading-none text-[#333333] mb-0.5 truncate">{value}</div>
      <div className="text-[8px] sm:text-[11px] text-[#6B7280] truncate">{sub}</div>
      {children}
    </div>
  );
}
