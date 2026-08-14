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
      <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-sm mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="h-20 w-20 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0 p-2 shadow-inner">
              {brand.logo ? (
                <img src={brand.logo} alt={brand.name} className="h-full w-full object-contain" />
              ) : (
                <Building className="h-10 w-10 text-gray-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-black text-brandDark font-serif-luxury">{brand.name}</h1>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold ${
                    brand.status === "ACTIVE"
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                      : "bg-gray-100 text-gray-600 border border-gray-200"
                  }`}
                >
                  {brand.status}
                </span>
              </div>
              <p className="text-xs font-mono text-gray-500 mt-1">Slug: {brand.slug}</p>
              {brand.description && (
                <p className="text-sm text-gray-600 mt-2 max-w-2xl leading-relaxed">{brand.description}</p>
              )}
            </div>
          </div>

          {brand.website && (
            <a
              href={brand.website}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 bg-gold-50 text-gold-700 font-bold rounded-xl text-xs hover:bg-gold-100 transition-colors border border-gold-200/60"
            >
              <ExternalLink className="h-4 w-4" /> Visit Official Website
            </a>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Products</p>
            <h3 className="text-2xl font-black text-gray-900">{products.length}</h3>
          </div>
          <div className="h-12 w-12 rounded-xl bg-purple-50 flex items-center justify-center">
            <Package className="h-6 w-6 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Active Products</p>
            <h3 className="text-2xl font-black text-emerald-600">
              {products.filter((p) => p.status === "ACTIVE").length}
            </h3>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Out of Stock</p>
            <h3 className="text-2xl font-black text-red-500">
              {products.filter((p) => p.stock === 0 || p.status === "OUT_OF_STOCK").length}
            </h3>
          </div>
          <div className="h-12 w-12 rounded-xl bg-red-50 flex items-center justify-center">
            <XCircle className="h-6 w-6 text-red-500" />
          </div>
        </div>
      </div>

      {/* Associated Products Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-gold-500" />
            <h3 className="text-lg font-bold text-gray-900">Brand Products ({filteredProducts.length})</h3>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products by title or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-gold-500 outline-none transition-all"
            />
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="h-10 w-10 mx-auto text-gray-300 mb-3" />
            <p className="text-sm font-bold text-gray-700">No products linked to {brand.name} yet</p>
            <p className="text-xs text-gray-500 mt-1">Assign products to this brand when creating or editing items.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50/60 text-gray-500 font-semibold border-b border-gray-100">
                <tr>
                  <th className="p-4 pl-6">Product</th>
                  <th className="p-4">SKU</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Stock</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((prod) => (
                  <tr key={prod.id} className="hover:bg-gold-50/20 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {prod.images && prod.images[0] ? (
                            <img src={prod.images[0]} alt={prod.title} className="h-full w-full object-cover" />
                          ) : (
                            <Package className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{prod.title}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        {prod.sku}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-gray-900">₹{prod.price}</span>
                      {prod.discountPrice && (
                        <span className="text-xs text-gray-400 line-through ml-2">₹{prod.discountPrice}</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`font-bold text-xs ${prod.stock > 0 ? "text-gray-700" : "text-red-600"}`}>
                        {prod.stock} units
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          prod.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                            : "bg-gray-100 text-gray-600 border border-gray-200"
                        }`}
                      >
                        {prod.status}
                      </span>
                    </td>
                    <td className="p-4 text-right pr-6">
                      <Link
                        href={`/products/${prod.id}/edit`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-gold-600 hover:underline"
                      >
                        Edit Product <Edit2 className="h-3 w-3" />
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
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl max-w-md w-full p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Edit Brand</h3>
                <p className="text-xs text-gray-500">Update brand details and logo</p>
              </div>
              <button
                onClick={() => setEditingBrand(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateBrand} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Brand Name *</label>
                <input
                  type="text"
                  required
                  value={editingBrand.name}
                  onChange={(e) => setEditingBrand({ ...editingBrand, name: e.target.value })}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gold-500 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">URL Slug *</label>
                <input
                  type="text"
                  required
                  value={editingBrand.slug}
                  onChange={(e) => setEditingBrand({ ...editingBrand, slug: e.target.value })}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Logo Image URL</label>
                <input
                  type="url"
                  value={editingBrand.logo || ""}
                  onChange={(e) => setEditingBrand({ ...editingBrand, logo: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Website</label>
                <input
                  type="url"
                  value={editingBrand.website || ""}
                  onChange={(e) => setEditingBrand({ ...editingBrand, website: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Status</label>
                <select
                  value={editingBrand.status}
                  onChange={(e) => setEditingBrand({ ...editingBrand, status: e.target.value })}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gold-500 bg-white font-medium"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingBrand(null)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 font-bold rounded-xl text-xs hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-gradient-to-r from-gold-500 to-gold-600 text-white font-bold rounded-xl text-xs hover:from-gold-600 hover:to-gold-700 transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
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
