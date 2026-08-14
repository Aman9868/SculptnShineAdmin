"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/api";
import { Save, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import RichTextEditor from "@/components/ui/RichTextEditor";
import { useToast } from "@/context/ToastContext";

const policySchema = z.object({
  title: z.string().min(2, "Title is required"),
  type: z.string().min(2, "Type is required"),
  content: z.string().min(10, "Content is required"),
  isActive: z.boolean(),
});

type PolicyFormValues = z.infer<typeof policySchema>;

const POLICY_OPTIONS = [
  { value: "PRIVACY_POLICY", label: "Privacy Policy" },
  { value: "TERMS_AND_CONDITIONS", label: "Terms & Conditions" },
  { value: "RETURN_POLICY", label: "Return Policy" },
  { value: "SHIPPING_POLICY", label: "Shipping Policy" },
  { value: "CANCELLATION_POLICY", label: "Cancellation Policy" },
  { value: "REFUND_POLICY", label: "Refund Policy" },
  { value: "COOKIE_POLICY", label: "Cookie Policy" },
];

export default function NewPolicyPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<PolicyFormValues>({
    resolver: zodResolver(policySchema),
    defaultValues: {
      title: "",
      type: "",
      content: "",
      isActive: true,
    }
  });

  // Pre-fill title if they select a type and title is empty
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value;
    form.setValue("type", type, { shouldValidate: true });
    
    if (!form.formState.dirtyFields.title && !form.getValues("title")) {
      const selectedOption = POLICY_OPTIONS.find(opt => opt.value === type);
      if (selectedOption) {
        form.setValue("title", selectedOption.label, { shouldValidate: true });
      }
    }
  };

  const onSubmit = async (data: PolicyFormValues) => {
    setIsSaving(true);
    try {
      await api.post(`/policies`, data);
      showToast("Policy created successfully!", "success");
      router.push("/policies");
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to create policy";
      // Handle the uniqueness error nicely
      if (msg.toLowerCase().includes("already exists")) {
        form.setError("type", { type: "manual", message: "A policy of this type already exists." });
      } else {
        showToast(msg, "error");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4">
          <Link
            href="/policies"
            className="p-2 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-brandDark font-serif-luxury tracking-tight">Add New Policy</h1>
            <p className="mt-1 text-sm font-medium text-gray-500">Create a new legal or operational policy for your store.</p>
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-2xl shadow-luxury p-8">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-brandDark-soft mb-1.5">Policy Type</label>
              <select
                {...form.register("type")}
                onChange={handleTypeChange}
                className="focus:ring-gold-500 focus:border-gold-500 block w-full sm:text-sm border-gray-300 rounded-lg py-2.5 px-4 border bg-gray-50/50 shadow-inner font-medium text-gray-900 appearance-none"
              >
                <option value="" disabled>Select Policy Type</option>
                {POLICY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {form.formState.errors.type && (
                <p className="mt-1 text-xs text-red-600">{form.formState.errors.type.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-brandDark-soft mb-1.5">Policy Title</label>
              <input
                {...form.register("title")}
                placeholder="e.g. Terms and Conditions"
                className="focus:ring-gold-500 focus:border-gold-500 block w-full sm:text-sm border-gray-300 rounded-lg py-2.5 px-4 border bg-gray-50/50 shadow-inner font-medium"
              />
              {form.formState.errors.title && (
                <p className="mt-1 text-xs text-red-600">{form.formState.errors.title.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-brandDark-soft mb-1.5">Policy Content</label>
              <RichTextEditor
                value={form.watch("content")}
                onChange={(val) => form.setValue("content", val, { shouldValidate: true })}
                placeholder="Write your policy content here..."
              />
              {form.formState.errors.content && (
                <p className="mt-1 text-xs text-red-600">{form.formState.errors.content.message}</p>
              )}
            </div>

            <div className="md:col-span-2 pt-2 pb-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-100 rounded-xl">
                <input
                  type="checkbox"
                  id="isActive"
                  {...form.register("isActive")}
                  className="h-5 w-5 rounded border-gray-300 text-gold-500 focus:ring-gold-500 cursor-pointer"
                />
                <div className="flex flex-col">
                  <label htmlFor="isActive" className="text-sm font-bold text-gray-900 cursor-pointer">
                    Active / Published
                  </label>
                  <p className="text-xs text-gray-500">If unchecked, this policy will be hidden from users.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 flex justify-end gap-4">
            <Link
              href="/policies"
              className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center justify-center gap-2 rounded-lg bg-brandDark px-8 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brandDark disabled:opacity-50 transition-colors"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Create Policy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
