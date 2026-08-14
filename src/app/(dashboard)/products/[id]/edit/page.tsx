"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { ArrowLeft, Loader2, UploadCloud } from "lucide-react";
import Link from "next/link";
import RichTextEditor from "@/components/RichTextEditor";

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
  const [hasVariants, setHasVariants] = useState(true);
  const [flavorInput, setFlavorInput] = useState("");
  const [weightInput, setWeightInput] = useState("");
  const [variants, setVariants] = useState<Array<{
    title: string;
    sku: string;
    flavor: string;
    weight: string;
    unitPrice: string;
    discountPercentage: string;
    gst: string;
    stock: string;
  }>>([]);

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

      const existingVariants = (product.variants || []).map((v: any) => ({
        title: v.title || "",
        sku: v.sku || "",
        flavor: v.flavor || "",
        weight: v.weight || "",
        unitPrice: v.unitPrice ? v.unitPrice.toString() : "",
        discountPercentage: v.discountPercentage ? v.discountPercentage.toString() : "0",
        gst: v.gst ? v.gst.toString() : "18",
        stock: v.stock ? v.stock.toString() : "0",
      }));

      setVariants(existingVariants);
      setHasVariants(existingVariants.length > 0);

      setFormData({
        title: product.title || "",
        slug: product.slug || "",
        sku: product.sku || "",
        brand: product.brand || (product.productBrand?.name || ""),
        brandId: product.brandId || "",
        preference: product.preference || "NOT_APPLICABLE",
        unitPrice: product.unitPrice ? product.unitPrice.toString() : "",
        discountPercentage: product.discountPercentage ? product.discountPercentage.toString() : "0",
        gst: product.gst ? product.gst.toString() : "18",
        expiryDate: product.expiryDate ? new Date(product.expiryDate).toISOString().split('T')[0] : "",
        stock: product.stock ? product.stock.toString() : "0",
        lowStockAlert: product.lowStockAlert ? product.lowStockAlert.toString() : "5",
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
    const flavors = flavorInput.split(",").map((f) => f.trim()).filter(Boolean);
    const weights = weightInput.split(",").map((w) => w.trim()).filter(Boolean);

    if (flavors.length === 0 && weights.length === 0) return;

    const basePrice = formData.unitPrice || "1000";
    const baseDiscount = formData.discountPercentage || "0";
    const baseGst = formData.gst || "18";
    const baseStock = formData.stock || "10";
    const baseSku = formData.sku || "SKU-PROD";

    const newVariants: Array<{
      title: string;
      sku: string;
      flavor: string;
      weight: string;
      unitPrice: string;
      discountPercentage: string;
      gst: string;
      stock: string;
    }> = [];

    const fList = flavors.length > 0 ? flavors : ["Default"];
    const wList = weights.length > 0 ? weights : ["Default"];

    fList.forEach((f, fIdx) => {
      wList.forEach((w, wIdx) => {
        const titleParts = [];
        if (f !== "Default") titleParts.push(f);
        if (w !== "Default") titleParts.push(w);
        const title = titleParts.join(" / ") || "Standard Variant";

        const skuClean = `${baseSku}-${f !== "Default" ? f.substring(0, 3).toUpperCase() : ""}${w !== "Default" ? w.replace(/[^a-zA-Z0-9]/g, "").toUpperCase() : ""}-${fIdx}${wIdx}`;

        newVariants.push({
          title,
          sku: skuClean,
          flavor: f !== "Default" ? f : "",
          weight: w !== "Default" ? w : "",
          unitPrice: basePrice,
          discountPercentage: baseDiscount,
          gst: baseGst,
          stock: baseStock,
        });
      });
    });

    setVariants(newVariants);
  };

  const addCustomVariant = () => {
    setVariants((prev) => [
      ...prev,
      {
        title: "New Variant",
        sku: `${formData.sku || "SKU"}-VAR-${prev.length + 1}`,
        flavor: "",
        weight: "",
        unitPrice: formData.unitPrice || "1000",
        discountPercentage: formData.discountPercentage || "0",
        gst: formData.gst || "18",
        stock: "10",
      },
    ]);
  };

  const updateVariant = (index: number, field: string, value: string) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    );
  };

  const removeVariantRow = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
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
      alert("Failed to upload file");
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
            Update pricing, stock levels, or product details.
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
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-500 outline-none transition-all"
                />
              </div>

              {/* Slug & SKU Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Slug</label>
                  <input
                    type="text"
                    name="slug"
                    required
                    value={formData.slug}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">SKU Code</label>
                  <input
                    type="text"
                    name="sku"
                    required
                    value={formData.sku}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-500 outline-none transition-all"
                  />
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
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Subcategory</label>
                  <select
                    name="subcategoryId"
                    value={formData.subcategoryId}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-500 outline-none transition-all font-medium text-gray-700"
                  >
                    <option value="">Select Subcategory</option>
                    {subcategories.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
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
                  <label className="text-sm font-semibold text-gray-700">Unit Price (₹) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    step="0.01"
                    name="unitPrice"
                    required
                    value={formData.unitPrice}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-500 outline-none transition-all"
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
                  <label className="text-sm font-semibold text-gray-700">Expiry Date</label>
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
                  <label className="text-sm font-semibold text-gray-700">Stock Quantity</label>
                  <input
                    type="number"
                    name="stock"
                    required
                    value={formData.stock}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-500 outline-none transition-all"
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
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 ${
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

            {/* Right Column: Image Upload */}
            <div className="lg:col-span-1 space-y-4">
              <label className="text-sm font-semibold text-gray-700">Product Images</label>
              <div className="w-full h-56 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer p-4 text-center">
                <UploadCloud className="h-6 w-6 text-gray-500 mb-2" />
                <p className="text-sm font-semibold text-gray-700">Upload New Image</p>
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
                placeholder="Enter detailed product description..."
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-8 mt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={() => router.push(`/products/${productId}`)}
              className="px-5 py-2.5 border border-gray-200 text-gray-600 font-bold rounded-xl text-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-orange-500/20 transition-all text-sm disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
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
