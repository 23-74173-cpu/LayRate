import { useState } from 'react';
import { Plus, ChevronDown, ChevronRight, X, Info, Radio } from 'lucide-react';
import { CAGE_COLORS } from '../constants/cageColors';
import { TableCrudToolbar } from '../components/TableCrudToolbar';

interface Cage {
  id: string;
  code: string;
  location: string;
  breed: string;
  hens: number;
  flockAge: string;
  flockWeeks: number;
  peakStart: number;
  peakEnd: number;
  hdep: number;
  status: 'active' | 'inactive' | 'archived';
  color: string;
  sensorSlots: string[];
  lastLogged: string;
  alerts: string[];
}

const initialCages: Cage[] = [
  {
    id: '1', code: 'CAGE-A', location: 'North Wing', breed: 'ISA Brown', hens: 120,
    flockAge: '28 weeks', flockWeeks: 28, peakStart: 25, peakEnd: 32,
    hdep: 85.8, status: 'active', color: CAGE_COLORS['CAGE-A'],
    sensorSlots: ['A1','A2','A3','A4','A5','B1','B2','B3','B4','B5','C1','C2','C3','C4','C5'],
    lastLogged: '2026-04-12', alerts: [],
  },
  {
    id: '2', code: 'CAGE-B', location: 'East Wing', breed: 'Lohmann Brown-Classic', hens: 120,
    flockAge: '34 weeks', flockWeeks: 34, peakStart: 26, peakEnd: 34,
    hdep: 72.5, status: 'active', color: CAGE_COLORS['CAGE-B'],
    sensorSlots: ['A1','A2','A3','A4','A5','A6','B1','B2','B3','B4','B5','B6','C1','C2','C3','C4','C5','C6'],
    lastLogged: '2026-04-12', alerts: [],
  },
  {
    id: '3', code: 'CAGE-C', location: 'South Wing', breed: 'Dekalb White', hens: 120,
    flockAge: '52 weeks', flockWeeks: 52, peakStart: 24, peakEnd: 35,
    hdep: 58.3, status: 'active', color: CAGE_COLORS['CAGE-C'],
    sensorSlots: [],
    lastLogged: '2026-04-11', alerts: ['HDEP below 60%', 'No sensor coverage', 'Environment alert: humidity high'],
  },
  {
    id: '4', code: 'CAGE-D', location: 'West Wing', breed: 'ISA Brown', hens: 120,
    flockAge: '18 weeks', flockWeeks: 18, peakStart: 25, peakEnd: 32,
    hdep: 0, status: 'inactive', color: CAGE_COLORS['CAGE-D'],
    sensorSlots: [],
    lastLogged: '2026-04-10', alerts: ['Pre-lay — no production yet'],
  },
];

const slotRows = ['A', 'B', 'C'];
const slotCols = Array.from({ length: 10 }, (_, i) => i + 1);

const occupiedSlots: Record<string, string[]> = {
  'CAGE-A': ['A1','A2','A3','A4','A5','A6','A7','A8','B1','B2','B3','B4','B5','B6','B7','B8','B9','C1','C2','C3','C4','C5','C6','C7','C8','C9'],
  'CAGE-B': ['A1','A2','A3','A4','A5','A6','A7','B1','B2','B3','B4','B5','B6','B7','B8','C1','C2','C3','C4','C5','C6','C7'],
  'CAGE-C': ['A1','A2','A3','A4','A5','A6','B1','B2','B3','B4','B5','B6','C1','C2','C3','C4','C5','C6'],
  'CAGE-D': [],
};

