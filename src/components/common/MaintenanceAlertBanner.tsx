'use client';

import React from 'react';
import { AlertTriangle, Wrench, ShieldAlert } from 'lucide-react';

export default function MaintenanceAlertBanner() {
  const isMaintenance = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true';

  if (!isMaintenance) return null;

  return (
    <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white px-4 py-2.5 shadow-md flex items-center justify-between text-xs font-bold z-50 sticky top-0">
      <div className="flex items-center gap-2 max-w-5xl mx-auto">
        <div className="p-1 bg-white/20 rounded-lg shrink-0 animate-pulse">
          <Wrench size={14} className="text-white" />
        </div>
        <p className="leading-tight">
          <strong className="uppercase tracking-wider">Maintenance Mode Active:</strong> The customer storefront is currently displaying the "Temporarily Unavailable" screen. Set <code className="bg-black/30 px-1.5 py-0.5 rounded font-mono text-[11px]">NEXT_PUBLIC_MAINTENANCE_MODE=false</code> in <code className="bg-black/30 px-1.5 py-0.5 rounded font-mono text-[11px]">.env.local</code> to resume public access.
        </p>
      </div>
    </div>
  );
}
