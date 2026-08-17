"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import Pagination from "@/components/Pagination";
import SearchableProductSelect from "@/components/SearchableProductSelect";
import {
  Image as ImageIcon,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  X,
  ExternalLink,
  Eye,
  UploadCloud,
  Film,
  Sparkles,
  Tag,
  Grid,
  Layers,
  Lock,
  UserPlus,
  Package,
  Calendar,
  Link as LinkIcon,
  Maximize2,
  Info,
  Ratio,
  Smartphone,
  Monitor
} from "lucide-react";

export const BANNER_TYPE_CONFIG: Record<string, {
  label: string;
  badge: string;
  color: string;
  icon: any;
  description: string;
  recommendedSize: string;
  aspectRatio: string;
  formats: string;
  guide: string;
}> = {
  HOME_GENERAL: {
    label: "Hero Carousel",
    badge: "HERO SLIDER",
    color: "bg-purple-50 text-purple-700 border-purple-200",
    icon: Layers,
    description: "Main rotating hero carousel on the homepage top section",
    recommendedSize: "1920 × 800 px (Desktop) | 1080 × 608 px (Mobile)",
    aspectRatio: "2.4:1 (Desktop) | 16:9 (Mobile)",
    formats: "JPG, PNG, WebP or MP4 (Max 50MB)",
    guide: "Desktop: 1920×800 px (2.4:1). Mobile: 1080×608 px (16:9). Upload a 16:9 mobile banner for an ideal, balanced phone view that fits all devices.",
  },
  PROMO: {
    label: "Promo Banner",
    badge: "PROMO / OFFER",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Tag,
    description: "Promotional discount cards and limited-time offer banners",
    recommendedSize: "1200 × 500 px (Desktop) | 800 × 450 px (Mobile)",
    aspectRatio: "12:5 Landscape (Desktop) | 16:9 (Mobile)",
    formats: "JPG, PNG, WebP (Max 15MB)",
    guide: "Used for promotional discount cards and flash sale callouts across the store.",
  },
  CATEGORY_HEADER: {
    label: "Category Header",
    badge: "CATEGORY HEADER",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    icon: Grid,
    description: "Header hero banner displayed on category listing pages",
    recommendedSize: "1440 × 360 px",
    aspectRatio: "4:1 (Slim Landscape Banner)",
    formats: "JPG, PNG, WebP (Max 15MB)",
    guide: "Displays at the top of the selected category catalog page behind the title.",
  },
  BRAND_HEADER: {
    label: "Brand Header",
    badge: "BRAND HEADER",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: Sparkles,
    description: "Official brand header banner displayed on brand pages",
    recommendedSize: "1440 × 360 px",
    aspectRatio: "4:1 (Slim Landscape Banner)",
    formats: "JPG, PNG, WebP (Max 15MB)",
    guide: "Displays as the flagship hero header on the official Brand store page.",
  },
  HOME_PRODUCT: {
    label: "Featured Product",
    badge: "PRODUCT SPOTLIGHT",
    color: "bg-rose-50 text-rose-700 border-rose-200",
    icon: Package,
    description: "Product showcase spotlight card on homepage",
    recommendedSize: "1200 × 600 px (or 800 × 800 px)",
    aspectRatio: "2:1 Wide or 1:1 Square",
    formats: "JPG, PNG, WebP (Max 15MB)",
    guide: "Showcases featured products with transparent background cutouts or action shots.",
  },
  LOGIN_BG: {
    label: "Login Background",
    badge: "LOGIN SCREEN",
    color: "bg-slate-100 text-slate-700 border-slate-200",
    icon: Lock,
    description: "High-resolution background wallpaper on customer login page",
    recommendedSize: "1920 × 1080 px",
    aspectRatio: "16:9 (Full HD Portrait/Landscape)",
    formats: "JPG, PNG, WebP (Max 20MB)",
    guide: "Atmospheric fitness wallpaper displayed on the login and password recovery screens.",
  },
  SIGNUP_BG: {
    label: "Signup Background",
    badge: "SIGNUP SCREEN",
    color: "bg-cyan-50 text-cyan-700 border-cyan-200",
    icon: UserPlus,
    description: "High-resolution background wallpaper on customer signup page",
    recommendedSize: "1920 × 1080 px",
    aspectRatio: "16:9 (Full HD Portrait/Landscape)",
    formats: "JPG, PNG, WebP (Max 20MB)",
    guide: "High-energy gym background wallpaper displayed on the account registration page.",
  },
};

