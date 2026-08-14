"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";

export default function AddNewUserPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "USER", // "USER" | "ADMIN"
    password: "",
    confirmPassword: "",
    status: "ACTIVE"
  });

  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Split full name into first and last name
    const parts = e.target.value.trim().split(" ");
    const firstName = parts[0] || "";
    const lastName = parts.slice(1).join(" ") || "";
    setFormData({ ...formData, firstName, lastName });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!formData.firstName) {
      setError("Please enter a full name");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/users", {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone || undefined,
        role: formData.role,
        password: formData.password,
        status: formData.status
      });
      router.push("/users");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create user");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/users" className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/users" className="hover:text-gold-600">User Management</Link>
            <span>›</span>
            <span className="text-gray-900 font-semibold">Add New User</span>
          </div>
          <h1 className="text-3xl font-extrabold text-brandDark font-serif-luxury tracking-tight">Add New User</h1>
          <p className="mt-1 text-sm font-medium text-gray-500">
            Create a new user account with appropriate role and permissions.
          </p>
        </div>
      </div>

      <div className="max-w-3xl">
        {/* Main Form */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-6">User Information</h2>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-semibold rounded-xl border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Full Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="Enter full name"
                  required
                  onChange={handleNameChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none transition-all"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Email Address <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter email address"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none transition-all"
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none transition-all"
                />
              </div>

              {/* Role */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Role <span className="text-red-500">*</span></label>
                <select
                  name="role"
                  required
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none transition-all bg-white"
                >
                  <option value="USER">Customer</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Enter password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-4 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Confirm Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Confirm password"
                    required
                    minLength={6}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full pl-4 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Status Toggle */}
            <div className="flex items-center justify-between pt-4 pb-6 border-b border-gray-100">
              <div>
                <p className="text-sm font-bold text-gray-900">Status</p>
                <p className="text-xs text-gray-500 mt-1">Set the user's initial account status</p>
              </div>
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

            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => router.push('/users')}
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
                  "Create User"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
