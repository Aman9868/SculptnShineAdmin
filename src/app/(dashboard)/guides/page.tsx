'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  BookOpen, 
  Search, 
  Filter, 
  Eye, 
  Loader2,
  FileText,
  Clock,
  Tag
} from 'lucide-react';
import Link from 'next/link';
import { guideAPI, Guide } from '@/lib/api/guide';
import Pagination from '@/components/Pagination';
import toast from 'react-hot-toast';

export default function GuidesPage() {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [activeTab, setActiveTab] = useState<'ALL' | 'PUBLISHED' | 'HIDDEN'>('ALL');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  useEffect(() => {
    fetchGuides();
  }, [pagination.page, pagination.limit]);

  const fetchGuides = async () => {
    try {
      setIsLoading(true);
      const res = await guideAPI.getAll(pagination.page, pagination.limit);
      if (res.data) {
        setGuides(res.data.guides || []);
        if (res.data.pagination) {
          setPagination(prev => ({
            ...prev,
            total: res.data.pagination.total,
            totalPages: res.data.pagination.totalPages,
          }));
        }
      }
    } catch (err) {
      toast.error('Failed to load guides');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this guide?')) return;
    try {
      await guideAPI.delete(id);
      toast.success('Guide deleted successfully');
      fetchGuides();
    } catch (err) {
      toast.error('Failed to delete guide');
    }
  };

  const toggleStatus = async (guide: Guide) => {
    try {
      await guideAPI.update(guide.id, { status: !guide.status });
      toast.success(`Guide ${guide.status ? 'hidden' : 'published'} successfully`);
      fetchGuides();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  // Filter guides based on search query, category, and status tab
  const filteredGuides = guides.filter(guide => {
    const matchesSearch = 
      guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guide.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (guide.category && guide.category.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'ALL' || guide.category.toUpperCase() === selectedCategory;
    const matchesStatus = 
      activeTab === 'ALL' || 
      (activeTab === 'PUBLISHED' && guide.status) || 
      (activeTab === 'HIDDEN' && !guide.status);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = Array.from(new Set(guides.map(g => g.category).filter(Boolean)));
  const totalPublished = guides.filter(g => g.status).length;
  const totalHidden = guides.filter(g => !g.status).length;

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-brandDark tracking-tight font-serif-luxury flex items-center gap-2.5">
            <BookOpen className="h-8 w-8 text-gold-600" />
            Fitness & Nutrition Guides
          </h1>
          <p className="mt-1 text-sm text-gray-500 font-medium">
            Manage articles, health tips, and workout guides for the frontend store.
          </p>
        </div>
        <Link
          href="/guides/create"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-gold-500/20 hover:from-gold-600 hover:to-gold-700 transition-all self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Add Guide
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Guides</p>
            <h3 className="text-2xl font-black text-gray-900">{pagination.total || guides.length}</h3>
          </div>
          <div className="h-12 w-12 rounded-xl bg-gold-50 flex items-center justify-center border border-gold-100">
            <FileText className="h-6 w-6 text-gold-600" />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Published</p>
            <h3 className="text-2xl font-black text-emerald-600">{totalPublished}</h3>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Draft / Hidden</p>
            <h3 className="text-2xl font-black text-gray-600">{totalHidden}</h3>
          </div>
          <div className="h-12 w-12 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100">
            <XCircle className="h-6 w-6 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        {/* Controls Toolbar */}
        <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-gray-50 border border-gray-200/80 rounded-xl self-stretch sm:self-auto">
            {(['ALL', 'PUBLISHED', 'HIDDEN'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${
                  activeTab === tab
                    ? 'bg-white text-gray-900 shadow-sm border border-gray-200/60'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {tab.toLowerCase()}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            {/* Category Filter */}
            {categories.length > 0 && (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-gold-500"
              >
                <option value="ALL">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat.toUpperCase()}>{cat}</option>
                ))}
              </select>
            )}

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search guides..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-500 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Table Content */}
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-gray-400">
            <Loader2 className="h-8 w-8 text-gold-500 animate-spin" />
            <p className="text-xs font-medium">Loading guides...</p>
          </div>
        ) : filteredGuides.length === 0 ? (
          <div className="p-16 text-center">
            <div className="h-16 w-16 mx-auto bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
              <BookOpen className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">No guides found</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mb-5">
              {searchQuery ? "Try adjusting your search filters to find what you're looking for." : "Start by creating your first guide for the frontend store."}
            </p>
            {!searchQuery && (
              <Link
                href="/guides/create"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gold-600 text-white rounded-xl text-xs font-bold hover:bg-gold-700 transition-colors shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" /> Create Guide
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-400 uppercase bg-gray-50/50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 font-semibold">Guide Title</th>
                  <th className="px-6 py-4 font-semibold">Category</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredGuides.map((guide) => (
                  <tr key={guide.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {guide.image ? (
                          <img 
                            src={guide.image} 
                            alt={guide.title} 
                            className="w-11 h-11 object-cover rounded-xl border border-gray-100 shadow-sm shrink-0" 
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-xl bg-gold-50 border border-gold-100 flex items-center justify-center shrink-0">
                            <BookOpen className="w-5 h-5 text-gold-600" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 text-sm truncate max-w-xs">{guide.title}</p>
                          <p className="text-xs text-gray-400 truncate max-w-xs mt-0.5">{guide.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-bold uppercase tracking-wider">
                        {guide.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button 
                        onClick={() => toggleStatus(guide)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-all shadow-sm ${
                          guide.status 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-100' 
                            : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                        }`}
                      >
                        {guide.status ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-gray-400" />}
                        {guide.status ? 'Published' : 'Hidden'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 font-medium">
                      {new Date(guide.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end items-center gap-1">
                        <Link 
                          href={`/guides/${guide.id}/edit`} 
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Guide"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Link>
                        <button 
                          onClick={() => handleDelete(guide.id)} 
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Guide"
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

        {/* Standard Reusable Pagination Footer */}
        {!isLoading && filteredGuides.length > 0 && (
          <Pagination
            page={pagination.page}
            limit={pagination.limit}
            total={pagination.total || filteredGuides.length}
            totalPages={pagination.totalPages || 1}
            itemLabel="guides"
            onPageChange={(newPage) => setPagination(prev => ({ ...prev, page: newPage }))}
            onLimitChange={(newLimit) => setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }))}
          />
        )}
      </div>
    </div>
  );
}