const BANNER_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active", color: "text-emerald-600", icon: CheckCircle },
  { value: "INACTIVE", label: "Inactive", color: "text-gray-400", icon: XCircle },
  { value: "SCHEDULED", label: "Scheduled", color: "text-blue-500", icon: Clock },
];

const getTypeConfig = (type: string) => {
  let normalized = type;
  if (type === "HERO") normalized = "HOME_GENERAL";
  if (type === "CATEGORY") normalized = "CATEGORY_HEADER";
  if (type === "BRAND") normalized = "BRAND_HEADER";

  return BANNER_TYPE_CONFIG[normalized] || {
    label: type.replace(/_/g, " "),
    badge: type.replace(/_/g, " "),
    color: "bg-gray-100 text-gray-700 border-gray-200",
    icon: ImageIcon,
    description: "General store banner",
    recommendedSize: "1920 × 800 px",
    aspectRatio: "16:9 or 2.4:1",
    formats: "JPG, PNG, WebP",
    guide: "Upload high resolution banner media.",
  };
};

const getStatusInfo = (status: string) => {
  const opt = BANNER_STATUS_OPTIONS.find((o) => o.value === status);
  return opt || { value: status, label: status, color: "text-gray-400", icon: XCircle };
};

const getMediaUrl = (url: string) => {
  if (!url) return "";
  if (url.startsWith("/uploads")) {
    const backendBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");
    return `${backendBase}${url}`;
  }
  return url;
};

const emptyForm = {
  title: "",
  subtitle: "",
  image: "",
  mobileImage: "",
  video: "",
  link: "",
  ctaText: "",
  type: "HOME_GENERAL",
  targetType: "NONE",
  status: "ACTIVE",
  sortOrder: 0,
  startDate: "",
  endDate: "",
  categoryId: "",
  brandId: "",
  productId: "",
};

