"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Search, ChevronDown, Check, X, Building } from "lucide-react";
import { getMediaUrl } from "@/lib/media";

export interface BrandItem {
  id: string;
  name: string;
  slug?: string;
  logo?: string | null;
  status?: string;
}

interface SearchableBrandSelectProps {
  brands: BrandItem[];
  value: string;
  onChange: (brandId: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchableBrandSelect({
  brands = [],
  value,
  onChange,
  placeholder = "All Brands",
  className = "",
}: SearchableBrandSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Find currently selected brand
  const selectedBrand = useMemo(() => {
    return brands.find((b) => b.id === value);
  }, [brands, value]);

  // Filtered brands based on search query
  const filteredBrands = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return brands;
    return brands.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        (b.slug && b.slug.toLowerCase().includes(q))
    );
  }, [brands, searchQuery]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery("");
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleSelect = (brandId: string) => {
    onChange(brandId);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`px-3 py-2 bg-white border rounded-xl text-sm font-semibold transition-all flex items-center justify-between gap-2 min-w-[160px] max-w-[220px] cursor-pointer select-none ${
          isOpen
            ? "border-gold-500 ring-2 ring-gold-500/20 text-gray-900"
            : value
            ? "border-gold-400 bg-gold-50/20 text-gray-900"
            : "border-gray-200 hover:border-gray-300 text-gray-700"
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate flex items-center gap-1.5">
          {selectedBrand ? (
            <>
              {selectedBrand.logo ? (
                <img
                  src={getMediaUrl(selectedBrand.logo)}
                  alt=""
                  className="w-4 h-4 rounded object-contain shrink-0"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              ) : (
                <Building className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              )}
              <span className="truncate">{selectedBrand.name}</span>
            </>
          ) : (
            <span className="text-gray-600">{placeholder}</span>
          )}
        </span>

        <div className="flex items-center gap-1 shrink-0 ml-1">
          {value && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleClear(e as any);
                }
              }}
              title="Clear brand filter"
              className="p-0.5 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
              isOpen ? "rotate-180 text-gold-500" : ""
            }`}
          />
        </div>
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 lg:left-0 mt-1.5 w-64 sm:w-72 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
          {/* Search Header */}
          <div className="p-2.5 border-b border-gray-100 bg-gray-50/70">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search brand by name..."
                className="w-full pl-8 pr-7 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none transition-all placeholder:text-gray-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5 select-none">
            {/* "All Brands" option */}
            {!searchQuery && (
              <button
                type="button"
                onClick={() => handleSelect("")}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
                  !value
                    ? "bg-gold-50 text-gold-900 font-bold"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span>{placeholder}</span>
                {!value && <Check className="w-3.5 h-3.5 text-gold-600 shrink-0" />}
              </button>
            )}

            {filteredBrands.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-400 font-medium">
                No brands found matching &ldquo;{searchQuery}&rdquo;
              </div>
            ) : (
              filteredBrands.map((b) => {
                const isSelected = b.id === value;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => handleSelect(b.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-gold-50 text-gold-900 font-bold"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate pr-2">
                      {b.logo ? (
                        <img
                          src={getMediaUrl(b.logo)}
                          alt=""
                          className="w-4 h-4 rounded object-contain shrink-0 bg-white border border-gray-100"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <Building className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      )}
                      <span className="truncate">{b.name}</span>
                    </span>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-gold-600 shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

