import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  ClipboardList,
  Cog,
  Download,
  Egg,
  FileText,
  Home,
  Leaf,
  LineChart as LineChartIcon,
  Plus,
  Printer,
  Settings,
  Thermometer,
  Trash2,
  User,
  Wheat,
  Menu,
  X
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

const CAGES = [
  { id: 1, code: "CAGE-A", breed: "ISA Brown", hens: 120, weeks: 28, hdep: 85.8, status: "active", location: "North Wing", rows: 3, slotsPerRow: 10, sensors: ["IR Counter", "DHT22"] },
  { id: 2, code: "CAGE-B", breed: "Lohmann Brown-Classic", hens: 120, weeks: 34, hdep: 72.5, status: "active", location: "East Wing", rows: 3, slotsPerRow: 10, sensors: ["IR Counter", "DHT22"] },
  { id: 3, code: "CAGE-C", breed: "Dekalb White", hens: 120, weeks: 52, hdep: 58.3, status: "active", location: "South Wing", rows: 3, slotsPerRow: 10, sensors: ["IR Counter"] },
  { id: 4, code: "CAGE-D", breed: "ISA Brown", hens: 120, weeks: 18, hdep: 0, status: "inactive", location: "West Wing", rows: 3, slotsPerRow: 10, sensors: [] }
];

const HDEP_TRENDS = {
  "CAGE-A": [82.1, 83.4, 84.0, 85.2, 84.8, 85.1, 85.8],
  "CAGE-B": [74.2, 73.8, 72.5, 73.1, 72.8, 72.9, 72.5],
  "CAGE-C": [63.4, 61.8, 60.2, 59.5, 58.8, 58.5, 58.3],
  "CAGE-D": [0, 0, 0, 0, 0, 0, 0]
};

const ENV_RANGE_OPTIONS = ["24H", "7D", "30D", "90D", "Custom"];
const MOBILE_TAB_KEYS = ["dashboard", "environment", "analytics", "feed", "forecast"];
const ICON_SIZES = { small: 16, medium: 18, nav: 20, large: 24 };

const ENV_SENSOR_BASELINES = {
  "CAGE-A": { temp: 28.2, humidity: 68 },
  "CAGE-B": { temp: 27.9, humidity: 71 },
  "CAGE-C": { temp: 28.6, humidity: 73 },
  "CAGE-D": { temp: 27.5, humidity: 69 }
};

const CAGE_COLORS = {
  "CAGE-A": "#2E7D32",
  "CAGE-B": "#1565C0",
  "CAGE-C": "#EF6C00",
  "CAGE-D": "#6A1B9A"
};

const ENV_SERIES_CONFIG = {
  "24H": { points: 12, stepHours: 2 },
  "7D": { points: 7, stepHours: 24 },
  "30D": { points: 10, stepHours: 72 },
  "90D": { points: 12, stepHours: 180 }
};

function roundTo(value, decimals = 1) {
  return Number(value.toFixed(decimals));
}

function formatDateLabel(date, range) {
  if (range === "24H") {
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  }
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function buildEnvironmentSeries() {
  const anchor = new Date("2026-04-07T12:00:00");
  const cageCodes = Object.keys(ENV_SENSOR_BASELINES);

  return Object.entries(ENV_SERIES_CONFIG).reduce((acc, [range, config]) => {
    const rows = Array.from({ length: config.points }, (_, i) => {
      const date = new Date(anchor.getTime() - (config.points - 1 - i) * config.stepHours * 3600000);
      const row = {
        iso: date.toISOString(),
        label: formatDateLabel(date, range)
      };

      cageCodes.forEach((code, idx) => {
        const base = ENV_SENSOR_BASELINES[code];
        const wave = i * 0.7 + idx * 0.5;
        row[`${code}_temp`] = roundTo(base.temp + Math.sin(wave) * 0.9 + (idx - 1.5) * 0.1);
        row[`${code}_humidity`] = roundTo(base.humidity + Math.cos(wave) * 2.8 + (idx - 1.5) * 0.2);
      });

      row.coopTemp = roundTo(cageCodes.reduce((sum, code) => sum + row[`${code}_temp`], 0) / cageCodes.length);
      row.coopHumidity = roundTo(cageCodes.reduce((sum, code) => sum + row[`${code}_humidity`], 0) / cageCodes.length);
      return row;
    });

    acc[range] = rows;
    return acc;
  }, {});
}

const ENV_SERIES = buildEnvironmentSeries();

const FEED_BATCHES_BASE = [
  { code: "F-001", date: "2026-03-01", cp: 17.5, notes: "Layer mash - standard" },
  { code: "F-002", date: "2026-03-15", cp: 16.8, notes: "Layer pellet - supplier B" },
  { code: "F-003", date: "2026-03-28", cp: 18.0, notes: "Protein-boosted mix" }
];

const FORECAST_XGB = [86.1, 86.4, 85.9, 86.2, 85.7, 85.5, 86.0];
const FORECAST_SARIMA = [85.5, 85.8, 85.3, 85.9, 85.2, 84.9, 85.4];

const ALERTS_BASE = [
  { id: 1, type: "env", cage: "CAGE-B", msg: "Humidity exceeded 75% threshold", time: "10 mins ago" },
  { id: 2, type: "prod", cage: "CAGE-C", msg: "HDEP dropped below 60% - cull review recommended", time: "2 hrs ago" }
];

const BREEDS = [
  "ISA Brown",
  "Lohmann Brown-Classic",
  "Dekalb White",
  "Hy-Line Brown",
  "Shaver White",
  "Hisex Brown",
  "Novogen Brown",
  "Bovans Brown",
  "Leghorn",
  "Rhode Island Red"
];

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: Home },
  { key: "cages", label: "Cage Management", icon: Wheat },
  { key: "logging", label: "Egg Logging", icon: Egg },
  { key: "environment", label: "Environment", icon: Thermometer },
  { key: "feed", label: "Feed & Nutrition", icon: Leaf },
  { key: "analytics", label: "Analytics", icon: LineChartIcon },
  { key: "forecast", label: "Forecast", icon: AlertTriangle },
  { key: "reports", label: "Reports", icon: ClipboardList },
  { key: "settings", label: "Settings", icon: Settings }
];

function Sparkline({ data, color }) {
  const width = 120;
  const height = 40;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1 || 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width="100%" height={40} viewBox={`0 0 ${width} ${height}`}>
      <polyline fill="none" stroke={color} strokeWidth="2" points={points} />
    </svg>
  );
}

