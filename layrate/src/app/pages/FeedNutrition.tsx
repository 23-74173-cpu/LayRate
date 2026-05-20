import { useState, useMemo } from 'react';
import { AlertTriangle, Package, TrendingDown, CheckCircle, Info } from 'lucide-react';
import { CAGE_COLORS } from '../constants/cageColors';
import { TableCrudToolbar } from '../components/TableCrudToolbar';

// ─── Types ────────────────────────────────────────────────────────────────────
interface FeedBatch {
  code: string;
  dateReceived: string;
  crudeProtein: number;
  notes: string;
  stockKg: number;          // current stock on hand
  assignedCages: string[];  // cages currently running on this batch
}

interface DailyConsumption {
  date: string;
  cage: string;
  feed: string;
  amountKg: number;         // numeric for computation
  eggsDozen: number;        // dozen eggs collected that day
}

// ─── Static data ──────────────────────────────────────────────────────────────
const initialBatches: FeedBatch[] = [
  {
    code: 'F-001', dateReceived: '2026-03-01', crudeProtein: 17.5,
    notes: 'Layer mash — standard',
    stockKg: 118,
    assignedCages: ['CAGE-A', 'CAGE-C'],
  },
  {
    code: 'F-002', dateReceived: '2026-03-15', crudeProtein: 16.8,
    notes: 'Layer pellet — Supplier B',
    stockKg: 204,
    assignedCages: ['CAGE-B'],
  },
  {
    code: 'F-003', dateReceived: '2026-03-28', crudeProtein: 18.0,
    notes: 'Protein-boosted mix',
    stockKg: 38,
    assignedCages: ['CAGE-D'],
  },
];

