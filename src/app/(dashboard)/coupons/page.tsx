"use client";

import React, { useState, useEffect } from "react";
import {
  Tag,
  Plus,
  Search,
  Copy,
  Check,
  Percent,
  Layers,
  Calendar,
  Eye,
  Trash2,
  Edit2,
  RefreshCw,
  TrendingUp,
  Award,
  Sparkles,
  TicketPercent,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Coupon, CouponMetrics, couponAdminAPI } from "@/lib/api/coupon";
import { CouponFormModal } from "@/components/coupons/CouponFormModal";
import { CouponDetailsModal } from "@/components/coupons/CouponDetailsModal";
import Pagination from "@/components/Pagination";

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [metrics, setMetrics] = useState<CouponMetrics>({
    totalCoupons: 0,
    activeCoupons: 0,
    totalRedemptions: 0,
    totalDiscountGranted: 0,
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  const [search, setSearch] = useState("");
  const [scopeFilter, setScopeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // View Details Modal
  const [selectedCouponIdForView, setSelectedCouponIdForView] = useState<string | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await couponAdminAPI.getCoupons({
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
        scopeType: scopeFilter !== "ALL" ? scopeFilter : undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
      });

      if (res.success && res.data) {
        setCoupons(res.data.coupons || []);
        if (res.data.metrics) setMetrics(res.data.metrics);
        if (res.data.pagination) setPagination(res.data.pagination);
      }
    } catch (error) {
      console.error("Failed to load coupons", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [pagination.page, scopeFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchCoupons();
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await couponAdminAPI.toggleStatus(id);
      fetchCoupons();
    } catch (err) {
      console.error("Failed to toggle status", err);
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Are you sure you want to delete coupon '${code}'?`)) return;
    try {
      await couponAdminAPI.deleteCoupon(id);
      fetchCoupons();
    } catch (err) {
      console.error("Failed to delete coupon", err);
    }
  };

  const getScopeBadge = (scope: string) => {
    switch (scope) {
      case "GENERAL":
        return <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full text-[11px] font-bold">Storewide</span>;
      case "FIRST_ORDER":
        return <span className="bg-emerald-50 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full text-[11px] font-bold">1st Order Only</span>;
      case "CATEGORY":
        return <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full text-[11px] font-bold">Category</span>;
      case "BRAND":
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full text-[11px] font-bold">Brand</span>;
      case "PRODUCT":
        return <span className="bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-full text-[11px] font-bold">Product</span>;
      case "SEASONAL":
        return <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full text-[11px] font-bold">Seasonal</span>;
      default:
        return <span className="bg-gray-50 text-gray-700 px-2 py-0.5 rounded-full text-[11px] font-bold">{scope}</span>;
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-extrabold text-gray-900 flex items-center gap-2">
            <TicketPercent className="w-7 h-7 text-amber-600" />
            <span>Coupons & Vouchers</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Manage storewide promo codes, Amazon-style clip-able product vouchers, and targeted brand discounts
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedCoupon(null);
            setModalOpen(true);
          }}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
        >
          <Plus size={16} />
          <span>Create Coupon</span>
        </button>
      </div>

      {/* Analytics Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500">Active Coupons</p>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-1">{metrics.activeCoupons}</h3>
            <p className="text-[11px] text-emerald-600 font-bold mt-1">
              {metrics.totalCoupons} Total Configured
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Tag size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500">Total Redemptions</p>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-1">{metrics.totalRedemptions}</h3>
            <p className="text-[11px] text-amber-600 font-bold mt-1">Orders Claimed</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500">Customer Savings</p>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-1">
              ₹{metrics.totalDiscountGranted.toLocaleString("en-IN")}
            </h3>
            <p className="text-[11px] text-blue-600 font-bold mt-1">Total Discount Granted</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Percent size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500">Storefront Vouchers</p>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-1">
              {coupons.filter((c) => c.isPublic && c.isActive).length}
            </h3>
            <p className="text-[11px] text-purple-600 font-bold mt-1">Live Clip-able Badges</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Sparkles size={24} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search code or title..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          {/* Scope filter */}
          <select
            value={scopeFilter}
            onChange={(e) => {
              setScopeFilter(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="px-3 py-2 border border-gray-300 rounded-xl text-xs font-semibold bg-white text-gray-700 outline-none"
          >
            <option value="ALL">All Scopes</option>
            <option value="GENERAL">Storewide</option>
            <option value="FIRST_ORDER">1st Order Only</option>
            <option value="CATEGORY">Category</option>
            <option value="BRAND">Brand</option>
            <option value="PRODUCT">Product</option>
            <option value="SEASONAL">Seasonal</option>
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="px-3 py-2 border border-gray-300 rounded-xl text-xs font-semibold bg-white text-gray-700 outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive</option>
            <option value="EXPIRED">Expired</option>
          </select>

          <button
            onClick={fetchCoupons}
            className="p-2 border border-gray-300 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-extrabold uppercase tracking-wider text-gray-500">
                <th className="py-3.5 px-4">Coupon Code</th>
                <th className="py-3.5 px-4">Scope</th>
                <th className="py-3.5 px-4">Discount</th>
                <th className="py-3.5 px-4">Min Spend</th>
                <th className="py-3.5 px-4">Usages</th>
                <th className="py-3.5 px-4">Validity</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
              {loading && coupons.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-amber-600" />
                    Loading coupons...
                  </td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    <Tag size={36} className="mx-auto mb-2 text-gray-300" />
                    <p className="font-semibold text-gray-600">No coupons found</p>
                    <p className="text-[11px] mt-1">Create your first coupon to start offering discounts</p>
                  </td>
                </tr>
              ) : (
                (coupons || []).map((c) => {
                  const now = new Date();
                  const isExpired = new Date(c.endDate) < now;

                  return (
                    <tr
                      key={c.id}
                      onClick={() => {
                        setSelectedCouponIdForView(c.id);
                        setDetailsModalOpen(true);
                      }}
                      className="hover:bg-amber-50/50 cursor-pointer transition-colors group"
                    >
                      {/* Code & Title */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-extrabold text-gray-900 bg-gray-100 group-hover:bg-white px-2.5 py-1 rounded-lg border border-gray-200 tracking-wider">
                            {c.code}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyCode(c.code);
                            }}
                            className="text-gray-400 hover:text-amber-600 p-1"
                            title="Copy Code"
                          >
                            {copiedCode === c.code ? (
                              <Check size={14} className="text-emerald-600" />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                        </div>
                        <div className="font-semibold text-gray-900 mt-1 line-clamp-1 group-hover:text-amber-900 transition-colors">{c.title}</div>
                        {c.isPublic && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-bold border border-amber-200 mt-0.5">
                            <Sparkles size={10} />
                            <span>Voucher Badge: {c.badgeText || "Clip"}</span>
                          </span>
                        )}
                      </td>

                      {/* Scope */}
                      <td className="py-4 px-4">{getScopeBadge(c.scopeType)}</td>

                      {/* Discount */}
                      <td className="py-4 px-4 font-bold text-gray-900">
                        {c.discountType === "PERCENTAGE" ? (
                          <div>
                            <span className="text-amber-700 text-sm">{c.discountValue}% OFF</span>
                            {c.maxDiscountAmount && (
                              <div className="text-[10px] text-gray-400 font-normal">
                                Max ₹{c.maxDiscountAmount}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-emerald-700 text-sm">Flat ₹{c.discountValue} OFF</span>
                        )}
                      </td>

                      {/* Min Spend */}
                      <td className="py-4 px-4 font-semibold text-gray-800">
                        {c.minOrderAmount ? `₹${c.minOrderAmount.toLocaleString("en-IN")}` : "None"}
                      </td>

                      {/* Usages */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-gray-900">
                          {c.usedCount} {c.usageLimit ? `/ ${c.usageLimit}` : "Used"}
                        </div>
                        {c.usageLimit && (
                          <div className="w-20 bg-gray-100 rounded-full h-1.5 mt-1 overflow-hidden">
                            <div
                              className="bg-amber-600 h-1.5 rounded-full"
                              style={{
                                width: `${Math.min(100, (c.usedCount / c.usageLimit) * 100)}%`,
                              }}
                            />
                          </div>
                        )}
                      </td>

                      {/* Validity */}
                      <td className="py-4 px-4">
                        <div className="text-[11px] text-gray-500">
                          Till {new Date(c.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </div>
                        {isExpired ? (
                          <span className="text-[10px] font-bold text-red-600 uppercase">Expired</span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-600">Valid</span>
                        )}
                      </td>

                      {/* Status Toggle */}
                      <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleToggleStatus(c.id)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            c.isActive ? "bg-emerald-500" : "bg-gray-300"
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              c.isActive ? "translate-x-4" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedCoupon(c);
                              setModalOpen(true);
                            }}
                            className="p-1.5 text-gray-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(c.id, c.code)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!loading && coupons.length > 0 && (
          <Pagination
            page={pagination.page}
            limit={pagination.limit}
            total={pagination.total}
            totalPages={pagination.totalPages}
            itemLabel="coupons"
            onPageChange={(newPage) => setPagination((prev) => ({ ...prev, page: newPage }))}
            onLimitChange={(newLimit) => setPagination((prev) => ({ ...prev, limit: newLimit, page: 1 }))}
          />
        )}
      </div>

      {/* View Coupon Details Modal */}
      <CouponDetailsModal
        isOpen={detailsModalOpen}
        couponId={selectedCouponIdForView}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedCouponIdForView(null);
        }}
        onEdit={(coupon) => {
          setSelectedCoupon(coupon);
          setModalOpen(true);
        }}
        onDelete={(id, code) => handleDelete(id, code)}
      />

      {/* Create / Edit Modal */}
      <CouponFormModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedCoupon(null);
        }}
        onSuccess={fetchCoupons}
        couponToEdit={selectedCoupon}
      />
    </div>
  );
}
