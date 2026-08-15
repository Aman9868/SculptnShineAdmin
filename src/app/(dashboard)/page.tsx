"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { orderAPI } from "@/lib/api/order";
import { useRouter } from "next/navigation";
import { 
  Users, 
  TrendingUp, 
  ShoppingBag, 
  DollarSign, 
  Info, 
  Package,
  Calendar,
  CalendarDays,
  Loader2,
  Filter
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";

// Fallback Mock Data for Charts when no database sales exist yet
const fallbackSalesData = [
  { name: 'May 25', revenue: 20000, orders: 30 },
  { name: 'May 26', revenue: 24000, orders: 34 },
  { name: 'May 27', revenue: 41000, orders: 48 },
  { name: 'May 28', revenue: 26000, orders: 32 },
  { name: 'May 29', revenue: 8000,  orders: 12 },
  { name: 'May 30', revenue: 18000, orders: 24 },
  { name: 'May 31', revenue: 30000, orders: 38 },
];

const sparklineUsers = [{v: 10},{v: 20},{v: 15},{v: 25},{v: 22},{v: 30},{v: 28}];
const sparklineOpenRate = [{v: 40},{v: 30},{v: 45},{v: 42},{v: 50},{v: 48},{v: 55}];
const sparklineOrders = [{v: 30},{v: 25},{v: 28},{v: 22},{v: 24},{v: 20},{v: 18}];
const sparklineRevenue = [{v: 15},{v: 20},{v: 18},{v: 25},{v: 24},{v: 35},{v: 30}];

// Custom Currency Formatter (e.g. ₹8.62K, ₹1.5L, ₹10M, ₹1Cr) matching Orders Management
const formatCurrencyCompact = (value: number | string | undefined | null) => {
  const num = typeof value === 'string' ? parseFloat(value) : Number(value || 0);
  if (isNaN(num) || num === 0) return '₹0';
  if (num >= 10000000) return `₹${Number((num / 10000000).toFixed(2))}Cr`;
  if (num >= 1000000) return `₹${Number((num / 1000000).toFixed(2))}M`;
  if (num >= 100000) return `₹${Number((num / 100000).toFixed(2))}L`;
  if (num >= 1000) return `₹${Number((num / 1000).toFixed(2))}K`;
  return `₹${Number(num.toFixed(2)).toLocaleString('en-IN')}`;
};

export default function DashboardHome() {
  const [stats, setStats] = useState({ totalUsers: 0, totalProducts: 0, loading: true });
  const [kpis, setKpis] = useState({
    totalOrders: 0,
    paidOrdersCount: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
  });
  const [salesChart, setSalesChart] = useState<any[]>(fallbackSalesData);
  const [isRealSales, setIsRealSales] = useState(false);
  const [dateRange, setDateRange] = useState<"7d" | "14d" | "30d" | "custom">("7d");
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [isLoadingChart, setIsLoadingChart] = useState(false);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const router = useRouter();

  const fetchChartData = async (range: "7d" | "14d" | "30d" | "custom", customStart?: string, customEnd?: string) => {
    setIsLoadingChart(true);
    try {
      let url = "/sales/analytics";
      if (range === "custom" && customStart && customEnd) {
        url += `?startDate=${customStart}&endDate=${customEnd}`;
      } else if (range === "14d") {
        url += "?days=14";
      } else if (range === "30d") {
        url += "?days=30";
      } else {
        url += "?days=7";
      }
      const res = await api.get(url);
      const analytics = res.data?.data;
      if (analytics?.chartData && analytics.chartData.length > 0) {
        const hasActivity = analytics.hasRealData || analytics.chartData.some((d: any) => d.revenue > 0 || d.orders > 0);
        if (hasActivity) {
          setSalesChart(analytics.chartData);
          setIsRealSales(true);
        } else {
          if (range === "custom" || range === "30d" || range === "14d") {
            setSalesChart(analytics.chartData);
            setIsRealSales(false);
          } else {
            setSalesChart(fallbackSalesData);
            setIsRealSales(false);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load filtered chart data", err);
    } finally {
      setIsLoadingChart(false);
    }
  };

  const handleRangeChange = (range: "7d" | "14d" | "30d" | "custom") => {
    setDateRange(range);
    if (range !== "custom") {
      fetchChartData(range);
    }
  };

  const handleApplyCustomDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (startDate && endDate) {
      fetchChartData("custom", startDate, endDate);
    }
  };

  useEffect(() => {
    const fetchUserAndStats = async () => {
      try {
        const [meRes, usersRes, prodsRes, kpisRes, analyticsRes, logsRes, ordersRes] = await Promise.all([
          api.get("/users/me").catch(() => null),
          api.get("/users?limit=1").catch(() => null),
          api.get("/products?limit=1").catch(() => null),
          api.get("/sales/kpis").catch(() => null),
          api.get("/sales/analytics?days=7").catch(() => null),
          api.get("/audit-logs?limit=5").catch(() => null),
          orderAPI.getAllOrders(1, 5).catch(() => null)
        ]);
        
        if (meRes?.data?.data) setUser(meRes.data.data);
        
        const totalUsers = usersRes?.data?.data?.pagination?.total || 0;
        const totalProducts = prodsRes?.data?.data?.pagination?.total || 0;
        setStats({ totalUsers, totalProducts, loading: false });

        if (kpisRes?.data?.data) {
          setKpis(kpisRes.data.data);
        }

        const analytics = analyticsRes?.data?.data;
        if (analytics) {
          if (analytics.hasRealData && analytics.chartData && analytics.chartData.length > 0) {
            setSalesChart(analytics.chartData);
            setIsRealSales(true);
          } else if (analytics.chartData && analytics.chartData.length > 0) {
            const hasActivity = analytics.chartData.some((d: any) => d.revenue > 0 || d.orders > 0);
            if (hasActivity) {
              setSalesChart(analytics.chartData);
              setIsRealSales(true);
            } else {
              setSalesChart(fallbackSalesData);
              setIsRealSales(false);
            }
          }
          if (analytics.topProducts) {
            setTopProducts(analytics.topProducts);
          }
        }

        if (logsRes?.data?.data?.logs) {
          setAuditLogs(logsRes.data.data.logs);
        }

        if (ordersRes?.data?.orders) {
          setRecentOrders(ordersRes.data.orders);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
        setStats(prev => ({ ...prev, loading: false }));
      } finally {
        setLoadingLogs(false);
      }
    };
    
    fetchUserAndStats();
  }, []);

  const statCards = [
    { 
      name: 'Total Users', 
      stat: stats.loading ? '...' : stats.totalUsers.toLocaleString('en-IN'), 
      icon: Users, 
      change: '+12.4%', 
      changeType: 'increase', 
      color: 'bg-gradient-to-br from-[#7B61FF] to-[#6044EA]',
      shadowColor: 'indigo-500/30',
      sparkline: sparklineUsers, 
      sparkColor: '#7B61FF' 
    },
    { 
      name: 'Avg. Order Value', 
      stat: stats.loading ? '...' : formatCurrencyCompact(kpis.averageOrderValue), 
      icon: TrendingUp, 
      change: '+5.4%', 
      changeType: 'increase', 
      color: 'bg-gradient-to-br from-[#F5A623] to-[#E59114]',
      shadowColor: 'amber-500/30',
      sparkline: sparklineOpenRate, 
      sparkColor: '#F5A623' 
    },
    { 
      name: 'Total Orders', 
      stat: stats.loading ? '...' : kpis.totalOrders.toLocaleString('en-IN'), 
      icon: ShoppingBag, 
      change: '-3.2%', 
      changeType: 'decrease', 
      color: 'bg-gradient-to-br from-[#F22973] to-[#D81B5E]',
      shadowColor: 'pink-500/30',
      sparkline: sparklineOrders, 
      sparkColor: '#F22973' 
    },
    { 
      name: 'Total Revenue', 
      stat: stats.loading ? '...' : formatCurrencyCompact(kpis.totalRevenue), 
      icon: DollarSign, 
      change: '+28.4%', 
      changeType: 'increase', 
      color: 'bg-gradient-to-br from-[#27AE60] to-[#1E8F4E]',
      shadowColor: 'emerald-500/30',
      sparkline: sparklineRevenue, 
      sparkColor: '#27AE60' 
    },
  ];

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto pb-10">
      
      {/* Top Welcome & Date Picker */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
        <div>
          <p className="text-sm font-semibold text-gray-500 mb-1">Welcome back,</p>
          <h1 className="text-3xl font-extrabold text-brandDark tracking-tight flex items-center gap-2">
            {user ? `${user.firstName} ${user.lastName}` : 'Administrator'} <span className="text-2xl">👋</span>
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Here's what's happening with SculptnShine today.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          Real-time Analytics
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {statCards.map((item) => (
          <div key={item.name} className="bg-white rounded-[24px] shadow-sm border border-gray-100/80 flex flex-col relative h-[184px]">
            {/* Top Section: Icon, Title, Stat, ... */}
            <div className="flex p-5 relative z-10">
              {/* Icon */}
              <div className={`w-[48px] h-[48px] rounded-2xl text-white ${item.color} shadow-lg shadow-${item.shadowColor} flex items-center justify-center shrink-0`}>
                <item.icon className="h-6 w-6" strokeWidth={2.5} />
              </div>
              
              {/* Text Content */}
              <div className="ml-4 flex-1">
                <div className="flex justify-between items-start w-full">
                  <p className="text-[13px] font-semibold text-gray-500 tracking-tight">{item.name}</p>
                </div>
                <h3 className="text-[24px] font-extrabold text-[#1a1b25] mt-1 leading-none">{item.stat}</h3>
              </div>
            </div>

            {/* Pill & Text */}
            <div className="flex flex-col items-center justify-center relative z-10 mt-1">
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${item.changeType === 'increase' ? 'bg-[#e5f7ed] text-[#27AE60]' : 'bg-[#ffeceb] text-[#F22973]'}`}>
                {item.changeType === 'increase' ? '↑' : '↓'} {item.change.replace('+', '').replace('-', '')}
              </span>
              <span className="text-[11px] text-gray-400 font-medium mt-1.5">vs last 7 days</span>
            </div>

            {/* Area Chart at absolute bottom */}
            <div className="h-[64px] w-full absolute bottom-0 left-0 right-0 overflow-hidden rounded-b-[24px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={item.sparkline} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`color${item.name.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={item.sparkColor} stopOpacity={0.25}/>
                      <stop offset="95%" stopColor={item.sparkColor} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area 
                    type="monotone" 
                    dataKey="v" 
                    stroke={item.sparkColor} 
                    strokeWidth={2} 
                    fillOpacity={1} 
                    fill={`url(#color${item.name.replace(/\s/g, '')})`} 
                    activeDot={{r: 4}} 
                    dot={{r: 2.5, fill: item.sparkColor, strokeWidth: 0}}
                    isAnimationActive={false} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Sales Overview Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            {/* Header: Title, Live Status Badge, and Date Filter Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-gray-900">Sales Overview</h2>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                  isRealSales
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isRealSales ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                  {isRealSales ? "Live Data" : "Preview Mode"}
                </span>
              </div>

              {/* Range Selector Tabs */}
              <div className="flex items-center bg-gray-100/80 p-1 rounded-xl border border-gray-200/60 text-xs font-semibold text-gray-600 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => handleRangeChange("7d")}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    dateRange === "7d"
                      ? "bg-white text-gray-900 shadow-xs font-bold"
                      : "hover:text-gray-900 hover:bg-white/50"
                  }`}
                >
                  7D
                </button>
                <button
                  type="button"
                  onClick={() => handleRangeChange("14d")}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    dateRange === "14d"
                      ? "bg-white text-gray-900 shadow-xs font-bold"
                      : "hover:text-gray-900 hover:bg-white/50"
                  }`}
                >
                  14D
                </button>
                <button
                  type="button"
                  onClick={() => handleRangeChange("30d")}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    dateRange === "30d"
                      ? "bg-white text-gray-900 shadow-xs font-bold"
                      : "hover:text-gray-900 hover:bg-white/50"
                  }`}
                >
                  30D
                </button>
                <button
                  type="button"
                  onClick={() => handleRangeChange("custom")}
                  className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all ${
                    dateRange === "custom"
                      ? "bg-white text-gray-900 shadow-xs font-bold"
                      : "hover:text-gray-900 hover:bg-white/50"
                  }`}
                >
                  <CalendarDays className="w-3.5 h-3.5 text-gold-600" />
                  <span>Custom</span>
                </button>
              </div>
            </div>

            {/* Custom Date Range Calendar Inputs (Shown when 'Custom' is active) */}
            {dateRange === "custom" && (
              <form onSubmit={handleApplyCustomDate} className="mb-5 p-3.5 rounded-xl bg-gray-50/90 border border-gray-200 flex flex-wrap items-center gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                  <Calendar className="w-4 h-4 text-gold-600 shrink-0" />
                  <span>Date Range:</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    max={endDate || undefined}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-semibold bg-white text-gray-800 focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500 outline-none"
                    required
                  />
                  <span className="text-xs text-gray-400 font-bold">to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || undefined}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-semibold bg-white text-gray-800 focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500 outline-none"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoadingChart}
                  className="px-4 py-1.5 rounded-lg bg-gold-600 hover:bg-gold-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isLoadingChart ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Filter className="w-3.5 h-3.5" />}
                  Apply Filter
                </button>
              </form>
            )}

            {/* Quick Metrics Bar for Selected Range */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 p-3 rounded-xl bg-gray-50/50 border border-gray-100">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block">Period Revenue</span>
                <span className="text-sm font-extrabold text-amber-600">
                  {formatCurrencyCompact(salesChart.reduce((acc, curr) => acc + (Number(curr.revenue) || 0), 0))}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block">Period Orders</span>
                <span className="text-sm font-extrabold text-purple-600">
                  {salesChart.reduce((acc, curr) => acc + (Number(curr.orders) || 0), 0)} orders
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block">Data Points</span>
                <span className="text-sm font-extrabold text-gray-700">
                  {salesChart.length} Days
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block">Timeline Status</span>
                <span className={`text-xs font-bold ${isRealSales ? "text-emerald-600" : "text-amber-600"}`}>
                  {isRealSales ? "Active Sales" : "Simulation"}
                </span>
              </div>
            </div>
            
            {/* Chart Area with Loading Overlay */}
            <div className="h-72 w-full relative">
              {isLoadingChart && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center z-20 rounded-xl">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white shadow-md border border-gray-100 text-xs font-bold text-gold-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Filtering sales timeline...</span>
                  </div>
                </div>
              )}
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 11}} dy={10} />
                  <YAxis 
                    yAxisId="left"
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#9ca3af', fontSize: 11}} 
                    tickFormatter={(value) => value >= 1000 ? `₹${value/1000}K` : `₹${value}`} 
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    axisLine={false} 
                    tickLine={false} 
                    hide 
                  />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any, name: any) => [
                      name === 'revenue' ? `₹${Number(value).toLocaleString('en-IN')}` : `${value} orders`, 
                      name === 'revenue' ? 'Revenue' : 'Orders'
                    ]}
                  />
                  <Area 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="orders" 
                    stroke="#8b5cf6" 
                    strokeWidth={2.5} 
                    fillOpacity={1} 
                    fill="url(#colorOrders)" 
                    activeDot={{r: 6}} 
                  />
                  <Area 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#f59e0b" 
                    strokeWidth={2.5} 
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                    activeDot={{r: 6}} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex items-center gap-6 mt-4 pt-3 border-t border-gray-100">
             <div className="flex items-center gap-2">
               <div className="w-3 h-3 rounded-full bg-amber-500"></div>
               <span className="text-xs font-semibold text-gray-600">Revenue (₹)</span>
             </div>
             <div className="flex items-center gap-2">
               <div className="w-3 h-3 rounded-full bg-violet-500"></div>
               <span className="text-xs font-semibold text-gray-600">Orders</span>
             </div>
          </div>
        </div>

        {/* Top Products Table */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-900">Top Products</h2>
            <button onClick={() => router.push('/products')} className="text-sm font-semibold text-gold-600 hover:text-gold-700">View all</button>
          </div>
          
          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-400 uppercase bg-white border-b border-gray-100">
                <tr>
                  <th className="px-2 py-3 font-semibold">Product</th>
                  <th className="px-2 py-3 font-semibold text-right">Sold</th>
                  <th className="px-2 py-3 font-semibold text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.length > 0 ? (
                  topProducts.map((item, idx) => {
                    const prod = item.product || item;
                    const imgUrl = prod.images?.[0] || prod.img || '/assets/images/product-placeholder.png';
                    const title = prod.title || prod.name || 'Product';
                    const soldCount = item.totalQuantitySold !== undefined ? item.totalQuantitySold : item.sold;
                    const revenueAmount = item.totalRevenue !== undefined ? item.totalRevenue : (item.revenue ? Number(item.revenue.replace(/[^0-9.-]+/g, '')) : 0);

                    return (
                      <tr 
                        key={prod.id || idx} 
                        onClick={() => prod.id && router.push(`/products/${prod.id}`)}
                        className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <td className="px-2 py-3.5 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                            <img 
                              src={prod.images?.[0] || '/assets/product-placeholder.png'} 
                              alt={title} 
                              onError={(e: any) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = '/assets/product-placeholder.png';
                              }}
                              className="w-full h-full object-cover" 
                            />
                          </div>
                          <span className="font-semibold text-gray-800 line-clamp-1 max-w-[140px]">{title}</span>
                        </td>
                        <td className="px-2 py-3.5 text-right text-gray-500 font-medium">{soldCount}</td>
                        <td className="px-2 py-3.5 text-right font-bold text-gray-900">
                          {formatCurrencyCompact(revenueAmount)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={3} className="text-center py-8 text-gray-400 text-xs">
                      No products found. Add products in catalog.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
              <Info className="h-4 w-4 text-gray-400" />
            </div>
            <button onClick={() => router.push('/orders')} className="text-sm font-semibold text-gold-600 hover:text-gold-700">View all</button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-400 uppercase bg-white border-b border-gray-100">
                <tr>
                  <th className="px-2 py-3 font-semibold">Order ID</th>
                  <th className="px-2 py-3 font-semibold">Customer</th>
                  <th className="px-2 py-3 font-semibold">Amount</th>
                  <th className="px-2 py-3 font-semibold">Status</th>
                  <th className="px-2 py-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order, idx) => (
                  <tr 
                    key={order.id || idx} 
                    onClick={() => router.push(`/orders/${order.id}`)}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="px-2 py-4 font-bold text-amber-500">{order.orderNumber}</td>
                    <td className="px-2 py-4 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                        {order.userProfile?.user?.firstName?.charAt(0) || 'U'}
                      </div>
                      <span className="font-semibold text-gray-700">
                        {order.userProfile?.user?.firstName} {order.userProfile?.user?.lastName}
                      </span>
                    </td>
                    <td className="px-2 py-4 font-semibold text-gray-900">₹{order.totalAmount.toLocaleString('en-IN')}</td>
                    <td className="px-2 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider ${
                        order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' : 
                        order.status === 'PROCESSING' ? 'bg-amber-100 text-amber-700' :
                        order.status === 'SHIPPED' ? 'bg-blue-100 text-blue-700' :
                        order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-2 py-4 text-gray-500 font-medium">
                      {new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-2 py-8 text-center text-gray-500">
                      No recent orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity Feed / Audit Logs */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-900">Activity Feed</h2>
            <button className="text-sm font-semibold text-gold-600 hover:text-gold-700">View all</button>
          </div>
          
          <div className="space-y-6">
            {loadingLogs ? (
              <div className="animate-pulse space-y-4">
                {[1,2,3].map(i => (
                  <div key={i} className="flex gap-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : auditLogs.length > 0 ? (
              auditLogs.map((log) => {
                // Determine icon and color based on entity/action
                let iconColor = "bg-blue-100 text-blue-600";
                let Icon = Info;
                
                const entityLabel =
                  log.entity === 'ProductCategory'
                    ? 'Product Category'
                    : log.entity === 'ProductSubcategory'
                      ? 'Product Subcategory'
                      : log.entity;

                if (log.action.includes('Delete')) {
                  iconColor = "bg-red-100 text-red-600";
                } else if (log.entity === 'User') {
                  iconColor = "bg-green-100 text-green-600";
                  Icon = Users;
                } else if (log.entity === 'Order') {
                  iconColor = "bg-amber-100 text-amber-600";
                  Icon = ShoppingBag;
                } else if (log.entity === 'ProductCategory' || log.entity === 'ProductSubcategory') {
                  iconColor = "bg-purple-100 text-purple-600";
                  Icon = ShoppingBag;
                }
                
                return (
                  <div key={log.id} className="flex gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconColor}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-900">{log.action}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-tight">
                        {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System'} • {entityLabel}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-gray-400 shrink-0 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-sm text-gray-500">
                No recent activity logs.
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
