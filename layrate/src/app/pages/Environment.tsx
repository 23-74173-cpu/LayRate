import { useState, useEffect, useRef } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import {
  X, AlertTriangle, Thermometer, Droplets, Wind,
  CheckCircle, Clock, Wifi, WifiOff, ChevronRight,
} from 'lucide-react';

const THRESHOLD_STORAGE_KEY = 'layrate.environment.thresholds';

// ─── Types ───────────────────────────────────────────────────────────────────
type SensorStatus = 'Normal' | 'Watch' | 'Alert';
type BreachRecord = {
  parameter: 'Temperature' | 'Humidity';
  icon: React.ReactNode;
  current: string;
  threshold: string;
  direction: 'above' | 'below';
  since: string;
  durationMins: number;
  recommendation: string;
};

type SensorCard = {
  cage: string;
  sensor: string;
  temp: number;
  hum: number;
  color: string;
  tempStatus: 'OK' | 'Watch' | 'Alert';
  humStatus: 'OK' | 'Watch' | 'Alert';
  status: SensorStatus;
  hasSensor: true;
  breaches: BreachRecord[];
};
type NoSensorCard = {
  cage: string;
  color: string;
  hasSensor: false;
};
type CageCard = SensorCard | NoSensorCard;

// ─── Static data ─────────────────────────────────────────────────────────────
const timeRanges = ['24H', '7D', '30D', '90D'];

import { CAGE_COLORS } from '../constants/cageColors';
import { TableCrudToolbar } from '../components/TableCrudToolbar';

const sensorCards: CageCard[] = [
  {
    cage: 'CAGE-A', sensor: 'S-01', temp: 28.9, hum: 68.1, color: CAGE_COLORS['CAGE-A'],
    tempStatus: 'OK', humStatus: 'OK', status: 'Normal', hasSensor: true, breaches: [],
  },
  {
    cage: 'CAGE-B', sensor: 'S-02', temp: 28.7, hum: 70.0, color: CAGE_COLORS['CAGE-B'],
    tempStatus: 'OK', humStatus: 'Watch', status: 'Watch', hasSensor: true,
    breaches: [
      {
        parameter: 'Humidity', icon: <Droplets size={14} />,
        current: '70.0%', threshold: '70% max', direction: 'above',
        since: '10:30 today', durationMins: 45,
        recommendation: 'Monitor closely. Humidity is at the upper threshold boundary. Ensure exhaust fan on east side of CAGE-B is operating at full capacity. Re-check in 30 min.',
      },
    ],
  },
  {
    cage: 'CAGE-C', sensor: 'S-03', temp: 29.2, hum: 71.0, color: CAGE_COLORS['CAGE-C'],
    tempStatus: 'OK', humStatus: 'Alert', status: 'Alert', hasSensor: true,
    breaches: [
      {
        parameter: 'Humidity', icon: <Droplets size={14} />,
        current: '71.0%', threshold: '70% max', direction: 'above',
        since: '14:00 today', durationMins: 135,
        recommendation: 'ACTION REQUIRED: Open supplemental ventilation panel on north wall of CAGE-C. Check for blockages in exhaust ducts. High humidity sustained for 2h+ increases respiratory infection risk. Target RH 65–70%. Re-evaluate within 30 minutes and escalate if unresolved.',
      },
    ],
  },
  {
    cage: 'CAGE-D', color: CAGE_COLORS['CAGE-D'], hasSensor: false,
  },
];

// Spread values
const TEMP_SPREAD = 1.3;
const HUM_SPREAD = 4.4;

// Trend data (fixed, no Math.random on re-render)
const hours = ['14:00','16:00','18:00','20:00','22:00','00:00','02:00','04:00','06:00','08:00','10:00','12:00'];
const tempBase: Record<string, number[]> = {
  'CAGE-A': [27.8,28.1,28.4,28.2,27.9,27.5,27.3,27.6,28.0,28.5,28.9,28.7],
  'CAGE-B': [27.2,27.6,27.9,27.5,27.1,26.8,26.9,27.2,27.5,28.0,28.4,28.7],
  'CAGE-C': [28.0,28.3,28.8,28.6,28.2,27.8,27.7,28.0,28.5,28.9,29.2,29.0],
  'CAGE-D': [26.8,27.0,27.2,27.0,26.6,26.3,26.5,26.7,27.0,27.4,27.7,27.9],
};
const trendData = hours.map((h, i) => ({
  time: h,
  'CAGE-A': tempBase['CAGE-A'][i],
  'CAGE-B': tempBase['CAGE-B'][i],
  'CAGE-C': tempBase['CAGE-C'][i],
  'Coop Avg': +(
    (tempBase['CAGE-A'][i] + tempBase['CAGE-B'][i] + tempBase['CAGE-C'][i]) / 3
  ).toFixed(1),
}));

