import { useState, useCallback, useEffect, useMemo } from 'react';
import { Pencil, CheckCircle, AlertTriangle, Table, FileText } from 'lucide-react';
import { CAGE_COLORS } from '../constants/cageColors';
import { TableCrudToolbar } from '../components/TableCrudToolbar';

interface CageInfo {
  code: string;
  breed: string;
  flockAge: string;
  lastHdep: number;
  hens: number;
  color: string;
  hasSensor: boolean;
  sensorReading: number | null;
}

const cageOptions: CageInfo[] = [
  { code: 'CAGE-A', breed: 'ISA Brown', flockAge: '28 weeks (6 months)', lastHdep: 85.8, hens: 120, color: CAGE_COLORS['CAGE-A'], hasSensor: true, sensorReading: 103 },
  { code: 'CAGE-B', breed: 'Lohmann Brown-Classic', flockAge: '34 weeks (8 months)', lastHdep: 72.5, hens: 120, color: CAGE_COLORS['CAGE-B'], hasSensor: true, sensorReading: 87 },
  { code: 'CAGE-C', breed: 'Dekalb White', flockAge: '52 weeks (12 months)', lastHdep: 58.3, hens: 120, color: CAGE_COLORS['CAGE-C'], hasSensor: false, sensorReading: null },
  { code: 'CAGE-D', breed: 'ISA Brown', flockAge: '18 weeks (4 months)', lastHdep: 0, hens: 120, color: CAGE_COLORS['CAGE-D'], hasSensor: false, sensorReading: null },
];

interface LogEntry {
  date: string;
  cage: string;
  eggs: number;
  hens: number;
  hdep: string;
  loggedBy: string;
  notes: string;
  source: 'sensor' | 'manual' | 'sensor (edited)';
}

const initialLogs: LogEntry[] = [
  { date: '2026-04-11', cage: 'CAGE-A', eggs: 103, hens: 120, hdep: '85.8%', loggedBy: 'Farm Operator', notes: 'IR sensor synced', source: 'sensor' },
  { date: '2026-04-10', cage: 'CAGE-B', eggs: 87, hens: 120, hdep: '72.5%', loggedBy: 'Farm Operator', notes: 'IR sensor synced', source: 'sensor' },
  { date: '2026-04-09', cage: 'CAGE-C', eggs: 70, hens: 120, hdep: '58.3%', loggedBy: 'Farm Operator', notes: 'Manual check', source: 'manual' },
  { date: '2026-04-08', cage: 'CAGE-D', eggs: 0, hens: 120, hdep: '0.0%', loggedBy: 'Farm Operator', notes: 'Manual check', source: 'manual' },
  { date: '2026-04-07', cage: 'CAGE-A', eggs: 103, hens: 120, hdep: '85.8%', loggedBy: 'Farm Operator', notes: 'IR sensor synced', source: 'sensor' },
  { date: '2026-04-06', cage: 'CAGE-B', eggs: 87, hens: 120, hdep: '72.5%', loggedBy: 'Farm Operator', notes: 'IR sensor synced', source: 'sensor' },
  { date: '2026-04-05', cage: 'CAGE-C', eggs: 70, hens: 120, hdep: '58.3%', loggedBy: 'Farm Operator', notes: 'Manual check', source: 'manual' },
  { date: '2026-04-04', cage: 'CAGE-D', eggs: 0, hens: 120, hdep: '0.0%', loggedBy: 'Farm Operator', notes: 'Manual check', source: 'manual' },
];

type ViewMode = 'single' | 'batch';

interface BatchRow {
  cage: string;
  eggCount: string;
  henCount: string;
  notes: string;
  sensorOverridden: boolean;
  eggFieldEditable: boolean;
}

function computeHdep(eggs: string, hens: string) {
  const e = parseInt(eggs) || 0;
  const h = parseInt(hens) || 1;
  return ((e / h) * 100).toFixed(1);
}

