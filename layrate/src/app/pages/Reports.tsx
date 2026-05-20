import { useState, useMemo } from 'react';
import {
  Download, Printer, FileText, AlertTriangle,
  ChevronDown, FileSpreadsheet, Info,
} from 'lucide-react';
import { CAGE_COLORS } from '../constants/cageColors';
import { TableCrudToolbar } from '../components/TableCrudToolbar';

// ─── Report type definitions ──────────────────────────────────────────────────
type ReportTypeKey =
  | 'Production Report'
  | 'Feed Consumption Report'
  | 'Environment Summary'
  | 'Mortality Report'
  | 'Weekly Farm Summary';

interface ReportTypeMeta {
  label: string;
  description: string;
  icon: React.ReactNode;
  pdfSupported: boolean;
}

const REPORT_TYPES: Record<ReportTypeKey, ReportTypeMeta> = {
  'Production Report': {
    label: 'Production Report',
    description: 'Daily egg output, HDEP, and hen-day data per cage.',
    icon: <FileText size={13} />,
    pdfSupported: true,
  },
  'Feed Consumption Report': {
    label: 'Feed Consumption Report',
    description: 'Feed batch, daily consumption (kg), CP%, and FCR per cage.',
    icon: <FileSpreadsheet size={13} />,
    pdfSupported: true,
  },
  'Environment Summary': {
    label: 'Environment Summary',
    description: 'Sensor readings — temperature, humidity, and status per cage.',
    icon: <FileText size={13} />,
    pdfSupported: true,
  },
  'Mortality Report': {
    label: 'Mortality Report',
    description: 'Daily mortality and culling counts with running totals.',
    icon: <FileSpreadsheet size={13} />,
    pdfSupported: false,
  },
  'Weekly Farm Summary': {
    label: 'Weekly Farm Summary',
    description: 'Aggregated weekly view across all cages — ideal for farm owners or vets.',
    icon: <FileText size={13} />,
    pdfSupported: true,
  },
};

const REPORT_TYPE_KEYS = Object.keys(REPORT_TYPES) as ReportTypeKey[];
const cageOptions = ['All', 'CAGE-A', 'CAGE-B', 'CAGE-C', 'CAGE-D'];

// ─── Data ─────────────────────────────────────────────────────────────────────
interface BaseRow {
  date: string;
  cage: string;
}

interface ProductionRow extends BaseRow {
  breed: string;
  eggs: number;
  hens: number;
  hdep: string;
  noLog: boolean;   // true = zero eggs, could be data gap
}

interface FeedRow extends BaseRow {
  feedBatch: string;
  feedKg: number;
  cp: string;
  eggsDozen: number;
  fcr: string;
}

interface EnvRow extends BaseRow {
  sensor: string;
  temp: number;
  humidity: string;
  tempStatus: 'OK' | 'Watch' | 'Alert';
  humStatus: 'OK' | 'Watch' | 'Alert';
  overallStatus: 'Normal' | 'Watch' | 'Alert';
}

interface MortalityRow extends BaseRow {
  mortalities: number;
  culled: number;
  total: number;
  notes: string;
}

interface WeeklyRow {
  weekOf: string;
  cage: string;
  totalEggs: number;
  avgHdep: string;
  totalFeedKg: number;
  avgTemp: number;
  avgHumidity: string;
}

