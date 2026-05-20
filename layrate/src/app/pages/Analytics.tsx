import { CAGE_COLORS } from '../constants/cageColors';
import { useState, useRef, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Cell,
} from 'recharts';
import { ChevronDown, Wifi, PenLine, LayoutGrid, Square } from 'lucide-react';

// ─── Constants ─────────────────────────────────────────────────────────────
const ALL = 'All Cages';
const cages = ['CAGE-A', 'CAGE-B', 'CAGE-C', 'CAGE-D'];
const timeRanges = ['Week', 'Month', '3 Months'];

// ─── Per-cage data ──────────────────────────────────────────────────────────
const cageData: Record<string, {
  breed: string; avgHdep: string; bestDay: string; worstDay: string; flockAge: string;
  hdepTarget: number;
  hdepTrend: { day: string; val: number }[];
  eggsPerDay: { day: string; val: number; source: 'sensor' | 'manual' }[];
  feedVsHdep: { feed: number; hdep: number }[];
}> = {
  'CAGE-A': {
    breed: 'ISA Brown', avgHdep: '83.6%', bestDay: '85.8%', worstDay: '81.0%',
    flockAge: '28 wks', hdepTarget: 88,
    hdepTrend: [
      { day: 'D1', val: 81 }, { day: 'D2', val: 83 }, { day: 'D3', val: 82.5 },
      { day: 'D4', val: 84 }, { day: 'D5', val: 83 }, { day: 'D6', val: 84 }, { day: 'D7', val: 85.8 },
    ],
    eggsPerDay: [
      { day: 'D1', val: 92, source: 'sensor' }, { day: 'D2', val: 95, source: 'sensor' },
      { day: 'D3', val: 94, source: 'manual' }, { day: 'D4', val: 97, source: 'sensor' },
      { day: 'D5', val: 93, source: 'manual' }, { day: 'D6', val: 96, source: 'sensor' },
      { day: 'D7', val: 103, source: 'sensor' },
    ],
    feedVsHdep: [{ feed: 10.5, hdep: 85.8 }],
  },
  'CAGE-B': {
    breed: 'Lohmann Brown-Classic', avgHdep: '71.8%', bestDay: '74.2%', worstDay: '70.1%',
    flockAge: '34 wks', hdepTarget: 80,
    hdepTrend: [
      { day: 'D1', val: 70 }, { day: 'D2', val: 71 }, { day: 'D3', val: 72 },
      { day: 'D4', val: 71.5 }, { day: 'D5', val: 73 }, { day: 'D6', val: 72 }, { day: 'D7', val: 72.5 },
    ],
    eggsPerDay: [
      { day: 'D1', val: 84, source: 'sensor' }, { day: 'D2', val: 85, source: 'manual' },
      { day: 'D3', val: 86, source: 'manual' }, { day: 'D4', val: 85, source: 'sensor' },
      { day: 'D5', val: 87, source: 'sensor' }, { day: 'D6', val: 86, source: 'manual' },
      { day: 'D7', val: 87, source: 'sensor' },
    ],
    feedVsHdep: [{ feed: 11.2, hdep: 72.5 }],
  },
  'CAGE-C': {
    breed: 'Dekalb White', avgHdep: '57.5%', bestDay: '60.1%', worstDay: '55.2%',
    flockAge: '52 wks', hdepTarget: 75,
    hdepTrend: [
      { day: 'D1', val: 56 }, { day: 'D2', val: 57 }, { day: 'D3', val: 58 },
      { day: 'D4', val: 57.5 }, { day: 'D5', val: 58 }, { day: 'D6', val: 57 }, { day: 'D7', val: 58.3 },
    ],
    eggsPerDay: [
      { day: 'D1', val: 67, source: 'manual' }, { day: 'D2', val: 68, source: 'manual' },
      { day: 'D3', val: 70, source: 'sensor' }, { day: 'D4', val: 69, source: 'sensor' },
      { day: 'D5', val: 70, source: 'manual' }, { day: 'D6', val: 68, source: 'sensor' },
      { day: 'D7', val: 70, source: 'manual' },
    ],
    feedVsHdep: [{ feed: 12, hdep: 58.3 }],
  },
  'CAGE-D': {
    breed: 'ISA Brown (Pullet)', avgHdep: '0%', bestDay: '0%', worstDay: '0%',
    flockAge: '18 wks', hdepTarget: 88,
    hdepTrend: [
      { day: 'D1', val: 0 }, { day: 'D2', val: 0 }, { day: 'D3', val: 0 },
      { day: 'D4', val: 0 }, { day: 'D5', val: 0 }, { day: 'D6', val: 0 }, { day: 'D7', val: 0 },
    ],
    eggsPerDay: [
      { day: 'D1', val: 0, source: 'sensor' }, { day: 'D2', val: 0, source: 'sensor' },
      { day: 'D3', val: 0, source: 'sensor' }, { day: 'D4', val: 0, source: 'sensor' },
      { day: 'D5', val: 0, source: 'sensor' }, { day: 'D6', val: 0, source: 'sensor' },
      { day: 'D7', val: 0, source: 'sensor' },
    ],
    feedVsHdep: [{ feed: 9, hdep: 0 }],
  },
};

