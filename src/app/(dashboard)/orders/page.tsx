'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { orderAPI } from '@/lib/api/order';
import Pagination from '@/components/Pagination';
import {
  Search,
  Eye,
  Filter,
  Package,
  ShoppingBag,
  CheckCircle,
  Truck,
  Clock,
  XCircle,
  IndianRupee,
  Calendar,
  X,
  RotateCcw,
  Check,
  ChevronDown,
  Phone,
  User,
  Tag,
} from 'lucide-react';

export default function OrdersListPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [kpis, setKpis] = useState({
    totalOrders: 0,
    deliveredOrders: 0,
    processingOrders: 0,
    shippedOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0,
  });

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [datePreset, setDatePreset] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilterPopover, setShowFilterPopover] = useState(false);

  const filterRef = useRef<HTMLDivElement>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Handle Date Presets
  const handleDatePresetChange = (preset: string) => {
    setDatePreset(preset);
    const now = new Date();
    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    if (preset === 'ALL') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'TODAY') {
      const todayStr = formatDate(now);
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'YESTERDAY') {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const yStr = formatDate(y);
      setStartDate(yStr);
      setEndDate(yStr);
    } else if (preset === 'LAST_7_DAYS') {
      const past = new Date(now);
      past.setDate(past.getDate() - 7);
      setStartDate(formatDate(past));
      setEndDate(formatDate(now));
    } else if (preset === 'LAST_30_DAYS') {
      const past = new Date(now);
      past.setDate(past.getDate() - 30);
      setStartDate(formatDate(past));
      setEndDate(formatDate(now));
    } else if (preset === 'THIS_MONTH') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(formatDate(firstDay));
      setEndDate(formatDate(now));
    }
  };

  // Close filter popover on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilterPopover(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch orders whenever filters or pagination change
  useEffect(() => {
    fetchOrders();
  }, [page, limit, debouncedSearch, statusFilter, startDate, endDate]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const res = await orderAPI.getAllOrders({
        page,
        limit,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        search: debouncedSearch.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      if (res.success) {
        setOrders(res.data.orders);
        setTotal(res.data.pagination.total);
        setTotalPages(res.data.pagination.totalPages);
        if (res.data.kpis) {
          setKpis(res.data.kpis);
        }
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setStatusFilter('ALL');
    setDatePreset('ALL');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const hasActiveFilters =
    debouncedSearch.trim() !== '' ||
    statusFilter !== 'ALL' ||
    datePreset !== 'ALL' ||
    startDate !== '' ||
    endDate !== '';

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'PENDING_PAYMENT':
        return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'PAID':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'PROCESSING':
        return 'bg-indigo-100 text-indigo-800 border border-indigo-200';
      case 'SHIPPED':
        return 'bg-purple-100 text-purple-800 border border-purple-200';
      case 'OUT_FOR_DELIVERY':
        return 'bg-orange-100 text-orange-800 border border-orange-200';
      case 'DELIVERED':
        return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const {
    totalOrders,
    deliveredOrders,
    processingOrders,
    shippedOrders,
    cancelledOrders,
    totalRevenue,
  } = kpis;

  const formatCurrency = (value: number) => {
    if (value >= 10000000) return `₹${Number((value / 10000000).toFixed(2))}Cr`;
    if (value >= 100000) return `₹${Number((value / 100000).toFixed(2))}L`;
    if (value >= 1000) return `₹${Number((value / 1000).toFixed(2))}K`;
    return `₹${value.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="space-y-6">
      
      {/* Header with Search & Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Orders Management
          </h1>
          <p className="mt-1 text-sm font-medium text-gray-500">
            Track, filter, and inspect customer orders with live search and custom date intelligence.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          
          {/* Universal Search Input (Order #, Name, Mobile, Email) */}
          <div className="relative min-w-[280px] sm:min-w-[340px] flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Order #, Name, Mobile, Email..."
              className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-300 rounded-xl text-xs font-semibold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-xs transition-all"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded-full hover:bg-gray-100"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter Popover Button */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setShowFilterPopover(!showFilterPopover)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all shadow-xs cursor-pointer ${
                hasActiveFilters
                  ? 'bg-amber-600 text-white border-amber-600 hover:bg-amber-700'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Filter size={15} />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-amber-200 animate-pulse" />
              )}
            </button>

            {/* Filter Dropdown Popover */}
            {showFilterPopover && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 p-5 z-40 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                  <div className="flex items-center gap-2 font-bold text-gray-900 text-sm">
                    <Filter size={16} className="text-amber-600" />
                    <span>Filter Orders</span>
                  </div>
                  <button
                    onClick={() => setShowFilterPopover(false)}
                    className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-4 text-xs">
                  
                  {/* Order Status Filter */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1.5 uppercase text-[10px] tracking-wider">
                      Order Status
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setPage(1);
                      }}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-semibold text-gray-800 focus:ring-1 focus:ring-amber-500 outline-none"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="PENDING_PAYMENT">Pending Payment</option>
                      <option value="PAID">Paid</option>
                      <option value="PROCESSING">Processing</option>
                      <option value="SHIPPED">Shipped</option>
                      <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                      <option value="DELIVERED">Delivered</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>

                  {/* Date Range Preset */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1.5 uppercase text-[10px] tracking-wider">
                      Date Presets
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { label: 'All Time', value: 'ALL' },
                        { label: 'Today', value: 'TODAY' },
                        { label: 'Yesterday', value: 'YESTERDAY' },
                        { label: 'Last 7 Days', value: 'LAST_7_DAYS' },
                        { label: 'Last 30 Days', value: 'LAST_30_DAYS' },
                        { label: 'This Month', value: 'THIS_MONTH' },
                      ].map((preset) => (
                        <button
                          key={preset.value}
                          type="button"
                          onClick={() => handleDatePresetChange(preset.value)}
                          className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all text-center ${
                            datePreset === preset.value
                              ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                              : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Date Range Picker */}
                  <div className="pt-2 border-t border-gray-100">
                    <label className="block font-bold text-gray-700 mb-1.5 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                      <Calendar size={13} className="text-amber-600" />
                      Custom Date Range
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-gray-500 font-semibold block mb-1">
                          From Date
                        </span>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => {
                            setStartDate(e.target.value);
                            setDatePreset('CUSTOM');
                            setPage(1);
                          }}
                          className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:ring-1 focus:ring-amber-500 outline-none"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-500 font-semibold block mb-1">
                          To Date
                        </span>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => {
                            setEndDate(e.target.value);
                            setDatePreset('CUSTOM');
                            setPage(1);
                          }}
                          className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:ring-1 focus:ring-amber-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-bold transition-colors flex items-center gap-1 text-[11px]"
                    >
                      <RotateCcw size={12} />
                      Reset All
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowFilterPopover(false)}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition-colors shadow-xs text-[11px]"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active Filter Badges Bar */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap text-xs bg-amber-50/60 p-3 rounded-2xl border border-amber-200/60">
          <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
            Active Filters:
          </span>

          {debouncedSearch && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-amber-300 rounded-full font-bold text-amber-950">
              <Search size={11} />
              "{debouncedSearch}"
              <button
                onClick={() => setSearch('')}
                className="hover:text-red-500 ml-0.5"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {statusFilter !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-amber-300 rounded-full font-bold text-amber-950">
              Status: {statusFilter.replace(/_/g, ' ')}
              <button
                onClick={() => setStatusFilter('ALL')}
                className="hover:text-red-500 ml-0.5"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {(startDate || endDate) && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-amber-300 rounded-full font-bold text-amber-950">
              <Calendar size={11} />
              {startDate || 'Start'} → {endDate || 'Today'}
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setDatePreset('ALL');
                }}
                className="hover:text-red-500 ml-0.5"
              >
                <X size={12} />
              </button>
            </span>
          )}

          <button
            onClick={handleResetFilters}
            className="text-[11px] font-extrabold text-red-600 hover:text-red-800 underline ml-auto cursor-pointer"
          >
            Clear All
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1">Total Orders</p>
            <h3 className="text-2xl font-extrabold text-gray-900">{totalOrders}</h3>
          </div>
          <div className="h-10 w-10 rounded-full bg-purple-50 flex items-center justify-center">
            <ShoppingBag className="h-5 w-5 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1">Processing</p>
            <h3 className="text-2xl font-extrabold text-indigo-600">{processingOrders}</h3>
          </div>
          <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center">
            <Clock className="h-5 w-5 text-indigo-600" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1">Shipped</p>
            <h3 className="text-2xl font-extrabold text-purple-600">{shippedOrders}</h3>
          </div>
          <div className="h-10 w-10 rounded-full bg-purple-50 flex items-center justify-center">
            <Truck className="h-5 w-5 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1">Delivered</p>
            <h3 className="text-2xl font-extrabold text-green-600">{deliveredOrders}</h3>
          </div>
          <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center">
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1">Cancelled</p>
            <h3 className="text-2xl font-extrabold text-red-600">{cancelledOrders}</h3>
          </div>
          <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center">
            <XCircle className="h-5 w-5 text-red-600" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[13px] font-bold text-gray-600 mb-1.5 tracking-tight">Total Revenue</p>
            <h3 className="text-[26px] font-black text-[#D97706] tracking-tight">{formatCurrency(totalRevenue)}</h3>
          </div>
          <div className="h-10 w-8 rounded-lg bg-amber-50 flex items-center justify-center">
            <IndianRupee className="h-5 w-5 text-[#D97706]" strokeWidth={2.5} />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-extrabold uppercase tracking-wider text-gray-500">
                <th className="p-4">Order ID</th>
                <th className="p-4">Date</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Items</th>
                <th className="p-4">Total</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-gray-400">
                    <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center">
                      <Package size={36} className="text-gray-300 mb-2" />
                      <p className="font-bold text-gray-600 text-sm">No matching orders found</p>
                      <p className="text-[11px] text-gray-400 mt-1">
                        Try adjusting your search query, status, or date range filters.
                      </p>
                      {hasActiveFilters && (
                        <button
                          onClick={handleResetFilters}
                          className="mt-3 px-3 py-1.5 bg-amber-50 text-amber-800 hover:bg-amber-100 rounded-xl font-bold text-xs transition-colors"
                        >
                          Reset Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const customerPhone =
                    order.shippingPhone ||
                    order.userProfile?.phone ||
                    '';

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-amber-50/40 transition-colors group cursor-pointer"
                      onClick={() => router.push(`/orders/${order.id}`)}
                    >
                      <td className="p-4">
                        <div className="font-mono font-extrabold text-gray-900 group-hover:text-amber-800 transition-colors">
                          #{order.orderNumber}
                        </div>
                        {order.couponCode && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-bold border border-amber-200 mt-1">
                            <Tag size={10} />
                            <span>{order.couponCode}</span>
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                        <div className="text-[10px] text-gray-400">
                          {new Date(order.createdAt).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900">
                            {order.shippingName ||
                              `${order.userProfile?.user?.firstName || ''} ${
                                order.userProfile?.user?.lastName || ''
                              }`.trim() ||
                              'Guest'}
                          </span>
                          <span className="text-[11px] text-gray-500">
                            {order.userProfile?.user?.email || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-gray-700 font-medium">
                        {customerPhone ? (
                          <div className="flex items-center gap-1 text-gray-900 font-mono text-[11px]">
                            <Phone size={12} className="text-gray-400 shrink-0" />
                            <span>{customerPhone}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-[11px] italic">Not Provided</span>
                        )}
                      </td>
                      <td className="p-4 text-gray-600">
                        {order.items?.reduce(
                          (sum: number, item: any) => sum + item.quantity,
                          0
                        ) || 0}{' '}
                        items
                      </td>
                      <td className="p-4 font-black text-gray-900">
                        ₹{order.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusBadgeColor(
                            order.status
                          )}`}
                        >
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <Link
                          href={`/orders/${order.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-gray-700 bg-gray-100 rounded-xl hover:bg-amber-600 hover:text-white transition-all shadow-2xs"
                        >
                          <Eye size={14} />
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          limit={limit}
          total={total}
          totalPages={totalPages}
          itemLabel="orders"
          onPageChange={setPage}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
        />
      </div>
    </div>
  );
}
