"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import {
  Activity,
  Cpu,
  HardDrive,
  Database,
  Layers,
  Server,
  RefreshCw,
  Zap,
  Clock,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Download,
  Info,
  TrendingUp,
  Box,
  Terminal,
  RotateCcw,
  Camera,
  Image as ImageIcon
} from "lucide-react";
import { useToast } from "@/context/ToastContext";

interface MetricSnapshot {
  timestamp: string;
  cpuPercent: number;
  perCorePercent: number[];
  memoryUsedMb: number;
  memoryTotalMb: number;
  memoryPercent: number;
  heapUsedMb: number;
  heapTotalMb: number;
  rssMb: number;
  eventLoopLagMs: number;
  dbLatencyMs: number;
  redisLatencyMs: number;
  redisHitRatio: number;
  bullMqActive: number;
  bullMqWaiting: number;
}

interface SystemResourceMetrics {
  server: {
    hostname: string;
    platform: string;
    release: string;
    arch: string;
    cpuModel: string;
    cpuCores: number;
    uptimeSeconds: number;
    formattedUptime: string;
    nodeVersion: string;
    v8Version: string;
    processUptimeSeconds: number;
    pid: number;
  };
  cpu: {
    overallUsagePercent: number;
    perCoreUsagePercent: number[];
    loadAverage1m: number;
    loadAverage5m: number;
    loadAverage15m: number;
  };
  memory: {
    totalRamMb: number;
    freeRamMb: number;
    usedRamMb: number;
    usedRamPercent: number;
    nodeRssMb: number;
    nodeHeapUsedMb: number;
    nodeHeapTotalMb: number;
    nodeExternalMb: number;
    nodeArrayBuffersMb: number;
  };
  eventLoop: {
    lagMs: number;
    status: "OPTIMAL" | "MODERATE" | "DEGRADED";
  };
  database: {
    status: "CONNECTED" | "DISCONNECTED";
    latencyMs: number;
    sizeMb: number;
    activeConnections: number;
    tableCounts: {
      users: number;
      orders: number;
      products: number;
      auditLogs: number;
      reviews: number;
    };
  };
  redis: {
    status: "CONNECTED" | "DISCONNECTED";
    latencyMs: number;
    hits: number;
    misses: number;
    hitRatio: string;
    totalKeys: number;
    memoryUsedMb?: number;
  };
  queues: {
    maintenance: {
      waiting: number;
      active: number;
      completed: number;
      failed: number;
      delayed: number;
    };
    notification: {
      waiting: number;
      active: number;
      completed: number;
      failed: number;
      delayed: number;
    };
  };
  history: MetricSnapshot[];
}

