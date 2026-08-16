"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Activity,
  FileText,
  RefreshCw,
  Download,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Eye,
  Copy,
  Calendar,
  Layers,
  ShoppingCart,
  CreditCard,
  Package,
  ShieldCheck,
  Tag,
  User,
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { auditAPI, AuditLogItem, AuditLogStats } from "@/lib/api/audit";
import Pagination from "@/components/Pagination";
import toast from "react-hot-toast";

const ENTITY_OPTIONS = [
  { label: "All Entities", value: "ALL" },
  { label: "Orders", value: "Order" },
  { label: "Payments", value: "Payment" },
  { label: "Products", value: "Product" },
  { label: "Categories", value: "Category" },
  { label: "Subcategories", value: "Subcategory" },
  { label: "Brands", value: "Brand" },
  { label: "Catalog Search & Filters", value: "CatalogSearch" },
  { label: "Coupons", value: "Coupon" },
  { label: "Auth & Security", value: "Auth" },
  { label: "Support Tickets", value: "SupportTicket" },
];

const STATUS_OPTIONS = [
  { label: "All Statuses", value: "ALL" },
  { label: "Success", value: "SUCCESS" },
  { label: "Failed", value: "FAILED" },
  { label: "Warning", value: "WARNING" },
  { label: "Info", value: "INFO" },
];

