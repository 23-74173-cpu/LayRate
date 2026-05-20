import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { MetricCard } from '../components/MetricCard';
import { CAGE_COLORS } from '../constants/cageColors';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

const cages = [
  { id: 'CAGE-A', breed: 'ISA Brown', hens: 120, age: '28 wks (6 mo)', sensors: 2, pct: 85.8, color: CAGE_COLORS['CAGE-A'], hasSensor: true, lastLogged: '2026-04-12T08:32:00', sensorEggs: 103, manualEggs: 0 },
  { id: 'CAGE-B', breed: 'Lohmann Brown-Classic', hens: 120, age: '34 wks (8 mo)', sensors: 2, pct: 72.5, color: CAGE_COLORS['CAGE-B'], hasSensor: true, lastLogged: '2026-04-12T07:15:00', sensorEggs: 87, manualEggs: 0 },
  { id: 'CAGE-C', breed: 'Dekalb White', hens: 120, age: '52 wks (12 mo)', sensors: 1, pct: 58.3, color: CAGE_COLORS['CAGE-C'], hasSensor: false, lastLogged: '2026-04-11T16:45:00', sensorEggs: 0, manualEggs: 70 },
  { id: 'CAGE-D', breed: 'ISA Brown', hens: 120, age: '18 wks (4 mo)', sensors: 0, pct: 0, color: CAGE_COLORS['CAGE-D'], hasSensor: false, lastLogged: '2026-04-10T09:00:00', sensorEggs: 0, manualEggs: 0 },
];

const rows = ['A', 'B', 'C'];
const cols = Array.from({ length: 10 }, (_, i) => i + 1);

// Sensor-equipped slots per cage (slots that have IR sensors)
const sensorSlots: Record<string, string[]> = {
  'CAGE-A': ['A1','A2','A3','A4','A5','B1','B2','B3','B4','B5','C1','C2','C3','C4','C5'],
  'CAGE-B': ['A1','A2','A3','A4','A5','A6','B1','B2','B3','B4','B5','B6','C1','C2','C3','C4','C5','C6'],
  'CAGE-C': [],
  'CAGE-D': [],
};

const feedData = [
  { cage: 'CAGE-A', consumed: 42, total: 48, pct: 88, color: CAGE_COLORS['CAGE-A'] },
  { cage: 'CAGE-B', consumed: 45, total: 48, pct: 94, color: CAGE_COLORS['CAGE-B'] },
  { cage: 'CAGE-C', consumed: 38, total: 48, pct: 79, color: CAGE_COLORS['CAGE-C'] },
];

const mortalityData = [
  { cage: 'CAGE-A', value: 'None', color: CAGE_COLORS['CAGE-A'] },
  { cage: 'CAGE-B', value: '1 dead', color: CAGE_COLORS['CAGE-B'] },
  { cage: 'CAGE-C', value: '2 dead', color: CAGE_COLORS['CAGE-C'] },
  { cage: 'CAGE-D', value: 'None', color: CAGE_COLORS['CAGE-D'] },
];

const tasks = [
  { date: 'Today', text: 'CAGE-C: Deworming treatment', urgent: true },
  { date: 'Tomorrow', text: 'CAGE-A: Vitamin supplement mix', urgent: false },
  { date: 'Apr 14', text: 'CAGE-B: Scheduled vet visit', urgent: false },
  { date: 'Apr 17', text: 'All cages: Coop disinfection', urgent: false },
];

const liveReadings = [
  { cage: 'CAGE-A', temp: '28.9°C', hum: '68.1%', status: 'Normal', bgColor: CAGE_COLORS['CAGE-A'] },
  { cage: 'CAGE-B', temp: '28.7°C', hum: '70%', status: 'Watch', bgColor: CAGE_COLORS['CAGE-B'] },
  { cage: 'CAGE-C', temp: '29.2°C', hum: '71%', status: 'Alert', bgColor: CAGE_COLORS['CAGE-C'] },
  { cage: 'CAGE-D', temp: '27.9°C', hum: '66.6%', status: 'Normal', bgColor: CAGE_COLORS['CAGE-D'] },
];

