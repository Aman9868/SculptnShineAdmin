"use client";

import React from "react";
import { useHealth } from "@/context/HealthContext";
import { 
  ServerCrash, 
  Wrench, 
  RefreshCw, 
  Activity, 
  Database, 
  Cpu, 
  ShieldAlert,
  Sparkles
} from "lucide-react";

export default function MaintenanceGuard() {
  const { 
    isMaintenance, 
    isOffline, 
    healthData, 
    checkHealth, 
    isChecking, 
    nextRetrySeconds 
  } = useHealth();

  const envAdminMaintenance =
    process.env.NEXT_PUBLIC_ADMIN_MAINTENANCE_MODE === 'true' ||
    process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true';

  if (!isMaintenance && !isOffline && !envAdminMaintenance) {
    return null;
  }

  const isScheduled = isMaintenance || envAdminMaintenance;
  const title = isScheduled 
    ? "Admin Control • System Maintenance Active" 
    : "Admin Control • Backend Server Offline";

  const message = healthData?.maintenanceMessage || (
    isScheduled
      ? "Maintenance mode is enabled for the Admin Console via environment configuration. All dashboard routes are paused for maintenance."
      : "Cannot establish a connection to the backend API server on port 5000. Please ensure the backend service is running or check server logs."
  );

  return (
    <div className="fixed inset-0 z-[99999] bg-gray-950/95 backdrop-blur-md text-white flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-2xl w-full bg-gray-900 border border-gray-800 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-black/80 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-lg shadow-gold-500/20">
              <Sparkles className="h-5 w-5 text-gray-950" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                SCULPT & SHINE <span className="text-xs font-bold text-gold-400 uppercase tracking-widest bg-gold-500/10 px-2 py-0.5 rounded-full border border-gold-500/20">Admin Portal</span>
              </h2>
              <p className="text-xs text-gray-400">Infrastructure & System Health Sentinel</p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 border border-rose-500/20 text-rose-400">
            {isScheduled ? (
              <>
                <Wrench className="h-3.5 w-3.5" /> Maintenance
              </>
            ) : (
              <>
                <ServerCrash className="h-3.5 w-3.5 animate-pulse" /> Service Down
              </>
            )}
          </div>
        </div>

        {/* Hero Alert */}
        <div className="space-y-2 text-left">
          <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-gold-500" />
            {title}
          </h3>
          <p className="text-sm text-gray-300 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Live Diagnostics Card */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 bg-gray-950/60 border border-gray-800/80 rounded-2xl space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
              <Activity className="h-3.5 w-3.5 text-gold-400" />
              API Gateway
            </div>
            <p className="text-sm font-bold text-gray-200">
              {isOffline ? (
                <span className="text-rose-400 font-extrabold">Unreachable (Port 5000)</span>
              ) : (
                <span className="text-amber-400 font-extrabold">Maintenance 503</span>
              )}
            </p>
          </div>

          <div className="p-3.5 bg-gray-950/60 border border-gray-800/80 rounded-2xl space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
              <Database className="h-3.5 w-3.5 text-gold-400" />
              Database Status
            </div>
            <p className="text-sm font-bold text-gray-200">
              {healthData?.services?.database?.status === "connected" ? (
                <span className="text-emerald-400 font-extrabold">Connected ({healthData.services.database.latencyMs}ms)</span>
              ) : (
                <span className="text-rose-400 font-extrabold">Standby / Offline</span>
              )}
            </p>
          </div>

          <div className="p-3.5 bg-gray-950/60 border border-gray-800/80 rounded-2xl space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
              <Cpu className="h-3.5 w-3.5 text-gold-400" />
              Server Node.js
            </div>
            <p className="text-sm font-bold text-gray-200">
              {healthData?.services?.server?.uptime || "Standby"}
            </p>
          </div>
        </div>

        {/* Reconnection Control Bar */}
        <div className="p-4 bg-gray-950/80 border border-gray-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-gray-400">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gold-500"></span>
            </span>
            <span>
              Retrying backend connection in <strong className="text-gold-400 font-bold">{nextRetrySeconds}s</strong>
            </span>
          </div>

          <button
            onClick={() => checkHealth()}
            disabled={isChecking}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-gray-950 font-extrabold rounded-xl transition-all shadow-md shadow-gold-500/20 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isChecking ? "animate-spin" : ""}`} />
            {isChecking ? "Pinging Backend..." : "Test Connection Now"}
          </button>
        </div>

        <p className="text-2xs text-gray-500 text-center">
          The Admin Portal will automatically resume as soon as the server health check passes.
        </p>
      </div>
    </div>
  );
}
