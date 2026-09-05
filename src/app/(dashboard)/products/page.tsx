"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload,
  Trash2, 
  Edit2, 
  Eye, 
  Loader2, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import Link from "next/link";
import Pagination from "@/components/Pagination";
import { useToast } from "@/context/ToastContext";
import { getMediaUrl } from "@/lib/media";
import * as XLSX from "xlsx";
import BulkUploadModal from "@/components/products/BulkUploadModal";
import SearchableBrandSelect from "@/components/SearchableBrandSelect";
import SearchableSelect from "@/components/SearchableSelect";

export default function ProductsPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [kpis, setKpis] = useState({
    totalProducts: 0,
    outOfStockProducts: 0,
    lowStockProducts: 0,
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // Debounce search query by 350ms to eliminate screen flickering
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [pagination.page, pagination.limit, selectedCategory, selectedBrand, selectedStatus, debouncedSearch]);

  const fetchInitialData = async () => {
    try {
      const [catRes, brandRes, kpiRes] = await Promise.all([
        api.get("/categories"),
        api.get("/brands"),
        api.get("/products/inventory-status"),
      ]);
      setCategories(catRes.data.data.categories || catRes.data.data || []);
      setBrands(brandRes.data.data.brands || brandRes.data.data || []);
      setKpis(kpiRes.data.data || { totalProducts: 0, outOfStockProducts: 0, lowStockProducts: 0 });
    } catch (err) {
      console.error("Failed to load metadata", err);
    }
  };

  const fetchProducts = async () => {
    if (products.length === 0) {
      setIsLoading(true);
    } else {
      setIsSearching(true);
    }

    try {
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(selectedCategory && { categoryId: selectedCategory }),
        ...(selectedBrand && { brandId: selectedBrand }),
        ...(selectedStatus && { status: selectedStatus }),
      });

      const res = await api.get(`/products?${queryParams.toString()}`);
      setProducts(res.data.data.products);
      setPagination(res.data.data.pagination);
    } catch (err) {
      console.error("Failed to fetch products", err);
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchProducts();
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(products.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const deleteProduct = async (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        await api.delete(`/products/${id}`);
        showToast("Product deleted successfully!", "success");
        fetchProducts();
        fetchInitialData();
      } catch (err: any) {
        showToast(err.response?.data?.message || "Failed to delete product", "error");
      }
    }
  };

  const deleteSelectedProducts = async () => {
    const count = selectedIds.length;
    if (confirm(`Are you sure you want to delete ${count} products?`)) {
      setIsDeleting(true);
      try {
        await Promise.all(selectedIds.map((id) => api.delete(`/products/${id}`)));
        showToast(`${count} products deleted successfully!`, "success");
        setSelectedIds([]);
        fetchProducts();
        fetchInitialData();
      } catch (err) {
        showToast("Failed to delete selected products", "error");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const exportProductsExcel = async () => {
    try {
      if (products.length === 0) {
        showToast("No products to export", "error");
        return;
      }

      const exportData = products.map((p) => ({
        "Product Title": p.title,
        "SKU": p.sku,
        "Brand": p.brand?.name || "—",
        "Category": p.category?.name || "—",
        "Subcategory": p.subcategory?.name || "—",
        "Unit Price (₹)": p.unitPrice,
        "Discount (%)": p.discountPercentage || 0,
        "GST (%)": p.gst || 18,
        "Stock Qty": p.stock,
        "Status": p.status,
        "Preference": p.preference || "NOT_APPLICABLE",
        "Images": (p.images || []).join(", "),
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Products_Catalog");
      XLSX.writeFile(workbook, `sculptnshine_products_export_${Date.now()}.xlsx`);

      showToast(`Exported ${products.length} products to Excel (.xlsx)!`, "success");
    } catch (err) {
      showToast("Failed to export products to Excel", "error");
    }
  };

  const activeCount = Math.max(0, kpis.totalProducts - kpis.outOfStockProducts);

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-brandDark font-serif-luxury tracking-tight">Product Management</h1>
          <p className="mt-1 text-sm font-medium text-gray-500">
            Add, edit, bulk import, and track your product inventory and prices.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsBulkUploadOpen(true)}
            className="flex items-center justify-center gap-2 bg-white hover:bg-gold-50/60 text-gold-700 border border-gold-300 px-4 py-2.5 rounded-xl font-bold shadow-xs transition-all text-sm cursor-pointer hover:border-gold-400"
          >
            <Upload className="h-4 w-4 text-gold-600" />
            Bulk Import
          </button>
          <Link
            href="/products/new"
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-gold-500/20 transition-all text-sm cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Add Product
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1">Total Products</p>
            <h3 className="text-2xl font-extrabold text-gray-900">{kpis.totalProducts}</h3>
          </div>
          <div className="h-10 w-10 rounded-full bg-purple-50 flex items-center justify-center">
            <Package className="h-5 w-5 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1">Active Products</p>
            <h3 className="text-2xl font-extrabold text-gray-900">{activeCount}</h3>
          </div>
          <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1">Low Stock Alerts</p>
            <h3 className="text-2xl font-extrabold text-amber-600">{kpis.lowStockProducts}</h3>
          </div>
          <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1">Out of Stock</p>
            <h3 className="text-2xl font-extrabold text-red-600">{kpis.outOfStockProducts}</h3>
          </div>
          <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center">
            <XCircle className="h-5 w-5 text-red-600" />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex flex-col lg:flex-row items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full max-w-md">
            {isSearching ? (
              <Loader2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gold-500 animate-spin" />
            ) : (
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            )}
            <input
              type="text"
              placeholder="Search products by title, SKU, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-500 outline-none transition-all"
            />
          </form>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
            {/* Category Filter */}
            <div className="w-44 sm:w-48">
              <SearchableSelect
                options={categories}
                value={selectedCategory}
                onChange={(catId) => {
                  setSelectedCategory(catId);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                placeholder="All Categories"
                searchPlaceholder="Search category..."
              />
            </div>

            {/* Searchable Brand Filter */}
            <SearchableBrandSelect
              brands={brands}
              value={selectedBrand}
              onChange={(brandId) => {
                setSelectedBrand(brandId);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              placeholder="All Brands"
            />

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-gold-500 outline-none transition-all"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
            </select>

            {/* Delete Selected Button */}
            {selectedIds.length > 0 && (
              <button
                onClick={deleteSelectedProducts}
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-100 font-bold rounded-xl text-sm hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" /> Delete ({selectedIds.length})
              </button>
            )}

            {/* Export Excel */}
            <button
              onClick={exportProductsExcel}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl text-sm hover:bg-gray-50 transition-colors shadow-2xs cursor-pointer"
              title="Export Products Catalog to Excel (.xlsx)"
            >
              <Download className="h-4 w-4 text-gray-600" /> Export (.xlsx)
            </button>
          </div>
        </div>

        {/* Table Content */}
        {isLoading ? (
          <div className="flex items-center justify-center p-16">
            <Loader2 className="h-8 w-8 text-gold-500 animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="p-16 text-center">
            <div className="h-16 w-16 mx-auto bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Package className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">No products found</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
              Get started by creating your first product or adjusting your filters.
            </p>
            <Link
              href="/products/new"
              className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-600 text-white px-4 py-2 rounded-xl font-bold text-sm transition-colors"
            >
              <Plus className="h-4 w-4" /> Add Product
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50/50 text-gray-500 font-semibold border-b border-gray-100">
                <tr>
                  <th className="p-4 w-10">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-gold-500 focus:ring-gold-500"
                      checked={selectedIds.length === products.length && products.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="p-4">Product</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Stock</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((p) => (
                  <tr 
                    key={p.id} 
                    onClick={() => router.push(`/products/${p.id}`)}
                    className="hover:bg-gold-50/30 transition-colors cursor-pointer group"
                  >
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-gold-500 focus:ring-gold-500 cursor-pointer"
                        checked={selectedIds.includes(p.id)}
                        onChange={() => handleSelectOne(p.id)}
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                          <img 
                            src={p.images && p.images.length > 0 && p.images[0] ? getMediaUrl(p.images[0]) : '/assets/product-placeholder.png'} 
                            alt={p.title} 
                            onError={(e: any) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = '/assets/product-placeholder.png';
                            }}
                            className="h-full w-full object-cover" 
                          />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 group-hover:text-gold-600 transition-colors">
                            {p.title}
                          </p>
                          <p className="text-xs text-gray-500 font-mono">SKU: {p.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {p.category ? (
                        <div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gold-50 text-gold-600">
                            {p.category.name}
                          </span>
                          {p.subcategory && (
                            <p className="text-xs text-gray-500 mt-0.5">› {p.subcategory.name}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Uncategorized</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div>
                        {p.discountPercentage && parseFloat(p.discountPercentage) > 0 ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-gray-900">
                              ₹{(parseFloat(p.unitPrice) * (1 - parseFloat(p.discountPercentage) / 100)).toFixed(2)}
                            </span>
                            <span className="text-xs text-gray-400 line-through">₹{parseFloat(p.unitPrice).toFixed(2)}</span>
                          </div>
                        ) : (
                          <span className="font-bold text-gray-900">₹{p.unitPrice ? parseFloat(p.unitPrice).toFixed(2) : "0.00"}</span>
                        )}
                        {p.gst && <p className="text-[10px] text-gray-500 mt-0.5">+{p.gst}% GST</p>}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold ${
                        p.stock === 0
                          ? 'bg-red-50 text-red-600'
                          : p.stock <= (p.lowStockAlert || 5)
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        {p.stock === 0 ? 'Out of stock' : `${p.stock} in stock`}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${
                        p.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-600'
                          : p.status === 'OUT_OF_STOCK'
                          ? 'bg-red-50 text-red-600'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/products/${p.id}`}
                          className="p-2 text-gray-400 hover:text-gold-600 hover:bg-gold-50 transition-colors rounded-lg"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/products/${p.id}/edit`}
                          className="p-2 text-gray-400 hover:text-gold-600 hover:bg-gold-50 transition-colors rounded-lg"
                          title="Edit Product"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => deleteProduct(p.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors rounded-lg"
                          title="Delete Product"
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

        {/* Pagination Footer */}
        {!isLoading && products.length > 0 && (
          <Pagination
            page={pagination.page}
            limit={pagination.limit}
            total={pagination.total}
            totalPages={pagination.totalPages}
            itemLabel="products"
            onPageChange={(newPage) => setPagination((prev) => ({ ...prev, page: newPage }))}
            onLimitChange={(newLimit) => setPagination((prev) => ({ ...prev, limit: newLimit, page: 1 }))}
          />
        )}
      </div>

      {/* Bulk Upload Modal */}
      <BulkUploadModal
        isOpen={isBulkUploadOpen}
        onClose={() => setIsBulkUploadOpen(false)}
        onSuccess={() => {
          fetchProducts();
          fetchInitialData();
          showToast("Products catalog refreshed successfully!", "success");
        }}
      />
    </div>
  );
}