const dailyData: DailyConsumption[] = [
  { date: '2026-04-11', cage: 'CAGE-A', feed: 'F-001', amountKg: 12.5, eggsDozen: 7.9 },
  { date: '2026-04-11', cage: 'CAGE-B', feed: 'F-002', amountKg: 12.2, eggsDozen: 7.3 },
  { date: '2026-04-11', cage: 'CAGE-C', feed: 'F-001', amountKg: 11.8, eggsDozen: 5.8 },
  { date: '2026-04-11', cage: 'CAGE-D', feed: 'F-003', amountKg: 12.9, eggsDozen: 0  },
  { date: '2026-04-10', cage: 'CAGE-A', feed: 'F-001', amountKg: 12.4, eggsDozen: 7.8 },
  { date: '2026-04-10', cage: 'CAGE-B', feed: 'F-002', amountKg: 12.0, eggsDozen: 7.1 },
  { date: '2026-04-10', cage: 'CAGE-C', feed: 'F-001', amountKg: 11.9, eggsDozen: 5.7 },
  { date: '2026-04-10', cage: 'CAGE-D', feed: 'F-003', amountKg: 13.0, eggsDozen: 0  },
  { date: '2026-04-09', cage: 'CAGE-A', feed: 'F-001', amountKg: 12.3, eggsDozen: 7.6 },
  { date: '2026-04-09', cage: 'CAGE-B', feed: 'F-002', amountKg: 12.1, eggsDozen: 7.0 },
  { date: '2026-04-09', cage: 'CAGE-C', feed: 'F-001', amountKg: 11.7, eggsDozen: 5.6 },
  { date: '2026-04-09', cage: 'CAGE-D', feed: 'F-003', amountKg: 12.8, eggsDozen: 0  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getDailyRateForBatch(batchCode: string): number {
  // Average daily kg consumed from the most recent 2 days
  const relevant = dailyData.filter(d => d.feed === batchCode);
  const byDate = relevant.reduce<Record<string, number>>((acc, d) => {
    acc[d.date] = (acc[d.date] ?? 0) + d.amountKg;
    return acc;
  }, {});
  const totals = Object.values(byDate);
  if (!totals.length) return 0;
  return totals.reduce((a, b) => a + b, 0) / totals.length;
}

function daysRemaining(stockKg: number, dailyRate: number): number {
  if (dailyRate <= 0) return Infinity;
  return Math.floor(stockKg / dailyRate);
}

function stockTag(days: number, threshold: number) {
  if (days === Infinity) return null;
  if (days <= 3)  return { label: `${days}d left — Reorder NOW`, cls: 'bg-red-100 text-red-700 border border-red-200' };
  if (days <= threshold) return { label: `${days}d left — Reorder soon`, cls: 'bg-[#FFF3CD] text-[#856404] border border-amber-200' };
  return { label: `${days}d left`, cls: 'bg-[#D5E8D4] text-[#004F9F]' };
}

// ─── FCR tooltip ──────────────────────────────────────────────────────────────
function FCRTooltip() {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-block ml-1">
      <Info size={12} className="text-[#6B7280] cursor-pointer"
        onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)} />
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-[rgba(255,255,255,0.90)] border border-[#D9D9D9] text-[#333333] text-[10px] rounded-lg px-3 py-2 shadow-xl z-20 leading-relaxed">
          <strong className="block mb-1">Feed Conversion Ratio (FCR)</strong>
          kg of feed consumed per dozen eggs produced across laying cages.
          Lower is better. Industry target: 1.4–1.7 kg/dozen.
          <div className="text-[#6B7280] mt-1">CAGE-D excluded (pre-lay).</div>
        </div>
      )}
    </span>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function FeedNutrition() {
  const [tab, setTab] = useState<'batches' | 'daily'>('batches');
  const [batches, setBatches] = useState(initialBatches);
  const [reorderDays, setReorderDays] = useState(7);

  // ── Derived metrics ──
  const layingCages = ['CAGE-A', 'CAGE-B', 'CAGE-C'];

  const avgCP = useMemo(() => {
    const recent = dailyData.filter(d => d.date === '2026-04-11');
    const cps = recent.map(d => batches.find(b => b.code === d.feed)?.crudeProtein ?? 0);
    return (cps.reduce((a, b) => a + b, 0) / cps.length).toFixed(1);
  }, [batches]);

  const avgFeedPerCageDay = useMemo(() => {
    const last2 = dailyData.filter(d => d.date >= '2026-04-10');
    const total = last2.reduce((a, d) => a + d.amountKg, 0);
    return (total / (last2.length)).toFixed(1);
  }, []);

  const fcr = useMemo(() => {
    // kg feed / dozen eggs, only laying cages, last 2 days
    const rows = dailyData.filter(d => layingCages.includes(d.cage) && d.date >= '2026-04-10');
    const totalFeed = rows.reduce((a, d) => a + d.amountKg, 0);
    const totalDozen = rows.reduce((a, d) => a + d.eggsDozen, 0);
    return totalDozen > 0 ? (totalFeed / totalDozen).toFixed(2) : '—';
  }, []);

  const totalFeedUsed = useMemo(() => {
    return dailyData.reduce((a, d) => a + d.amountKg, 0).toFixed(1);
  }, []);

  // ── Low-stock alerts ──
  const lowStockBatches = useMemo(() => {
    return batches
      .map(b => {
        const rate = getDailyRateForBatch(b.code);
        const days = daysRemaining(b.stockKg, rate);
        return { ...b, rate, days };
      })
      .filter(b => b.days <= reorderDays && b.days !== Infinity);
  }, [batches, reorderDays]);

  return (
    <main className="flex-1 p-3 sm:p-5 overflow-auto">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
        <div>
          <h1 className="text-xl">Feed &amp; Nutrition</h1>
          <p className="text-[11px] text-[#6B7280] mt-0.5">Batch management, consumption tracking &amp; efficiency</p>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-[#6B7280]">
          <label className="flex flex-wrap items-center gap-1.5">
            Reorder alert at
            <input
              type="number" min={1} max={30} value={reorderDays}
              onChange={e => setReorderDays(Number(e.target.value))}
              className="w-12 border border-[#D9D9D9] rounded px-2 py-1 text-xs bg-white focus:outline-none focus:border-[#002D5E] text-center"
            />
            days remaining
          </label>
        </div>
      </div>

      {/* Low-stock alert banner */}
      {lowStockBatches.length > 0 && (
        <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-amber-800 mb-1.5">
                <span className="font-medium">{lowStockBatches.length} batch{lowStockBatches.length > 1 ? 'es' : ''} running low on stock</span>
                {' '}— reorder threshold is set to {reorderDays} days.
              </p>
              <div className="flex flex-wrap gap-2">
                {lowStockBatches.map(b => (
                  <span key={b.code}
                    className={`inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full ${b.days <= 3 ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-amber-100 text-amber-800 border border-amber-200'}`}>
                    <Package size={10} />
                    <span className="font-medium">{b.code}</span>
                    — {b.days}d left at {b.rate.toFixed(1)} kg/day
                    {b.assignedCages.length > 0 && (
                      <span className="opacity-70">({b.assignedCages.join(', ')})</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
        <div className="bg-white p-5 rounded-lg border border-[#D9D9D9]">
          <div className="text-[10px] tracking-wider text-[#6B7280] mb-2">AVG CP% THIS WEEK</div>
          <div className="text-3xl sm:text-4xl tracking-tight mb-1 font-mono">{avgCP}%</div>
          <div className="flex items-center gap-1">
            <CheckCircle size={11} className="text-emerald-500" />
            <span className="text-xs text-[#6B7280]">within target range</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-[#D9D9D9]">
          <div className="text-[10px] tracking-wider text-[#6B7280] mb-2">AVG FEED / CAGE / DAY</div>
          <div className="text-3xl sm:text-4xl tracking-tight mb-1 font-mono">{avgFeedPerCageDay} kg</div>
          <div className="text-xs text-[#6B7280]">rolling 7 days</div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-[#D9D9D9]">
          <div className="flex items-center gap-1 text-[10px] tracking-wider text-[#6B7280] mb-2">
            FEED CONVERSION RATIO (FCR)
            <FCRTooltip />
          </div>
          <div className="text-3xl sm:text-4xl tracking-tight mb-1 font-mono">{fcr}</div>
          <div className="flex items-center gap-1">
            <TrendingDown size={11} className={Number(fcr) <= 1.7 ? 'text-emerald-500' : 'text-amber-500'} />
            <span className="text-xs text-[#6B7280]">
              kg feed / dozen eggs {Number(fcr) <= 1.7 ? '— on target' : '— above target'}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-[#D9D9D9]">
          <div className="text-[10px] tracking-wider text-[#6B7280] mb-2">TOTAL FEED USED</div>
          <div className="text-3xl sm:text-4xl tracking-tight mb-1 font-mono">{totalFeedUsed} kg</div>
          <div className="text-xs text-[#6B7280]">last {dailyData.map(d => d.date).filter((v, i, a) => a.indexOf(v) === i).length} days logged</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div className="flex w-full sm:w-auto">
          <button onClick={() => setTab('batches')}
            className={`flex-1 sm:flex-none px-4 sm:px-5 py-2 text-sm rounded-l-lg border transition-colors ${
              tab === 'batches'
                ? 'bg-[#002D5E] text-white border-[#002D5E]'
                : 'bg-white border-[#D9D9D9] text-[#6B7280] hover:bg-[#F5F6F8]'
            }`}>
            Feed Batches
          </button>
          <button onClick={() => setTab('daily')}
            className={`flex-1 sm:flex-none px-4 sm:px-5 py-2 text-sm rounded-r-lg border-t border-b border-r transition-colors ${
              tab === 'daily'
                ? 'bg-[#002D5E] text-white border-[#002D5E]'
                : 'bg-white border-[#D9D9D9] text-[#6B7280] hover:bg-[#F5F6F8]'
            }`}>
            Daily Consumption
          </button>
        </div>
        {tab === 'batches' && (
          <button className="w-full sm:w-auto bg-[#002D5E] text-white px-5 py-2 rounded-lg text-sm hover:bg-[#001F42] transition-colors flex items-center justify-center gap-2">
            + Add Feed Batch
          </button>
        )}
      </div>

      {/* Tables */}
      <div className="bg-white rounded-lg border border-[#D9D9D9] overflow-hidden">
        {tab === 'batches' ? (
          <>
          <div className="px-4 pt-4">
            <TableCrudToolbar label="Feed Batches CRUD" className="mb-0" />
          </div>
          <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] table-fixed">
            <colgroup>
              <col style={{ width: '9%' }} />
              <col style={{ width: '11%' }} />
              <col style={{ width: '9%' }} />
              <col style={{ width: '18%' }} />
              <col style={{ width: '17%' }} />  {/* Currently assigned */}
              <col style={{ width: '11%' }} />  {/* Stock */}
              <col style={{ width: '25%' }} />  {/* Days remaining */}
            </colgroup>
            <thead>
              <tr className="border-b border-[#D9D9D9] bg-[#F5F6F8]">
                <th className="text-left text-[10px] tracking-wider text-[#6B7280] px-4 py-3">BATCH</th>
                <th className="text-left text-[10px] tracking-wider text-[#6B7280] px-4 py-3">DATE REC.</th>
                <th className="text-left text-[10px] tracking-wider text-[#6B7280] px-4 py-3">CP%</th>
                <th className="text-left text-[10px] tracking-wider text-[#6B7280] px-4 py-3">NOTES</th>
                <th className="text-left text-[10px] tracking-wider text-[#6B7280] px-4 py-3">ASSIGNED TO</th>
                <th className="text-left text-[10px] tracking-wider text-[#6B7280] px-4 py-3">STOCK (KG)</th>
                <th className="text-left text-[10px] tracking-wider text-[#6B7280] px-4 py-3">DAYS LEFT</th>
              </tr>
            </thead>
            <tbody>
              {batches.map(b => {
                const rate = getDailyRateForBatch(b.code);
                const days = daysRemaining(b.stockKg, rate);
                const tag = stockTag(days, reorderDays);
                return (
                  <tr key={b.code} className="border-b border-[#D9D9D9] hover:bg-[#F5F6F8] transition-colors">
                    {/* Batch code */}
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono text-[#002D5E] cursor-pointer hover:underline" title="View batch details">{b.code}</span>
                    </td>

                    {/* Date received */}
                    <td className="px-4 py-3 text-sm text-[#6B7280] font-mono">{b.dateReceived}</td>

                    {/* CP% */}
                    <td className="px-4 py-3">
                      <span className="text-xs bg-[#D5E8D4] text-[#004F9F] px-2 py-0.5 rounded-full">{b.crudeProtein}%</span>
                    </td>

                    {/* Notes */}
                    <td className="px-4 py-3 text-sm text-[#6B7280] truncate">{b.notes}</td>

                    {/* Currently assigned to */}
                    <td className="px-4 py-3">
                      {b.assignedCages.length === 0 ? (
                        <span className="text-xs text-[#6B7280] italic">Unassigned</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {b.assignedCages.map(cage => (
                            <span key={cage}
                              className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded"
                              style={{ background: `${CAGE_COLORS[cage]}18`, color: CAGE_COLORS[cage], border: `1px solid ${CAGE_COLORS[cage]}40` }}>
                              <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: CAGE_COLORS[cage] }} />
                              {cage}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Stock kg */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-[#333333] font-mono">{b.stockKg} kg</span>
                        <div className="h-1 rounded-full bg-[#D9D9D9] overflow-hidden w-16">
                          <div className="h-full rounded-full"
                            style={{
                              width: `${Math.min(100, (b.stockKg / 300) * 100)}%`,
                              background: days <= 3 ? '#DC2626' : days <= reorderDays ? '#D97706' : '#002D5E',
                            }} />
                        </div>
                      </div>
                    </td>

                    {/* Days remaining */}
                    <td className="px-4 py-3">
                      {tag ? (
                        <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${tag.cls}`}>
                          {days <= reorderDays && <AlertTriangle size={9} />}
                          {tag.label}
                        </span>
                      ) : (
                        <span className="text-xs text-[#6B7280]">{days}d left</span>
                      )}
                      <div className="text-[9px] text-[#6B7280] mt-0.5">{rate.toFixed(1)} kg/day avg</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
          </>
        ) : (
          /* Daily Consumption table */
          <>
          <div className="px-4 pt-4">
            <TableCrudToolbar label="Daily Consumption CRUD" className="mb-0" />
          </div>
          <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] table-fixed">
            <colgroup>
              <col style={{ width: '18%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '16%' }} />  {/* Amount — explicit width */}
              <col style={{ width: '14%' }} />  {/* Eggs dozen */}
              <col style={{ width: '14%' }} />  {/* FCR */}
              <col style={{ width: '10%' }} />  {/* CP% */}
            </colgroup>
            <thead>
              <tr className="border-b border-[#D9D9D9] bg-[#F5F6F8]">
                <th className="text-left text-[10px] tracking-wider text-[#6B7280] px-4 py-3">DATE</th>
                <th className="text-left text-[10px] tracking-wider text-[#6B7280] px-4 py-3">CAGE</th>
                <th className="text-left text-[10px] tracking-wider text-[#6B7280] px-4 py-3">BATCH</th>
                <th className="text-left text-[10px] tracking-wider text-[#6B7280] px-4 py-3">AMOUNT (KG)</th>
                <th className="text-left text-[10px] tracking-wider text-[#6B7280] px-4 py-3">EGGS (DOZ)</th>
                <th className="text-left text-[10px] tracking-wider text-[#6B7280] px-4 py-3">
                  <span className="flex items-center gap-1">FCR <FCRTooltip /></span>
                </th>
                <th className="text-left text-[10px] tracking-wider text-[#6B7280] px-4 py-3">CP%</th>
              </tr>
            </thead>
            <tbody>
              {dailyData.map((d, i) => {
                const rowFcr = d.eggsDozen > 0 ? (d.amountKg / d.eggsDozen).toFixed(2) : '—';
                const cp = batches.find(b => b.code === d.feed)?.crudeProtein ?? '—';
                const isPreLay = d.eggsDozen === 0;
                const fcrNum = Number(rowFcr);
                const fcrGood = !isPreLay && fcrNum <= 1.7;

                return (
                  <tr key={i} className="border-b border-[#D9D9D9] hover:bg-[#F5F6F8] transition-colors">
                    {/* Date */}
                    <td className="px-4 py-3 text-sm text-[#6B7280] font-mono">{d.date}</td>

                    {/* Cage */}
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-sm text-[#002D5E] cursor-pointer hover:underline" title="View cage details">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: CAGE_COLORS[d.cage] }} />
                        {d.cage}
                      </span>
                    </td>

                    {/* Batch */}
                    <td className="px-4 py-3 text-sm text-[#333333] font-mono">{d.feed}</td>

                    {/* Amount (kg) — explicit, not truncated */}
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono text-[#333333] tabular-nums">{d.amountKg.toFixed(1)} kg</span>
                    </td>

                    {/* Eggs (dozen) */}
                    <td className="px-4 py-3">
                      {isPreLay
                        ? <span className="text-xs text-[#6B7280] italic">Pre-lay</span>
                        : <span className="text-sm font-mono text-[#333333] tabular-nums">{d.eggsDozen} doz</span>
                      }
                    </td>

                    {/* FCR */}
                    <td className="px-4 py-3">
                      {isPreLay
                        ? <span className="text-xs text-[#6B7280]">—</span>
                        : (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            fcrGood ? 'bg-[#D5E8D4] text-[#004F9F]' : 'bg-[#FFF3CD] text-[#856404]'
                          }`}>
                            {rowFcr}
                          </span>
                        )
                      }
                    </td>

                    {/* CP% */}
                    <td className="px-4 py-3 text-sm text-[#6B7280]">{cp}%</td>
                  </tr>
                );
              })}
            </tbody>

            {/* Totals footer */}
            <tfoot>
              <tr className="border-t-2 border-[#D9D9D9] bg-[#F5F6F8]">
                <td className="px-4 py-2 text-[10px] tracking-wider text-[#6B7280]" colSpan={3}>
                  TOTAL / AVG (SHOWN ROWS)
                </td>
                <td className="px-4 py-2 text-sm font-mono text-[#333333]">
                  {dailyData.reduce((a, d) => a + d.amountKg, 0).toFixed(1)} kg
                </td>
                <td className="px-4 py-2 text-sm font-mono text-[#333333]">
                  {dailyData.reduce((a, d) => a + d.eggsDozen, 0).toFixed(1)} doz
                </td>
                <td className="px-4 py-2">
                  <span className="text-xs text-[#333333]">
                    {(() => {
                      const tf = dailyData.reduce((a, d) => a + d.amountKg, 0);
                      const te = dailyData.filter(d => d.eggsDozen > 0).reduce((a, d) => a + d.eggsDozen, 0);
                      return te > 0 ? `${(tf / te).toFixed(2)} avg` : '—';
                    })()}
                  </span>
                </td>
                <td className="px-4 py-2" />
              </tr>
            </tfoot>
          </table>
          </div>
          </>
        )}
      </div>
    </main>
  );
}