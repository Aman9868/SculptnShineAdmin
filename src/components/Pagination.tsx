"use client";

import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

interface PaginationProps {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  itemLabel?: string;
  onPageChange: (newPage: number) => void;
  onLimitChange: (newLimit: number) => void;
}

export default function Pagination({
  page,
  limit,
  total,
  totalPages,
  itemLabel = "items",
  onPageChange,
  onLimitChange,
}: PaginationProps) {
  if (total === 0) return null;

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  return (
    <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center bg-white gap-4 rounded-b-xl shadow-[0_4px_10px_-2px_rgba(0,0,0,0.02)]">
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Per Page:</span>
        <select
          value={limit}
          onChange={(e) => onLimitChange(Number(e.target.value))}
          className="border border-gray-200 rounded px-2.5 py-1 text-[13px] text-gray-700 font-medium outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-sm"
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>

        <p className="text-[13px] text-gray-500 ml-2">
          Showing <span className="font-bold text-gray-900">{startItem}</span> to{" "}
          <span className="font-bold text-gray-900">{endItem}</span> of{" "}
          <span className="font-bold text-gray-900">{total}</span> {itemLabel}
        </p>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="w-[34px] h-[34px] flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-gray-700 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm bg-white"
          title="Previous Page"
        >
          <ChevronLeft size={16} />
        </button>

        {Array.from({ length: totalPages }).map((_, i) => {
          const p = i + 1;
          if (p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)) {
            return (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`w-[34px] h-[34px] flex items-center justify-center rounded-lg text-[13px] font-bold transition-colors ${
                  page === p
                    ? "bg-[#F59E0B] text-white shadow-md border border-[#F59E0B]"
                    : "border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm bg-white"
                }`}
              >
                {p}
              </button>
            );
          }

          if (p === page - 2 || p === page + 2) {
            return (
              <div key={p} className="w-[34px] h-[34px] flex items-center justify-center text-gray-400 text-xs">
                <MoreHorizontal size={14} />
              </div>
            );
          }

          return null;
        })}

        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages || totalPages === 0}
          className="w-[34px] h-[34px] flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-gray-700 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm bg-white"
          title="Next Page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
