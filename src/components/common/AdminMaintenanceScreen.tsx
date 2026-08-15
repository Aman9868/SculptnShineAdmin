'use client';

import React, { useState } from 'react';
import { Wrench, ShieldAlert, RefreshCw, Lock, Sparkles, Terminal } from 'lucide-react';

export default function AdminMaintenanceScreen() {
  const isMaintenance =
    process.env.NEXT_PUBLIC_ADMIN_MAINTENANCE_MODE === 'true' ||
    process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true';

  const [isRefreshing, setIsRefreshing] = useState(false);

  if (!isMaintenance) return null;

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-[9999999] bg-[#0b0c10] text-white flex flex-col items-center justify-center p-4 sm:p-6 select-none overflow-y-auto">
      {/* Background ambient lighting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-amber-600/10 via-orange-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Main card */}
      <div className="relative z-10 max-w-lg w-full bg-gradient-to-b from-[#16181f] to-[#0f1015] border border-amber-500/20 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-black/90 backdrop-blur-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-2 mb-1">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
            <Sparkles className="h-5 w-5 text-black" />
          </div>
          <span className="text-xl font-black tracking-wider bg-gradient-to-r from-white via-amber-200 to-amber-400 bg-clip-text text-transparent">
            SCULPT & SHINE
          </span>
        </div>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-bold uppercase tracking-widest">
          <Wrench className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
          <span>Admin Console Maintenance</span>
        </div>

        {/* Title & Message */}
        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            System Maintenance in Progress
          </h1>
          <p className="text-sm text-gray-400 leading-relaxed max-w-md mx-auto">
            The Admin Management Dashboard is temporarily locked for scheduled database indexing, security upgrades, and maintenance routines.
          </p>
        </div>

        {/* Code / Environment Helper Box */}
        <div className="p-4 bg-black/40 border border-white/5 rounded-2xl text-left space-y-2 text-xs font-mono text-gray-300">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-[11px]">
            <Terminal size={13} />
            <span>Environment Control</span>
          </div>
          <p className="text-[11px] text-gray-400 font-sans">
            To restore immediate administrator access, update your <code className="text-amber-300">SculptnShine_Admin/.env.local</code>:
          </p>
          <div className="p-2.5 bg-black/60 rounded-xl border border-white/10 text-amber-300 text-[11px]">
            NEXT_PUBLIC_ADMIN_MAINTENANCE_MODE=false
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-black rounded-xl transition-all shadow-lg shadow-amber-500/20 hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-50 text-sm"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Checking Status...' : 'Refresh Dashboard'}
          </button>
        </div>

        {/* Footer Note */}
        <div className="pt-4 border-t border-white/5 flex items-center justify-center gap-2 text-xs text-gray-500">
          <Lock size={12} className="text-amber-400" />
          <span>All data, catalogs, and logs remain securely preserved.</span>
        </div>
      </div>
    </div>
  );
}