export default function BannersPage() {
  const { showToast } = useToast();

  const [banners, setBanners] = useState<any[]>([]);
  const [kpis, setKpis] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    scheduled: 0,
    homeGeneralCount: 0,
    promoCount: 0,
    categoryHeaderCount: 0,
    brandHeaderCount: 0,
    authBgCount: 0,
    homeProductCount: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeTab, setActiveTab] = useState("ALL");
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mobileFileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingMobile, setIsDraggingMobile] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any | null>(null);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingMobile, setIsUploadingMobile] = useState(false);

  const [previewBanner, setPreviewBanner] = useState<any | null>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    fetchBanners();
    fetchKPIs();
  }, [debouncedSearch, pagination.page, pagination.limit, activeTab]);

  useEffect(() => {
    const loadContextData = async () => {
      try {
        const [catsRes, brandsRes, prodsRes] = await Promise.all([
          api.get("/categories").catch(() => null),
          api.get("/brands").catch(() => null),
          api.get("/products?limit=500").catch(() => null),
        ]);
        if (catsRes?.data?.data?.categories) setCategories(catsRes.data.data.categories);
        else if (catsRes?.data?.data) setCategories(catsRes.data.data);

        if (brandsRes?.data?.data?.brands) setBrands(brandsRes.data.data.brands);
        else if (brandsRes?.data?.data) setBrands(brandsRes.data.data);

        if (prodsRes?.data?.data?.products) setProducts(prodsRes.data.data.products);
      } catch (e) {
        console.error("Failed to load banner relation context", e);
      }
    };
    loadContextData();
  }, []);

  const fetchBanners = async () => {
    try {
      setIsLoading(true);
      let typeParam = "";
      if (activeTab === "AUTH_BG") {
        typeParam = "&type=LOGIN_BG,SIGNUP_BG";
      } else if (activeTab !== "ALL") {
        typeParam = `&type=${activeTab}`;
      }

      const res = await api.get(
        `/banners?search=${encodeURIComponent(debouncedSearch)}&page=${pagination.page}&limit=${pagination.limit}${typeParam}`
      );
      setBanners(res.data.data.banners || []);
      if (res.data.data.pagination) {
        setPagination((prev) => ({
          ...prev,
          total: res.data.data.pagination.total,
          totalPages: res.data.data.pagination.totalPages,
        }));
      }
    } catch (err) {
      console.error("Failed to load banners", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchKPIs = async () => {
    try {
      const res = await api.get("/banners/kpis");
      if (res.data?.data) {
        setKpis(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load banner KPIs", err);
    }
  };

  const uploadFile = async (file: File) => {
    const fileFormData = new FormData();
    fileFormData.append("file", file);

    setIsUploading(true);
    try {
      const res = await api.post("/upload", fileFormData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const fileUrl = res.data.url;
      const isVideo = res.data.type === "video" || file.type.startsWith("video/");

      if (isVideo) {
        setFormData((prev) => ({ ...prev, video: fileUrl }));
        showToast("Video uploaded successfully!", "success");
      } else {
        setFormData((prev) => ({ ...prev, image: fileUrl }));
        showToast("Desktop image uploaded successfully!", "success");
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to upload file. Make sure it is an image or video.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const uploadMobileFile = async (file: File) => {
    if (file.size > 15 * 1024 * 1024) {
      showToast("Mobile image must be under 15MB", "error");
      return;
    }

    // Validate 16:9 aspect ratio and advise admin
    if (typeof window !== "undefined") {
      const img = new window.Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const ratio = img.width / img.height;
        const target16by9 = 16 / 9; // ~1.777
        const diff = Math.abs(ratio - target16by9);
        if (diff > 0.35) {
          showToast(
            `Image size is ${img.width}×${img.height} (${ratio.toFixed(2)}:1). Recommended is 16:9 ratio (e.g. 1080×608 px) for optimal mobile fit.`,
            "info"
          );
        }
      };
      img.src = objectUrl;
    }

    const fileFormData = new FormData();
    fileFormData.append("file", file);

    setIsUploadingMobile(true);
    try {
      const res = await api.post("/upload", fileFormData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const fileUrl = res.data.url;
      setFormData((prev) => ({ ...prev, mobileImage: fileUrl }));
      showToast("16:9 Mobile banner image uploaded successfully!", "success");
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to upload mobile image", "error");
    } finally {
      setIsUploadingMobile(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleMobileFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadMobileFile(file);
  };

  const openAddModal = () => {
    setEditingBanner(null);
    setFormData({ ...emptyForm });
    setIsModalOpen(true);
  };

  const openEditModal = (banner: any) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title || "",
      subtitle: banner.subtitle || "",
      image: banner.image || "",
      mobileImage: banner.mobileImage || "",
      video: banner.video || "",
      link: banner.link || "",
      ctaText: banner.ctaText || "",
      type: banner.type || "HOME_GENERAL",
      targetType: banner.targetType || "NONE",
      status: banner.status || "ACTIVE",
      sortOrder: banner.sortOrder || 0,
      startDate: banner.startDate ? new Date(banner.startDate).toISOString().slice(0, 16) : "",
      endDate: banner.endDate ? new Date(banner.endDate).toISOString().slice(0, 16) : "",
      categoryId: banner.categoryId || "",
      brandId: banner.brandId || "",
      productId: banner.productId || "",
    });
    setIsModalOpen(true);
  };

  const handleTypeSelect = (newType: string) => {
    let defaultCta = formData.ctaText;
    let defaultLink = formData.link;

    if (newType === "HOME_GENERAL" && !defaultCta) defaultCta = "Shop Now";
    if (newType === "PROMO" && !defaultCta) defaultCta = "Claim Offer";
    if (newType === "CATEGORY_HEADER" && !defaultCta) defaultCta = "Explore Category";
    if (newType === "BRAND_HEADER" && !defaultCta) defaultCta = "Explore Brand";

    setFormData((prev) => ({
      ...prev,
      type: newType,
      ctaText: defaultCta,
      link: defaultLink,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast("Banner title is required", "error");
      return;
    }
    if (!formData.image.trim() && !formData.video.trim()) {
      showToast("Either Desktop Banner Image or Video is required", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        mobileImage: formData.mobileImage?.trim() || null,
        sortOrder: Number(formData.sortOrder) || 0,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        categoryId: formData.categoryId || null,
        brandId: formData.brandId || null,
        productId: formData.productId || null,
      };

      if (editingBanner) {
        await api.patch(`/banners/${editingBanner.id}`, payload);
        showToast(`Banner "${formData.title}" updated successfully!`, "success");
      } else {
        await api.post("/banners", payload);
        showToast(`Banner "${formData.title}" created successfully!`, "success");
      }

      setIsModalOpen(false);
      setEditingBanner(null);
      setFormData({ ...emptyForm });
      await Promise.all([fetchBanners(), fetchKPIs()]);
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to save banner", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete banner "${title}"?`)) {
      try {
        await api.delete(`/banners/${id}`);
        showToast(`Banner "${title}" deleted successfully!`, "success");
        await Promise.all([fetchBanners(), fetchKPIs()]);
      } catch (err: any) {
        showToast(err.response?.data?.message || "Failed to delete banner", "error");
      }
    }
  };

  const tabs = [
    { key: "ALL", label: "All Banners", count: kpis.total },
    { key: "HOME_GENERAL", label: "Hero Carousel", count: kpis.homeGeneralCount },
    { key: "PROMO", label: "Promo & Offers", count: kpis.promoCount },
    { key: "CATEGORY_HEADER", label: "Category Headers", count: kpis.categoryHeaderCount },
    { key: "BRAND_HEADER", label: "Brand Headers", count: kpis.brandHeaderCount },
    { key: "AUTH_BG", label: "Auth Backgrounds", count: kpis.authBgCount },
  ];

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-brandDark font-serif-luxury tracking-tight">Banner Management</h1>
          <p className="mt-1.5 text-sm font-medium text-brandDark-lighter tracking-wide">
            Manage hero carousels, promotional offers, category & brand headers, and auth wallpapers.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-gold-600 hover:bg-gold-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-gold-600/20 hover:shadow-xl transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" /> Add Banner
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Banners", value: kpis.total, icon: ImageIcon, color: "text-gold-600 bg-gold-50" },
          { label: "Active", value: kpis.active, icon: CheckCircle, color: "text-emerald-600 bg-emerald-50" },
          { label: "Inactive", value: kpis.inactive, icon: XCircle, color: "text-gray-500 bg-gray-50" },
          { label: "Scheduled", value: kpis.scheduled, icon: Clock, color: "text-blue-600 bg-blue-50" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{kpi.label}</p>
              <h3 className="text-2xl font-black text-gray-900">{kpi.value}</h3>
            </div>
            <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${kpi.color}`}>
              <kpi.icon className="h-5 w-5" />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1.5 bg-gray-100/80 rounded-2xl p-1.5 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${activeTab === tab.key
                ? "bg-white text-gray-900 shadow-sm border border-gray-200/60"
                : "text-gray-500 hover:text-gray-900"
              }`}
          >
            {tab.label}
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${activeTab === tab.key ? "bg-gold-100 text-gold-700" : "bg-gray-200 text-gray-600"
              }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search banners by title or subtitle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-400 transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 text-gold-500 animate-spin" />
          </div>
        ) : banners.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400 p-8">
            <ImageIcon className="h-12 w-12 mb-3 text-gray-300" />
            <p className="font-bold text-gray-700 text-base">No banners found</p>
            <p className="text-xs text-gray-400 mt-1">Create a banner in this category to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="py-3.5 px-5 font-bold text-xs text-gray-500 uppercase tracking-wider">Banner Media</th>
                  <th className="py-3.5 px-4 font-bold text-xs text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="py-3.5 px-4 font-bold text-xs text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="py-3.5 px-4 font-bold text-xs text-gray-500 uppercase tracking-wider">Target Link</th>
                  <th className="py-3.5 px-4 font-bold text-xs text-gray-500 uppercase tracking-wider text-center">Order</th>
                  <th className="py-3.5 px-4 font-bold text-xs text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="py-3.5 px-5 font-bold text-xs text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {banners.map((banner) => {
                  const typeCfg = getTypeConfig(banner.type);
                  const statusInfo = getStatusInfo(banner.status);
                  const StatusIcon = statusInfo.icon;
                  const TypeIcon = typeCfg.icon;

                  return (
                    <tr key={banner.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3.5">
                          <div className="relative w-16 h-12 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden shrink-0 shadow-sm flex items-center justify-center">
                            {banner.video ? (
                              <div className="relative w-full h-full bg-black flex items-center justify-center text-white">
                                <Film className="w-5 h-5 opacity-70" />
                              </div>
                            ) : banner.image ? (
                              <img
                                src={getMediaUrl(banner.image)}
                                alt={banner.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = "none";
                                }}
                              />
                            ) : (
                              <TypeIcon className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          <div className="min-w-0 max-w-xs">
                            <p className="font-bold text-gray-900 text-sm truncate">{banner.title}</p>
                            {banner.subtitle && (
                              <p className="text-xs text-gray-400 truncate mt-0.5">{banner.subtitle}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${typeCfg.color}`}>
                          <TypeIcon className="w-3.5 h-3.5" />
                          {typeCfg.badge}
                        </span>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 text-xs font-bold ${statusInfo.color}`}>
                          <StatusIcon className="w-4 h-4" />
                          {statusInfo.label}
                        </span>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        {banner.link ? (
                          <span className="inline-flex items-center gap-1 text-xs text-gold-600 font-semibold max-w-[150px] truncate">
                            <LinkIcon className="w-3 h-3 shrink-0" />
                            <span className="truncate">{banner.link}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap text-center">
                        <span className="inline-block px-2.5 py-0.5 bg-gray-100 rounded-md text-xs font-bold text-gray-700">
                          {banner.sortOrder}
                        </span>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap text-xs text-gray-500 font-medium">
                        {new Date(banner.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>

                      <td className="py-4 px-5 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setPreviewBanner(banner)}
                            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                            title="Preview Banner"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(banner)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Banner"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(banner.id, banner.title)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Banner"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && banners.length > 0 && (
          <Pagination
            page={pagination.page}
            limit={pagination.limit}
            total={pagination.total}
            totalPages={pagination.totalPages}
            itemLabel="banners"
            onPageChange={(newPage) => setPagination((prev) => ({ ...prev, page: newPage }))}
            onLimitChange={(newLimit) => setPagination((prev) => ({ ...prev, limit: newLimit, page: 1 }))}
          />
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-20">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gold-100 text-gold-600 rounded-2xl border border-gold-200">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {editingBanner ? "Edit Banner" : "Create New Banner"}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {getTypeConfig(formData.type).description}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5">
                  Banner Placement & Type *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {Object.entries(BANNER_TYPE_CONFIG).map(([key, config]) => {
                    const Icon = config.icon;
                    const isSelected = formData.type === key;
                    return (
                      <button
                        type="button"
                        key={key}
                        onClick={() => handleTypeSelect(key)}
                        className={`flex items-start gap-2.5 p-3 rounded-2xl border text-left transition-all cursor-pointer ${isSelected
                            ? "border-gold-500 bg-gold-50/50 ring-2 ring-gold-500/20"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                          }`}
                      >
                        <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? "bg-gold-500 text-white" : "bg-gray-100 text-gray-600"}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className={`text-xs font-bold truncate ${isSelected ? "text-gold-900" : "text-gray-800"}`}>
                            {config.label}
                          </p>
                          <p className="text-[10px] text-gray-400 line-clamp-1 mt-0.5">{config.badge}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {formData.type === "CATEGORY_HEADER" && (
                <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100 space-y-3">
                  <label className="block text-xs font-bold text-blue-900 uppercase tracking-wider">
                    Select Target Category *
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => {
                      const catId = e.target.value;
                      const selectedCat = categories.find((c) => c.id === catId);
                      setFormData((prev) => ({
                        ...prev,
                        categoryId: catId,
                        link: selectedCat ? `/category/${selectedCat.slug}` : prev.link,
                        title: prev.title || (selectedCat ? `${selectedCat.name} Collection` : ""),
                      }));
                    }}
                    className="w-full px-4 py-2.5 rounded-xl border border-blue-200 bg-white text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">-- Choose Category --</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name} ({cat.slug})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {formData.type === "BRAND_HEADER" && (
                <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-3">
                  <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider">
                    Select Target Brand *
                  </label>
                  <select
                    value={formData.brandId}
                    onChange={(e) => {
                      const bId = e.target.value;
                      const selectedBrand = brands.find((b) => b.id === bId);
                      setFormData((prev) => ({
                        ...prev,
                        brandId: bId,
                        link: selectedBrand ? `/brand/${selectedBrand.slug}` : prev.link,
                        title: prev.title || (selectedBrand ? `Official ${selectedBrand.name} Store` : ""),
                      }));
                    }}
                    className="w-full px-4 py-2.5 rounded-xl border border-emerald-200 bg-white text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="">-- Choose Brand --</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.slug})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {formData.type === "HOME_PRODUCT" && (
                <div className="p-4 bg-rose-50/60 rounded-2xl border border-rose-100">
                  <SearchableProductSelect
                    products={products}
                    value={formData.productId}
                    label="Select Spotlight Product"
                    placeholder="Search product by title, brand, or SKU..."
                    required={true}
                    onChange={(selectedProd) => {
                      setFormData((prev) => ({
                        ...prev,
                        productId: selectedProd ? selectedProd.id : "",
                        link: selectedProd ? `/product/${selectedProd.slug}` : prev.link,
                        title: prev.title || (selectedProd ? selectedProd.title : ""),
                      }));
                    }}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    {formData.type === "PROMO" ? "Promo Headline *" : "Banner Title *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-400"
                    placeholder={
                      formData.type === "PROMO"
                        ? "e.g. Summer Flash Sale"
                        : formData.type === "LOGIN_BG"
                          ? "e.g. Welcome to Sculpt & Shine"
                          : "e.g. Premium Nutrition for Champions"
                    }
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    {formData.type === "PROMO" ? "Offer Details / Discount" : "Subtitle / Tagline"}
                  </label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-400"
                    placeholder={
                      formData.type === "PROMO"
                        ? "e.g. FLAT 30% OFF on all Wheys"
                        : "e.g. 100% Authentic Supplements"
                    }
                  />
                </div>
              </div>

              {formData.type !== "LOGIN_BG" && formData.type !== "SIGNUP_BG" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Destination Link
                    </label>
                    <input
                      type="text"
                      value={formData.link}
                      onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-400"
                      placeholder="e.g. /category/proteins or https://..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      CTA Button Text
                    </label>
                    <input
                      type="text"
                      value={formData.ctaText}
                      onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-400"
                      placeholder="e.g. Shop Now, Explore, Claim"
                    />
                  </div>
                </div>
              )}

              {/* 1. Desktop Banner Media (Primary) */}
              <div className="space-y-3 bg-gray-50 p-4 sm:p-5 rounded-2xl border border-gray-200/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-purple-600 shrink-0" />
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Desktop Banner Media (Primary) *
                    </label>
                  </div>
                  <span className="text-[11px] font-bold text-gold-600 bg-gold-50 px-2 py-0.5 rounded-md border border-gold-200/60">
                    {getTypeConfig(formData.type).recommendedSize}
                  </span>
                </div>

                {/* Hidden Native File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="hidden"
                />

                {/* Clean Custom Upload Dropzone */}
                <div
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) uploadFile(file);
                  }}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer bg-white select-none ${isDragging
                      ? "border-gold-600 bg-gold-50/50 scale-[1.01]"
                      : "border-gray-300 hover:border-gold-500 hover:bg-gold-50/20"
                    }`}
                >
                  {isUploading ? (
                    <div className="flex flex-col items-center justify-center gap-2 text-gold-600 font-bold text-xs py-2">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span>Uploading desktop media...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-gray-500 py-1">
                      <div className="h-12 w-12 rounded-full bg-gold-50 flex items-center justify-center text-gold-600 mb-2 border border-gold-100 shadow-sm">
                        <UploadCloud className="h-6 w-6" />
                      </div>
                      <p className="text-xs font-bold text-gray-900">
                        Click to browse desktop file, or drag and drop here
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        High resolution JPG, PNG, WebP (1920×800px) or MP4 video (up to 50MB)
                      </p>
                    </div>
                  )}
                </div>

                {/* Dynamic Recommended Dimensions & Guidelines Box */}
                {(() => {
                  const currentCfg = getTypeConfig(formData.type);
                  return (
                    <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/90 space-y-2.5">
                      <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                        <Info className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Recommended Specifications for {currentCfg.label}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                        <div className="bg-white/90 p-2.5 rounded-xl border border-amber-200/60 shadow-xs">
                          <span className="text-gray-400 font-bold block text-[10px] uppercase tracking-wider">Dimensions</span>
                          <span className="font-extrabold text-gray-900 flex items-center gap-1 mt-0.5">
                            <Maximize2 className="w-3 h-3 text-amber-600 shrink-0" />
                            {currentCfg.recommendedSize}
                          </span>
                        </div>
                        <div className="bg-white/90 p-2.5 rounded-xl border border-amber-200/60 shadow-xs">
                          <span className="text-gray-400 font-bold block text-[10px] uppercase tracking-wider">Aspect Ratio</span>
                          <span className="font-extrabold text-gray-900 flex items-center gap-1 mt-0.5">
                            <Ratio className="w-3 h-3 text-amber-600 shrink-0" />
                            {currentCfg.aspectRatio}
                          </span>
                        </div>
                        <div className="bg-white/90 p-2.5 rounded-xl border border-amber-200/60 shadow-xs">
                          <span className="text-gray-400 font-bold block text-[10px] uppercase tracking-wider">Accepted Media</span>
                          <span className="font-bold text-gray-800 block truncate mt-0.5">
                            {currentCfg.formats}
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] text-amber-900/90 font-medium pt-0.5 leading-relaxed">
                        💡 <strong className="font-bold">Usage Tip:</strong> {currentCfg.guide}
                      </p>
                    </div>
                  );
                })()}

                <div className="text-center text-[10px] font-extrabold text-gray-400 uppercase tracking-wider pt-1">— OR DIRECT DESKTOP URL —</div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Direct Image URL</label>
                    <input
                      type="text"
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-200 bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-gold-500/30"
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Direct Video URL (Optional)</label>
                    <input
                      type="text"
                      value={formData.video}
                      onChange={(e) => setFormData({ ...formData, video: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-200 bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-gold-500/30"
                      placeholder="https://...mp4"
                    />
                  </div>
                </div>

                {/* Desktop Media Preview Box */}
                {(formData.image || formData.video) && (
                  <div className="mt-3 relative h-48 rounded-2xl overflow-hidden bg-black/95 border border-gray-300 flex items-center justify-center shadow-inner">
                    {formData.video ? (
                      <video src={getMediaUrl(formData.video)} controls className="w-full h-full object-contain" />
                    ) : (
                      <img
                        src={getMediaUrl(formData.image)}
                        alt="Desktop Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, image: "", video: "" })}
                      className="absolute top-2.5 right-2.5 p-1.5 bg-black/70 hover:bg-black text-white rounded-full transition-colors cursor-pointer shadow-md"
                      title="Remove Desktop Media"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* 2. Mobile Banner Image (Smartphone 16:9 Optimized) */}
              <div className="space-y-3 bg-blue-50/50 p-4 sm:p-5 rounded-2xl border border-blue-200/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-blue-600 shrink-0" />
                    <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider">
                      Mobile Banner Image (Optional)
                    </label>
                  </div>
                  <span className="text-[11px] font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md border border-blue-300/60">
                    1080 × 608 px (16:9 Ratio)
                  </span>
                </div>

                {/* Hidden Native Mobile File Input */}
                <input
                  ref={mobileFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleMobileFileUpload}
                  disabled={isUploadingMobile}
                  className="hidden"
                />

                {/* Custom Mobile Upload Dropzone */}
                <div
                  onClick={() => !isUploadingMobile && mobileFileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingMobile(true);
                  }}
                  onDragLeave={() => setIsDraggingMobile(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingMobile(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) uploadMobileFile(file);
                  }}
                  className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all cursor-pointer bg-white select-none ${isDraggingMobile
                      ? "border-blue-600 bg-blue-50/50 scale-[1.01]"
                      : "border-blue-200 hover:border-blue-500 hover:bg-blue-50/20"
                    }`}
                >
                  {isUploadingMobile ? (
                    <div className="flex flex-col items-center justify-center gap-2 text-blue-600 font-bold text-xs py-2">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span>Uploading mobile banner...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-gray-500 py-1">
                      <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-1.5 border border-blue-100 shadow-xs">
                        <Smartphone className="h-5 w-5" />
                      </div>
                      <p className="text-xs font-bold text-gray-900">
                        Upload 16:9 Mobile Banner
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        16:9 Mobile Aspect Ratio (e.g. 1080×608 px or 1280×720 px)
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Direct Mobile Image URL (Optional)</label>
                  <input
                    type="text"
                    value={formData.mobileImage}
                    onChange={(e) => setFormData({ ...formData, mobileImage: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    placeholder="https://...mobile-banner.png"
                  />
                </div>

                {/* Mobile Media Preview Box in 16:9 Ratio */}
                {formData.mobileImage && (
                  <div className="mt-2 relative w-full max-w-[280px] aspect-[16/9] mx-auto rounded-xl overflow-hidden bg-black/95 border-2 border-blue-300 flex items-center justify-center shadow-md">
                    <img
                      src={getMediaUrl(formData.mobileImage)}
                      alt="Mobile Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                    <div className="absolute top-2 left-2 bg-blue-600/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                      16:9 MOBILE VIEW
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, mobileImage: "" })}
                      className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black text-white rounded-full transition-colors cursor-pointer shadow-md"
                      title="Remove Mobile Media"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                <p className="text-[11px] text-blue-900/80 font-medium leading-relaxed bg-blue-100/50 p-2.5 rounded-xl border border-blue-200/50">
                  📱 <strong className="font-bold">16:9 Mobile Optimization:</strong> Formatted for smartphone screens. If left blank, smartphones will automatically display the desktop banner as fallback.
                </p>
              </div>

              {(formData.type === "PROMO" || formData.type === "HOME_GENERAL") && (
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200/80 space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gold-600" />
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Schedule Active Window (Optional)
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 mb-1">Start Date & Time</label>
                      <input
                        type="datetime-local"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-gray-200 bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-gold-500/30"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 mb-1">End Date & Time</label>
                      <input
                        type="datetime-local"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-gray-200 bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-gold-500/30"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Publication Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-400 bg-white cursor-pointer"
                  >
                    {BANNER_STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Display Priority / Sort Order
                  </label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-400"
                    min={0}
                    placeholder="0 = Highest priority"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isUploading}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gold-600 hover:bg-gold-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-gold-600/20 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingBanner ? "Update Banner" : "Create Banner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {previewBanner && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPreviewBanner(null)}>
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewBanner(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-white/90 hover:bg-white rounded-full shadow-md transition-colors cursor-pointer"
            >
              <X className="h-5 w-5 text-gray-700" />
            </button>

            <div className="relative h-64 sm:h-80 bg-gray-900">
              {previewBanner.video ? (
                <video src={getMediaUrl(previewBanner.video)} controls autoPlay className="w-full h-full object-contain" />
              ) : previewBanner.image ? (
                <img src={getMediaUrl(previewBanner.image)} alt={previewBanner.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="h-16 w-16 text-gray-300" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
              <div className="absolute bottom-6 left-6 right-6 text-white pointer-events-none">
                <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider mb-2 border ${getTypeConfig(previewBanner.type).color}`}>
                  {getTypeConfig(previewBanner.type).badge}
                </span>
                <h3 className="text-2xl font-extrabold">{previewBanner.title}</h3>
                {previewBanner.subtitle && <p className="text-sm text-gray-200 mt-1">{previewBanner.subtitle}</p>}
              </div>
            </div>

            <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-xs font-bold text-gray-500 mb-0.5 uppercase">Status</p>
                <div className={`flex items-center gap-1 font-bold ${getStatusInfo(previewBanner.status).color}`}>
                  {(() => { const I = getStatusInfo(previewBanner.status).icon; return <I className="h-3.5 w-3.5" />; })()}
                  {getStatusInfo(previewBanner.status).label}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 mb-0.5 uppercase">CTA</p>
                <p className="font-bold text-gray-900">{previewBanner.ctaText || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 mb-0.5 uppercase">Link</p>
                <p className="font-medium text-blue-600 truncate">{previewBanner.link || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 mb-0.5 uppercase">Sort Order</p>
                <p className="font-bold text-gray-900">{previewBanner.sortOrder}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