const productionData: ProductionRow[] = [
  { date: '2026-04-11', cage: 'CAGE-A', breed: 'ISA Brown',           eggs: 103, hens: 120, hdep: '85.8%', noLog: false },
  { date: '2026-04-11', cage: 'CAGE-B', breed: 'Lohmann Brown',       eggs: 87,  hens: 120, hdep: '72.5%', noLog: false },
  { date: '2026-04-11', cage: 'CAGE-C', breed: 'Dekalb White',        eggs: 70,  hens: 120, hdep: '58.3%', noLog: false },
  { date: '2026-04-11', cage: 'CAGE-D', breed: 'ISA Brown (Pullet)',   eggs: 0,   hens: 120, hdep: '0.0%',  noLog: true  },
  { date: '2026-04-10', cage: 'CAGE-A', breed: 'ISA Brown',           eggs: 101, hens: 120, hdep: '84.2%', noLog: false },
  { date: '2026-04-10', cage: 'CAGE-B', breed: 'Lohmann Brown',       eggs: 85,  hens: 120, hdep: '70.8%', noLog: false },
  { date: '2026-04-10', cage: 'CAGE-C', breed: 'Dekalb White',        eggs: 68,  hens: 120, hdep: '56.7%', noLog: false },
  { date: '2026-04-10', cage: 'CAGE-D', breed: 'ISA Brown (Pullet)',   eggs: 0,   hens: 120, hdep: '0.0%',  noLog: true  },
  { date: '2026-04-09', cage: 'CAGE-A', breed: 'ISA Brown',           eggs: 104, hens: 120, hdep: '86.7%', noLog: false },
  { date: '2026-04-09', cage: 'CAGE-B', breed: 'Lohmann Brown',       eggs: 88,  hens: 120, hdep: '73.3%', noLog: false },
  { date: '2026-04-09', cage: 'CAGE-C', breed: 'Dekalb White',        eggs: 69,  hens: 120, hdep: '57.5%', noLog: false },
  { date: '2026-04-09', cage: 'CAGE-D', breed: 'ISA Brown (Pullet)',   eggs: 0,   hens: 120, hdep: '0.0%',  noLog: true  },
  { date: '2026-04-08', cage: 'CAGE-A', breed: 'ISA Brown',           eggs: 100, hens: 120, hdep: '83.3%', noLog: false },
  { date: '2026-04-08', cage: 'CAGE-B', breed: 'Lohmann Brown',       eggs: 84,  hens: 120, hdep: '70.0%', noLog: false },
  { date: '2026-04-08', cage: 'CAGE-C', breed: 'Dekalb White',        eggs: 67,  hens: 120, hdep: '55.8%', noLog: false },
  { date: '2026-04-08', cage: 'CAGE-D', breed: 'ISA Brown (Pullet)',   eggs: 0,   hens: 120, hdep: '0.0%',  noLog: true  },
];

const feedData: FeedRow[] = [
  { date: '2026-04-11', cage: 'CAGE-A', feedBatch: 'F-001', feedKg: 12.5, cp: '17.5%', eggsDozen: 8.6, fcr: '1.45' },
  { date: '2026-04-11', cage: 'CAGE-B', feedBatch: 'F-002', feedKg: 12.2, cp: '16.8%', eggsDozen: 7.3, fcr: '1.67' },
  { date: '2026-04-11', cage: 'CAGE-C', feedBatch: 'F-001', feedKg: 11.8, cp: '17.5%', eggsDozen: 5.8, fcr: '2.03' },
  { date: '2026-04-11', cage: 'CAGE-D', feedBatch: 'F-003', feedKg: 12.9, cp: '18.0%', eggsDozen: 0,   fcr: '—'    },
  { date: '2026-04-10', cage: 'CAGE-A', feedBatch: 'F-001', feedKg: 12.4, cp: '17.5%', eggsDozen: 8.4, fcr: '1.48' },
  { date: '2026-04-10', cage: 'CAGE-B', feedBatch: 'F-002', feedKg: 12.0, cp: '16.8%', eggsDozen: 7.1, fcr: '1.69' },
  { date: '2026-04-10', cage: 'CAGE-C', feedBatch: 'F-001', feedKg: 11.9, cp: '17.5%', eggsDozen: 5.7, fcr: '2.09' },
  { date: '2026-04-10', cage: 'CAGE-D', feedBatch: 'F-003', feedKg: 13.0, cp: '18.0%', eggsDozen: 0,   fcr: '—'    },
];