export default function ResourceUsagePage() {
  const { showToast } = useToast();
  const [metrics, setMetrics] = useState<SystemResourceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(3); // Default 3s
  const [purgingCache, setPurgingCache] = useState(false);
  const [exportingPng, setExportingPng] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const dashboardRef = useRef<HTMLDivElement>(null);

  const fetchMetrics = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await api.get("/system/metrics");
      if (res.data?.success && res.data?.data) {
        setMetrics(res.data.data);
        setLastUpdated(new Date());
      }
    } catch (err: any) {
      console.error("Failed to fetch system resource metrics:", err);
      if (isManual) {
        showToast(err.response?.data?.message || "Failed to load telemetry", "error");
      }
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  useEffect(() => {
    if (autoRefreshInterval <= 0) return;
    const interval = setInterval(() => {
      fetchMetrics();
    }, autoRefreshInterval * 1000);
    return () => clearInterval(interval);
  }, [autoRefreshInterval]);

  const handlePurgeCache = async () => {
    if (!confirm("Are you sure you want to flush all Redis cache keys? This will trigger fresh database queries for cached endpoints.")) {
      return;
    }
    setPurgingCache(true);
    try {
      const res = await api.post("/system/purge-cache");
      showToast(res.data?.message || "Redis cache cleared!", "success");
      fetchMetrics(true);
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to purge cache", "error");
    } finally {
      setPurgingCache(false);
    }
  };

  const handleExportDiagnostics = () => {
    if (!metrics) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(metrics, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `sculptnshine-diagnostics-${new Date().toISOString()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast("System diagnostics JSON exported!", "success");
  };

  const handleExportPng = async () => {
    if (!metrics) {
      showToast("No telemetry data available to export", "error");
      return;
    }
    setExportingPng(true);

    try {
      // Create high-resolution 2400x1600 Canvas
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not initialize 2D Canvas context");

      const width = 2400;
      const height = 1600;
      canvas.width = width;
      canvas.height = height;

      // 1. Background
      ctx.fillStyle = "#0B0F19";
      ctx.fillRect(0, 0, width, height);

      // Top Accent Header Line
      const gradHeader = ctx.createLinearGradient(0, 0, width, 0);
      gradHeader.addColorStop(0, "#F59E0B");
      gradHeader.addColorStop(0.5, "#D97706");
      gradHeader.addColorStop(1, "#B45309");
      ctx.fillStyle = gradHeader;
      ctx.fillRect(0, 0, width, 8);

      // 2. Header
      ctx.fillStyle = "#F59E0B";
      ctx.font = "bold 24px 'Inter', sans-serif";
      ctx.fillText("⚡ SCULPT N SHINE INFRASTRUCTURE OBSERVABILITY", 60, 60);

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 38px 'Inter', sans-serif";
      ctx.fillText("System Resource Usage & Runtime Metrics", 60, 110);

      ctx.fillStyle = "#94A3B8";
      ctx.font = "20px 'Inter', sans-serif";
      ctx.fillText(
        `Host: ${metrics.server.hostname} (${metrics.server.platform} ${metrics.server.arch})  •  Node.js ${metrics.server.nodeVersion} (V8 ${metrics.server.v8Version})  •  Snapshot: ${new Date().toLocaleString()}`,
        60,
        145
      );

      // Status Badge
      ctx.fillStyle = "#064E3B";
      ctx.beginPath();
      ctx.roundRect(width - 260, 50, 200, 44, 22);
      ctx.fill();
      ctx.fillStyle = "#10B981";
      ctx.beginPath();
      ctx.arc(width - 235, 72, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#34D399";
      ctx.font = "bold 16px 'Inter', sans-serif";
      ctx.fillText("LIVE TELEMETRY", width - 215, 78);

      // Helper function to draw rounded cards
      const drawCard = (x: number, y: number, w: number, h: number, bg = "#131C2E", border = "#1E293B") => {
        ctx.fillStyle = bg;
        ctx.strokeStyle = border;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 16);
        ctx.fill();
        ctx.stroke();
      };

      // 3. Top 4 Stat Cards
      const cardY = 180;
      const cardW = 540;
      const cardH = 170;
      const gap = 33;

      // Card 1: CPU
      drawCard(60, cardY, cardW, cardH);
      ctx.fillStyle = "#F59E0B";
      ctx.font = "bold 18px 'Inter', sans-serif";
      ctx.fillText("CPU UTILIZATION", 90, cardY + 40);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 44px 'Inter', sans-serif";
      ctx.fillText(`${metrics.cpu.overallUsagePercent}%`, 90, cardY + 95);
      ctx.fillStyle = "#94A3B8";
      ctx.font = "18px 'Inter', sans-serif";
      ctx.fillText(`Cores: ${metrics.server.cpuCores}   •   Load: ${metrics.cpu.loadAverage1m.toFixed(2)} (1m)`, 90, cardY + 135);
      // Progress Bar
      ctx.fillStyle = "#1E293B";
      ctx.fillRect(350, cardY + 65, 220, 12);
      ctx.fillStyle = "#F59E0B";
      ctx.fillRect(350, cardY + 65, (Math.min(100, metrics.cpu.overallUsagePercent) / 100) * 220, 12);

      // Card 2: Memory
      const card2X = 60 + cardW + gap;
      drawCard(card2X, cardY, cardW, cardH);
      ctx.fillStyle = "#3B82F6";
      ctx.font = "bold 18px 'Inter', sans-serif";
      ctx.fillText("SYSTEM MEMORY (RAM)", card2X + 30, cardY + 40);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 44px 'Inter', sans-serif";
      ctx.fillText(`${metrics.memory.usedRamPercent}%`, card2X + 30, cardY + 95);
      ctx.fillStyle = "#94A3B8";
      ctx.font = "18px 'Inter', sans-serif";
      ctx.fillText(`Node RSS: ${metrics.memory.nodeRssMb} MB   •   Heap: ${metrics.memory.nodeHeapUsedMb} MB`, card2X + 30, cardY + 135);
      // Progress Bar
      ctx.fillStyle = "#1E293B";
      ctx.fillRect(card2X + 290, cardY + 65, 220, 12);
      ctx.fillStyle = "#3B82F6";
      ctx.fillRect(card2X + 290, cardY + 65, (Math.min(100, metrics.memory.usedRamPercent) / 100) * 220, 12);

      // Card 3: PostgreSQL
      const card3X = card2X + cardW + gap;
      drawCard(card3X, cardY, cardW, cardH);
      ctx.fillStyle = "#10B981";
      ctx.font = "bold 18px 'Inter', sans-serif";
      ctx.fillText("POSTGRESQL LATENCY", card3X + 30, cardY + 40);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 44px 'Inter', sans-serif";
      ctx.fillText(`${metrics.database.latencyMs} ms`, card3X + 30, cardY + 95);
      ctx.fillStyle = "#94A3B8";
      ctx.font = "18px 'Inter', sans-serif";
      ctx.fillText(`DB Size: ${metrics.database.sizeMb} MB   •   Pool: ${metrics.database.activeConnections} active`, card3X + 30, cardY + 135);
      // Status pill
      ctx.fillStyle = "#064E3B";
      ctx.beginPath();
      ctx.roundRect(card3X + 370, cardY + 25, 140, 30, 8);
      ctx.fill();
      ctx.fillStyle = "#34D399";
      ctx.font = "bold 14px 'Inter', sans-serif";
      ctx.fillText("CONNECTED", card3X + 395, cardY + 45);

      // Card 4: Redis & Tasks
      const card4X = card3X + cardW + gap;
      drawCard(card4X, cardY, cardW, cardH);
      ctx.fillStyle = "#F43F5E";
      ctx.font = "bold 18px 'Inter', sans-serif";
      ctx.fillText("REDIS CACHE & TASKS", card4X + 30, cardY + 40);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 44px 'Inter', sans-serif";
      ctx.fillText(metrics.redis.hitRatio, card4X + 30, cardY + 95);
      ctx.fillStyle = "#94A3B8";
      ctx.font = "18px 'Inter', sans-serif";
      ctx.fillText(`Ping: ${metrics.redis.latencyMs} ms   •   Active Tasks: ${(metrics.queues.maintenance.active || 0) + (metrics.queues.notification.active || 0)}`, card4X + 30, cardY + 135);
      // Status pill
      ctx.fillStyle = "#881337";
      ctx.beginPath();
      ctx.roundRect(card4X + 370, cardY + 25, 140, 30, 8);
      ctx.fill();
      ctx.fillStyle = "#FB7185";
      ctx.font = "bold 14px 'Inter', sans-serif";
      ctx.fillText("CONNECTED", card4X + 395, cardY + 45);

      // 4. Draw 4 Large Time-Series Graph Panels
      const drawGraphPanel = (
        gx: number,
        gy: number,
        gw: number,
        gh: number,
        title: string,
        data: number[],
        colorHex: string,
        unit = "%",
        minV = 0,
        maxV = 100
      ) => {
        drawCard(gx, gy, gw, gh);

        // Title
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 20px 'Inter', sans-serif";
        ctx.fillText(title, gx + 30, gy + 40);

        const latest = data[data.length - 1] ?? 0;
        const peak = Math.max(...data, 0);
        const min = Math.min(...data, 0);

        ctx.fillStyle = "#94A3B8";
        ctx.font = "16px 'Inter', sans-serif";
        ctx.fillText(`Min: ${min}${unit}   •   Peak: ${peak}${unit}   •   Live: ${latest}${unit}`, gx + gw - 320, gy + 40);

        // Chart bounds
        const cx = gx + 30;
        const cy = gy + 70;
        const cw = gw - 60;
        const ch = gh - 100;

        // Grid lines
        ctx.strokeStyle = "#1E293B";
        ctx.lineWidth = 1;
        for (let i = 1; i <= 3; i++) {
          const gyLine = cy + (ch / 4) * i;
          ctx.beginPath();
          ctx.moveTo(cx, gyLine);
          ctx.lineTo(cx + cw, gyLine);
          ctx.stroke();
        }

        if (!data || data.length === 0) return;

        const safeMax = Math.max(maxV, ...data, 1);
        const range = safeMax - minV || 1;

        const pts = data.map((val, idx) => {
          const px = cx + (idx / Math.max(1, data.length - 1)) * cw;
          const norm = Math.max(0, Math.min(1, (val - minV) / range));
          const py = cy + ch - norm * ch;
          return { x: px, y: py };
        });

        // Area path
        const grad = ctx.createLinearGradient(0, cy, 0, cy + ch);
        grad.addColorStop(0, colorHex + "66");
        grad.addColorStop(1, colorHex + "05");

        ctx.beginPath();
        ctx.moveTo(pts[0].x, cy + ch);
        pts.forEach((p) => ctx.lineTo(p.x, p.y));
        ctx.lineTo(pts[pts.length - 1].x, cy + ch);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();

        // Stroke line
        ctx.beginPath();
        pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
        ctx.strokeStyle = colorHex;
        ctx.lineWidth = 3.5;
        ctx.stroke();

        // Glowing Live Dot
        const lastPt = pts[pts.length - 1];
        ctx.fillStyle = colorHex;
        ctx.beginPath();
        ctx.arc(lastPt.x, lastPt.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 2;
        ctx.stroke();
      };

      const gY = 380;
      const gW = 1120;
      const gH = 340;

      // Chart 1: CPU
      drawGraphPanel(60, gY, gW, gH, "CPU Utilization Over Time (%)", history.map((h) => h.cpuPercent), "#F59E0B", "%", 0, 100);

      // Chart 2: Memory
      drawGraphPanel(60 + gW + 40, gY, gW, gH, "Node.js V8 Heap Used (MB)", history.map((h) => h.heapUsedMb), "#3B82F6", " MB", 0, metrics.memory.nodeHeapTotalMb || 400);

      // Chart 3: DB Latency
      const gY2 = gY + gH + 30;
      drawGraphPanel(60, gY2, gW, gH, "PostgreSQL Query Latency (ms)", history.map((h) => h.dbLatencyMs), "#10B981", " ms", 0, 50);

      // Chart 4: Redis Hit Rate
      drawGraphPanel(60 + gW + 40, gY2, gW, gH, "Redis Cache Hit Ratio Stream (%)", history.map((h) => h.redisHitRatio), "#F43F5E", "%", 0, 100);

      // 5. Bottom 3 Diagnostic Panels
      const pY = gY2 + gH + 30;
      const pW = 733;
      const pH = 400;

      // Panel 1: Host Specs
      drawCard(60, pY, pW, pH);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 20px 'Inter', sans-serif";
      ctx.fillText("Host & Runtime Telemetry", 90, pY + 45);

      const specs = [
        ["Hostname", metrics.server.hostname],
        ["Platform / Arch", `${metrics.server.platform} (${metrics.server.arch})`],
        ["Kernel Release", metrics.server.release],
        ["Node.js Engine", `${metrics.server.nodeVersion} (V8 ${metrics.server.v8Version})`],
        ["Process PID", String(metrics.server.pid)],
        ["Process Uptime", `${Math.floor(metrics.server.processUptimeSeconds / 60)} min`],
        ["Host Uptime", metrics.server.formattedUptime],
      ];

      ctx.font = "17px 'Inter', sans-serif";
      specs.forEach(([k, v], idx) => {
        const rowY = pY + 95 + idx * 40;
        ctx.fillStyle = "#94A3B8";
        ctx.fillText(k, 90, rowY);
        ctx.fillStyle = "#F8FAFC";
        ctx.fillText(v, 400, rowY);
        ctx.strokeStyle = "#1E293B";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(90, rowY + 12);
        ctx.lineTo(730, rowY + 12);
        ctx.stroke();
      });

      // Panel 2: Table Ledger
      const p2X = 60 + pW + 40;
      drawCard(p2X, pY, pW, pH);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 20px 'Inter', sans-serif";
      ctx.fillText("PostgreSQL Table Distribution", p2X + 30, pY + 45);

      const tables = Object.entries(metrics.database.tableCounts || {});
      tables.forEach(([tbl, cnt], idx) => {
        const rowY = pY + 95 + idx * 55;
        ctx.fillStyle = "#94A3B8";
        ctx.font = "bold 17px 'Inter', sans-serif";
        ctx.fillText(tbl.toUpperCase(), p2X + 30, rowY);
        ctx.fillStyle = "#34D399";
        ctx.fillText(`${cnt.toLocaleString()} rows`, p2X + pW - 170, rowY);

        ctx.fillStyle = "#1E293B";
        ctx.fillRect(p2X + 30, rowY + 12, pW - 60, 10);
        ctx.fillStyle = "#10B981";
        ctx.fillRect(p2X + 30, rowY + 12, Math.min(pW - 60, (cnt / 500) * (pW - 60)), 10);
      });

      // Panel 3: BullMQ Queues
      const p3X = p2X + pW + 40;
      drawCard(p3X, pY, pW, pH);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 20px 'Inter', sans-serif";
      ctx.fillText("BullMQ Worker Queues", p3X + 30, pY + 45);

      // maintenanceQueue
      ctx.fillStyle = "#1E293B";
      ctx.fillRect(p3X + 30, pY + 80, pW - 60, 130);
      ctx.fillStyle = "#F59E0B";
      ctx.font = "bold 18px 'Inter', sans-serif";
      ctx.fillText("maintenanceQueue (Daily 03:00 AM Cron)", p3X + 50, pY + 115);
      ctx.fillStyle = "#94A3B8";
      ctx.font = "16px 'Inter', sans-serif";
      ctx.fillText(`Active: ${metrics.queues.maintenance.active}   •   Waiting: ${metrics.queues.maintenance.waiting}   •   Completed: ${metrics.queues.maintenance.completed}`, p3X + 50, pY + 160);

      // notificationQueue
      ctx.fillStyle = "#1E293B";
      ctx.fillRect(p3X + 30, pY + 230, pW - 60, 130);
      ctx.fillStyle = "#3B82F6";
      ctx.font = "bold 18px 'Inter', sans-serif";
      ctx.fillText("notificationQueue (Event-Driven)", p3X + 50, pY + 265);
      ctx.fillStyle = "#94A3B8";
      ctx.font = "16px 'Inter', sans-serif";
      ctx.fillText(`Active: ${metrics.queues.notification.active}   •   Waiting: ${metrics.queues.notification.waiting}   •   Completed: ${metrics.queues.notification.completed}`, p3X + 50, pY + 310);

      // 6. Trigger Download
      const dataUrl = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.href = dataUrl;
      downloadLink.download = `sculptnshine-system-metrics-${new Date().toISOString().replace(/[:.]/g, "-")}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      showToast("System metrics report PNG generated & downloaded!", "success");
    } catch (err: any) {
      console.error("Failed to generate PNG screenshot:", err);
      showToast("Failed to generate PNG report", "error");
    } finally {
      setExportingPng(false);
    }
  };

  // Helper to render smooth SVG Sparkline / Area Chart
  const renderAreaChart = (
    data: number[],
    colorHex: string,
    fillId: string,
    minVal = 0,
    maxVal = 100,
    unit = "%"
  ) => {
    if (!data || data.length === 0) {
      return <div className="h-28 flex items-center justify-center text-gray-400 text-xs">Awaiting data stream...</div>;
    }

    const width = 340;
    const height = 90;
    const padding = 6;
    const safeMax = Math.max(maxVal, ...data, 1);
    const range = safeMax - minVal || 1;

    const points = data.map((val, idx) => {
      const x = padding + (idx / Math.max(1, data.length - 1)) * (width - 2 * padding);
      const normalized = Math.max(0, Math.min(1, (val - minVal) / range));
      const y = height - padding - normalized * (height - 2 * padding);
      return { x, y, val };
    });

    const pathD = points.reduce((acc, pt, i) => {
      return i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
    }, "");

    const areaD = `${pathD} L ${points[points.length - 1].x},${height} L ${points[0].x},${height} Z`;

    const latest = data[data.length - 1] ?? 0;
    const peak = Math.max(...data);
    const min = Math.min(...data);

    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px] font-mono text-gray-500 dark:text-gray-400">
          <span>Min: <b className="text-gray-800 dark:text-gray-200">{min}{unit}</b></span>
          <span>Peak: <b className="text-gray-800 dark:text-gray-200">{peak}{unit}</b></span>
          <span>Live: <b style={{ color: colorHex }}>{latest}{unit}</b></span>
        </div>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-24 overflow-visible">
          <defs>
            <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colorHex} stopOpacity="0.45" />
              <stop offset="100%" stopColor={colorHex} stopOpacity="0.01" />
            </linearGradient>
          </defs>
          {/* Subtle Grid Lines */}
          <line x1="0" y1={height / 4} x2={width} y2={height / 4} stroke="currentColor" className="text-gray-100 dark:text-white/[0.06]" strokeDasharray="3,3" />
          <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="currentColor" className="text-gray-100 dark:text-white/[0.06]" strokeDasharray="3,3" />
          <line x1="0" y1={(3 * height) / 4} x2={width} y2={(3 * height) / 4} stroke="currentColor" className="text-gray-100 dark:text-white/[0.06]" strokeDasharray="3,3" />

          {/* Area Fill */}
          <path d={areaD} fill={`url(#${fillId})`} />
          {/* Stroke Line */}
          <path d={pathD} fill="none" stroke={colorHex} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />

          {/* Glowing Current Point Dot */}
          {points.length > 0 && (
            <circle
              cx={points[points.length - 1].x}
              cy={points[points.length - 1].y}
              r="4"
              fill={colorHex}
              stroke="#ffffff"
              strokeWidth="2"
              className="animate-pulse"
            />
          )}
        </svg>
      </div>
    );
  };

  if (loading && !metrics) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="h-10 w-64 bg-gray-200 animate-pulse rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-36 bg-gray-100 animate-pulse rounded-2xl border border-gray-200" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-gray-100 animate-pulse rounded-2xl" />
          <div className="h-80 bg-gray-100 animate-pulse rounded-2xl" />
        </div>
      </div>
    );
  }

  const history = metrics?.history || [];
  const cpuHistory = history.map((h) => h.cpuPercent);
  const heapHistory = history.map((h) => h.heapUsedMb);
  const dbLatencyHistory = history.map((h) => h.dbLatencyMs);
  const redisHitHistory = history.map((h) => h.redisHitRatio);

  return (
    <div ref={dashboardRef} className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 bg-transparent">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-gold-500 to-amber-400 flex items-center justify-center text-white shadow-lg shadow-gold-500/20">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">System Resource Usage</h1>
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                  Live Telemetry
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Real-time CPU, RAM, Node runtime, PostgreSQL, Redis, and BullMQ cluster telemetry.</p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Auto Refresh Selector */}
          <div className="flex items-center bg-white dark:bg-[#13192B] border border-gray-200 dark:border-white/[0.08] rounded-xl px-3 py-2 shadow-xs text-xs font-medium text-gray-700 dark:text-gray-300 gap-2">
            <Clock className="h-3.5 w-3.5 text-gold-500" />
            <span>Poll Rate:</span>
            <select
              value={autoRefreshInterval}
              onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
              className="bg-transparent font-bold text-gray-900 dark:text-white outline-none cursor-pointer"
            >
              <option value={2} className="dark:bg-[#13192B] dark:text-white">2s (Ultra Live)</option>
              <option value={3} className="dark:bg-[#13192B] dark:text-white">3s (Standard)</option>
              <option value={5} className="dark:bg-[#13192B] dark:text-white">5s</option>
              <option value={10} className="dark:bg-[#13192B] dark:text-white">10s</option>
              <option value={30} className="dark:bg-[#13192B] dark:text-white">30s</option>
              <option value={0} className="dark:bg-[#13192B] dark:text-white">Paused</option>
            </select>
          </div>

          {/* Manual Refresh Button */}
          <button
            onClick={() => fetchMetrics(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 bg-white dark:bg-[#13192B] border border-gray-200 dark:border-white/[0.08] hover:bg-gray-50 dark:hover:bg-[#1C253C] text-gray-700 dark:text-gray-200 font-semibold px-3 py-2 rounded-xl text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-60"
            title="Refresh snapshot now"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-gold-500" : ""}`} />
            <span>{refreshing ? "Syncing..." : "Sync"}</span>
          </button>

          {/* Purge Cache Button */}
          <button
            onClick={handlePurgeCache}
            disabled={purgingCache}
            className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-900 dark:text-amber-300 font-semibold px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-60"
            title="Flush all keys in Redis"
          >
            <Zap className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            <span>{purgingCache ? "Flushing..." : "Flush Cache"}</span>
          </button>

          {/* Export PNG */}
          <button
            onClick={handleExportPng}
            disabled={exportingPng}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-950/70 dark:hover:bg-emerald-900/80 dark:border dark:border-emerald-500/50 text-white dark:text-emerald-300 font-semibold px-3.5 py-2 rounded-xl text-xs shadow-sm transition-colors cursor-pointer disabled:opacity-60"
            title="Download full dashboard screenshot as PNG"
          >
            {exportingPng ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Camera className="h-3.5 w-3.5" />
            )}
            <span>{exportingPng ? "Capturing..." : "Export PNG"}</span>
          </button>

          {/* Export JSON */}
          <button
            onClick={handleExportDiagnostics}
            className="flex items-center gap-1.5 bg-gray-900 hover:bg-black dark:bg-[#1E2638] dark:hover:bg-[#2A354C] dark:border dark:border-white/[0.1] text-white dark:text-gray-100 font-semibold px-3.5 py-2 rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
            title="Download full diagnostics payload"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Top 4 Live Stat Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* 1. CPU Usage */}
        <div className="bg-white dark:bg-[#101524] p-5 rounded-2xl border border-gray-200 dark:border-white/[0.08] shadow-xs flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">CPU Utilization</span>
            <div className="h-8 w-8 rounded-xl bg-gold-50 dark:bg-gold-950/50 text-gold-600 dark:text-gold-400 flex items-center justify-center">
              <Cpu className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
                {metrics?.cpu.overallUsagePercent ?? 0}%
              </span>
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                (metrics?.cpu.overallUsagePercent ?? 0) < 50
                  ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                  : (metrics?.cpu.overallUsagePercent ?? 0) < 80
                  ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
                  : "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300"
              }`}>
                {(metrics?.cpu.overallUsagePercent ?? 0) < 50 ? "Optimal" : (metrics?.cpu.overallUsagePercent ?? 0) < 80 ? "Moderate" : "Heavy Load"}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 mt-2 font-mono">
              <span>Cores: <b className="text-gray-800 dark:text-gray-200">{metrics?.server.cpuCores ?? 1}</b></span>
              <span>Load: <b className="text-gray-800 dark:text-gray-200">{metrics?.cpu.loadAverage1m.toFixed(2)}</b> (1m)</span>
            </div>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-gold-500 to-amber-500 transition-all duration-500"
              style={{ width: `${Math.min(100, metrics?.cpu.overallUsagePercent ?? 0)}%` }}
            />
          </div>
        </div>

        {/* 2. Memory (RAM & Heap) */}
        <div className="bg-white dark:bg-[#101524] p-5 rounded-2xl border border-gray-200 dark:border-white/[0.08] shadow-xs flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">System Memory (RAM)</span>
            <div className="h-8 w-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <HardDrive className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
                {metrics?.memory.usedRamPercent ?? 0}%
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium font-mono">
                {metrics?.memory.usedRamMb}MB / {metrics?.memory.totalRamMb}MB
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 mt-2 font-mono">
              <span>Node RSS: <b className="text-gray-800 dark:text-gray-200">{metrics?.memory.nodeRssMb}MB</b></span>
              <span>Heap: <b className="text-gray-800 dark:text-gray-200">{metrics?.memory.nodeHeapUsedMb}MB</b></span>
            </div>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
              style={{ width: `${Math.min(100, metrics?.memory.usedRamPercent ?? 0)}%` }}
            />
          </div>
        </div>

        {/* 3. PostgreSQL Database */}
        <div className="bg-white dark:bg-[#101524] p-5 rounded-2xl border border-gray-200 dark:border-white/[0.08] shadow-xs flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">PostgreSQL Latency</span>
            <div className="h-8 w-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Database className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
                {metrics?.database.latencyMs ?? 0} <span className="text-sm font-bold text-gray-500 dark:text-gray-400">ms</span>
              </span>
              <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                {metrics?.database.status}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 mt-2 font-mono">
              <span>DB Size: <b className="text-gray-800 dark:text-gray-200">{metrics?.database.sizeMb ?? 0} MB</b></span>
              <span>Pool: <b className="text-gray-800 dark:text-gray-200">{metrics?.database.activeConnections} active</b></span>
            </div>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(5, ((metrics?.database.latencyMs || 1) / 30) * 100))}%` }}
            />
          </div>
        </div>

        {/* 4. Redis & BullMQ Queues */}
        <div className="bg-white dark:bg-[#101524] p-5 rounded-2xl border border-gray-200 dark:border-white/[0.08] shadow-xs flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Redis Cache & Tasks</span>
            <div className="h-8 w-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Zap className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
                {metrics?.redis.hitRatio || "100%"}
              </span>
              <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                {metrics?.redis.status}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 mt-2 font-mono">
              <span>Ping: <b className="text-gray-800 dark:text-gray-200">{metrics?.redis.latencyMs} ms</b></span>
              <span>BullMQ: <b className="text-gray-800 dark:text-gray-200">{(metrics?.queues.maintenance.active || 0) + (metrics?.queues.notification.active || 0)} active</b></span>
            </div>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-rose-500 to-pink-500 transition-all duration-500"
              style={{ width: `${Math.min(100, parseFloat(metrics?.redis.hitRatio || "100") || 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 4 Real-time Interactive SVG Grafana-Style Live Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: CPU Workload Trend */}
        <div className="bg-white dark:bg-[#101524] p-6 rounded-2xl border border-gray-200 dark:border-white/[0.08] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/[0.06] pb-3">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-gold-500" />
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">CPU Utilization Over Time</h3>
            </div>
            <span className="text-[11px] font-mono text-gray-400">Sample window: 30 ticks</span>
          </div>
          {renderAreaChart(cpuHistory, "#F59E0B", "cpuGradient", 0, 100, "%")}
          <div className="pt-2 border-t border-gray-100 dark:border-white/[0.06] flex flex-wrap gap-2 text-xs">
            {metrics?.cpu.perCoreUsagePercent?.map((coreLoad, idx) => (
              <span key={idx} className="px-2 py-1 rounded-lg bg-gray-50 dark:bg-[#151C2F] border border-gray-200 dark:border-white/[0.06] text-gray-700 dark:text-gray-300 font-mono text-[11px]">
                Core {idx}: <b className={coreLoad > 70 ? "text-rose-600 dark:text-rose-400" : "text-gray-900 dark:text-white"}>{coreLoad}%</b>
              </span>
            ))}
          </div>
        </div>

        {/* Chart 2: Node.js Memory Heap Allocation */}
        <div className="bg-white dark:bg-[#101524] p-6 rounded-2xl border border-gray-200 dark:border-white/[0.08] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/[0.06] pb-3">
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-blue-500" />
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">Node.js V8 Heap Used (MB)</h3>
            </div>
            <span className="text-[11px] font-mono text-gray-400">Total Heap: {metrics?.memory.nodeHeapTotalMb} MB</span>
          </div>
          {renderAreaChart(heapHistory, "#3B82F6", "heapGradient", 0, metrics?.memory.nodeHeapTotalMb || 300, " MB")}
          <div className="pt-2 border-t border-gray-100 dark:border-white/[0.06] flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 font-mono">
            <span>Process RSS: <b className="text-gray-900 dark:text-gray-200">{metrics?.memory.nodeRssMb} MB</b></span>
            <span>External: <b className="text-gray-900 dark:text-gray-200">{metrics?.memory.nodeExternalMb} MB</b></span>
            <span>ArrayBuffers: <b className="text-gray-900 dark:text-gray-200">{metrics?.memory.nodeArrayBuffersMb} MB</b></span>
          </div>
        </div>

        {/* Chart 3: Database Latency & Event Loop Lag */}
        <div className="bg-white dark:bg-[#101524] p-6 rounded-2xl border border-gray-200 dark:border-white/[0.08] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/[0.06] pb-3">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-emerald-500" />
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">Database Response Latency (ms)</h3>
            </div>
            <span className="text-[11px] font-mono text-gray-400">Event Loop Lag: {metrics?.eventLoop.lagMs} ms ({metrics?.eventLoop.status})</span>
          </div>
          {renderAreaChart(dbLatencyHistory, "#10B981", "dbGradient", 0, 50, " ms")}
          <div className="pt-2 border-t border-gray-100 dark:border-white/[0.06] flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 font-mono">
            <span>PostgreSQL Status: <b className="text-emerald-600 dark:text-emerald-400">{metrics?.database.status}</b></span>
            <span>Active Connections: <b className="text-gray-900 dark:text-gray-200">{metrics?.database.activeConnections}</b></span>
            <span>Database Size: <b className="text-gray-900 dark:text-gray-200">{metrics?.database.sizeMb} MB</b></span>
          </div>
        </div>

        {/* Chart 4: Redis Cache Hit Ratio Stream */}
        <div className="bg-white dark:bg-[#101524] p-6 rounded-2xl border border-gray-200 dark:border-white/[0.08] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/[0.06] pb-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-rose-500" />
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">Redis Cache Hit Ratio Stream (%)</h3>
            </div>
            <span className="text-[11px] font-mono text-gray-400">Hits: {metrics?.redis.hits} | Misses: {metrics?.redis.misses}</span>
          </div>
          {renderAreaChart(redisHitHistory, "#F43F5E", "redisGradient", 0, 100, "%")}
          <div className="pt-2 border-t border-gray-100 dark:border-white/[0.06] flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 font-mono">
            <span>Redis Ping: <b className="text-gray-900 dark:text-gray-200">{metrics?.redis.latencyMs} ms</b></span>
            <span>Key Prefix: <b className="text-gray-900 dark:text-gray-200">sns:*</b></span>
            <span>Active Keys: <b className="text-gray-900 dark:text-gray-200">{metrics?.redis.totalKeys}</b></span>
          </div>
        </div>
      </div>

      {/* Diagnostic Telemetry Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hardware & Process Specs */}
        <div className="bg-white dark:bg-[#101524] p-6 rounded-2xl border border-gray-200 dark:border-white/[0.08] shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 dark:border-white/[0.06] pb-3">
            <Server className="h-4 w-4 text-gray-700 dark:text-gray-300" />
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">Host & Runtime Specs</h3>
          </div>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-gray-50 dark:border-white/[0.04]">
              <span className="text-gray-500 dark:text-gray-400">Hostname</span>
              <span className="font-mono font-bold text-gray-900 dark:text-white">{metrics?.server.hostname}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-50 dark:border-white/[0.04]">
              <span className="text-gray-500 dark:text-gray-400">OS Platform</span>
              <span className="font-mono font-bold text-gray-900 dark:text-white">{metrics?.server.platform} ({metrics?.server.arch})</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-50 dark:border-white/[0.04]">
              <span className="text-gray-500 dark:text-gray-400">Kernel Release</span>
              <span className="font-mono font-bold text-gray-900 dark:text-white">{metrics?.server.release}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-50 dark:border-white/[0.04]">
              <span className="text-gray-500 dark:text-gray-400">Node.js Engine</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{metrics?.server.nodeVersion} (V8 {metrics?.server.v8Version})</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-50 dark:border-white/[0.04]">
              <span className="text-gray-500 dark:text-gray-400">Process PID</span>
              <span className="font-mono font-bold text-gray-900 dark:text-white">{metrics?.server.pid}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-500 dark:text-gray-400">Host Uptime</span>
              <span className="font-mono font-bold text-gray-900 dark:text-white">{metrics?.server.formattedUptime}</span>
            </div>
          </div>
        </div>

        {/* Database Table Distribution */}
        <div className="bg-white dark:bg-[#101524] p-6 rounded-2xl border border-gray-200 dark:border-white/[0.08] shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 dark:border-white/[0.06] pb-3">
            <Database className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">PostgreSQL Table Record Distribution</h3>
          </div>
          <div className="space-y-3 text-xs">
            {metrics?.database.tableCounts &&
              Object.entries(metrics.database.tableCounts).map(([table, count]) => (
                <div key={table} className="space-y-1">
                  <div className="flex justify-between font-mono">
                    <span className="uppercase text-gray-600 dark:text-gray-400 font-bold">{table}</span>
                    <span className="text-gray-900 dark:text-white font-bold">{count.toLocaleString()} rows</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${Math.min(100, Math.max(3, (count / 500) * 100))}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* BullMQ Background Workers */}
        <div className="bg-white dark:bg-[#101524] p-6 rounded-2xl border border-gray-200 dark:border-white/[0.08] shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 dark:border-white/[0.06] pb-3">
            <Layers className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">BullMQ Worker Queues</h3>
          </div>
          <div className="space-y-4 text-xs">
            {/* Maintenance Queue */}
            <div className="p-3 bg-gray-50 dark:bg-[#151C2F] rounded-xl border border-gray-200 dark:border-white/[0.06] space-y-2">
              <div className="flex justify-between items-center font-bold text-gray-900 dark:text-white">
                <span>maintenanceQueue</span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px]">Daily 03:00 AM Cron</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center font-mono text-[11px]">
                <div className="bg-white dark:bg-[#101524] p-1.5 rounded-lg border border-gray-100 dark:border-white/[0.06]">
                  <span className="text-gray-400 block text-[9px]">ACTIVE</span>
                  <b className="text-gray-900 dark:text-white">{metrics?.queues.maintenance.active}</b>
                </div>
                <div className="bg-white dark:bg-[#101524] p-1.5 rounded-lg border border-gray-100 dark:border-white/[0.06]">
                  <span className="text-gray-400 block text-[9px]">WAITING</span>
                  <b className="text-gray-900 dark:text-white">{metrics?.queues.maintenance.waiting}</b>
                </div>
                <div className="bg-white dark:bg-[#101524] p-1.5 rounded-lg border border-gray-100 dark:border-white/[0.06]">
                  <span className="text-gray-400 block text-[9px]">COMPLETED</span>
                  <b className="text-emerald-600 dark:text-emerald-400">{metrics?.queues.maintenance.completed}</b>
                </div>
              </div>
            </div>

            {/* Notification Queue */}
            <div className="p-3 bg-gray-50 dark:bg-[#151C2F] rounded-xl border border-gray-200 dark:border-white/[0.06] space-y-2">
              <div className="flex justify-between items-center font-bold text-gray-900 dark:text-white">
                <span>notificationQueue</span>
                <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 text-[10px]">Event-driven</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center font-mono text-[11px]">
                <div className="bg-white dark:bg-[#101524] p-1.5 rounded-lg border border-gray-100 dark:border-white/[0.06]">
                  <span className="text-gray-400 block text-[9px]">ACTIVE</span>
                  <b className="text-gray-900 dark:text-white">{metrics?.queues.notification.active}</b>
                </div>
                <div className="bg-white dark:bg-[#101524] p-1.5 rounded-lg border border-gray-100 dark:border-white/[0.06]">
                  <span className="text-gray-400 block text-[9px]">WAITING</span>
                  <b className="text-gray-900 dark:text-white">{metrics?.queues.notification.waiting}</b>
                </div>
                <div className="bg-white dark:bg-[#101524] p-1.5 rounded-lg border border-gray-100 dark:border-white/[0.06]">
                  <span className="text-gray-400 block text-[9px]">COMPLETED</span>
                  <b className="text-blue-600 dark:text-blue-400">{metrics?.queues.notification.completed}</b>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
