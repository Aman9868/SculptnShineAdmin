"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  X, 
  Package, 
  ShoppingBag, 
  Tag, 
  Grid, 
  Users, 
  TicketPercent, 
  LayoutDashboard, 
  Settings, 
  BookOpen, 
  Image as ImageIcon, 
  Headset, 
  Star, 
  Truck, 
  FileText, 
  Activity, 
  Loader2, 
  ArrowRight,
  ChevronRight
} from "lucide-react";
import { api } from "@/lib/api";
import { getMediaUrl } from "@/lib/media";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchResults {
  products: any[];
  orders: any[];
  brands: any[];
  categories: any[];
  users: any[];
}

const STATIC_NAV_ITEMS = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard, category: "Navigation", keywords: ["home", "analytics", "stats", "overview"] },
  { name: "Product Management", href: "/products", icon: Package, category: "Navigation", keywords: ["items", "inventory", "stock", "catalog"] },
  { name: "Product Categories", href: "/product-category", icon: Grid, category: "Navigation", keywords: ["categories", "subcategories", "collections"] },
  { name: "Brands Management", href: "/brands", icon: Tag, category: "Navigation", keywords: ["manufacturers", "vendors", "partners"] },
  { name: "Orders Management", href: "/orders", icon: ShoppingBag, category: "Navigation", keywords: ["sales", "purchases", "invoices", "shipments"] },
  { name: "User Management", href: "/users", icon: Users, category: "Navigation", keywords: ["customers", "accounts", "profiles", "members"] },
  { name: "Coupons & Vouchers", href: "/coupons", icon: TicketPercent, category: "Navigation", keywords: ["discounts", "offers", "promo codes"] },
  { name: "Inventory Management", href: "/inventory", icon: Package, category: "Navigation", keywords: ["stock levels", "alerts", "replenishment"] },
  { name: "Ratings & Reviews", href: "/reviews", icon: Star, category: "Navigation", keywords: ["feedback", "ratings", "customer reviews"] },
  { name: "Banners & Carousels", href: "/banners", icon: ImageIcon, category: "Navigation", keywords: ["promotions", "slides", "hero banners"] },
  { name: "Guides & Articles", href: "/guides", icon: BookOpen, category: "Navigation", keywords: ["blog", "content", "nutrition guides"] },
  { name: "Policies & Terms", href: "/policies", icon: FileText, category: "Navigation", keywords: ["privacy", "terms", "refund policy", "shipping policy"] },
  { name: "Support Tickets", href: "/support", icon: Headset, category: "Navigation", keywords: ["complaints", "helpdesk", "customer service"] },
  { name: "Shipping Configuration", href: "/shipping", icon: Truck, category: "Settings", keywords: ["delivery", "pincodes", "shipping rates"] },
  { name: "Journal Logs", href: "/journal-logs", icon: FileText, category: "Settings", keywords: ["audit", "system activity", "logs"] },
  { name: "Resource Usage", href: "/resource-usage", icon: Activity, category: "Settings", keywords: ["memory", "cpu", "server health", "performance"] },
  { name: "System Settings", href: "/settings", icon: Settings, category: "Settings", keywords: ["preferences", "configuration"] },
];

