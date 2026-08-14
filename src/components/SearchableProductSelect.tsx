"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Search, ChevronDown, Check, X, Package, Loader2, Tag } from "lucide-react";
import { getMediaUrl } from "@/lib/media";
import { api } from "@/lib/api";

interface ProductItem {
  id: string;
  title: string;
  sku?: string;
  slug?: string;
  unitPrice?: number;
  brand?: { name?: string } | string;
  images?: string[];
  image?: string;
  stock?: number;
  status?: string;
  [key: string]: any;
}

interface SearchableProductSelectProps {
  products: ProductItem[];
  value: string;
  onChange: (selectedProduct: ProductItem | null) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
}

export default function SearchableProductSelect({
  products: initialProducts = [],
  value,
  onChange,
  label = "Select Spotlight Product *",
  placeholder = "Search product by title, brand, or SKU...",
  required = false,
}: SearchableProductSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [productsList, setProductsList] = useState<ProductItem[]>(initialProducts);
  const [isSearchingApi, setIsSearchingApi] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Sync initial products when props change or load full catalog if small
  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) {
      setProductsList(initialProducts);
    }
  }, [initialProducts]);

  // Load full catalog products on mount to ensure no products are missed
  useEffect(() => {
    const fetchFullCatalog = async () => {
      try {
        const res = await api.get("/products?limit=500");
        const list = res?.data?.data?.products || [];
        if (list.length > 0) {
          setProductsList((prev) => {
            const map = new Map<string, ProductItem>();
            prev.forEach((p) => map.set(p.id, p));
            list.forEach((p: ProductItem) => map.set(p.id, p));
            return Array.from(map.values());
          });
        }
      } catch (e) {
        // Fallback to initial
      }
    };
    fetchFullCatalog();
  }, []);

  // Find currently selected product
  const selectedProduct = useMemo(() => {
    return productsList.find((p) => p.id === value) || null;
  }, [productsList, value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Dynamic search query debouncing to fetch from API
  useEffect(() => {
    if (!isOpen || !searchQuery.trim() || searchQuery.trim().length < 2) return;

    const timer = setTimeout(async () => {
      try {
        setIsSearchingApi(true);
        const res = await api.get(`/products?search=${encodeURIComponent(searchQuery.trim())}&limit=100`);
        const found = res?.data?.data?.products || [];
        if (found.length > 0) {
          setProductsList((prev) => {
            const map = new Map<string, ProductItem>();
            prev.forEach((p) => map.set(p.id, p));
            found.forEach((p: ProductItem) => map.set(p.id, p));
            return Array.from(map.values());
          });
        }
      } catch (err) {
        // Fallback silently to client filter
      } finally {
        setIsSearchingApi(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, isOpen]);

  // Filtered products for dropdown display
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return productsList;
    const query = searchQuery.toLowerCase().trim();
    return productsList.filter((p) => {
      const titleMatch = p.title?.toLowerCase().includes(query);
      const skuMatch = p.sku?.toLowerCase().includes(query);
      const brandName = typeof p.brand === "string" ? p.brand : p.brand?.name;
      const brandMatch = brandName?.toLowerCase().includes(query);
      return titleMatch || skuMatch || brandMatch;
    });
  }, [productsList, searchQuery]);

  const handleSelect = (prod: ProductItem) => {
    onChange(prod);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setSearchQuery("");
  };

  const getProductImage = (prod: ProductItem) => {
    if (prod.images && prod.images.length > 0) return prod.images[0];
    if (prod.image) return prod.image;
    return null;
  };

  const getBrandName = (prod: ProductItem) => {
    if (!prod.brand) return null;
    if (typeof prod.brand === "string") return prod.brand;
    return prod.brand.name || null;
  };

  return (
    <div className="space-y-1.5" ref={containerRef}>
      {label && (
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* Main trigger container */}
      <div className="relative">
        <div
          onClick={() => {
            setIsOpen((prev) => !prev);
            setTimeout(() => searchInputRef.current?.focus(), 50);
          }}
          className={`w-full min-h-[46px] px-3.5 py-2 rounded-xl border bg-white flex items-center justify-between gap-2 cursor-pointer transition-all ${
            isOpen
              ? "border-gold-500 ring-2 ring-gold-500/20 shadow-sm"
              : selectedProduct
              ? "border-gold-300 bg-gold-50/20 hover:border-gold-400"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          {selectedProduct ? (
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="h-8 w-8 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                {getProductImage(selectedProduct) ? (
                  <img
                    src={getMediaUrl(getProductImage(selectedProduct))}
                    alt={selectedProduct.title}
                    className="h-full w-full object-contain p-0.5"
                  />
                ) : (
                  <Package className="h-4 w-4 text-gray-400" />
                )}
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="text-xs font-bold text-gray-900 truncate leading-tight">
                  {selectedProduct.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  {getBrandName(selectedProduct) && (
                    <span className="text-[10px] font-semibold text-gold-700 bg-gold-50 px-1.5 py-0.2 rounded">
                      {getBrandName(selectedProduct)}
                    </span>
                  )}
                  {selectedProduct.sku && (
                    <span className="text-[10px] font-mono text-gray-500 truncate">
                      SKU: {selectedProduct.sku}
                    </span>
                  )}
                  {selectedProduct.unitPrice !== undefined && (
                    <span className="text-[10px] font-bold text-emerald-700">
                      ₹{selectedProduct.unitPrice}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <span className="text-xs text-gray-400 font-normal">
              {placeholder}
            </span>
          )}

          <div className="flex items-center gap-1.5 shrink-0">
            {selectedProduct && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                title="Clear selection"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <ChevronDown
              className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                isOpen ? "rotate-180 text-gold-500" : ""
              }`}
            />
          </div>
        </div>

        {/* Dropdown Menu - ALWAYS opens DOWNWARDS (top-full mt-1.5) */}
        {isOpen && (
          <div
            style={{ top: "calc(100% + 6px)" }}
            className="absolute left-0 right-0 z-50 bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
          >
            {/* Search Input Box */}
            <div className="p-2.5 border-b border-gray-100 bg-gray-50/70">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type product name, brand, or SKU to filter..."
                  className="w-full pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-400 font-medium placeholder:text-gray-400"
                  onClick={(e) => e.stopPropagation()}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearchQuery("");
                      searchInputRef.current?.focus();
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Results List */}
            <div className="max-h-64 overflow-y-auto divide-y divide-gray-50 p-1">
              {isSearchingApi && (
                <div className="p-3 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-gold-500" />
                  <span>Searching catalog...</span>
                </div>
              )}

              {!isSearchingApi && filteredProducts.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-500 space-y-1">
                  <Package className="h-6 w-6 text-gray-300 mx-auto mb-1" />
                  <p className="font-semibold text-gray-700">No matching products found</p>
                  <p className="text-[11px] text-gray-400">Try typing a different name or SKU</p>
                </div>
              ) : (
                filteredProducts.map((prod) => {
                  const isSelected = prod.id === value;
                  const prodImg = getProductImage(prod);
                  const brandName = getBrandName(prod);

                  return (
                    <div
                      key={prod.id}
                      onClick={() => handleSelect(prod)}
                      className={`p-2.5 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all ${
                        isSelected
                          ? "bg-gold-50/80 text-gold-900 border border-gold-200/60"
                          : "hover:bg-gray-50 text-gray-800"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="h-10 w-10 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                          {prodImg ? (
                            <img
                              src={getMediaUrl(prodImg)}
                              alt={prod.title}
                              className="h-full w-full object-contain p-1"
                            />
                          ) : (
                            <Package className="h-5 w-5 text-gray-400" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1 text-left">
                          <p className="text-xs font-bold truncate leading-tight">
                            {prod.title}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            {brandName && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                                <Tag className="h-2.5 w-2.5 text-gray-400" />
                                {brandName}
                              </span>
                            )}
                            {prod.sku && (
                              <span className="text-[10px] font-mono text-gray-500">
                                {prod.sku}
                              </span>
                            )}
                            {prod.unitPrice !== undefined && (
                              <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                                ₹{prod.unitPrice}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="h-6 w-6 rounded-full bg-gold-500 text-black flex items-center justify-center shrink-0 shadow-xs">
                          <Check className="h-3.5 w-3.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom summary footer */}
            <div className="px-3 py-1.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
              <span>Showing {filteredProducts.length} of {productsList.length} products</span>
              <span className="text-[10px] text-gray-400">Opens downward ▾</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