function hdepWarning(eggs: string, hens: string): string | null {
  const e = parseInt(eggs) || 0;
  const h = parseInt(hens) || 0;
  if (h > 0 && e > h) {
    return `Egg count (${e}) exceeds hen count (${h}) — HDEP is ${computeHdep(eggs, hens)}%. This is likely a typo.`;
  }
  return null;
}

export function EggLogging() {
  const [logs, setLogs] = useState<LogEntry[]>(initialLogs);
  const [viewMode, setViewMode] = useState<ViewMode>('single');

  // Success banner
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const showSuccess = useCallback((msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  }, []);

  // ── Single-cage form state ──
  const [date, setDate] = useState('2026-04-12');
  const [selectedCage, setSelectedCage] = useState('CAGE-A');
  const [eggCount, setEggCount] = useState('103');
  const [henCount, setHenCount] = useState('120');
  const [loggedBy, setLoggedBy] = useState('Farm Operator');
  const [notes, setNotes] = useState('');
  const [sensorOverridden, setSensorOverridden] = useState(false);
  const [eggFieldEditable, setEggFieldEditable] = useState(false);

  const cage = cageOptions.find(c => c.code === selectedCage)!;
  const isAutoMode = cage.hasSensor;

  useEffect(() => {
    const c = cageOptions.find(c => c.code === selectedCage)!;
    setHenCount(String(c.hens));
    setSensorOverridden(false);
    setEggFieldEditable(false);
    if (c.hasSensor && c.sensorReading !== null) {
      setEggCount(String(c.sensorReading));
    } else {
      setEggCount('');
    }
  }, [selectedCage]);

  const computedHdep = useMemo(() => computeHdep(eggCount, henCount), [eggCount, henCount]);
  const singleWarning = hdepWarning(eggCount, henCount);

  const resetSingleForm = (nextCage?: string) => {
    const currentIdx = cageOptions.findIndex(c => c.code === selectedCage);
    const next = nextCage || cageOptions[(currentIdx + 1) % cageOptions.length].code;
    setSelectedCage(next);
    setNotes('');
    setSensorOverridden(false);
    setEggFieldEditable(false);
  };

  const handleSingleSave = () => {
    let source: LogEntry['source'] = 'manual';
    if (isAutoMode) {
      source = sensorOverridden ? 'sensor (edited)' : 'sensor';
    }
    const newLog: LogEntry = {
      date,
      cage: selectedCage,
      eggs: parseInt(eggCount) || 0,
      hens: parseInt(henCount) || 0,
      hdep: `${computedHdep}%`,
      loggedBy,
      notes: notes || (isAutoMode ? 'IR sensor synced' : 'Manual check'),
      source,
    };
    setLogs(prev => [newLog, ...prev]);
    showSuccess(`Saved ${selectedCage} — ${newLog.eggs} eggs, HDEP ${computedHdep}%`);
    resetSingleForm();
  };

  const handleEggCountChange = (val: string) => {
    setEggCount(val);
    if (isAutoMode && cage.sensorReading !== null && val !== String(cage.sensorReading)) {
      setSensorOverridden(true);
    } else {
      setSensorOverridden(false);
    }
  };

  // ── Batch form state ──
  const [batchDate, setBatchDate] = useState('2026-04-12');
  const [batchLoggedBy, setBatchLoggedBy] = useState('Farm Operator');
  const [batchRows, setBatchRows] = useState<BatchRow[]>(() =>
    cageOptions.map(c => ({
      cage: c.code,
      eggCount: c.hasSensor && c.sensorReading !== null ? String(c.sensorReading) : '',
      henCount: String(c.hens),
      notes: '',
      sensorOverridden: false,
      eggFieldEditable: false,
    }))
  );

  const updateBatchRow = (idx: number, updates: Partial<BatchRow>) => {
    setBatchRows(prev => prev.map((r, i) => i === idx ? { ...r, ...updates } : r));
  };

  const handleBatchSave = () => {
    const newLogs: LogEntry[] = batchRows.map(row => {
      const c = cageOptions.find(c => c.code === row.cage)!;
      let source: LogEntry['source'] = 'manual';
      if (c.hasSensor) {
        source = row.sensorOverridden ? 'sensor (edited)' : 'sensor';
      }
      return {
        date: batchDate,
        cage: row.cage,
        eggs: parseInt(row.eggCount) || 0,
        hens: parseInt(row.henCount) || 0,
        hdep: `${computeHdep(row.eggCount, row.henCount)}%`,
        loggedBy: batchLoggedBy,
        notes: row.notes || (c.hasSensor ? 'IR sensor synced' : 'Manual check'),
        source,
      };
    });
    setLogs(prev => [...newLogs, ...prev]);
    showSuccess(`Batch saved — ${newLogs.length} cages logged for ${batchDate}`);
    // Reset batch rows
    setBatchRows(cageOptions.map(c => ({
      cage: c.code,
      eggCount: c.hasSensor && c.sensorReading !== null ? String(c.sensorReading) : '',
      henCount: String(c.hens),
      notes: '',
      sensorOverridden: false,
      eggFieldEditable: false,
    })));
  };

  const batchHasWarnings = batchRows.some(r => hdepWarning(r.eggCount, r.henCount) !== null);

  return (
    <>
      <main className="flex-1 p-5 overflow-auto">
        {/* Success Banner */}
        {successMsg && (
          <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm animate-[fadeIn_0.2s_ease-out]">
            <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
            {successMsg}
          </div>
        )}

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 mb-5">
          <button
            onClick={() => setViewMode('single')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${
              viewMode === 'single'
                ? 'bg-[#002D5E] text-white'
                : 'bg-[#F5F6F8] text-[#6B7280] hover:bg-[#EAF0F8] border border-[#D9D9D9]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Single Cage
          </button>
          <button
            onClick={() => setViewMode('batch')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${
              viewMode === 'batch'
                ? 'bg-[#002D5E] text-white'
                : 'bg-[#F5F6F8] text-[#6B7280] hover:bg-[#EAF0F8] border border-[#D9D9D9]'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            Log All Cages
          </button>
        </div>

        {/* ── Single Cage Form ── */}
        {viewMode === 'single' && (
          <div className="bg-white rounded-lg border border-[#D9D9D9] p-6 mb-5">
            <h2 className="text-base mb-5">Log Entry Form</h2>

            {/* Date */}
            <label className="block text-sm text-[#333333] mb-1.5">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-[#D9D9D9] rounded-lg px-4 py-2.5 text-sm bg-white mb-4 focus:outline-none focus:border-[#002D5E]"
            />

            {/* Cage */}
            <label className="block text-sm text-[#333333] mb-1.5">Cage</label>
            <select
              value={selectedCage}
              onChange={(e) => setSelectedCage(e.target.value)}
              className="w-full border border-[#D9D9D9] rounded-lg px-4 py-2.5 text-sm bg-white mb-2 focus:outline-none focus:border-[#002D5E] appearance-none cursor-pointer"
            >
              {cageOptions.map(c => (
                <option key={c.code} value={c.code}>{c.code} — {c.breed}</option>
              ))}
            </select>

            {/* Cage info row with mode badge */}
            <div className="flex items-center gap-4 text-xs text-[#6B7280] mb-5">
              <span>Flock age: <span className="text-[#333333]">{cage.flockAge}</span></span>
              <span>Last HDEP: <span style={{ color: cage.color }}>{cage.lastHdep}%</span></span>
              <span>Hens: <span className="text-[#333333]">{cage.hens}</span></span>
              {isAutoMode ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                  Sensor active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px]">
                  Manual entry
                </span>
              )}
            </div>

            {/* Egg Count */}
            {isAutoMode ? (
              <div className="mb-4">
                <label className="block text-sm text-[#333333] mb-1.5">
                  Egg Count (IR sensor)
                  {sensorOverridden && (
                    <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-700 text-[10px]">
                      Edited
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={eggCount}
                    onChange={(e) => handleEggCountChange(e.target.value)}
                    readOnly={!eggFieldEditable}
                    className={`w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none ${
                      singleWarning
                        ? 'border-[#9B2226] bg-red-50/30'
                        : eggFieldEditable
                        ? 'border-[#D9D9D9] bg-white focus:border-[#002D5E]'
                        : 'border-[#D9D9D9] bg-[#F5F6F8] text-[#6B7280] cursor-default'
                    }`}
                  />
                  {!eggFieldEditable && (
                    <button
                      onClick={() => setEggFieldEditable(true)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-[#002D5E] hover:text-[#001F42] px-2 py-1 rounded hover:bg-[#EAF0F8] transition-colors"
                    >
                      <Pencil className="w-3 h-3" />
                      Override
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-[#6B7280] mt-1">
                  {eggFieldEditable
                    ? 'You are overriding the sensor reading — original value: ' + cage.sensorReading
                    : 'Auto-counted via IR sensor — click Override to edit'}
                </p>
              </div>
            ) : (
              <div className="mb-4">
                <label className="block text-sm text-[#333333] mb-1.5">Egg Count (manual entry)</label>
                <input
                  type="number"
                  value={eggCount}
                  onChange={(e) => setEggCount(e.target.value)}
                  placeholder="Enter egg count"
                  className={`w-full border rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none ${
                    singleWarning ? 'border-[#9B2226] bg-red-50/30' : 'border-[#D9D9D9] focus:border-[#002D5E]'
                  }`}
                />
              </div>
            )}

            {/* HDEP > 100% warning */}
            {singleWarning && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-[#9B2226] px-3 py-2.5 rounded-lg text-xs mb-4">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{singleWarning}</span>
              </div>
            )}

            {/* Hen Count */}
            <label className="block text-sm text-[#333333] mb-1.5">Hen Count</label>
            <input
              type="number"
              value={henCount}
              onChange={(e) => setHenCount(e.target.value)}
              className="w-full border border-[#D9D9D9] rounded-lg px-4 py-2.5 text-sm bg-white mb-3 focus:outline-none focus:border-[#002D5E]"
            />

            {/* Computed HDEP */}
            <div className={`inline-block border rounded-lg px-4 py-2 text-sm mb-5 font-mono ${
              singleWarning
                ? 'bg-red-50 border-red-200 text-[#9B2226]'
                : 'bg-[#F5F6F8] border-[#D9D9D9] text-[#333333]'
            }`}>
              HDEP: &nbsp;{computedHdep}%
              {singleWarning && <span className="ml-2 text-[10px]">(exceeds 100%)</span>}
            </div>

            {/* Logged By */}
            <label className="block text-sm text-[#333333] mb-1.5">Logged By</label>
            <input
              type="text"
              value={loggedBy}
              onChange={(e) => setLoggedBy(e.target.value)}
              className="w-full border border-[#D9D9D9] rounded-lg px-4 py-2.5 text-sm bg-white mb-4 focus:outline-none focus:border-[#002D5E]"
            />

            {/* Notes */}
            <label className="block text-sm text-[#333333] mb-1">
              Notes <span className="text-[#6B7280] text-xs">(optional — record anomalies, sick hens, broken eggs, etc.)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="e.g. 2 broken eggs found, 1 hen showing signs of illness in slot B3"
              className="w-full border border-[#D9D9D9] rounded-lg px-4 py-2.5 text-sm bg-white mb-5 focus:outline-none focus:border-[#002D5E] resize-y"
            />

            <button
              onClick={handleSingleSave}
              className="bg-[#002D5E] text-white px-6 py-2.5 rounded-lg text-sm hover:bg-[#001F42]"
            >
              Save Record
            </button>
          </div>
        )}

        {/* ── Batch Logging ── */}
        {viewMode === 'batch' && (
          <div className="bg-white rounded-lg border border-[#D9D9D9] p-6 mb-5">
            <TableCrudToolbar label="Batch Logs CRUD" />

            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base">Log All Cages</h2>
                <p className="text-xs text-[#6B7280] mt-0.5">Enter egg counts for all cages at once. Sensor cages are pre-filled.</p>
              </div>
            </div>

            {/* Shared date + logged by row */}
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-sm text-[#333333] mb-1.5">Date</label>
                <input
                  type="date"
                  value={batchDate}
                  onChange={(e) => setBatchDate(e.target.value)}
                  className="w-full border border-[#D9D9D9] rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-[#002D5E]"
                />
              </div>
              <div>
                <label className="block text-sm text-[#333333] mb-1.5">Logged By</label>
                <input
                  type="text"
                  value={batchLoggedBy}
                  onChange={(e) => setBatchLoggedBy(e.target.value)}
                  className="w-full border border-[#D9D9D9] rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-[#002D5E]"
                />
              </div>
            </div>

            {/* Batch table */}
            <div className="border border-[#D9D9D9] rounded-lg overflow-hidden mb-5">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#D9D9D9] bg-[#F5F6F8]">
                    <th className="text-left text-xs text-[#6B7280] px-4 py-2.5">Cage</th>
                    <th className="text-left text-xs text-[#6B7280] px-4 py-2.5">Mode</th>
                    <th className="text-left text-xs text-[#6B7280] px-4 py-2.5">Egg Count</th>
                    <th className="text-left text-xs text-[#6B7280] px-4 py-2.5">Hen Count</th>
                    <th className="text-left text-xs text-[#6B7280] px-4 py-2.5">HDEP</th>
                    <th className="text-left text-xs text-[#6B7280] px-4 py-2.5">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {batchRows.map((row, idx) => {
                    const c = cageOptions.find(c => c.code === row.cage)!;
                    const rowHdep = computeHdep(row.eggCount, row.henCount);
                    const rowWarning = hdepWarning(row.eggCount, row.henCount);
                    return (
                      <tr key={row.cage} className="border-b border-[#D9D9D9]">
                        <td className="px-4 py-3">
                          <div>
                            <span className="text-sm cursor-pointer hover:underline" style={{ color: c.color }} title="View cage details">{c.code}</span>
                            <div className="text-[10px] text-[#6B7280]">{c.breed}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {c.hasSensor ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-[10px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                              Sensor
                              {row.sensorOverridden && (
                                <span className="text-amber-600 ml-0.5">· edited</span>
                              )}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px]">
                              Manual
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="relative">
                            {c.hasSensor && !row.eggFieldEditable ? (
                              <div className="flex items-center gap-1">
                                <span className="text-sm text-[#6B7280] font-mono bg-[#F5F6F8] border border-[#D9D9D9] rounded px-2.5 py-1.5">{row.eggCount}</span>
                                <button
                                  onClick={() => updateBatchRow(idx, { eggFieldEditable: true })}
                                  className="text-[10px] text-[#002D5E] hover:underline"
                                >
                                  edit
                                </button>
                              </div>
                            ) : (
                              <input
                                type="number"
                                value={row.eggCount}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const overridden = c.hasSensor && c.sensorReading !== null && val !== String(c.sensorReading);
                                  updateBatchRow(idx, { eggCount: val, sensorOverridden: overridden });
                                }}
                                placeholder="0"
                                className={`w-24 border rounded px-2.5 py-1.5 text-sm focus:outline-none ${
                                  rowWarning ? 'border-[#9B2226] bg-red-50/30' : 'border-[#D9D9D9] focus:border-[#002D5E]'
                                }`}
                              />
                            )}
                            {rowWarning && (
                              <div className="flex items-center gap-1 mt-1">
                                <AlertTriangle className="w-3 h-3 text-[#9B2226]" />
                                <span className="text-[10px] text-[#9B2226]">Exceeds hen count</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={row.henCount}
                            onChange={(e) => updateBatchRow(idx, { henCount: e.target.value })}
                            className="w-20 border border-[#D9D9D9] rounded px-2.5 py-1.5 text-sm focus:outline-none focus:border-[#002D5E]"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-mono px-2 py-1 rounded ${
                            rowWarning
                              ? 'bg-red-50 text-[#9B2226] border border-red-200'
                              : parseFloat(rowHdep) > 70
                              ? 'bg-[#D5E8D4] text-[#004F9F]'
                              : parseFloat(rowHdep) > 40
                              ? 'bg-[#FFF3CD] text-[#856404]'
                                : 'bg-[#F3F3F3] text-[#6B7280]'
                          }`}>
                            {rowHdep}%
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={row.notes}
                            onChange={(e) => updateBatchRow(idx, { notes: e.target.value })}
                            placeholder="Optional notes"
                            className="w-full border border-[#D9D9D9] rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#002D5E] min-w-[140px]"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {batchHasWarnings && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-[#9B2226] px-3 py-2.5 rounded-lg text-xs mb-4">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>One or more cages have egg counts exceeding hen counts. Please verify before saving.</span>
              </div>
            )}

            <button
              onClick={handleBatchSave}
              className="bg-[#002D5E] text-white px-6 py-2.5 rounded-lg text-sm hover:bg-[#001F42]"
            >
              Save All Cages
            </button>
          </div>
        )}

        {/* Recent Logs */}
        <div className="bg-white rounded-lg border border-[#D9D9D9] overflow-hidden">
          <div className="px-6 pt-4">
            <TableCrudToolbar label="Recent Logs CRUD" className="mb-2" />
          </div>
          <div className="px-6 py-4">
            <h2 className="text-base">Recent Logs</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-t border-b border-[#D9D9D9]">
                <th className="text-left text-xs text-[#6B7280] px-6 py-3">Date</th>
                <th className="text-left text-xs text-[#6B7280] px-6 py-3">Cage</th>
                <th className="text-left text-xs text-[#6B7280] px-6 py-3">Eggs</th>
                <th className="text-left text-xs text-[#6B7280] px-6 py-3">Hens</th>
                <th className="text-left text-xs text-[#6B7280] px-6 py-3">HDEP</th>
                <th className="text-left text-xs text-[#6B7280] px-6 py-3">Source</th>
                <th className="text-left text-xs text-[#6B7280] px-6 py-3">Logged By</th>
                <th className="text-left text-xs text-[#6B7280] px-6 py-3">Notes</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => (
                <tr key={i} className="border-b border-[#D9D9D9] hover:bg-[#F5F6F8]">
                  <td className="px-6 py-3 text-sm text-[#333333] font-mono">{log.date}</td>
                  <td className="px-6 py-3 text-sm text-[#002D5E] font-mono cursor-pointer hover:underline" title="View cage details">{log.cage}</td>
                  <td className="px-6 py-3 text-sm text-[#333333] font-mono">{log.eggs}</td>
                  <td className="px-6 py-3 text-sm text-[#333333] font-mono">{log.hens}</td>
                  <td className="px-6 py-3 text-sm text-[#333333] font-mono">{log.hdep}</td>
                  <td className="px-6 py-3">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                      log.source === 'sensor'
                        ? 'bg-teal-50 text-teal-700 border border-teal-200'
                        : log.source === 'sensor (edited)'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {log.source}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-[#333333]">{log.loggedBy}</td>
                  <td className="px-6 py-3 text-sm text-[#333333] max-w-[200px] truncate">{log.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}