export default function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResults>({
    products: [],
    orders: [],
    brands: [],
    categories: [],
    users: [],
  });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);

  // Debounce query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  // Reset state when opening/closing
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setDebouncedQuery("");
      setSelectedIndex(0);
      setResults({ products: [], orders: [], brands: [], categories: [], users: [] });
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Fetch live search results
  useEffect(() => {
    if (!debouncedQuery) {
      setResults({ products: [], orders: [], brands: [], categories: [], users: [] });
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    const fetchResults = async () => {
      setIsLoading(true);
      try {
        const res = await api.get(`/search?q=${encodeURIComponent(debouncedQuery)}&limit=5`);
        if (isMounted && res.data.success) {
          setResults(res.data.data);
          setSelectedIndex(0);
        }
      } catch (err) {
        console.error("Global search error:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchResults();
    return () => {
      isMounted = false;
    };
  }, [debouncedQuery]);

  // Filter static navigation pages
  const matchingNavItems = useMemo(() => {
    if (!debouncedQuery) return STATIC_NAV_ITEMS.slice(0, 6);
    const q = debouncedQuery.toLowerCase();
    return STATIC_NAV_ITEMS.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.href.toLowerCase().includes(q) ||
        item.keywords.some((k) => k.toLowerCase().includes(q))
    ).slice(0, 5);
  }, [debouncedQuery]);

  // Flat array of all navigable search result items
  const allFlatItems = useMemo(() => {
    const items: Array<{ id: string; type: string; title: string; subtitle?: string; href: string }> = [];

    // Nav items
    matchingNavItems.forEach((item) => {
      items.push({
        id: `nav-${item.href}`,
        type: "NAV",
        title: item.name,
        subtitle: item.href,
        href: item.href,
      });
    });

    // Products
    results.products.forEach((p) => {
      items.push({
        id: `prod-${p.id}`,
        type: "PRODUCT",
        title: p.title,
        subtitle: `SKU: ${p.sku} • ₹${p.unitPrice}`,
        href: `/products?search=${encodeURIComponent(p.sku || p.title)}`,
      });
    });

    // Orders
    results.orders.forEach((o) => {
      items.push({
        id: `order-${o.id}`,
        type: "ORDER",
        title: o.orderNumber,
        subtitle: `${o.shippingName || o.userProfile?.user?.email || "Customer"} • ₹${o.totalAmount} • ${o.status}`,
        href: `/orders?search=${encodeURIComponent(o.orderNumber)}`,
      });
    });

    // Brands
    results.brands.forEach((b) => {
      items.push({
        id: `brand-${b.id}`,
        type: "BRAND",
        title: b.name,
        subtitle: `/brand/${b.slug}`,
        href: `/brands`,
      });
    });

    // Categories
    results.categories.forEach((c) => {
      items.push({
        id: `cat-${c.id}`,
        type: "CATEGORY",
        title: c.name,
        subtitle: `/category/${c.slug}`,
        href: `/product-category`,
      });
    });

    // Users
    results.users.forEach((u) => {
      items.push({
        id: `user-${u.id}`,
        type: "USER",
        title: `${u.firstName} ${u.lastName}`.trim(),
        subtitle: `${u.email} • ${u.role}`,
        href: `/users?search=${encodeURIComponent(u.email)}`,
      });
    });

    return items;
  }, [matchingNavItems, results]);

  const handleNavigate = useCallback(
    (href: string) => {
      onClose();
      router.push(href);
    },
    [onClose, router]
  );

  // Keyboard navigation (ArrowUp, ArrowDown, Enter, Escape)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (allFlatItems.length > 0 ? (prev + 1) % allFlatItems.length : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          allFlatItems.length > 0 ? (prev - 1 + allFlatItems.length) % allFlatItems.length : 0
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (allFlatItems[selectedIndex]) {
          handleNavigate(allFlatItems[selectedIndex].href);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, allFlatItems, selectedIndex, handleNavigate, onClose]);

  // Click outside to dismiss
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const totalResultsCount =
    matchingNavItems.length +
    results.products.length +
    results.orders.length +
    results.brands.length +
    results.categories.length +
    results.users.length;

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-16 sm:pt-24 px-4 pb-6 overflow-y-auto animate-in fade-in-0 duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={modalRef}
        className="w-full max-w-2xl bg-white dark:bg-[#0F172A] rounded-2xl shadow-2xl border border-gray-200/80 dark:border-gray-800 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
      >
        {/* Search Header */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40">
          <div className="flex items-center justify-center w-5 h-5 text-gray-400 mr-3 shrink-0">
            {isLoading ? (
              <Loader2 className="w-5 h-5 text-gold-500 animate-spin" />
            ) : (
              <Search className="w-5 h-5 text-gray-400" />
            )}
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, orders, brands, users, or pages..."
            className="flex-1 bg-transparent border-none outline-none text-sm sm:text-base font-medium text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors mr-2 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[10px] font-bold text-gray-400 dark:text-gray-500 shadow-2xs">
            ESC
          </kbd>
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-2 sm:p-3 divide-y divide-gray-100/60 dark:divide-gray-800/60">
          {/* Navigation Pages */}
          {matchingNavItems.length > 0 && (
            <div className="py-2 first:pt-0">
              <p className="px-3 py-1 text-[11px] font-bold tracking-wider uppercase text-gray-400 dark:text-gray-500">
                Navigation & Shortcuts
              </p>
              <div className="mt-1 space-y-0.5">
                {matchingNavItems.map((item) => {
                  const itemIndex = allFlatItems.findIndex((x) => x.id === `nav-${item.href}`);
                  const isSelected = itemIndex === selectedIndex;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.href}
                      type="button"
                      onClick={() => handleNavigate(item.href)}
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all cursor-pointer ${
                        isSelected
                          ? "bg-gold-50 dark:bg-gold-950/40 text-gold-900 dark:text-gold-200 font-semibold shadow-2xs"
                          : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <div
                          className={`p-1.5 rounded-lg shrink-0 ${
                            isSelected
                              ? "bg-gold-500 text-white"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-xs sm:text-sm truncate">{item.name}</span>
                      </div>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono hidden sm:inline">
                        {item.href}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Products Section */}
          {results.products.length > 0 && (
            <div className="py-2">
              <div className="flex items-center justify-between px-3 py-1">
                <p className="text-[11px] font-bold tracking-wider uppercase text-gray-400 dark:text-gray-500">
                  Products ({results.products.length})
                </p>
                <button
                  type="button"
                  onClick={() => handleNavigate(`/products?search=${encodeURIComponent(query)}`)}
                  className="text-[11px] font-bold text-gold-600 hover:text-gold-700 dark:text-gold-400 flex items-center gap-1 cursor-pointer"
                >
                  View all in Products <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="mt-1 space-y-0.5">
                {results.products.map((p) => {
                  const itemIndex = allFlatItems.findIndex((x) => x.id === `prod-${p.id}`);
                  const isSelected = itemIndex === selectedIndex;
                  const targetHref = `/products?search=${encodeURIComponent(p.sku || p.title)}`;
                  const primaryImage = p.images?.[0] ? getMediaUrl(p.images[0]) : null;

                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleNavigate(targetHref)}
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all cursor-pointer ${
                        isSelected
                          ? "bg-gold-50 dark:bg-gold-950/40 text-gold-900 dark:text-gold-200 shadow-2xs"
                          : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden shrink-0 flex items-center justify-center">
                          {primaryImage ? (
                            <img
                              src={primaryImage}
                              alt=""
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <Package className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        <div className="truncate">
                          <p className="text-xs sm:text-sm font-semibold truncate text-gray-900 dark:text-gray-100">
                            {p.title}
                          </p>
                          <p className="text-[11px] text-gray-400 dark:text-gray-500 font-mono mt-0.5">
                            SKU: {p.sku} {p.brand?.name ? `• ${p.brand.name}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                          ₹{p.unitPrice}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            p.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
                              : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                          }`}
                        >
                          {p.status}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Orders Section */}
          {results.orders.length > 0 && (
            <div className="py-2">
              <div className="flex items-center justify-between px-3 py-1">
                <p className="text-[11px] font-bold tracking-wider uppercase text-gray-400 dark:text-gray-500">
                  Orders ({results.orders.length})
                </p>
                <button
                  type="button"
                  onClick={() => handleNavigate(`/orders?search=${encodeURIComponent(query)}`)}
                  className="text-[11px] font-bold text-gold-600 hover:text-gold-700 dark:text-gold-400 flex items-center gap-1 cursor-pointer"
                >
                  View all in Orders <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="mt-1 space-y-0.5">
                {results.orders.map((o) => {
                  const itemIndex = allFlatItems.findIndex((x) => x.id === `order-${o.id}`);
                  const isSelected = itemIndex === selectedIndex;
                  const targetHref = `/orders?search=${encodeURIComponent(o.orderNumber)}`;
                  const customerName =
                    o.shippingName ||
                    (o.userProfile?.user?.firstName
                      ? `${o.userProfile.user.firstName} ${o.userProfile.user.lastName || ""}`.trim()
                      : o.userProfile?.user?.email) ||
                    "Customer";

                  return (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => handleNavigate(targetHref)}
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all cursor-pointer ${
                        isSelected
                          ? "bg-gold-50 dark:bg-gold-950/40 text-gold-900 dark:text-gold-200 shadow-2xs"
                          : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <div
                          className={`p-2 rounded-lg shrink-0 ${
                            isSelected
                              ? "bg-gold-500 text-white"
                              : "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400"
                          }`}
                        >
                          <ShoppingBag className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <p className="text-xs sm:text-sm font-bold font-mono text-gray-900 dark:text-gray-100">
                            {o.orderNumber}
                          </p>
                          <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate mt-0.5">
                            {customerName}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                          ₹{o.totalAmount}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                          {o.status}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Brands Section */}
          {results.brands.length > 0 && (
            <div className="py-2">
              <p className="px-3 py-1 text-[11px] font-bold tracking-wider uppercase text-gray-400 dark:text-gray-500">
                Brands ({results.brands.length})
              </p>
              <div className="mt-1 space-y-0.5">
                {results.brands.map((b) => {
                  const itemIndex = allFlatItems.findIndex((x) => x.id === `brand-${b.id}`);
                  const isSelected = itemIndex === selectedIndex;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => handleNavigate("/brands")}
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all cursor-pointer ${
                        isSelected
                          ? "bg-gold-50 dark:bg-gold-950/40 text-gold-900 dark:text-gold-200 shadow-2xs"
                          : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden shrink-0 flex items-center justify-center">
                          {b.logo ? (
                            <img
                              src={getMediaUrl(b.logo)}
                              alt=""
                              className="w-full h-full object-contain p-1"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <Tag className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        <span className="text-xs sm:text-sm font-semibold truncate text-gray-900 dark:text-gray-100">
                          {b.name}
                        </span>
                      </div>
                      <span className="text-[11px] text-gray-400 dark:text-gray-500 font-mono">
                        /brand/{b.slug}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Categories Section */}
          {results.categories.length > 0 && (
            <div className="py-2">
              <p className="px-3 py-1 text-[11px] font-bold tracking-wider uppercase text-gray-400 dark:text-gray-500">
                Categories ({results.categories.length})
              </p>
              <div className="mt-1 space-y-0.5">
                {results.categories.map((c) => {
                  const itemIndex = allFlatItems.findIndex((x) => x.id === `cat-${c.id}`);
                  const isSelected = itemIndex === selectedIndex;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleNavigate("/product-category")}
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all cursor-pointer ${
                        isSelected
                          ? "bg-gold-50 dark:bg-gold-950/40 text-gold-900 dark:text-gold-200 shadow-2xs"
                          : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 shrink-0">
                          <Grid className="w-4 h-4" />
                        </div>
                        <span className="text-xs sm:text-sm font-semibold truncate text-gray-900 dark:text-gray-100">
                          {c.name}
                        </span>
                      </div>
                      <span className="text-[11px] text-gray-400 dark:text-gray-500 font-mono">
                        /category/{c.slug}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Users Section */}
          {results.users.length > 0 && (
            <div className="py-2">
              <p className="px-3 py-1 text-[11px] font-bold tracking-wider uppercase text-gray-400 dark:text-gray-500">
                Users & Customers ({results.users.length})
              </p>
              <div className="mt-1 space-y-0.5">
                {results.users.map((u) => {
                  const itemIndex = allFlatItems.findIndex((x) => x.id === `user-${u.id}`);
                  const isSelected = itemIndex === selectedIndex;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleNavigate(`/users?search=${encodeURIComponent(u.email)}`)}
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all cursor-pointer ${
                        isSelected
                          ? "bg-gold-50 dark:bg-gold-950/40 text-gold-900 dark:text-gold-200 shadow-2xs"
                          : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <div className="w-8 h-8 rounded-full bg-brandDark dark:bg-gold-500 text-white dark:text-gray-950 font-bold text-xs flex items-center justify-center shrink-0">
                          {u.firstName?.[0] || u.email?.[0] || "U"}
                        </div>
                        <div className="truncate">
                          <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {u.firstName} {u.lastName}
                          </p>
                          <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">
                            {u.email}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                        {u.role}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty Query / No Results */}
          {debouncedQuery && !isLoading && totalResultsCount === 0 && (
            <div className="py-12 text-center text-gray-400 dark:text-gray-500">
              <Search className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
              <p className="font-bold text-gray-700 dark:text-gray-300 text-sm">
                No results found for &ldquo;{debouncedQuery}&rdquo;
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Try searching by product title, SKU, order number, brand, or customer email.
              </p>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-gray-50/80 dark:bg-gray-800/60 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[11px] text-gray-400 dark:text-gray-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[10px] font-bold">
                ↑
              </kbd>
              <kbd className="px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[10px] font-bold">
                ↓
              </kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[10px] font-bold">
                ↵
              </kbd>
              select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[10px] font-bold">
                esc
              </kbd>
              close
            </span>
          </div>
          <span className="hidden sm:inline">Global Admin Command Palette</span>
        </div>
      </div>
    </div>
  );
}