const TODAY = '2026-04-12';

function isLoggedToday(lastLogged: string) {
  return lastLogged.startsWith(TODAY);
}

function formatTimeAgo(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date(`${TODAY}T10:00:00`);
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d ago`;
}

// Compute eggs breakdown
const totalSensorEggs = cages.reduce((s, c) => s + c.sensorEggs, 0); // 190
const totalManualEggs = cages.reduce((s, c) => s + c.manualEggs, 0); // 70
const totalEggs = totalSensorEggs + totalManualEggs; // 260

export function Dashboard() {
  const [hdepHover, setHdepHover] = useState(false);
  const [selectedCageId, setSelectedCageId] = useState(cages[0].id);

  const selectedCage = cages.find((c) => c.id === selectedCageId) ?? cages[0];

  return (
    <>
      <main className="flex-1 p-3 sm:p-5 overflow-auto">
        {/* Metrics */}
        <div className="grid grid-cols-4 auto-rows-fr gap-1.5 sm:gap-4 mb-5 items-stretch">
          <MetricCard label="TOTAL HENS" value="480" sub="+0 today" />

          {/* HDEP card with tooltip */}
          <div
            className="relative h-full"
            onMouseEnter={() => setHdepHover(true)}
            onMouseLeave={() => setHdepHover(false)}
          >
            <MetricCard label="TODAY'S HDEP" value="54.2%" sub="↑ 2.1% vs yesterday" />
            {hdepHover && (
              <div className="absolute top-full left-0 mt-1 z-20 bg-[rgba(255,255,255,0.90)] border border-[#D9D9D9] rounded-lg shadow-lg p-3 w-64">
                <div className="text-[10px] tracking-wider text-[#6B7280] mb-2">CAGE BREAKDOWN</div>
                {cages.map((c) => {
                  const farmAvg = 54.2;
                  const delta = c.pct - farmAvg;
                  const isDrag = delta < -10;
                  return (
                    <div key={c.id} className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                        <span className="text-xs text-[#333333]">{c.id}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono" style={{ color: c.color }}>{c.pct}%</span>
                        {isDrag && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-200">
                            ↓ drag
                          </span>
                        )}
                        {delta > 10 && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-50 text-green-700 border border-green-200">
                            ↑ lift
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div className="mt-2 pt-2 border-t border-[#D9D9D9] text-[10px] text-[#6B7280]">
                  CAGE-C &amp; CAGE-D are pulling down the farm average
                </div>
              </div>
            )}
          </div>

          {/* Eggs collected with sensor/manual breakdown */}
          <MetricCard
            label="EGGS COLLECTED"
            value={String(totalEggs)}
            sub={`${totalSensorEggs} sensor + ${totalManualEggs} manual`}
          />

          <div className="bg-white min-w-0 h-full min-h-[104px] sm:min-h-[132px] p-2 sm:p-4 rounded-lg border border-[#D9D9D9]">
            <div className="text-[8px] sm:text-[10px] tracking-wider text-[#6B7280] mb-1 sm:mb-2 truncate">COOP ENVIRONMENT</div>
            <div className="grid grid-cols-2 gap-1 sm:gap-4 mb-1 sm:mb-2">
              <div className="min-w-0">
                <div className="text-[8px] sm:text-[10px] text-[#6B7280]">TEMP</div>
                <div className="text-[clamp(0.85rem,3vw,1.1rem)] sm:text-2xl tracking-tight text-[#333333] leading-none mt-0.5">28.7°</div>
              </div>
              <div className="min-w-0">
                <div className="text-[8px] sm:text-[10px] text-[#6B7280]">HUMIDITY</div>
                <div className="text-[clamp(0.85rem,3vw,1.1rem)] sm:text-2xl tracking-tight text-[#333333] leading-none mt-0.5">68.9%</div>
              </div>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:gap-2">
              <span className="text-[8px] sm:text-[10px] bg-[#D5E8D4] text-[#004F9F] px-1.5 sm:px-2 py-0.5 rounded whitespace-nowrap">Temp OK</span>
              <span className="text-[8px] sm:text-[10px] bg-[#D5E8D4] text-[#004F9F] px-1.5 sm:px-2 py-0.5 rounded whitespace-nowrap">Humidity OK</span>
            </div>
          </div>
        </div>

        {/* Cage Overview */}
        <div className="mb-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
            <h2 className="text-base">Cage Overview</h2>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-[11px] text-[#6B7280]">Select a cage to inspect details</span>
              <Select value={selectedCageId} onValueChange={setSelectedCageId}>
                <SelectTrigger className="w-full sm:w-[240px] h-8 text-xs border-[#D9D9D9] text-[#333333]">
                  <SelectValue placeholder="Select cage" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {cages.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-xs">
                      {c.id} - {c.breed}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {(() => {
              const cage = selectedCage;
              const loggedToday = isLoggedToday(cage.lastLogged);
              const timeAgo = formatTimeAgo(cage.lastLogged);
              return (
                <div key={cage.id} className="bg-white p-3 sm:p-4 rounded-lg border border-[#D9D9D9]">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-1">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm" style={{ color: cage.color }}>{cage.id}</span>
                        <span className="text-sm text-[#6B7280]">{cage.breed}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Last logged indicator */}
                      <span className={`text-[10px] px-2 py-0.5 rounded ${
                        loggedToday
                          ? 'bg-[#D5E8D4] text-[#2D6A4F]'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {loggedToday ? `Logged ${timeAgo}` : `Stale · ${timeAgo}`}
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: cage.pct > 70 ? '#D5E8D4' : cage.pct > 40 ? '#FFF3CD' : '#F8D7DA',
                          color: cage.pct > 70 ? '#004F9F' : cage.pct > 40 ? '#856404' : '#721C24',
                        }}
                      >
                        {cage.pct}%
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] text-[#6B7280] mb-3">
                    <span>{cage.hens} hens</span>
                    <span>{cage.age}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${cage.sensors > 0 ? 'bg-[#D5E8D4] text-[#2D6A4F]' : 'bg-gray-200 text-gray-500'}`}>
                      {cage.sensors > 0 ? `${cage.sensors} sensor` : 'No sensor'}
                    </span>
                  </div>
                  <div className="mb-3 overflow-x-auto">
                    <div className="min-w-[360px]">
                    {rows.map((row) => (
                      <div key={row} className="flex items-center gap-1 mb-1">
                        <div className="w-6 text-[11px] text-[#6B7280] shrink-0">{row}</div>
                        {cols.map((col) => {
                          const slotId = `${row}${col}`;
                          const hasSensorOnSlot = (sensorSlots[cage.id] || []).includes(slotId);
                          return (
                            <div
                              key={col}
                              className="flex-1 text-center text-[10px] py-1.5 rounded bg-[#F5F6F8] text-[#6B7280] hover:bg-[#EAF0F8] cursor-pointer relative"
                            >
                              {slotId}
                              {hasSensorOnSlot && (
                                <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-teal-500" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 flex items-center justify-center gap-1.5 bg-[#F5F6F8] text-[#6B7280] py-2 rounded text-xs hover:bg-[#EAF0F8] border border-[#D9D9D9]">
                      <Pencil className="w-3 h-3" /> Edit
                    </button>
                    <button className="flex-1 text-white py-2 rounded text-xs" style={{ backgroundColor: cage.color }}>
                      View Detail
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Bottom Panels Row 1 */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
          <div className="bg-white p-3 sm:p-4 rounded-lg border border-[#D9D9D9]">
            <h3 className="text-sm mb-3">Feed Today</h3>
            <div className="space-y-3">
              {feedData.map((f) => (
                <div key={f.cage}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs" style={{ color: f.color }}>{f.cage}</span>
                    <span className="text-xs text-[#6B7280]">{f.consumed} / {f.total} kg</span>
                  </div>
                  <div className="w-full bg-[#F5F6F8] rounded-full h-2">
                    <div className="h-2 rounded-full" style={{ width: `${f.pct}%`, backgroundColor: f.color }} />
                  </div>
                  <div className="text-[10px] text-[#6B7280] mt-0.5">{f.pct}% consumed</div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-2 border-t border-[#D9D9D9] flex justify-between text-xs">
              <span>Total consumed</span>
              <span className="text-[#333333]">125 kg</span>
            </div>
          </div>

          <div className="bg-white p-3 sm:p-4 rounded-lg border border-[#D9D9D9]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm">Mortality Today</h3>
              <span className="text-[10px] bg-[#F8D7DA] text-[#721C24] px-2 py-0.5 rounded">3 total</span>
            </div>
            <div className="space-y-3">
              {mortalityData.map((m) => (
                <div key={m.cage} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.color }} />
                    <span className="text-xs text-[#333333]">{m.cage}</span>
                  </div>
                  <span className={`text-xs ${m.value === 'None' ? 'text-[#6B7280]' : 'text-red-700'}`}>{m.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-3 sm:p-4 rounded-lg border border-[#D9D9D9]">
            <h3 className="text-sm mb-3">Upcoming Tasks</h3>
            <div className="space-y-3">
              {tasks.map((t, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded shrink-0 mt-0.5 ${t.urgent ? 'bg-[#B08030] text-white' : 'bg-[#F5F6F8] text-[#6B7280]'}`}>
                    {t.date}
                  </span>
                  <span className="text-xs text-[#333333]">{t.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Panels Row 2 */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="bg-white p-3 sm:p-4 rounded-lg border border-[#D9D9D9]">
            <h3 className="text-sm mb-3">Environmental Summary</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-[#F5F6F8] p-3 rounded-lg border border-[#D9D9D9]">
                <div className="text-[10px] tracking-wider text-[#6B7280] mb-1">TEMPERATURE</div>
                <div className="text-2xl tracking-tight mb-2 text-[#333333]">28.7°C</div>
                <span className="text-[10px] bg-[#D5E8D4] text-[#2D6A4F] px-2 py-0.5 rounded">In range</span>
                <div className="text-[10px] text-[#6B7280] mt-2">Last reading: 2 mins ago</div>
              </div>
              <div className="bg-[#F5F6F8] p-3 rounded-lg border border-[#D9D9D9]">
                <div className="text-[10px] tracking-wider text-[#6B7280] mb-1">HUMIDITY</div>
                <div className="text-2xl tracking-tight mb-2 text-[#333333]">68.9%</div>
                <span className="text-[10px] bg-[#D5E8D4] text-[#2D6A4F] px-2 py-0.5 rounded">In range</span>
                <div className="text-[10px] text-[#6B7280] mt-2">Last reading: 2 mins ago</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-3 sm:p-4 rounded-lg border border-[#D9D9D9]">
            <h3 className="text-sm mb-3">Live Readings</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {liveReadings.map((r) => (
                <div key={r.cage} className="rounded-lg overflow-hidden border border-[#D9D9D9]">
                  <div className="flex items-center justify-between px-3 py-1.5" style={{ backgroundColor: r.bgColor }}>
                    <span className="text-[11px] text-white">{r.cage}</span>
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: r.status === 'Normal' ? '#D5E8D4' : r.status === 'Watch' ? '#FFF3CD' : '#F8D7DA',
                        color: r.status === 'Normal' ? '#2D6A4F' : r.status === 'Watch' ? '#856404' : '#721C24',
                      }}
                    >
                      {r.status}
                    </span>
                  </div>
                  <div className="bg-white px-3 py-2 flex gap-4">
                    <div>
                      <div className="text-[9px] text-[#6B7280] tracking-wider">TEMPERATURE</div>
                      <div className="text-sm text-[#333333]">{r.temp}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-[#6B7280] tracking-wider">HUMIDITY</div>
                      <div className="text-sm text-[#333333]">{r.hum}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}