const envData: EnvRow[] = [
  { date: '2026-04-11', cage: 'CAGE-A', sensor: 'S-01', temp: 28.9, humidity: '68.1%', tempStatus: 'OK',    humStatus: 'OK',    overallStatus: 'Normal' },
  { date: '2026-04-11', cage: 'CAGE-B', sensor: 'S-02', temp: 28.7, humidity: '70.0%', tempStatus: 'OK',    humStatus: 'Watch', overallStatus: 'Watch'  },
  { date: '2026-04-11', cage: 'CAGE-C', sensor: 'S-03', temp: 29.2, humidity: '71.0%', tempStatus: 'OK',    humStatus: 'Alert', overallStatus: 'Alert'  },
  { date: '2026-04-11', cage: 'CAGE-D', sensor: '—',    temp: 0,    humidity: '—',     tempStatus: 'OK',    humStatus: 'OK',    overallStatus: 'Normal' },
  { date: '2026-04-10', cage: 'CAGE-A', sensor: 'S-01', temp: 28.6, humidity: '67.8%', tempStatus: 'OK',    humStatus: 'OK',    overallStatus: 'Normal' },
  { date: '2026-04-10', cage: 'CAGE-B', sensor: 'S-02', temp: 28.5, humidity: '69.5%', tempStatus: 'OK',    humStatus: 'OK',    overallStatus: 'Normal' },
  { date: '2026-04-10', cage: 'CAGE-C', sensor: 'S-03', temp: 29.0, humidity: '70.5%', tempStatus: 'OK',    humStatus: 'Watch', overallStatus: 'Watch'  },
  { date: '2026-04-10', cage: 'CAGE-D', sensor: '—',    temp: 0,    humidity: '—',     tempStatus: 'OK',    humStatus: 'OK',    overallStatus: 'Normal' },
];

const mortalityData: MortalityRow[] = [
  { date: '2026-04-11', cage: 'CAGE-A', mortalities: 0, culled: 0, total: 0, notes: '—' },
  { date: '2026-04-11', cage: 'CAGE-B', mortalities: 1, culled: 0, total: 1, notes: 'Found dead in cage row 3' },
  { date: '2026-04-11', cage: 'CAGE-C', mortalities: 0, culled: 1, total: 1, notes: 'Culled — low production' },
  { date: '2026-04-10', cage: 'CAGE-A', mortalities: 0, culled: 0, total: 0, notes: '—' },
  { date: '2026-04-10', cage: 'CAGE-B', mortalities: 0, culled: 0, total: 0, notes: '—' },
  { date: '2026-04-10', cage: 'CAGE-C', mortalities: 1, culled: 0, total: 1, notes: 'Found dead — unknown cause' },
];

