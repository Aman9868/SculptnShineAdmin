"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { ArrowLeft, Loader2, UploadCloud } from "lucide-react";
import Link from "next/link";

export default function AddNewCategoryPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    status: "ACTIVE",
    image: ""
  });

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData({
      ...formData,
      name,
      slug: generateSlug(name)
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.name || !formData.slug) {
      setError("Category Name and Slug are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/categories", formData);
      router.push("/product-category");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create category");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/product-category" className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/product-category" className="hover:text-gold-600">Product Categories</Link>
            <span>›</span>
            <span className="text-gray-900 font-semibold">Add New Category</span>
          </div>
          <h1 className="text-3xl font-extrabold text-brandDark font-serif-luxury tracking-tight">Add New Category</h1>
          <p className="mt-1 text-sm font-medium text-gray-500">
            Create a new product category.
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
            <div className="lg:col-span-2 space-y-6">
              {/* Category Name */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Category Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="Enter category name"
                  required
                  value={formData.name}
                  onChange={handleNameChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none transition-all"
                />
                <p className="text-xs text-gray-500">e.g. Protein Powders, Fitness Gear, Supplements</p>
              </div>

              {/* Slug */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Slug <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="slug"
                  placeholder="Enter slug (auto-generated)"
                  required
                  value={formData.slug}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none transition-all"
                />
                <p className="text-xs text-gray-500">URL friendly unique identifier (e.g. protein-powders)</p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Description</label>
                <textarea
                  name="description"
                  placeholder="Enter category description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none transition-all resize-none"
                />
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-500">Provide a brief overview of what this category contains.</p>
                  <p className="text-xs text-gray-500 text-right">{formData.description.length}/255</p>
                </div>
              </div>

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

            {/* Right Column: Image Upload */}
            <div className="lg:col-span-1 space-y-2">
              <label className="text-sm font-semibold text-gray-700">Category Image</label>
              <div className="w-full h-48 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group">
                <div className="p-3 bg-white rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                  <UploadCloud className="h-6 w-6 text-gray-500" />
                </div>
                <p className="text-sm font-semibold text-gray-700">Upload Image</p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 2MB</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-8 mt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={() => router.push('/product-category')}
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
                "Create Category"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
