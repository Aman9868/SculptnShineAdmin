"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { 
  Search, Filter, Download, Plus, MoreVertical, Eye, 
  ChevronLeft, ChevronRight, Edit2, Trash2, Home, Activity, XCircle, Loader2
} from "lucide-react";
import Link from "next/link";
import Pagination from "@/components/Pagination";
import { useRouter } from "next/navigation";
import { useToast } from "@/context/ToastContext";

export default function ProductCategoryPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [kpis, setKpis] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });

  // Debounce search input by 350ms to prevent screen flickering
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchKPIs();
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [pagination.page, pagination.limit, debouncedSearch]);

  const fetchKPIs = async () => {
    try {
      const res = await api.get("/categories/kpis");
      setKpis(res.data.data);
    } catch (error) {
      console.error("Failed to fetch KPIs:", error);
    }
  };

  const fetchCategories = async () => {
    if (categories.length === 0) {
      setIsLoading(true);
    } else {
      setIsSearching(true);
    }

    try {
      const res = await api.get("/categories", {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search: debouncedSearch
        }
      });
      setCategories(res.data.data.categories);
      setPagination(res.data.data.pagination);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    setIsSaving(true);
    try {
      await api.patch(`/categories/${editingCategory.id}`, {
        name: editingCategory.name,
        slug: editingCategory.slug,
        description: editingCategory.description,
        image: editingCategory.image,
        status: editingCategory.status,
      });
      showToast(`Category "${editingCategory.name}" updated successfully!`, "success");
      setEditingCategory(null);
      await fetchCategories();
      await fetchKPIs();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to update category", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteCategory = async (id: string) => {
    if (confirm("Are you sure you want to delete this category?")) {
      try {
        await api.delete(`/categories/${id}`);
        showToast("Category deleted successfully!", "success");
        fetchCategories();
        fetchKPIs();
      } catch (error) {
        console.error("Failed to delete category:", error);
        showToast("Failed to delete category", "error");
      }
    }
  };

  const deleteSelected = async () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    if (confirm(`Are you sure you want to delete ${count} categories?`)) {
      try {
        await Promise.all(selectedIds.map(id => api.delete(`/categories/${id}`)));
        showToast(`${count} categories deleted successfully!`, "success");
        setSelectedIds([]);
        fetchCategories();
        fetchKPIs();
      } catch (error) {
        console.error("Failed to delete selected categories:", error);
        showToast("Failed to delete selected categories", "error");
      }
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === categories.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(categories.map(c => c.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get('/categories/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'categories.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast("Exported categories to CSV!", "success");
    } catch (error) {
      console.error("Failed to export categories:", error);
      showToast("Failed to export categories", "error");
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: '2-digit' });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-brandDark font-serif-luxury tracking-tight">Product Categories</h1>
          <p className="mt-1 text-sm font-medium text-gray-500">Organize your products into categories.</p>
        </div>
        <Link 
          href="/product-category/new" 
          className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all text-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Category</span>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1">Total Categories</p>
            <h3 className="text-2xl font-extrabold text-gray-900">{kpis?.totalCategories ?? 0}</h3>
            <p className="text-xs text-gray-400 mt-2 font-medium">Updated just now</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center">
            <Home className="h-6 w-6 text-amber-500" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1">Active Categories</p>
            <h3 className="text-2xl font-extrabold text-gray-900">{kpis?.activeCategories ?? 0}</h3>
            <p className="text-xs text-gray-400 mt-2 font-medium">Updated just now</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
            <Activity className="h-6 w-6 text-emerald-500" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1">Inactive Categories</p>
            <h3 className="text-2xl font-extrabold text-gray-900">{kpis?.inactiveCategories ?? 0}</h3>
            <p className="text-xs text-gray-400 mt-2 font-medium">Updated just now</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-red-50 flex items-center justify-center">
            <XCircle className="h-6 w-6 text-red-500" />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Controls Toolbar */}
        <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full lg:w-auto">
            {selectedIds.length > 0 && (
              <button 
                onClick={deleteSelected}
                className="px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete Selected ({selectedIds.length})
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-72">
              {isSearching ? (
                <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gold-500 animate-spin" />
              ) : (
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              )}
              <input 
                type="text" 
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-gold-500 outline-none transition-all font-medium placeholder:font-normal"
              />
            </div>
            <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="py-4 pl-6 pr-3 w-12">
                  <input 
                    type="checkbox" 
                    checked={categories.length > 0 && selectedIds.length === categories.length}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-gold-500 focus:ring-gold-500 h-4 w-4 cursor-pointer" 
                  />
                </th>
                <th className="py-4 px-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Category Name</th>
                <th className="py-4 px-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Slug</th>
                <th className="py-4 px-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Description</th>
                <th className="py-4 px-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="py-4 px-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Created At</th>
                <th className="py-4 pr-6 pl-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-6 w-6 rounded-full border-2 border-gold-500 border-t-transparent animate-spin"></div>
                      <span className="text-sm font-medium">Loading categories...</span>
                    </div>
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500 text-sm font-medium">
                    No categories found.
                  </td>
                </tr>
              ) : (
                categories.map((cat: any) => (
                  <tr 
                    key={cat.id} 
                    onClick={() => router.push(`/product-category/${cat.id}`)}
                    className="hover:bg-gold-50/30 transition-colors group cursor-pointer"
                  >
                    <td className="py-3 pl-6 pr-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(cat.id)}
                        onChange={() => toggleSelect(cat.id)}
                        className="rounded border-gray-300 text-gold-500 focus:ring-gold-500 h-4 w-4 cursor-pointer" 
                      />
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="font-bold text-gray-900 text-sm hover:text-gold-600 transition-colors">{cat.name}</div>
                      </div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="text-sm text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded">{cat.slug}</span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-sm text-gray-600 max-w-xs truncate">{cat.description || '-'}</div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold ${
                        cat.status === 'ACTIVE' 
                          ? 'bg-emerald-50 text-emerald-600' 
                          : 'bg-red-50 text-red-600'
                      }`}>
                        {cat.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="text-sm text-gray-600 font-medium">{formatDate(cat.createdAt)}</div>
                    </td>
                    <td className="py-3 pr-6 pl-3 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                        <Link href={`/product-category/${cat.id}`} className="p-1.5 text-gray-400 hover:text-gold-600 hover:bg-gold-50 rounded-lg transition-colors" title="View Category Details">
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button onClick={() => setEditingCategory(cat)} className="p-1.5 text-gray-400 hover:text-gold-600 hover:bg-gold-50 rounded-lg transition-colors" title="Edit Category">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => deleteCategory(cat.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete Category">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && categories.length > 0 && (
          <Pagination
            page={pagination.page}
            limit={pagination.limit}
            total={pagination.total}
            totalPages={pagination.totalPages}
            itemLabel="categories"
            onPageChange={(newPage) => setPagination((prev) => ({ ...prev, page: newPage }))}
            onLimitChange={(newLimit) => setPagination((prev) => ({ ...prev, limit: newLimit, page: 1 }))}
          />
        )}
      </div>

      {/* Edit Category Modal Overlay */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Edit Main Category</h3>
                <p className="text-xs text-gray-500">Update category information and status</p>
              </div>
              <button 
                onClick={() => setEditingCategory(null)} 
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCategory} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Category Name</label>
                <input
                  type="text"
                  required
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gold-500 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">URL Slug</label>
                <input
                  type="text"
                  required
                  value={editingCategory.slug}
                  onChange={(e) => setEditingCategory({ ...editingCategory, slug: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Description</label>
                <textarea
                  rows={3}
                  value={editingCategory.description || ""}
                  onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gold-500 font-medium"
                  placeholder="Enter category description..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Status</label>
                  <select
                    value={editingCategory.status}
                    onChange={(e) => setEditingCategory({ ...editingCategory, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gold-500 bg-white font-medium"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Image URL</label>
                  <input
                    type="text"
                    value={editingCategory.image || ""}
                    onChange={(e) => setEditingCategory({ ...editingCategory, image: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gold-500"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
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
