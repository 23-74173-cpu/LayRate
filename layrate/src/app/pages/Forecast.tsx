import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Area, ComposedChart, ReferenceLine,
} from 'recharts';
import { Info, Egg, TrendingUp, AlertTriangle } from 'lucide-react';

// ─── Config ───────────────────────────────────────────────────────────────────
const cages = ['CAGE-A', 'CAGE-B', 'CAGE-C', 'CAGE-D'];
const horizons = ['7 days', '14 days', '30 days'];

import { CAGE_COLORS } from '../constants/cageColors';
import { TableCrudToolbar } from '../components/TableCrudToolbar';

// Per-cage meta used for egg count projection & model inputs note
const CAGE_META: Record<string, {
  hens: number; flockAge: string; feedBatch: string; feedCP: string;
  historicalDays: number; breed: string;
}> = {
  'CAGE-A': { hens: 570, flockAge: '28 wks', feedBatch: 'F-001', feedCP: '17.5%', historicalDays: 14, breed: 'ISA Brown' },
  'CAGE-B': { hens: 600, flockAge: '34 wks', feedBatch: 'F-002', feedCP: '16.8%', historicalDays: 14, breed: 'Lohmann Brown' },
  'CAGE-C': { hens: 580, flockAge: '52 wks', feedBatch: 'F-001', feedCP: '17.5%', historicalDays: 14, breed: 'Dekalb White' },
  'CAGE-D': { hens: 500, flockAge: '18 wks', feedBatch: 'F-003', feedCP: '18.0%', historicalDays: 7,  breed: 'ISA Brown (Pullet)' },
};

const BASE_HDEP: Record<string, number> = {
  'CAGE-A': 85.8, 'CAGE-B': 72.5, 'CAGE-C': 58.3, 'CAGE-D': 0,
};

// ─── Data generators ─────────────────────────────────────────────────────────
const TODAY = new Date('2026-04-12');

function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Label used by the ReferenceLine to split historical / forecast on the chart */
function lastHistoricalLabel(): string {
  const d = new Date(TODAY);
  d.setDate(d.getDate() - 1);   // yesterday = last observed day
  return fmtDate(d);
}

function generateChartData(baseHdep: number, horizonDays: number) {
  const historical = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(TODAY);
    d.setDate(d.getDate() - (14 - i)); // 14 days ago → yesterday
    return {
      label: fmtDate(d),
      historical: +(baseHdep + (Math.random() - 0.5) * 6).toFixed(1),
      forecast: null as number | null,
      confHigh: null as number | null,
      confLow: null as number | null,
    };
  });
  const future = Array.from({ length: horizonDays }, (_, i) => {
    const d = new Date(TODAY);
    d.setDate(d.getDate() + i + 1); // tomorrow → horizon end
    const val = +(baseHdep + (Math.random() - 0.5) * 4).toFixed(1);
    const spread = +(2.5 + i * 0.35).toFixed(1);
    return {
      label: fmtDate(d),
      historical: null as number | null,
      forecast: val,
      confHigh: +(val + spread).toFixed(1),
      confLow: +(Math.max(0, val - spread)).toFixed(1),
    };
  });
  return [...historical, ...future];
}

interface PredictionRow {
  date: string;
  hdep: number;
  hdepRange: number;   // ± margin
  eggCount: number;
  eggRange: number;
  confidence: number;
}

function generatePredictions(cage: string, horizonDays: number): PredictionRow[] {
  const base = BASE_HDEP[cage];
  const { hens } = CAGE_META[cage];
  return Array.from({ length: horizonDays }, (_, i) => {
    const hdep = +(base + (Math.random() - 0.5) * 2).toFixed(1);
    const hdepRange = +(1.8 + i * 0.25).toFixed(1);   // widens with horizon
    const eggCount = Math.round((hdep / 100) * hens);
    const eggRange = Math.round((hdepRange / 100) * hens);
    const confidence = Math.max(68, Math.round(95 - i * (horizonDays <= 7 ? 2.5 : 1.8)));
    const date = new Date('2026-04-12');
    date.setDate(date.getDate() + i + 1);
    return {
      date: date.toISOString().slice(0, 10),
      hdep,
      hdepRange,
      eggCount,
      eggRange,
      confidence,
    };
  });
}

