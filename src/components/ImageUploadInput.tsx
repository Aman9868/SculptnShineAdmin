"use client";

import { useState, useRef } from "react";
import { api } from "@/lib/api";
import { getMediaUrl } from "@/lib/media";
import { useToast } from "@/context/ToastContext";
import { UploadCloud, Link as LinkIcon, X, Loader2, Image as ImageIcon, Check } from "lucide-react";

interface ImageUploadInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  helperText?: string;
  required?: boolean;
  aspectRatio?: "square" | "video" | "banner" | "auto";
  compact?: boolean;
  className?: string;
}

export default function ImageUploadInput({
  label,
  value,
  onChange,
  placeholder = "https://... or upload a file",
  helperText = "PNG, JPG, WebP (Max 10MB) or external URL",
  required = false,
  aspectRatio = "auto",
  compact = false,
  className = "",
}: ImageUploadInputProps) {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [activeTab, setActiveTab] = useState<"upload" | "url">(value?.startsWith("http") ? "url" : "upload");
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Validate type
    if (!file.type.startsWith("image/")) {
      showToast("Please select a valid image file (PNG, JPG, WebP)", "error");
      return;
    }

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      showToast("Image size must be less than 10MB", "error");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);

    setIsUploading(true);
    try {
      const res = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const fileUrl = res.data.url;
      onChange(fileUrl);
      setImageLoadError(false);
      showToast("Image uploaded successfully!", "success");
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to upload image", "error");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const clearImage = () => {
    onChange("");
    setImageLoadError(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const aspectClass =
    aspectRatio === "square"
      ? "aspect-square"
      : aspectRatio === "video"
      ? "aspect-video"
      : aspectRatio === "banner"
      ? "aspect-[21/9]"
      : "h-36";

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        {label && (
          <label className="text-xs font-bold text-gray-700">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        )}
        
        {/* Toggle between Upload & URL */}
        <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg text-[11px] font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={`px-2 py-0.5 rounded-md transition-all ${
              activeTab === "upload" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Upload File
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("url")}
            className={`px-2 py-0.5 rounded-md transition-all ${
              activeTab === "url" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Direct URL
          </button>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file);
        }}
        className="hidden"
      />

      {/* Image Preview & Controls */}
      {value && !imageLoadError ? (
        <div className="relative rounded-xl border border-gray-200 bg-gray-50 overflow-hidden group">
          <div className={`w-full ${aspectClass} flex items-center justify-center bg-gray-100 overflow-hidden`}>
            <img
              src={getMediaUrl(value)}
              alt="Preview"
              className="w-full h-full object-contain"
              onError={() => setImageLoadError(true)}
            />
          </div>

          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-3 py-1.5 bg-white/90 hover:bg-white text-gray-800 rounded-lg text-xs font-bold shadow transition-transform transform hover:scale-105 flex items-center gap-1 cursor-pointer"
            >
              <UploadCloud className="h-3.5 w-3.5" /> Replace
            </button>
            <button
              type="button"
              onClick={clearImage}
              className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-bold shadow transition-transform transform hover:scale-105 cursor-pointer"
              title="Remove image"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="p-2 border-t border-gray-100 bg-white flex items-center justify-between text-xs text-gray-500">
            <span className="truncate max-w-[220px] font-mono text-[11px]">{value}</span>
            <button
              type="button"
              onClick={clearImage}
              className="text-red-500 hover:text-red-700 font-semibold text-[11px]"
            >
              Clear
            </button>
          </div>
        </div>
      ) : activeTab === "upload" ? (
        /* Upload Drag & Drop Box */
        <div
          onClick={() => !isUploading && fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`w-full ${compact ? "h-28" : "h-36"} border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
            isDragging
              ? "border-gold-500 bg-gold-50/50"
              : isUploading
              ? "border-gray-200 bg-gray-50 cursor-wait opacity-80"
              : "border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300"
          }`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center justify-center text-center p-4">
              <Loader2 className="h-6 w-6 text-gold-500 animate-spin mb-2" />
              <p className="text-xs font-bold text-gray-700">Uploading Image...</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Please wait while the file is being processed</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-4">
              <div className="p-2.5 bg-white rounded-full shadow-sm mb-2 text-gray-500 group-hover:text-gold-500 transition-colors">
                <UploadCloud className="h-5 w-5" />
              </div>
              <p className="text-xs font-bold text-gray-700">
                Click to browse <span className="text-gray-400 font-normal">or drag & drop</span>
              </p>
              <p className="text-[11px] text-gray-400 mt-1">{helperText}</p>
            </div>
          )}
        </div>
      ) : (
        /* Direct URL Input */
        <div className="space-y-1.5">
          <div className="relative">
            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="url"
              value={value || ""}
              onChange={(e) => {
                onChange(e.target.value);
                setImageLoadError(false);
              }}
              placeholder={placeholder}
              className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-gold-500 font-medium"
            />
            {value && (
              <button
                type="button"
                onClick={clearImage}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <p className="text-[11px] text-gray-400">{helperText}</p>
        </div>
      )}
    </div>
  );
}
