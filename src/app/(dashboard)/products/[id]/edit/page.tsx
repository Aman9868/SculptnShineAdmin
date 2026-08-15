"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { ArrowLeft, Loader2, UploadCloud, Plus, X, Film, Image as ImageIcon, Trash2, Sparkles, Layers, Tag, Calendar, Package } from "lucide-react";
import Link from "next/link";
import RichTextEditor from "@/components/RichTextEditor";
import { getMediaUrl } from "@/lib/media";

interface VariantItem {
  id?: string;
  title: string;
  sku: string;
  flavor: string;
  weight: string;
  unitPrice: string;
  discountPercentage: string;
  gst: string;
  expiryDate: string;
  stock: string;
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const { showToast } = useToast();

  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [brandsList, setBrandsList] = useState<any[]>([]);
  const [isCustomBrand, setIsCustomBrand] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    sku: "",
    brand: "",
    brandId: "",
    preference: "NOT_APPLICABLE",
    unitPrice: "",
    discountPercentage: "0",
    gst: "18",
    expiryDate: "",
    stock: "0",
    lowStockAlert: "5",
    categoryId: "",
    subcategoryId: "",
    description: "",
    status: "ACTIVE",
    images: [] as string[],
    videos: [] as string[],
  });

  const [imageUrlInput, setImageUrlInput] = useState("");
  const [videoUrlInput, setVideoUrlInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Product Variants state
  const [hasVariants, setHasVariants] = useState(false);
  const [attr1Name, setAttr1Name] = useState("Flavor");
  const [attr2Name, setAttr2Name] = useState("Weight / Size");
  const [flavorInput, setFlavorInput] = useState("");
  const [weightInput, setWeightInput] = useState("");
  const [variants, setVariants] = useState<VariantItem[]>([]);

  useEffect(() => {
    fetchProductAndMetadata();
  }, [productId]);

  useEffect(() => {
    if (formData.categoryId) {
      fetchSubcategories(formData.categoryId);
    } else {
      setSubcategories([]);
    }
  }, [formData.categoryId]);

  // Auto-sync base price and total stock when variants are present
  useEffect(() => {
    if (hasVariants && variants.length > 0) {
      const validPrices = variants.map((v) => parseFloat(v.unitPrice)).filter((p) => !isNaN(p) && p > 0);
      if (validPrices.length > 0) {
        const minPrice = Math.min(...validPrices);
        setFormData((prev) => ({ ...prev, unitPrice: minPrice.toString() }));
      }
      const totalStock = variants.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0);
      setFormData((prev) => ({ ...prev, stock: totalStock.toString() }));

      // Find earliest active expiry
      const activeExpiries = variants
        .filter((v) => v.expiryDate && (parseInt(v.stock) || 0) > 0)
        .map((v) => new Date(v.expiryDate).getTime());
      if (activeExpiries.length > 0) {
        const earliest = new Date(Math.min(...activeExpiries)).toISOString().split('T')[0];
        setFormData((prev) => ({ ...prev, expiryDate: earliest }));
      }
    }
  }, [variants, hasVariants]);

  const fetchProductAndMetadata = async () => {
    try {
      setIsLoading(true);
      const [prodRes, catRes, brandRes] = await Promise.all([
        api.get(`/products/${productId}`),
        api.get('/categories'),
        api.get('/brands'),
      ]);

      const product = prodRes.data.data;
      setCategories(catRes.data.data.categories || []);
      setBrandsList(brandRes.data.data.brands || []);

      const existingVariants: VariantItem[] = (product.variants || []).map((v: any) => ({
        id: v.id,
        title: v.title || "",
        sku: v.sku || "",
        flavor: v.flavor || "",
        weight: v.weight || "",
        unitPrice: v.unitPrice ? v.unitPrice.toString() : "",
        discountPercentage: v.discountPercentage !== undefined ? v.discountPercentage.toString() : "0",
        gst: v.gst !== undefined ? v.gst.toString() : "18",
        expiryDate: v.expiryDate ? new Date(v.expiryDate).toISOString().split('T')[0] : "",
        stock: v.stock !== undefined ? v.stock.toString() : "0",
      }));

      setVariants(existingVariants);
      setHasVariants(existingVariants.length > 0);

      const brandName = typeof product.brand === 'object' && product.brand !== null
        ? (product.brand.name || "")
        : typeof product.brand === 'string'
        ? product.brand
        : (product.productBrand?.name || "");

      const brandId = product.brandId || (typeof product.brand === 'object' && product.brand !== null ? product.brand.id : "");

      // Check if product brand matches any existing list or is custom
      const isKnownBrand = brandsList.some(b => b.id === brandId || b.name?.toLowerCase() === brandName.toLowerCase());
      if (brandName && !isKnownBrand) {
        setIsCustomBrand(true);
      }

      setFormData({
        title: product.title || "",
        slug: product.slug || "",
        sku: product.sku || "",
        brand: brandName,
        brandId: brandId,
        preference: product.preference || "NOT_APPLICABLE",
        unitPrice: product.unitPrice ? product.unitPrice.toString() : "",
        discountPercentage: product.discountPercentage !== undefined ? product.discountPercentage.toString() : "0",
        gst: product.gst !== undefined ? product.gst.toString() : "18",
        expiryDate: product.expiryDate ? new Date(product.expiryDate).toISOString().split('T')[0] : "",
        stock: product.stock !== undefined ? product.stock.toString() : "0",
        lowStockAlert: product.lowStockAlert !== undefined ? product.lowStockAlert.toString() : "5",
        categoryId: product.categoryId || "",
        subcategoryId: product.subcategoryId || "",
        description: product.description || "",
        status: product.status || "ACTIVE",
        images: product.images || [],
        videos: product.videos || [],
      });
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load product details");
    } finally {
      setIsLoading(false);
    }
  };

  const autoGenerateVariants = () => {
    const list1 = flavorInput.split(",").map((f) => f.trim()).filter(Boolean);
    const list2 = weightInput.split(",").map((w) => w.trim()).filter(Boolean);

    if (list1.length === 0 && list2.length === 0) return;

    const basePrice = formData.unitPrice || "1000";
    const baseDiscount = formData.discountPercentage || "0";
    const baseGst = formData.gst || "18";
    const baseStock = "5";
    const baseSku = formData.sku || "SKU-PROD";
    const baseExpiry = formData.expiryDate || "";

    const newVariants: VariantItem[] = [];

    if (list1.length > 0 && list2.length > 0) {
      list1.forEach((f1) => {
        list2.forEach((f2) => {
          newVariants.push({
            title: `${f1} / ${f2}`,
            sku: `${baseSku}-${f1.substring(0, 3).toUpperCase()}-${f2.replace(/[^a-zA-Z0-9]/g, '')}`,
            flavor: f1,
            weight: f2,
            unitPrice: basePrice,
            discountPercentage: baseDiscount,
            gst: baseGst,
            expiryDate: baseExpiry,
            stock: baseStock,
          });
        });
      });
    } else if (list1.length > 0) {
      list1.forEach((f1) => {
        newVariants.push({
          title: f1,
          sku: `${baseSku}-${f1.substring(0, 3).toUpperCase()}`,
          flavor: f1,
          weight: "",
          unitPrice: basePrice,
          discountPercentage: baseDiscount,
          gst: baseGst,
          expiryDate: baseExpiry,
          stock: baseStock,
        });
      });
    } else if (list2.length > 0) {
      list2.forEach((f2) => {
        newVariants.push({
          title: f2,
          sku: `${baseSku}-${f2.replace(/[^a-zA-Z0-9]/g, '')}`,
          flavor: "",
          weight: f2,
          unitPrice: basePrice,
          discountPercentage: baseDiscount,
          gst: baseGst,
          expiryDate: baseExpiry,
          stock: baseStock,
        });
      });
    }

    setVariants(newVariants);
  };

  const addCustomVariant = () => {
    const basePrice = formData.unitPrice || "1000";
    const baseDiscount = formData.discountPercentage || "0";
    const baseGst = formData.gst || "18";
    const baseStock = "5";
    const baseSku = formData.sku || "SKU-PROD";
    const baseExpiry = formData.expiryDate || "";

    setVariants([
      ...variants,
      {
        title: `Custom Variant ${variants.length + 1}`,
        sku: `${baseSku}-V${variants.length + 1}`,
        flavor: "",
        weight: "",
        unitPrice: basePrice,
        discountPercentage: baseDiscount,
        gst: baseGst,
        expiryDate: baseExpiry,
        stock: baseStock,
      },
    ]);
  };

  const updateVariant = (index: number, field: string, value: string) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };

    if (field === "flavor" || field === "weight") {
      const f1 = updated[index].flavor;
      const f2 = updated[index].weight;
      updated[index].title = f1 && f2 ? `${f1} / ${f2}` : f1 || f2 || "Variant";
    }

    setVariants(updated);
  };

  const removeVariantRow = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileFormData = new FormData();
    fileFormData.append("file", file);

    try {
      setIsUploading(true);
      const isVideo = file.type.startsWith("video/");
      const endpoint = isVideo ? "/uploads/video" : "/uploads/image";

      const res = await api.post(endpoint, fileFormData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const uploadedUrl = res.data.data.url;

      if (isVideo) {
        setFormData((prev) => ({ ...prev, videos: [...prev.videos, uploadedUrl] }));
        showToast("Video uploaded successfully", "success");
      } else {
        setFormData((prev) => ({ ...prev, images: [...prev.images, uploadedUrl] }));
        showToast("Image uploaded successfully", "success");
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to upload file", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const addImageUrl = () => {
    if (imageUrlInput.trim()) {
      setFormData((prev) => ({ ...prev, images: [...prev.images, imageUrlInput.trim()] }));
      setImageUrlInput("");
    }
  };

  const addVideoUrl = () => {
    if (videoUrlInput.trim()) {
      setFormData((prev) => ({ ...prev, videos: [...prev.videos, videoUrlInput.trim()] }));
      setVideoUrlInput("");
    }
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const removeVideo = (index: number) => {
    setFormData((prev) => ({ ...prev, videos: prev.videos.filter((_, i) => i !== index) }));
  };

  const fetchSubcategories = async (catId: string) => {
    try {
      const res = await api.get(`/subcategories?categoryId=${catId}`);
      setSubcategories(res.data.data.subcategories || []);
    } catch (err) {
      console.error("Failed to load subcategories");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.title || !formData.unitPrice || !formData.sku) {
      setError("Product Title, Unit Price, and SKU are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: formData.title,
        slug: formData.slug,
        sku: formData.sku,
        brand: formData.brand || undefined,
        brandId: formData.brandId || undefined,
        preference: formData.preference || "NOT_APPLICABLE",
        unitPrice: parseFloat(formData.unitPrice),
        discountPercentage: formData.discountPercentage ? parseFloat(formData.discountPercentage) : 0,
        gst: formData.gst ? parseFloat(formData.gst) : 18,
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate).toISOString() : undefined,
        stock: parseInt(formData.stock) || 0,
        lowStockAlert: parseInt(formData.lowStockAlert) || 5,
        categoryId: formData.categoryId || undefined,
        subcategoryId: formData.subcategoryId || undefined,
        description: formData.description,
        status: formData.status,
        images: formData.images,
        videos: formData.videos,
        variants: hasVariants ? variants.map((v) => ({
          id: v.id || undefined,
          title: v.title,
          sku: v.sku,
          flavor: v.flavor || null,
          weight: v.weight || null,
          unitPrice: parseFloat(v.unitPrice) || parseFloat(formData.unitPrice),
          discountPercentage: v.discountPercentage ? parseFloat(v.discountPercentage) : 0,
          gst: v.gst ? parseFloat(v.gst) : 18,
          expiryDate: v.expiryDate ? new Date(v.expiryDate).toISOString() : (formData.expiryDate ? new Date(formData.expiryDate).toISOString() : undefined),
          stock: parseInt(v.stock) || 0,
        })) : [],
      };

      await api.patch(`/products/${productId}`, payload);
      showToast(`Product "${formData.title}" updated successfully!`, "success");
      router.push(`/products/${productId}`);
    } catch (err: any) {
      const errMsg = err.response?.data?.message || "Failed to update product";
      setError(errMsg);
      showToast(errMsg, "error");
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 text-gold-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href={`/products/${productId}`} className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/products" className="hover:text-gold-600">Products</Link>
            <span>›</span>
            <span className="text-gray-900 font-semibold">Edit Product</span>
          </div>
          <h1 className="text-3xl font-extrabold text-brandDark font-serif-luxury tracking-tight">Edit Product</h1>
          <p className="mt-1 text-sm font-medium text-gray-500">
            Update pricing, variants, batch expiry dates, stock levels, or product details.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-semibold rounded-xl border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left 2 Columns: Main Fields */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Product Title <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., ISO Gold Whey Protein"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-500 outline-none transition-all"
                />
              </div>

              {/* Slug & SKU Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Slug</label>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-500 outline-none transition-all font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">SKU Code <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="sku"
                    required
                    value={formData.sku}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-500 outline-none transition-all font-mono"
                  />
                </div>
              </div>

              {/* Categories Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Category</label>
                  <select
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-500 outline-none transition-all"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Subcategory</label>
                  <select
                    name="subcategoryId"
                    value={formData.subcategoryId}
                    onChange={handleChange}
                    disabled={!formData.categoryId}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-500 outline-none transition-all disabled:bg-gray-50 disabled:opacity-60"
                  >
                    <option value="">Select Subcategory</option>
                    {subcategories.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Brand & Dietary Preference */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Brand Name</label>
                  {isCustomBrand ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        name="brand"
                        value={formData.brand}
                        onChange={handleChange}
                        placeholder="Enter brand name"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-500 outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setIsCustomBrand(false)}
                        className="px-3 py-1 text-xs border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 shrink-0"
                      >
                        List
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <select
                        name="brandId"
                        value={formData.brandId || (brandsList.find(b => b.name?.toLowerCase() === formData.brand?.toLowerCase())?.id) || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          const selected = brandsList.find((b) => b.id === val);
                          setFormData((prev) => ({
                            ...prev,
                            brandId: val,
                            brand: selected ? selected.name : "",
                          }));
                        }}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-500 outline-none transition-all"
                      >
                        <option value="">Select Brand</option>
                        {brandsList.map((b) => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setIsCustomBrand(true)}
                        className="px-3 py-1 text-xs border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 shrink-0"
                      >
                        Custom
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-gray-500">Select existing brand or type custom brand name</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Dietary Preference</label>
                  <select
                    name="preference"
                    value={formData.preference}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-500 outline-none transition-all"
                  >
                    <option value="NOT_APPLICABLE">Not Applicable (Cosmetics, Haircare, etc.)</option>
                    <option value="VEGETARIAN">Vegetarian 🟢</option>
                    <option value="NON_VEGETARIAN">Non-Vegetarian 🔴</option>
                    <option value="EGGITARIAN">Eggitarian 🟡</option>
                    <option value="VEGAN">Vegan 🌱</option>
                  </select>
                  <p className="text-xs text-gray-500">Essential filter for supplements & health food</p>
                </div>
              </div>

              {/* Base Pricing Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Unit Price (₹) <span className="text-red-500">*</span>
                    {hasVariants && <span className="text-[11px] font-normal text-amber-700 ml-1">(Auto-set to min variant price)</span>}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="unitPrice"
                    required
                    value={formData.unitPrice}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-500 outline-none transition-all font-semibold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Discount Percentage (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="discountPercentage"
                    value={formData.discountPercentage}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">GST (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="gst"
                    value={formData.gst}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Expiry Date
                    {hasVariants && <span className="text-[11px] font-normal text-amber-700 ml-1">(Earliest active batch expiry)</span>}
                  </label>
                  <input
                    type="date"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Stock Quantity Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Total Stock Quantity
                    {hasVariants && <span className="text-[11px] font-normal text-amber-700 ml-1">(Sum of all variant stocks)</span>}
                  </label>
                  <input
                    type="number"
                    name="stock"
                    required
                    value={formData.stock}
                    onChange={handleChange}
                    readOnly={hasVariants}
                    className={`w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-500 outline-none transition-all font-bold ${hasVariants ? 'bg-amber-50/50 text-amber-900' : ''}`}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Low Stock Alert Threshold</label>
                  <input
                    type="number"
                    name="lowStockAlert"
                    value={formData.lowStockAlert}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Status Toggle */}
              <div className="flex items-center gap-4 py-2">
                <span className="text-sm font-bold text-gray-900">Status</span>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-semibold ${formData.status === 'ACTIVE' ? 'text-emerald-600' : 'text-gray-500'}`}>
                    {formData.status}
                  </span>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: formData.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 ${formData.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-gray-200'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.status === 'ACTIVE' ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Multiple Media Manager */}
            <div className="lg:col-span-1 space-y-6">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">Product Media (Images & Videos)</label>
                <p className="text-xs text-gray-500 mb-3">Upload multiple product photos and promotional videos.</p>

                {/* Drag and Drop File Upload Area */}
                <label className="w-full h-36 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer p-4 text-center block relative">
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-6 w-6 text-gold-500 animate-spin" />
                      <span className="text-xs font-semibold text-gray-600">Uploading media...</span>
                    </div>
                  ) : (
                    <>
                      <div className="p-2.5 bg-white rounded-full shadow-sm mb-2">
                        <UploadCloud className="h-5 w-5 text-gold-600" />
                      </div>
                      <p className="text-xs font-bold text-gray-800">Click or drag to upload media</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">Images (PNG, JPG) & Videos (MP4, WEBM) up to 50MB</p>
                    </>
                  )}
                </label>
              </div>

              {/* Add Image URL Direct Input */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-600">Add Image URL</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-gold-500"
                  />
                  <button
                    type="button"
                    onClick={addImageUrl}
                    className="px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-bold hover:bg-black transition-colors"
                  >
                    + Add
                  </button>
                </div>
              </div>

              {/* Add Video URL Direct Input */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-600">Add Video URL</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://example.com/video.mp4"
                    value={videoUrlInput}
                    onChange={(e) => setVideoUrlInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-gold-500"
                  />
                  <button
                    type="button"
                    onClick={addVideoUrl}
                    className="px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-bold hover:bg-black transition-colors"
                  >
                    + Add
                  </button>
                </div>
              </div>

              {/* Media Previews */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Uploaded Media ({formData.images.length + formData.videos.length})
                </h4>

                {formData.images.length === 0 && formData.videos.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No media uploaded yet.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {/* Images Previews */}
                    {formData.images.map((img, idx) => (
                      <div key={`img-${idx}`} className="relative group aspect-square rounded-xl bg-gray-100 border border-gray-200 overflow-hidden">
                        <img src={getMediaUrl(img)} alt={`Product image ${idx + 1}`} className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                          IMG
                        </span>
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 bg-red-500 text-white h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold opacity-90 hover:opacity-100 transition-opacity"
                        >
                          ✕
                        </button>
                      </div>
                    ))}

                    {/* Videos Previews */}
                    {formData.videos.map((vid, idx) => (
                      <div key={`vid-${idx}`} className="relative group aspect-square rounded-xl bg-gray-900 border border-gray-200 overflow-hidden flex items-center justify-center">
                        <video src={getMediaUrl(vid)} className="w-full h-full object-cover" muted />
                        <span className="absolute bottom-1 left-1 bg-purple-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                          ▶ VID
                        </span>
                        <button
                          type="button"
                          onClick={() => removeVideo(idx)}
                          className="absolute top-1 right-1 bg-red-500 text-white h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold opacity-90 hover:opacity-100 transition-opacity z-10"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* PRODUCT VARIANTS & BATCH EXPIRY INVENTORY SECTION                        */}
          {/* ========================================================================= */}
          <div className="pt-8 border-t border-gray-100">
            <div className="bg-gray-50/60 border border-gray-200/80 rounded-2xl p-5 sm:p-6 space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                    <Layers className="h-5 w-5 text-gold-600" />
                    <span>Product Variants & Batch Expiry Matrix</span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Manage multiple flavors, package weights, individual prices, batch expiry dates (FEFO), and stock levels.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-700">Has Multiple Variants / Batches?</span>
                  <button
                    type="button"
                    onClick={() => {
                      const nextVal = !hasVariants;
                      setHasVariants(nextVal);
                      if (nextVal && variants.length === 0) {
                        addCustomVariant();
                      }
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                      hasVariants ? 'bg-gold-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        hasVariants ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {hasVariants && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  
                  {/* Attribute Tags Generator */}
                  <div className="p-4 bg-white border border-gray-200 rounded-xl space-y-4 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4 text-gold-600" />
                        Quick Combinations Generator
                      </span>
                      <span className="text-[11px] text-gray-400">Separate values with commas</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={attr1Name}
                            onChange={(e) => setAttr1Name(e.target.value)}
                            placeholder="Attribute 1 Name"
                            className="text-xs font-bold text-gray-700 bg-transparent border-b border-gray-200 px-1 py-0.5 outline-none focus:border-gold-500 w-28"
                          />
                        </div>
                        <input
                          type="text"
                          value={flavorInput}
                          onChange={(e) => setFlavorInput(e.target.value)}
                          placeholder="e.g., Chocolate Charge, Vanilla Dream, Mango"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-gold-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={attr2Name}
                            onChange={(e) => setAttr2Name(e.target.value)}
                            placeholder="Attribute 2 Name"
                            className="text-xs font-bold text-gray-700 bg-transparent border-b border-gray-200 px-1 py-0.5 outline-none focus:border-gold-500 w-28"
                          />
                        </div>
                        <input
                          type="text"
                          value={weightInput}
                          onChange={(e) => setWeightInput(e.target.value)}
                          placeholder="e.g., 2.27 Kg / 5 LB, 1 Kg / 2.2 LB"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-gold-500"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={autoGenerateVariants}
                        className="px-4 py-2 bg-gray-900 text-white rounded-lg text-xs font-bold hover:bg-black transition-colors"
                      >
                        Generate Combinations ({attr1Name} × {attr2Name})
                      </button>
                      <button
                        type="button"
                        onClick={addCustomVariant}
                        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-50 transition-colors flex items-center gap-1.5"
                      >
                        <Plus size={14} /> Add Single Variant / Batch Row
                      </button>
                    </div>
                  </div>

                  {/* Variants Matrix Table */}
                  {variants.length > 0 && (
                    <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-xs bg-white">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 font-bold uppercase tracking-wider text-[10px]">
                          <tr>
                            <th className="py-2.5 px-3">Variant Title</th>
                            <th className="py-2.5 px-3">SKU</th>
                            <th className="py-2.5 px-3">{attr1Name}</th>
                            <th className="py-2.5 px-3">{attr2Name}</th>
                            <th className="py-2.5 px-3">Unit Price (₹)</th>
                            <th className="py-2.5 px-3">Discount (%)</th>
                            <th className="py-2.5 px-3">GST (%)</th>
                            <th className="py-2.5 px-3">
                              <span className="flex items-center gap-1 text-amber-800">
                                <Calendar size={11} /> Expiry Date (FEFO)
                              </span>
                            </th>
                            <th className="py-2.5 px-3">
                              <span className="flex items-center gap-1 text-emerald-800">
                                <Package size={11} /> Stock
                              </span>
                            </th>
                            <th className="py-2.5 px-3 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                          {variants.map((v, idx) => (
                            <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                              <td className="p-2 min-w-[130px]">
                                <input
                                  type="text"
                                  value={v.title}
                                  onChange={(e) => updateVariant(idx, "title", e.target.value)}
                                  className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs outline-none focus:ring-1 focus:ring-gold-500 font-bold"
                                />
                              </td>
                              <td className="p-2 min-w-[120px]">
                                <input
                                  type="text"
                                  value={v.sku}
                                  onChange={(e) => updateVariant(idx, "sku", e.target.value)}
                                  className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs outline-none focus:ring-1 focus:ring-gold-500 font-mono"
                                />
                              </td>
                              <td className="p-2 min-w-[100px]">
                                <input
                                  type="text"
                                  placeholder="e.g. Chocolate"
                                  value={v.flavor}
                                  onChange={(e) => updateVariant(idx, "flavor", e.target.value)}
                                  className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs outline-none focus:ring-1 focus:ring-gold-500"
                                />
                              </td>
                              <td className="p-2 min-w-[90px]">
                                <input
                                  type="text"
                                  placeholder="e.g. 2.27 Kg"
                                  value={v.weight}
                                  onChange={(e) => updateVariant(idx, "weight", e.target.value)}
                                  className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs outline-none focus:ring-1 focus:ring-gold-500"
                                />
                              </td>
                              <td className="p-2 min-w-[90px]">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={v.unitPrice}
                                  onChange={(e) => updateVariant(idx, "unitPrice", e.target.value)}
                                  className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs outline-none focus:ring-1 focus:ring-gold-500 font-bold text-gray-900"
                                />
                              </td>
                              <td className="p-2 min-w-[80px]">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={v.discountPercentage}
                                  onChange={(e) => updateVariant(idx, "discountPercentage", e.target.value)}
                                  className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs outline-none focus:ring-1 focus:ring-gold-500"
                                />
                              </td>
                              <td className="p-2 min-w-[70px]">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={v.gst}
                                  onChange={(e) => updateVariant(idx, "gst", e.target.value)}
                                  className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs outline-none focus:ring-1 focus:ring-gold-500"
                                />
                              </td>
                              <td className="p-2 min-w-[130px]">
                                <input
                                  type="date"
                                  value={v.expiryDate}
                                  onChange={(e) => updateVariant(idx, "expiryDate", e.target.value)}
                                  className="w-full px-2 py-1.5 border border-amber-200 bg-amber-50/40 rounded text-xs outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
                                />
                              </td>
                              <td className="p-2 min-w-[80px]">
                                <input
                                  type="number"
                                  min="0"
                                  value={v.stock}
                                  onChange={(e) => updateVariant(idx, "stock", e.target.value)}
                                  className="w-full px-2 py-1.5 border border-emerald-200 bg-emerald-50/40 rounded text-xs outline-none focus:ring-1 focus:ring-emerald-500 font-bold text-emerald-900"
                                />
                              </td>
                              <td className="p-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => removeVariantRow(idx)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                  title="Delete Variant Row"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Full-Width Product Description Area */}
          <div className="mt-8 pt-6 border-t border-gray-100 space-y-3 w-full">
            <div className="flex items-center justify-between">
              <label className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span>Product Description & Tab Content</span>
                <span className="text-xs font-normal text-gray-500">(Auto-creates frontend tabs for each heading)</span>
              </label>
            </div>
            <div className="w-full">
              <RichTextEditor
                value={formData.description}
                onChange={(htmlValue: string) => setFormData({ ...formData, description: htmlValue })}
                placeholder="Enter detailed product description..."
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-8 mt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={() => router.push(`/products/${productId}`)}
              className="px-5 py-2.5 border border-gray-200 text-gray-600 font-bold rounded-xl text-sm hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-black font-extrabold rounded-xl text-sm shadow-md shadow-gold-500/20 hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
