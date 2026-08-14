"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api";
import { 
  ArrowLeft, 
  Loader2, 
  Mail, 
  Phone, 
  Calendar, 
  Clock, 
  Edit2, 
  ShieldAlert, 
  ShoppingBag, 
  MapPin, 
  FileText, 
  Download, 
  CheckCircle2, 
  XCircle, 
  Package, 
  CreditCard, 
  Bell, 
  Smartphone, 
  ExternalLink,
  Tag,
  ShieldCheck,
  Building,
  Navigation
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/context/ToastContext";
import { getMediaUrl } from "@/lib/media";
import Pagination from "@/components/Pagination";

export default function UserDetailsPage() {
  const params = useParams();
  const userId = params.id as string;
  const router = useRouter();
  const { showToast } = useToast();

  const [user, setUser] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"orders" | "addresses" | "activity" | "preferences">("orders");
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Orders pagination
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersLimit, setOrdersLimit] = useState(3);

  useEffect(() => {
    // Get current admin profile
    api.get("/users/me").then((res) => {
      setCurrentUser(res.data.data);
    }).catch(console.error);

    fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/users/${userId}`);
      setUser(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load user details");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" });
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return `${d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" })} ${d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
  };

  const handleToggleStatus = async () => {
    if (!user) return;
    const newStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setIsUpdatingStatus(true);
    try {
      await api.patch(`/users/${user.id}`, { status: newStatus });
      setUser((prev: any) => ({ ...prev, status: newStatus }));
      showToast(`User status updated to ${newStatus}`, "success");
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to update status", "error");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDownloadInvoice = async (orderId: string, orderNumber: string) => {
    try {
      setDownloadingInvoiceId(orderId);
      const res = await api.get(`/orders/${orderId}/invoice`, {
        responseType: "blob",
      });

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Invoice-${orderNumber || orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast("Invoice downloaded successfully", "success");
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || "Failed to download invoice", "error");
    } finally {
      setDownloadingInvoiceId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/50">Delivered</span>;
      case "SHIPPED":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/50">Shipped</span>;
      case "PROCESSING":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/50">Processing</span>;
      case "PAID":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200/50">Paid</span>;
      case "PENDING_PAYMENT":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-50 text-gray-700 border border-gray-200/50">Pending Payment</span>;
      case "CANCELLED":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-200/50">Cancelled</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-50 text-gray-600">{status}</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 text-gold-500 animate-spin" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-red-50 text-red-600 p-8 rounded-2xl border border-red-100 flex flex-col items-center justify-center text-center">
          <ShieldAlert className="h-12 w-12 mb-4 opacity-50" />
          <h2 className="text-lg font-bold mb-2">Error Loading User</h2>
          <p className="text-sm font-medium opacity-80 mb-6">{error || "User not found"}</p>
          <Link href="/users" className="px-6 py-2.5 bg-white border border-red-200 text-red-700 rounded-xl font-bold hover:bg-red-50 transition-colors">
            Back to Users
          </Link>
        </div>
      </div>
    );
  }

  const isSelf = currentUser?.id === user.id;
  const canEdit = isSelf || user.isCreatedByAdmin;
  const orders: any[] = user.orders || [];
  const addresses: any[] = user.addresses || [];
  const totalSpent = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  // Orders pagination calculations
  const totalOrders = orders.length;
  const totalOrderPages = Math.ceil(totalOrders / ordersLimit) || 1;
  const paginatedOrders = orders.slice((ordersPage - 1) * ordersLimit, ordersPage * ordersLimit);

  const formatCurrency = (amount: number) => {
    return Number(amount || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-500 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link href="/users" className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-2xs">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Link href="/users" className="hover:text-gold-600">User Management</Link>
              <span>›</span>
              <span className="text-gray-900 font-semibold">{user.firstName} {user.lastName}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-brandDark font-serif-luxury tracking-tight">User Details</h1>
          </div>
        </div>

        {/* Action Button: Status Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleStatus}
            disabled={isUpdatingStatus}
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 border transition-all ${
              user.status === "ACTIVE"
                ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
            }`}
          >
            {isUpdatingStatus ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : user.status === "ACTIVE" ? (
              <>
                <XCircle className="h-4 w-4" /> Deactivate User
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" /> Activate User
              </>
            )}
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Orders</span>
            <div className="p-2 bg-gold-50 text-gold-600 rounded-xl">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900 mt-2">{orders.length}</p>
          <span className="text-[11px] text-gray-500 font-medium">Lifetime transactions</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Spent</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900 mt-2">₹{totalSpent.toLocaleString("en-IN")}</p>
          <span className="text-[11px] text-emerald-600 font-medium">Gross value</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Saved Addresses</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <MapPin className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900 mt-2">{addresses.length}</p>
          <span className="text-[11px] text-gray-500 font-medium">Delivery locations</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Account Status</span>
            <div className={`p-2 rounded-xl ${user.status === "ACTIVE" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              user.status === "ACTIVE" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
            }`}>
              {user.status || "ACTIVE"}
            </span>
          </div>
          <span className="text-[11px] text-gray-500 font-medium block mt-1">Joined {formatDate(user.createdAt)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Profile Card & Preferences */}
        <div className="lg:col-span-1 space-y-6">
          {/* User Profile Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 flex flex-col items-center text-center">
            <div className="h-24 w-24 rounded-full bg-gradient-to-tr from-gold-100 to-amber-50 text-gold-700 flex items-center justify-center text-3xl font-black shadow-sm mb-4 overflow-hidden border-2 border-white ring-4 ring-gold-50/50">
              {user.profileImage ? (
                <img src={getMediaUrl(user.profileImage)} alt={user.firstName} className="h-full w-full object-cover" />
              ) : (
                `${user.firstName?.charAt(0) || ""}${user.lastName?.charAt(0) || ""}`
              )}
            </div>
            
            <h2 className="text-xl font-bold text-gray-900">{user.firstName} {user.lastName}</h2>
            <p className="text-xs font-bold uppercase tracking-wider text-gold-600 mt-0.5 mb-6">
              {user.role === "ADMIN" ? "Administrator" : "Customer"}
            </p>
            
            <div className="w-full space-y-3.5 text-sm text-left">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-500 font-medium">User ID</span>
                <span className="text-gray-900 font-bold font-mono text-xs bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                  {user.id}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-500 font-medium">Email Address</span>
                <span className="text-gray-900 font-semibold text-xs truncate max-w-[180px]" title={user.email}>
                  {user.email}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-500 font-medium">Phone Number</span>
                <span className="text-gray-900 font-semibold text-xs">{user.phone || "Not provided"}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-500 font-medium">Joined On</span>
                <span className="text-gray-900 font-semibold text-xs">{formatDate(user.createdAt)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-500 font-medium">Last Login</span>
                <span className="text-gray-900 font-semibold text-xs">{formatDateTime(user.updatedAt)}</span>
              </div>
            </div>

            <div className="w-full mt-6 space-y-2">
              {!canEdit && (
                <div className="w-full text-center p-2.5 bg-gray-50 border border-gray-200 rounded-xl">
                  <p className="text-[11px] font-medium text-gray-500">Self-registered customer profile.</p>
                </div>
              )}
            </div>
          </div>

          {/* App Status & Notification Preferences */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Bell className="h-4 w-4 text-gold-600" /> App & Notification Channels
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-white rounded-lg border border-gray-200 text-gray-600">
                    <Smartphone className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Web Push Notifications</p>
                    <p className="text-[10px] text-gray-500">Browser alerts & updates</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${user.webPushNotifications !== false ? "bg-emerald-50 text-emerald-700" : "bg-gray-200 text-gray-600"}`}>
                  {user.webPushNotifications !== false ? "ON" : "OFF"}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-white rounded-lg border border-gray-200 text-gray-600">
                    <Mail className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Email Notifications</p>
                    <p className="text-[10px] text-gray-500">Order receipts & promo</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${user.emailNotifications !== false ? "bg-emerald-50 text-emerald-700" : "bg-gray-200 text-gray-600"}`}>
                  {user.emailNotifications !== false ? "ON" : "OFF"}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-white rounded-lg border border-gray-200 text-gray-600">
                    <Phone className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">SMS & WhatsApp Alerts</p>
                    <p className="text-[10px] text-gray-500">Delivery status updates</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${user.whatsappNotifications ? "bg-emerald-50 text-emerald-700" : "bg-gray-200 text-gray-600"}`}>
                  {user.whatsappNotifications ? "ON" : "OFF"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Tabbed Sections (Orders, Addresses, Activity) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Navigation Tabs */}
          <div className="bg-white p-1.5 rounded-2xl border border-gray-100 shadow-xs flex gap-2">
            <button
              onClick={() => setActiveTab("orders")}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === "orders"
                  ? "bg-gold-500 text-black shadow-xs"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <ShoppingBag className="h-4 w-4" /> Orders ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab("addresses")}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === "addresses"
                  ? "bg-gold-500 text-black shadow-xs"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <MapPin className="h-4 w-4" /> Addresses ({addresses.length})
            </button>
            <button
              onClick={() => setActiveTab("activity")}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === "activity"
                  ? "bg-gold-500 text-black shadow-xs"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Clock className="h-4 w-4" /> Activity Log
            </button>
          </div>

          {/* TAB 1: ORDERS & PURCHASED PRODUCTS */}
          {activeTab === "orders" && (
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-12 text-center">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                    <ShoppingBag className="h-6 w-6" />
                  </div>
                  <h4 className="text-base font-bold text-gray-900">No orders placed yet</h4>
                  <p className="text-xs text-gray-500 mt-1">This user hasn't made any purchases on the store.</p>
                </div>
              ) : (
                <>
                  {paginatedOrders.map((order) => (
                    <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
                      {/* Order Header */}
                      <div className="p-4 sm:p-5 bg-gray-50/70 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded-xl border border-gray-200 shadow-2xs">
                            <Package className="h-5 w-5 text-gold-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-black text-gray-900">{order.orderNumber}</span>
                              {getStatusBadge(order.status)}
                            </div>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">
                              Placed on {formatDateTime(order.createdAt)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Download Invoice Button */}
                          <button
                            onClick={() => handleDownloadInvoice(order.id, order.orderNumber)}
                            disabled={downloadingInvoiceId === order.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 transition-colors shadow-2xs cursor-pointer"
                            title="Download Tax Invoice"
                          >
                            {downloadingInvoiceId === order.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Download className="h-3.5 w-3.5 text-gold-600" />
                            )}
                            Invoice
                          </button>

                          {/* View in Orders Manager */}
                          <Link
                            href={`/orders/${order.id}`}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gold-50 text-gold-700 border border-gold-200 rounded-xl text-xs font-bold hover:bg-gold-100 transition-colors"
                          >
                            <ExternalLink className="h-3.5 w-3.5" /> View Details
                          </Link>
                        </div>
                      </div>

                      {/* Ordered Products Items */}
                      <div className="p-4 sm:p-5 divide-y divide-gray-100">
                        {(order.items || []).map((item: any) => {
                          const product = item.product || {};
                          const variant = item.variant;
                          const image = product.images?.[0] || "";
                          const itemTotal = (item.unitPrice || 0) * (item.quantity || 1);

                          return (
                            <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3.5 min-w-0">
                                <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden">
                                  {image ? (
                                    <img src={getMediaUrl(image)} alt={product.title} className="w-full h-full object-cover" />
                                  ) : (
                                    <Package className="h-5 w-5 text-gray-400" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                                    {product.title || "Product item"}
                                  </p>
                                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-500 font-medium">
                                    {variant?.title && (
                                      <span className="bg-gold-50 text-gold-700 px-1.5 py-0.2 rounded font-semibold border border-gold-200/50">
                                        {variant.title}
                                      </span>
                                    )}
                                    {product.sku && <span>SKU: {product.sku}</span>}
                                    <span>Qty: {item.quantity}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <p className="text-xs sm:text-sm font-bold text-gray-900">₹{formatCurrency(itemTotal)}</p>
                                <p className="text-[10px] text-gray-500">₹{formatCurrency(item.unitPrice || 0)} each</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Order Footer & Shipping info */}
                      <div className="p-3.5 sm:p-4 bg-gray-50 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-gray-600">
                        <div className="flex items-center gap-1.5 truncate max-w-md">
                          <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                          <span className="truncate">
                            Ship to: <strong className="text-gray-800">{order.shippingName}</strong>, {order.shippingAddress}, {order.shippingCity}, {order.shippingState} - {order.shippingPincode}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          <span>Payment: <strong className="text-gray-900 uppercase">{order.paymentMethod || "PREPAID"}</strong></span>
                          <span>Total: <strong className="text-sm font-black text-gray-900">₹{formatCurrency(order.totalAmount || 0)}</strong></span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Pagination Component */}
                  {totalOrders > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden mt-4">
                      <Pagination
                        page={ordersPage}
                        limit={ordersLimit}
                        total={totalOrders}
                        totalPages={totalOrderPages}
                        itemLabel="orders"
                        onPageChange={setOrdersPage}
                        onLimitChange={(newLimit) => {
                          setOrdersLimit(newLimit);
                          setOrdersPage(1);
                        }}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* TAB 2: SAVED ADDRESSES */}
          {activeTab === "addresses" && (
            <div className="space-y-4">
              {addresses.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-12 text-center">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <h4 className="text-base font-bold text-gray-900">No saved addresses</h4>
                  <p className="text-xs text-gray-500 mt-1">This user has not added any delivery address yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map((addr, idx) => (
                    <div key={addr.id || idx} className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5 relative flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                            <Building className="h-3.5 w-3.5 text-gold-600" /> Address #{idx + 1}
                          </span>
                          {addr.isDefault && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Default Address
                            </span>
                          )}
                        </div>

                        <p className="text-sm font-bold text-gray-900 leading-snug">{addr.flatHouse}</p>
                        <p className="text-xs text-gray-600 mt-1">{addr.areaStreet}</p>
                        {addr.landmark && (
                          <p className="text-xs text-gray-500 mt-0.5">Landmark: {addr.landmark}</p>
                        )}
                        <p className="text-xs font-semibold text-gray-800 mt-2">
                          {addr.townCity}, {addr.state} - <span className="font-mono font-bold text-gold-600">{addr.pincode}</span>
                        </p>

                        {addr.deliveryInstructions && (
                          <div className="mt-3 p-2 bg-gray-50 rounded-xl border border-gray-100 text-[11px] text-gray-600">
                            <strong>Instructions:</strong> {addr.deliveryInstructions}
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                        <span>Added {formatDate(addr.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ACTIVITY LOG */}
          {activeTab === "activity" && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 sm:p-8">
              <h3 className="text-base font-bold text-gray-900 mb-6">User Activity Timeline</h3>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="h-9 w-9 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-200">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 pb-6 border-b border-gray-100">
                    <div className="flex justify-between sm:items-center flex-col sm:flex-row gap-1">
                      <p className="text-sm font-bold text-gray-900">Account Created & Registered</p>
                      <p className="text-xs font-medium text-gray-500">{formatDateTime(user.createdAt)}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">User completed {user.isCreatedByAdmin ? "admin account creation" : "self-registration"} successfully.</p>
                  </div>
                </div>

                {orders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex gap-4">
                    <div className="h-9 w-9 rounded-full bg-gold-50 flex items-center justify-center shrink-0 border border-gold-200">
                      <ShoppingBag className="h-4 w-4 text-gold-600" />
                    </div>
                    <div className="flex-1 pb-6 border-b border-gray-100">
                      <div className="flex justify-between sm:items-center flex-col sm:flex-row gap-1">
                        <p className="text-sm font-bold text-gray-900">Placed Order #{order.orderNumber}</p>
                        <p className="text-xs font-medium text-gray-500">{formatDateTime(order.createdAt)}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Amount: ₹{(order.totalAmount || 0).toLocaleString("en-IN")} • Status: {order.status}
                      </p>
                    </div>
                  </div>
                ))}

                <div className="flex gap-4">
                  <div className="h-9 w-9 rounded-full bg-blue-50 flex items-center justify-center shrink-0 border border-blue-200">
                    <Clock className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between sm:items-center flex-col sm:flex-row gap-1">
                      <p className="text-sm font-bold text-gray-900">Last Profile Synchronization</p>
                      <p className="text-xs font-medium text-gray-500">{formatDateTime(user.updatedAt)}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">Session verified and access token refreshed.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
