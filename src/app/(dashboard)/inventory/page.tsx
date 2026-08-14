"use client";

import { Boxes } from "lucide-react";

export default function InventoryPage() {
  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-brandDark font-serif-luxury tracking-tight">Inventory Management</h1>
          <p className="mt-1.5 text-sm font-medium text-brandDark-lighter tracking-wide">
            Track and manage your stock levels.
          </p>
        </div>
      </div>
      
      <div className="mt-4 rounded-2xl glass-panel shadow-luxury p-8 flex flex-col justify-center items-center h-96 border border-gray-200/50">
        <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Boxes className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Inventory Module</h3>
        <p className="text-gray-500 font-medium text-center max-w-sm">Inventory grid will be implemented here soon.</p>
      </div>
    </div>
  );
}
