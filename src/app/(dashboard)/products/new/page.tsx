"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { ArrowLeft, Loader2, UploadCloud, Package } from "lucide-react";
import Link from "next/link";
import RichTextEditor from "@/components/RichTextEditor";
import { getMediaUrl } from "@/lib/media";

export default function AddNewProductPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [brandsList, setBrandsList] = useState<any[]>([]);
  const [isCustomBrand, setIsCustomBrand] = useState(false);
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
    stock: "10",
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
  const [hasVariants, setHasVariants] = useState(true);
  const [attr1Name, setAttr1Name] = useState("Flavor");
  const [attr2Name, setAttr2Name] = useState("Weight / Size");
  const [attr1Input, setAttr1Input] = useState("");
  const [attr2Input, setAttr2Input] = useState("");
  const [variants, setVariants] = useState<Array<{
    title: string;
    sku: string;
    flavor: string;
    weight: string;
    unitPrice: string;
    discountPercentage: string;
    gst: string;
    expiryDate: string;
    stock: string;
  }>>([]);

  // Auto-detect category attribute presets (Skincare, Beauty, Salon, Wellness, Supplements)
  useEffect(() => {
    if (!formData.categoryId) return;
    const selectedCat = categories.find((c) => c.id === formData.categoryId);
    if (!selectedCat) return;

    const catNameLower = selectedCat.name.toLowerCase();

    if (catNameLower.includes("skin") || catNameLower.includes("beauty") || catNameLower.includes("cosmetics")) {
      setAttr1Name("Shade / Color");
      setAttr2Name("Volume (ml)");
    } else if (catNameLower.includes("salon") || catNameLower.includes("hair") || catNameLower.includes("wellness")) {
      setAttr1Name("Variant / Fragrance");
      setAttr2Name("Volume / Pack");
    } else {
      setAttr1Name("Flavor");
      setAttr2Name("Weight / Size");
    }
  }, [formData.categoryId, categories]);

  // Auto-sync base price and total stock whenever variants change
  useEffect(() => {
    if (hasVariants && variants.length > 0) {
      const validPrices = variants.map((v) => parseFloat(v.unitPrice)).filter((p) => !isNaN(p) && p > 0);
      const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : 0;
      const totalStock = variants.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0);

      setFormData((prev) => ({
        ...prev,
        unitPrice: minPrice > 0 ? minPrice.toString() : prev.unitPrice,
        stock: totalStock.toString(),
      }));
    }
  }, [variants, hasVariants]);

  const autoGenerateVariants = () => {
    const list1 = attr1Input.split(",").map((f) => f.trim()).filter(Boolean);
    const list2 = attr2Input.split(",").map((w) => w.trim()).filter(Boolean);

    if (list1.length === 0 && list2.length === 0) return;

    const basePrice = formData.unitPrice || "1000";
    const baseDiscount = formData.discountPercentage || "0";
    const baseGst = formData.gst || "18";
    const baseStock = formData.stock || "10";
    const baseSku = formData.sku || "SKU-PROD";
    const baseExpiry = formData.expiryDate || "";

    const newVariants: Array<{
      title: string;
      sku: string;
      flavor: string;
      weight: string;
      unitPrice: string;
      discountPercentage: string;
      gst: string;
      expiryDate: string;
      stock: string;
    }> = [];

    if (list1.length > 0 && list2.length > 0) {
      list1.forEach((f1, i) => {
        list2.forEach((f2, j) => {
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
      list1.forEach((f1, i) => {
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
      list2.forEach((f2, j) => {
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
    const baseStock = formData.stock || "10";
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

    setIsUploading(true);
    try {
      const res = await api.post("/upload", fileFormData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const fileUrl = res.data.url;
      const isVideo = res.data.type === "video" || file.type.startsWith("video/");

      if (isVideo) {
        setFormData((prev) => ({ ...prev, videos: [...prev.videos, fileUrl] }));
      } else {
        setFormData((prev) => ({ ...prev, images: [...prev.images, fileUrl] }));
      }
    } catch (err) {
      alert("Failed to upload file. Make sure it is an image or video.");
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

  useEffect(() => {
    fetchMetadata();
  }, []);

  const fetchMetadata = async () => {
    try {
      const [catRes, brandRes] = await Promise.all([
        api.get("/categories"),
        api.get("/brands"),
      ]);
      setCategories(catRes.data.data.categories || []);
      setBrandsList(brandRes.data.data.brands || []);
    } catch (err) {
      console.error("Failed to load metadata", err);
    }
  };

  useEffect(() => {
    if (formData.categoryId) {
      fetchSubcategories(formData.categoryId);
    } else {
      setSubcategories([]);
    }
  }, [formData.categoryId]);

  const fetchSubcategories = async (catId: string) => {
    try {
      const res = await api.get(`/subcategories?categoryId=${catId}`);
      setSubcategories(res.data.data.subcategories || []);
    } catch (err) {
      console.error("Failed to load subcategories", err);
    }
  };

  const generateSlugAndSku = (title: string) => {
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    const randomSku = `SKU-${title.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    return { slug, sku: randomSku };
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    const { slug, sku } = generateSlugAndSku(title);
    setFormData((prev) => ({
      ...prev,
      title,
      slug,
      sku: prev.sku || sku,
    }));
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
          title: v.title,
          sku: v.sku,
          flavor: v.flavor || undefined,
          weight: v.weight || undefined,
          unitPrice: parseFloat(v.unitPrice) || parseFloat(formData.unitPrice) || 0,
          discountPercentage: v.discountPercentage ? parseFloat(v.discountPercentage) : 0,
          gst: v.gst ? parseFloat(v.gst) : 18,
          expiryDate: v.expiryDate ? new Date(v.expiryDate).toISOString() : (formData.expiryDate ? new Date(formData.expiryDate).toISOString() : undefined),
          stock: parseInt(v.stock) || 0,
        })) : [],
      };

      await api.post("/products", payload);
      showToast(`Product "${formData.title}" created successfully!`, "success");
      router.push("/products");
    } catch (err: any) {
      const errMsg = err.response?.data?.message || "Failed to create product";
      setError(errMsg);
      showToast(errMsg, "error");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/products" className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/products" className="hover:text-gold-600">Product Management</Link>
            <span>›</span>
            <span className="text-gray-900 font-semibold">Add New Product</span>
          </div>
          <h1 className="text-3xl font-extrabold text-brandDark font-serif-luxury tracking-tight">Add New Product</h1>
          <p className="mt-1 text-sm font-medium text-gray-500">
            Create a new item in your store catalog.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-semibold rounded-xl border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Product Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Product Title */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Product Title <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. SculptnShine Whey Isolate Protein"
                  required
                  value={formData.title}
                  onChange={handleTitleChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none transition-all"
                />
                <p className="text-xs text-gray-500">Give your product a clear, descriptive name.</p>
              </div>

              {/* Slug & SKU Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Slug <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="slug"
                    placeholder="Auto-generated slug"
                    required
                    value={formData.slug}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-500 outline-none transition-all"
                  />
                  <p className="text-xs text-gray-500">URL friendly identifier</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">SKU Code <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="sku"
                    placeholder="e.g. SKU-PROT-1001"
                    required
                    value={formData.sku}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-500 outline-none transition-all"
                  />
                  <p className="text-xs text-gray-500">Unique Stock Keeping Unit code</p>
                </div>
              </div>

              {/* Category & Subcategory Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Category</label>
                  <select
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-500 outline-none transition-all font-medium text-gray-700"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500">Parent product category</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Subcategory</label>
                  <select
                    name="subcategoryId"
                    value={formData.subcategoryId}
                    onChange={handleChange}
                    disabled={!formData.categoryId || subcategories.length === 0}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-500 outline-none transition-all font-medium text-gray-700 disabled:bg-gray-50 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {!formData.categoryId
                        ? "Select category first"
                        : subcategories.length === 0
                        ? "No subcategories found"
                        : "Select Subcategory"}
                    </option>
                    {subcategories.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500">Subcategory under selected category</p>
                </div>
              </div>

              {/* Has Variants Toggle Card */}
              <div className="flex items-center justify-between p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl shadow-sm">
                <div>
                  <span className="text-sm font-bold text-gray-900 block">Has Product Variants (Flavors, Weights, Sizes)?</span>
                  <span className="text-xs text-gray-600">Enable if this item has multiple options like Nutrabay (e.g. Cold Coffee, 1kg, 2kg) with custom prices.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setHasVariants(!hasVariants)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 ${
                    hasVariants ? 'bg-gold-500' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      hasVariants ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Brand & Dietary Preference Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Brand Name</label>
                  {!isCustomBrand ? (
                    <select
                      value={formData.brandId || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "__CUSTOM__") {
                          setIsCustomBrand(true);
                          setFormData((prev) => ({ ...prev, brandId: "", brand: "" }));
                        } else {
                          const selected = brandsList.find((b) => b.id === val);
                          setFormData((prev) => ({ ...prev, brandId: val, brand: selected ? selected.name : "" }));
                        }
                      }}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-500 outline-none transition-all font-medium text-gray-700"
                    >
                      <option value="">Select Brand</option>
                      {brandsList.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                      <option value="__CUSTOM__">➕ Type custom brand (auto-creates brand entry)</option>
                    </select>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        name="brand"
                        value={formData.brand}
                        onChange={handleChange}
                        placeholder="Type custom brand name..."
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-500 outline-none transition-all font-medium text-gray-700"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomBrand(false);
                          setFormData((prev) => ({ ...prev, brand: "", brandId: "" }));
                        }}
                        className="px-3 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-200"
                      >
                        Cancel
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
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-500 outline-none transition-all font-medium text-gray-700"
                  >
                    <option value="NOT_APPLICABLE">Not Applicable (Cosmetics, Haircare, etc.)</option>
                    <option value="VEGETARIAN">🌱 Vegetarian</option>
                    <option value="NON_VEGETARIAN">🍗 Non-Vegetarian</option>
                    <option value="EGGITARIAN">🥚 Eggitarian</option>
                    <option value="VEGAN">🍃 Vegan</option>
                  </select>
                  <p className="text-xs text-gray-500">Essential filter for supplements & health food</p>
                </div>
              </div>

              {/* Pricing Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    {hasVariants ? "Starting Unit Price (₹)" : "Unit Price (₹)"} {!hasVariants && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="unitPrice"
                    placeholder={hasVariants ? "e.g. Auto-synced from lowest variant" : "e.g. 2499.00"}
                    required={!hasVariants}
                    value={formData.unitPrice}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-500 outline-none transition-all"
                  />
                  <p className="text-xs text-gray-500">
                    {hasVariants ? "Auto-synced to lowest variant unit price." : "Regular retail unit price"}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Discount Percentage (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="discountPercentage"
                    placeholder="e.g. 15"
                    value={formData.discountPercentage}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-500 outline-none transition-all"
                  />
                  <p className="text-xs text-gray-500">Optional discount percentage (e.g. 10 for 10%)</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">GST (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="gst"
                    placeholder="e.g. 18"
                    value={formData.gst}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-500 outline-none transition-all"
                  />
                  <p className="text-xs text-gray-500">Default is 18%</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Expiry Date</label>
                  <input
                    type="date"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-500 outline-none transition-all"
                  />
                  <p className="text-xs text-gray-500">Optional expiry date</p>
                </div>
              </div>

              {/* Stock Quantity Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    {hasVariants ? "Total Combined Stock" : "Initial Stock Quantity"} {!hasVariants && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="number"
                    name="stock"
                    placeholder="e.g. 50"
                    required={!hasVariants}
                    value={formData.stock}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-500 outline-none transition-all"
                  />
                  <p className="text-xs text-gray-500">
                    {hasVariants ? "Auto-calculated sum of all variant stock quantities below." : "Available physical stock"}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Low Stock Alert Threshold</label>
                  <input
                    type="number"
                    name="lowStockAlert"
                    placeholder="e.g. 5"
                    value={formData.lowStockAlert}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-500 outline-none transition-all"
                  />
                  <p className="text-xs text-gray-500">Trigger alert when stock drops below this</p>
                </div>
              </div>

              {/* Product Variants & Attribute Matrix Builder */}
              {hasVariants && (
                <div className="pt-4 p-5 bg-gray-50/50 border border-gray-200/80 rounded-2xl space-y-4 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <span>Product Variants Matrix</span>
                        <span className="text-[11px] font-semibold bg-gold-100 text-gold-800 px-2 py-0.5 rounded-full">
                          {variants.length} combinations
                        </span>
                      </h3>
                      <p className="text-xs text-gray-500">
                        Dynamic attributes automatically adapted for Supplements, Skincare, Salon & Beauty products.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addCustomVariant}
                      className="px-3 py-1.5 bg-white border border-gray-200 text-gray-800 rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors shadow-sm"
                    >
                      + Add Single Variant
                    </button>
                  </div>

                  {/* Quick Auto Generator Inputs */}
                  <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">⚡ Category Dynamic Matrix Generator</h4>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => { setAttr1Name("Flavor"); setAttr2Name("Weight / Size"); }}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${attr1Name === "Flavor" ? "bg-amber-800 text-white" : "bg-amber-100 text-amber-900 hover:bg-amber-200"}`}
                        >
                          🏋️ Supplements
                        </button>
                        <button
                          type="button"
                          onClick={() => { setAttr1Name("Shade / Color"); setAttr2Name("Volume (ml)"); }}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${attr1Name === "Shade / Color" ? "bg-amber-800 text-white" : "bg-amber-100 text-amber-900 hover:bg-amber-200"}`}
                        >
                          💄 Skincare / Beauty
                        </button>
                        <button
                          type="button"
                          onClick={() => { setAttr1Name("Variant / Type"); setAttr2Name("Volume / Pack"); }}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${attr1Name === "Variant / Type" ? "bg-amber-800 text-white" : "bg-amber-100 text-amber-900 hover:bg-amber-200"}`}
                        >
                          🌿 Salon / Wellness
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-gray-700">Attribute 1 Name</label>
                        </div>
                        <input
                          type="text"
                          value={attr1Name}
                          onChange={(e) => setAttr1Name(e.target.value)}
                          className="w-full px-3 py-1 bg-white border border-gray-200 rounded text-xs font-bold text-gray-800 mb-1.5 focus:ring-1 focus:ring-gold-500"
                        />
                        <input
                          type="text"
                          placeholder={
                            attr1Name.includes("Shade")
                              ? "Nude Rose, Fair Glow, Mocha"
                              : attr1Name.includes("Variant")
                              ? "Lavender, Tea Tree, Unscented"
                              : "Cold Coffee, French Vanilla, Rich Chocolate"
                          }
                          value={attr1Input}
                          onChange={(e) => setAttr1Input(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-gold-500"
                        />
                        <p className="text-[10px] text-gray-400 mt-1">Values separated by comma</p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-gray-700">Attribute 2 Name</label>
                        </div>
                        <input
                          type="text"
                          value={attr2Name}
                          onChange={(e) => setAttr2Name(e.target.value)}
                          className="w-full px-3 py-1 bg-white border border-gray-200 rounded text-xs font-bold text-gray-800 mb-1.5 focus:ring-1 focus:ring-gold-500"
                        />
                        <input
                          type="text"
                          placeholder={
                            attr2Name.includes("ml")
                              ? "30 ml, 50 ml, 100 ml"
                              : attr2Name.includes("Pack")
                              ? "100 ml, 250 ml, Pack of 2"
                              : "500 g, 1 kg, 2 kg"
                          }
                          value={attr2Input}
                          onChange={(e) => setAttr2Input(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-gold-500"
                        />
                        <p className="text-[10px] text-gray-400 mt-1">Values separated by comma</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={autoGenerateVariants}
                      className="w-full py-2 bg-gradient-to-r from-gold-500 to-gold-600 text-white rounded-lg text-xs font-bold hover:from-gold-600 hover:to-gold-700 transition-all shadow-sm"
                    >
                      Generate All Combination Variants ({attr1Name} × {attr2Name})
                    </button>
                  </div>

                  {/* Variants Matrix Table */}
                  {variants.length > 0 && (
                    <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-sm bg-white">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase">
                          <tr>
                            <th className="py-2.5 px-3">Variant Title</th>
                            <th className="py-2.5 px-3">SKU</th>
                            <th className="py-2.5 px-3">{attr1Name}</th>
                            <th className="py-2.5 px-3">{attr2Name}</th>
                            <th className="py-2.5 px-3">Unit Price (₹)</th>
                            <th className="py-2.5 px-3">Discount (%)</th>
                            <th className="py-2.5 px-3">GST (%)</th>
                            <th className="py-2.5 px-3">Expiry Date</th>
                            <th className="py-2.5 px-3">Stock</th>
                            <th className="py-2.5 px-3 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                          {variants.map((v, idx) => (
                            <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                              <td className="p-2 min-w-[120px]">
                                <input
                                  type="text"
                                  value={v.title}
                                  onChange={(e) => updateVariant(idx, "title", e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-200 rounded text-xs outline-none focus:ring-1 focus:ring-gold-500 font-bold"
                                />
                              </td>
                              <td className="p-2 min-w-[110px]">
                                <input
                                  type="text"
                                  value={v.sku}
                                  onChange={(e) => updateVariant(idx, "sku", e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-200 rounded text-xs outline-none focus:ring-1 focus:ring-gold-500 font-mono"
                                />
                              </td>
                              <td className="p-2 min-w-[90px]">
                                <input
                                  type="text"
                                  placeholder="e.g. Vanilla"
                                  value={v.flavor}
                                  onChange={(e) => updateVariant(idx, "flavor", e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-200 rounded text-xs outline-none focus:ring-1 focus:ring-gold-500"
                                />
                              </td>
                              <td className="p-2 min-w-[80px]">
                                <input
                                  type="text"
                                  placeholder="e.g. 1 kg"
                                  value={v.weight}
                                  onChange={(e) => updateVariant(idx, "weight", e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-200 rounded text-xs outline-none focus:ring-1 focus:ring-gold-500"
                                />
                              </td>
                              <td className="p-2 min-w-[80px]">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={v.unitPrice}
                                  onChange={(e) => updateVariant(idx, "unitPrice", e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-200 rounded text-xs outline-none focus:ring-1 focus:ring-gold-500"
                                />
                              </td>
                              <td className="p-2 min-w-[80px]">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={v.discountPercentage}
                                  onChange={(e) => updateVariant(idx, "discountPercentage", e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-200 rounded text-xs outline-none focus:ring-1 focus:ring-gold-500 text-emerald-600 font-bold"
                                />
                              </td>
                              <td className="p-2 min-w-[70px]">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={v.gst}
                                  onChange={(e) => updateVariant(idx, "gst", e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-200 rounded text-xs outline-none focus:ring-1 focus:ring-gold-500"
                                />
                              </td>
                              <td className="p-2 min-w-[125px]">
                                <input
                                  type="date"
                                  value={v.expiryDate || ""}
                                  onChange={(e) => updateVariant(idx, "expiryDate", e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-200 rounded text-xs outline-none focus:ring-1 focus:ring-gold-500 bg-white"
                                />
                              </td>
                              <td className="p-2 min-w-[70px]">
                                <input
                                  type="number"
                                  value={v.stock}
                                  onChange={(e) => updateVariant(idx, "stock", e.target.value)}
                                  className="w-full px-2 py-1 border border-gray-200 rounded text-xs outline-none focus:ring-1 focus:ring-gold-500"
                                />
                              </td>
                              <td className="p-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => removeVariantRow(idx)}
                                  className="text-red-500 hover:text-red-700 font-bold p-1 rounded hover:bg-red-50"
                                >
                                  ✕
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

              {/* Status Toggle */}
              <div className="flex items-center gap-4 py-2">
                <span className="text-sm font-bold text-gray-900">Status</span>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-semibold ${formData.status === 'ACTIVE' ? 'text-emerald-600' : 'text-gray-500'}`}>
                    {formData.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: formData.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 ${
                      formData.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.status === 'ACTIVE' ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Multiple Media Manager (Images & Videos) */}
            <div className="lg:col-span-1 space-y-6">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">Product Media (Images & Videos)</label>
                <p className="text-xs text-gray-500 mb-3">Upload multiple product photos and promotional videos.</p>

                {/* Drag and Drop File Upload Area */}
                <label className="w-full h-36 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer p-4 text-center block relative">
                  <input
                    type="file"
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
                        <video src={vid} className="w-full h-full object-cover" muted />
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
                placeholder="Enter detailed product description, benefits, ingredients, or usage..."
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-8 mt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={() => router.push('/products')}
              className="px-5 py-2.5 border border-gray-200 text-gray-600 font-bold rounded-xl text-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-gold-500/20 transition-all text-sm disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Product"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