// ─── Custom chart tooltip ─────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, cage }: any) {
  if (!active || !payload?.length) return null;
  const { hens } = CAGE_META[cage];
  const hist = payload.find((p: any) => p.dataKey === 'historical')?.value;
  const fore = payload.find((p: any) => p.dataKey === 'forecast')?.value;
  const high = payload.find((p: any) => p.dataKey === 'confHigh')?.value;
  const low  = payload.find((p: any) => p.dataKey === 'confLow')?.value;

  return (
    <div className="bg-[#1E1E1E] border border-[#333] rounded-lg px-3 py-2.5 shadow-xl text-xs">
      <p className="text-gray-400 mb-2 text-[10px]">{label}</p>
      {hist != null && (
        <p className="text-white">Historical: <span className="font-mono">{hist.toFixed(1)}%</span>
          <span className="text-gray-400 ml-1">≈ {Math.round((hist / 100) * hens)} eggs</span>
        </p>
      )}
      {fore != null && (
        <>
          <p className="text-emerald-400">Forecast: <span className="font-mono">{fore.toFixed(1)}%</span>
            <span className="text-gray-400 ml-1">≈ {Math.round((fore / 100) * hens)} eggs</span>
          </p>
          {high != null && low != null && (
            <p className="text-gray-400 text-[10px] mt-0.5">
              Range: {low.toFixed(1)}% – {high.toFixed(1)}%
            </p>
          )}
        </>
      )}
    </div>
  );
}