function getFlockAgeTag(cage: Cage): { label: string; bg: string; text: string } | null {
  const { flockWeeks, peakStart, peakEnd } = cage;
  if (flockWeeks < peakStart) {
    const weeksUntil = peakStart - flockWeeks;
    return { label: `${weeksUntil}w to peak`, bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700' };
  }
  if (flockWeeks >= peakStart && flockWeeks <= peakEnd) {
    return { label: 'At peak', bg: 'bg-green-50 border-green-200', text: 'text-green-700' };
  }
  const weeksPast = flockWeeks - peakEnd;
  return { label: `${weeksPast}w past peak`, bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700' };
}

function getRowColor(cage: Cage): string {
  if (cage.alerts.length > 0) return 'border-l-[#9B2226]';
  return 'border-l-transparent';
}

// Color legend items
const colorLegend = [
  { color: '#D5E8D4', text: '#004F9F', label: 'HDEP > 70%' },
  { color: '#FFF3CD', text: '#856404', label: 'HDEP 40–70%' },
  { color: '#F8D7DA', text: '#721C24', label: 'HDEP < 40% / Alert' },
  { color: '#F3F3F3', text: '#888', label: 'No data' },
];

export function CageManagement() {
  const [cages, setCages] = useState<Cage[]>(initialCages);
  const [selectedCage, setSelectedCage] = useState<string | null>(null);
  const [editSensors, setEditSensors] = useState(false);
  const [localSensorSlots, setLocalSensorSlots] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLegend, setShowLegend] = useState(false);

  const selected = cages.find(c => c.code === selectedCage);

  const handleSelectCage = (code: string) => {
    if (selectedCage === code) {
      setSelectedCage(null);
      setEditSensors(false);
    } else {
      setSelectedCage(code);
      setEditSensors(false);
      const c = cages.find(c => c.code === code);
      if (c) setLocalSensorSlots([...c.sensorSlots]);
    }
  };

  const toggleSensorSlot = (slotId: string) => {
    setLocalSensorSlots(prev =>
      prev.includes(slotId) ? prev.filter(s => s !== slotId) : [...prev, slotId]
    );
  };

  const saveSensorConfig = () => {
    setCages(prev => prev.map(c =>
      c.code === selectedCage ? { ...c, sensorSlots: [...localSensorSlots] } : c
    ));
    setEditSensors(false);
  };

  // Add cage form state
  const [newCage, setNewCage] = useState({ code: '', location: '', breed: 'ISA Brown', hens: '120' });

  const handleAddCage = () => {
    if (!newCage.code.trim()) return;
    const colors = [CAGE_COLORS['CAGE-A'], CAGE_COLORS['CAGE-B'], CAGE_COLORS['CAGE-C'], CAGE_COLORS['CAGE-D'], '#6B4C8A', '#C2703E'];
    const cage: Cage = {
      id: String(cages.length + 1),
      code: newCage.code,
      location: newCage.location,
      breed: newCage.breed,
      hens: parseInt(newCage.hens) || 0,
      flockAge: '0 weeks',
      flockWeeks: 0,
      peakStart: 25,
      peakEnd: 32,
      hdep: 0,
      status: 'inactive',
      color: colors[cages.length % colors.length],
      sensorSlots: [],
      lastLogged: '',
      alerts: ['New cage — no data yet'],
    };
    setCages([...cages, cage]);
    occupiedSlots[cage.code] = [];
    setNewCage({ code: '', location: '', breed: 'ISA Brown', hens: '120' });
    setShowAddModal(false);
  };

  const activeCages = cages.filter(c => c.status !== 'archived');
  const archivedCages = cages.filter(c => c.status === 'archived');

  return (
    <>
      <main className="flex-1 p-5 overflow-auto">
        {/* Page Title */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <h1 className="text-xl">Cage Management</h1>
            {/* Color legend toggle */}
            <div className="relative">
              <button
                onClick={() => setShowLegend(!showLegend)}
                className="flex items-center gap-1 text-[11px] text-[#6B7280] hover:text-[#333333] transition-colors"
              >
                <Info className="w-3.5 h-3.5" />
                Color legend
              </button>
              {showLegend && (
                <div className="absolute top-full left-0 mt-1 z-20 bg-[rgba(255,255,255,0.90)] border border-[#D9D9D9] rounded-lg shadow-lg p-3 w-56">
                  <div className="text-[10px] tracking-wider text-[#6B7280] mb-2">STATUS COLORS</div>
                  {colorLegend.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 py-1">
                      <span className="w-4 h-3 rounded" style={{ backgroundColor: item.color, border: '1px solid #D9D9D9' }} />
                      <span className="text-xs text-[#6B7280]">{item.label}</span>
                    </div>
                  ))}
                  <div className="mt-2 pt-2 border-t border-[#D9D9D9]">
                    <div className="flex items-center gap-2 py-1">
                      <span className="w-1 h-4 rounded-full bg-[#9B2226]" />
                      <span className="text-xs text-[#6B7280]">Red border = has active alerts</span>
                    </div>
                    <div className="flex items-center gap-2 py-1">
                      <span className="w-2 h-2 rounded-full bg-teal-500" />
                      <span className="text-xs text-[#6B7280]">Teal dot = IR sensor on slot</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-[#002D5E] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#001F42]"
          >
            <Plus className="w-4 h-4" />
            Add Cage
          </button>
        </div>

        <TableCrudToolbar label="Cages Table CRUD" />

        {/* Table */}
        <div className="bg-white rounded-lg border border-[#D9D9D9] overflow-hidden mb-4">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#D9D9D9]">
                <th className="w-8 px-2 py-3" />
                <th className="text-left text-xs text-[#6B7280] px-5 py-3">Cage Code</th>
                <th className="text-left text-xs text-[#6B7280] px-5 py-3">Location</th>
                <th className="text-left text-xs text-[#6B7280] px-5 py-3">Breed</th>
                <th className="text-left text-xs text-[#6B7280] px-5 py-3">Hens</th>
                <th className="text-left text-xs text-[#6B7280] px-5 py-3">Flock Age</th>
                <th className="text-left text-xs text-[#6B7280] px-5 py-3">HDEP</th>
                <th className="text-left text-xs text-[#6B7280] px-5 py-3">Sensors</th>
                <th className="text-left text-xs text-[#6B7280] px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {activeCages.map((cage) => {
                const isSelected = selectedCage === cage.code;
                const peakTag = getFlockAgeTag(cage);
                const hasAlerts = cage.alerts.length > 0;
                return (
                  <tr
                    key={cage.id}
                    onClick={() => handleSelectCage(cage.code)}
                    className={`border-b border-[#D9D9D9] cursor-pointer transition-all group border-l-[3px] ${getRowColor(cage)} ${
                      isSelected ? 'bg-[#F5F6F8]' : 'hover:bg-[#F5F6F8]'
                    }`}
                  >
                    {/* Expand chevron */}
                    <td className="px-2 py-3.5 text-[#6B7280] group-hover:text-[#333333] transition-colors">
                      {isSelected
                        ? <ChevronDown className="w-4 h-4" />
                        : <ChevronRight className="w-4 h-4" />}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm cursor-pointer hover:underline" style={{ color: cage.color }} title="View cage details">{cage.code}</span>
                        {hasAlerts && (
                          <span className="relative group/tip">
                            <span className="flex w-2 h-2 rounded-full bg-[#9B2226]">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#9B2226] opacity-40" />
                            </span>
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tip:block z-30 bg-[rgba(255,255,255,0.90)] border border-[#D9D9D9] text-[#333333] text-[10px] rounded-lg px-3 py-2 w-48 shadow-lg">
                              {cage.alerts.map((a, i) => (
                                <div key={i} className="py-0.5">• {a}</div>
                              ))}
                            </span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-[#333333]">{cage.location}</td>
                    <td className="px-5 py-3.5 text-sm text-[#333333]">{cage.breed}</td>
                    <td className="px-5 py-3.5 text-sm text-[#333333]">{cage.hens}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-[#333333]">{cage.flockAge}</span>
                        {peakTag && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${peakTag.bg} ${peakTag.text}`}>
                            {peakTag.label}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="text-xs px-2.5 py-1 rounded-full"
                        style={{
                          backgroundColor: cage.hdep > 70 ? '#D5E8D4' : cage.hdep > 40 ? '#FFF3CD' : cage.hdep > 0 ? '#F8D7DA' : '#F3F3F3',
                          color: cage.hdep > 70 ? '#004F9F' : cage.hdep > 40 ? '#856404' : cage.hdep > 0 ? '#721C24' : '#888',
                        }}
                      >
                        {cage.hdep}%
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        {cage.sensorSlots.length > 0 ? (
                          <>
                            <Radio className="w-3 h-3 text-teal-600" />
                            <span className="text-xs text-[#333333]">{cage.sensorSlots.length} / 30</span>
                          </>
                        ) : (
                          <span className="text-xs text-[#6B7280]">None</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2.5 py-1 rounded-full ${
                        cage.status === 'active'
                          ? 'bg-[#D5E8D4] text-[#2D6A4F]'
                          : 'bg-gray-200 text-gray-500'
                      }`}>
                        {cage.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Archived cages */}
        {archivedCages.length > 0 && (
          <div className="bg-white rounded-lg border border-[#D9D9D9] p-4 mb-4">
            <h3 className="text-xs text-[#6B7280] mb-2">Archived Cages</h3>
            <div className="flex flex-wrap gap-3">
              {archivedCages.map(c => (
                <div key={c.id} className="flex items-center gap-2 bg-white border border-[#D9D9D9] rounded-lg px-3 py-2 text-xs text-[#6B7280]">
                  <span style={{ color: c.color }}>{c.code}</span>
                  <span>·</span>
                  <span>{c.breed}</span>
                  <button
                    onClick={() => setCages(prev => prev.map(cage => cage.code === c.code ? { ...cage, status: 'active' as const } : cage))}
                    className="text-[#002D5E] hover:underline ml-1"
                  >
                    Restore
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selected Cage Layout */}
        {selected && (
          <div className="bg-white rounded-lg border border-[#D9D9D9] p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-base" style={{ color: selected.color }}>{selected.code}</span>
                <span className="text-sm text-[#6B7280]">{selected.breed}</span>
                <span className="text-xs text-[#6B7280]">·</span>
                <span className="text-xs text-[#6B7280]">{selected.location}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: selected.color }} />
                    <span className="text-[11px] text-[#6B7280]">Occupied</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-[#F5F6F8] border border-[#D9D9D9]" />
                    <span className="text-[11px] text-[#6B7280]">Empty</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-teal-500" />
                    <span className="text-[11px] text-[#6B7280]">Sensor</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (editSensors) {
                      saveSensorConfig();
                    } else {
                      setEditSensors(true);
                      setLocalSensorSlots([...selected.sensorSlots]);
                    }
                  }}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                    editSensors
                        ? 'bg-[#002D5E] text-white hover:bg-[#001F42]'
                        : 'border border-[#D9D9D9] text-[#6B7280] hover:bg-[#F5F6F8]'
                  }`}
                >
                  {editSensors ? 'Save Sensors' : 'Edit Sensors'}
                </button>
                {editSensors && (
                  <button
                    onClick={() => { setEditSensors(false); setLocalSensorSlots([...selected.sensorSlots]); }}
                    className="text-xs text-[#6B7280] hover:text-[#333333]"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            {editSensors && (
              <div className="bg-teal-50 border border-teal-200 rounded-lg px-3 py-2 mb-3 text-[11px] text-teal-700">
                Click any slot to toggle its IR sensor. Teal dots indicate sensor-equipped slots.
              </div>
            )}

            <div className="space-y-1.5">
              {slotRows.map((row) => (
                <div key={row} className="flex items-center gap-1.5">
                  <div className="w-7 text-xs text-[#6B7280] shrink-0 text-center">{row}</div>
                  {slotCols.map((col) => {
                    const slotId = `${row}${col}`;
                    const occupied = (occupiedSlots[selected.code] || []).includes(slotId);
                    const hasSensor = editSensors
                      ? localSensorSlots.includes(slotId)
                      : selected.sensorSlots.includes(slotId);
                    return (
                      <div
                        key={col}
                        onClick={(e) => {
                          if (editSensors) {
                            e.stopPropagation();
                            toggleSensorSlot(slotId);
                          }
                        }}
                        className={`flex-1 text-center text-[11px] py-2 rounded transition-colors relative ${
                          editSensors ? 'cursor-pointer ring-1 ring-teal-200 hover:ring-teal-400' : 'cursor-pointer'
                        }`}
                        style={{
                          backgroundColor: occupied ? selected.color : '#F5F6F8',
                          color: occupied ? '#fff' : '#888',
                        }}
                      >
                        {slotId}
                        {hasSensor && (
                          <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-teal-400 border border-teal-600" />
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-[#D9D9D9] flex items-center gap-6 text-xs text-[#6B7280]">
              <span>Occupied: <span className="text-[#333333]">{(occupiedSlots[selected.code] || []).length} / 30</span></span>
              <span>Sensors: <span className="text-[#333333]">{editSensors ? localSensorSlots.length : selected.sensorSlots.length} / 30</span></span>
              <span>Capacity: <span className="text-[#333333]">{selected.hens} hens</span></span>
              <span>HDEP: <span className="text-[#333333]">{selected.hdep}%</span></span>
              <span>Status: <span className={selected.status === 'active' ? 'text-[#004F9F]' : 'text-[#6B7280]'}>{selected.status}</span></span>
            </div>
          </div>
        )}
      </main>

      {/* Add Cage Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-[rgba(255,255,255,0.90)] rounded-xl border border-[#D9D9D9] shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base">Add New Cage</h2>
              <button onClick={() => setShowAddModal(false)} className="text-[#6B7280] hover:text-[#333333]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <label className="block text-sm text-[#333333] mb-1.5">Cage Code</label>
            <input
              value={newCage.code}
              onChange={e => setNewCage({ ...newCage, code: e.target.value })}
              placeholder="e.g. CAGE-E"
              className="w-full border border-[#D9D9D9] rounded-lg px-4 py-2.5 text-sm bg-white mb-4 focus:outline-none focus:border-[#002D5E]"
            />

            <label className="block text-sm text-[#333333] mb-1.5">Location</label>
            <input
              value={newCage.location}
              onChange={e => setNewCage({ ...newCage, location: e.target.value })}
              placeholder="e.g. North Wing"
              className="w-full border border-[#D9D9D9] rounded-lg px-4 py-2.5 text-sm bg-white mb-4 focus:outline-none focus:border-[#002D5E]"
            />

            <label className="block text-sm text-[#333333] mb-1.5">Breed</label>
            <select
              value={newCage.breed}
              onChange={e => setNewCage({ ...newCage, breed: e.target.value })}
              className="w-full border border-[#D9D9D9] rounded-lg px-4 py-2.5 text-sm bg-white mb-4 focus:outline-none focus:border-[#002D5E] appearance-none cursor-pointer"
            >
              <option>ISA Brown</option>
              <option>Lohmann Brown-Classic</option>
              <option>Dekalb White</option>
              <option>Hy-Line Brown</option>
              <option>Novogen Brown</option>
            </select>

            <label className="block text-sm text-[#333333] mb-1.5">Capacity (hens)</label>
            <input
              type="number"
              value={newCage.hens}
              onChange={e => setNewCage({ ...newCage, hens: e.target.value })}
              className="w-full border border-[#D9D9D9] rounded-lg px-4 py-2.5 text-sm bg-white mb-5 focus:outline-none focus:border-[#002D5E]"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 border border-[#D9D9D9] text-[#6B7280] py-2.5 rounded-lg text-sm hover:bg-[#F5F6F8]"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCage}
                className="flex-1 bg-[#002D5E] text-white py-2.5 rounded-lg text-sm hover:bg-[#001F42]"
              >
                Add Cage
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}