const weeklyData: WeeklyRow[] = [
  { weekOf: '2026-04-07', cage: 'CAGE-A', totalEggs: 714, avgHdep: '85.2%', totalFeedKg: 86.8, avgTemp: 28.6, avgHumidity: '67.9%' },
  { weekOf: '2026-04-07', cage: 'CAGE-B', totalEggs: 602, avgHdep: '71.7%', totalFeedKg: 85.4, avgTemp: 28.7, avgHumidity: '70.1%' },
  { weekOf: '2026-04-07', cage: 'CAGE-C', totalEggs: 483, avgHdep: '57.5%', totalFeedKg: 82.6, avgTemp: 29.0, avgHumidity: '70.8%' },
  { weekOf: '2026-04-07', cage: 'CAGE-D', totalEggs: 0,   avgHdep: '0.0%',  totalFeedKg: 90.3, avgTemp: 27.9, avgHumidity: '66.6%' },
  { weekOf: '2026-03-31', cage: 'CAGE-A', totalEggs: 700, avgHdep: '83.3%', totalFeedKg: 84.0, avgTemp: 28.3, avgHumidity: '67.2%' },
  { weekOf: '2026-03-31', cage: 'CAGE-B', totalEggs: 588, avgHdep: '70.0%', totalFeedKg: 83.3, avgTemp: 28.5, avgHumidity: '69.8%' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function statusCls(s: string) {
  if (s === 'Normal' || s === 'OK') return 'bg-[#D5E8D4] text-[#004F9F]';
  if (s === 'Watch')                return 'bg-[#FFF3CD] text-[#856404]';
  return 'bg-[#F8D7DA] text-[#721C24]';
}

// ─── Zero-log badge ────────────────────────────────────────────────────────────
function NoLogBadge() {
  const [tip, setTip] = useState(false);
  return (
    <span className="relative inline-flex items-center">
      <span
        className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200 cursor-help"
        onMouseEnter={() => setTip(true)}
        onMouseLeave={() => setTip(false)}
      >
        <AlertTriangle size={9} />
        No log / verify
      </span>
      {tip && (
        <span className="absolute bottom-full left-0 mb-1.5 w-52 z-10 bg-[rgba(255,255,255,0.90)] border border-[#D9D9D9] text-[#333333] text-[10px] rounded-lg px-3 py-2 shadow-xl leading-relaxed pointer-events-none">
          Zero eggs recorded. This may be a pre-lay cage (expected) or a missed log entry. Verify with cage attendant before filing.
        </span>
      )}
    </span>
  );
}

// ─── Export dropdown ──────────────────────────────────────────────────────────
function ExportMenu({ onCSV, onPDF, pdfSupported }: {
  onCSV: () => void; onPDF: () => void; pdfSupported: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 bg-[#002D5E] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#001F42] transition-colors"
      >
        <Download size={14} />
        Export
        <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1.5 z-20 bg-[rgba(255,255,255,0.90)] border border-[#D9D9D9] rounded-lg shadow-xl overflow-hidden w-48">
            <button
              onClick={() => { onCSV(); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#333333] hover:bg-[#F5F6F8] transition-colors text-left"
            >
              <FileSpreadsheet size={14} className="text-emerald-600" />
              Export as CSV
            </button>
            <button
              onClick={() => { onPDF(); setOpen(false); }}
              disabled={!pdfSupported}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors text-left ${
                pdfSupported
                  ? 'text-[#333333] hover:bg-[#F5F6F8]'
                  : 'text-gray-300 cursor-not-allowed'
              }`}
            >
              <FileText size={14} className={pdfSupported ? 'text-red-500' : 'text-gray-300'} />
              Export as PDF
              {!pdfSupported && <span className="ml-auto text-[9px] text-gray-300">N/A</span>}
            </button>
            <div className="border-t border-[#D9D9D9]">
              <button
                onClick={() => { window.print(); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#333333] hover:bg-[#F5F6F8] transition-colors text-left"
              >
                <Printer size={14} className="text-gray-500" />
                Print view
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function Reports() {
  const [reportType, setReportType] = useState<ReportTypeKey>('Production Report');
  const [fromDate, setFromDate] = useState('');
  const [toDate,   setToDate]   = useState('');
  const [cage, setCage]         = useState('All');
  const [generated, setGenerated] = useState(true);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const meta = REPORT_TYPES[reportType];

  // ── Filter helpers ──
  function filterByDateCage<T extends BaseRow>(rows: T[]): T[] {
    return rows.filter(r => {
      if (cage !== 'All' && r.cage !== cage) return false;
      if (fromDate && r.date < fromDate) return false;
      if (toDate   && r.date > toDate)   return false;
      return true;
    });
  }

  function filterWeekly(rows: WeeklyRow[]): WeeklyRow[] {
    return rows.filter(r => {
      if (cage !== 'All' && r.cage !== cage) return false;
      if (fromDate && r.weekOf < fromDate) return false;
      if (toDate   && r.weekOf > toDate)   return false;
      return true;
    });
  }

  const prodRows     = useMemo(() => filterByDateCage(productionData), [cage, fromDate, toDate, generated]);
  const feedRows     = useMemo(() => filterByDateCage(feedData),       [cage, fromDate, toDate, generated]);
  const envRows      = useMemo(() => filterByDateCage(envData),        [cage, fromDate, toDate, generated]);
  const mortRows     = useMemo(() => filterByDateCage(mortalityData),  [cage, fromDate, toDate, generated]);
  const weeklyRows   = useMemo(() => filterWeekly(weeklyData),         [cage, fromDate, toDate, generated]);

  // ── Row counts ──
  const rowCount = {
    'Production Report':      prodRows.length,
    'Feed Consumption Report': feedRows.length,
    'Environment Summary':    envRows.length,
    'Mortality Report':       mortRows.length,
    'Weekly Farm Summary':    weeklyRows.length,
  }[reportType];

  // ── CSV export ──
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    if (reportType === 'Production Report') {
      headers = ['Date', 'Cage', 'Breed', 'Eggs', 'Hens', 'HDEP', 'No Log Flag'];
      rows = prodRows.map(r => [r.date, r.cage, r.breed, r.eggs, r.hens, r.hdep, r.noLog ? 'YES - Verify' : '']);
    } else if (reportType === 'Feed Consumption Report') {
      headers = ['Date', 'Cage', 'Feed Batch', 'Feed (kg)', 'CP%', 'Eggs (doz)', 'FCR'];
      rows = feedRows.map(r => [r.date, r.cage, r.feedBatch, r.feedKg, r.cp, r.eggsDozen, r.fcr]);
    } else if (reportType === 'Environment Summary') {
      headers = ['Date', 'Cage', 'Sensor', 'Temp (°C)', 'Humidity', 'Temp Status', 'Hum Status', 'Overall'];
      rows = envRows.map(r => [r.date, r.cage, r.sensor, r.temp || '—', r.humidity, r.tempStatus, r.humStatus, r.overallStatus]);
    } else if (reportType === 'Mortality Report') {
      headers = ['Date', 'Cage', 'Mortalities', 'Culled', 'Total', 'Notes'];
      rows = mortRows.map(r => [r.date, r.cage, r.mortalities, r.culled, r.total, r.notes]);
    } else {
      headers = ['Week Of', 'Cage', 'Total Eggs', 'Avg HDEP', 'Total Feed (kg)', 'Avg Temp', 'Avg Humidity'];
      rows = weeklyRows.map(r => [r.weekOf, r.cage, r.totalEggs, r.avgHdep, r.totalFeedKg, r.avgTemp, r.avgHumidity]);
    }

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const fileName = `${reportType.replace(/ /g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    setExportNotice(`Exported ${fileName}`);
    window.setTimeout(() => setExportNotice(null), 2200);
  };

  const handleExportPDF = () => {
    setExportNotice('Print dialog opened for PDF export');
    window.setTimeout(() => setExportNotice(null), 2200);
    window.print();
  };

  return (
    <main className="flex-1 p-5 overflow-auto">
      {/* Page header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl">Reports</h1>
          <p className="text-[11px] text-gray-400 mt-0.5">Generate, review, and export farm reports</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-[#FAF8F5] rounded-lg border border-[#D4CFC4] p-4 mb-4">
        <div className="flex items-end gap-3 flex-wrap">
          {/* Report type */}
          <div className="flex-[2] min-w-[180px]">
            <label className="block text-xs text-gray-500 mb-1.5">Report Type</label>
            <select
              value={reportType}
              onChange={e => setReportType(e.target.value as ReportTypeKey)}
              className="w-full border border-[#D9D9D9] rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[#002D5E] appearance-none cursor-pointer"
            >
              {REPORT_TYPE_KEYS.map(t => (
                <option key={t} value={t}>{REPORT_TYPES[t].label}</option>
              ))}
            </select>
          </div>

          {/* From */}
          <div className="flex-1 min-w-[130px]">
            <label className="block text-xs text-gray-500 mb-1.5">From</label>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
              className="w-full border border-[#D4CFC4] rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[#2D6A4F]" />
          </div>

          {/* To */}
          <div className="flex-1 min-w-[130px]">
            <label className="block text-xs text-[#6B7280] mb-1.5">To</label>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
              className="w-full border border-[#D9D9D9] rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[#002D5E]" />
          </div>

          {/* Cage */}
          <div className="flex-1 min-w-[120px]">
            <label className="block text-xs text-[#6B7280] mb-1.5">Cage</label>
            <select value={cage} onChange={e => setCage(e.target.value)}
              className="w-full border border-[#D9D9D9] rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[#002D5E] appearance-none cursor-pointer">
              {cageOptions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <button
            onClick={() => setGenerated(g => !g)}
            className="bg-[#002D5E] text-white px-5 py-2.5 rounded-lg text-sm hover:bg-[#001F42] transition-colors shrink-0"
          >
            Generate Report
          </button>
        </div>

        {/* Report type description */}
        <div className="mt-3 flex items-center gap-2 text-[11px] text-[#6B7280]">
          <Info size={11} className="text-[#6B7280] flex-shrink-0" />
          <span>{meta.description}</span>
          {!meta.pdfSupported && (
            <span className="ml-1 text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">PDF not available for this type</span>
          )}
        </div>
      </div>

      {/* Action bar — report title + export */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[#6B7280]">{meta.icon}</span>
            <span className="text-sm text-[#333333]">{reportType}</span>
          </div>
          <span className="text-[10px] bg-[#F5F6F8] text-[#6B7280] px-2 py-0.5 rounded-full border border-[#D9D9D9]">
            {rowCount} row{rowCount !== 1 ? 's' : ''}
          </span>
          {reportType === 'Production Report' && prodRows.some(r => r.noLog) && (
            <span className="flex items-center gap-1 text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
              <AlertTriangle size={9} />
              {prodRows.filter(r => r.noLog).length} zero-log row{prodRows.filter(r => r.noLog).length !== 1 ? 's' : ''} — verify
            </span>
          )}
        </div>

        {/* Export buttons — prominent placement */}
        <ExportMenu
          onCSV={handleExportCSV}
          onPDF={handleExportPDF}
          pdfSupported={meta.pdfSupported}
        />
      </div>

      {exportNotice && (
        <div className="mb-3 text-xs text-[#004F9F] bg-[#EAF0F8] border border-[#D9D9D9] rounded-lg px-3 py-2">
          {exportNotice}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border border-[#D9D9D9] overflow-hidden">

        {/* ── Production Report ── */}
        {reportType === 'Production Report' && (
          <>
          <div className="px-5 pt-4">
            <TableCrudToolbar label="Production Report CRUD" className="mb-0" />
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#D9D9D9] bg-[#F5F6F8]">
                {['DATE', 'CAGE', 'BREED', 'EGGS', 'HENS', 'HDEP', 'STATUS'].map(h => (
                  <th key={h} className="text-left text-[10px] tracking-wider text-[#6B7280] px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {prodRows.map(r => (
                <tr key={`${r.date}-${r.cage}`}
                  className={`border-b border-[#D9D9D9] transition-colors ${r.noLog ? 'bg-amber-50 hover:bg-amber-100/60' : 'hover:bg-[#F5F6F8]'}`}>
                  <td className="px-5 py-3 text-sm text-[#333333] font-mono">{r.date}</td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-1.5 text-sm text-[#002D5E] cursor-pointer hover:underline" title="View cage details">
                      <span className="w-2 h-2 rounded-full" style={{ background: CAGE_COLORS[r.cage] ?? '#999' }} />
                      {r.cage}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-[#6B7280]">{r.breed}</td>
                  <td className="px-5 py-3 text-sm font-mono text-[#333333]">{r.eggs}</td>
                  <td className="px-5 py-3 text-sm text-[#6B7280]">{r.hens}</td>
                  <td className="px-5 py-3 text-sm font-mono text-[#333333]">{r.hdep}</td>
                  <td className="px-5 py-3">
                    {r.noLog ? <NoLogBadge /> : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#D5E8D4] text-[#004F9F]">Logged</span>
                    )}
                  </td>
                </tr>
              ))}
              {prodRows.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-sm text-[#6B7280]">No data for selected filters.</td></tr>
              )}
            </tbody>
          </table>
          </>
        )}

        {/* ── Feed Consumption Report ── */}
        {reportType === 'Feed Consumption Report' && (
          <>
          <div className="px-5 pt-4">
            <TableCrudToolbar label="Feed Report CRUD" className="mb-0" />
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#D4CFC4] bg-[#F5F3EE]">
                {['DATE', 'CAGE', 'FEED BATCH', 'FEED (KG)', 'CP%', 'EGGS (DOZ)', 'FCR'].map(h => (
                  <th key={h} className="text-left text-[10px] tracking-wider text-gray-500 px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {feedRows.map((r, i) => (
                <tr key={i} className="border-b border-[#EBE8E0] hover:bg-[#F5F3EE] transition-colors">
                  <td className="px-5 py-3 text-sm text-gray-700 font-mono">{r.date}</td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-1.5 text-sm text-[#002D5E] cursor-pointer hover:underline" title="View cage details">
                      <span className="w-2 h-2 rounded-full" style={{ background: CAGE_COLORS[r.cage] ?? '#999' }} />
                      {r.cage}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm font-mono text-gray-700">{r.feedBatch}</td>
                  <td className="px-5 py-3 text-sm font-mono text-gray-800">{r.feedKg} kg</td>
                  <td className="px-5 py-3">
                    <span className="text-xs bg-[#D5E8D4] text-[#2D6A4F] px-2 py-0.5 rounded-full">{r.cp}</span>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-700">{r.eggsDozen > 0 ? `${r.eggsDozen} doz` : <span className="text-xs text-gray-400 italic">Pre-lay</span>}</td>
                  <td className="px-5 py-3">
                    {r.fcr === '—' ? (
                      <span className="text-xs text-gray-400">—</span>
                    ) : (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${Number(r.fcr) <= 1.7 ? 'bg-[#D5E8D4] text-[#2D6A4F]' : 'bg-[#FFF3CD] text-[#856404]'}`}>
                        {r.fcr}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {feedRows.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-sm text-gray-400">No data for selected filters.</td></tr>
              )}
            </tbody>
          </table>
          </>
        )}

        {/* ── Environment Summary ── */}
        {reportType === 'Environment Summary' && (
          <>
          <div className="px-5 pt-4">
            <TableCrudToolbar label="Environment Report CRUD" className="mb-0" />
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#D4CFC4] bg-[#F5F3EE]">
                {['DATE', 'CAGE', 'SENSOR', 'TEMP (°C)', 'HUMIDITY', 'TEMP STATUS', 'HUM STATUS', 'OVERALL'].map(h => (
                  <th key={h} className="text-left text-[10px] tracking-wider text-gray-500 px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {envRows.map((r, i) => {
                const noSensor = r.sensor === '—';
                return (
                  <tr key={i} className={`border-b border-[#EBE8E0] transition-colors ${noSensor ? 'opacity-60 hover:bg-[#F5F3EE]' : 'hover:bg-[#F5F3EE]'}`}>
                    <td className="px-5 py-3 text-sm text-gray-700 font-mono">{r.date}</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1.5 text-sm text-[#002D5E] cursor-pointer hover:underline" title="View cage details">
                        <span className="w-2 h-2 rounded-full" style={{ background: CAGE_COLORS[r.cage] ?? '#999' }} />
                        {r.cage}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm font-mono text-gray-600">{r.sensor}</td>
                    <td className="px-5 py-3 text-sm font-mono text-gray-800">{noSensor ? '—' : `${r.temp}°C`}</td>
                    <td className="px-5 py-3 text-sm text-gray-700">{r.humidity}</td>
                    <td className="px-5 py-3">
                      {noSensor ? <span className="text-xs text-gray-400">No sensor</span>
                        : <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusCls(r.tempStatus)}`}>{r.tempStatus}</span>}
                    </td>
                    <td className="px-5 py-3">
                      {noSensor ? <span className="text-xs text-gray-400">No sensor</span>
                        : <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusCls(r.humStatus)}`}>{r.humStatus}</span>}
                    </td>
                    <td className="px-5 py-3">
                      {noSensor
                        ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FFF3CD] text-[#856404]">Manual</span>
                        : <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusCls(r.overallStatus)}`}>{r.overallStatus}</span>}
                    </td>
                  </tr>
                );
              })}
              {envRows.length === 0 && (
                <tr><td colSpan={8} className="px-5 py-8 text-center text-sm text-gray-400">No data for selected filters.</td></tr>
              )}
            </tbody>
          </table>
          </>
        )}

        {/* ── Mortality Report ── */}
        {reportType === 'Mortality Report' && (
          <>
          <div className="px-5 pt-4">
            <TableCrudToolbar label="Mortality Report CRUD" className="mb-0" />
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#D4CFC4] bg-[#F5F3EE]">
                {['DATE', 'CAGE', 'MORTALITIES', 'CULLED', 'TOTAL LOSS', 'NOTES'].map(h => (
                  <th key={h} className="text-left text-[10px] tracking-wider text-gray-500 px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mortRows.map((r, i) => (
                <tr key={i} className={`border-b border-[#EBE8E0] transition-colors ${r.total > 0 ? 'bg-red-50 hover:bg-red-100/50' : 'hover:bg-[#F5F3EE]'}`}>
                  <td className="px-5 py-3 text-sm text-gray-700 font-mono">{r.date}</td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-1.5 text-sm text-[#002D5E] cursor-pointer hover:underline" title="View cage details">
                      <span className="w-2 h-2 rounded-full" style={{ background: CAGE_COLORS[r.cage] ?? '#999' }} />
                      {r.cage}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm font-mono text-gray-800">{r.mortalities}</td>
                  <td className="px-5 py-3 text-sm font-mono text-gray-800">{r.culled}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${r.total > 0 ? 'bg-[#F8D7DA] text-[#721C24]' : 'bg-[#D5E8D4] text-[#2D6A4F]'}`}>
                      {r.total}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-600">{r.notes}</td>
                </tr>
              ))}
              {mortRows.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-gray-400">No data for selected filters.</td></tr>
              )}
            </tbody>
          </table>
          </>
        )}

        {/* ── Weekly Farm Summary ── */}
        {reportType === 'Weekly Farm Summary' && (
          <>
          <div className="px-5 pt-4">
            <TableCrudToolbar label="Weekly Summary CRUD" className="mb-0" />
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#D4CFC4] bg-[#F5F3EE]">
                {['WEEK OF', 'CAGE', 'TOTAL EGGS', 'AVG HDEP', 'TOTAL FEED (KG)', 'AVG TEMP', 'AVG HUMIDITY'].map(h => (
                  <th key={h} className="text-left text-[10px] tracking-wider text-gray-500 px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weeklyRows.map((r, i) => {
                const zeroWeek = r.totalEggs === 0;
                return (
                  <tr key={i} className={`border-b border-[#EBE8E0] transition-colors ${zeroWeek ? 'bg-amber-50 hover:bg-amber-100/60' : 'hover:bg-[#F5F3EE]'}`}>
                    <td className="px-5 py-3 text-sm text-gray-700 font-mono">{r.weekOf}</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1.5 text-sm text-[#002D5E] cursor-pointer hover:underline" title="View cage details">
                        <span className="w-2 h-2 rounded-full" style={{ background: CAGE_COLORS[r.cage] ?? '#999' }} />
                        {r.cage}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono text-gray-800">{r.totalEggs.toLocaleString()}</span>
                        {zeroWeek && <NoLogBadge />}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm font-mono text-gray-800">{r.avgHdep}</td>
                    <td className="px-5 py-3 text-sm font-mono text-gray-800">{r.totalFeedKg} kg</td>
                    <td className="px-5 py-3 text-sm text-gray-700">{r.avgTemp > 0 ? `${r.avgTemp}°C` : '—'}</td>
                    <td className="px-5 py-3 text-sm text-gray-700">{r.avgHumidity}</td>
                  </tr>
                );
              })}
              {weeklyRows.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-sm text-gray-400">No data for selected filters.</td></tr>
              )}
            </tbody>
          </table>
          </>
        )}
      </div>

      {/* Zero-log legend */}
      {(reportType === 'Production Report' || reportType === 'Weekly Farm Summary') && (
        <div className="mt-3 flex items-center gap-2 text-[10px] text-gray-400">
          <AlertTriangle size={10} className="text-amber-500" />
          <span>
            Rows highlighted in amber contain zero egg production. These may indicate a pre-lay cage or a missed log entry — verify with the cage attendant before finalising this report.
          </span>
        </div>
      )}
    </main>
  );
}