const humBase: Record<string, number[]> = {
  'CAGE-A': [65,66,67,67,66,65,65,66,67,67,68,68],
  'CAGE-B': [67,68,69,70,70,69,69,70,70,70,70,70],
  'CAGE-C': [66,67,68,70,71,70,70,71,71,71,71,71],
};
const humTrendData = hours.map((h, i) => ({
  time: h,
  'CAGE-A': humBase['CAGE-A'][i],
  'CAGE-B': humBase['CAGE-B'][i],
  'CAGE-C': humBase['CAGE-C'][i],
  'Coop Avg': +(
    (humBase['CAGE-A'][i] + humBase['CAGE-B'][i] + humBase['CAGE-C'][i]) / 3
  ).toFixed(1),
}));

const lineColors: Record<string, string> = {
  'CAGE-A': CAGE_COLORS['CAGE-A'],
  'CAGE-B': CAGE_COLORS['CAGE-B'],
  'CAGE-C': CAGE_COLORS['CAGE-C'],
  'Coop Avg': '#6B7280',
};

const logSummary = [
  { time: '14:00', cage: 'CAGE-C', temp: '29.0°C', hum: '71%',  status: 'Alert' },
  { time: '12:00', cage: 'CAGE-B', temp: '28.7°C', hum: '70%',  status: 'Watch' },
  { time: '10:30', cage: 'CAGE-B', temp: '28.5°C', hum: '70%',  status: 'Watch' },
  { time: '08:00', cage: 'CAGE-A', temp: '28.0°C', hum: '67%',  status: 'Normal' },
  { time: '06:00', cage: 'CAGE-C', temp: '27.7°C', hum: '70%',  status: 'Watch' },
  { time: '04:00', cage: 'CAGE-C', temp: '27.5°C', hum: '71%',  status: 'Alert' },
  { time: '02:00', cage: 'CAGE-B', temp: '27.2°C', hum: '69%',  status: 'Watch' },
  { time: '00:00', cage: 'CAGE-A', temp: '27.5°C', hum: '65%',  status: 'Normal' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function statusBadge(status: SensorStatus | 'Normal' | 'Watch' | 'Alert' | 'Warning') {
  if (status === 'Normal')  return 'bg-[#D5E8D4] text-[#004F9F]';
  if (status === 'Watch' || status === 'Warning') return 'bg-[#FFF3CD] text-[#856404]';
  return 'bg-[#F8D7DA] text-[#721C24]';
}

function formatDuration(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}

// ─── Alert Drill-down Modal ───────────────────────────────────────────────────
function AlertModal({ card, onClose, tempMax, humMax }: {
  card: SensorCard; onClose: () => void; tempMax: number; humMax: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

      <div ref={ref}
        className="relative bg-[rgba(255,255,255,0.90)] rounded-xl border border-[#D9D9D9] shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E0DDD6] flex items-center justify-between"
          style={{ borderLeft: `4px solid ${card.color}` }}>
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full" style={{ background: card.color }} />
            <div>
              <div className="text-sm text-gray-800">{card.cage} — Environment Alert</div>
              <div className="text-[10px] text-gray-400">Sensor {card.sensor} · Last updated: just now</div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Current readings summary */}
        <div className="px-5 py-4 bg-[#FAF8F5] border-b border-[#E0DDD6] grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white border border-[#E0DDD6] flex items-center justify-center">
              <Thermometer size={15} className="text-gray-500" />
            </div>
            <div>
              <div className="text-[10px] text-gray-400">Temperature</div>
              <div className="text-sm text-gray-800">{card.temp.toFixed(1)}°C</div>
              <div className={`text-[9px] mt-0.5 ${card.tempStatus === 'OK' ? 'text-emerald-600' : 'text-amber-600'}`}>
                {card.tempStatus === 'OK' ? `Within range (max ${tempMax}°C)` : 'Above threshold'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white border border-[#E0DDD6] flex items-center justify-center">
              <Droplets size={15} className="text-gray-500" />
            </div>
            <div>
              <div className="text-[10px] text-gray-400">Humidity</div>
              <div className="text-sm text-gray-800">{card.hum.toFixed(1)}%</div>
              <div className={`text-[9px] mt-0.5 ${card.humStatus === 'OK' ? 'text-emerald-600' : card.humStatus === 'Watch' ? 'text-amber-600' : 'text-red-600'}`}>
                {card.humStatus === 'OK' ? `Within range (max ${humMax}%)` : card.humStatus === 'Watch' ? 'At threshold boundary' : 'Exceeds threshold'}
              </div>
            </div>
          </div>
        </div>

        {/* Breach details */}
        <div className="px-5 py-4 space-y-4">
          {card.breaches.length === 0 ? (
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle size={14} />
              <span className="text-sm">No active threshold breaches.</span>
            </div>
          ) : (
            card.breaches.map((breach, i) => (
              <div key={i} className="rounded-lg border border-[#F8D7DA] bg-[#FFF5F5] overflow-hidden">
                {/* Breach header */}
                <div className="px-4 py-2.5 flex items-center gap-2 border-b border-[#F8D7DA] bg-[#F8D7DA]/30">
                  <AlertTriangle size={13} className="text-red-500 flex-shrink-0" />
                  <span className="text-xs text-red-700">{breach.parameter} threshold breached</span>
                  <span className="ml-auto text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                    {formatDuration(breach.durationMins)} ongoing
                  </span>
                </div>

                <div className="px-4 py-3 space-y-3">
                  {/* What breached */}
                  <div className="grid grid-cols-3 gap-2 text-[11px]">
                    <div>
                      <div className="text-[9px] tracking-wider text-gray-400 mb-0.5">CURRENT</div>
                      <div className="text-red-700 font-mono">{breach.current}</div>
                    </div>
                    <div>
                      <div className="text-[9px] tracking-wider text-gray-400 mb-0.5">THRESHOLD</div>
                      <div className="text-gray-700 font-mono">{breach.threshold}</div>
                    </div>
                    <div>
                      <div className="text-[9px] tracking-wider text-gray-400 mb-0.5">DIRECTION</div>
                      <div className="text-gray-700 capitalize">{breach.direction} limit</div>
                    </div>
                  </div>

                  {/* Duration timeline */}
                  <div className="flex items-center gap-2 bg-white rounded px-3 py-2 border border-[#F0E0E0]">
                    <Clock size={12} className="text-red-400 flex-shrink-0" />
                    <div className="text-[10px] text-gray-600">
                      Breach started at <span className="text-gray-800">{breach.since}</span>
                      {' '}— sustained for <span className="text-red-700">{formatDuration(breach.durationMins)}</span>
                    </div>
                  </div>

                  {/* Recommended action */}
                  <div>
                    <div className="text-[9px] tracking-wider text-gray-400 mb-1.5">RECOMMENDED ACTION</div>
                    <p className="text-[11px] text-gray-700 leading-relaxed">{breach.recommendation}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer actions */}
        <div className="px-5 py-3 border-t border-[#D9D9D9] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-[rgba(255,255,255,0.90)]">
          <span className="text-[10px] text-[#6B7280]">Alerts auto-update every 5 min</span>
          <div className="flex gap-2 sm:justify-end">
            <button onClick={onClose}
              className="px-4 py-1.5 text-xs rounded-lg border border-[#D9D9D9] text-[#6B7280] hover:bg-[#F5F6F8] transition-colors">
              Dismiss
            </button>
            <button className="px-4 py-1.5 text-xs rounded-lg bg-[#002D5E] text-white hover:bg-[#001F42] transition-colors">
              Mark Resolved
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Variance tag ──────────────────────────────────────────────────────────────
function VarianceTag({ spread, max, unit }: { spread: number; max: number; unit: string }) {
  const ok = spread <= max;
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full ${
      ok ? 'bg-[#D5E8D4] text-[#004F9F]' : 'bg-[#FFF3CD] text-[#856404]'
    }`}>
      {ok ? <CheckCircle size={9} /> : <AlertTriangle size={9} />}
      {ok ? 'Within acceptable variance' : 'High variance'}
      {' '}({spread}{unit} spread / max {max}{unit})
    </span>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export function Environment() {
  const [activeRange, setActiveRange] = useState('24H');
  const [tempMin, setTempMin] = useState('18');
  const [tempMax, setTempMax] = useState('30');
  const [humMin, setHumMin] = useState('40');
  const [humMax, setHumMax] = useState('70');
  // Variance thresholds
  const [tempSpreadMax, setTempSpreadMax] = useState('1.5');
  const [humSpreadMax, setHumSpreadMax] = useState('5');
  // Alert modal
  const [alertCard, setAlertCard] = useState<SensorCard | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  const activeSensors = sensorCards.filter(c => c.hasSensor).length;

  useEffect(() => {
    const raw = localStorage.getItem(THRESHOLD_STORAGE_KEY);
    if (!raw) return;
    try {
      const saved = JSON.parse(raw) as {
        tempMin?: string;
        tempMax?: string;
        humMin?: string;
        humMax?: string;
        tempSpreadMax?: string;
        humSpreadMax?: string;
      };

      if (saved.tempMin) setTempMin(saved.tempMin);
      if (saved.tempMax) setTempMax(saved.tempMax);
      if (saved.humMin) setHumMin(saved.humMin);
      if (saved.humMax) setHumMax(saved.humMax);
      if (saved.tempSpreadMax) setTempSpreadMax(saved.tempSpreadMax);
      if (saved.humSpreadMax) setHumSpreadMax(saved.humSpreadMax);
    } catch {
      localStorage.removeItem(THRESHOLD_STORAGE_KEY);
    }
  }, []);

  function handleSaveThresholds() {
    const payload = {
      tempMin,
      tempMax,
      humMin,
      humMax,
      tempSpreadMax,
      humSpreadMax,
    };
    localStorage.setItem(THRESHOLD_STORAGE_KEY, JSON.stringify(payload));
    setSaveNotice('Thresholds saved');
    window.setTimeout(() => setSaveNotice(null), 2200);
  }

  function handleCardClick(card: CageCard) {
    if (!card.hasSensor) return;
    if (card.status === 'Alert' || card.status === 'Watch') {
      setAlertCard(card as SensorCard);
    }
  }

  return (
    <>
      {/* Alert modal */}
      {alertCard && (
        <AlertModal
          card={alertCard}
          onClose={() => setAlertCard(null)}
          tempMax={Number(tempMax)}
          humMax={Number(humMax)}
        />
      )}

      <main className="flex-1 p-3 sm:p-5 pb-24 overflow-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <h1 className="text-xl">Coop Environment Monitor</h1>
            <p className="text-[11px] text-[#6B7280] mt-0.5">Live sensor readings &amp; threshold alerts</p>
          </div>
          <div className="flex flex-wrap gap-1">
            {timeRanges.map(r => (
              <button key={r} onClick={() => setActiveRange(r)}
                className={`px-3 py-1.5 text-xs rounded border transition-colors ${
                  activeRange === r
                    ? 'bg-[#002D5E] text-white border-[#002D5E]'
                    : 'bg-white border-[#D9D9D9] text-[#6B7280] hover:bg-[#F5F6F8]'
                }`}>{r}
              </button>
            ))}
          </div>
        </div>

        {/* Top Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-5">
          {/* Avg Temp */}
          <div className="bg-white p-4 sm:p-5 rounded-lg border border-[#D9D9D9]">
            <div className="text-[10px] tracking-wider text-[#6B7280] mb-2">COOP AVG TEMPERATURE</div>
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <span className="text-3xl sm:text-4xl tracking-tight">28.7°C</span>
              <span className="text-[10px] bg-[#D5E8D4] text-[#2D6A4F] px-2 py-0.5 rounded">In Range</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-[#6B7280]">Spread: {TEMP_SPREAD}°C</span>
              <VarianceTag spread={TEMP_SPREAD} max={Number(tempSpreadMax)} unit="°C" />
            </div>
          </div>

          {/* Avg Humidity */}
          <div className="bg-white p-4 sm:p-5 rounded-lg border border-[#D9D9D9]">
            <div className="text-[10px] tracking-wider text-[#6B7280] mb-2">COOP AVG HUMIDITY</div>
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <span className="text-3xl sm:text-4xl tracking-tight">68.9%</span>
              <span className="text-[10px] bg-[#D5E8D4] text-[#2D6A4F] px-2 py-0.5 rounded">In Range</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-[#6B7280]">Spread: {HUM_SPREAD}%</span>
              <VarianceTag spread={HUM_SPREAD} max={Number(humSpreadMax)} unit="%" />
            </div>
          </div>

          {/* Sensors */}
          <div className="bg-white p-4 sm:p-5 rounded-lg border border-[#D9D9D9]">
            <div className="text-[10px] tracking-wider text-[#6B7280] mb-2">ACTIVE SENSORS</div>
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <span className="text-3xl sm:text-4xl tracking-tight">{activeSensors}</span>
              <span className="text-[10px] bg-[#D5E8D4] text-[#2D6A4F] px-2 py-0.5 rounded">Live</span>
            </div>
            <div className="text-xs text-[#6B7280]">
              {activeSensors} of {sensorCards.length} cages instrumented · 1 cage unmonitored
            </div>
          </div>
        </div>

        {/* Per-cage Sensor Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
          {sensorCards.map(card => {
            if (!card.hasSensor) {
              // No-sensor placeholder
              return (
                <div key={card.cage}
                  className="bg-white rounded-lg border border-[#D9D9D9] border-dashed overflow-hidden opacity-80">
                  <div className="px-4 py-3 border-b border-dashed border-[#D9D9D9] flex items-center gap-2"
                    style={{ borderLeft: `4px solid ${card.color}` }}>
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: card.color }} />
                    <span className="text-sm text-[#333333]">{card.cage}</span>
                    <span className="ml-auto text-[10px] bg-[#F5F6F8] text-[#6B7280] px-2 py-0.5 rounded border border-[#D9D9D9]">No sensor</span>
                  </div>
                  <div className="px-4 py-4 sm:py-5 flex flex-col items-center text-center gap-2">
                    <WifiOff size={22} className="text-[#6B7280]" />
                    <p className="text-[11px] text-[#6B7280] leading-relaxed">
                      No environment sensor installed
                    </p>
                    <p className="text-[10px] text-[#6B7280] leading-relaxed">
                      Manual monitoring recommended. Record temperature &amp; humidity at least twice daily.
                    </p>
                    <span className="mt-1 text-[9px] bg-[#FFF3CD] text-[#856404] px-2 py-0.5 rounded-full">
                      Manual monitoring recommended
                    </span>
                  </div>
                </div>
              );
            }

            // Normal sensor card
            const s = card as SensorCard;
            const isClickable = s.status === 'Alert' || s.status === 'Watch';
            return (
              <div key={s.cage}
                onClick={() => handleCardClick(s)}
                className={`bg-white rounded-lg border border-[#D9D9D9] overflow-hidden transition-shadow ${
                  isClickable ? 'cursor-pointer hover:shadow-md hover:border-[#BDB9B0]' : ''
                }`}>
                <div className="px-4 py-3 border-b border-[#D9D9D9] flex items-center justify-between"
                  style={{ borderLeft: `4px solid ${s.color}` }}>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                    <span className="text-sm text-[#333333]">{s.cage}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] bg-[#F5F6F8] text-[#6B7280] px-2 py-0.5 rounded border border-[#D9D9D9]">{s.sensor}</span>
                    {isClickable && <ChevronRight size={12} className="text-[#6B7280]" />}
                  </div>
                </div>

                <div className="px-4 py-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Thermometer size={12} className="text-[#6B7280]" />
                    <span className="text-sm text-[#333333]">{s.temp.toFixed(1)}°C</span>
                    <span className={`ml-auto text-[9px] px-1.5 py-0.5 rounded ${
                      s.tempStatus === 'OK' ? 'bg-[#D5E8D4] text-[#2D6A4F]' : 'bg-[#FFF3CD] text-[#856404]'
                    }`}>
                      {s.tempStatus}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Droplets size={12} className="text-[#6B7280]" />
                    <span className="text-sm text-[#333333]">{s.hum.toFixed(1)}%</span>
                    <span className={`ml-auto text-[9px] px-1.5 py-0.5 rounded ${
                      s.humStatus === 'OK' ? 'bg-[#D5E8D4] text-[#2D6A4F]'
                        : s.humStatus === 'Watch' ? 'bg-[#FFF3CD] text-[#856404]'
                        : 'bg-[#F8D7DA] text-[#721C24]'
                    }`}>
                      {s.humStatus}
                    </span>
                  </div>

                  <div className="pt-1 border-t border-[#EEE] flex items-center justify-between">
                    <span className={`text-[10px] px-2 py-0.5 rounded ${statusBadge(s.status)}`}>
                      {s.status === 'Alert' && <AlertTriangle size={9} className="inline mr-1" />}
                      {s.status}
                    </span>
                    {isClickable && (
                      <span className="text-[9px] text-[#6B7280] hover:text-[#333333] flex items-center gap-0.5">
                        View details <ChevronRight size={10} />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Alert Threshold Configuration */}
        <div className="bg-white rounded-lg border border-[#D9D9D9] p-4 sm:p-5 mb-5">
          <h2 className="text-base mb-1">Alert Threshold Configuration</h2>
          <p className="text-[11px] text-gray-400 mb-4">Variance thresholds determine the spread tags shown on the metric cards above.</p>
          {saveNotice && (
            <div className="mb-4 text-xs text-[#004F9F] bg-[#EAF0F8] border border-[#D9D9D9] rounded-lg px-3 py-2">
              {saveNotice}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-4">
            {/* Environment thresholds */}
            <div>
              <div className="text-[10px] tracking-wider text-gray-500 mb-2">ENVIRONMENT LIMITS</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: 'Temp min (°C)', val: tempMin, set: setTempMin },
                  { label: 'Temp max (°C)', val: tempMax, set: setTempMax },
                  { label: 'Humidity min (%)', val: humMin, set: setHumMin },
                  { label: 'Humidity max (%)', val: humMax, set: setHumMax },
                ].map(f => (
                  <div key={f.label}>
                    <label className="block text-xs text-gray-500 mb-1">{f.label}</label>
                    <input type="number" value={f.val} onChange={e => f.set(e.target.value)}
                      className="w-full border border-[#D9D9D9] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#002D5E]" />
                  </div>
                ))}
              </div>
            </div>

            {/* Variance thresholds */}
            <div>
              <div className="text-[10px] tracking-wider text-gray-500 mb-2">ACCEPTABLE SPREAD VARIANCE</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Max temp spread (°C)</label>
                  <input type="number" step="0.1" value={tempSpreadMax} onChange={e => setTempSpreadMax(e.target.value)}
                    className="w-full border border-[#D9D9D9] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#002D5E]" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Max humidity spread (%)</label>
                  <input type="number" step="0.5" value={humSpreadMax} onChange={e => setHumSpreadMax(e.target.value)}
                    className="w-full border border-[#D9D9D9] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#002D5E]" />
                </div>
              </div>
              <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                <p className="text-[10px] text-blue-600 leading-relaxed">
                  Spread variance measures the gap between the highest and lowest sensor readings across
                  cages. A large spread may indicate uneven airflow, faulty sensors, or localized
                  temperature/humidity issues.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-stretch sm:justify-end">
            <button onClick={handleSaveThresholds} className="w-full sm:w-auto bg-[#002D5E] text-white px-6 py-2 rounded-lg text-sm hover:bg-[#001F42] transition-colors">
              Save Thresholds
            </button>
          </div>
        </div>

        {/* Trend Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-5">
          <div className="bg-[#FAF8F5] rounded-lg border border-[#D4CFC4] p-4 sm:p-5">
            <div className="text-[10px] tracking-wider text-gray-500 mb-1">TEMPERATURE TREND</div>
            <div className="text-[11px] text-gray-400 mb-4">Instrumented cages + coop average (CAGE-D excluded — no sensor)</div>
            <ResponsiveContainer width="100%" height={230}>
              <LineChart data={trendData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E0DDD6" />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="#999" />
                <YAxis domain={[24, 32]} tick={{ fontSize: 10 }} stroke="#999" tickFormatter={v => `${v}°C`} />
                <Tooltip contentStyle={{ fontSize: 11, background: '#1E1E1E', border: '1px solid #333', borderRadius: 6 }}
                  labelStyle={{ color: '#aaa' }} itemStyle={{ color: '#fff' }}
                  formatter={(v: number) => [`${v.toFixed(1)}°C`]} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                <ReferenceLine y={Number(tempMax)} stroke="#FB923C" strokeDasharray="4 3" strokeWidth={1}
                  label={{ value: `Max ${tempMax}°C`, position: 'insideTopRight', fontSize: 9, fill: '#FB923C', dy: -4 }} />
                {Object.keys(lineColors).map(key => (
                  <Line key={key} type="monotone" dataKey={key} stroke={lineColors[key]}
                    strokeWidth={key === 'Coop Avg' ? 2 : 1.5} dot={{ r: 2.5 }}
                    strokeDasharray={key === 'Coop Avg' ? '5 3' : undefined} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-[#FAF8F5] rounded-lg border border-[#D4CFC4] p-4 sm:p-5">
            <div className="text-[10px] tracking-wider text-gray-500 mb-1">HUMIDITY TREND</div>
            <div className="text-[11px] text-gray-400 mb-4">Instrumented cages + coop average (CAGE-D excluded — no sensor)</div>
            <ResponsiveContainer width="100%" height={230}>
              <LineChart data={humTrendData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E0DDD6" />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="#999" />
                <YAxis domain={[55, 80]} tick={{ fontSize: 10 }} stroke="#999" tickFormatter={v => `${v}%`} />
                <Tooltip contentStyle={{ fontSize: 11, background: '#1E1E1E', border: '1px solid #333', borderRadius: 6 }}
                  labelStyle={{ color: '#aaa' }} itemStyle={{ color: '#fff' }}
                  formatter={(v: number) => [`${v.toFixed(1)}%`]} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                <ReferenceLine y={Number(humMax)} stroke="#FB923C" strokeDasharray="4 3" strokeWidth={1}
                  label={{ value: `Max ${humMax}%`, position: 'insideTopRight', fontSize: 9, fill: '#FB923C', dy: -4 }} />
                {Object.keys(lineColors).map(key => (
                  <Line key={key} type="monotone" dataKey={key} stroke={lineColors[key]}
                    strokeWidth={key === 'Coop Avg' ? 2 : 1.5} dot={{ r: 2.5 }}
                    strokeDasharray={key === 'Coop Avg' ? '5 3' : undefined} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Log Summary */}
        <TableCrudToolbar label="Environment Logs CRUD" />

        <div className="bg-[#FAF8F5] rounded-lg border border-[#D4CFC4] overflow-hidden">
          <div className="px-6 py-4">
            <div className="text-[10px] tracking-wider text-gray-500">RECENT LOG SUMMARY</div>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full min-w-[680px]">
            <thead>
              <tr className="border-t border-b border-[#D4CFC4]">
                <th className="text-left text-xs text-gray-500 px-6 py-2.5">Time</th>
                <th className="text-left text-xs text-gray-500 px-6 py-2.5">Cage</th>
                <th className="text-left text-xs text-gray-500 px-6 py-2.5">Avg Temp</th>
                <th className="text-left text-xs text-gray-500 px-6 py-2.5">Avg Humidity</th>
                <th className="text-left text-xs text-gray-500 px-6 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {logSummary.map((row, i) => (
                <tr key={i} className="border-b border-[#EBE8E0] hover:bg-[#F5F3EE]">
                  <td className="px-6 py-3 text-sm text-gray-700">{row.time}</td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full"
                        style={{ background: sensorCards.find(c => c.cage === row.cage)?.color ?? '#999' }} />
                      <span className="text-sm text-[#002D5E] cursor-pointer hover:underline" title="View cage details">{row.cage}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-700">{row.temp}</td>
                  <td className="px-6 py-3 text-sm text-gray-700">{row.hum}</td>
                  <td className="px-6 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full ${statusBadge(row.status as SensorStatus)}`}>
                      {row.status === 'Alert' && <AlertTriangle size={9} className="inline mr-1" />}
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </main>
    </>
  );
}