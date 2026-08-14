"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import Pagination from "@/components/Pagination";
import {
  Bell,
  Send,
  Loader2,
  Plus,
  Search,
  Tag,
  ExternalLink,
  Clock,
  X,
} from "lucide-react";

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
];

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function NotificationsPage() {
  const { showToast } = useToast();

  // Broadcast form modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Table data
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    fetchBroadcasts();
  }, []);

  const fetchBroadcasts = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/notifications/admin/all");
      if (res.data.success) {
        setBroadcasts(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to load broadcasts", err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredBroadcasts = broadcasts.filter((b) => {
    if (!debouncedSearch) return true;
    const q = debouncedSearch.toLowerCase();
    return (
      b.title?.toLowerCase().includes(q) ||
      b.message?.toLowerCase().includes(q)
    );
  });
  const totalPages = Math.max(1, Math.ceil(filteredBroadcasts.length / limit));
  const currentPage = Math.min(page, totalPages);
  const paginatedBroadcasts = filteredBroadcasts.slice(
    (currentPage - 1) * limit,
    currentPage * limit
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !message.trim()) {
      showToast("Title and message are required", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        message: message.trim(),
        link: link.trim() || undefined,
        stateFilter: stateFilter || undefined,
      };

      const res = await api.post("/notifications/admin/broadcast", payload);

      if (res.data.success) {
        showToast("Broadcast notification enqueued successfully!", "success");
        setTitle("");
        setMessage("");
        setLink("");
        setStateFilter("");
        setIsModalOpen(false);
        fetchBroadcasts();
      } else {
        showToast(res.data.message || "Failed to broadcast notification", "error");
      }
    } catch (err: any) {
      console.error(err);
      showToast(
        err.response?.data?.message || "Something went wrong while broadcasting.",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setMessage("");
    setLink("");
    setStateFilter("");
    setIsModalOpen(false);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gold-100 text-gold-600 rounded-2xl border border-gold-200">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-sm text-gray-500">
              Send and manage broadcast notifications for your customers.
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-gold-400 to-gold-500 text-white font-bold rounded-xl text-sm hover:from-gold-500 hover:to-gold-600 transition-all shadow-lg shadow-gold-500/10"
        >
          <Plus className="h-4 w-4" /> New Broadcast
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Broadcasts</p>
            <h3 className="text-2xl font-black text-gray-900">{broadcasts.length}</h3>
          </div>
          <div className="h-12 w-12 rounded-xl bg-gold-50 flex items-center justify-center border border-gold-100">
            <Send className="h-6 w-6 text-gold-600" />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Promos Sent</p>
            <h3 className="text-2xl font-black text-emerald-600">
              {broadcasts.filter((b) => b.type === "PROMO").length}
            </h3>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
            <Tag className="h-6 w-6 text-emerald-600" />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Latest Sent</p>
            <h3 className="text-sm font-bold text-gray-700">
              {broadcasts.length > 0
                ? formatDate(broadcasts[0].createdAt)
                : "No broadcasts yet"}
            </h3>
          </div>
          <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100">
            <Clock className="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        {/* Controls Toolbar */}
        <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-col lg:flex-row items-center justify-between gap-4">
          <h3 className="text-base font-bold text-gray-900">Sent Notifications</h3>
          <div className="relative flex-1 lg:w-72 lg:flex-initial">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title or message..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-gold-500 animate-spin" />
          </div>
        ) : filteredBroadcasts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="h-16 w-16 mx-auto bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Bell className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">No notifications found</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
              Start by sending your first broadcast notification to your customers.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gold-500 text-white font-bold rounded-xl text-sm hover:bg-gold-600 transition-colors"
            >
              <Plus className="h-4 w-4" /> Send First Broadcast
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50/60 text-gray-500 font-semibold border-b border-gray-100">
                <tr>
                  <th className="p-4 pl-6">Title</th>
                  <th className="p-4">Message</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Link</th>
                  <th className="p-4">Sent At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedBroadcasts.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gold-50/30 transition-colors"
                  >
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-gold-50 border border-gold-100 flex items-center justify-center flex-shrink-0">
                          <Bell className="h-4 w-4 text-gold-600" />
                        </div>
                        <p className="font-bold text-gray-900 max-w-[200px] truncate">
                          {item.title}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-gray-600 max-w-xs truncate">
                        {item.message}
                      </p>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          item.type === "PROMO"
                            ? "bg-amber-50 text-amber-600 border border-amber-100"
                            : item.type === "ORDER_UPDATE"
                            ? "bg-blue-50 text-blue-600 border border-blue-100"
                            : "bg-gray-100 text-gray-600 border border-gray-200"
                        }`}
                      >
                        {item.type}
                      </span>
                    </td>
                    <td className="p-4">
                      {item.link ? (
                        <span className="inline-flex items-center gap-1 text-xs text-gold-600 font-semibold">
                          {item.link} <ExternalLink className="h-3 w-3" />
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="text-xs text-gray-500 font-medium">
                        {formatDate(item.createdAt)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && filteredBroadcasts.length > 0 && (
          <Pagination
            page={currentPage}
            limit={limit}
            total={filteredBroadcasts.length}
            totalPages={totalPages}
            itemLabel="notifications"
            onPageChange={setPage}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1);
            }}
          />
        )}
      </div>

      {/* ─── SEND BROADCAST MODAL ─── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gold-100 text-gold-600 rounded-xl border border-gold-200">
                  <Send className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">New Broadcast</h2>
              </div>
              <button
                onClick={resetForm}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
                  Notification Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 50% OFF on Whey Protein!"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                  Notification Message *
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Compose your promotional message here..."
                  rows={4}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 outline-none transition-all resize-none"
                  required
                />
              </div>

              <div>
                <label htmlFor="link" className="block text-sm font-semibold text-gray-700 mb-2">
                  Action Redirect Link (Optional)
                </label>
                <input
                  type="text"
                  id="link"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="e.g. /category/supplements"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 outline-none transition-all"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Leave empty to open home page, or specify relative paths (e.g. /products/whey)
                </p>
              </div>

              <div>
                <label htmlFor="stateFilter" className="block text-sm font-semibold text-gray-700 mb-2">
                  Target State Filter (Optional)
                </label>
                <select
                  id="stateFilter"
                  value={stateFilter}
                  onChange={(e) => setStateFilter(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 outline-none transition-all"
                >
                  <option value="">All States (Broadcast to all users)</option>
                  {INDIAN_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-gray-400 mt-1">
                  Filter target audience based on their saved default delivery address.
                </p>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-gold-400 to-gold-500 hover:from-gold-500 hover:to-gold-600 text-white font-bold py-2.5 px-6 rounded-xl shadow-lg shadow-gold-500/10 hover:shadow-gold-500/20 transition-all text-sm uppercase tracking-wider disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Broadcast
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
