"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { whatsappAPI, WhatsAppStatusResponse } from "@/lib/api/whatsapp";
import { useToast } from "@/context/ToastContext";
import { 
  Smartphone, 
  QrCode, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Send, 
  LogOut, 
  ShieldCheck, 
  Bell, 
  Package, 
  Truck, 
  CheckCheck, 
  Info,
  Loader2,
  PhoneCall,
  Activity,
  Zap
} from "lucide-react";

export default function WhatsAppIntegrationPage() {
  const { showToast } = useToast();
  const [statusData, setStatusData] = useState<WhatsAppStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshingQR, setIsRefreshingQR] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  
  // Test Message State
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("");
  const [isSendingTest, setIsSendingTest] = useState(false);

  // Polling interval reference
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStatus = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await whatsappAPI.getStatus();
      if (res.success && res.data) {
        setStatusData(res.data);
      }
    } catch (err: any) {
      if (!silent) {
        showToast(err.response?.data?.message || "Failed to load WhatsApp status", "error");
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [showToast]);

  const handleRefreshQR = async () => {
    setIsRefreshingQR(true);
    try {
      const res = await whatsappAPI.getQR();
      if (res.success && res.data) {
        setStatusData(res.data);
        showToast("QR code refreshed", "success");
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to refresh QR", "error");
    } finally {
      setIsRefreshingQR(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm("Are you sure you want to disconnect this WhatsApp session? Automated notifications will pause until a new account is paired.")) {
      return;
    }

    setIsDisconnecting(true);
    try {
      const res = await whatsappAPI.disconnect();
      if (res.success) {
        showToast("WhatsApp session disconnected successfully", "success");
        fetchStatus();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to disconnect WhatsApp", "error");
    } finally {
      setIsDisconnecting(false);
    }
  };

  const [isTogglingAutomation, setIsTogglingAutomation] = useState(false);

  const handleToggleAutomation = async () => {
    const nextState = !(statusData?.isAutomationEnabled ?? true);
    setIsTogglingAutomation(true);
    try {
      const res = await whatsappAPI.toggleAutomation(nextState);
      if (res.success) {
        setStatusData(prev => prev ? ({ ...prev, isAutomationEnabled: nextState }) : null);
        showToast(nextState ? "Automated WhatsApp notifications enabled" : "Automated WhatsApp notifications paused", "success");
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to update automation toggle", "error");
    } finally {
      setIsTogglingAutomation(false);
    }
  };

  const handleSendTestMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone.trim()) {
      showToast("Please enter a destination phone number", "error");
      return;
    }

    setIsSendingTest(true);
    try {
      const res = await whatsappAPI.sendTestMessage(testPhone.trim(), testMessage.trim() || undefined);
      if (res.success) {
        showToast(`Test message sent to ${testPhone}!`, "success");
        setTestMessage("");
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || "Failed to send WhatsApp message", "error");
    } finally {
      setIsSendingTest(false);
    }
  };

  // Initial load and continuous polling
  useEffect(() => {
    fetchStatus();

    // Poll every 4 seconds when in SCAN_QR or CONNECTING mode
    pollTimerRef.current = setInterval(() => {
      fetchStatus(true);
    }, 4000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [fetchStatus]);

  const isConnected = statusData?.status === "CONNECTED";
  const isScanQR = statusData?.status === "SCAN_QR" || (statusData?.qrCode && !isConnected);
  const isAutomationActive = statusData?.isAutomationEnabled ?? true;

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-500 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <span>Communications</span>
            <span>›</span>
            <span className="text-gray-900 font-semibold">WhatsApp Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-brandDark font-serif-luxury tracking-tight flex items-center gap-3">
            <span className="p-2 bg-emerald-500 text-white rounded-2xl shadow-sm">
              <Smartphone className="h-6 w-6" />
            </span>
            Direct WhatsApp Integration
          </h1>
          <p className="mt-1 text-sm font-medium text-gray-500">
            Pair your WhatsApp account via QR scan for automated, 100% free customer order notifications without Meta APIs.
          </p>
        </div>

        {/* Global Connection Status Badge */}
        <div className="flex items-center gap-3">
          <div className={`px-4 py-2 rounded-2xl flex items-center gap-2.5 border text-sm font-bold shadow-2xs ${
            isConnected
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : isScanQR
              ? "bg-amber-50 text-amber-800 border-amber-200 animate-pulse"
              : "bg-gray-100 text-gray-700 border-gray-200"
          }`}>
            <span className={`h-2.5 w-2.5 rounded-full ${isConnected ? "bg-emerald-500" : isScanQR ? "bg-amber-500" : "bg-gray-400"}`} />
            {isConnected ? "Engine Active (Connected)" : isScanQR ? "Waiting for QR Scan" : "Engine Standby"}
          </div>

          <button
            onClick={() => fetchStatus(false)}
            disabled={isLoading}
            className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors shadow-2xs"
            title="Refresh Status"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin text-gold-600" : ""}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: QR Scanner or Connected State Card */}
        <div className="lg:col-span-2 space-y-6">
          {isConnected ? (
            /* CONNECTED ACTIVE STATE CARD */
            <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm p-6 sm:p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50/50 rounded-full blur-3xl -z-0 pointer-events-none" />

              <div className="relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                      <CheckCheck className="h-8 w-8" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-black text-gray-900">WhatsApp Multi-Device Active</h2>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs uppercase tracking-wider">
                          Ready
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Messages are automatically routed through this phone number.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleToggleAutomation}
                      disabled={isTogglingAutomation}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 border ${
                        isAutomationActive
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                          : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                      }`}
                      title="Toggle Automated Order Notifications"
                    >
                      {isTogglingAutomation ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Zap className="h-4 w-4" />
                      )}
                      {isAutomationActive ? "Notifications: Active" : "Notifications: Paused"}
                    </button>

                    <button
                      onClick={handleDisconnect}
                      disabled={isDisconnecting}
                      className="px-4 py-2.5 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 rounded-xl text-xs font-bold transition-colors flex items-center gap-2"
                    >
                      {isDisconnecting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <LogOut className="h-4 w-4" />
                      )}
                      Disconnect
                    </button>
                  </div>
                </div>

                {/* Account Details Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Paired Number</span>
                    <p className="text-base font-black text-gray-900 mt-1 font-mono">
                      {statusData?.connectedUser?.phone || "Connected Device"}
                    </p>
                    <span className="text-[10px] text-emerald-600 font-bold">Verified Direct Session</span>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Device Profile</span>
                    <p className="text-base font-black text-gray-900 mt-1 truncate">
                      {statusData?.connectedUser?.name || "Store Admin"}
                    </p>
                    <span className="text-[10px] text-gray-500 font-medium">WhatsApp Multi-Device</span>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Connected Since</span>
                    <p className="text-base font-black text-gray-900 mt-1">
                      {statusData?.lastConnectedAt ? new Date(statusData.lastConnectedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Active"}
                    </p>
                    <span className="text-[10px] text-emerald-600 font-bold">Auto-reconnect enabled</span>
                  </div>
                </div>

                {/* Test Message Form */}
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Send className="h-4 w-4 text-emerald-600" /> Send Test WhatsApp Message
                  </h3>
                  <p className="text-xs text-gray-500 mb-4">
                    Send a direct test verification message to ensure end-to-end delivery.
                  </p>

                  <form onSubmit={handleSendTestMessage} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">Destination Mobile Number *</label>
                        <input
                          type="text"
                          placeholder="e.g. +91 9876543210 or 9876543210"
                          value={testPhone}
                          onChange={(e) => setTestPhone(e.target.value)}
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">Custom Test Note (Optional)</label>
                        <input
                          type="text"
                          placeholder="Leave empty for default system check"
                          value={testMessage}
                          onChange={(e) => setTestMessage(e.target.value)}
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSendingTest}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2"
                    >
                      {isSendingTest ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Dispatch Test Message
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ) : (
            /* QR CODE PAIRING SCANNER CARD */
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
              <div className="flex flex-col md:flex-row items-center gap-8">
                {/* QR Code Graphic Box */}
                <div className="flex flex-col items-center">
                  <div className="p-4 bg-white rounded-2xl border-2 border-emerald-500/30 shadow-lg shadow-emerald-500/5 relative">
                    {statusData?.qrCode ? (
                      <div className="relative group">
                        <img
                          src={statusData.qrCode}
                          alt="WhatsApp Pairing QR Code"
                          className="w-64 h-64 rounded-xl object-contain"
                        />
                        <div className="absolute inset-0 border-2 border-emerald-500 rounded-xl pointer-events-none opacity-40 animate-pulse" />
                      </div>
                    ) : (
                      <div className="w-64 h-64 rounded-xl bg-gray-50 flex flex-col items-center justify-center text-center p-6">
                        <Loader2 className="h-10 w-10 text-emerald-500 animate-spin mb-3" />
                        <p className="text-xs font-bold text-gray-700">Generating WhatsApp QR...</p>
                        <p className="text-[11px] text-gray-400 mt-1">Starting multi-device socket</p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleRefreshQR}
                    disabled={isRefreshingQR}
                    className="mt-4 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-emerald-200"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isRefreshingQR ? "animate-spin" : ""}`} />
                    Regenerate QR Code
                  </button>
                </div>

                {/* Step-by-Step Pairing Instructions */}
                <div className="flex-1 space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider border border-emerald-200">
                    <QrCode className="h-3.5 w-3.5" /> Fast Pairing
                  </div>
                  <h2 className="text-2xl font-black text-gray-900">Scan QR Code with WhatsApp</h2>
                  <p className="text-sm text-gray-600">
                    Link your store's WhatsApp account directly so notifications dispatch in real-time.
                  </p>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                      <span className="h-6 w-6 rounded-full bg-emerald-500 text-white font-black text-xs flex items-center justify-center shrink-0">
                        1
                      </span>
                      <p className="text-xs font-bold text-gray-800 mt-0.5">
                        Open <strong>WhatsApp</strong> on your mobile phone.
                      </p>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                      <span className="h-6 w-6 rounded-full bg-emerald-500 text-white font-black text-xs flex items-center justify-center shrink-0">
                        2
                      </span>
                      <p className="text-xs font-bold text-gray-800 mt-0.5">
                        Tap <strong>Menu (⋮)</strong> on Android or <strong>Settings (⚙️)</strong> on iPhone.
                      </p>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                      <span className="h-6 w-6 rounded-full bg-emerald-500 text-white font-black text-xs flex items-center justify-center shrink-0">
                        3
                      </span>
                      <p className="text-xs font-bold text-gray-800 mt-0.5">
                        Tap <strong>Linked Devices</strong> and then tap <strong>Link a Device</strong>.
                      </p>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                      <span className="h-6 w-6 rounded-full bg-emerald-500 text-white font-black text-xs flex items-center justify-center shrink-0">
                        4
                      </span>
                      <p className="text-xs font-bold text-gray-800 mt-0.5">
                        Point your camera at the QR code on the left to complete pairing.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Automated Trigger Channels & Features */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Zap className="h-4 w-4 text-gold-600" /> Automated Triggers
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              When paired, the following events automatically send WhatsApp messages to customers who opted-in:
            </p>

            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Package className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">Order Confirmation</p>
                  <p className="text-[10px] text-gray-500">Order summary, invoice & items</p>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Truck className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">Dispatch & Tracking</p>
                  <p className="text-[10px] text-gray-500">Tracking ID & live status updates</p>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-3">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">Delivery Confirmation</p>
                  <p className="text-[10px] text-gray-500">Review requests & thank you note</p>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-3">
                <div className="p-2 bg-gold-50 text-gold-600 rounded-xl">
                  <Bell className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">Admin Broadcasts</p>
                  <p className="text-[10px] text-gray-500">Exclusive promotions & flash sales</p>
                </div>
              </div>
            </div>
          </div>


        </div>
      </div>
    </div>
  );
}
