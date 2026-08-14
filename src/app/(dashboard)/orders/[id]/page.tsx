'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { orderAPI } from '@/lib/api/order';
import { api } from '@/lib/api';
import { ArrowLeft, Package, Truck, User, MapPin, Calendar, Clock, CreditCard, Save, FileText, Activity, ShoppingBag } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: orderId } = use(params);
  const router = useRouter();
  const { showToast } = useToast();
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Status Management State
  const [newStatus, setNewStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [comment, setComment] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setIsLoading(true);
      const res = await orderAPI.getOrderById(orderId);
      if (res.success) {
        setOrder(res.data);
        setNewStatus(res.data.status);
        setTrackingNumber(res.data.trackingNumber || '');
      }
    } catch (error) {
      console.error('Failed to fetch order:', error);
      showToast('Failed to load order details', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    try {
      setIsUpdating(true);
      const res = await orderAPI.updateOrderStatus(orderId, newStatus, trackingNumber, comment);
      if (res.success) {
        showToast('Order status updated successfully', 'success');
        setOrder(res.data);
        setComment(''); // Clear comment after success
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to update order status', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      setIsDownloading(true);
      const res = await api.get(`/orders/${orderId}/invoice`, {
        responseType: 'blob',
      });

      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice-${order?.orderNumber || orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast('Invoice downloaded successfully', 'success');
    } catch (error: any) {
      console.error('Error downloading invoice:', error);
      showToast(error.response?.data?.message || error.message || 'Failed to download invoice', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-10 h-10 border-4 border-brandSecondary border-t-brandPrimary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
        <button onClick={() => router.push('/orders')} className="text-brandPrimary hover:underline">
          Back to Orders
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
      
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/orders')}
            className="p-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 text-gray-600 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              Order #{order.orderNumber}
              <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm font-semibold rounded-full uppercase">
                {order.status.replace(/_/g, ' ')}
              </span>
            </h1>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
              <Calendar size={14} />
              {new Date(order.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        
        <button
          onClick={handleDownloadInvoice}
          disabled={isDownloading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 text-gray-700 transition-colors font-medium text-sm disabled:opacity-70"
        >
          {isDownloading ? (
            <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <FileText size={16} />
          )}
          Download Invoice
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Column */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Order Items */}
          <div className="bg-white rounded-2xl shadow-sm border border-orange-100/60 p-6">
            <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
              <ShoppingBag size={18} className="text-orange-500" />
              Order Items ({order.items.reduce((sum: number, item: any) => sum + item.quantity, 0)})
            </h3>
            <div className="space-y-4">
              {order.items.map((item: any) => (
                <div key={item.id} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                  <div className="w-16 h-16 bg-gray-50 rounded-xl border border-gray-100 flex-shrink-0 p-2">
                    {item.product.images?.[0] ? (
                      <img src={item.product.images[0]} alt={item.product.title} className="w-full h-full object-contain mix-blend-multiply" />
                    ) : (
                      <Package className="w-full h-full text-gray-300 p-2" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h4 className="font-bold text-gray-900 text-sm">{item.product.title}</h4>
                      <span className="font-bold text-gray-900 text-sm">₹{(item.unitPrice * (1 - (item.discountPercentage || 0) / 100) * item.quantity).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-1">{item.variant?.title || 'Default Variant'}</p>
                    <p className="text-xs text-gray-500">₹{(item.unitPrice * (1 - (item.discountPercentage || 0) / 100)).toLocaleString('en-IN', { maximumFractionDigits: 2 })} × {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-100 space-y-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>₹{order.totalAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Discount</span>
                <span>-</span>
              </div>
              <div className="flex justify-between items-center text-lg font-bold text-gray-900 pt-3 mt-3 border-t border-gray-100">
                <span>Total Amount</span>
                <span className="text-orange-600">₹{order.totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
          
          {/* Customer & Shipping Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-orange-100/60 p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <User size={18} className="text-orange-500" /> Customer Information
              </h3>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-gray-500 mb-1">Name</p>
                  <p className="font-medium text-gray-900">{order.userProfile?.user?.firstName} {order.userProfile?.user?.lastName}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Email</p>
                  <p className="font-medium text-gray-900">{order.userProfile?.user?.email}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Phone</p>
                  <p className="font-medium text-gray-900">{order.shippingPhone}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-orange-100/60 p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin size={18} className="text-orange-500" /> Shipping Address
              </h3>
              <div className="space-y-4 text-sm text-gray-900 font-medium">
                <div>
                  <p>{order.shippingName}</p>
                  <p>{order.shippingAddress}</p>
                  <p>{order.shippingCity}, {order.shippingState} {order.shippingPincode}</p>
                  <p className="text-gray-500 font-normal">India</p>
                </div>
                <p className="text-gray-500 font-normal">Phone: <span className="text-gray-900 font-medium">{order.shippingPhone}</span></p>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-white rounded-2xl shadow-sm border border-orange-100/60 p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText size={18} className="text-orange-500" /> Additional Information
            </h3>
            <div className="grid grid-cols-[150px_1fr] gap-y-3 text-sm">
              <div className="text-gray-500">Order ID</div>
              <div className="font-medium text-gray-900">{order.orderNumber}</div>
              
              <div className="text-gray-500">Order Date</div>
              <div className="font-medium text-gray-900">{new Date(order.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
              
              <div className="text-gray-500">Payment Method</div>
              <div className="font-medium text-gray-900">{order.paymentMethod === 'RAZORPAY' ? 'Online Payment' : order.paymentMethod}</div>
              
              <div className="text-gray-500">Shipping Method</div>
              <div className="font-medium text-gray-900">Standard Delivery (3-5 Business Days)</div>
              
              <div className="text-gray-500">IP Address</div>
              <div className="font-medium text-gray-900">-</div>
              
              <div className="text-gray-500">User Agent</div>
              <div className="font-medium text-gray-900">-</div>
            </div>
          </div>
        </div>

        {/* Right Column (Status Management) */}
        <div className="space-y-6">
          
          <div className="bg-white rounded-2xl shadow-sm border border-orange-100/60 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Truck size={18} className="text-orange-500" /> Order Status
              </h3>
              <span className={`px-2.5 py-1 text-xs font-bold rounded ${order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {order.status.replace(/_/g, ' ')}
              </span>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Update Status</label>
                <select 
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                >
                  <option value="PENDING_PAYMENT">Pending Payment</option>
                  <option value="PAID">Paid</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="SHIPPED">Shipped</option>
                  <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Tracking Number</label>
                <input 
                  type="text"
                  placeholder="e.g. AWB123456789"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full p-2.5 border border-orange-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none bg-orange-50/30"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Add Note (Visible to customer)</label>
                <textarea 
                  rows={3}
                  placeholder="e.g. Your package has been handed over to BlueDart."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none"
                ></textarea>
              </div>

              <button 
                onClick={handleUpdateStatus}
                disabled={isUpdating}
                className="w-full py-2.5 mt-2 bg-gray-900 text-white rounded-lg font-bold text-sm shadow-md hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isUpdating ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Save size={16} />
                    Update Status & Notify
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-orange-100/60 p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard size={18} className="text-orange-500" /> Payment Information
            </h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Status</span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                  order.paymentStatus === 'COMPLETED' ? 'bg-green-100 text-green-700' : 
                  order.paymentStatus === 'FAILED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {order.paymentStatus}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Method</span>
                <span className="font-medium text-gray-900">{order.paymentMethod === 'RAZORPAY' ? 'Online Payment' : order.paymentMethod}</span>
              </div>
              {order.payments?.[0] && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Transaction ID</span>
                  <span className="font-medium text-gray-900">{order.payments[0].transactionId || order.payments[0].merchantTransactionId}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Order Timeline */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-orange-100/60 p-6">
              <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Activity size={18} className="text-orange-500" /> Order Timeline
              </h3>
              <div className="relative pl-6 space-y-6">
                {/* Vertical Line */}
                <div className="absolute top-2 left-2 bottom-2 w-[1px] bg-gray-200"></div>
                
                {order.statusHistory.map((history: any, idx: number) => (
                  <div key={history.id} className="relative">
                    {/* Node */}
                    <div className={`absolute -left-[32px] w-[9px] h-[9px] rounded-full border border-white ${
                      idx === 0 ? 'bg-orange-500' : 'bg-orange-500'
                    }`}></div>
                    
                    <div className="flex justify-between items-start -mt-1.5">
                      <span className="font-bold text-gray-900 text-sm">{history.status.replace(/_/g, ' ')}</span>
                      <span className="text-xs text-gray-500 text-right">
                        {new Date(history.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {history.comment && (
                      <div className="mt-2 text-xs text-gray-500 italic">
                        Note: {history.comment}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}
