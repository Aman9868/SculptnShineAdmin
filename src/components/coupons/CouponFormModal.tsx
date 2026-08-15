"use client";

import React, { useState, useEffect } from "react";
import { X, Sparkles, AlertCircle, Check, Tag, Calendar, Layers, ShieldAlert } from "lucide-react";
import { Coupon, couponAdminAPI } from "@/lib/api/coupon";

interface CouponFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  couponToEdit?: Coupon | null;
}

export const CouponFormModal: React.FC<CouponFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  couponToEdit,
}) => {
  const isEditing = !!couponToEdit;

  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FLAT">("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState<number | string>(15);
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<number | string>("");
  const [minOrderAmount, setMinOrderAmount] = useState<number | string>(0);
  const [scopeType, setScopeType] = useState<"GENERAL" | "FIRST_ORDER" | "CATEGORY" | "BRAND" | "PRODUCT" | "SEASONAL">("GENERAL");
  
  const [applicableProductIds, setApplicableProductIds] = useState<string[]>([]);
  const [applicableCategoryIds, setApplicableCategoryIds] = useState<string[]>([]);
  const [applicableBrandIds, setApplicableBrandIds] = useState<string[]>([]);
  
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [usageLimit, setUsageLimit] = useState<number | string>("");
  const [usageLimitPerUser, setUsageLimitPerUser] = useState<number | string>(1);
  const [isActive, setIsActive] = useState(true);
  const [isPublic, setIsPublic] = useState(true);
  const [badgeText, setBadgeText] = useState("");
  const [bannerText, setBannerText] = useState("");

  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load categories, brands, products on open
  useEffect(() => {
    if (!isOpen) return;

    const loadTargets = async () => {
      try {
        const [cats, brs, prods] = await Promise.all([
          couponAdminAPI.getCategories(),
          couponAdminAPI.getBrands(),
          couponAdminAPI.getProducts(),
        ]);
        setCategories(Array.isArray(cats) ? cats : []);
        setBrands(Array.isArray(brs) ? brs : []);
        setProducts(Array.isArray(prods) ? prods : []);
      } catch (err) {
        console.error("Failed to load targets for coupon form", err);
        setCategories([]);
        setBrands([]);
        setProducts([]);
      }
    };

    loadTargets();
  }, [isOpen]);

  // Set default or editing values
  useEffect(() => {
    if (couponToEdit) {
      setCode(couponToEdit.code);
      setTitle(couponToEdit.title);
      setDescription(couponToEdit.description || "");
      setDiscountType(couponToEdit.discountType);
      setDiscountValue(couponToEdit.discountValue);
      setMaxDiscountAmount(couponToEdit.maxDiscountAmount ?? "");
      setMinOrderAmount(couponToEdit.minOrderAmount ?? 0);
      setScopeType(couponToEdit.scopeType);
      setApplicableProductIds(couponToEdit.applicableProductIds || []);
      setApplicableCategoryIds(couponToEdit.applicableCategoryIds || []);
      setApplicableBrandIds(couponToEdit.applicableBrandIds || []);
      
      const sDate = new Date(couponToEdit.startDate);
      const eDate = new Date(couponToEdit.endDate);
      setStartDate(sDate.toISOString().slice(0, 16));
      setEndDate(eDate.toISOString().slice(0, 16));

      setUsageLimit(couponToEdit.usageLimit ?? "");
      setUsageLimitPerUser(couponToEdit.usageLimitPerUser ?? 1);
      setIsActive(couponToEdit.isActive);
      setIsPublic(couponToEdit.isPublic);
      setBadgeText(couponToEdit.badgeText || "");
      setBannerText(couponToEdit.bannerText || "");
    } else {
      // Default new coupon setup
      setCode("");
      setTitle("");
      setDescription("");
      setDiscountType("PERCENTAGE");
      setDiscountValue(15);
      setMaxDiscountAmount("");
      setMinOrderAmount(0);
      setScopeType("GENERAL");
      setApplicableProductIds([]);
      setApplicableCategoryIds([]);
      setApplicableBrandIds([]);
      
      const now = new Date();
      const inOneMonth = new Date();
      inOneMonth.setDate(now.getDate() + 30);
      setStartDate(now.toISOString().slice(0, 16));
      setEndDate(inOneMonth.toISOString().slice(0, 16));

      setUsageLimit("");
      setUsageLimitPerUser(1);
      setIsActive(true);
      setIsPublic(true);
      setBadgeText("");
      setBannerText("");
    }
    setError(null);
  }, [couponToEdit, isOpen]);

  const generateRandomCode = () => {
    const prefixes = ["SHINE", "FITNESS", "PRO", "SUPER", "WHEY", "SAVER", "PRIME", "VIP"];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const val = discountType === "PERCENTAGE" ? (discountValue || 20) : "DEAL";
    const randomNum = Math.floor(10 + Math.random() * 90);
    setCode(`${randomPrefix}${val}${randomNum}`);
  };

  const handleToggleId = (list: string[], setList: (arr: string[]) => void, id: string) => {
    if (list.includes(id)) {
      setList(list.filter((x) => x !== id));
    } else {
      setList([...list, id]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!code.trim()) {
      setError("Please provide a coupon code");
      return;
    }
    if (!title.trim()) {
      setError("Please provide a coupon title");
      return;
    }
    if (Number(discountValue) <= 0) {
      setError("Discount value must be greater than 0");
      return;
    }
    if (discountType === "PERCENTAGE" && Number(discountValue) > 100) {
      setError("Percentage discount cannot exceed 100%");
      return;
    }
    if (!endDate) {
      setError("Please select an expiry date");
      return;
    }

    if (scopeType === "CATEGORY" && applicableCategoryIds.length === 0) {
      setError("Please select at least one qualifying category");
      return;
    }
    if (scopeType === "BRAND" && applicableBrandIds.length === 0) {
      setError("Please select at least one qualifying brand");
      return;
    }
    if (scopeType === "PRODUCT" && applicableProductIds.length === 0) {
      setError("Please select at least one qualifying product");
      return;
    }

    const payload: any = {
      code: code.trim().toUpperCase(),
      title: title.trim(),
      description: description.trim() || null,
      discountType,
      discountValue: Number(discountValue),
      maxDiscountAmount: maxDiscountAmount !== "" ? Number(maxDiscountAmount) : null,
      minOrderAmount: minOrderAmount !== "" ? Number(minOrderAmount) : 0,
      scopeType,
      applicableProductIds,
      applicableCategoryIds,
      applicableBrandIds,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      usageLimit: usageLimit !== "" ? Number(usageLimit) : null,
      usageLimitPerUser: Number(usageLimitPerUser) || 1,
      isActive,
      isPublic,
      badgeText: badgeText.trim() || (discountType === "PERCENTAGE" ? `Save ${discountValue}%` : `Save ₹${discountValue}`),
      bannerText: bannerText.trim() || null,
    };

    setLoading(true);
    try {
      if (isEditing && couponToEdit) {
        await couponAdminAPI.updateCoupon(couponToEdit.id, payload);
      } else {
        await couponAdminAPI.createCoupon(payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to save coupon");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-900 to-gray-800 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-400">
              <Tag size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {isEditing ? `Edit Coupon: ${couponToEdit.code}` : "Create New Coupon & Voucher"}
              </h2>
              <p className="text-xs text-gray-300">
                Configure targeted discounts, Amazon-style vouchers, and validity rules
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-gray-800">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700 text-xs font-semibold">
              <ShieldAlert size={18} className="shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-400">
              1. General Details & Code
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Code */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Coupon Code <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g. SUMMERFIT20"
                    className="flex-1 px-3.5 py-2.5 border border-gray-300 rounded-xl uppercase font-mono font-bold text-sm tracking-wider focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={generateRandomCode}
                    className="px-3 py-2 bg-gray-100 hover:bg-amber-50 hover:text-amber-700 border border-gray-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                    title="Generate Random Code"
                  >
                    <Sparkles size={14} />
                    <span>Auto</span>
                  </button>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Display Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Flat 20% Off on Optimum Nutrition"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Description / Terms
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Applicable on all orders above ₹1,999. Valid once per customer."
                className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-none"
              />
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Section 2: Discount Rules */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-400">
              2. Discount Type & Value
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Type */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Discount Type</label>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none bg-white"
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FLAT">Flat Amount (₹)</option>
                </select>
              </div>

              {/* Value */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {discountType === "PERCENTAGE" ? "Percentage Off (%)" : "Flat Amount (₹)"}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={discountType === "PERCENTAGE" ? 100 : undefined}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                />
              </div>

              {/* Max Discount Cap (Percentage only) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Max Cap (₹) {discountType === "PERCENTAGE" ? "(Optional)" : "(N/A)"}
                </label>
                <input
                  type="number"
                  disabled={discountType !== "PERCENTAGE"}
                  value={maxDiscountAmount}
                  onChange={(e) => setMaxDiscountAmount(e.target.value)}
                  placeholder="e.g. 500 (Max ₹500)"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm disabled:bg-gray-100 disabled:text-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                />
              </div>
            </div>

            {/* Min Order Subtotal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Minimum Order Spend (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={minOrderAmount}
                  onChange={(e) => setMinOrderAmount(e.target.value)}
                  placeholder="0 for no minimum"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Amazon Voucher Badge Text
                </label>
                <input
                  type="text"
                  value={badgeText}
                  onChange={(e) => setBadgeText(e.target.value)}
                  placeholder={discountType === "PERCENTAGE" ? `Save ${discountValue}%` : `Save ₹${discountValue}`}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                />
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Section 3: Target Scope */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-400">
                3. Targeting Scope (Amazon-Style)
              </h3>
              <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                Scope: {scopeType}
              </span>
            </div>

            {/* Scope Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {[
                { id: "GENERAL", label: "Storewide", desc: "All Products" },
                { id: "FIRST_ORDER", label: "First Order", desc: "1st Time Users" },
                { id: "CATEGORY", label: "Category", desc: "Target Categories" },
                { id: "BRAND", label: "Brand", desc: "Target Brands" },
                { id: "PRODUCT", label: "Product", desc: "Specific Items" },
                { id: "SEASONAL", label: "Seasonal", desc: "Holiday Event" },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setScopeType(s.id as any)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    scopeType === s.id
                      ? "border-amber-500 bg-amber-500/10 text-amber-950 font-bold shadow-xs"
                      : "border-gray-200 hover:border-gray-300 text-gray-700 bg-white"
                  }`}
                >
                  <div className="text-xs font-bold">{s.label}</div>
                  <div className="text-[10px] text-gray-500">{s.desc}</div>
                </button>
              ))}
            </div>

            {/* Sub-selector: First Order Info */}
            {scopeType === "FIRST_ORDER" && (
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-emerald-950">
                  <Sparkles size={14} className="text-emerald-600" />
                  First-Time Customer Exclusive
                </p>
                <p className="text-emerald-800 text-[11px]">
                  This coupon is automatically restricted to users placing their very first order. Once their order is placed, the coupon is consumed and cannot be redeemed again.
                </p>
              </div>
            )}

            {/* Sub-selector: Categories */}
            {scopeType === "CATEGORY" && (
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                <label className="block text-xs font-bold text-gray-700">
                  Select Applicable Categories ({applicableCategoryIds.length} selected):
                </label>
                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1">
                  {(categories || []).map((cat) => {
                    const isSelected = applicableCategoryIds.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleToggleId(applicableCategoryIds, setApplicableCategoryIds, cat.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                            : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                        }`}
                      >
                        {isSelected && <Check size={12} />}
                        <span>{cat.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sub-selector: Brands */}
            {scopeType === "BRAND" && (
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                <label className="block text-xs font-bold text-gray-700">
                  Select Applicable Brands ({applicableBrandIds.length} selected):
                </label>
                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1">
                  {(brands || []).map((b) => {
                    const isSelected = applicableBrandIds.includes(b.id);
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => handleToggleId(applicableBrandIds, setApplicableBrandIds, b.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                            : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                        }`}
                      >
                        {isSelected && <Check size={12} />}
                        <span>{b.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sub-selector: Products */}
            {scopeType === "PRODUCT" && (
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                <label className="block text-xs font-bold text-gray-700">
                  Select Applicable Products ({applicableProductIds.length} selected):
                </label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto p-1">
                  {(products || []).map((p) => {
                    const isSelected = applicableProductIds.includes(p.id);
                    return (
                      <div
                        key={p.id}
                        onClick={() => handleToggleId(applicableProductIds, setApplicableProductIds, p.id)}
                        className={`p-2.5 rounded-xl text-xs font-medium border transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? "bg-amber-50 border-amber-500 text-amber-950 font-bold"
                            : "bg-white border-gray-200 hover:border-gray-300 text-gray-800"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="rounded text-amber-600"
                          />
                          <span className="truncate">{p.title}</span>
                        </div>
                        <span className="text-gray-500 font-mono text-[11px] shrink-0 ml-2">
                          ₹{p.unitPrice}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sub-selector: Seasonal Banner Text */}
            {scopeType === "SEASONAL" && (
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                <label className="block text-xs font-bold text-gray-700">
                  Seasonal Campaign Name / Banner Callout
                </label>
                <input
                  type="text"
                  value={bannerText}
                  onChange={(e) => setBannerText(e.target.value)}
                  placeholder="e.g. Summer Shred Flash Sale • Monsoon Mega Discount"
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                />
              </div>
            )}
          </div>

          <hr className="border-gray-100" />

          {/* Section 4: Validity & Usage Limits */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-400">
              4. Validity Dates & Usage Limits
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Start Date & Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Expiry Date & Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Total Storewide Usages Limit
                </label>
                <input
                  type="number"
                  min="1"
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(e.target.value)}
                  placeholder="Leave empty for unlimited"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Max Redemptions Per Customer
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={usageLimitPerUser}
                  onChange={(e) => setUsageLimitPerUser(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                />
              </div>
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <label className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded"
                />
                <div>
                  <div className="text-xs font-bold text-gray-900">Active Coupon</div>
                  <div className="text-[11px] text-gray-500">Enable users to redeem at checkout</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded"
                />
                <div>
                  <div className="text-xs font-bold text-gray-900">Amazon-Style Public Voucher</div>
                  <div className="text-[11px] text-gray-500">Display clip-able badge on product pages</div>
                </div>
              </label>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 text-xs font-bold text-gray-600 hover:text-gray-900 rounded-xl hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? "Saving..." : isEditing ? "Update Coupon" : "Create Coupon"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