// ─── Combined datasets for "All Cages" view ─────────────────────────────────
const DAYS = ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7'];

const allHdepTrend = DAYS.map((day, i) => ({
  day,
  'CAGE-A': cageData['CAGE-A'].hdepTrend[i].val,
  'CAGE-B': cageData['CAGE-B'].hdepTrend[i].val,
  'CAGE-C': cageData['CAGE-C'].hdepTrend[i].val,
  'CAGE-D': cageData['CAGE-D'].hdepTrend[i].val,
}));

const allEggsPerDay = DAYS.map((day, i) => ({
  day,
  'CAGE-A': cageData['CAGE-A'].eggsPerDay[i].val,
  'CAGE-B': cageData['CAGE-B'].eggsPerDay[i].val,
  'CAGE-C': cageData['CAGE-C'].eggsPerDay[i].val,
  'CAGE-D': cageData['CAGE-D'].eggsPerDay[i].val,
}));

const allFeedVsHdep = cages.map(c => ({
  cage: c,
  feed: cageData[c].feedVsHdep[0].feed,
  hdep: cageData[c].feedVsHdep[0].hdep,
}));

// ─── Cage avg helper ─────────────────────────────────────────────────────────
function cageAvg(cage: string) {
  const vals = cageData[cage].hdepTrend.map(d => d.val);
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

// ─── Custom bar: filled = sensor, hollow = manual ────────────────────────────
function EggBar(props: any) {
  const { x, y, width, height, source, color } = props;
  if (!height || height <= 0) return null;
  if (source === 'manual') {
    return <rect x={x} y={y} width={width} height={height} fill="transparent" stroke={color} strokeWidth={2} rx={3} ry={3} />;
  }
  return <rect x={x} y={y} width={width} height={height} fill={color} rx={3} ry={3} />;
}

// ─── Egg bar tooltip ──────────────────────────────────────────────────────────
function EggTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const { val, source } = payload[0].payload;
  return (
    <div className="bg-[rgba(255,255,255,0.90)] border border-[#D9D9D9] rounded px-3 py-2 text-xs shadow-xl">
      <p className="text-[10px] text-[#6B7280] mb-1">{label}</p>
      <p className="text-[#333333]">{val} eggs</p>
      <p className={`flex items-center gap-1 mt-0.5 text-[10px] ${source === 'sensor' ? 'text-emerald-400' : 'text-amber-400'}`}>
        {source === 'sensor' ? <><Wifi size={10} /> Sensor</> : <><PenLine size={10} /> Manual</>}
      </p>
    </div>
  );
}