// ─── Model inputs note ────────────────────────────────────────────────────────
function ModelInputsNote({ cage, horizon }: { cage: string; horizon: string }) {
  const m = CAGE_META[cage];
  return (
    <div className="mt-3 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2.5">
      <div className="flex items-start gap-1.5">
        <Info size={12} className="text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-[10px] text-blue-700 mb-1">Forecast model inputs</p>
          <ul className="space-y-0.5">
            {[
              `Last ${m.historicalDays} days of egg data (${cage})`,
              `Flock age curve: ${m.flockAge} — ${m.breed}`,
              `Current feed batch: ${m.feedBatch} (CP ${m.feedCP})`,
              `Hen count: ${m.hens.toLocaleString()} birds`,
              `Horizon: ${horizon}`,
            ].map((line, i) => (
              <li key={i} className="flex items-center gap-1 text-[10px] text-blue-600">
                <span className="w-1 h-1 rounded-full bg-blue-300 flex-shrink-0" />
                {line}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ─── Confidence badge ─────────────────────────────────────────────────────────
function ConfBadge({ pct }: { pct: number }) {
  const cls = pct >= 90
    ? 'bg-[#D5E8D4] text-[#004F9F]'
    : pct >= 80
    ? 'bg-[#FFF3CD] text-[#856404]'
    : 'bg-[#F8D7DA] text-[#721C24]';
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full ${cls}`}>{pct}%</span>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function Forecast() {
  const [selectedCage, setSelectedCage] = useState('CAGE-A');
  const [horizon, setHorizon] = useState('7 days');
  const [generated, setGenerated] = useState(false);

  const horizonDays = parseInt(horizon);
  const [chartData,   setChartData]   = useState(() => generateChartData(BASE_HDEP['CAGE-A'], 7));
  const [predictions, setPredictions] = useState<PredictionRow[]>(() => generatePredictions('CAGE-A', 7));

  const handleGenerate = () => {
    setChartData(generateChartData(BASE_HDEP[selectedCage], horizonDays));
    setPredictions(generatePredictions(selectedCage, horizonDays));
    setGenerated(true);
  };

  const accentColor = CAGE_COLORS[selectedCage];
  const meta = CAGE_META[selectedCage];
  const isPreLay = BASE_HDEP[selectedCage] === 0;

  // Summary stats from predictions
  const avgHdep = predictions.length
    ? (predictions.reduce((a, p) => a + p.hdep, 0) / predictions.length).toFixed(1)
    : '—';
  const totalEggs = predictions.reduce((a, p) => a + p.eggCount, 0);
  const avgConfidence = Math.round(predictions.reduce((a, p) => a + p.confidence, 0) / predictions.length);

  return (
    <main className="flex-1 p-3 sm:p-5 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl">Forecast</h1>
          <p className="text-[11px] text-[#6B7280] mt-0.5">HDEP &amp; egg count projections with confidence intervals</p>
        </div>
      </div>

      {/* Pre-lay warning */}
      {isPreLay && generated && (
        <div className="mb-5 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          <AlertTriangle size={14} className="text-amber-600 flex-shrink-0" />
          <p className="text-xs text-amber-800">
            <strong>CAGE-D</strong> is pre-lay (18 wks). Flock is not yet in production — forecast will show 0 egg output until laying begins (~20 wks).
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[288px_1fr] gap-4 mb-5">
        {/* ── Inputs panel ── */}
        <div className="bg-white rounded-lg border border-[#D9D9D9] p-5 flex flex-col">
          <div className="text-[10px] tracking-wider text-[#6B7280] mb-3">FORECAST INPUTS</div>

          <label className="block text-xs text-[#6B7280] mb-1">Select Cage</label>
          <select
            value={selectedCage}
            onChange={e => { setSelectedCage(e.target.value); setGenerated(false); }}
            className="w-full border border-[#D9D9D9] rounded-lg px-3 py-2.5 text-sm bg-white mb-4 focus:outline-none focus:border-[#002D5E] appearance-none cursor-pointer"
          >
            {cages.map(c => (
              <option key={c} value={c}>
                {c} — {CAGE_META[c].breed} ({CAGE_META[c].hens} hens)
              </option>
            ))}
          </select>

          <label className="block text-xs text-[#6B7280] mb-2">Forecast horizon</label>
          <div className="flex flex-wrap gap-3 mb-5">
            {horizons.map(h => (
              <label key={h} className="flex items-center gap-1.5 text-xs text-[#333333] cursor-pointer">
                <input type="radio" name="horizon" checked={horizon === h}
                  onChange={() => { setHorizon(h); setGenerated(false); }}
                  className="accent-[#002D5E]" />
                {h}
              </label>
            ))}
          </div>

          <button
            onClick={handleGenerate}
            className="w-full py-2.5 rounded-lg text-sm text-white transition-colors"
            style={{ background: '#002D5E' }}
          >
            Generate Forecast
          </button>

          {/* Model inputs note */}
          <ModelInputsNote cage={selectedCage} horizon={horizon} />

          {/* Cage quick-stats */}
          <div className="mt-4 pt-4 border-t border-[#D9D9D9] space-y-2">
            <div className="text-[10px] tracking-wider text-[#6B7280]">CAGE SNAPSHOT</div>
            {[
              ['Hens', `${meta.hens.toLocaleString()} birds`],
              ['Flock age', meta.flockAge],
              ['Current HDEP', BASE_HDEP[selectedCage] ? `${BASE_HDEP[selectedCage]}%` : 'Pre-lay'],
              ['Laying capacity', `${meta.hens} eggs/day max`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-[10px]">
                <span className="text-[#6B7280]">{k}</span>
                <span className="text-[#333333]">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Chart ── */}
        <div className="bg-white rounded-lg border border-[#D9D9D9] p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
            <div>
              <div className="text-[10px] tracking-wider text-[#6B7280]">HDEP FORECAST — {selectedCage}</div>
              <div className="text-[11px] text-[#6B7280] mt-0.5">
                Shaded area = confidence interval (widens further into forecast)
              </div>
            </div>
            <div className="flex flex-wrap gap-3 text-[10px] text-[#6B7280]">
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 bg-[#333] inline-block" /> Historical
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 inline-block border-t-2 border-dashed" style={{ borderColor: accentColor }} />
                Forecast
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-emerald-100 inline-block" />
                Conf. range
              </span>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0DDD6" />
              <XAxis dataKey="label" tick={{ fontSize: 9 }} stroke="#999" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="#999"
                tickFormatter={v => `${v}%`} />
              <Tooltip content={<ChartTooltip cage={selectedCage} />} />
              {/* Confidence band */}
              <Area key="area-conf-high" type="monotone" dataKey="confHigh" stroke="none"
                fill={accentColor} fillOpacity={0.12} name="Conf. High" legendType="none" />
              <Area key="area-conf-low" type="monotone" dataKey="confLow" stroke="none"
                fill="#FFFFFF" fillOpacity={1} name="Conf. Low" legendType="none" />
              {/* Lines */}
              <Line key="line-historical" type="monotone" dataKey="historical" stroke="#555" strokeWidth={2}
                dot={{ r: 3, fill: '#555', strokeWidth: 0 }} name="Historical" connectNulls={false} />
              <Line key="line-forecast" type="monotone" dataKey="forecast" stroke={accentColor} strokeWidth={2}
                strokeDasharray="6 3" dot={{ r: 3.5, fill: accentColor, strokeWidth: 0 }}
                name="Forecast" connectNulls={false} />
              {/* Divider between historical and forecast */}
              <ReferenceLine x={lastHistoricalLabel()} stroke="#CCC" strokeDasharray="3 3" />
            </ComposedChart>
          </ResponsiveContainer>

          {/* Summary strip */}
          {generated && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-[#D9D9D9] pt-4">
              <div className="text-center">
                <div className="text-[9px] tracking-wider text-[#6B7280] mb-1">AVG PREDICTED HDEP</div>
                <div className="text-sm font-mono" style={{ color: accentColor }}>{avgHdep}%</div>
              </div>
              <div className="text-center">
                <div className="text-[9px] tracking-wider text-[#6B7280] mb-1">TOTAL PROJECTED EGGS</div>
                <div className="text-sm font-mono flex items-center justify-center gap-1" style={{ color: accentColor }}>
                  <Egg size={13} />
                  {isPreLay ? '—' : totalEggs.toLocaleString()}
                </div>
              </div>
              <div className="text-center">
                <div className="text-[9px] tracking-wider text-[#6B7280] mb-1">AVG CONFIDENCE</div>
                <div className="text-sm font-mono" style={{ color: accentColor }}>{avgConfidence}%</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Predictions table ── */}
      <TableCrudToolbar label="Forecast Table CRUD" />

      <div className="bg-white rounded-lg border border-[#D9D9D9] overflow-hidden">
        <div className="px-4 sm:px-6 py-3 border-b border-[#D9D9D9] flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between bg-[#F5F6F8]">
          <div className="text-[10px] tracking-wider text-[#6B7280]">
            DAILY FORECAST TABLE — {selectedCage} ({horizon})
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-[#6B7280]">
            <TrendingUp size={11} />
            Based on {meta.hens.toLocaleString()} hens · {meta.breed}
          </div>
        </div>

        <div className="overflow-x-auto">
        <table className="w-full min-w-[940px] table-fixed">
          <colgroup>
            <col style={{ width: '13%' }} />
            <col style={{ width: '17%' }} />
            <col style={{ width: '16%' }} />
            <col style={{ width: '16%' }} />
            <col style={{ width: '16%' }} />
            <col style={{ width: '22%' }} />
          </colgroup>
          <thead>
            <tr className="border-b border-[#D9D9D9]">
              <th className="text-left text-[10px] tracking-wider text-[#6B7280] px-5 py-3">DATE</th>
              <th className="text-left text-[10px] tracking-wider text-[#6B7280] px-5 py-3">PREDICTED HDEP</th>
              <th className="text-left text-[10px] tracking-wider text-[#6B7280] px-5 py-3">± RANGE</th>
              <th className="text-left text-[10px] tracking-wider text-[#6B7280] px-5 py-3">
                <span className="flex items-center gap-1"><Egg size={10} /> PROJ. EGGS/DAY</span>
              </th>
              <th className="text-left text-[10px] tracking-wider text-[#6B7280] px-5 py-3">EGG ± RANGE</th>
              <th className="text-left text-[10px] tracking-wider text-[#6B7280] px-5 py-3">CONFIDENCE</th>
            </tr>
          </thead>
          <tbody>
            {predictions.map((p, i) => {
              const hdepLow  = Math.max(0, p.hdep - p.hdepRange).toFixed(1);
              const hdepHigh = Math.min(100, p.hdep + p.hdepRange).toFixed(1);

              return (
                <tr key={p.date} className="border-b border-[#D9D9D9] hover:bg-[#F5F6F8] transition-colors">
                  {/* Date */}
                  <td className="px-5 py-3 text-sm text-[#002D5E] font-mono cursor-pointer hover:underline" title="View forecast details">{p.date}</td>

                  {/* Predicted HDEP */}
                  <td className="px-5 py-3">
                    <span className="text-sm font-mono text-[#333333] tabular-nums">{p.hdep.toFixed(1)}%</span>
                  </td>

                  {/* ± HDEP range */}
                  <td className="px-5 py-3">
                    <div>
                        <span className="text-xs font-mono text-[#6B7280] tabular-nums">
                        ±{p.hdepRange.toFixed(1)}%
                      </span>
                        <div className="text-[9px] text-[#6B7280] mt-0.5 tabular-nums">
                        {hdepLow}% – {hdepHigh}%
                      </div>
                    </div>
                  </td>

                  {/* Projected eggs */}
                  <td className="px-5 py-3">
                    {isPreLay ? (
                      <span className="text-xs text-[#6B7280] italic">Pre-lay</span>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-mono tabular-nums" style={{ color: accentColor }}>
                          {p.eggCount.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-[#6B7280]">eggs</span>
                      </div>
                    )}
                  </td>

                  {/* Egg ± range */}
                  <td className="px-5 py-3">
                    {isPreLay ? (
                      <span className="text-xs text-[#6B7280]">—</span>
                    ) : (
                      <div>
                        <span className="text-xs font-mono text-[#6B7280] tabular-nums">
                          ±{p.eggRange} eggs
                        </span>
                        <div className="text-[9px] text-[#6B7280] mt-0.5 tabular-nums">
                          {Math.max(0, p.eggCount - p.eggRange).toLocaleString()} – {(p.eggCount + p.eggRange).toLocaleString()}
                        </div>
                      </div>
                    )}
                  </td>

                  {/* Confidence */}
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <ConfBadge pct={p.confidence} />
                      {/* Mini bar */}
                      <div className="flex-1 h-1 rounded-full bg-[#D9D9D9] overflow-hidden max-w-[60px]">
                        <div className="h-full rounded-full transition-all"
                          style={{
                            width: `${p.confidence}%`,
                            background: p.confidence >= 90 ? '#2D6A4F' : p.confidence >= 80 ? '#D97706' : '#DC2626',
                          }} />
                      </div>
                      {i > 0 && p.confidence < predictions[i - 1].confidence && (
                        <span className="text-[9px] text-[#6B7280]">↓</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* Footer totals */}
          {!isPreLay && (
            <tfoot>
              <tr className="border-t-2 border-[#D4CFC4] bg-[#F5F3EE]">
                <td className="px-5 py-2 text-[10px] tracking-wider text-gray-500" colSpan={3}>
                  {horizon.toUpperCase()} TOTALS / AVG
                </td>
                <td className="px-5 py-2">
                  <div className="flex items-center gap-1">
                    <Egg size={11} className="text-gray-400" />
                    <span className="text-sm font-mono text-gray-800">
                      {totalEggs.toLocaleString()} eggs
                    </span>
                  </div>
                  <div className="text-[9px] text-gray-400">{Math.round(totalEggs / predictions.length).toLocaleString()} / day avg</div>
                </td>
                <td className="px-5 py-2 text-[10px] text-gray-400" colSpan={2}>
                  Avg confidence: {avgConfidence}%
                </td>
              </tr>
            </tfoot>
          )}
        </table>
        </div>

        {/* Interpretation note */}
        <div className="px-4 sm:px-5 py-3 border-t border-[#E0DDD6] bg-[#F9F7F4] flex items-start gap-2">
          <Info size={12} className="text-gray-400 flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-gray-500 leading-relaxed">
            <strong className="text-gray-600">Interpreting the ± range:</strong>{' '}
            The confidence interval widens with each forecast day because uncertainty compounds over time.
            A ±2% HDEP range on {meta.hens} hens translates to roughly ±{Math.round((2 / 100) * meta.hens)} eggs/day.
            Confidence scores below 80% should be treated as indicative only — consider re-running the forecast
            after logging fresh data.
          </p>
        </div>
      </div>
    </main>
  );
}