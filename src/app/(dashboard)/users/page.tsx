"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { 
  Search, Filter, Download, Plus, MoreVertical, Eye, 
  ChevronLeft, ChevronRight, Users, UserCheck, Shield, Clock,
  ArrowUpRight, Loader2
} from "lucide-react";
import Link from "next/link";
import Pagination from "@/components/Pagination";
import { useToast } from "@/context/ToastContext";
import { getMediaUrl } from "@/lib/media";

export default function UserManagementPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [kpis, setKpis] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("All Users");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });

  // Debounce search input by 350ms to eliminate screen flickering
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    // Get current user to show "You" badge
    api.get("/users/me").then((res) => {
      setCurrentUser(res.data.data);
    }).catch(console.error);

    fetchKPIs();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [activeTab, pagination.page, pagination.limit, debouncedSearch]);

  const fetchKPIs = async () => {
    try {
      const res = await api.get("/users/kpis");
      setKpis(res.data.data);
    } catch (error) {
      console.error("Failed to fetch KPIs:", error);
    }
  };

  const fetchUsers = async () => {
    if (users.length === 0) {
      setIsLoading(true);
    } else {
      setIsSearching(true);
    }

    try {
      const res = await api.get("/users", {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          role: activeTab,
          search: debouncedSearch
        }
      });
      setUsers(res.data.data.users);
      setPagination(res.data.data.pagination);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  };

  const tabs = ["All Users", "Administrators", "Customers"];

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: '2-digit' });
  };

  // Mock data functions for fields not in DB yet
  const getMockPhone = (index: number) => `+91 98765 4321${index % 10}`;
  const getMockStatus = (index: number) => index % 7 === 0 ? "Inactive" : "Active";
  const getMockLastLogin = (dateStr: string) => {
    const d = new Date(dateStr);
    // Add a few days for mock last login
    d.setDate(d.getDate() + 2);
    return `${d.toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: '2-digit' })} ${d.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' })}`;
  };

  const handleExport = async () => {
    try {
      const response = await api.get('/users/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `users-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      showToast("Exported user list to CSV!", "success");
    } catch (error) {
      console.error("Failed to export users:", error);
      showToast("Failed to export users", "error");
    }
  };

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-brandDark font-serif-luxury tracking-tight">User Management</h1>
          <p className="mt-1.5 text-sm font-medium text-gray-500">
            Manage your administrators and customers.
          </p>
        </div>
        <Link href="/users/new" className="flex items-center gap-2 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-gold-500/20 transition-all text-sm">
          <Plus className="h-4 w-4" />
          Add New User
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { title: "Total Users", data: kpis?.totalUsers, icon: Users, color: "text-orange-500", bg: "bg-orange-50" },
          { title: "Administrators", data: kpis?.administrators, icon: Shield, color: "text-blue-500", bg: "bg-blue-50" },
          { title: "Customers", data: kpis?.customers, icon: UserCheck, color: "text-green-500", bg: "bg-green-50" },
          { title: "Active Users", data: kpis?.activeUsers, icon: Clock, color: "text-purple-500", bg: "bg-purple-50" },
        ].map((card, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-500 mb-1">{card.title}</p>
              <h3 className="text-2xl font-bold text-gray-900">{card.data?.count !== undefined ? card.data.count.toLocaleString() : '...'}</h3>
              <div className="flex items-center gap-1 mt-2 text-xs">
                <div className="flex items-center text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded-md">
                  <ArrowUpRight className="h-3 w-3 mr-0.5" />
                  {card.data?.trend || '0'}%
                </div>
                <span className="text-gray-400">vs last 30 days</span>
              </div>
            </div>
            <div className={`h-12 w-12 rounded-full ${card.bg} flex items-center justify-center`}>
              <card.icon className={`h-6 w-6 ${card.color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        
        {/* Controls */}
        <div className="p-4 sm:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100">
          
          {/* Tabs */}
          <div className="flex space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setPagination({ ...pagination, page: 1 }); }}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  activeTab === tab
                    ? "bg-gold-50 text-gold-700"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                {isSearching ? (
                  <Loader2 className="h-4 w-4 text-gold-500 animate-spin" />
                ) : (
                  <Search className="h-4 w-4 text-gray-400" />
                )}
              </div>
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none w-full md:w-72 bg-gray-50 transition-all"
              />
            </div>
            {/* Filter */}
            <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filter</span>
            </button>
            {/* Export */}
            <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="py-4 pl-6 pr-3 w-12"><input type="checkbox" className="rounded border-gray-300 text-gold-500 focus:ring-gold-500" /></th>
                <th className="py-4 px-3 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">User</th>
                <th className="py-4 px-3 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Role</th>
                <th className="py-4 px-3 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Email</th>
                <th className="py-4 px-3 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Phone</th>
                <th className="py-4 px-3 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                <th className="py-4 px-3 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Joined Date</th>
                <th className="py-4 px-3 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Last Login</th>
                <th className="py-4 pr-6 pl-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-sm text-gray-500">Loading users...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-sm text-gray-500">No users found.</td>
                </tr>
              ) : (
                users.map((user, idx) => {
                  const isCurrentUser = currentUser?.id === user.id;
                  const status = user.status || 'ACTIVE'; // Fallback in case old records have no status yet
                  return (
                    <tr 
                      key={user.id} 
                      onClick={() => router.push(`/users/${user.id}`)}
                      className="hover:bg-amber-50/40 transition-colors group cursor-pointer"
                    >
                      <td className="py-3 pl-6 pr-3" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" className="rounded border-gray-300 text-gold-500 focus:ring-gold-500 cursor-pointer" />
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-gold-100 text-gold-700 flex flex-shrink-0 items-center justify-center font-bold text-sm overflow-hidden shadow-sm">
                            {user.profileImage ? (
                              <img src={getMediaUrl(user.profileImage)} alt={user.firstName} className="h-full w-full object-cover" />
                            ) : (
                              `${user.firstName?.charAt(0) || ""}${user.lastName?.charAt(0) || ""}`
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-900 group-hover:text-gold-700 transition-colors">
                              {user.firstName} {user.lastName}
                            </span>
                            {isCurrentUser && (
                              <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">You</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {user.role === 'ADMIN' ? (
                          <span className="bg-orange-50 text-orange-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Super Admin</span>
                        ) : (
                          <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Customer</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-sm text-gray-600 whitespace-nowrap">{user.email}</td>
                      <td className="py-3 px-3 text-sm text-gray-600 whitespace-nowrap">{user.phone || getMockPhone(idx)}</td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                          {status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-sm text-gray-600 whitespace-nowrap">{formatDate(user.createdAt)}</td>
                      <td className="py-3 px-3 text-sm text-gray-600 whitespace-nowrap">{getMockLastLogin(user.createdAt)}</td>
                      <td className="py-3 pr-6 pl-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link href={`/users/${user.id}`} className="p-1.5 text-gray-400 hover:text-gold-600 hover:bg-gold-50 rounded-lg transition-colors" title="View Profile">
                            <Eye className="h-4 w-4" />
                          </Link>
                          <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!isLoading && users.length > 0 && (
          <Pagination
            page={pagination.page}
            limit={pagination.limit}
            total={pagination.total}
            totalPages={pagination.totalPages}
            itemLabel="users"
            onPageChange={(newPage) => setPagination((prev) => ({ ...prev, page: newPage }))}
            onLimitChange={(newLimit) => setPagination((prev) => ({ ...prev, limit: newLimit, page: 1 }))}
          />
        )}
      </div>
    </div>
  );
}