// ─── Dropdown ─────────────────────────────────────────────────────────────────
function CageDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isAll = value === ALL;
  const dotColor = isAll ? '#6B7280' : CAGE_COLORS[value];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-md border border-[#D9D9D9] bg-white hover:bg-[#F5F6F8] transition-colors min-w-[130px] shadow-sm"
      >
        {isAll
          ? <LayoutGrid size={12} className="text-gray-400 flex-shrink-0" />
          : <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dotColor }} />
        }
        <span className="flex-1 text-left text-[#333333]">{value}</span>
        <ChevronDown size={12} className={`text-[#6B7280] flex-shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-40 bg-[rgba(255,255,255,0.90)] border border-[#D9D9D9] rounded-lg shadow-2xl overflow-hidden min-w-[160px]">
          <div className="px-3 pt-2 pb-1 text-[9px] tracking-widest text-[#6B7280] uppercase">View</div>

          {/* All Cages option */}
          <button
            onClick={() => { onChange(ALL); setOpen(false); }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors ${value === ALL ? 'bg-[#EAF0F8] text-[#333333]' : 'text-[#6B7280] hover:bg-[#F5F6F8]'}`}
          >
            <LayoutGrid size={12} className="text-[#6B7280] flex-shrink-0" />
            <span className="flex-1 text-left">All Cages</span>
            {value === ALL && <span className="text-[9px] bg-blue-100 text-blue-600 rounded px-1">active</span>}
          </button>

          <div className="mx-3 my-1 border-t border-[#D9D9D9]" />
          <div className="px-3 pb-1 text-[9px] tracking-widest text-[#6B7280] uppercase">Individual</div>

          {/* Per-cage options */}
          {cages.map(c => (
            <button
              key={c}
              onClick={() => { onChange(c); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors ${value === c ? 'bg-[#EAF0F8] text-[#333333]' : 'text-[#6B7280] hover:bg-[#F5F6F8]'}`}
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: CAGE_COLORS[c] }} />
              <span className="flex-1 text-left">{c}</span>
              <span className="text-[9px] text-[#6B7280]">{cageData[c].breed.split(' ')[0]}</span>
              {value === c && <span className="text-[9px] bg-emerald-50 text-emerald-600 rounded px-1 ml-1">active</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── "All Cages" combined view ────────────────────────────────────────────────
function AllCagesView() {
  const ranked = [...cages]
    .map(c => ({ cage: c, avg: cageAvg(c) }))
    .sort((a, b) => b.avg - a.avg);

  return (
    <>
      {/* Multi-line HDEP trend */}
      <div className="bg-white rounded-lg border border-[#D9D9D9] p-4 sm:p-5 mb-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
          <div>
            <div className="text-[10px] tracking-wider text-[#6B7280]">7-DAY HDEP TREND — ALL CAGES</div>
            <div className="text-[11px] text-[#6B7280] mt-0.5">Side-by-side comparison across all cages</div>
          </div>
          <div className="inline-flex items-center gap-1.5 text-[10px] text-[#6B7280] bg-white border border-[#D9D9D9] rounded px-2.5 py-1 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 inline-block" />
            Dashed = 80% floor
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 sm:gap-5 mb-3">
          {cages.map(c => (
            <span key={c} className="flex items-center gap-1.5 text-[10px] text-[#6B7280]">
              <span className="inline-block w-5 h-0.5 rounded-full" style={{ background: CAGE_COLORS[c] }} />
              {c}
            </span>
          ))}
        </div>

        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={allHdepTrend} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E0DDD6" />
            <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="#999" />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="#999" tickFormatter={v => `${v}%`} />
            <Tooltip
              contentStyle={{ fontSize: 11, background: 'rgba(255,255,255,0.90)', border: '1px solid #D9D9D9', borderRadius: 6 }}
              labelStyle={{ color: '#aaa', fontSize: 10 }}
              itemStyle={{ fontSize: 11 }}
              formatter={(v: number, name: string) => [`${v}%`, name]}
            />
            <ReferenceLine y={80} stroke="#FB923C" strokeDasharray="5 4" strokeWidth={1}
              label={{ value: '80% floor', position: 'insideTopLeft', fontSize: 9, fill: '#FB923C', dx: 4, dy: -4 }} />
            {cages.map(c => (
              <Line key={c} type="monotone" dataKey={c}
                stroke={CAGE_COLORS[c]} strokeWidth={2}
                dot={{ r: 3.5, fill: CAGE_COLORS[c], strokeWidth: 0 }}
                activeDot={{ r: 5 }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Eggs + Scatter side by side */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-5">
        {/* Grouped eggs per day */}
        <div className="bg-white rounded-lg border border-[#D9D9D9] p-4 sm:p-5">
          <div className="text-[10px] tracking-wider text-[#6B7280] mb-3">EGGS COLLECTED PER DAY — ALL CAGES</div>
          <div className="flex flex-wrap gap-3 sm:gap-4 mb-3">
            {cages.map(c => (
              <span key={c} className="flex items-center gap-1.5 text-[10px] text-[#6B7280]">
                <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: CAGE_COLORS[c] }} />
                {c}
              </span>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={195}>
            <BarChart data={allEggsPerDay} barCategoryGap="20%" barGap={2} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0DDD6" />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="#999" />
              <YAxis tick={{ fontSize: 10 }} stroke="#999" />
              <Tooltip
                contentStyle={{ fontSize: 11, background: 'rgba(255,255,255,0.90)', border: '1px solid #D9D9D9', borderRadius: 6 }}
                labelStyle={{ color: '#aaa', fontSize: 10 }}
                itemStyle={{ fontSize: 11 }}
              />
              {cages.map(c => (
                <Bar key={c} dataKey={c} fill={CAGE_COLORS[c]} radius={[2, 2, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Multi-cage feed vs HDEP scatter */}
        <div className="bg-white rounded-lg border border-[#D9D9D9] p-4 sm:p-5">
          <div className="text-[10px] tracking-wider text-[#6B7280] mb-3">FEED vs HDEP — ALL CAGES</div>
          <div className="flex flex-wrap gap-3 sm:gap-4 mb-3">
            {cages.map(c => (
              <span key={c} className="flex items-center gap-1.5 text-[10px] text-[#6B7280]">
                <span className="inline-block w-2 h-2 rounded-full" style={{ background: CAGE_COLORS[c] }} />
                {c}
              </span>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={195}>
            <ScatterChart margin={{ top: 4, right: 16, left: 0, bottom: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0DDD6" />
              <XAxis type="number" dataKey="feed" domain={[0, 14]} tick={{ fontSize: 10 }} stroke="#999"
                tickFormatter={v => `${v}kg`}
                label={{ value: 'Feed (kg)', position: 'insideBottom', dy: 16, fontSize: 10, fill: '#999' }} />
              <YAxis type="number" dataKey="hdep" domain={[0, 100]} tick={{ fontSize: 10 }} stroke="#999"
                tickFormatter={v => `${v}%`} />
              <Tooltip
                contentStyle={{ fontSize: 11, background: 'rgba(255,255,255,0.90)', border: '1px solid #D9D9D9', borderRadius: 6 }}
                itemStyle={{ color: '#fff', fontSize: 11 }}
                formatter={(v: number, name: string) => [name === 'hdep' ? `${v}%` : `${v}kg`, name === 'hdep' ? 'HDEP' : 'Feed']}
              />
              {allFeedVsHdep.map(d => (
                <Scatter key={d.cage} data={[d]} fill={CAGE_COLORS[d.cage]} r={8} name={d.cage} />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Ranked summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {ranked.map((item, rank) => {
          const d = cageData[item.cage];
          const color = CAGE_COLORS[item.cage];
          return (
            <div key={item.cage} className="bg-white rounded-lg border border-[#D9D9D9] p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                  <span className="text-xs text-[#333333]">{item.cage}</span>
                </div>
                <div className="flex gap-1">
                  <span className="text-[9px] text-[#6B7280]">#{rank + 1}</span>
                  {rank === 0 && <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1 rounded">top</span>}
                  {rank === cages.length - 1 && item.avg > 0 && <span className="text-[9px] bg-red-100 text-red-600 px-1 rounded">low</span>}
                </div>
              </div>
              <div className="text-lg mb-0.5" style={{ color }}>{item.avg > 0 ? `${item.avg.toFixed(1)}%` : '—'}</div>
              <div className="text-[10px] text-gray-400 mb-2">7-day avg HDEP</div>
              <div className="space-y-1 text-[10px] text-gray-500">
                <div className="flex justify-between"><span>Breed</span><span className="text-gray-700 truncate max-w-[90px] text-right">{d.breed}</span></div>
                <div className="flex justify-between"><span>Best day</span><span className="text-gray-700">{d.bestDay}</span></div>
                <div className="flex justify-between"><span>Flock age</span><span className="text-gray-700">{d.flockAge}</span></div>
                <div className="flex justify-between"><span>Target</span><span style={{ color: '#FB923C' }}>{d.hdepTarget}%</span></div>
              </div>
              {/* Mini progress vs target */}
              <div className="mt-3">
                <div className="flex justify-between text-[9px] text-gray-400 mb-1">
                  <span>vs target</span>
                  <span style={{ color: item.avg >= d.hdepTarget ? '#2D6A4F' : '#FB923C' }}>
                    {item.avg > 0 ? (item.avg >= d.hdepTarget ? `+${(item.avg - d.hdepTarget).toFixed(1)}%` : `${(item.avg - d.hdepTarget).toFixed(1)}%`) : 'n/a'}
                  </span>
                </div>
                <div className="h-1 rounded-full bg-[#E0DDD6] overflow-hidden">
                  <div className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (item.avg / d.hdepTarget) * 100)}%`,
                      background: item.avg >= d.hdepTarget ? color : '#FB923C',
                    }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ─── Single-cage view ─────────────────────────────────────────────────────────
function SingleCageView({ cage }: { cage: string }) {
  const data = cageData[cage];
  const color = CAGE_COLORS[cage];

  return (
    <>
      {/* HDEP Trend with target line */}
      <div className="bg-[#FAF8F5] rounded-lg border border-[#D4CFC4] p-4 sm:p-5 mb-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
          <div>
            <div className="text-[10px] tracking-wider text-gray-500">7-DAY HDEP TREND — {cage}</div>
            <div className="text-[11px] text-gray-400 mt-0.5">{data.breed}</div>
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[10px] text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-5 h-0.5 rounded-full" style={{ background: color }} />
              Actual HDEP
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-5 border-t-2 border-dashed border-orange-400" />
              Target ({data.hdepTarget}%)
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data.hdepTrend} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E0DDD6" />
            <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="#999" />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="#999" tickFormatter={v => `${v}%`} />
            <Tooltip
              contentStyle={{ fontSize: 11, background: '#1E1E1E', border: '1px solid #333', borderRadius: 6 }}
              labelStyle={{ color: '#aaa', fontSize: 10 }}
              itemStyle={{ color: '#fff' }}
              formatter={(v: number) => [`${v}%`, 'HDEP']}
            />
            <ReferenceLine y={data.hdepTarget} stroke="#FB923C" strokeDasharray="6 4" strokeWidth={1.5}
              label={{ value: `${data.hdepTarget}% target`, position: 'insideTopRight', fontSize: 9, fill: '#FB923C', dy: -4 }} />
            <Line type="monotone" dataKey="val" stroke={color} strokeWidth={2.5}
              dot={{ r: 4, fill: color, strokeWidth: 0 }} activeDot={{ r: 5.5 }} />
          </LineChart>
        </ResponsiveContainer>
        {data.hdepTrend.some(d => d.val > 0 && d.val < data.hdepTarget) && (
          <div className="mt-3 flex items-center gap-2 bg-orange-50 border border-orange-200 rounded px-3 py-2">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />
            <p className="text-[10px] text-orange-700">
              All 7 days below the {data.hdepTarget}% breed target for {data.breed}.
              {cage === 'CAGE-C' && ' Production decline expected at 52+ wks.'}
            </p>
          </div>
        )}
      </div>

      {/* Bottom two charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-5">
        {/* Eggs with source annotation */}
        <div className="bg-[#FAF8F5] rounded-lg border border-[#D4CFC4] p-4 sm:p-5">
          <div className="text-[10px] tracking-wider text-gray-500 mb-3">EGGS COLLECTED PER DAY — {cage}</div>
          <div className="flex gap-3 mb-3">
            <span className="flex items-center gap-1.5 text-[10px] text-gray-400">
              <span className="inline-block w-3 h-3 rounded-sm" style={{ background: color }} />
              <Wifi size={10} /> Sensor
            </span>
            <span className="flex items-center gap-1.5 text-[10px] text-gray-400">
              <span className="inline-block w-3 h-3 rounded-sm border-2" style={{ borderColor: color }} />
              <PenLine size={10} /> Manual
            </span>
          </div>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={data.eggsPerDay} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0DDD6" />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="#999" />
              <YAxis tick={{ fontSize: 10 }} stroke="#999" />
              <Tooltip content={<EggTooltip />} />
              <Bar dataKey="val" radius={[3, 3, 0, 0]}
                shape={(props: any) => <EggBar {...props} color={color} />}>
                {data.eggsPerDay.map((entry, i) => (
                  <Cell key={i} fill={entry.source === 'sensor' ? color : 'transparent'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Feed vs HDEP scatter */}
        <div className="bg-[#FAF8F5] rounded-lg border border-[#D4CFC4] p-4 sm:p-5">
          <div className="text-[10px] tracking-wider text-gray-500 mb-4">FEED vs HDEP — {cage}</div>
          <ResponsiveContainer width="100%" height={200}>
            <ScatterChart margin={{ top: 4, right: 16, left: 0, bottom: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0DDD6" />
              <XAxis type="number" dataKey="feed" domain={[0, 14]} tick={{ fontSize: 10 }} stroke="#999"
                tickFormatter={v => `${v}kg`}
                label={{ value: 'Feed (kg)', position: 'insideBottom', dy: 16, fontSize: 10, fill: '#999' }} />
              <YAxis type="number" dataKey="hdep" domain={[0, 100]} tick={{ fontSize: 10 }} stroke="#999"
                tickFormatter={v => `${v}%`} />
              <Tooltip
                contentStyle={{ fontSize: 11, background: '#1E1E1E', border: '1px solid #333', borderRadius: 6 }}
                itemStyle={{ color: '#fff', fontSize: 11 }}
                formatter={(v: number, name: string) => [name === 'hdep' ? `${v}%` : `${v}kg`, name === 'hdep' ? 'HDEP' : 'Feed']}
              />
              <Scatter data={data.feedVsHdep} fill={color} r={8} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary bar */}
      <div className="bg-[#FAF8F5] rounded-lg border border-[#D4CFC4] px-4 sm:px-6 py-4 flex flex-wrap gap-x-6 sm:gap-x-10 gap-y-3">
        {[
          { label: 'CAGE', value: cage, color },
          { label: 'BREED', value: data.breed },
          { label: 'AVG HDEP', value: data.avgHdep },
          { label: 'BEST DAY', value: data.bestDay },
          { label: 'WORST DAY', value: data.worstDay },
          { label: 'FLOCK AGE', value: data.flockAge },
          { label: 'HDEP TARGET', value: `${data.hdepTarget}%`, color: '#FB923C' },
        ].map(item => (
          <div key={item.label}>
            <div className="text-[10px] tracking-wider text-gray-500 mb-1">{item.label}</div>
            <div className="text-sm" style={{ color: item.color ?? '#1F2937' }}>{item.value}</div>
          </div>
        ))}
      </div>
    </>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export function Analytics() {
  const [selected, setSelected] = useState<string>(ALL);
  const [activeRange, setActiveRange] = useState('Week');

  return (
    <main className="flex-1 p-3 sm:p-5 overflow-auto">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
        <div>
          <h1 className="text-xl">Analytics</h1>
          <p className="text-[11px] text-gray-400 mt-0.5">Performance metrics &amp; trend analysis</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <CageDropdown value={selected} onChange={setSelected} />
          <div className="hidden sm:block w-px h-5 bg-[#D4CFC4]" />
          <div className="flex flex-wrap gap-1">
            {timeRanges.map(r => (
              <button key={r} onClick={() => setActiveRange(r)}
                className={`px-3 py-1.5 text-xs rounded border transition-colors ${
                  activeRange === r
                    ? 'bg-[#333] text-white border-[#333]'
                    : 'bg-white border-[#D4CFC4] text-gray-600 hover:bg-[#F5F3EE]'
                }`}>{r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      {selected === ALL
        ? <AllCagesView />
        : <SingleCageView cage={selected} />
      }
    </main>
  );
}