"use client";

import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  X, 
  Loader2, 
  ArrowRight,
  Info,
  RefreshCw,
  Layers,
  ChevronDown,
  ChevronUp,
  GitBranch,
  Package,
  Link2
} from "lucide-react";
import { api } from "@/lib/api";

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ParsedProductRow {
  title?: string;
  sku?: string;
  brand?: string;
  category?: string;
  subcategory?: string;
  unitPrice?: number | string;
  discountPercentage?: number | string;
  stock?: number | string;
  preference?: string;
  status?: string;
  description?: string;
  images?: string;
  [key: string]: any;
}

export default function BulkUploadModal({ isOpen, onClose, onSuccess }: BulkUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedProductRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    total: number;
    created: number;
    updated: number;
    failed: number;
    errors: Array<{ row: number; title?: string; sku?: string; error: string }>;
  } | null>(null);
  const [showErrorList, setShowErrorList] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  if (!isOpen) return null;

  // 1. Sample Data for Simple Products (Without Variants)
  const simpleProductTemplateData = [
    {
      "Title": "CeraVe Hydrating Facial Cleanser for Normal to Dry Skin 473ml",
      "SKU": "CERAVE-CLEANSER-473ML",
      "Brand": "CeraVe",
      "Category": "Skincare & Facial Care",
      "Subcategory": "Face Serums & Glow Elixirs",
      "UnitPrice": 1250,
      "DiscountPercentage": 10,
      "GST": 18,
      "Stock": 50,
      "LowStockAlert": 5,
      "Preference": "NOT_APPLICABLE",
      "Status": "ACTIVE",
      "Description": "Gentle foaming cleanser with 3 essential ceramides and hyaluronic acid for lasting barrier hydration.",
      "Images": "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80",
      "ExpiryDate": "2028-06-30"
    },
    {
      "Title": "The Ordinary Niacinamide 10% + Zinc 1% Oil Control Serum 30ml",
      "SKU": "ORDINARY-NIAC-30ML",
      "Brand": "The Ordinary",
      "Category": "Skincare & Facial Care",
      "Subcategory": "Face Serums & Glow Elixirs",
      "UnitPrice": 650,
      "DiscountPercentage": 5,
      "GST": 18,
      "Stock": 40,
      "LowStockAlert": 5,
      "Preference": "NOT_APPLICABLE",
      "Status": "ACTIVE",
      "Description": "High-strength vitamin and mineral blemish formula with 10% pure Niacinamide and 1% Zinc PCA.",
      "Images": "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80",
      "ExpiryDate": "2028-01-15"
    },
    {
      "Title": "Dymatize ISO100 Hydrolyzed 100% Whey Isolate Gourmet Chocolate 5 lbs",
      "SKU": "DYMATIZE-ISO100-5LB-CHOC",
      "Brand": "Dymatize",
      "Category": "Proteins & Fitness Supplements",
      "Subcategory": "Whey Isolate & Concentrates",
      "UnitPrice": 8499,
      "DiscountPercentage": 15,
      "GST": 18,
      "Stock": 20,
      "LowStockAlert": 5,
      "Preference": "VEGETARIAN",
      "Status": "ACTIVE",
      "Description": "25g hydrolyzed whey protein isolate with ultra-fast digestion and 5.5g BCAAs.",
      "Images": "https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=800&q=80",
      "ExpiryDate": "2027-10-31"
    }
  ];

  // 2. Sample Data for Multi-Variant Products (With Flavors & Weights)
  const variantProductTemplateData = [
    // Parent Product 1: ON Gold Standard Whey
    {
      "Title": "Optimum Nutrition Gold Standard 100% Whey",
      "SKU": "ON-GSWHEY-MAIN",
      "ParentSKU": "",
      "Brand": "Optimum Nutrition",
      "Category": "Proteins & Fitness Supplements",
      "Subcategory": "Whey Isolate & Concentrates",
      "Flavor": "",
      "Weight": "",
      "UnitPrice": 3899,
      "DiscountPercentage": 15,
      "GST": 18,
      "Stock": 80,
      "LowStockAlert": 5,
      "Preference": "VEGETARIAN",
      "Status": "ACTIVE",
      "IsDefault": "",
      "Description": "World's #1 Selling Whey Protein Powder with 24g protein and 5.5g BCAAs per serving.",
      "Images": "https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=800&q=80",
      "ExpiryDate": "2027-12-31"
    },
    // Variant 1 of ON Whey
    {
      "Title": "Optimum Nutrition Gold Standard Whey - Double Rich Chocolate 2 lbs",
      "SKU": "ON-GSWHEY-2LB-CHOC",
      "ParentSKU": "ON-GSWHEY-MAIN",
      "Brand": "Optimum Nutrition",
      "Category": "Proteins & Fitness Supplements",
      "Subcategory": "Whey Isolate & Concentrates",
      "Flavor": "Double Rich Chocolate",
      "Weight": "2 lbs",
      "UnitPrice": 3899,
      "DiscountPercentage": 15,
      "GST": 18,
      "Stock": 45,
      "LowStockAlert": 5,
      "Preference": "VEGETARIAN",
      "Status": "ACTIVE",
      "IsDefault": "TRUE",
      "Description": "",
      "Images": "https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=800&q=80",
      "ExpiryDate": "2027-12-31"
    },
    // Variant 2 of ON Whey
    {
      "Title": "Optimum Nutrition Gold Standard Whey - French Vanilla Cream 5 lbs",
      "SKU": "ON-GSWHEY-5LB-VAN",
      "ParentSKU": "ON-GSWHEY-MAIN",
      "Brand": "Optimum Nutrition",
      "Category": "Proteins & Fitness Supplements",
      "Subcategory": "Whey Isolate & Concentrates",
      "Flavor": "French Vanilla Cream",
      "Weight": "5 lbs",
      "UnitPrice": 7899,
      "DiscountPercentage": 20,
      "GST": 18,
      "Stock": 35,
      "LowStockAlert": 5,
      "Preference": "VEGETARIAN",
      "Status": "ACTIVE",
      "IsDefault": "FALSE",
      "Description": "",
      "Images": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80",
      "ExpiryDate": "2027-12-31"
    },
    // Parent Product 2: MuscleBlaze Biozyme Whey
    {
      "Title": "MuscleBlaze Biozyme Performance Whey",
      "SKU": "MB-BIOZYME-MAIN",
      "ParentSKU": "",
      "Brand": "MuscleBlaze",
      "Category": "Proteins & Fitness Supplements",
      "Subcategory": "Whey Isolate & Concentrates",
      "Flavor": "",
      "Weight": "",
      "UnitPrice": 4299,
      "DiscountPercentage": 20,
      "GST": 18,
      "Stock": 60,
      "LowStockAlert": 5,
      "Preference": "VEGETARIAN",
      "Status": "ACTIVE",
      "IsDefault": "",
      "Description": "Clinically tested Enhanced Absorption Formula (EAF) delivering 25g protein per scoop.",
      "Images": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80",
      "ExpiryDate": "2027-08-31"
    },
    // Variant 1 of MB Biozyme
    {
      "Title": "MuscleBlaze Biozyme Performance Whey - Magic Mango 2 kg",
      "SKU": "MB-BIOZYME-MANGO-2KG",
      "ParentSKU": "MB-BIOZYME-MAIN",
      "Brand": "MuscleBlaze",
      "Category": "Proteins & Fitness Supplements",
      "Subcategory": "Whey Isolate & Concentrates",
      "Flavor": "Magic Mango",
      "Weight": "2 kg",
      "UnitPrice": 4299,
      "DiscountPercentage": 20,
      "GST": 18,
      "Stock": 30,
      "LowStockAlert": 5,
      "Preference": "VEGETARIAN",
      "Status": "ACTIVE",
      "IsDefault": "TRUE",
      "Description": "",
      "Images": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80",
      "ExpiryDate": "2027-08-31"
    }
  ];

  const handleDownloadSample = (type: "simple" | "variant", format: "xlsx" | "csv") => {
    const data = type === "simple" ? simpleProductTemplateData : variantProductTemplateData;
    const sheetTitle = type === "simple" ? "Simple_Products" : "Variant_Products";
    const filename = type === "simple" 
      ? `sculptnshine_simple_products_template.${format}`
      : `sculptnshine_multi_variants_template.${format}`;

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetTitle);

    if (format === "xlsx") {
      XLSX.writeFile(workbook, filename);
    } else {
      XLSX.writeFile(workbook, filename, { bookType: "csv" });
    }
  };

  const handleFileChange = (selectedFile: File) => {
    if (!selectedFile) return;

    const fileExt = selectedFile.name.split(".").pop()?.toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(fileExt || "")) {
      setErrorMessage("Please select a valid Excel (.xlsx, .xls) or CSV (.csv) file.");
      return;
    }

    setFile(selectedFile);
    setErrorMessage(null);
    setUploadResult(null);
    setIsParsing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<ParsedProductRow>(sheet);

        if (json.length === 0) {
          setErrorMessage("The uploaded file does not contain any product rows.");
          setParsedRows([]);
        } else {
          setParsedRows(json);
        }
      } catch (err: any) {
        setErrorMessage("Failed to parse file: " + (err.message || "Invalid file format"));
        setParsedRows([]);
      } finally {
        setIsParsing(false);
      }
    };

    reader.onerror = () => {
      setErrorMessage("Failed to read file.");
      setIsParsing(false);
    };

    reader.readAsBinaryString(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleUploadSubmit = async () => {
    if (!file || parsedRows.length === 0) {
      setErrorMessage("Please select a valid file with products to upload.");
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await api.post("/products/bulk-upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      if (res.data.success) {
        setUploadResult(res.data.data);
      } else {
        setErrorMessage(res.data.message || "Bulk upload failed.");
      }
    } catch (err: any) {
      // Fallback: If multipart fails, send JSON directly
      try {
        const res = await api.post("/products/bulk-upload", {
          products: parsedRows
        });
        if (res.data.success) {
          setUploadResult(res.data.data);
        } else {
          setErrorMessage(res.data.message || "Bulk upload failed.");
        }
      } catch (innerErr: any) {
        setErrorMessage(innerErr.response?.data?.message || innerErr.message || "Bulk upload failed.");
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setParsedRows([]);
    setUploadResult(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFinish = () => {
    onSuccess();
    onClose();
    handleReset();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0D121F] w-full max-w-4xl rounded-2xl shadow-2xl border border-gray-100 dark:border-white/[0.08] flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/[0.08] bg-linear-to-r from-gray-50 to-white dark:from-[#0F1424] dark:to-[#0D121F]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 dark:bg-gold-500/20 flex items-center justify-center text-gold-600 dark:text-gold-400 border border-gold-500/20 dark:border-gold-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Bulk Product Import</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Upload multiple products at once via Excel or CSV</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Result View */}
          {uploadResult ? (
            <div className="space-y-6">
              <div className="p-6 bg-emerald-50/80 border border-emerald-200 rounded-2xl text-center space-y-3">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-extrabold text-emerald-900">Bulk Import Processed!</h3>
                <p className="text-sm text-emerald-700 max-w-md mx-auto">
                  Your products were analyzed and synced into the catalog database.
                </p>

                {/* KPI stats */}
                <div className="grid grid-cols-3 gap-3 pt-2 max-w-lg mx-auto">
                  <div className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-2xs">
                    <span className="block text-2xl font-black text-emerald-600">{uploadResult.created}</span>
                    <span className="text-xs font-semibold text-gray-600">Created New</span>
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-2xs">
                    <span className="block text-2xl font-black text-blue-600">{uploadResult.updated}</span>
                    <span className="text-xs font-semibold text-gray-600">Updated Existing</span>
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-2xs">
                    <span className={`block text-2xl font-black ${uploadResult.failed > 0 ? "text-rose-600" : "text-gray-400"}`}>
                      {uploadResult.failed}
                    </span>
                    <span className="text-xs font-semibold text-gray-600">Failed / Skipped</span>
                  </div>
                </div>
              </div>

              {/* Error list if any */}
              {uploadResult.errors && uploadResult.errors.length > 0 && (
                <div className="border border-rose-200 rounded-xl overflow-hidden bg-rose-50/40">
                  <button
                    onClick={() => setShowErrorList(!showErrorList)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-rose-100/70 text-rose-800 font-bold text-xs uppercase tracking-wider hover:bg-rose-100 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      {uploadResult.errors.length} Rows Encountered Issues
                    </span>
                    {showErrorList ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {showErrorList && (
                    <div className="max-h-48 overflow-y-auto p-3 divide-y divide-rose-100 text-xs">
                      {uploadResult.errors.map((err, idx) => (
                        <div key={idx} className="py-2 flex items-start gap-2 text-rose-900">
                          <span className="font-bold text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded text-2xs">
                            Row {err.row}
                          </span>
                          <span className="font-medium">{err.title || err.sku || "Product"}:</span>
                          <span className="text-rose-700">{err.error}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Step 1: Download Official Templates (Two Distinct Formats) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Info className="w-4 h-4 text-gold-600 dark:text-gold-400" />
                    Step 1: Download Pre-Configured Sample Template
                  </h3>
                  <span className="text-2xs text-gray-500 dark:text-gray-400 font-medium">Choose your product format</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Template Card 1: Simple Products (Without Variants) */}
                  <div className="p-4 bg-linear-to-br from-emerald-50/80 via-white to-emerald-50/30 dark:from-emerald-950/40 dark:via-[#101726] dark:to-emerald-950/20 border border-emerald-200/90 dark:border-emerald-500/30 rounded-2xl flex flex-col justify-between shadow-xs hover:border-emerald-300 dark:hover:border-emerald-500/50 transition-all">
                    <div className="space-y-1.5 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
                          1
                        </div>
                        <h4 className="font-extrabold text-emerald-950 dark:text-emerald-300 text-sm">
                          Simple Products (Without Variants)
                        </h4>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                        Best for standalone items like single-size skincare, cleansers, serums, lotions, and accessories.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-emerald-100 dark:border-emerald-950/60">
                      <button
                        type="button"
                        onClick={() => handleDownloadSample("simple", "xlsx")}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                        title="Download Simple Products Excel Template"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        Excel (.xlsx)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadSample("simple", "csv")}
                        className="inline-flex items-center justify-center gap-1 px-3 py-2 bg-white dark:bg-[#151D2E] hover:bg-emerald-50/60 dark:hover:bg-emerald-950/50 text-gray-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/40 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
                        title="Download Simple Products CSV Template"
                      >
                        <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        CSV (.csv)
                      </button>
                    </div>
                  </div>

                  {/* Template Card 2: Multi-Variant Products (With Variants) */}
                  <div className="p-4 bg-linear-to-br from-blue-50/80 via-white to-indigo-50/30 dark:from-blue-950/40 dark:via-[#101726] dark:to-indigo-950/20 border border-blue-200/90 dark:border-blue-500/30 rounded-2xl flex flex-col justify-between shadow-xs hover:border-blue-300 dark:hover:border-blue-500/50 transition-all">
                    <div className="space-y-1.5 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs">
                          2
                        </div>
                        <h4 className="font-extrabold text-blue-950 dark:text-blue-300 text-sm">
                          Multi-Variant Products (Flavors & Sizes)
                        </h4>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                        Best for supplements & cosmetics with multiple flavors (Chocolate, Mango) and weights (2lbs, 5lbs) linked via <code className="bg-blue-100/80 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 font-mono px-1 py-0.5 rounded text-2xs">ParentSKU</code>.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-blue-100 dark:border-blue-950/60">
                      <button
                        type="button"
                        onClick={() => handleDownloadSample("variant", "xlsx")}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                        title="Download Multi-Variant Products Excel Template"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        Excel (.xlsx)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadSample("variant", "csv")}
                        className="inline-flex items-center justify-center gap-1 px-3 py-2 bg-white dark:bg-[#151D2E] hover:bg-blue-50/60 dark:hover:bg-blue-950/50 text-gray-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/40 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
                        title="Download Multi-Variant Products CSV Template"
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        CSV (.csv)
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Drag and Drop Upload Area */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
                  isDragging
                    ? "border-gold-500 bg-gold-50/50 dark:bg-gold-950/30 scale-[1.01]"
                    : file
                    ? "border-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20"
                    : "border-gray-300 dark:border-white/[0.15] hover:border-gold-400 dark:hover:border-gold-500 bg-gray-50/50 dark:bg-[#13192B]/50 hover:bg-gray-50 dark:hover:bg-[#161F36]"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                  className="hidden"
                />

                {isParsing ? (
                  <div className="flex flex-col items-center justify-center space-y-2 py-4">
                    <Loader2 className="w-8 h-8 text-gold-600 animate-spin" />
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Analyzing spreadsheet data...</p>
                  </div>
                ) : file ? (
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
                      <FileSpreadsheet className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{file.name}</p>
                    {(() => {
                      const parentCount = parsedRows.filter(r => !(r.parentSku || r.ParentSKU || r.parent_sku || r['Parent SKU'] || '').toString().trim() && (r.title || r.Title || '')).length;
                      const variantCount = parsedRows.filter(r => !!(r.parentSku || r.ParentSKU || r.parent_sku || r['Parent SKU'] || '').toString().trim()).length;
                      return (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {(file.size / 1024).toFixed(1)} KB • <span className="font-bold text-emerald-600 dark:text-emerald-400">{parsedRows.length} rows detected</span>
                          {variantCount > 0 && (
                            <span className="ml-1 text-gray-400 dark:text-gray-500">
                              ({parentCount} products, {variantCount} variants)
                            </span>
                          )}
                        </p>
                      );
                    })()}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReset();
                      }}
                      className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 underline mt-1"
                    >
                      Remove & choose another file
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-[#1A2238] text-gray-600 dark:text-gray-300 flex items-center justify-center shadow-xs">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-gray-800 dark:text-white">
                      Click to upload or drag & drop spreadsheet
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Supports Excel (<code className="text-gray-700 dark:text-gray-300">.xlsx</code>, <code className="text-gray-700 dark:text-gray-300">.xls</code>) and CSV (<code className="text-gray-700 dark:text-gray-300">.csv</code>)
                    </p>
                  </div>
                )}
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-800 font-medium">
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  {errorMessage}
                </div>
              )}

              {/* Step 3: Live Preview Table */}
              {parsedRows.length > 0 && (
                <div className="space-y-2">
                  {/* Header with summary badges */}
                  {(() => {
                    const variantRows = parsedRows.filter(r => !!(r.parentSku || r.ParentSKU || r.parent_sku || r['Parent SKU'] || '').toString().trim());
                    const parentRows = parsedRows.filter(r => {
                      const pSku = (r.parentSku || r.ParentSKU || r.parent_sku || r['Parent SKU'] || '').toString().trim();
                      const sku = (r.sku || r.SKU || '').toString().trim();
                      return !pSku && variantRows.some(v => (v.parentSku || v.ParentSKU || v.parent_sku || v['Parent SKU'] || '').toString().trim() === sku);
                    });
                    const simpleRows = parsedRows.filter(r => {
                      const pSku = (r.parentSku || r.ParentSKU || r.parent_sku || r['Parent SKU'] || '').toString().trim();
                      const sku = (r.sku || r.SKU || '').toString().trim();
                      return !pSku && !variantRows.some(v => (v.parentSku || v.ParentSKU || v.parent_sku || v['Parent SKU'] || '').toString().trim() === sku);
                    });
                    return (
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-600 flex items-center gap-2">
                          <Layers className="w-3.5 h-3.5 text-gold-600" />
                          Previewing {parsedRows.length} Rows
                        </h4>
                        <div className="flex items-center gap-2 flex-wrap">
                          {parentRows.length > 0 && (
                            <span className="inline-flex items-center gap-1 text-2xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Package className="w-3 h-3" /> {parentRows.length} Parent{parentRows.length > 1 ? 's' : ''}
                            </span>
                          )}
                          {variantRows.length > 0 && (
                            <span className="inline-flex items-center gap-1 text-2xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                              <GitBranch className="w-3 h-3" /> {variantRows.length} Variant{variantRows.length > 1 ? 's' : ''}
                            </span>
                          )}
                          {simpleRows.length > 0 && (
                            <span className="inline-flex items-center gap-1 text-2xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                              {simpleRows.length} Simple
                            </span>
                          )}
                          <span className="text-2xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                            Ready to Sync
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="border border-gray-200 dark:border-white/[0.08] rounded-xl overflow-hidden shadow-2xs">
                    <div className="max-h-72 overflow-x-auto overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-100/80 dark:bg-[#13192B] text-gray-700 dark:text-gray-300 font-bold border-b border-gray-200 dark:border-white/[0.08] sticky top-0 z-10">
                          <tr>
                            <th className="px-3 py-2 w-8">#</th>
                            <th className="px-3 py-2 w-16">Type</th>
                            <th className="px-3 py-2">Title</th>
                            <th className="px-3 py-2">SKU</th>
                            <th className="px-3 py-2">Brand</th>
                            <th className="px-3 py-2">Weight</th>
                            <th className="px-3 py-2">Price</th>
                            <th className="px-3 py-2">Stock</th>
                            <th className="px-3 py-2">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/[0.06] bg-white dark:bg-[#0D121F]">
                          {parsedRows.map((row, idx) => {
                            const parentSku = (row.parentSku || row.ParentSKU || row.parent_sku || row['Parent SKU'] || '').toString().trim();
                            const sku = (row.sku || row.SKU || '').toString().trim();
                            const isVariant = !!parentSku;
                            const isParent = !parentSku && parsedRows.some(r => {
                              const rParent = (r.parentSku || r.ParentSKU || r.parent_sku || r['Parent SKU'] || '').toString().trim();
                              return rParent === sku && rParent !== '';
                            });
                            const title = (row.title || row.Title || '').toString().trim();
                            const weight = (row.weight || row.Weight || row['Weight / Size'] || '').toString().trim();

                            return (
                              <tr
                                key={idx}
                                className={`transition-colors ${
                                  isParent
                                    ? 'bg-emerald-50/40 dark:bg-emerald-950/30 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/50'
                                    : isVariant
                                    ? 'bg-blue-50/20 dark:bg-blue-950/30 hover:bg-blue-50/50 dark:hover:bg-blue-950/50'
                                    : 'hover:bg-gray-50/80 dark:hover:bg-[#151C2F]'
                                }`}
                              >
                                <td className="px-3 py-2 text-gray-400 dark:text-gray-500 font-mono text-2xs">{idx + 1}</td>
                                <td className="px-3 py-2">
                                  {isParent ? (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-2xs font-extrabold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                                      <Package className="w-2.5 h-2.5" /> Parent
                                    </span>
                                  ) : isVariant ? (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-2xs font-extrabold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                                      <GitBranch className="w-2.5 h-2.5" /> Variant
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-2xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/[0.08]">
                                      Simple
                                    </span>
                                  )}
                                </td>
                                <td className="px-3 py-2 max-w-[200px]" title={title}>
                                  <div className={`flex items-center gap-1.5 ${isVariant ? 'pl-3' : ''}`}>
                                    {isVariant && (
                                      <span className="text-blue-300 dark:text-blue-400 flex-shrink-0">└</span>
                                    )}
                                    <span className={`truncate ${
                                      isParent
                                        ? 'font-extrabold text-emerald-900 dark:text-emerald-300'
                                        : isVariant
                                        ? 'font-medium text-gray-700 dark:text-gray-200'
                                        : 'font-semibold text-gray-900 dark:text-white'
                                    }`}>
                                      {title || <span className="text-rose-500 font-bold">Missing Title</span>}
                                    </span>
                                  </div>
                                  {isVariant && (
                                    <div className="flex items-center gap-1 mt-0.5 pl-3">
                                      <Link2 className="w-2.5 h-2.5 text-blue-400" />
                                      <span className="text-2xs text-blue-500 dark:text-blue-400 font-mono">{parentSku}</span>
                                    </div>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-gray-600 dark:text-gray-400 font-mono text-2xs">
                                  {sku || <span className="text-gray-400 dark:text-gray-500 italic">Auto-gen</span>}
                                </td>
                                <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{row.brand || row.Brand || row.brandName || '—'}</td>
                                <td className="px-3 py-2 text-gray-600 dark:text-gray-400 text-2xs">
                                  {weight ? (
                                    <span className="bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold px-1.5 py-0.5 rounded border border-purple-100 dark:border-purple-800/60">{weight}</span>
                                  ) : '—'}
                                </td>
                                <td className="px-3 py-2 font-bold text-gray-900 dark:text-white">
                                  ₹{row.unitPrice || row.UnitPrice || row.price || 0}
                                </td>
                                <td className="px-3 py-2 font-semibold text-gray-800 dark:text-gray-200">
                                  {row.stock || row.Stock || row.quantity || 0}
                                </td>
                                <td className="px-3 py-2">
                                  <span className="inline-flex px-1.5 py-0.5 rounded text-2xs font-extrabold uppercase bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                                    {row.status || row.Status || 'ACTIVE'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-white/[0.08] bg-gray-50 dark:bg-[#0F1424]">
          {uploadResult ? (
            <div className="flex items-center justify-between w-full">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-gray-700 dark:text-gray-200 bg-white dark:bg-[#1A2238] border border-gray-300 dark:border-white/[0.12] rounded-xl hover:bg-gray-100 dark:hover:bg-[#222C46] transition-all cursor-pointer shadow-2xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Upload Another File
              </button>
              <button
                type="button"
                onClick={handleFinish}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-gold-600 hover:bg-gold-700 rounded-xl transition-all cursor-pointer shadow-md"
              >
                Done & Refresh Catalog
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-end w-full gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isUploading}
                className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/[0.06] rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUploadSubmit}
                disabled={!file || parsedRows.length === 0 || isUploading}
                className={`inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white rounded-xl shadow-md transition-all ${
                  !file || parsedRows.length === 0 || isUploading
                    ? "bg-gray-300 dark:bg-gray-800 cursor-not-allowed text-gray-500 dark:text-gray-500 shadow-none border border-transparent dark:border-white/[0.06]"
                    : "bg-gold-600 hover:bg-gold-700 active:scale-98 cursor-pointer"
                }`}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Importing {parsedRows.length} Rows...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Import {parsedRows.length > 0 ? (() => {
                      const varCount = parsedRows.filter(r => !!(r.parentSku || r.ParentSKU || r.parent_sku || r['Parent SKU'] || '').toString().trim()).length;
                      const prodCount = parsedRows.length - varCount;
                      return varCount > 0 ? `${prodCount} Products + ${varCount} Variants` : `${parsedRows.length} Products`;
                    })() : "Products"}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
