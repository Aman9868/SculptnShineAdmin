"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import Pagination from "@/components/Pagination";
import { 
  Tag, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  ExternalLink, 
  X, 
  Building 
} from "lucide-react";
import ImageUploadInput from "@/components/ImageUploadInput";
import { getMediaUrl } from "@/lib/media";

export default function BrandsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [brands, setBrands] = useState<any[]>([]);
  const [kpis, setKpis] = useState({ totalBrands: 0, activeBrands: 0, inactiveBrands: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Brand Form State
  const [newBrand, setNewBrand] = useState({
    name: "",
    slug: "",
    logo: "",
    description: "",
    website: "",
    status: "ACTIVE",
  });

  // Debounce search query by 350ms
  useEffect(() => {
    setIsSearching(true);
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPagination((prev) => ({ ...prev, page: 1 }));
      setIsSearching(false);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    fetchBrands();
    fetchKPIs();
  }, [debouncedSearch, pagination.page, pagination.limit]);

  const fetchBrands = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(
        `/brands?search=${encodeURIComponent(debouncedSearch)}&page=${pagination.page}&limit=${pagination.limit}`
      );
      setBrands(res.data.data.brands || []);
      if (res.data.data.pagination) {
        setPagination((prev) => ({
          ...prev,
          total: res.data.data.pagination.total,
          totalPages: res.data.data.pagination.totalPages,
        }));
      }
    } catch (err) {
      console.error("Failed to load brands", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchKPIs = async () => {
    try {
      const res = await api.get("/brands/kpis");
      setKpis(res.data.data);
    } catch (err) {
      console.error("Failed to load brand KPIs", err);
    }
  };

  const handleNameChangeNew = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    setNewBrand((prev) => ({ ...prev, name, slug }));
  };

  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrand.name.trim()) return;

    setIsSubmitting(true);
    try {
      await api.post("/brands", newBrand);
      showToast(`Brand "${newBrand.name}" created successfully!`, "success");
      setIsAddModalOpen(false);
      setNewBrand({ name: "", slug: "", logo: "", description: "", website: "", status: "ACTIVE" });
      await Promise.all([fetchBrands(), fetchKPIs()]);
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to create brand", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBrand) return;

    setIsSubmitting(true);
    try {
      await api.patch(`/brands/${editingBrand.id}`, {
        name: editingBrand.name,
        slug: editingBrand.slug,
        logo: editingBrand.logo,
        description: editingBrand.description,
        website: editingBrand.website,
        status: editingBrand.status,
      });
      showToast(`Brand "${editingBrand.name}" updated successfully!`, "success");
      setEditingBrand(null);
      await Promise.all([fetchBrands(), fetchKPIs()]);
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to update brand", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBrand = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete brand "${name}"?`)) {
      try {
        await api.delete(`/brands/${id}`);
        showToast(`Brand "${name}" deleted successfully!`, "success");
        await Promise.all([fetchBrands(), fetchKPIs()]);
      } catch (err: any) {
        showToast(err.response?.data?.message || "Failed to delete brand", "error");
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-500 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-brandDark font-serif-luxury tracking-tight">Brands Management</h1>
          <p className="mt-1 text-sm font-medium text-gray-500">
            Manage product manufacturers, partner brands, and official logos.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white rounded-xl font-bold shadow-md shadow-gold-500/20 transition-all text-sm cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Add New Brand
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Brands</p>
            <h3 className="text-2xl font-black text-gray-900">{kpis.totalBrands}</h3>
          </div>
          <div className="h-12 w-12 rounded-xl bg-purple-50 flex items-center justify-center">
            <Building className="h-6 w-6 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Active Brands</p>
            <h3 className="text-2xl font-black text-emerald-600">{kpis.activeBrands}</h3>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Inactive Brands</p>
            <h3 className="text-2xl font-black text-gray-500">{kpis.inactiveBrands}</h3>
          </div>
          <div className="h-12 w-12 rounded-xl bg-gray-100 flex items-center justify-center">
            <XCircle className="h-6 w-6 text-gray-500" />
          </div>
        </div>
      </div>

      {/* Search & Main Table Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        {/* Controls Toolbar */}
        <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <h3 className="text-base font-bold text-gray-900">Registered Brands</h3>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-72">
              {isSearching ? (
                <Loader2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gold-500 animate-spin" />
              ) : (
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              )}
              <input
                type="text"
                placeholder="Search brands by name, slug..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-500 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Brands Table */}
        {isLoading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-gold-500 animate-spin" />
          </div>
        ) : brands.length === 0 ? (
          <div className="p-12 text-center">
            <div className="h-16 w-16 mx-auto bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Tag className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">No brands found</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
              Start by adding partner product brands to your store.
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gold-500 text-white font-bold rounded-xl text-sm hover:bg-gold-600 transition-colors"
            >
              <Plus className="h-4 w-4" /> Add Brand
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50/60 text-gray-500 font-semibold border-b border-gray-100">
                <tr>
                  <th className="p-4 pl-6">Brand</th>
                  <th className="p-4">Slug</th>
                  <th className="p-4">Products</th>
                  <th className="p-4">Website</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {brands.map((brand) => (
                  <tr 
                    key={brand.id} 
                    onClick={() => router.push(`/brands/${brand.id}`)}
                    className="hover:bg-gold-50/30 transition-colors cursor-pointer group"
                  >
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-white/[0.08] flex items-center justify-center overflow-hidden flex-shrink-0 group-hover:border-gold-300 transition-colors">
                          <img 
                            src={brand.logo ? getMediaUrl(brand.logo) : '/logo.png'} 
                            alt={brand.name} 
                            className="h-full w-full object-contain p-1"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/logo.png';
                            }}
                          />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 group-hover:text-gold-600 transition-colors">{brand.name}</p>
                          {brand.description && (
                            <p className="text-xs text-gray-500 max-w-xs truncate">{brand.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        {brand.slug}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-gray-900 bg-purple-50 text-purple-700 px-2.5 py-1 rounded-lg text-xs">
                        {brand._count?.products || 0} products
                      </span>
                    </td>
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      {brand.website ? (
                        <a
                          href={brand.website}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-gold-600 font-semibold hover:underline"
                        >
                          Visit <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          brand.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                            : "bg-gray-100 text-gray-600 border border-gray-200"
                        }`}
                      >
                        {brand.status}
                      </span>
                    </td>
                    <td className="p-4 text-right pr-6" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingBrand(brand);
                          }}
                          className="p-2 text-gray-400 hover:text-gold-600 hover:bg-gold-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Brand"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteBrand(brand.id, brand.name);
                          }}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Brand"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {!isLoading && brands.length > 0 && (
          <Pagination
            page={pagination.page}
            limit={pagination.limit}
            total={pagination.total}
            totalPages={pagination.totalPages}
            itemLabel="brands"
            onPageChange={(newPage: number) => setPagination((prev) => ({ ...prev, page: newPage }))}
            onLimitChange={(newLimit: number) => setPagination((prev) => ({ ...prev, limit: newLimit, page: 1 }))}
          />
        )}
      </div>

      {/* Add Brand Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0D121F] rounded-2xl border border-gray-100 dark:border-white/[0.08] shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/[0.08] p-5 bg-linear-to-r from-gray-50 to-white dark:from-[#0F1424] dark:to-[#0D121F]">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Add New Brand</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Create a new official manufacturer brand</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleCreateBrand} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-5 overflow-y-auto space-y-4 flex-1">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-200">Brand Name *</label>
                  <input
                    type="text"
                    required
                    value={newBrand.name}
                    onChange={handleNameChangeNew}
                    placeholder="e.g. Optimum Nutrition"
                    className="w-full px-3.5 py-2 border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-[#101524] text-gray-900 dark:text-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-gold-500 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-200">URL Slug *</label>
                  <input
                    type="text"
                    required
                    value={newBrand.slug}
                    onChange={(e) => setNewBrand({ ...newBrand, slug: e.target.value })}
                    placeholder="optimum-nutrition"
                    className="w-full px-3.5 py-2 border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-[#101524] text-gray-900 dark:text-white rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-gold-500"
                  />
                </div>

                <ImageUploadInput
                  label="Brand Logo"
                  value={newBrand.logo}
                  onChange={(img: string) => setNewBrand({ ...newBrand, logo: img })}
                  compact={true}
                  aspectRatio="square"
                  helperText="PNG, JPG, WebP logo or URL"
                />

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-200">Website</label>
                  <input
                    type="url"
                    value={newBrand.website}
                    onChange={(e) => setNewBrand({ ...newBrand, website: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3.5 py-2 border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-[#101524] text-gray-900 dark:text-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-gold-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-200">Status</label>
                  <select
                    value={newBrand.status}
                    onChange={(e) => setNewBrand({ ...newBrand, status: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-[#101524] text-gray-900 dark:text-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-gold-500 font-medium"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 px-5 border-t border-gray-100 dark:border-white/[0.08] bg-gray-50/70 dark:bg-[#0F1424] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 dark:border-white/[0.1] text-gray-700 dark:text-gray-300 font-bold rounded-xl text-xs hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-gradient-to-r from-gold-500 to-gold-600 text-white font-bold rounded-xl text-xs hover:from-gold-600 hover:to-gold-700 transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Create Brand
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Brand Modal */}
      {editingBrand && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0D121F] rounded-2xl border border-gray-100 dark:border-white/[0.08] shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/[0.08] p-5 bg-linear-to-r from-gray-50 to-white dark:from-[#0F1424] dark:to-[#0D121F]">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Edit Brand</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Update brand details and logo</p>
              </div>
              <button
                onClick={() => setEditingBrand(null)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleUpdateBrand} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-5 overflow-y-auto space-y-4 flex-1">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-200">Brand Name *</label>
                  <input
                    type="text"
                    required
                    value={editingBrand.name}
                    onChange={(e) => setEditingBrand({ ...editingBrand, name: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-[#101524] text-gray-900 dark:text-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-gold-500 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-200">URL Slug *</label>
                  <input
                    type="text"
                    required
                    value={editingBrand.slug}
                    onChange={(e) => setEditingBrand({ ...editingBrand, slug: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-[#101524] text-gray-900 dark:text-white rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-gold-500"
                  />
                </div>

                <ImageUploadInput
                  label="Brand Logo"
                  value={editingBrand.logo || ""}
                  onChange={(img: string) => setEditingBrand({ ...editingBrand, logo: img })}
                  compact={true}
                  aspectRatio="square"
                  helperText="PNG, JPG, WebP logo or URL"
                />

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-200">Website</label>
                  <input
                    type="url"
                    value={editingBrand.website || ""}
                    onChange={(e) => setEditingBrand({ ...editingBrand, website: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3.5 py-2 border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-[#101524] text-gray-900 dark:text-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-gold-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-200">Status</label>
                  <select
                    value={editingBrand.status}
                    onChange={(e) => setEditingBrand({ ...editingBrand, status: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-[#101524] text-gray-900 dark:text-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-gold-500 font-medium"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 px-5 border-t border-gray-100 dark:border-white/[0.08] bg-gray-50/70 dark:bg-[#0F1424] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingBrand(null)}
                  className="px-4 py-2 border border-gray-200 dark:border-white/[0.1] text-gray-700 dark:text-gray-300 font-bold rounded-xl text-xs hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-gradient-to-r from-gold-500 to-gold-600 text-white font-bold rounded-xl text-xs hover:from-gold-600 hover:to-gold-700 transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