export default function JournalLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [stats, setStats] = useState<AuditLogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedEntity, setSelectedEntity] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [dateRange, setDateRange] = useState<"ALL" | "TODAY" | "7D" | "30D">("ALL");
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(0);

  // Selected Log for Details Modal
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const res = await auditAPI.getStats();
      if (res.success) {
        setStats(res.data);
      }
    } catch (err: any) {
      console.error("Failed to fetch journal stats:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        limit,
        search: search.trim() || undefined,
        entity: selectedEntity !== "ALL" ? selectedEntity : undefined,
        status: selectedStatus !== "ALL" ? selectedStatus : undefined,
      };

      if (dateRange === "TODAY") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        params.startDate = today.toISOString();
      } else if (dateRange === "7D") {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        params.startDate = d.toISOString();
      } else if (dateRange === "30D") {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        params.startDate = d.toISOString();
      }

      const res = await auditAPI.getLogs(params);
      if (res.success) {
        setLogs(res.data.logs);
        setTotalPages(res.data.pagination.totalPages || 1);
        setTotalCount(res.data.pagination.total || 0);
      }
    } catch (err: any) {
      toast.error("Failed to load journal logs");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, selectedEntity, selectedStatus, dateRange]);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Auto-refresh timer
  useEffect(() => {
    if (autoRefreshInterval <= 0) return;

    const interval = setInterval(() => {
      fetchLogs();
      fetchStats();
    }, autoRefreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefreshInterval, fetchLogs]);

  const handleCopyDetails = (details: any) => {
    navigator.clipboard.writeText(JSON.stringify(details, null, 2));
    toast.success("Payload copied to clipboard");
  };

  const handleExport = () => {
    const params: any = {
      search: search.trim() || undefined,
      entity: selectedEntity !== "ALL" ? selectedEntity : undefined,
      status: selectedStatus !== "ALL" ? selectedStatus : undefined,
    };
    if (dateRange === "TODAY") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      params.startDate = today.toISOString();
    } else if (dateRange === "7D") {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      params.startDate = d.toISOString();
    } else if (dateRange === "30D") {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      params.startDate = d.toISOString();
    }

    const url = auditAPI.getExportUrl(params);
    window.open(url, "_blank");
    toast.success("Exporting journal logs CSV");
  };

  const getEntityIcon = (entity: string) => {
    switch (entity) {
      case "Order":
        return <ShoppingCart className="h-4 w-4 text-blue-500" />;
      case "Payment":
        return <CreditCard className="h-4 w-4 text-emerald-500" />;
      case "Product":
        return <Package className="h-4 w-4 text-amber-500" />;
      case "Category":
      case "Subcategory":
        return <Layers className="h-4 w-4 text-purple-500" />;
      case "Brand":
        return <Tag className="h-4 w-4 text-pink-500" />;
      case "Auth":
        return <ShieldCheck className="h-4 w-4 text-indigo-500" />;
      case "CatalogSearch":
        return <Search className="h-4 w-4 text-cyan-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" /> Success
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="h-3 w-3" /> Failed
          </span>
        );
      case "WARNING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="h-3 w-3" /> Warning
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Info className="h-3 w-3" /> Info
          </span>
        );
    }
  };

  const formatActionName = (action: string) => {
    return action.replace(/_/g, " ");
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Journal & Audit Logs</h1>
              <p className="text-sm text-gray-500">Live immutable database event ledger for orders, payments, products & security.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Auto Refresh Selector */}
          <div className="flex items-center bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm text-xs font-medium text-gray-700 gap-2">
            <Activity className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
            <span>Auto Refresh:</span>
            <select
              value={autoRefreshInterval}
              onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
              className="bg-transparent font-semibold text-gray-900 outline-none cursor-pointer"
            >
              <option value={0}>Off</option>
              <option value={10}>10s</option>
              <option value={30}>30s</option>
              <option value={60}>60s</option>
            </select>
          </div>

          <button
            onClick={() => {
              fetchLogs();
              fetchStats();
              toast.success("Logs refreshed");
            }}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium text-xs shadow-sm transition-all duration-200 active:scale-95"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-medium text-xs shadow-md shadow-amber-500/20 transition-all duration-200 active:scale-95"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Recorded Events</span>
            <div className="text-2xl font-extrabold text-gray-900">
              {statsLoading ? "..." : (stats?.total || 0).toLocaleString()}
            </div>
            <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
              +{stats?.todayCount || 0} today
            </span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Activity className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Orders & Payments</span>
            <div className="text-2xl font-extrabold text-gray-900">
              {statsLoading ? "..." : (stats?.orderAndPaymentCount || 0).toLocaleString()}
            </div>
            <span className="text-xs font-medium text-gray-400">Checkout & webhooks</span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <ShoppingCart className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Catalog & Searches</span>
            <div className="text-2xl font-extrabold text-gray-900">
              {statsLoading ? "..." : (stats?.catalogCount || 0).toLocaleString()}
            </div>
            <span className="text-xs font-medium text-gray-400">Products, categories, queries</span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Package className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Security & Failures</span>
            <div className="text-2xl font-extrabold text-gray-900">
              {statsLoading ? "..." : (stats?.failureCount || 0).toLocaleString()}
            </div>
            <span className="text-xs font-medium text-rose-600">
              {stats?.authCount || 0} auth operations
            </span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <ShieldCheck className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Search Bar */}
          <div className="lg:col-span-4 relative">
            <Search className="h-4 w-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search action, entity, user email, ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            />
          </div>

          {/* Entity Dropdown */}
          <div className="lg:col-span-3">
            <select
              value={selectedEntity}
              onChange={(e) => {
                setSelectedEntity(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer"
            >
              {ENTITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="lg:col-span-2">
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Presets */}
          <div className="lg:col-span-3 flex items-center bg-gray-50 border border-gray-200 rounded-xl p-1 text-xs">
            {(["ALL", "TODAY", "7D", "30D"] as const).map((r) => (
              <button
                key={r}
                onClick={() => {
                  setDateRange(r);
                  setPage(1);
                }}
                className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                  dateRange === r
                    ? "bg-white text-gray-900 shadow-sm border border-gray-200 font-semibold"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {r === "ALL" ? "All" : r === "TODAY" ? "Today" : r === "7D" ? "7 Days" : "30 Days"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Log Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Entity</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">User / Actor</th>
                <th className="py-3.5 px-4">Network / IP</th>
                <th className="py-3.5 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-amber-500" />
                    Loading journal logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    No journal logs found matching your criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-amber-50/30 transition-colors group cursor-pointer"
                    onClick={() => setSelectedLog(log)}
                  >
                    {/* Timestamp */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </div>
                      <div className="text-[11px] text-gray-400">
                        {new Date(log.createdAt).toLocaleDateString()}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getStatusBadge(log.status)}
                    </td>

                    {/* Entity */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-100 text-gray-800 font-medium text-[11px]">
                        {getEntityIcon(log.entity)}
                        {log.entity}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-semibold text-gray-900">
                        {formatActionName(log.action)}
                      </span>
                      {log.entityId && (
                        <div className="text-[10px] font-mono text-gray-400 truncate max-w-[180px]">
                          ID: {log.entityId}
                        </div>
                      )}
                    </td>

                    {/* User */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {log.user ? (
                        <div>
                          <div className="font-medium text-gray-900 flex items-center gap-1">
                            <User className="h-3 w-3 text-gray-400" />
                            {log.user.firstName} {log.user.lastName}
                          </div>
                          <div className="text-[11px] text-gray-400">{log.user.email}</div>
                        </div>
                      ) : log.userEmail ? (
                        <div>
                          <div className="font-medium text-gray-900 flex items-center gap-1">
                            <User className="h-3 w-3 text-gray-400" />
                            {log.details?.customerName || log.details?.shippingName || log.userEmail}
                          </div>
                          <div className="text-[11px] text-gray-400">{log.userEmail}</div>
                        </div>
                      ) : log.details?.customerName || log.details?.userEmail ? (
                        <div>
                          <div className="font-medium text-gray-900 flex items-center gap-1">
                            <User className="h-3 w-3 text-gray-400" />
                            {log.details?.customerName || log.details?.shippingName || 'Customer'}
                          </div>
                          {log.details?.userEmail && <div className="text-[11px] text-gray-400">{log.details.userEmail}</div>}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">System / Anonymous</span>
                      )}
                    </td>

                    {/* IP Address */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-mono text-gray-600 text-[11px]">
                        {log.ipAddress || "—"}
                      </div>
                    </td>

                    {/* Details Action */}
                    <td className="py-3 px-4 whitespace-nowrap text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLog(log);
                        }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                        title="View Full Payload"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!loading && logs.length > 0 && (
          <Pagination
            page={page}
            limit={limit}
            total={totalCount}
            totalPages={totalPages}
            itemLabel="logs"
            onPageChange={(newPage) => setPage(newPage)}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1);
            }}
          />
        )}
      </div>

      {/* Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] shadow-2xl border border-gray-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  {getEntityIcon(selectedLog.entity)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    {formatActionName(selectedLog.action)}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Event ID: <span className="font-mono">{selectedLog.id}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="h-8 w-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">Entity</span>
                  <span className="font-semibold text-gray-800">{selectedLog.entity}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">Status</span>
                  <div>{getStatusBadge(selectedLog.status)}</div>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">Timestamp</span>
                  <span className="font-medium text-gray-800">{new Date(selectedLog.createdAt).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">Entity ID</span>
                  <span className="font-mono text-gray-800">{selectedLog.entityId || "N/A"}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">Actor / User</span>
                  <span className="font-medium text-gray-800">
                    {selectedLog.user?.email || selectedLog.userEmail || "System"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">IP Address</span>
                  <span className="font-mono text-gray-800">{selectedLog.ipAddress || "N/A"}</span>
                </div>
              </div>

              {/* User Agent */}
              {selectedLog.userAgent && (
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold mb-1">User Agent</span>
                  <span className="font-mono text-gray-600 text-[11px] break-all">{selectedLog.userAgent}</span>
                </div>
              )}

              {/* Payload / Details */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-800 text-xs uppercase tracking-wider">Payload & Diffs</span>
                  {selectedLog.details && (
                    <button
                      onClick={() => handleCopyDetails(selectedLog.details)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-[11px] transition-colors"
                    >
                      <Copy className="h-3 w-3" />
                      Copy JSON
                    </button>
                  )}
                </div>

                <div className="bg-gray-900 text-amber-400 p-4 rounded-2xl overflow-x-auto font-mono text-[11px] border border-gray-800 max-h-64">
                  {selectedLog.details ? (
                    <pre>{JSON.stringify(selectedLog.details, null, 2)}</pre>
                  ) : (
                    <span className="text-gray-500 italic">No structured payload recorded for this event.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-medium text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
