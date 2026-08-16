"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api";
import { 
  ArrowLeft, 
  Building, 
  Edit2, 
  Trash2, 
  Package, 
  ExternalLink, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Search, 
  X,
  Tag
} from "lucide-react";
import Link from "next/link";
import ImageUploadInput from "@/components/ImageUploadInput";
import { getMediaUrl } from "@/lib/media";

export default function BrandDetailsPage() {
  const params = useParams();
  const brandId = params.id as string;
  const router = useRouter();

  const [brand, setBrand] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Edit Brand Modal State
  const [editingBrand, setEditingBrand] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchBrandDetails();
  }, [brandId]);

  const fetchBrandDetails = async () => {
    setIsLoading(true);
    try {
      const [brandRes, prodRes] = await Promise.all([
        api.get(`/brands/${brandId}`),
        api.get(`/products?brandId=${brandId}`),
      ]);
      setBrand(brandRes.data.data);
      setProducts(prodRes.data.data.products || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load brand details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBrand) return;

    setIsSaving(true);
    try {
      await api.patch(`/brands/${editingBrand.id}`, {
        name: editingBrand.name,
        slug: editingBrand.slug,
        logo: editingBrand.logo,
        description: editingBrand.description,
        website: editingBrand.website,
        status: editingBrand.status,
      });
      setEditingBrand(null);
      await fetchBrandDetails();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update brand");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBrand = async () => {
    if (!brand) return;
    if (confirm(`Are you sure you want to delete brand "${brand.name}"?`)) {
      try {
        await api.delete(`/brands/${brandId}`);
        router.push("/brands");
      } catch (err: any) {
        alert(err.response?.data?.message || "Failed to delete brand");
      }
    }
  };

  const filteredProducts = products.filter((p) =>
    p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 text-gold-500 animate-spin" />
        <p className="text-sm font-medium text-gray-500">Loading brand details...</p>
      </div>
    );
  }

  if (error || !brand) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-2">Error Loading Brand</h3>
        <p className="text-sm text-gray-500 mb-6">{error || "Brand not found"}</p>
        <Link
          href="/brands"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gold-500 text-white font-bold rounded-xl text-sm hover:bg-gold-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Brands
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-500 pb-12">
      {/* Back Header */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/brands"
          className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-gold-600 transition-colors bg-white px-3.5 py-2 rounded-xl border border-gray-200 shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Brands
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditingBrand(brand)}
            className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gold-50 hover:text-gold-600 text-gray-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
          >
            <Edit2 className="h-3.5 w-3.5" /> Edit Brand
          </button>
          <button
            onClick={handleDeleteBrand}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-xs transition-all cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      </div>

      {/* Brand Hero Card */}
      <div className="bg-white dark:bg-[#0D121F] rounded-2xl border border-gray-100 dark:border-white/[0.08] p-6 md:p-8 shadow-sm mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="h-20 w-20 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-white/[0.08] flex items-center justify-center overflow-hidden flex-shrink-0 p-2 shadow-inner">
              <img 
                src={brand.logo ? getMediaUrl(brand.logo) : '/logo.png'} 
                alt={brand.name} 
                className="h-full w-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo.png';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-black text-brandDark dark:text-white font-serif-luxury">{brand.name}</h1>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold ${
                    brand.status === "ACTIVE"
                      ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/[0.08]"
                  }`}
                >
                  {brand.status}
                </span>
              </div>
              <p className="text-xs font-mono text-gray-500 dark:text-gray-400 mt-1">Slug: {brand.slug}</p>
              {brand.description && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 max-w-2xl leading-relaxed">{brand.description}</p>
              )}
            </div>
          </div>

          {brand.website && (
            <a
              href={brand.website}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 bg-gold-50 dark:bg-gold-950/40 text-gold-700 dark:text-gold-300 font-bold rounded-xl text-xs hover:bg-gold-100 dark:hover:bg-gold-950/60 transition-colors border border-gold-200/60 dark:border-gold-800/50"
            >
              <ExternalLink className="h-4 w-4" /> Visit Official Website
            </a>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-[#0D121F] rounded-2xl p-6 border border-gray-100 dark:border-white/[0.08] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Products</p>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white">{products.length}</h3>
          </div>
          <div className="h-12 w-12 rounded-xl bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center">
            <Package className="h-6 w-6 text-purple-600 dark:text-purple-300" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#0D121F] rounded-2xl p-6 border border-gray-100 dark:border-white/[0.08] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Active Catalog</p>
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {products.filter((p) => p.status === "ACTIVE").length}
            </h3>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#0D121F] rounded-2xl p-6 border border-gray-100 dark:border-white/[0.08] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Out of Stock</p>
            <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400">
              {products.filter((p) => p.stock === 0).length}
            </h3>
          </div>
          <div className="h-12 w-12 rounded-xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center">
            <XCircle className="h-6 w-6 text-rose-600 dark:text-rose-400" />
          </div>
        </div>
      </div>

      {/* Brand Products Table */}
      <div className="bg-white dark:bg-[#0D121F] rounded-2xl border border-gray-100 dark:border-white/[0.08] shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            Brand Catalog ({filteredProducts.length})
          </h3>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products by title, SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-[#13192B] border border-gray-200 dark:border-white/[0.1] text-gray-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-gold-500 outline-none transition-all"
            />
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="h-16 w-16 mx-auto bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <Tag className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">No products found</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              There are currently no products mapped under this brand manufacturer.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50/60 dark:bg-[#13192B] text-gray-500 dark:text-gray-400 font-semibold border-b border-gray-100 dark:border-white/[0.08]">
                <tr>
                  <th className="p-4 pl-6">Product</th>
                  <th className="p-4">SKU</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Stock</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right pr-6">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/[0.06]">
                {filteredProducts.map((prod) => (
                  <tr
                    key={prod.id}
                    onClick={() => router.push(`/products/${prod.id}`)}
                    className="hover:bg-gold-50/30 dark:hover:bg-white/[0.03] transition-colors cursor-pointer group"
                  >
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-white/[0.08] flex items-center justify-center overflow-hidden flex-shrink-0">
                          {prod.images?.[0] ? (
                            <img
                              src={getMediaUrl(prod.images[0])}
                              alt={prod.title}
                              className="h-full w-full object-contain p-1"
                            />
                          ) : (
                            <Package className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white group-hover:text-gold-600 transition-colors max-w-xs truncate">
                            {prod.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{prod.category?.name || "General"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-mono text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                        {prod.sku || "-"}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-gray-900 dark:text-white">₹{prod.unitPrice}</span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-xs ${
                          prod.stock > 10
                            ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                            : prod.stock > 0
                            ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
                            : "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300"
                        }`}
                      >
                        {prod.stock} in stock
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${
                          prod.status === "ACTIVE"
                            ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {prod.status}
                      </span>
                    </td>
                    <td className="p-4 text-right pr-6" onClick={(e) => e.stopPropagation()}>
                      <Link
                        href={`/products/${prod.id}/edit`}
                        className="p-2 text-gray-400 hover:text-gold-600 hover:bg-gold-50 dark:hover:bg-white/[0.05] rounded-lg transition-colors inline-block"
                        title="Edit Product"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
                  disabled={isSaving}
                  className="px-5 py-2 bg-gradient-to-r from-gold-500 to-gold-600 text-white font-bold rounded-xl text-xs hover:from-gold-600 hover:to-gold-700 transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
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
