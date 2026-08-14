"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/api";
import { 
  User, 
  Lock, 
  Save, 
  Loader2, 
  ShieldCheck, 
  Mail, 
  Building, 
  AtSign, 
  Globe, 
  Video, 
  Share2, 
  CheckCircle2, 
  AlertCircle,
  Phone,
  FileText,
  ArrowLeft
} from "lucide-react";

// Schemas
const generalSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  profileImage: z.string().optional().or(z.literal("")),
});

const businessSchema = z.object({
  brandName: z.string().min(2, "Brand name is required"),
  address: z.string().min(5, "Address is required"),
  gstNumber: z.string().min(5, "GST number is required"),
  supportEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  supportPhone: z.string().optional().or(z.literal("")),
});

const socialSchema = z.object({
  instagramUrl: z.string().url("Enter a valid Instagram URL").optional().or(z.literal("")),
  facebookUrl: z.string().url("Enter a valid Facebook URL").optional().or(z.literal("")),
  youtubeUrl: z.string().url("Enter a valid YouTube URL").optional().or(z.literal("")),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type GeneralFormValues = z.infer<typeof generalSchema>;
type BusinessFormValues = z.infer<typeof businessSchema>;
type SocialFormValues = z.infer<typeof socialSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  
  // Avatar Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState("");
  
  // General Form State
  const [isSavingGeneral, setIsSavingGeneral] = useState(false);
  const [generalSuccess, setGeneralSuccess] = useState("");
  const [generalError, setGeneralError] = useState("");

  // Business Form State
  const [isSavingBusiness, setIsSavingBusiness] = useState(false);
  const [businessSuccess, setBusinessSuccess] = useState("");
  const [businessError, setBusinessError] = useState("");

  // Social Form State
  const [isSavingSocial, setIsSavingSocial] = useState(false);
  const [socialSuccess, setSocialSuccess] = useState("");
  const [socialError, setSocialError] = useState("");

  // Password Form State
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const generalForm = useForm<GeneralFormValues>({
    resolver: zodResolver(generalSchema),
  });

  const businessForm = useForm<BusinessFormValues>({
    resolver: zodResolver(businessSchema),
  });

  const socialForm = useForm<SocialFormValues>({
    resolver: zodResolver(socialSchema),
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [res, bizRes] = await Promise.all([
          api.get("/users/me"),
          api.get("/business-config").catch(() => null)
        ]);
        
        const user = res.data.data;
        generalForm.reset({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          profileImage: user.profileImage || "",
        });
        if (user.profileImage) {
          setAvatarPreview(user.profileImage);
        }

        if (bizRes?.data?.data) {
          const biz = bizRes.data.data;
          businessForm.reset({
            brandName: biz.brandName || "",
            address: biz.address || "",
            gstNumber: biz.gstNumber || "",
            supportEmail: biz.supportEmail || "",
            supportPhone: biz.supportPhone || "",
          });
          socialForm.reset({
            instagramUrl: biz.instagramUrl || "",
            facebookUrl: biz.facebookUrl || "",
            youtubeUrl: biz.youtubeUrl || "",
          });
        }
      } catch (error) {
        setGeneralError("Failed to load data");
      } finally {
        setIsLoadingUser(false);
      }
    };
    fetchData();
  }, [generalForm, businessForm, socialForm]);

  const onGeneralSubmit = async (data: GeneralFormValues) => {
    setIsSavingGeneral(true);
    setGeneralSuccess("");
    setGeneralError("");
    try {
      await api.patch("/users/me", data);
      setGeneralSuccess("Profile updated successfully!");
      setTimeout(() => window.location.reload(), 1500);
    } catch (error: any) {
      const errData = error.response?.data;
      if (errData?.errors && Array.isArray(errData.errors)) {
        setGeneralError(errData.errors.map((e: any) => e.message).join(", "));
      } else {
        setGeneralError(errData?.message || "Failed to update profile");
      }
    } finally {
      setIsSavingGeneral(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setGeneralError("");
    setGeneralSuccess("");

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      const fileUrl = res.data.url;
      setAvatarPreview(fileUrl);
      generalForm.setValue("profileImage", fileUrl);
      setGeneralSuccess("Image uploaded successfully! Click 'Save Changes' to update your profile.");
    } catch (error: any) {
      setGeneralError(error.response?.data?.message || "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const onBusinessSubmit = async (data: BusinessFormValues) => {
    setIsSavingBusiness(true);
    setBusinessSuccess("");
    setBusinessError("");
    try {
      await api.put("/business-config", data);
      setBusinessSuccess("Business details updated successfully!");
      setTimeout(() => setBusinessSuccess(""), 4000);
    } catch (error: any) {
      setBusinessError(error.response?.data?.message || "Failed to update business configuration");
    } finally {
      setIsSavingBusiness(false);
    }
  };

  const onSocialSubmit = async (data: SocialFormValues) => {
    setIsSavingSocial(true);
    setSocialSuccess("");
    setSocialError("");
    try {
      await api.put("/business-config", data);
      setSocialSuccess("Social accounts updated successfully!");
      setTimeout(() => setSocialSuccess(""), 4000);
    } catch (error: any) {
      setSocialError(error.response?.data?.message || "Failed to update social accounts");
    } finally {
      setIsSavingSocial(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormValues) => {
    setIsSavingPassword(true);
    setPasswordSuccess("");
    setPasswordError("");
    try {
      await api.patch("/users/me/password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      setPasswordSuccess("Password changed successfully!");
      passwordForm.reset();
      setTimeout(() => setPasswordSuccess(""), 4000);
    } catch (error: any) {
      setPasswordError(error.response?.data?.message || "Failed to change password");
    } finally {
      setIsSavingPassword(false);
    }
  };

  if (isLoadingUser) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
      </div>
    );
  }

  const getMediaUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("/uploads")) {
      const backendBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");
      return `${backendBase}${url}`;
    }
    return url;
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-6xl mx-auto pb-12">
      {/* Page Header with Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3.5">
          <Link
            href="/"
            className="p-2.5 rounded-2xl bg-white border border-gray-200 shadow-xs hover:border-gold-400 hover:bg-gold-50/40 text-gray-600 hover:text-gold-700 transition-all flex items-center justify-center shrink-0 group"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform text-gray-700" />
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold text-brandDark font-serif-luxury tracking-tight">Admin Profile & Settings</h1>
            <p className="mt-1 text-sm font-medium text-gray-500">
              Manage your personal administrator profile, business settings, social channels, and security.
            </p>
          </div>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 hover:text-gray-900 shadow-xs transition-all self-start sm:self-auto"
        >
          <ArrowLeft className="w-4 h-4 text-gray-500" />
          <span>Back to Home</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-8">
          
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
              <div className="h-10 w-10 rounded-xl bg-gold-50 border border-gold-100 flex items-center justify-center text-gold-600">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">General Information</h2>
                <p className="text-xs text-gray-400">Personal admin credentials and display avatar</p>
              </div>
            </div>

            {generalSuccess && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{generalSuccess}</span>
              </div>
            )}
            {generalError && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-800 text-xs font-semibold border border-red-200 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                <span>{generalError}</span>
              </div>
            )}

            <form onSubmit={generalForm.handleSubmit(onGeneralSubmit)} className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-4 rounded-2xl bg-gray-50/70 border border-gray-100">
                <div className="relative group">
                  <div className="h-20 w-20 rounded-2xl overflow-hidden bg-white border-2 border-gold-300 shadow-sm flex items-center justify-center relative">
                    {isUploading ? (
                      <Loader2 className="h-6 w-6 animate-spin text-gold-500" />
                    ) : avatarPreview ? (
                      <img src={getMediaUrl(avatarPreview)} alt="Profile Preview" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <label className="absolute -bottom-2 -right-2 h-7 w-7 bg-gold-500 text-white rounded-xl flex items-center justify-center shadow-md cursor-pointer hover:bg-gold-600 transition-colors">
                    <User className="h-3.5 w-3.5" />
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
                <div className="text-center sm:text-left flex-1">
                  <h4 className="text-sm font-bold text-gray-900">Profile Photo</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Upload a clean square image (JPG, PNG, WebP).</p>
                  <label className="inline-block mt-2.5 px-3 py-1.5 bg-white border border-gray-200 hover:border-gold-400 text-gray-700 rounded-lg text-xs font-bold shadow-xs cursor-pointer transition-all">
                    Choose Image
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">First Name *</label>
                  <input
                    {...generalForm.register("firstName")}
                    type="text"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-gold-500/30 focus:border-gold-400 outline-none transition-all"
                  />
                  {generalForm.formState.errors.firstName && (
                    <p className="mt-1 text-xs text-red-600">{generalForm.formState.errors.firstName.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Last Name *</label>
                  <input
                    {...generalForm.register("lastName")}
                    type="text"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-gold-500/30 focus:border-gold-400 outline-none transition-all"
                  />
                  {generalForm.formState.errors.lastName && (
                    <p className="mt-1 text-xs text-red-600">{generalForm.formState.errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    {...generalForm.register("email")}
                    type="email"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-gold-500/30 focus:border-gold-400 outline-none transition-all"
                  />
                </div>
                {generalForm.formState.errors.email && (
                  <p className="mt-1 text-xs text-red-600">{generalForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSavingGeneral}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold-600 hover:bg-gold-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-gold-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSavingGeneral ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save General Info
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
              <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <Building className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Business & Store Details</h2>
                <p className="text-xs text-gray-400">Company registration, GST number, and support channels</p>
              </div>
            </div>

            {businessSuccess && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{businessSuccess}</span>
              </div>
            )}
            {businessError && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-800 text-xs font-semibold border border-red-200 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                <span>{businessError}</span>
              </div>
            )}

            <form onSubmit={businessForm.handleSubmit(onBusinessSubmit)} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Brand / Company Name *</label>
                  <input
                    {...businessForm.register("brandName")}
                    type="text"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-gold-500/30 focus:border-gold-400 outline-none transition-all"
                  />
                  {businessForm.formState.errors.brandName && (
                    <p className="mt-1 text-xs text-red-600">{businessForm.formState.errors.brandName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">GST Number *</label>
                  <div className="relative">
                    <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      {...businessForm.register("gstNumber")}
                      type="text"
                      placeholder="e.g. 29ABCDE1234F1Z5"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-gold-500/30 focus:border-gold-400 outline-none transition-all uppercase"
                    />
                  </div>
                  {businessForm.formState.errors.gstNumber && (
                    <p className="mt-1 text-xs text-red-600">{businessForm.formState.errors.gstNumber.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Business / Registered Address *</label>
                <textarea
                  {...businessForm.register("address")}
                  rows={3}
                  placeholder="Official office or warehouse address..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-gold-500/30 focus:border-gold-400 outline-none transition-all"
                />
                {businessForm.formState.errors.address && (
                  <p className="mt-1 text-xs text-red-600">{businessForm.formState.errors.address.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Support Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      {...businessForm.register("supportEmail")}
                      type="email"
                      placeholder="support@sculptnshine.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-gold-500/30 focus:border-gold-400 outline-none transition-all"
                    />
                  </div>
                  {businessForm.formState.errors.supportEmail && (
                    <p className="mt-1 text-xs text-red-600">{businessForm.formState.errors.supportEmail.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Support Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      {...businessForm.register("supportPhone")}
                      type="tel"
                      placeholder="+91 9876543210"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-gold-500/30 focus:border-gold-400 outline-none transition-all"
                    />
                  </div>
                  {businessForm.formState.errors.supportPhone && (
                    <p className="mt-1 text-xs text-red-600">{businessForm.formState.errors.supportPhone.message}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSavingBusiness}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold-600 hover:bg-gold-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-gold-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSavingBusiness ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Business Details
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-8">
          
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
              <div className="h-10 w-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                <Share2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Social Accounts</h2>
                <p className="text-xs text-gray-400">Public profile links shown in footer and headers</p>
              </div>
            </div>

            {socialSuccess && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{socialSuccess}</span>
              </div>
            )}
            {socialError && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-800 text-xs font-semibold border border-red-200 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                <span>{socialError}</span>
              </div>
            )}

            <form onSubmit={socialForm.handleSubmit(onSocialSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <AtSign className="w-3.5 h-3.5 text-pink-600" />
                  Instagram Profile URL
                </label>
                <div className="relative">
                  <input
                    {...socialForm.register("instagramUrl")}
                    type="url"
                    placeholder="https://www.instagram.com/sculptnshine"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:ring-2 focus:ring-pink-500/30 focus:border-pink-400 outline-none transition-all bg-gray-50/50"
                  />
                </div>
                {socialForm.formState.errors.instagramUrl && (
                  <p className="mt-1 text-xs text-red-600">{socialForm.formState.errors.instagramUrl.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-blue-600" />
                  Facebook Page URL
                </label>
                <div className="relative">
                  <input
                    {...socialForm.register("facebookUrl")}
                    type="url"
                    placeholder="https://www.facebook.com/sculptnshine"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none transition-all bg-gray-50/50"
                  />
                </div>
                {socialForm.formState.errors.facebookUrl && (
                  <p className="mt-1 text-xs text-red-600">{socialForm.formState.errors.facebookUrl.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-red-600" />
                  YouTube Channel URL
                </label>
                <div className="relative">
                  <input
                    {...socialForm.register("youtubeUrl")}
                    type="url"
                    placeholder="https://www.youtube.com/@sculptnshine"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:ring-2 focus:ring-red-500/30 focus:border-red-400 outline-none transition-all bg-gray-50/50"
                  />
                </div>
                {socialForm.formState.errors.youtubeUrl && (
                  <p className="mt-1 text-xs text-red-600">{socialForm.formState.errors.youtubeUrl.message}</p>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingSocial}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gold-600 hover:bg-gold-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-gold-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSavingSocial ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Social Accounts
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Change Password</h2>
                <p className="text-xs text-gray-400">Update your account login password</p>
              </div>
            </div>

            {passwordSuccess && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}
            {passwordError && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-800 text-xs font-semibold border border-red-200 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Current Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    {...passwordForm.register("currentPassword")}
                    type="password"
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-gold-500/30 focus:border-gold-400 outline-none transition-all"
                  />
                </div>
                {passwordForm.formState.errors.currentPassword && (
                  <p className="mt-1 text-xs text-red-600">{passwordForm.formState.errors.currentPassword.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    {...passwordForm.register("newPassword")}
                    type="password"
                    placeholder="Min. 8 characters"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-gold-500/30 focus:border-gold-400 outline-none transition-all"
                  />
                </div>
                {passwordForm.formState.errors.newPassword && (
                  <p className="mt-1 text-xs text-red-600">{passwordForm.formState.errors.newPassword.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    {...passwordForm.register("confirmPassword")}
                    type="password"
                    placeholder="Re-enter new password"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-gold-500/30 focus:border-gold-400 outline-none transition-all"
                  />
                </div>
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-600">{passwordForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingPassword}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gold-600 hover:bg-gold-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-gold-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSavingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                  Update Password
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
