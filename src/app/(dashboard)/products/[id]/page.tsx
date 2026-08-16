"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api";
import { 
  ArrowLeft, 
  Loader2, 
  Edit2, 
  Trash2, 
  Package, 
  Tag, 
  Layers, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Play,
  Film,
  Video,
  X,
  ZoomIn
} from "lucide-react";
import Link from "next/link";
import { getMediaUrl } from "@/lib/media";

function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(ytRegex);
  if (match && match[1]) {
    return `https://www.youtube.com/embed/${match[1]}?autoplay=1&rel=0`;
  }
  return null;
}

interface AdminTabSection {
  id: string;
  label: string;
  content: string;
}

function formatTabContent(html: string): string {
  if (!html) return '';

  // Clean any corrupted nested img tags
  let cleaned = html.replace(/<img[^>]*src=["']\s*<img[^>]*src=["']([^"']+)["'][^>]*>["'][^>]*>/gi, '<img src="$1" alt="Product image" style="max-width: 100%; height: auto; border-radius: 12px; margin: 14px 0; border: 1px solid #e5e7eb;" />');

  // Convert standalone plain text image URLs into <img>
  return cleaned.replace(
    /(?:<p>|<div>)?\s*(https?:\/\/[^\s<"']+\.(?:png|jpg|jpeg|webp|svg|gif)(?:\?[^\s<"']*)?|https?:\/\/[^\s<"']*(?:gstatic\.com\/images|googleusercontent\.com)[^\s<"']*)\s*(?:<\/p>|<\/div>)?/gi,
    (match, url, offset, fullStr) => {
      const preceding = fullStr.slice(Math.max(0, offset - 12), offset);
      if (/src\s*=\s*["']?$/i.test(preceding) || /href\s*=\s*["']?$/i.test(preceding) || match.includes('<img')) {
        return match;
      }
      return `<img src="${url}" alt="Product image" style="max-width: 100%; height: auto; border-radius: 12px; margin: 14px 0; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.05);" />`;
    }
  );
}

function parseAdminTabs(rawHtml: string): AdminTabSection[] {
  if (!rawHtml || !rawHtml.trim()) return [];

  // Match only major section headings H2 and H3 (H4 and sub-headings stay inside section)
  const delimiterRegex = /(<h[23][^>]*>[\s\S]*?<\/h[23]>)/gi;
  const tokens = rawHtml.split(delimiterRegex);

  const sections: AdminTabSection[] = [];
  let currentTitle = "DESCRIPTION";
  let currentContentBuffer: string[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (!token || !token.trim()) continue;

    const isHeading = token.match(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/i);

    if (isHeading) {
      const cleanLabel = isHeading[1].replace(/<[^>]+>/g, "").replace(/[:\-–—]+$/, "").trim();

      if (currentContentBuffer.length > 0) {
        sections.push({
          id: currentTitle.toUpperCase().replace(/[^A-Z0-9]+/g, "_"),
          label: currentTitle,
          content: formatTabContent(currentContentBuffer.join("").trim()),
        });
        currentContentBuffer = [];
      }

      currentTitle = cleanLabel || "DESCRIPTION";
    } else {
      currentContentBuffer.push(token);
    }
  }

  if (currentContentBuffer.length > 0 || sections.length === 0) {
    sections.push({
      id: currentTitle.toUpperCase().replace(/[^A-Z0-9]+/g, "_"),
      label: currentTitle,
      content: formatTabContent(currentContentBuffer.join("").trim() || rawHtml),
    });
  }

  return sections;
}

export default function ProductDetailsPage() {
  const params = useParams();
  const productId = params.id as string;
  const router = useRouter();

  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [activeDescTab, setActiveDescTab] = useState("DESCRIPTION");

  const parsedDescriptionTabs = useMemo(() => {
    return parseAdminTabs(product?.description || "");
  }, [product?.description]);

  useEffect(() => {
    if (parsedDescriptionTabs.length > 0 && !parsedDescriptionTabs.some(t => t.id === activeDescTab)) {
      setActiveDescTab(parsedDescriptionTabs[0].id);
    }
  }, [parsedDescriptionTabs, activeDescTab]);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/products/${productId}`);
      setProduct(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load product details");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProduct = async () => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        await api.delete(`/products/${productId}`);
        router.push("/products");
      } catch (err: any) {
        alert(err.response?.data?.message || "Failed to delete product");
      }
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 text-gold-500 animate-spin" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 flex flex-col items-center justify-center text-center">
          <h2 className="text-lg font-bold mb-2">Error Loading Product</h2>
          <p className="text-sm font-medium opacity-80 mb-6">{error || "Product not found"}</p>
          <Link href="/products" className="px-6 py-2.5 bg-white border border-red-200 text-red-700 rounded-xl font-bold hover:bg-red-50 transition-colors">
            Back to Products Catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link href="/products" className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Link href="/products" className="hover:text-gold-600">Products</Link>
              <span>›</span>
              <span className="text-gray-900 font-semibold truncate max-w-md">{product.title}</span>
            </div>
            {(() => {
              const titleStr = product.title || "";
              const match = titleStr.match(/^(.*?)\s*(\(.*?\))$/);
              if (match) {
                return (
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-brandDark font-serif-luxury tracking-tight leading-snug">
                    <span className="block">{match[1]}</span>
                    <span className="block text-lg sm:text-xl font-semibold text-gray-600 mt-1">
                      {match[2]}
                    </span>
                  </h1>
                );
              }
              return (
                <h1 className="text-2xl sm:text-3xl font-extrabold text-brandDark font-serif-luxury tracking-tight leading-snug">
                  {titleStr}
                </h1>
              );
            })()}
            <p className="mt-1.5 text-xs sm:text-sm font-mono text-gray-500">
              SKU: <span className="font-semibold text-gray-700">{product.sku}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/products/${productId}/edit`}
            className="flex items-center justify-center gap-2 px-5 py-2.5 min-w-[140px] bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors text-sm"
          >
            <Edit2 className="h-4 w-4" /> Edit Product
          </Link>
          <button
            onClick={deleteProduct}
            className="flex items-center justify-center gap-2 px-5 py-2.5 min-w-[140px] bg-white border border-red-200 text-red-600 rounded-xl font-bold hover:bg-red-50 transition-colors text-sm cursor-pointer"
          >
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Product Details & Inventory History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Info Card with Interactive Description Tabs */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>Product Overview & Sections</span>
            </h3>

            {/* Description Tab Switcher */}
            {parsedDescriptionTabs.length > 1 ? (
              <div className="mb-6">
                <div className="flex overflow-x-auto gap-2 border-b border-gray-200 pb-2 mb-4">
                  {parsedDescriptionTabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveDescTab(tab.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                        activeDescTab === tab.id
                          ? "bg-gold-50 text-gold-700 border border-gold-200 shadow-2xs"
                          : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="p-4 bg-gray-50/60 rounded-xl border border-gray-100 min-h-[120px]">
                  <div
                    className="text-sm text-gray-700 leading-relaxed prose max-w-none font-normal"
                    dangerouslySetInnerHTML={{
                      __html: (parsedDescriptionTabs.find((t) => t.id === activeDescTab) || parsedDescriptionTabs[0])?.content || "",
                    }}
                  />
                </div>
              </div>
            ) : (
              <div
                className="text-sm text-gray-600 leading-relaxed mb-6 prose max-w-none font-normal"
                dangerouslySetInnerHTML={{ __html: product.description || "No description provided." }}
              />
            )}

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 pt-4 border-t border-gray-100">
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">Base Price (MRP)</p>
                <p className="text-lg font-extrabold text-gray-900">
                  ₹{(Number(product.unitPrice ?? product.price ?? 0)).toLocaleString("en-IN")}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">Discount</p>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold ${
                  (product.discountPercentage || 0) > 0 ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-gray-100 text-gray-600"
                }`}>
                  {(product.discountPercentage || 0) > 0 ? `${product.discountPercentage}% OFF` : "No Discount"}
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">Final Sale Price</p>
                <p className="text-lg font-extrabold text-emerald-600">
                  ₹{(Number(product.discountPrice ?? product.salePrice ?? product.unitPrice ?? product.price ?? 0)).toLocaleString("en-IN")}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">Stock Level</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold ${
                  product.stock === 0 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
                }`}>
                  {product.stock} in stock
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">Status / Expiry</p>
                <div className="flex flex-col gap-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold w-fit ${
                    product.status === "ACTIVE" ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-600"
                  }`}>
                    {product.status}
                  </span>
                  {product.expiryDate && (
                    <span className="text-[11px] font-medium text-gray-500">
                      Exp: {new Date(product.expiryDate).toLocaleDateString("en-IN", { month: "short", year: "numeric", day: "numeric" })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Variants Breakdown Card */}
          {product.variants && product.variants.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Product Variants & Pricing ({product.variants.length})</h3>
                  <p className="text-xs text-gray-500">Individual flavor and weight pricing combinations</p>
                </div>
              </div>

              <div className="overflow-x-auto border border-gray-100 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 font-bold uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Variant Name</th>
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3">Attribute 1 (Flavor)</th>
                      <th className="py-2.5 px-3">Attribute 2 (Weight)</th>
                      <th className="py-2.5 px-3">Base (MRP)</th>
                      <th className="py-2.5 px-3">Discount</th>
                      <th className="py-2.5 px-3">Sale Price</th>
                      <th className="py-2.5 px-3">Expiry Date</th>
                      <th className="py-2.5 px-3">Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                    {product.variants.map((v: any) => {
                      const vBase = Number(v.unitPrice ?? v.price ?? product.unitPrice ?? product.price ?? 0);
                      const vDisc = Number(v.discountPercentage ?? product.discountPercentage ?? 0);
                      const vSale = Number(v.discountPrice ?? v.salePrice ?? (vDisc > 0 ? Math.round(vBase * (1 - vDisc / 100)) : vBase));
                      const vExpiry = v.expiryDate || product.expiryDate;

                      return (
                        <tr key={v.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="p-3 font-bold text-gray-900">{v.title}</td>
                          <td className="p-3 font-mono text-gray-500">{v.sku}</td>
                          <td className="p-3">
                            {v.flavor ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-100">
                                {v.flavor}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="p-3">
                            {v.weight ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-100">
                                {v.weight}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="p-3 font-bold text-gray-900">₹{vBase.toLocaleString("en-IN")}</td>
                          <td className="p-3">
                            {vDisc > 0 ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                {vDisc}% OFF
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="p-3 font-bold text-emerald-600">
                            ₹{vSale.toLocaleString("en-IN")}
                          </td>
                          <td className="p-3 text-xs text-gray-600 font-medium whitespace-nowrap">
                            {vExpiry ? (
                              new Date(vExpiry).toLocaleDateString("en-IN", { month: "short", year: "numeric", day: "numeric" })
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="p-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                              v.stock === 0 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
                            }`}>
                              {v.stock} in stock
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Inventory Log History */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900">Inventory Logs & History</h3>
              <span className="text-xs font-semibold text-gray-400">Stock movements</span>
            </div>

            {!product.inventoryLogs || product.inventoryLogs.length === 0 ? (
              <div className="p-8 text-center bg-gray-50 rounded-xl">
                <Clock className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500 font-medium">No stock movement logs recorded yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {product.inventoryLogs.map((log: any) => (
                  <div key={log.id} className="py-3 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        log.change > 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                      }`}>
                        {log.change > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{log.type}</p>
                        <p className="text-xs text-gray-500">{log.reason || "No reason specified"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${log.change > 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {log.change > 0 ? `+${log.change}` : log.change}
                      </p>
                      <p className="text-xs text-gray-400">{formatDate(log.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Media Gallery & Categories Meta */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-6">
            <h3 className="text-base font-bold text-gray-900 mb-4">Product Media (Images & Videos)</h3>
            
            {/* Active Media Viewer */}
            {(() => {
              const allImages = (product.images || []).map((url: string) => ({ type: "image", url }));
              const allVideos = (product.videos || []).map((url: string) => {
                const embedUrl = getYouTubeEmbedUrl(url);
                return embedUrl
                  ? { type: "youtube", url, embedUrl }
                  : { type: "video", url };
              });

              const mediaList = [...allImages, ...allVideos];
              const hasMedia = mediaList.length > 0;
              const activeMedia = mediaList[selectedMediaIndex] || mediaList[0];

              const handlePrev = () => {
                setSelectedMediaIndex((prev) => (prev > 0 ? prev - 1 : mediaList.length - 1));
              };

              const handleNext = () => {
                setSelectedMediaIndex((prev) => (prev < mediaList.length - 1 ? prev + 1 : 0));
              };

              return (
                <div>
                  <div className="aspect-square w-full bg-gray-50 rounded-2xl border border-gray-100 mb-4 flex flex-col items-center justify-center text-gray-400 overflow-hidden relative group">
                    {hasMedia && activeMedia ? (
                      activeMedia.type === "image" ? (
                        <img
                          src={getMediaUrl(activeMedia.url)}
                          alt={product.title}
                          className="w-full h-full object-contain p-2 cursor-zoom-in"
                          onClick={() => {
                            setLightboxIndex(selectedMediaIndex);
                            setLightboxOpen(true);
                          }}
                        />
                      ) : activeMedia.type === "youtube" ? (
                        <iframe
                          src={activeMedia.embedUrl}
                          title={product.title}
                          className="w-full h-full rounded-xl border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <video
                          src={getMediaUrl(activeMedia.url)}
                          controls
                          autoPlay
                          className="w-full h-full object-contain bg-black"
                        />
                      )
                    ) : (
                      <>
                        <Package className="h-10 w-10 mb-2 opacity-50" />
                        <span className="text-xs font-semibold">No Media Uploaded</span>
                      </>
                    )}

                    {/* Prev / Next Overlay Buttons */}
                    {mediaList.length > 1 && (
                      <>
                        <button
                          onClick={handlePrev}
                          className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white shadow-md text-gray-700 hover:text-gold-600 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                          title="Previous Media"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                          onClick={handleNext}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white shadow-md text-gray-700 hover:text-gold-600 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                          title="Next Media"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Thumbnail Selector Grid */}
                  {hasMedia && (
                    <div className="grid grid-cols-4 gap-2 mb-6">
                      {mediaList.map((item: any, idx: number) => {
                        const isSelected = selectedMediaIndex === idx;

                        return (
                          <button
                            key={idx}
                            onClick={() => setSelectedMediaIndex(idx)}
                            className={`aspect-square rounded-xl overflow-hidden bg-gray-50 relative border transition-all cursor-pointer ${
                              isSelected
                                ? "ring-2 ring-gold-500 border-gold-500 shadow-md scale-105"
                                : "border-gray-200 hover:border-gray-300 opacity-80 hover:opacity-100"
                            }`}
                          >
                            {item.type === "image" ? (
                              <img
                                src={getMediaUrl(item.url)}
                                alt={`Thumbnail ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                            ) : item.type === "youtube" ? (
                              <div className="w-full h-full bg-red-950 flex flex-col items-center justify-center text-white relative">
                                <Play className="h-5 w-5 text-red-500 fill-red-500 mb-0.5" />
                                <span className="text-[9px] font-black tracking-wider uppercase bg-red-600/90 px-1 py-0.5 rounded text-white">
                                  YouTube
                                </span>
                              </div>
                            ) : (
                              <div className="w-full h-full bg-gray-900 flex flex-col items-center justify-center text-white relative">
                                <Film className="h-5 w-5 text-gold-400 mb-0.5" />
                                <span className="text-[9px] font-black tracking-wider uppercase bg-gray-800 px-1 py-0.5 rounded text-gray-200">
                                  Video
                                </span>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="space-y-4 pt-2 border-t border-gray-100">
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
                  <Package className="h-3.5 w-3.5" /> Brand
                </p>
                <p className="text-sm font-bold text-gray-900">
                  {typeof product.brand === "object" && product.brand !== null
                    ? product.brand.name
                    : product.brand || (product as any).productBrand?.name || "Unbranded / Custom"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5" /> Category
                </p>
                <p className="text-sm font-bold text-gray-900">
                  {product.category?.name || "Uncategorized"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5" /> Subcategory
                </p>
                <p className="text-sm font-bold text-gray-900">
                  {product.subcategory?.name || "None"}
                </p>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 mb-1">Created At</p>
                <p className="text-xs font-bold text-gray-900">{formatDate(product.createdAt)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && (() => {
        const allImages = (product.images || []).map((url: string) => ({ type: "image", url }));
        const allVideos = (product.videos || []).map((url: string) => {
          const embedUrl = getYouTubeEmbedUrl(url);
          return embedUrl ? { type: "youtube", url, embedUrl } : { type: "video", url };
        });
        const mediaList = [...allImages, ...allVideos];
        const activeItem = mediaList[lightboxIndex] || mediaList[0];

        return (
          <div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setLightboxOpen(false)}
          >
            <div
              className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col md:flex-row overflow-hidden relative animate-in zoom-in-95 duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setLightboxOpen(false)}
                className="absolute top-4 right-4 z-10 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors cursor-pointer"
              >
                <X className="h-5 w-5 text-gray-700" />
              </button>

              {/* Left: Large Preview */}
              <div className="flex-1 bg-gray-50 flex items-center justify-center min-h-[300px] md:min-h-[500px] relative group">
                {activeItem.type === "image" ? (
                  <img
                    src={getMediaUrl(activeItem.url)}
                    alt={product.title}
                    className="max-w-full max-h-[80vh] object-contain p-6"
                  />
                ) : activeItem.type === "youtube" ? (
                  <iframe
                    src={activeItem.embedUrl}
                    title={product.title}
                    className="w-full h-full min-h-[400px] border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={getMediaUrl(activeItem.url)}
                    controls
                    autoPlay
                    className="max-w-full max-h-[80vh] object-contain"
                  />
                )}

                {/* Prev / Next inside lightbox */}
                {mediaList.length > 1 && (
                  <>
                    <button
                      onClick={() => setLightboxIndex((prev) => (prev > 0 ? prev - 1 : mediaList.length - 1))}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/90 hover:bg-white shadow-lg text-gray-700 hover:text-gold-600 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setLightboxIndex((prev) => (prev < mediaList.length - 1 ? prev + 1 : 0))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/90 hover:bg-white shadow-lg text-gray-700 hover:text-gold-600 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>

              {/* Right: Thumbnail Grid */}
              <div className="w-full md:w-56 lg:w-64 bg-white border-t md:border-t-0 md:border-l border-gray-100 p-4 overflow-y-auto">
                <h4 className="text-sm font-bold text-gold-600 mb-3">All Product Images</h4>
                <div className="grid grid-cols-3 md:grid-cols-2 gap-2">
                  {mediaList.map((item: any, idx: number) => {
                    const isActive = lightboxIndex === idx;
                    return (
                      <button
                        key={idx}
                        onClick={() => setLightboxIndex(idx)}
                        className={`aspect-square rounded-xl overflow-hidden relative border-2 transition-all cursor-pointer ${
                          isActive
                            ? "border-gold-500 ring-2 ring-gold-500/30 shadow-md scale-105"
                            : "border-gray-200 hover:border-gray-300 opacity-75 hover:opacity-100"
                        }`}
                      >
                        {item.type === "image" ? (
                          <img src={getMediaUrl(item.url)} alt="" className="w-full h-full object-cover" />
                        ) : item.type === "youtube" ? (
                          <div className="w-full h-full bg-red-950 flex flex-col items-center justify-center">
                            <Play className="h-4 w-4 text-red-500 fill-red-500 mb-0.5" />
                            <span className="text-[8px] font-black text-white uppercase">YouTube</span>
                          </div>
                        ) : (
                          <div className="w-full h-full bg-gray-900 flex flex-col items-center justify-center">
                            <Film className="h-4 w-4 text-gold-400 mb-0.5" />
                            <span className="text-[8px] font-black text-gray-300 uppercase">Video</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
