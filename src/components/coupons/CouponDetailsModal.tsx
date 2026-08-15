"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Copy,
  Check,
  Calendar,
  Tag,
  Users,
  ShoppingBag,
  Percent,
  Sparkles,
  Layers,
  Edit2,
  Trash2,
  Clock,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { Coupon, couponAdminAPI } from "@/lib/api/coupon";

interface CouponDetailsModalProps {
  couponId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (coupon: Coupon) => void;
  onDelete: (id: string, code: string) => void;
}

export const CouponDetailsModal: React.FC<CouponDetailsModalProps> = ({
  couponId,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}) => {
  const [coupon, setCoupon] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && couponId) {
      fetchDetails(couponId);
    } else {
      setCoupon(null);
    }
  }, [isOpen, couponId]);

  const fetchDetails = async (id: string) => {
    setLoading(true);
    try {
      const res = await couponAdminAPI.getCouponById(id);
      if (res.success) {
        setCoupon(res.data);
      }
    } catch (err) {
      console.error("Failed to load coupon details:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  const isExpired = coupon ? new Date() > new Date(coupon.endDate) : false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-gray-900 via-gray-800 to-amber-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <Tag size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xl font-black tracking-wider uppercase">
                  {coupon?.code || "Loading..."}
                </span>
                {coupon && (
                  <button
                    onClick={() => handleCopy(coupon.code)}
                    className="p-1 hover:bg-white/10 rounded-md transition-colors text-amber-300"
                    title="Copy Code"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                )}
                {coupon && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      isExpired
                        ? "bg-red-500/30 text-red-300 border border-red-400/30"
                        : coupon.isActive
                        ? "bg-emerald-500/30 text-emerald-300 border border-emerald-400/30"
                        : "bg-gray-500/30 text-gray-300 border border-gray-400/30"
                    }`}
                  >
                    {isExpired ? "Expired" : coupon.isActive ? "Active" : "Inactive"}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-300 font-medium mt-0.5">
                {coupon?.title || "Coupon & Voucher Overview"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-gray-800">
          {loading ? (
            <div className="py-16 text-center text-gray-400">
              <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-semibold">Loading coupon intelligence...</p>
            </div>
          ) : !coupon ? (
            <div className="py-16 text-center text-gray-400">
              <p className="text-sm font-semibold">Could not find coupon information</p>
            </div>
          ) : (
            <>
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-amber-50/60 border border-amber-200/60 rounded-2xl">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-800 uppercase tracking-wider mb-1">
                    <Percent size={13} />
                    <span>Discount</span>
                  </div>
                  <div className="text-lg font-black text-amber-950">
                    {coupon.discountType === "PERCENTAGE"
                      ? `${coupon.discountValue}% OFF`
                      : `₹${coupon.discountValue} FLAT`}
                  </div>
                  {coupon.maxDiscountAmount && (
                    <div className="text-[10px] text-amber-700 font-semibold mt-0.5">
                      Max Capped: ₹{coupon.maxDiscountAmount}
                    </div>
                  )}
                </div>

                <div className="p-3.5 bg-blue-50/60 border border-blue-200/60 rounded-2xl">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-800 uppercase tracking-wider mb-1">
                    <ShoppingBag size={13} />
                    <span>Min Spend</span>
                  </div>
                  <div className="text-lg font-black text-blue-950">
                    {coupon.minOrderAmount ? `₹${coupon.minOrderAmount}` : "None"}
                  </div>
                  <div className="text-[10px] text-blue-700 font-semibold mt-0.5">
                    No min basket barrier
                  </div>
                </div>

                <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/60 rounded-2xl">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 uppercase tracking-wider mb-1">
                    <TrendingUp size={13} />
                    <span>Total Uses</span>
                  </div>
                  <div className="text-lg font-black text-emerald-950">
                    {coupon.usedCount || 0}
                    <span className="text-xs text-gray-500 font-normal">
                      {coupon.usageLimit ? ` / ${coupon.usageLimit}` : " (Unlimited)"}
                    </span>
                  </div>
                  <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                    Per User: {coupon.usageLimitPerUser} time(s)
                  </div>
                </div>

                <div className="p-3.5 bg-purple-50/60 border border-purple-200/60 rounded-2xl">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-purple-800 uppercase tracking-wider mb-1">
                    <Layers size={13} />
                    <span>Target Scope</span>
                  </div>
                  <div className="text-sm font-black text-purple-950 truncate mt-1">
                    {coupon.scopeType === "GENERAL"
                      ? "Storewide"
                      : coupon.scopeType === "FIRST_ORDER"
                      ? "1st Order Only"
                      : coupon.scopeType}
                  </div>
                  <div className="text-[10px] text-purple-700 font-semibold mt-0.5">
                    {coupon.isPublic ? "Public Offer" : "Hidden Code"}
                  </div>
                </div>
              </div>

              {/* Scope & Targeting Details */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200/80 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600 flex items-center gap-2">
                  <Layers size={14} className="text-amber-600" />
                  Targeting & Applicability
                </h4>
                <div className="text-xs space-y-2 text-gray-700">
                  <div className="flex justify-between py-1 border-b border-gray-200/60">
                    <span className="font-semibold text-gray-500">Scope Type</span>
                    <span className="font-bold text-gray-900">
                      {coupon.scopeType === "FIRST_ORDER"
                        ? "First Order Only (New Customers)"
                        : coupon.scopeType === "GENERAL"
                        ? "Storewide (All Products & Orders)"
                        : coupon.scopeType}
                    </span>
                  </div>

                  {coupon.scopeType === "CATEGORY" && (
                    <div className="flex justify-between py-1 border-b border-gray-200/60">
                      <span className="font-semibold text-gray-500">Target Categories</span>
                      <span className="font-bold text-amber-800">
                        {coupon.applicableCategoryIds?.length || 0} Categories
                      </span>
                    </div>
                  )}

                  {coupon.scopeType === "BRAND" && (
                    <div className="flex justify-between py-1 border-b border-gray-200/60">
                      <span className="font-semibold text-gray-500">Target Brands</span>
                      <span className="font-bold text-amber-800">
                        {coupon.applicableBrandIds?.length || 0} Brands
                      </span>
                    </div>
                  )}

                  {coupon.scopeType === "PRODUCT" && (
                    <div className="flex justify-between py-1 border-b border-gray-200/60">
                      <span className="font-semibold text-gray-500">Target Products</span>
                      <span className="font-bold text-amber-800">
                        {coupon.applicableProductIds?.length || 0} Specific Products
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between py-1">
                    <span className="font-semibold text-gray-500">Validity Window</span>
                    <span className="font-medium text-gray-900 flex items-center gap-1.5">
                      <Calendar size={13} className="text-gray-400" />
                      {new Date(coupon.startDate).toLocaleDateString("en-IN")}
                      <ArrowRight size={12} className="text-gray-400" />
                      {new Date(coupon.endDate).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Promotional Display Settings */}
              {(coupon.badgeText || coupon.bannerText) && (
                <div className="p-4 bg-amber-50/40 rounded-2xl border border-amber-200/60 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-2">
                    <Sparkles size={14} className="text-amber-600" />
                    Storefront Promotional Displays
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {coupon.badgeText && (
                      <div className="p-2.5 bg-white rounded-xl border border-amber-200">
                        <span className="text-[10px] text-gray-500 font-bold block uppercase mb-1">
                          Product Voucher Badge
                        </span>
                        <span className="font-bold text-amber-900">{coupon.badgeText}</span>
                      </div>
                    )}
                    {coupon.bannerText && (
                      <div className="p-2.5 bg-white rounded-xl border border-amber-200">
                        <span className="text-[10px] text-gray-500 font-bold block uppercase mb-1">
                          Announcement Bar Banner
                        </span>
                        <span className="font-bold text-amber-900">{coupon.bannerText}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Redemptions History */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Users size={14} className="text-gray-500" />
                    Recent Redemptions ({coupon.usages?.length || 0})
                  </span>
                  <span className="text-[11px] text-gray-400 font-normal">
                    Showing latest 20 uses
                  </span>
                </h4>

                {(!coupon.usages || coupon.usages.length === 0) ? (
                  <div className="p-8 text-center bg-gray-50 rounded-2xl border border-gray-200/60 text-gray-400 text-xs">
                    No orders have redeemed this coupon yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-gray-200 rounded-2xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 text-[10px] uppercase font-bold text-gray-500 border-b border-gray-200">
                        <tr>
                          <th className="p-3">Order #</th>
                          <th className="p-3">Customer</th>
                          <th className="p-3 text-right">Discount Given</th>
                          <th className="p-3 text-right">Order Total</th>
                          <th className="p-3 text-right">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {coupon.usages.map((u: any) => (
                          <tr key={u.id} className="hover:bg-gray-50/50">
                            <td className="p-3 font-mono font-bold text-amber-900">
                              {u.order?.orderNumber || "N/A"}
                            </td>
                            <td className="p-3">
                              <div className="font-semibold text-gray-900">
                                {u.userProfile?.user?.firstName} {u.userProfile?.user?.lastName}
                              </div>
                              <div className="text-[10px] text-gray-500">
                                {u.userProfile?.user?.email}
                              </div>
                            </td>
                            <td className="p-3 text-right font-bold text-emerald-600">
                              -₹{u.discountAmount?.toLocaleString("en-IN") || 0}
                            </td>
                            <td className="p-3 text-right font-semibold text-gray-900">
                              ₹{u.order?.totalAmount?.toLocaleString("en-IN") || 0}
                            </td>
                            <td className="p-3 text-right text-gray-500 text-[11px]">
                              {new Date(u.createdAt).toLocaleDateString("en-IN")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer Actions */}
        {coupon && (
          <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between shrink-0">
            <button
              onClick={() => {
                onClose();
                onDelete(coupon.id, coupon.code);
              }}
              className="px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Trash2 size={14} />
              Delete Coupon
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  onClose();
                  onEdit(coupon);
                }}
                className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
              >
                <Edit2 size={14} />
                Edit Coupon
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
