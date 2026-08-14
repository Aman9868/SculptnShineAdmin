'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { orderAPI } from '@/lib/api/order';
import Pagination from '@/components/Pagination';
import { Search, Eye, Filter, Package, ShoppingBag, CheckCircle, Truck, Clock, XCircle, IndianRupee } from 'lucide-react';

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

  useEffect(() => {
    fetchOrders(page, limit);
  }, [page, limit]);

  const fetchOrders = async (p: number, l: number) => {
    try {
      setIsLoading(true);
      const res = await orderAPI.getAllOrders(p, l);
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

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'PENDING_PAYMENT': return 'bg-yellow-100 text-yellow-800';
      case 'PAID': return 'bg-blue-100 text-blue-800';
      case 'PROCESSING': return 'bg-indigo-100 text-indigo-800';
      case 'SHIPPED': return 'bg-purple-100 text-purple-800';
      case 'OUT_FOR_DELIVERY': return 'bg-orange-100 text-orange-800';
      case 'DELIVERED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const { totalOrders, deliveredOrders, processingOrders, shippedOrders, cancelledOrders, totalRevenue } = kpis;

  const formatCurrency = (value: number) => {
    if (value >= 10000000) return `₹${Number((value / 10000000).toFixed(2))}Cr`;
    if (value >= 100000) return `₹${Number((value / 100000).toFixed(2))}L`;
    if (value >= 1000) return `₹${Number((value / 1000).toFixed(2))}K`;
    return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Orders Management</h1>
          <p className="mt-1 text-sm font-medium text-gray-500">Track and manage all customer orders.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search orders..." 
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brandPrimary"
            />
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 bg-white shadow-sm">
            <Filter size={18} />
            Filter
          </button>
        </div>
      </div>

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

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                <th className="p-4 font-semibold">Order ID</th>
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">Customer</th>
                <th className="p-4 font-semibold">Items</th>
                <th className="p-4 font-semibold">Total</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <Package size={32} className="text-gray-400 mb-2" />
                      <p>No orders found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr 
                    key={order.id} 
                    className="hover:bg-gray-50 transition-colors group cursor-pointer"
                    onClick={() => router.push(`/orders/${order.id}`)}
                  >
                    <td className="p-4 font-medium text-gray-900">
                      #{order.orderNumber}
                    </td>
                    <td className="p-4 text-gray-600 text-sm">
                      {new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{order.shippingName}</span>
                        <span className="text-xs text-gray-500">{order.userProfile?.user?.email || 'Guest'}</span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-600 text-sm">
                      {order.items.reduce((sum: number, item: any) => sum + item.quantity, 0)} items
                    </td>
                    <td className="p-4 font-medium text-gray-900">
                      ₹{order.totalAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(order.status)}`}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Link 
                        href={`/orders/${order.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-900 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                      >
                        <Eye size={16} />
                        View
                      </Link>
                    </td>
                  </tr>
                ))
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
