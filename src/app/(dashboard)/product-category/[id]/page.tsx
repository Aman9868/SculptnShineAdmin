"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api";
import { ArrowLeft, Loader2, Edit2, Trash2, Package, CheckCircle, XCircle, Search, Filter, Download, X } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/context/ToastContext";
import ImageUploadInput from "@/components/ImageUploadInput";
import { getMediaUrl } from "@/lib/media";

export default function CategoryDetailsPage() {
  const params = useParams();
  const categoryId = params.id as string;
  const router = useRouter();
  const { showToast } = useToast();

  const [category, setCategory] = useState<any>(null);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [kpis, setKpis] = useState({ totalSubcategories: 0, activeSubcategories: 0, inactiveSubcategories: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit Modal States
  const [editingSubcategory, setEditingSubcategory] = useState<any | null>(null);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [categoryId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [catRes, subRes, kpiRes] = await Promise.all([
        api.get(`/categories/${categoryId}`),
        api.get(`/subcategories?categoryId=${categoryId}`),
        api.get(`/subcategories/kpis?categoryId=${categoryId}`)
      ]);
      setCategory(catRes.data.data);
      setSubcategories(subRes.data.data.subcategories);
      setKpis(kpiRes.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load category details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubcategory) return;
    setIsSaving(true);
    try {
      await api.patch(`/subcategories/${editingSubcategory.id}`, {
        name: editingSubcategory.name,
        slug: editingSubcategory.slug,
        description: editingSubcategory.description,
        image: editingSubcategory.image,
        status: editingSubcategory.status,
      });
      showToast(`Subcategory "${editingSubcategory.name}" updated successfully!`, "success");
      setEditingSubcategory(null);
      await fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to update subcategory", "error");
    } finally {
      setIsSaving(false);
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
      await fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to update category", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteSingleSubcategory = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete subcategory "${name}"?`)) {
      try {
        await api.delete(`/subcategories/${id}`);
        showToast("Subcategory deleted successfully!", "success");
        await fetchData();
      } catch (err: any) {
        showToast(err.response?.data?.message || "Failed to delete subcategory", "error");
      }
    }
  };

  const deleteCategory = async () => {
    if (confirm("Are you sure you want to delete this category?")) {
      try {
        await api.delete(`/categories/${categoryId}`);
        showToast("Category deleted successfully!", "success");
        router.push("/product-category");
      } catch (err: any) {
        showToast(err.response?.data?.message || "Failed to delete category", "error");
      }
    }
  };

  const deleteSelectedSubcategories = async () => {
    if (confirm(`Are you sure you want to delete ${selectedIds.length} subcategories?`)) {
      setIsDeleting(true);
      try {
        await Promise.all(selectedIds.map(id => api.delete(`/subcategories/${id}`)));
        showToast(`${selectedIds.length} subcategories deleted successfully!`, "success");
        setSelectedIds([]);
        await fetchData();
      } catch (err: any) {
        showToast("Failed to delete some subcategories", "error");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const exportSubcategories = async () => {
    try {
      const response = await api.get(`/subcategories/export?categoryId=${categoryId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `subcategories-${category.slug}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast("Exported subcategories to CSV!", "success");
    } catch (err: any) {
      showToast("Failed to export subcategories", "error");
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredSubcategories.map(s => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const filteredSubcategories = subcategories.filter(sub => 
    sub.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (sub.description && sub.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 text-gold-500 animate-spin" />
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 flex flex-col items-center justify-center text-center">
          <h2 className="text-lg font-bold mb-2">Error Loading Category</h2>
          <p className="text-sm font-medium opacity-80 mb-6">{error || "Category not found"}</p>
          <Link href="/product-category" className="px-6 py-2.5 bg-white border border-red-200 text-red-700 rounded-xl font-bold hover:bg-red-50 transition-colors">
            Back to Categories
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link href="/product-category" className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Link href="/product-category" className="hover:text-gold-600">Product Categories</Link>
              <span>›</span>
              <span className="text-gray-900 font-semibold">{category.name}</span>
            </div>
            <h1 className="text-3xl font-extrabold text-brandDark font-serif-luxury tracking-tight">{category.name}</h1>
            <p className="mt-1 text-sm font-medium text-gray-500">
              Manage subcategories in this category.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setEditingCategory(category)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors text-sm cursor-pointer"
          >
            <Edit2 className="h-4 w-4" /> Edit Category
          </button>
          <button onClick={deleteCategory} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-red-200 text-red-600 rounded-xl font-bold hover:bg-red-50 transition-colors text-sm cursor-pointer">
            <Trash2 className="h-4 w-4" /> Delete Category
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left/Middle Column: Subcategories List */}
        <div className="lg:col-span-2 space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">Total Subcategories</p>
                <h3 className="text-xl font-bold text-gray-900">{kpis.totalSubcategories}</h3>
              </div>
              <div className="h-10 w-10 rounded-full bg-purple-50 flex items-center justify-center">
                <Package className="h-5 w-5 text-purple-500" />
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">Active Subcategories</p>
                <h3 className="text-xl font-bold text-gray-900">{kpis.activeSubcategories}</h3>
              </div>
              <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">Inactive Subcategories</p>
                <h3 className="text-xl font-bold text-gray-900">{kpis.inactiveSubcategories}</h3>
              </div>
              <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
            </div>
          </div>

          {/* Subcategories Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative flex-1 w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search subcategories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-500 outline-none transition-all"
                />
              </div>
              <div className="flex items-center gap-2">
                {selectedIds.length > 0 && (
                  <button 
                    onClick={deleteSelectedSubcategories}
                    disabled={isDeleting}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-100 font-bold rounded-xl text-sm hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" /> Delete Selected ({selectedIds.length})
                  </button>
                )}
                <button onClick={exportSubcategories} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl text-sm hover:bg-gray-50 transition-colors">
                  <Download className="h-4 w-4" /> Export
                </button>
                <Link href={`/product-category/${categoryId}/subcategories/new`} className="px-4 py-2 bg-gold-500 text-white font-bold rounded-xl text-sm hover:bg-gold-600 transition-colors">
                  + Add Subcategory
                </Link>
              </div>
            </div>

            {filteredSubcategories.length === 0 ? (
              <div className="p-12 text-center">
                <div className="h-16 w-16 mx-auto bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <Package className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">No subcategories yet</h3>
                <p className="text-sm text-gray-500 max-w-sm mx-auto">
                  Get started by adding subcategories to this category.
                </p>
                <Link href={`/product-category/${categoryId}/subcategories/new`} className="mt-6 inline-flex px-4 py-2 bg-gold-500 text-white font-bold rounded-xl text-sm hover:bg-gold-600 transition-colors">
                  + Add Subcategory
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
                          checked={selectedIds.length === filteredSubcategories.length && filteredSubcategories.length > 0}
                          onChange={handleSelectAll}
                        />
                      </th>
                      <th className="p-4">Subcategory</th>
                      <th className="p-4">Description</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredSubcategories.map((sub) => (
                      <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4">
                          <input 
                            type="checkbox" 
                            className="rounded border-gray-300 text-gold-500 focus:ring-gold-500"
                            checked={selectedIds.includes(sub.id)}
                            onChange={() => handleSelectOne(sub.id)}
                          />
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                              {sub.image ? (
                                <img
                                  src={getMediaUrl(sub.image)}
                                  alt={sub.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = "none";
                                  }}
                                />
                              ) : (
                                <Package className="h-4 w-4 text-gray-400" />
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{sub.name}</p>
                              <p className="text-xs text-gray-500 font-mono mt-0.5">{sub.slug}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-gray-600 truncate max-w-[200px] block" title={sub.description}>
                            {sub.description || '-'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold ${
                            sub.status === 'ACTIVE' 
                              ? 'bg-emerald-50 text-emerald-600' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {sub.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => setEditingSubcategory(sub)} 
                              className="p-2 text-gray-400 hover:text-gold-600 hover:bg-gold-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Subcategory"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => deleteSingleSubcategory(sub.id, sub.name)} 
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Subcategory"
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
          </div>
        </div>

        {/* Right Column: Category Details */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-6">
            <h3 className="text-base font-bold text-gray-900 mb-4">Category Information</h3>
            
            <div className="aspect-video w-full bg-gray-50 rounded-xl border border-gray-100 mb-6 flex flex-col items-center justify-center text-gray-400 overflow-hidden">
              {category.image ? (
                <img src={getMediaUrl(category.image)} alt={category.name} className="w-full h-full object-cover" />
              ) : (
                <>
                  <Package className="h-8 w-8 mb-2 opacity-50" />
                  <span className="text-xs font-semibold">No Image</span>
                </>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">Category Name</p>
                <p className="text-sm font-bold text-gray-900">{category.name}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">Slug</p>
                <p className="text-sm text-gray-700 font-mono bg-gray-50 px-2 py-1 rounded w-fit">{category.slug}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">Description</p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {category.description || 'No description provided.'}
                </p>
              </div>
              <div className="pt-2">
                <p className="text-xs font-semibold text-gray-500 mb-2">Status</p>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${
                  category.status === 'ACTIVE' 
                    ? 'bg-emerald-50 text-emerald-600' 
                    : 'bg-red-50 text-red-600'
                }`}>
                  {category.status}
                </span>
              </div>
              
              <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">Created At</p>
                  <p className="text-xs font-bold text-gray-900">{formatDate(category.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">Updated At</p>
                  <p className="text-xs font-bold text-gray-900">{formatDate(category.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Subcategory Modal */}
      {editingSubcategory && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Edit Subcategory</h3>
                <p className="text-xs text-gray-500">Update subcategory details and status</p>
              </div>
              <button 
                onClick={() => setEditingSubcategory(null)} 
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubcategory} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Subcategory Name</label>
                <input
                  type="text"
                  required
                  value={editingSubcategory.name}
                  onChange={(e) => setEditingSubcategory({ ...editingSubcategory, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gold-500 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">URL Slug</label>
                <input
                  type="text"
                  required
                  value={editingSubcategory.slug}
                  onChange={(e) => setEditingSubcategory({ ...editingSubcategory, slug: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Description</label>
                <textarea
                  rows={3}
                  value={editingSubcategory.description || ""}
                  onChange={(e) => setEditingSubcategory({ ...editingSubcategory, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gold-500 font-medium"
                  placeholder="Enter short subcategory description..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Status</label>
                <select
                  value={editingSubcategory.status}
                  onChange={(e) => setEditingSubcategory({ ...editingSubcategory, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gold-500 bg-white font-medium"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              <ImageUploadInput
                label="Subcategory Image"
                value={editingSubcategory.image || ""}
                onChange={(img: string) => setEditingSubcategory({ ...editingSubcategory, image: img })}
                compact={true}
              />

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingSubcategory(null)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 font-bold rounded-xl text-xs hover:bg-gray-50 transition-colors cursor-pointer"
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

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Edit Category</h3>
                <p className="text-xs text-gray-500">Update category details and status</p>
              </div>
              <button 
                onClick={() => setEditingCategory(null)} 
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCategory} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Category Name</label>
                <input
                  type="text"
                  required
                  value={editingCategory.name || ""}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gold-500 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">URL Slug</label>
                <input
                  type="text"
                  required
                  value={editingCategory.slug || ""}
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

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Status</label>
                <select
                  value={editingCategory.status || "ACTIVE"}
                  onChange={(e) => setEditingCategory({ ...editingCategory, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gold-500 bg-white font-medium"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              <ImageUploadInput
                label="Category Image"
                value={editingCategory.image || ""}
                onChange={(img: string) => setEditingCategory({ ...editingCategory, image: img })}
                compact={true}
              />

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 font-bold rounded-xl text-xs hover:bg-gray-50 transition-colors cursor-pointer"
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