function Modal({ title, onClose, children, onSave, saveLabel = "Save" }) {
  return (
    <div className="lr-modal-backdrop" role="dialog" aria-modal="true">
      <div className="lr-modal-card">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="m-0">{title}</h5>
          <button className="btn btn-sm btn-light" type="button" onClick={onClose} aria-label="Close">
            <X size={ICON_SIZES.small} />
          </button>
        </div>
        {children}
        <div className="d-flex justify-content-end gap-2 mt-3">
          <button className="btn btn-outline-secondary" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="btn lr-btn-primary" type="button" onClick={onSave}>
            {saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ message, actionLabel, onAction }) {
  return (
    <div className="lr-empty-state">
      <FileText size={ICON_SIZES.large} />
      <p className="m-0">{message}</p>
      {actionLabel && (
        <button className="btn btn-sm lr-btn-primary mt-2" onClick={onAction} type="button">
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function gradeMeta(hdep) {
  if (hdep >= 80) {
    return { label: "Good", cls: "good" };
  }
  if (hdep >= 60) {
    return { label: "Average", cls: "average" };
  }
  return { label: "Low", cls: "low" };
}

function getEnvStatus(temp, humidity, thresholds) {
  const tempOut = temp < thresholds.tempMin || temp > thresholds.tempMax;
  const humOut = humidity < thresholds.humMin || humidity > thresholds.humMax;
  if (tempOut || humOut) {
    return { label: "Alert", cls: "danger" };
  }

  const tempNear = temp <= thresholds.tempMin + 0.5 || temp >= thresholds.tempMax - 0.5;
  const humNear = humidity <= thresholds.humMin + 1 || humidity >= thresholds.humMax - 1;
  if (tempNear || humNear) {
    return { label: "Watch", cls: "warning" };
  }

  return { label: "Normal", cls: "success" };
}

function App() {
  const MOBILE_BREAKPOINT = 960;
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("layrate_sidebar_collapsed") === "true");
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= MOBILE_BREAKPOINT);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [alerts, setAlerts] = useState(ALERTS_BASE);
  const [toasts, setToasts] = useState([]);
  const [cages, setCages] = useState(CAGES);
  const [feedBatches, setFeedBatches] = useState(FEED_BATCHES_BASE);
  const [feedTab, setFeedTab] = useState("batches");
  const [reportType, setReportType] = useState("Production Report");
  const [showReportPreview, setShowReportPreview] = useState(true);
  const [analyticsRange, setAnalyticsRange] = useState("Week");
  const [forecastHorizon, setForecastHorizon] = useState(7);
  const [forecastCage, setForecastCage] = useState("CAGE-A");
  const [showAddCageModal, setShowAddCageModal] = useState(false);
  const [showFeedBatchModal, setShowFeedBatchModal] = useState(false);
  const [activeCageView, setActiveCageView] = useState("cards");
  const [dashboardLayoutOrder, setDashboardLayoutOrder] = useState(() => CAGES.map((c) => c.code));
  const [draggedCageCode, setDraggedCageCode] = useState(null);
  const [eggLogs, setEggLogs] = useState(() => {
    const now = new Date();
    return Array.from({ length: 10 }, (_, i) => {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const cage = CAGES[i % CAGES.length];
      const eggs = Math.round((cage.hdep / 100) * cage.hens);
      return {
        date: date.toISOString().slice(0, 10),
        cage: cage.code,
        eggs,
        hens: cage.hens,
        hdep: ((eggs / cage.hens) * 100).toFixed(1),
        loggedBy: "Farm Operator",
        notes: i % 2 ? "IR sensor synced" : "Manual check"
      };
    });
  });

  const [eggForm, setEggForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    cage: "CAGE-A",
    eggCount: 101,
    henCount: 120,
    loggedBy: "Farm Operator",
    notes: ""
  });

  const [newCageForm, setNewCageForm] = useState({
    code: "",
    location: "",
    capacity: 120,
    breed: BREEDS[0],
    acquired: new Date().toISOString().slice(0, 10),
    weeks: 20
  });

  const [newFeedBatchForm, setNewFeedBatchForm] = useState({
    code: "",
    date: new Date().toISOString().slice(0, 10),
    cp: 17.2,
    notes: ""
  });

  const [envThresholds, setEnvThresholds] = useState({ tempMin: 18, tempMax: 30, humMin: 40, humMax: 70 });
  const [envRange, setEnvRange] = useState("24H");
  const [customRange, setCustomRange] = useState({
    start: "2026-03-20",
    end: "2026-04-07"
  });
  const [settingsThresholds, setSettingsThresholds] = useState({ hdepLow: 60, hdepCritical: 40, tempMin: 18, tempMax: 30, humMin: 40, humMax: 70 });

  const toggleSidebar = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("layrate_sidebar_collapsed", String(next));
      return next;
    });
  };

  const handleNavigate = useCallback((page) => {
    setCurrentPage(page);
    if (isMobile) {
      setMobileSidebarOpen(false);
    }
  }, [isMobile]);

  const handleSidebarToggle = useCallback(() => {
    if (isMobile) {
      setMobileSidebarOpen((prev) => !prev);
      return;
    }
    toggleSidebar();
  }, [isMobile]);

  const pushToast = useCallback((type, message) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const hdepPreview = useMemo(() => {
    const eggs = Number(eggForm.eggCount) || 0;
    const hens = Number(eggForm.henCount) || 1;
    return ((eggs / hens) * 100).toFixed(1);
  }, [eggForm.eggCount, eggForm.henCount]);

  const dashboardStatEggs = useMemo(() => cages.reduce((sum, c) => sum + Math.round((c.hdep / 100) * c.hens), 0), [cages]);
  const dashboardHdep = useMemo(() => {
    const hens = cages.reduce((sum, c) => sum + c.hens, 0);
    const eggs = cages.reduce((sum, c) => sum + Math.round((c.hdep / 100) * c.hens), 0);
    return ((eggs / hens) * 100).toFixed(1);
  }, [cages]);

  const envChartData = useMemo(() => {
    const baseRows = envRange === "Custom" ? ENV_SERIES["90D"] : ENV_SERIES[envRange] || ENV_SERIES["24H"];
    if (envRange !== "Custom") {
      return baseRows;
    }

    const start = new Date(customRange.start);
    const end = new Date(customRange.end);
    const filtered = baseRows.filter((row) => {
      const stamp = new Date(row.iso);
      return stamp >= start && stamp <= end;
    });
    return filtered.length ? filtered : baseRows.slice(-4);
  }, [customRange.end, customRange.start, envRange]);

  const envLatest = useMemo(() => envChartData[envChartData.length - 1] || null, [envChartData]);

  const envPerCageReadings = useMemo(() => {
    if (!envLatest) {
      return [];
    }
    return cages
      .filter((cage) => Object.hasOwn(envLatest, `${cage.code}_temp`))
      .map((cage, idx) => ({
        cage: cage.code,
        sensor: `S-${String(idx + 1).padStart(2, "0")}`,
        temp: envLatest[`${cage.code}_temp`],
        humidity: envLatest[`${cage.code}_humidity`]
      }));
  }, [cages, envLatest]);

  const envSpread = useMemo(() => {
    if (!envPerCageReadings.length) {
      return { temp: 0, humidity: 0 };
    }

    const temps = envPerCageReadings.map((r) => r.temp);
    const humidity = envPerCageReadings.map((r) => r.humidity);
    return {
      temp: roundTo(Math.max(...temps) - Math.min(...temps)),
      humidity: roundTo(Math.max(...humidity) - Math.min(...humidity))
    };
  }, [envPerCageReadings]);

  const envLogs = useMemo(
    () => envChartData.map((row) => ({
      timestamp: row.iso,
      label: row.label,
      coopTemp: row.coopTemp,
      coopHumidity: row.coopHumidity,
      cages: cages
        .filter((cage) => Object.hasOwn(row, `${cage.code}_temp`))
        .map((cage) => ({
          cage: cage.code,
          temp: row[`${cage.code}_temp`],
          humidity: row[`${cage.code}_humidity`]
        }))
    })),
    [cages, envChartData]
  );

  const analyticsTrendData = useMemo(
    () => [0, 1, 2, 3, 4, 5, 6].map((i) => ({ day: `D${i + 1}`, a: HDEP_TRENDS["CAGE-A"][i], b: HDEP_TRENDS["CAGE-B"][i], c: HDEP_TRENDS["CAGE-C"][i], d: HDEP_TRENDS["CAGE-D"][i] })),
    []
  );

  const eggBarData = useMemo(
    () => [0, 1, 2, 3, 4, 5, 6].map((i) => ({ day: `D${i + 1}`, "CAGE-A": Math.round((HDEP_TRENDS["CAGE-A"][i] / 100) * 120), "CAGE-B": Math.round((HDEP_TRENDS["CAGE-B"][i] / 100) * 120), "CAGE-C": Math.round((HDEP_TRENDS["CAGE-C"][i] / 100) * 120), "CAGE-D": Math.round((HDEP_TRENDS["CAGE-D"][i] / 100) * 120) })),
    []
  );

  const scatterData = useMemo(
    () => cages.map((cage, idx) => ({ x: 11 + idx * 0.8, y: cage.hdep, cage: cage.code })),
    [cages]
  );

  const forecastChartData = useMemo(() => {
    const historical = [84.8, 85.2, 85.0, 85.5, 85.7, 85.4, 85.3, 85.8, 85.9, 86.0, 85.8, 85.7, 85.9, 86.0];
    const rows = [];
    historical.forEach((v, i) => {
      rows.push({ date: `H-${14 - i}`, historical: v, xgb: null, sarima: null, low: null, high: null });
    });
    FORECAST_XGB.forEach((v, i) => {
      rows.push({ date: `F+${i + 1}`, historical: null, xgb: v, sarima: FORECAST_SARIMA[i], low: v - 5, high: v + 5 });
    });
    return rows.slice(0, 14 + forecastHorizon);
  }, [forecastHorizon]);

  const forecastTable = useMemo(
    () => FORECAST_XGB.slice(0, forecastHorizon).map((v, i) => {
      const s = FORECAST_SARIMA[i];
      const conf = Math.max(70, 95 - i * 3);
      return {
        date: new Date(Date.now() + (i + 1) * 86400000).toISOString().slice(0, 10),
        xgb: v.toFixed(1),
        sarima: s.toFixed(1),
        diff: (v - s).toFixed(1),
        confidence: conf
      };
    }),
    [forecastHorizon]
  );

  const handleSaveEggLog = () => {
    const record = {
      date: eggForm.date,
      cage: eggForm.cage,
      eggs: Number(eggForm.eggCount),
      hens: Number(eggForm.henCount),
      hdep: hdepPreview,
      loggedBy: eggForm.loggedBy,
      notes: eggForm.notes || "-"
    };
    setEggLogs((prev) => [record, ...prev].slice(0, 10));
    pushToast("success", "Egg record saved successfully");
  };

  const handleAddCage = () => {
    if (!newCageForm.code.trim()) {
      pushToast("error", "Cage code is required");
      return;
    }
    setCages((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        code: newCageForm.code.toUpperCase(),
        breed: newCageForm.breed,
        hens: Number(newCageForm.capacity),
        weeks: Number(newCageForm.weeks),
        hdep: 0,
        status: "active",
        location: newCageForm.location || "-"
      }
    ]);
    setShowAddCageModal(false);
    pushToast("success", "Cage added");
  };

  const handleDeleteCage = (id) => {
    setCages((prev) => {
      const next = prev.filter((c) => c.id !== id);
      setDashboardLayoutOrder((order) => order.filter((code) => next.some((c) => c.code === code)));
      return next;
    });
    pushToast("warning", "Cage removed");
  };

  useEffect(() => {
    setDashboardLayoutOrder((order) => {
      const valid = order.filter((code) => cages.some((c) => c.code === code));
      const missing = cages.map((c) => c.code).filter((code) => !valid.includes(code));
      return [...valid, ...missing];
    });
  }, [cages]);

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth <= MOBILE_BREAKPOINT;
      setIsMobile(mobile);
      if (!mobile) {
        setMobileSidebarOpen(false);
      }
    };

    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const reorderDashboardCages = useCallback((fromCode, toCode) => {
    if (!fromCode || !toCode || fromCode === toCode) {
      return;
    }

    setDashboardLayoutOrder((prev) => {
      const next = [...prev];
      const fromIndex = next.indexOf(fromCode);
      const toIndex = next.indexOf(toCode);

      if (fromIndex < 0 || toIndex < 0) {
        return prev;
      }

      next.splice(fromIndex, 1);
      next.splice(toIndex, 0, fromCode);
      return next;
    });
  }, []);

  const handleAddFeedBatch = () => {
    if (!newFeedBatchForm.code.trim()) {
      pushToast("error", "Batch code is required");
      return;
    }
    setFeedBatches((prev) => [...prev, { ...newFeedBatchForm, cp: Number(newFeedBatchForm.cp) }]);
    setShowFeedBatchModal(false);
    pushToast("success", "Feed batch saved");
  };

  const acknowledgeAlert = (id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    pushToast("success", "Alert acknowledged");
  };

  const currentBreadcrumb = NAV_ITEMS.find((n) => n.key === currentPage)?.label || "Dashboard";
  const mobileTabItems = NAV_ITEMS.filter((item) => MOBILE_TAB_KEYS.includes(item.key));

  const renderNavButton = (item) => {
    const Icon = item.icon;
    const showNew = item.key === "environment" || item.key === "feed";
    return (
      <button
        key={item.key}
        className={`lr-nav-item ${currentPage === item.key ? "active" : ""}`}
        onClick={() => handleNavigate(item.key)}
        data-tooltip={item.label}
        type="button"
      >
        <span className="nav-icon"><Icon size={ICON_SIZES.nav} /></span>
        <span className="nav-label">{item.label}</span>
        {showNew ? <span className="lr-nav-badge nav-label">New</span> : null}
      </button>
    );
  };

  const renderDashboard = () => {
    const activeCages = cages.filter((cage) => cage.status === "active");

    return (
    <>
      <div className="lr-stat-grid mb-3">
        <div className="lr-stat-cell">{statCard("Total Hens", "480", "+0 today")}</div>
        <div className="lr-stat-cell">{statCard("Today's HDEP", `${dashboardHdep}%`, "↑ 2.1% vs yesterday")}</div>
        <div className="lr-stat-cell">{statCard("Eggs Collected", String(dashboardStatEggs), "auto-counted via IR sensor")}</div>
        <div className="lr-stat-cell">{statCard("Active Alerts", String(alerts.length), "1 env, 1 production")}</div>
      </div>

      <div className="lr-card mb-3">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
          <h5 className="mb-0">Active Cages</h5>
          <div className="btn-group" role="group" aria-label="Active cage display mode">
            <button type="button" className={`btn btn-sm ${activeCageView === "cards" ? "lr-btn-primary" : "btn-outline-secondary"}`} onClick={() => setActiveCageView("cards")}>Cards</button>
            <button type="button" className={`btn btn-sm ${activeCageView === "table" ? "lr-btn-primary" : "btn-outline-secondary"}`} onClick={() => setActiveCageView("table")}>Table</button>
            <button type="button" className={`btn btn-sm ${activeCageView === "strips" ? "lr-btn-primary" : "btn-outline-secondary"}`} onClick={() => setActiveCageView("strips")}>Strips</button>
          </div>
        </div>

        {activeCageView === "cards" ? (
          <div className="lr-cage-row">
            {activeCages.map((cage) => {
              const grade = gradeMeta(cage.hdep);
              return (
                <div key={cage.id} className="lr-cage-card">
                  <div className="d-flex justify-content-between align-items-center">
                    <strong>{cage.code}</strong>
                    <span className={`lr-grade ${grade.cls}`}>{grade.label}</span>
                  </div>
                  <p className="text-muted mb-1 small">{cage.breed}</p>
                  <p className="mb-1">HDEP {cage.hdep}%</p>
                  <Sparkline data={HDEP_TRENDS[cage.code]} color={CAGE_COLORS[cage.code] || "var(--color-straw)"} />
                  <p className="mb-1 small">Hens: {cage.hens} | {cage.weeks} weeks</p>
                  <button className="btn btn-sm btn-link p-0" onClick={() => setCurrentPage("cages")} type="button">
                    View Detail
                  </button>
                </div>
              );
            })}
          </div>
        ) : null}

        {activeCageView === "table" ? (
          <div className="table-responsive">
            <table className="table table-sm align-middle mb-0">
              <thead>
                <tr><th>Cage</th><th>Breed</th><th>Hens</th><th>HDEP</th><th>Sensors</th><th>7D Trend</th></tr>
              </thead>
              <tbody>
                {activeCages.map((cage) => {
                  const trend = HDEP_TRENDS[cage.code] || [];
                  const delta = trend.length > 1 ? (trend[trend.length - 1] - trend[0]).toFixed(1) : "0.0";
                  const up = Number(delta) >= 0;
                  return (
                    <tr key={`${cage.code}-table`}>
                      <td><strong style={{ color: CAGE_COLORS[cage.code] || "inherit" }}>{cage.code}</strong></td>
                      <td>{cage.breed}</td>
                      <td>{cage.hens}</td>
                      <td>{cage.hdep}%</td>
                      <td>{cage.sensors.length}</td>
                      <td><span className={`lr-pill ${up ? "success" : "warning"}`}>{up ? "Up" : "Down"} {delta}%</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}

        {activeCageView === "strips" ? (
          <div className="lr-cage-strip-list">
            {activeCages.map((cage) => {
              const density = ((cage.hens / (cage.rows * cage.slotsPerRow || 1))).toFixed(1);
              return (
                <article key={`${cage.code}-strip`} className="lr-cage-strip">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <strong style={{ color: CAGE_COLORS[cage.code] || "inherit" }}>{cage.code}</strong>
                    <span className="small text-muted">{cage.hens} hens | density {density}/slot</span>
                  </div>
                  <div className="lr-strip-track">
                    <span className="lr-strip-fill" style={{ width: `${Math.min(100, Math.max(0, cage.hdep))}%`, background: CAGE_COLORS[cage.code] || "#555" }} />
                  </div>
                  <div className="d-flex justify-content-between small mt-1">
                    <span>{cage.breed}</span>
                    <span>HDEP {cage.hdep}%</span>
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className="lr-card mb-3">
        <h5>Battery Cage Layout</h5>
        <p className="text-muted mb-3">All cages shown below. Drag a cage card and drop it onto another to rearrange positions.</p>

        <div className="lr-layout-grid">
          {dashboardLayoutOrder
            .map((code) => cages.find((c) => c.code === code))
            .filter(Boolean)
            .map((cage) => {
              const totalSlots = (cage.rows || 0) * (cage.slotsPerRow || 0);
              const chickensPerSlot = totalSlots > 0 ? (cage.hens / totalSlots).toFixed(1) : "0.0";
              return (
                <article
                  key={cage.code}
                  className="lr-layout-cage"
                  draggable
                  onDragStart={() => setDraggedCageCode(cage.code)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => {
                    reorderDashboardCages(draggedCageCode, cage.code);
                    setDraggedCageCode(null);
                  }}
                >
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div>
                      <strong>{cage.code}</strong>
                      <p className="m-0 text-muted small">{cage.breed}</p>
                    </div>
                    <span className={`lr-pill ${cage.sensors.length ? "success" : "muted"}`}>
                      {cage.sensors.length ? `${cage.sensors.length} sensor(s)` : "No sensors"}
                    </span>
                  </div>

                  <div className="lr-slot-layout compact">
                    {Array.from({ length: cage.rows || 0 }, (_, rowIndex) => {
                      const rowLabel = String.fromCharCode(65 + rowIndex);
                      return (
                        <div className="lr-slot-row" key={`${cage.code}-${rowLabel}`}>
                          <strong className="lr-slot-label">{rowLabel}</strong>
                          <div className="lr-slot-cells">
                            {Array.from({ length: cage.slotsPerRow || 0 }, (_, slotIndex) => {
                              const slot = `${rowLabel}${slotIndex + 1}`;
                              return <span className="lr-slot-cell" key={`${cage.code}-${slot}`}>{slot}</span>;
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="row mt-2 gx-2">
                    <div className="col-6">
                      <p className="m-0 text-muted small">Rows x Slots</p>
                      <p className="m-0 fw-semibold">{cage.rows} x {cage.slotsPerRow} ({totalSlots})</p>
                    </div>
                    <div className="col-6">
                      <p className="m-0 text-muted small">Chickens / Slot</p>
                      <p className="m-0 fw-semibold">{chickensPerSlot}</p>
                    </div>
                  </div>
                </article>
              );
            })}
        </div>
      </div>

      <div className="row g-3 mb-3">
        <div className="col-md-6">
          <div className="lr-card h-100">
            <h5>Environmental Summary</h5>
            <div className="row g-2">
              <div className="col-6">
                <div className="lr-mini-card">
                  <span>Temperature</span>
                  <strong>{envLatest?.coopTemp ?? "-"}°C</strong>
                  <span className={`lr-pill ${(envLatest?.coopTemp ?? 0) >= envThresholds.tempMin && (envLatest?.coopTemp ?? 0) <= envThresholds.tempMax ? "success" : "danger"}`}>
                    {(envLatest?.coopTemp ?? 0) >= envThresholds.tempMin && (envLatest?.coopTemp ?? 0) <= envThresholds.tempMax ? "In range" : "Alert"}
                  </span>
                  <small>Last reading: 2 mins ago</small>
                </div>
              </div>
              <div className="col-6">
                <div className="lr-mini-card">
                  <span>Humidity</span>
                  <strong>{envLatest?.coopHumidity ?? "-"}%</strong>
                  <span className={`lr-pill ${(envLatest?.coopHumidity ?? 0) >= envThresholds.humMin && (envLatest?.coopHumidity ?? 0) <= envThresholds.humMax ? "success" : "warning"}`}>
                    {(envLatest?.coopHumidity ?? 0) >= envThresholds.humMin && (envLatest?.coopHumidity ?? 0) <= envThresholds.humMax ? "In range" : "Watch"}
                  </span>
                  <small>Last reading: 2 mins ago</small>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="lr-card h-100">
            <h5>Recent Alerts</h5>
            {alerts.length === 0 ? (
              <EmptyState message="No active alerts" />
            ) : (
              alerts.map((alert) => (
                <div key={alert.id} className="lr-alert-row">
                  <div>
                    <strong>{alert.cage}</strong>
                    <p className="m-0 small text-muted">{alert.msg}</p>
                  </div>
                  <div className="text-end">
                    <small className="d-block text-muted">{alert.time}</small>
                    <button className="btn btn-sm btn-outline-secondary mt-1" onClick={() => acknowledgeAlert(alert.id)} type="button">
                      Acknowledge
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
    );
  };

  const renderCages = () => (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="m-0">Cage Management</h4>
        <button className="btn lr-btn-primary" type="button" onClick={() => setShowAddCageModal(true)}>
          <Plus size={ICON_SIZES.small} className="me-1" /> Add Cage
        </button>
      </div>
      <div className="lr-card table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead>
            <tr>
              <th>Cage Code</th><th>Location</th><th>Breed</th><th>Capacity</th><th>Hens</th><th>Flock Age</th><th>HDEP</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {cages.map((cage) => {
              const grade = gradeMeta(cage.hdep);
              return (
                <tr key={cage.id}>
                  <td>{cage.code}</td>
                  <td>{cage.location}</td>
                  <td>{cage.breed}</td>
                  <td>{cage.hens}</td>
                  <td>{cage.hens}</td>
                  <td>{cage.weeks} weeks</td>
                  <td><span className={`lr-grade ${grade.cls}`}>{cage.hdep}%</span></td>
                  <td>{cage.status}</td>
                  <td className="d-flex gap-1">
                    <button className="btn btn-sm btn-outline-secondary" type="button">Edit</button>
                    <button className="btn btn-sm btn-outline-danger" type="button" onClick={() => handleDeleteCage(cage.id)}><Trash2 size={ICON_SIZES.small} /></button>
                    <button className="btn btn-sm btn-outline-secondary" type="button">View Detail</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );

  const renderLogging = () => (
    <div className="row g-3">
      <div className="col-xl-5">
        <div className="lr-card">
          <h5>Log Entry Form</h5>
          <div className="mb-2">
            <label className="form-label">Date</label>
            <input className="form-control" type="date" value={eggForm.date} onChange={(e) => setEggForm((p) => ({ ...p, date: e.target.value }))} />
          </div>
          <div className="mb-2">
            <label className="form-label">Cage</label>
            <select
              className="form-select"
              value={eggForm.cage}
              onChange={(e) => {
                const selected = cages.find((c) => c.code === e.target.value);
                setEggForm((p) => ({ ...p, cage: e.target.value, henCount: selected?.hens || 120 }));
              }}
            >
              {cages.map((c) => (
                <option key={c.id} value={c.code}>{c.code}</option>
              ))}
            </select>
          </div>
          <div className="mb-2">
            <label className="form-label">Egg Count (IR sensor auto-count or manual entry)</label>
            <input className="form-control" type="number" value={eggForm.eggCount} onChange={(e) => setEggForm((p) => ({ ...p, eggCount: e.target.value }))} />
          </div>
          <div className="mb-2">
            <label className="form-label">Hen Count</label>
            <input className="form-control" type="number" value={eggForm.henCount} onChange={(e) => setEggForm((p) => ({ ...p, henCount: e.target.value }))} />
          </div>
          <div className="mb-2">
            <span className="lr-badge-hero">HDEP: {hdepPreview}%</span>
          </div>
          <div className="mb-2">
            <label className="form-label">Logged By</label>
            <input className="form-control" value={eggForm.loggedBy} readOnly />
          </div>
          <div className="mb-3">
            <label className="form-label">Notes</label>
            <textarea className="form-control" rows="3" value={eggForm.notes} onChange={(e) => setEggForm((p) => ({ ...p, notes: e.target.value }))} />
          </div>
          <button className="btn lr-btn-primary" type="button" onClick={handleSaveEggLog}>Save Record</button>
        </div>
      </div>
      <div className="col-xl-7">
        <div className="lr-card table-responsive">
          <h5>Recent Logs</h5>
          <table className="table table-sm table-hover align-middle">
            <thead>
              <tr><th>Date</th><th>Cage</th><th>Eggs</th><th>Hens</th><th>HDEP</th><th>Logged By</th><th>Notes</th></tr>
            </thead>
            <tbody>
              {eggLogs.map((log, i) => (
                <tr key={`${log.date}-${i}`}>
                  <td>{log.date}</td><td>{log.cage}</td><td>{log.eggs}</td><td>{log.hens}</td><td>{log.hdep}%</td><td>{log.loggedBy}</td><td>{log.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderEnvironment = () => {
    const currentTemp = envLatest?.coopTemp ?? 0;
    const currentHumidity = envLatest?.coopHumidity ?? 0;
    const tempOk = currentTemp >= envThresholds.tempMin && currentTemp <= envThresholds.tempMax;
    const humOk = currentHumidity >= envThresholds.humMin && currentHumidity <= envThresholds.humMax;

    return (
      <>
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
          <h4 className="m-0">Coop Environment Monitor</h4>
          <div className="btn-group lr-range-group" role="group" aria-label="Environment trend ranges">
            {ENV_RANGE_OPTIONS.map((range) => (
              <button
                key={range}
                type="button"
                className={`btn btn-sm ${envRange === range ? "lr-btn-primary" : "btn-outline-secondary"}`}
                onClick={() => setEnvRange(range)}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {envRange === "Custom" ? (
          <div className="lr-card mb-3">
            <div className="row g-2 align-items-end">
              <div className="col-md-4">
                <label className="form-label">Start date</label>
                <input
                  className="form-control"
                  type="date"
                  value={customRange.start}
                  onChange={(e) => setCustomRange((prev) => ({ ...prev, start: e.target.value }))}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">End date</label>
                <input
                  className="form-control"
                  type="date"
                  value={customRange.end}
                  onChange={(e) => setCustomRange((prev) => ({ ...prev, end: e.target.value }))}
                />
              </div>
              <div className="col-md-4">
                <p className="mb-0 text-muted small">Showing {envChartData.length} data point(s) from the 90-day sensor history.</p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="row g-3 mb-3">
          <div className="col-md-4">
            <div className="lr-card">
              <h6>Coop Avg Temperature</h6>
              <div className="d-flex justify-content-between align-items-end">
                <span className="lr-metric-large">{currentTemp}°C</span>
                <span className={`lr-pill ${tempOk ? "success" : "danger"}`}>{tempOk ? "In Range" : "Out of Range"}</span>
              </div>
              <small className="text-muted">Spread across sensors: {envSpread.temp}°C</small>
            </div>
          </div>
          <div className="col-md-4">
            <div className="lr-card">
              <h6>Coop Avg Humidity</h6>
              <div className="d-flex justify-content-between align-items-end">
                <span className="lr-metric-large">{currentHumidity}%</span>
                <span className={`lr-pill ${humOk ? "success" : "warning"}`}>{humOk ? "In Range" : "Watch"}</span>
              </div>
              <small className="text-muted">Spread across sensors: {envSpread.humidity}%</small>
            </div>
          </div>
          <div className="col-md-4">
            <div className="lr-card">
              <h6>Active Sensors</h6>
              <div className="d-flex justify-content-between align-items-end">
                <span className="lr-metric-large">{envPerCageReadings.length}</span>
                <span className="lr-pill success">Live</span>
              </div>
              <small className="text-muted">One sensor node mapped per cage.</small>
            </div>
          </div>
        </div>

        <div className="row g-3 mb-3">
          {envPerCageReadings.map((reading) => {
            const tempInRange = reading.temp >= envThresholds.tempMin && reading.temp <= envThresholds.tempMax;
            const humidityInRange = reading.humidity >= envThresholds.humMin && reading.humidity <= envThresholds.humMax;
            const readingStatus = getEnvStatus(reading.temp, reading.humidity, envThresholds);
            const cageColor = CAGE_COLORS[reading.cage] || "#444";
            return (
              <div className="col-lg-3 col-md-6" key={reading.cage}>
                <div className="lr-card h-100 lr-cage-reading-card" style={{ borderTopColor: cageColor }}>
                  <div className="d-flex justify-content-between align-items-center">
                    <h6 className="m-0 d-flex align-items-center gap-2">
                      <span className="lr-cage-dot" style={{ background: cageColor }} />
                      {reading.cage}
                    </h6>
                    <span className="lr-pill muted">{reading.sensor}</span>
                  </div>
                  <p className="mb-1 mt-2">Temp: <strong>{reading.temp}°C</strong></p>
                  <p className="mb-2">Humidity: <strong>{reading.humidity}%</strong></p>
                  <div className="lr-reading-meter mb-2">
                    <span className="small text-muted">Temp range use</span>
                    <div className="lr-meter-track">
                      <div className="lr-meter-fill" style={{ width: `${Math.min(100, Math.max(0, ((reading.temp - envThresholds.tempMin) / ((envThresholds.tempMax - envThresholds.tempMin) || 1)) * 100))}%`, background: cageColor }} />
                    </div>
                  </div>
                  <div className="d-flex gap-2 flex-wrap">
                    <span className={`lr-pill ${tempInRange ? "success" : "danger"}`}>Temp {tempInRange ? "OK" : "Alert"}</span>
                    <span className={`lr-pill ${humidityInRange ? "success" : "warning"}`}>Humidity {humidityInRange ? "OK" : "Watch"}</span>
                    <span className={`lr-pill ${readingStatus.cls}`}>Status {readingStatus.label}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="lr-card mb-3">
          <h5>Alert Threshold Configuration</h5>
          <div className="row g-2 align-items-end">
            <div className="col-md-2"><label className="form-label">Temp min</label><input className="form-control" type="number" value={envThresholds.tempMin} onChange={(e) => setEnvThresholds((p) => ({ ...p, tempMin: Number(e.target.value) }))} /></div>
            <div className="col-md-2"><label className="form-label">Temp max</label><input className="form-control" type="number" value={envThresholds.tempMax} onChange={(e) => setEnvThresholds((p) => ({ ...p, tempMax: Number(e.target.value) }))} /></div>
            <div className="col-md-2"><label className="form-label">Humidity min</label><input className="form-control" type="number" value={envThresholds.humMin} onChange={(e) => setEnvThresholds((p) => ({ ...p, humMin: Number(e.target.value) }))} /></div>
            <div className="col-md-2"><label className="form-label">Humidity max</label><input className="form-control" type="number" value={envThresholds.humMax} onChange={(e) => setEnvThresholds((p) => ({ ...p, humMax: Number(e.target.value) }))} /></div>
            <div className="col-md-4"><button className="btn lr-btn-primary" type="button" onClick={() => pushToast("success", "Thresholds saved")}>Save Thresholds</button></div>
          </div>
        </div>

        <div className="row g-3 mb-3">
          <div className="col-md-6">
            <div className="lr-card">
              <h6>Current Sensor Snapshot (Tagged View)</h6>
              <div className="lr-reading-chip-grid mt-2">
                {envPerCageReadings.map((reading) => {
                  const readingStatus = getEnvStatus(reading.temp, reading.humidity, envThresholds);
                  const cageColor = CAGE_COLORS[reading.cage] || "#444";
                  return (
                    <article className="lr-reading-chip" key={`${reading.cage}-snapshot`} style={{ borderColor: cageColor }}>
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <strong style={{ color: cageColor }}>{reading.cage}</strong>
                        <span className="lr-pill muted">{reading.sensor}</span>
                      </div>
                      <p className="mb-1">{reading.temp}°C | {reading.humidity}%</p>
                      <span className={`lr-pill ${readingStatus.cls}`}>{readingStatus.label}</span>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="lr-card">
              <h6>Range Summary</h6>
              <p className="mb-1">Window: <strong>{envRange}</strong></p>
              <p className="mb-1">Points analyzed: <strong>{envChartData.length}</strong></p>
              <p className="mb-0">Latest reading: <strong>{envLatest?.label || "-"}</strong></p>
            </div>
          </div>
        </div>

        <div className="row g-3 mb-3">
          <div className="col-md-6">
            <div className="lr-card chart-card">
              <h6>Temperature Trend (Coop + per cage)</h6>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={envChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-fence)" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="coopTemp" name="Coop Avg" stroke="#111111" strokeWidth={2.2} />
                  {cages
                    .filter((cage) => envChartData.some((row) => Object.hasOwn(row, `${cage.code}_temp`)))
                    .map((cage) => (
                      <Line
                        key={`${cage.code}-temp-line`}
                        type="monotone"
                        dataKey={`${cage.code}_temp`}
                        name={`${cage.code}`}
                        stroke={CAGE_COLORS[cage.code] || "#444"}
                        strokeWidth={2}
                        dot={{ r: 2 }}
                      />
                    ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="col-md-6">
            <div className="lr-card chart-card">
              <h6>Humidity Trend (Coop + per cage)</h6>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={envChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-fence)" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="coopHumidity" name="Coop Avg" stroke="#222222" strokeWidth={2.2} />
                  {cages
                    .filter((cage) => envChartData.some((row) => Object.hasOwn(row, `${cage.code}_humidity`)))
                    .map((cage) => (
                      <Line
                        key={`${cage.code}-humidity-line`}
                        type="monotone"
                        dataKey={`${cage.code}_humidity`}
                        name={`${cage.code}`}
                        stroke={CAGE_COLORS[cage.code] || "#444"}
                        strokeWidth={2}
                        dot={{ r: 2 }}
                      />
                    ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="lr-card table-responsive">
          <h5>Environmental Logs (All Cages)</h5>
          <table className="table table-hover mb-0">
            <thead><tr><th>Timestamp</th><th>Coop Avg Temp</th><th>Coop Avg Humidity</th><th>Per-cage Readings</th><th>Status</th></tr></thead>
            <tbody>
              {envLogs.map((row, idx) => {
                const isWarning = row.coopTemp > envThresholds.tempMax || row.coopTemp < envThresholds.tempMin || row.coopHumidity > envThresholds.humMax || row.coopHumidity < envThresholds.humMin;
                return (
                  <tr key={`${row.timestamp}-${idx}`}>
                    <td>{new Date(row.timestamp).toLocaleString()}</td>
                    <td>{row.coopTemp}°C</td>
                    <td>{row.coopHumidity}%</td>
                    <td>
                      <div className="lr-log-readings">
                        {row.cages.map((reading) => {
                          const readingStatus = getEnvStatus(reading.temp, reading.humidity, envThresholds);
                          const cageColor = CAGE_COLORS[reading.cage] || "#444";
                          return (
                            <span className="lr-log-reading-chip" key={`${row.timestamp}-${reading.cage}`} style={{ borderColor: cageColor }}>
                              <strong style={{ color: cageColor }}>{reading.cage}</strong>
                              <span>{reading.temp}°C / {reading.humidity}%</span>
                              <span className={`lr-pill ${readingStatus.cls}`}>{readingStatus.label}</span>
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td><span className={`lr-pill ${isWarning ? "warning" : "success"}`}>{isWarning ? "Warning" : "Normal"}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </>
    );
  };

  const renderFeed = () => {
    const cpAvg = (feedBatches.reduce((sum, f) => sum + f.cp, 0) / feedBatches.length).toFixed(1);
    const consumptionRows = Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - i * 86400000).toISOString().slice(0, 10),
      cage: CAGES[i % 4].code,
      batch: FEED_BATCHES_BASE[i % 3].code,
      feed: (11.3 + (i % 3)).toFixed(1),
      cp: FEED_BATCHES_BASE[i % 3].cp,
      by: "Farm Operator"
    }));

    return (
      <>
        <div className="row g-3 mb-3">
          <div className="col-md-4">{statCard("Avg CP% this week", `${cpAvg}%`, "within target")}</div>
          <div className="col-md-4">{statCard("Avg Feed/Cage/Day", "12.4 kg", "rolling 7 days")}</div>
          <div className="col-md-4">{statCard("Total Feed Used", "86.8 kg", "last 7 days")}</div>
        </div>

        <div className="lr-card mb-3">
          <div className="d-flex justify-content-between align-items-center">
            <div className="btn-group" role="tablist">
              <button className={`btn ${feedTab === "batches" ? "lr-btn-primary" : "btn-outline-secondary"}`} onClick={() => setFeedTab("batches")} type="button">Feed Batches</button>
              <button className={`btn ${feedTab === "daily" ? "lr-btn-primary" : "btn-outline-secondary"}`} onClick={() => setFeedTab("daily")} type="button">Daily Consumption</button>
            </div>
            {feedTab === "batches" && (
              <button className="btn lr-btn-primary" type="button" onClick={() => setShowFeedBatchModal(true)}>
                <Plus size={ICON_SIZES.small} className="me-1" /> Add Feed Batch
              </button>
            )}
          </div>
        </div>

        {feedTab === "batches" ? (
          <div className="lr-card table-responsive">
            <table className="table table-hover mb-0">
              <thead><tr><th>Batch Code</th><th>Date Received</th><th>Crude Protein %</th><th>Notes</th><th>Actions</th></tr></thead>
              <tbody>
                {feedBatches.map((b, idx) => (
                  <tr key={`${b.code}-${idx}`}>
                    <td>{b.code}</td>
                    <td>{b.date}</td>
                    <td><span className={`lr-grade ${b.cp >= 17.2 ? "good" : b.cp >= 16.5 ? "average" : "low"}`}>{b.cp}%</span></td>
                    <td>{b.notes}</td>
                    <td><button className="btn btn-sm btn-outline-secondary" type="button">Edit</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <>
            <div className="lr-card mb-3">
              <h5>Daily Consumption Log</h5>
              <div className="row g-2 align-items-end">
                <div className="col-md-2"><label className="form-label">Date</label><input className="form-control" type="date" defaultValue={new Date().toISOString().slice(0, 10)} /></div>
                <div className="col-md-2"><label className="form-label">Cage</label><select className="form-select">{cages.map((c) => <option key={c.id}>{c.code}</option>)}</select></div>
                <div className="col-md-2"><label className="form-label">Feed Batch</label><select className="form-select">{feedBatches.map((b) => <option key={b.code}>{b.code}</option>)}</select></div>
                <div className="col-md-2"><label className="form-label">Feed (kg)</label><input className="form-control" type="number" defaultValue="12.4" /></div>
                <div className="col-md-2"><label className="form-label">CP%</label><input className="form-control" value="17.5" readOnly /></div>
                <div className="col-md-2"><button className="btn lr-btn-primary" type="button" onClick={() => pushToast("success", "Consumption logged")}>Log Consumption</button></div>
              </div>
            </div>

            <div className="lr-card table-responsive">
              <table className="table table-hover mb-0">
                <thead><tr><th>Date</th><th>Cage</th><th>Batch</th><th>Feed (kg)</th><th>CP%</th><th>Logged By</th></tr></thead>
                <tbody>
                  {consumptionRows.map((row, idx) => <tr key={idx}><td>{row.date}</td><td>{row.cage}</td><td>{row.batch}</td><td>{row.feed}</td><td>{row.cp}%</td><td>{row.by}</td></tr>)}
                </tbody>
              </table>
            </div>
          </>
        )}
      </>
    );
  };

  const renderAnalytics = () => (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="m-0">Analytics</h4>
        <div className="btn-group">
          {["Week", "Month", "3 Months"].map((r) => (
            <button key={r} className={`btn ${analyticsRange === r ? "lr-btn-primary" : "btn-outline-secondary"}`} type="button" onClick={() => setAnalyticsRange(r)}>{r}</button>
          ))}
        </div>
      </div>

      <div className="lr-card chart-card mb-3">
        <h6>HDEP Trend - one line per cage</h6>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={analyticsTrendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-fence)" />
            <XAxis dataKey="day" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Line dataKey="a" stroke="#4A7C3F" name="CAGE-A" />
            <Line dataKey="b" stroke="#D4700A" name="CAGE-B" />
            <Line dataKey="c" stroke="#C0392B" name="CAGE-C" />
            <Line dataKey="d" stroke="#8C7B6B" name="CAGE-D" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="row g-3 mb-3">
        <div className="col-lg-7">
          <div className="lr-card chart-card h-100">
            <h6>Eggs Collected Per Day</h6>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={eggBarData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-fence)" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="CAGE-A" stackId="a" fill="#4A7C3F" />
                <Bar dataKey="CAGE-B" stackId="a" fill="#C8A96E" />
                <Bar dataKey="CAGE-C" stackId="a" fill="#D4700A" />
                <Bar dataKey="CAGE-D" stackId="a" fill="#8C7B6B" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="col-lg-5">
          <div className="lr-card chart-card h-100">
            <h6>Feed vs HDEP Correlation</h6>
            <ResponsiveContainer width="100%" height={240}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-fence)" />
                <XAxis type="number" dataKey="x" name="Feed" unit="kg" />
                <YAxis type="number" dataKey="y" name="HDEP" unit="%" />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                <Scatter name="Cages" data={scatterData} fill="#3B2A1A" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="lr-card table-responsive">
        <table className="table table-hover mb-0">
          <thead><tr><th>Cage</th><th>Breed</th><th>Avg HDEP</th><th>Best Day</th><th>Worst Day</th><th>Trend</th></tr></thead>
          <tbody>
            {cages.map((cage) => {
              const trend = cage.hdep >= 80 ? "↑" : cage.hdep >= 60 ? "→" : "↓";
              return (
                <tr key={cage.id}><td>{cage.code}</td><td>{cage.breed}</td><td>{cage.hdep}%</td><td>{Math.max(...HDEP_TRENDS[cage.code]).toFixed(1)}%</td><td>{Math.min(...HDEP_TRENDS[cage.code]).toFixed(1)}%</td><td>{trend}</td></tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );

  const renderForecast = () => (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="m-0">Forecast</h4>
        <div className="d-flex gap-2">
          <span className="lr-pill success">XGBoost (Primary)</span>
          <span className="lr-pill muted">SARIMA (Baseline)</span>
        </div>
      </div>

      <div className="row g-3 mb-3">
        <div className="col-lg-3">
          <div className="lr-card h-100">
            <h6>Forecast Inputs</h6>
            <div className="mb-2">
              <label className="form-label">Select Cage</label>
              <select className="form-select" value={forecastCage} onChange={(e) => setForecastCage(e.target.value)}>
                {cages.map((c) => <option key={c.id} value={c.code}>{c.code}</option>)}
              </select>
            </div>
            <div className="mb-2">
              <label className="form-label">Forecast horizon</label>
              <div className="d-flex gap-2">
                {[7, 14, 30].map((n) => (
                  <label key={n} className="form-check-label small">
                    <input className="form-check-input me-1" type="radio" checked={forecastHorizon === n} onChange={() => setForecastHorizon(n)} />{n} days
                  </label>
                ))}
              </div>
            </div>
            <button className="btn lr-btn-primary" type="button" onClick={() => pushToast("success", `Forecast generated for ${forecastCage}`)}>Generate Forecast</button>
          </div>
        </div>
        <div className="col-lg-9">
          <div className="lr-card chart-card">
            <h6>Historical vs Forecast HDEP</h6>
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={forecastChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-fence)" />
                <XAxis dataKey="date" />
                <YAxis domain={[70, 95]} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="high" stackId="1" stroke="none" fill="#F0DFB0" fillOpacity={0.45} name="Confidence +" />
                <Area type="monotone" dataKey="low" stackId="1" stroke="none" fill="#F0DFB0" fillOpacity={0.45} name="Confidence -" />
                <Line dataKey="historical" stroke="#3B2A1A" strokeWidth={2} name="Historical" dot={false} />
                <Line dataKey="xgb" stroke="#C8A96E" strokeDasharray="5 5" strokeWidth={2} name="XGBoost" dot={false} />
                <Line dataKey="sarima" stroke="#8C7B6B" strokeDasharray="3 4" strokeWidth={2} name="SARIMA" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-3">
        <div className="col-md-4">{statCard("XGBoost", "MAE 2.14% | RMSE 2.87%", "MAPE: 3.1%")}</div>
        <div className="col-md-4">{statCard("SARIMA", "MAE 3.52% | RMSE 4.21%", "MAPE: 4.8%")}</div>
        <div className="col-md-4"><div className="lr-card"><h6>Model Verdict</h6><span className="lr-pill success">XGBoost is better performer</span></div></div>
      </div>

      <div className="lr-card table-responsive">
        <table className="table table-hover mb-0">
          <thead><tr><th>Date</th><th>XGBoost HDEP</th><th>SARIMA HDEP</th><th>Difference</th><th>Confidence</th></tr></thead>
          <tbody>
            {forecastTable.map((r) => (
              <tr key={r.date}><td>{r.date}</td><td>{r.xgb}%</td><td>{r.sarima}%</td><td>{r.diff}%</td><td><span className={`lr-grade ${r.confidence >= 85 ? "good" : r.confidence >= 75 ? "average" : "low"}`}>{r.confidence}%</span></td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  const renderReports = () => {
    const reportEnvRows = ENV_SERIES["30D"];
    const rows = eggLogs.slice(0, 8).map((row, idx) => ({
      date: row.date,
      cage: row.cage,
      breed: CAGES[idx % CAGES.length].breed,
      eggs: row.eggs,
      hens: row.hens,
      hdep: row.hdep,
      feed: (11.4 + (idx % 3)).toFixed(1),
      cp: FEED_BATCHES_BASE[idx % 3].cp,
      temp: reportEnvRows[idx % reportEnvRows.length]?.coopTemp ?? 0,
      humidity: reportEnvRows[idx % reportEnvRows.length]?.coopHumidity ?? 0
    }));

    return (
      <>
        <div className="lr-card mb-3">
          <div className="row g-2 align-items-end">
            <div className="col-md-3">
              <label className="form-label">Report Type</label>
              <select className="form-select" value={reportType} onChange={(e) => setReportType(e.target.value)}>
                <option>Production Report</option>
                <option>Environmental Report</option>
                <option>Feed & Nutrition Report</option>
                <option>Forecast Accuracy Report</option>
              </select>
            </div>
            <div className="col-md-2"><label className="form-label">From</label><input className="form-control" type="date" /></div>
            <div className="col-md-2"><label className="form-label">To</label><input className="form-control" type="date" /></div>
            <div className="col-md-2"><label className="form-label">Cage</label><select className="form-select"><option>All</option>{cages.map((c) => <option key={c.id}>{c.code}</option>)}</select></div>
            <div className="col-md-3 d-flex gap-2">
              <button className="btn lr-btn-primary" type="button" onClick={() => setShowReportPreview(true)}>Generate Report</button>
              <button className="btn btn-outline-secondary" type="button" onClick={() => pushToast("success", "CSV exported successfully")}><Download size={ICON_SIZES.small} className="me-1" />Export CSV</button>
              <button className="btn btn-outline-secondary" type="button" onClick={() => window.print()}><Printer size={ICON_SIZES.small} /></button>
            </div>
          </div>
        </div>

        {!showReportPreview ? (
          <EmptyState message="No report generated yet" actionLabel="Generate Report" onAction={() => setShowReportPreview(true)} />
        ) : (
          <div className="lr-card table-responsive">
            <h5>{reportType}</h5>
            <table className="table table-hover mb-0">
              <thead><tr><th>Date</th><th>Cage</th><th>Breed</th><th>Eggs</th><th>Hens</th><th>HDEP</th><th>Feed (kg)</th><th>CP%</th><th>Temp</th><th>Humidity</th></tr></thead>
              <tbody>
                {rows.map((r, i) => <tr key={i}><td>{r.date}</td><td>{r.cage}</td><td>{r.breed}</td><td>{r.eggs}</td><td>{r.hens}</td><td>{r.hdep}%</td><td>{r.feed}</td><td>{r.cp}%</td><td>{r.temp}</td><td>{r.humidity}%</td></tr>)}
              </tbody>
            </table>
          </div>
        )}
      </>
    );
  };

  const renderSettings = () => (
    <>
      <div className="lr-card mb-3">
        <h5>Alert Thresholds</h5>
        <div className="row g-2 align-items-end">
          <div className="col-md-2"><label className="form-label">HDEP low</label><input className="form-control" type="number" value={settingsThresholds.hdepLow} onChange={(e) => setSettingsThresholds((p) => ({ ...p, hdepLow: Number(e.target.value) }))} /></div>
          <div className="col-md-2"><label className="form-label">HDEP critical</label><input className="form-control" type="number" value={settingsThresholds.hdepCritical} onChange={(e) => setSettingsThresholds((p) => ({ ...p, hdepCritical: Number(e.target.value) }))} /></div>
          <div className="col-md-2"><label className="form-label">Temp min</label><input className="form-control" type="number" value={settingsThresholds.tempMin} onChange={(e) => setSettingsThresholds((p) => ({ ...p, tempMin: Number(e.target.value) }))} /></div>
          <div className="col-md-2"><label className="form-label">Temp max</label><input className="form-control" type="number" value={settingsThresholds.tempMax} onChange={(e) => setSettingsThresholds((p) => ({ ...p, tempMax: Number(e.target.value) }))} /></div>
          <div className="col-md-2"><label className="form-label">Humidity min</label><input className="form-control" type="number" value={settingsThresholds.humMin} onChange={(e) => setSettingsThresholds((p) => ({ ...p, humMin: Number(e.target.value) }))} /></div>
          <div className="col-md-2"><label className="form-label">Humidity max</label><input className="form-control" type="number" value={settingsThresholds.humMax} onChange={(e) => setSettingsThresholds((p) => ({ ...p, humMax: Number(e.target.value) }))} /></div>
        </div>
        <button className="btn lr-btn-primary mt-2" type="button" onClick={() => pushToast("success", "Settings saved")}>Save</button>
      </div>

      <div className="lr-card mb-3">
        <h5>System Information</h5>
        <div className="row">
          <div className="col-md-6">
            <p><strong>Server:</strong> Raspberry Pi 4 Model B</p>
            <p><strong>Database:</strong> MySQL (Local)</p>
            <p><strong>Network:</strong> Local (Offline Mode)</p>
          </div>
          <div className="col-md-6">
            <p><strong>Last Backup:</strong> {new Date().toISOString().slice(0, 10)}</p>
            <p><strong>Storage Used:</strong> 1.24 GB / 32 GB</p>
          </div>
        </div>
      </div>

      <div className="lr-card table-responsive">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h5 className="m-0">User Management</h5>
          <button className="btn btn-sm lr-btn-primary" type="button" onClick={() => pushToast("success", "Add User clicked")}>Add User</button>
        </div>
        <table className="table table-hover mb-0">
          <thead><tr><th>Name</th><th>Role</th><th>Last Login</th><th>Actions</th></tr></thead>
          <tbody>
            <tr><td>Admin User</td><td>Administrator</td><td>2026-04-03 07:10</td><td><button className="btn btn-sm btn-outline-secondary" type="button">Edit</button></td></tr>
            <tr><td>Farm Operator</td><td>Operator</td><td>2026-04-03 09:22</td><td><button className="btn btn-sm btn-outline-secondary" type="button">Edit</button></td></tr>
          </tbody>
        </table>
      </div>
    </>
  );

  const content =
    currentPage === "dashboard" ? renderDashboard() :
    currentPage === "cages" ? renderCages() :
    currentPage === "logging" ? renderLogging() :
    currentPage === "environment" ? renderEnvironment() :
    currentPage === "feed" ? renderFeed() :
    currentPage === "analytics" ? renderAnalytics() :
    currentPage === "forecast" ? renderForecast() :
    currentPage === "reports" ? renderReports() :
    renderSettings();

  return (
    <>
      <style>{styles}</style>
      <div className={`lr-app ${collapsed ? "is-collapsed" : ""} ${isMobile ? "is-mobile" : ""} ${mobileSidebarOpen ? "is-mobile-open" : ""}`}>
        {isMobile && mobileSidebarOpen ? <button className="lr-sidebar-backdrop" onClick={() => setMobileSidebarOpen(false)} type="button" aria-label="Close sidebar" /> : null}

        <aside className={`lr-sidebar ${collapsed ? "collapsed" : ""} ${mobileSidebarOpen ? "open" : ""}`} aria-label="Primary navigation">
          <div className="lr-sidebar-top">
            <div className="lr-logo-wrap">
              <Wheat size={ICON_SIZES.nav} />
              <span className="nav-label">LayRate</span>
            </div>
          </div>

          <nav className="lr-nav">
            {NAV_ITEMS.slice(0, 8).map((item) => renderNavButton(item))}
          </nav>

          <div className="lr-sidebar-bottom">
            <button className={`lr-nav-item ${currentPage === "settings" ? "active" : ""}`} onClick={() => handleNavigate("settings")} data-tooltip="Settings" type="button">
              <span className="nav-icon"><Cog size={ICON_SIZES.nav} /></span>
              <span className="nav-label">Settings</span>
            </button>
            <div className="lr-user">
              <User size={ICON_SIZES.medium} />
              <span className="nav-label">Farm Operator</span>
            </div>
          </div>
        </aside>

        <section className="lr-main">
          <header className="lr-header">
            <div className="d-flex align-items-center gap-2">
              <button className="btn btn-sm lr-header-menu" onClick={handleSidebarToggle} type="button" aria-label="Toggle navigation menu" aria-expanded={isMobile ? mobileSidebarOpen : !collapsed}>
                <Menu size={ICON_SIZES.small} />
              </button>
              <div className="small text-muted">Home / <strong>{currentBreadcrumb}</strong></div>
            </div>
            <div className="d-flex align-items-center gap-2 lr-header-meta">
              <span className="lr-pill success">🟢 Offline - Local Network</span>
              <span className="small text-muted">Last sync 2 mins ago</span>
              <button className="btn btn-sm btn-light position-relative" type="button" aria-label="Notifications">
                <Bell size={ICON_SIZES.small} />
                <span className="lr-bell-badge">{alerts.length}</span>
              </button>
            </div>
          </header>
          <main className="lr-content">{content}</main>
        </section>

        <nav className="lr-mobile-tabbar" aria-label="Mobile quick navigation">
          {mobileTabItems.map((item) => {
            const Icon = item.icon;
            const active = currentPage === item.key;
            return (
              <button
                key={item.key}
                className={`lr-mobile-tab ${active ? "active" : ""}`}
                type="button"
                onClick={() => handleNavigate(item.key)}
              >
                <Icon size={ICON_SIZES.nav} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {showAddCageModal && (
        <Modal title="Add Cage" onClose={() => setShowAddCageModal(false)} onSave={handleAddCage} saveLabel="Save Cage">
          <div className="row g-2">
            <div className="col-md-6"><label className="form-label">Cage Code</label><input className="form-control" value={newCageForm.code} onChange={(e) => setNewCageForm((p) => ({ ...p, code: e.target.value }))} /></div>
            <div className="col-md-6"><label className="form-label">Location</label><input className="form-control" value={newCageForm.location} onChange={(e) => setNewCageForm((p) => ({ ...p, location: e.target.value }))} /></div>
            <div className="col-md-6"><label className="form-label">Max Capacity</label><input className="form-control" type="number" value={newCageForm.capacity} onChange={(e) => setNewCageForm((p) => ({ ...p, capacity: e.target.value }))} /></div>
            <div className="col-md-6"><label className="form-label">Breed</label><select className="form-select" value={newCageForm.breed} onChange={(e) => setNewCageForm((p) => ({ ...p, breed: e.target.value }))}>{BREEDS.map((b) => <option key={b}>{b}</option>)}</select></div>
            <div className="col-md-6"><label className="form-label">Date Acquired</label><input className="form-control" type="date" value={newCageForm.acquired} onChange={(e) => setNewCageForm((p) => ({ ...p, acquired: e.target.value }))} /></div>
            <div className="col-md-6"><label className="form-label">Flock Age (weeks)</label><input className="form-control" type="number" value={newCageForm.weeks} onChange={(e) => setNewCageForm((p) => ({ ...p, weeks: e.target.value }))} /></div>
          </div>
        </Modal>
      )}

      {showFeedBatchModal && (
        <Modal title="Add Feed Batch" onClose={() => setShowFeedBatchModal(false)} onSave={handleAddFeedBatch} saveLabel="Save Batch">
          <div className="row g-2">
            <div className="col-md-6"><label className="form-label">Batch Code</label><input className="form-control" value={newFeedBatchForm.code} onChange={(e) => setNewFeedBatchForm((p) => ({ ...p, code: e.target.value }))} /></div>
            <div className="col-md-6"><label className="form-label">Date Received</label><input className="form-control" type="date" value={newFeedBatchForm.date} onChange={(e) => setNewFeedBatchForm((p) => ({ ...p, date: e.target.value }))} /></div>
            <div className="col-md-6"><label className="form-label">Crude Protein (%)</label><input className="form-control" type="number" value={newFeedBatchForm.cp} onChange={(e) => setNewFeedBatchForm((p) => ({ ...p, cp: e.target.value }))} /></div>
            <div className="col-12"><label className="form-label">Notes</label><textarea className="form-control" rows="3" value={newFeedBatchForm.notes} onChange={(e) => setNewFeedBatchForm((p) => ({ ...p, notes: e.target.value }))} /></div>
          </div>
        </Modal>
      )}

      <div className="lr-toast-wrap">
        {toasts.map((t) => (
          <div key={t.id} className={`lr-toast ${t.type}`}>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function statCard(title, value, note) {
  return (
    <div className="lr-card h-100">
      <p className="lr-stat-label">{title}</p>
      <p className="lr-stat-value">{value}</p>
      <p className="lr-stat-note">{note}</p>
    </div>
  );
}

const styles = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600&family=DM+Sans:wght@400;500&family=DM+Mono&display=swap');

:root {
  --sidebar-width: 292px;
  --sidebar-width-collapsed: 80px;
  --sidebar-ease: cubic-bezier(0.4, 0, 0.2, 1);
  --sidebar-speed: 260ms;
  --sidebar-z: 1000;
  --sidebar-backdrop-z: 980;
  --sidebar-gap: 12px;
  --sidebar-padding: 12px;
  --color-soil: #111111;
  --color-bark: #1f1f1f;
  --color-straw: #2f2f2f;
  --color-straw-light: #f5f5f5;
  --color-leaf: #1a1a1a;
  --color-leaf-light: #efefef;
  --color-harvest: #4a4a4a;
  --color-harvest-light: #f2f2f2;
  --color-clay: #000000;
  --color-clay-light: #ececec;
  --color-fog: #f8f8f8;
  --color-mist: #ffffff;
  --color-dust: #666666;
  --color-fence: #d9d9d9;
}

* { box-sizing: border-box; }
body { margin: 0; background: var(--color-fog); color: var(--color-soil); font-family: 'DM Sans', sans-serif; }

.lr-app { display: grid; grid-template-columns: var(--sidebar-width) 1fr; min-height: 100vh; transition: grid-template-columns var(--sidebar-speed) var(--sidebar-ease); }
.lr-app { height: 100vh; overflow: hidden; }
.lr-app.is-collapsed { grid-template-columns: var(--sidebar-width-collapsed) 1fr; }

.lr-sidebar {
  background: linear-gradient(180deg, #121212 0%, #181818 100%);
  color: var(--color-straw-light);
  width: var(--sidebar-width);
  min-width: var(--sidebar-width);
  transition: width var(--sidebar-speed) var(--sidebar-ease), box-shadow var(--sidebar-speed) var(--sidebar-ease), transform var(--sidebar-speed) var(--sidebar-ease);
  overflow-x: hidden;
  overflow-y: hidden;
  position: sticky;
  top: 0;
  height: 100vh;
  border-right: 1px solid rgba(255,255,255,0.08);
  box-shadow: 0 0 0 1px rgba(255,255,255,0.03), 8px 0 24px rgba(0,0,0,0.24);
  display: flex;
  flex-direction: column;
  z-index: var(--sidebar-z);
}

.lr-sidebar.collapsed {
  width: var(--sidebar-width-collapsed);
  min-width: var(--sidebar-width-collapsed);
}

.lr-sidebar-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: calc(var(--sidebar-padding) + 2px) var(--sidebar-padding);
  border-bottom: 1px solid rgba(255,255,255,0.1);
  min-height: 72px;
  gap: 8px;
}
.lr-logo-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: 'Playfair Display', serif;
  font-size: 24px;
  min-width: 0;
}

.lr-header-menu {
  background: #fff;
  border: 1px solid var(--color-fence);
  color: var(--color-soil);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.lr-header-menu:hover {
  background: var(--color-fog);
}

.lr-nav {
  padding: var(--sidebar-padding);
  display: flex;
  flex-direction: column;
  gap: var(--sidebar-gap);
  overflow-y: auto;
  overflow-x: hidden;
}
.lr-nav-item {
  width: 100%;
  border: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.78);
  height: 44px;
  border-radius: 12px;
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  text-align: left;
  padding: 0 12px;
  position: relative;
  transition: background var(--sidebar-speed) var(--sidebar-ease), color var(--sidebar-speed) var(--sidebar-ease), transform var(--sidebar-speed) var(--sidebar-ease);
}
.lr-nav-item::before {
  content: "";
  position: absolute;
  left: 6px;
  top: 8px;
  bottom: 8px;
  width: 3px;
  border-radius: 999px;
  background: transparent;
  transition: background var(--sidebar-speed) var(--sidebar-ease), opacity var(--sidebar-speed) var(--sidebar-ease);
}

.lr-nav-item:hover {
  background: rgba(255,255,255,0.08);
  color: #fff;
}

.lr-nav-item.active {
  color: #ffffff;
  background: rgba(255,255,255,0.12);
}

.lr-nav-item.active::before {
  background: #ffffff;
}
.nav-icon {
  min-width: 20px;
  width: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.nav-icon svg {
  display: block;
}
.nav-label {
  opacity: 1;
  transform: translateX(0);
  transition: opacity var(--sidebar-speed) var(--sidebar-ease), transform var(--sidebar-speed) var(--sidebar-ease), width var(--sidebar-speed) var(--sidebar-ease);
  white-space: nowrap;
  overflow: hidden;
}

.lr-nav-badge {
  margin-left: auto;
  padding: 2px 6px;
  border-radius: 999px;
  font-size: 10px;
  background: rgba(255, 255, 255, 0.2);
  color: var(--color-straw-light);
}

.lr-sidebar.collapsed .nav-label {
  opacity: 0;
  pointer-events: none;
  transform: translateX(-8px);
  width: 0;
  max-width: 0;
  margin: 0;
  visibility: hidden;
}
.lr-sidebar.collapsed .lr-nav-item {
  grid-template-columns: 1fr;
  place-items: center;
  align-self: center;
  padding: 0;
  width: 48px;
  margin: 0;
  line-height: 1;
  border-radius: 12px;
}

.lr-sidebar.collapsed .lr-nav-item.active {
  outline: 1px solid rgba(255, 255, 255, 0.25);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.04);
}

.lr-sidebar.collapsed .lr-nav-item::before {
  left: 50%;
  top: auto;
  bottom: 5px;
  transform: translateX(-50%);
  width: 14px;
  height: 3px;
}

.lr-sidebar.collapsed .nav-icon {
  min-width: 20px;
  width: 20px;
  height: 20px;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  transform: none;
}

.lr-sidebar.collapsed .nav-icon svg {
  margin: 0;
  transform: none;
}
.lr-sidebar.collapsed .lr-nav-section { display: none; }
.lr-sidebar.collapsed .lr-logo-wrap { justify-content: center; width: 100%; }
.lr-sidebar.collapsed .lr-user { justify-content: center; }
.lr-sidebar.collapsed .lr-sidebar-top { justify-content: center; }

.lr-sidebar.collapsed .lr-nav-item:hover::after {
  content: attr(data-tooltip);
  position: absolute;
  left: calc(100% + 8px);
  background: var(--color-soil);
  color: var(--color-fog);
  padding: 5px 8px;
  border-radius: 6px;
  font-size: 12px;
  white-space: nowrap;
  z-index: 20;
}

.lr-sidebar-bottom {
  margin-top: auto;
  border-top: 1px solid rgba(255,255,255,0.1);
  padding: var(--sidebar-padding);
  position: sticky;
  bottom: 0;
  background: linear-gradient(to top, rgba(17,17,17,0.98), rgba(17,17,17,0.95));
}
.lr-user {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--color-straw-light);
  padding: 10px 12px;
  min-height: 44px;
}

.lr-main { display: flex; flex-direction: column; min-width: 0; height: 100vh; overflow: hidden; }
.lr-header {
  height: 56px;
  background: #fff;
  border-bottom: 1px solid var(--color-fence);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  position: sticky;
  top: 0;
  z-index: 40;
}

.lr-mobile-tabbar {
  display: none;
}

.lr-content { padding: 16px; overflow: auto; flex: 1 1 auto; min-height: 0; }

.lr-sidebar-backdrop {
  position: fixed;
  inset: 0;
  border: 0;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(1px);
  z-index: var(--sidebar-backdrop-z);
}

.lr-card {
  background: var(--color-mist);
  border: 1px solid var(--color-fence);
  border-radius: 12px;
  padding: 14px;
}
.lr-card h4, .lr-card h5, .lr-card h6 { font-family: 'Playfair Display', serif; }

.lr-stat-label { margin: 0 0 6px; color: var(--color-dust); font-size: 12px; }
.lr-stat-value { margin: 0; font-family: 'DM Mono', monospace; font-size: 34px; line-height: 1; }
.lr-stat-note { margin: 6px 0 0; color: var(--color-dust); font-size: 12px; }

.lr-stat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.lr-stat-cell {
  min-width: 0;
}

.lr-cage-row { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 2px; }
.lr-cage-card { min-width: 230px; background: var(--color-mist); border: 1px solid var(--color-fence); border-radius: 10px; padding: 10px; }

.lr-cage-strip-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.lr-cage-strip {
  border: 1px solid var(--color-fence);
  border-radius: 10px;
  padding: 10px;
  background: var(--color-mist);
}

.lr-strip-track {
  height: 8px;
  border-radius: 999px;
  background: #ececec;
  overflow: hidden;
}

.lr-strip-fill {
  display: block;
  height: 100%;
  border-radius: inherit;
}

.lr-grade { border-radius: 999px; padding: 2px 8px; font-size: 11px; border: 1px solid transparent; }
.lr-grade.good { background: #efefef; color: #111111; }
.lr-grade.average { background: #f3f3f3; color: #333333; }
.lr-grade.low { background: #e9e9e9; color: #000000; }

.lr-pill { border-radius: 999px; padding: 3px 8px; font-size: 11px; border: 1px solid transparent; }
.lr-pill.success { background: #e8f6ec; color: #1f6f3c; border-color: #b9e6c6; }
.lr-pill.warning { background: #fff5e6; color: #9a5b00; border-color: #ffd699; }
.lr-pill.danger { background: #ffecec; color: #a12622; border-color: #f6b8b5; }
.lr-pill.muted { background: var(--color-mist); color: var(--color-dust); border-color: var(--color-fence); }

.lr-cage-reading-card {
  border-top-width: 4px;
}

.lr-cage-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  display: inline-block;
}

.lr-reading-meter {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.lr-meter-track {
  height: 6px;
  border-radius: 999px;
  background: #ececec;
  overflow: hidden;
}

.lr-meter-fill {
  height: 100%;
  border-radius: inherit;
}

.lr-reading-chip-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.lr-reading-chip {
  border: 1px solid;
  border-radius: 10px;
  padding: 8px;
  background: #fcfcfc;
}

.lr-log-readings {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.lr-log-reading-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid;
  border-radius: 999px;
  padding: 4px 8px;
  background: #ffffff;
  font-size: 11px;
}

.lr-mini-card { display: flex; flex-direction: column; gap: 4px; padding: 10px; background: var(--color-mist); border: 1px solid var(--color-fence); border-radius: 10px; }
.lr-alert-row { display: flex; justify-content: space-between; gap: 10px; padding: 10px; margin-top: 8px; background: var(--color-mist); border: 1px solid var(--color-fence); border-radius: 10px; }

.lr-slot-layout {
  border: 1px solid var(--color-fence);
  border-radius: 10px;
  background: var(--color-fog);
  padding: 10px;
}

.lr-slot-layout.compact {
  padding: 8px;
}

.lr-slot-row {
  display: grid;
  grid-template-columns: 24px 1fr;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.lr-slot-row:last-child {
  margin-bottom: 0;
}

.lr-slot-label {
  color: var(--color-soil);
  font-size: 14px;
}

.lr-slot-cells {
  display: grid;
  grid-template-columns: repeat(10, minmax(0, 1fr));
  gap: 6px;
}

.lr-slot-cell {
  border: 1px solid var(--color-fence);
  border-radius: 6px;
  min-height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: var(--color-dust);
  background: #fff;
}

.lr-layout-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.lr-layout-cage {
  background: var(--color-mist);
  border: 1px solid var(--color-fence);
  border-radius: 10px;
  padding: 10px;
  cursor: grab;
}

.lr-layout-cage:active {
  cursor: grabbing;
}

.lr-layout-cage:hover {
  border-color: #000;
}

.lr-btn-primary { background: #1a1a1a; color: #ffffff; border-color: #1a1a1a; font-weight: 500; }
.lr-btn-primary:hover { background: #000000; color: #ffffff; }

.lr-bell-badge {
  position: absolute;
  top: -5px;
  right: -6px;
  min-width: 16px;
  height: 16px;
  border-radius: 999px;
  background: var(--color-clay);
  color: #fff;
  font-size: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.lr-badge-hero {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 999px;
  background: var(--color-straw-light);
  color: var(--color-soil);
  font-family: 'DM Mono', monospace;
}

.lr-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(59, 42, 26, 0.42);
  backdrop-filter: blur(2px);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 12px;
  z-index: 3000;
}

.lr-modal-card {
  width: min(760px, 100%);
  border: 1px solid var(--color-fence);
  border-radius: 12px;
  background: #fff;
  padding: 14px;
}

.lr-empty-state {
  border: 1px dashed var(--color-fence);
  border-radius: 10px;
  padding: 22px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: var(--color-dust);
}

.lr-toast-wrap {
  position: fixed;
  right: 16px;
  bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 4000;
}

.lr-toast {
  min-width: 260px;
  border-radius: 10px;
  padding: 10px 12px;
  border: 1px solid;
  background: #fff;
}
.lr-toast.success { border-color: #111111; color: #111111; background: #efefef; }
.lr-toast.warning { border-color: #2a2a2a; color: #2a2a2a; background: #f2f2f2; }
.lr-toast.error { border-color: #000000; color: #000000; background: #eaeaea; }

.chart-card .recharts-wrapper { font-size: 12px; }

@media (max-width: 1024px) {
  .lr-content { padding: 14px; }

  .lr-stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 960px) {
  .lr-app,
  .lr-app.is-collapsed {
    grid-template-columns: 1fr;
  }

  .lr-sidebar {
    position: fixed;
    left: 0;
    top: 0;
    transform: translateX(-100%);
    width: min(84vw, var(--sidebar-width));
    min-width: min(84vw, var(--sidebar-width));
    max-width: 320px;
    z-index: var(--sidebar-z);
  }

  .lr-sidebar.open {
    transform: translateX(0);
  }

  .lr-sidebar.collapsed {
    width: min(84vw, var(--sidebar-width));
    min-width: min(84vw, var(--sidebar-width));
  }

  .lr-sidebar.collapsed .lr-nav-item {
    width: 100%;
    grid-template-columns: 20px minmax(0, 1fr) auto;
    justify-items: stretch;
    padding: 0 12px;
    margin: 0;
  }

  .lr-sidebar.collapsed .lr-nav-item::before {
    left: 6px;
    top: 8px;
    bottom: 8px;
    width: 3px;
    height: auto;
    transform: none;
  }

  .lr-app.is-mobile .lr-sidebar .nav-label {
    opacity: 1;
    width: auto;
    max-width: 220px;
    transform: translateX(0);
    pointer-events: auto;
    visibility: visible;
  }

  .lr-app.is-mobile .lr-sidebar .lr-logo-wrap .nav-label {
    width: auto;
    opacity: 1;
    max-width: 220px;
    visibility: visible;
  }

  .lr-sidebar.collapsed .lr-sidebar-top {
    justify-content: space-between;
  }

  .lr-header {
    padding: 0 12px;
  }

  .lr-main {
    height: 100dvh;
  }

  .lr-header {
    position: fixed;
    left: 0;
    right: 0;
    top: 0;
    z-index: 1020;
    padding-top: env(safe-area-inset-top, 0px);
  }

  .lr-content {
    padding-top: calc(56px + env(safe-area-inset-top, 0px) + 10px);
    padding-bottom: calc(84px + env(safe-area-inset-bottom, 0px));
  }

  .lr-header-meta {
    gap: 6px;
  }

  .lr-header-meta span.small,
  .lr-header-meta .lr-pill {
    display: none;
  }

  .lr-mobile-tabbar {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1010;
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 2px;
    background: #ffffff;
    border-top: 1px solid var(--color-fence);
    padding: 8px 6px calc(8px + env(safe-area-inset-bottom, 0px));
  }

  .lr-mobile-tab {
    border: 0;
    background: transparent;
    border-radius: 10px;
    min-height: 52px;
    color: var(--color-dust);
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    font-size: 11px;
    font-weight: 600;
  }

  .lr-mobile-tab.active {
    color: var(--color-soil);
    background: var(--color-fog);
  }

  .lr-toast-wrap {
    bottom: calc(82px + env(safe-area-inset-bottom, 0px));
  }
}

@media (max-width: 800px) {
  .lr-stat-grid {
    grid-template-columns: none;
    grid-auto-flow: column;
    grid-auto-columns: minmax(220px, 1fr);
    overflow-x: auto;
    padding-bottom: 2px;
  }

  .lr-slot-cells {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }

  .lr-layout-grid {
    grid-template-columns: 1fr;
  }

  .lr-reading-chip-grid {
    grid-template-columns: 1fr;
  }

  .lr-cage-strip-list {
    grid-template-columns: 1fr;
  }
}
`;

export default App;
