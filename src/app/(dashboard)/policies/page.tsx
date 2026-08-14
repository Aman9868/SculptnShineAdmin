"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Search, Plus, Edit2, Trash2, FileText, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/context/ToastContext";
import Pagination from "@/components/Pagination";

export default function PolicyManagementPage() {
  const { showToast } = useToast();
  const [policies, setPolicies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
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
    fetchPolicies();
  }, [pagination.page, pagination.limit, debouncedSearch]);

  const fetchPolicies = async () => {
    if (policies.length === 0) {
      setIsLoading(true);
    } else {
      setIsSearching(true);
    }

    try {
      const res = await api.get("/policies", {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search: debouncedSearch
        }
      });
      setPolicies(res.data.data.policies);
      setPagination(res.data.data.pagination);
    } catch (error) {
      console.error("Failed to fetch policies:", error);
      showToast("Failed to fetch policies", "error");
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete the policy "${title}"?`)) {
      try {
        await api.delete(`/policies/${id}`);
        showToast("Policy deleted successfully!", "success");
        fetchPolicies();
      } catch (error) {
        console.error("Failed to delete policy:", error);
        showToast("Failed to delete policy", "error");
      }
    }
  };

  const activePoliciesCount = policies.filter(p => p.isActive).length;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-brandDark font-serif-luxury tracking-tight">Policy Management</h1>
          <p className="mt-1 text-sm font-medium text-gray-500">Manage your store's legal and operational policies.</p>
        </div>
        <Link 
          href="/policies/new" 
          className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all text-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Policy</span>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1">Total Policies</p>
            <h3 className="text-2xl font-extrabold text-gray-900">{pagination.total}</h3>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center">
            <FileText className="h-6 w-6 text-amber-500" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1">Active Policies</p>
            <h3 className="text-2xl font-extrabold text-gray-900">{activePoliciesCount}</h3>
            <p className="text-xs text-gray-400 mt-2 font-medium">On current page</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Controls Toolbar */}
        <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-72">
              {isSearching ? (
                <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gold-500 animate-spin" />
              ) : (
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              )}
              <input 
                type="text" 
                placeholder="Search policies by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-gold-500 outline-none transition-all font-medium placeholder:font-normal"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="py-4 pl-6 pr-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Policy Name</th>
                <th className="py-4 px-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="py-4 px-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="py-4 px-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Last Updated</th>
                <th className="py-4 pr-6 pl-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-6 w-6 rounded-full border-2 border-gold-500 border-t-transparent animate-spin"></div>
                      <span className="text-sm font-medium">Loading policies...</span>
                    </div>
                  </td>
                </tr>
              ) : policies.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                        <FileText className="h-6 w-6 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">No policies found</h3>
                      <p className="text-sm text-gray-500 max-w-sm mx-auto">
                        Get started by creating your first policy like Terms and Conditions or Privacy Policy.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                policies.map((policy) => (
                  <tr key={policy.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="py-4 pl-6 pr-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
                          <FileText className="h-5 w-5 text-gray-500" />
                        </div>
                        <div>
                          <span className="font-bold text-gray-900 text-sm block">
                            {policy.title}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-3">
                      <span className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-gray-600 text-xs font-mono font-medium">
                        {policy.type}
                      </span>
                    </td>
                    <td className="py-4 px-3">
                      {policy.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                          ACTIVE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                          INACTIVE
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-3">
                      <span className="text-sm text-gray-500 font-medium">
                        {new Date(policy.updatedAt).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: '2-digit' })}
                      </span>
                    </td>
                    <td className="py-4 pr-6 pl-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/policies/${policy.id}`}
                          className="p-2 text-gray-400 hover:text-gold-600 hover:bg-gold-50 rounded-lg transition-colors"
                          title="Edit Policy"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(policy.id, policy.title)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Policy"
                        >
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
        {!isLoading && policies.length > 0 && (
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={pagination.limit}
            onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
            onLimitChange={(limit) => setPagination(prev => ({ ...prev, limit, page: 1 }))}
          />
        )}
      </div>
    </div>
  );
}
