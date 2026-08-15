"use client";

import { useEffect, useState } from "react";
import { Mail, Settings as SettingsIcon, Save, RefreshCw, Zap, CheckCheck, Loader2, Send } from "lucide-react";
import { emailApi } from "@/lib/api/email";
import { useToast } from "@/context/ToastContext";

export default function EmailEnginePage() {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testEmail, setTestEmail] = useState("");

  const [config, setConfig] = useState({
    host: "smtp.hostinger.com",
    port: 465,
    secure: true,
    user: "",
    password: "",
    fromName: "Sculpt & Shine",
    fromEmail: "",
    isEnabled: false,
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setIsLoading(true);
      const res = await emailApi.getConfig();
      if (res.data) {
        setConfig((prev) => ({
          ...prev,
          ...res.data,
          password: "", // Never display password
        }));
      }
    } catch (err) {
      showToast("Failed to load email configuration", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAutomation = async () => {
    try {
      const newEnabledState = !config.isEnabled;
      setConfig((prev) => ({ ...prev, isEnabled: newEnabledState }));
      
      await emailApi.updateConfig({
        ...config,
        isEnabled: newEnabledState,
      });
      
      showToast(newEnabledState ? "Email Automation Enabled" : "Email Automation Paused", "success");
    } catch (err) {
      showToast("Failed to toggle automation", "error");
      setConfig((prev) => ({ ...prev, isEnabled: !prev.isEnabled })); // Revert on fail
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setIsSaving(true);
      await emailApi.updateConfig(config);
      showToast("Configuration saved successfully", "success");
    } catch (err) {
      showToast("Failed to save configuration", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!config.host || !config.user) {
      showToast("Host and Email Address are required", "error");
      return;
    }
    
    try {
      setIsTesting(true);
      const res = await emailApi.testConnection(config);
      if (res.success) {
        showToast(res.message || "Connection successful!", "success");
      } else {
        showToast(res.message || "Connection failed", "error");
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to test connection", "error");
    } finally {
      setIsTesting(false);
    }
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail) {
      showToast("Please enter an email address", "error");
      return;
    }
    
    try {
      setIsSendingTest(true);
      const res = await emailApi.sendTestEmail({ email: testEmail });
      if (res.success) {
        showToast(res.message || "Test email sent!", "success");
        setTestEmail("");
      } else {
        showToast(res.message || "Failed to send test email", "error");
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to send test email", "error");
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setConfig((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "number" ? Number(value) : value,
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="h-8 w-8 animate-spin text-gold-500" />
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-10 max-w-6xl mx-auto min-h-screen pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <span>Settings</span>
            <span>›</span>
            <span className="text-gray-900 font-semibold">Email Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-brandDark font-serif-luxury tracking-tight flex items-center gap-3">
            <span className="p-2 bg-blue-600 text-white rounded-2xl shadow-sm">
              <Mail className="h-6 w-6" />
            </span>
            Hostinger Email Integration
          </h1>
          <p className="mt-1 text-sm font-medium text-gray-500">
            Configure your SMTP settings to automatically send order confirmations and updates to customers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleAutomation}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 border shadow-sm ${
              config.isEnabled
                ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
            }`}
          >
            <Zap className={`h-4 w-4 ${config.isEnabled ? "text-emerald-500" : "text-amber-500"}`} />
            {config.isEnabled ? "Automation: ACTIVE" : "Automation: PAUSED"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Configuration Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <SettingsIcon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">SMTP Server Configuration</h2>
                <p className="text-xs text-gray-500">Enter your Hostinger or custom SMTP details.</p>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Hostname (SMTP Server)
                  </label>
                  <input
                    type="text"
                    name="host"
                    value={config.host}
                    onChange={handleChange}
                    placeholder="e.g., smtp.hostinger.com"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Port
                  </label>
                  <input
                    type="number"
                    name="port"
                    value={config.port}
                    onChange={handleChange}
                    placeholder="465"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium text-sm"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 py-2">
                <input
                  type="checkbox"
                  id="secure"
                  name="secure"
                  checked={config.secure}
                  onChange={handleChange}
                  className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300 transition-colors"
                />
                <label htmlFor="secure" className="text-sm font-semibold text-gray-700 select-none">
                  Use TLS/SSL (Recommended for Port 465)
                </label>
              </div>

              <hr className="border-gray-100" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Username / Email Address
                  </label>
                  <input
                    type="email"
                    name="user"
                    value={config.user}
                    onChange={handleChange}
                    placeholder="support@sculptnshine.com"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    App Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={config.password}
                    onChange={handleChange}
                    placeholder="••••••••••••"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium text-sm"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">Leave blank to keep existing password.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Sender Name (Optional)
                  </label>
                  <input
                    type="text"
                    name="fromName"
                    value={config.fromName}
                    onChange={handleChange}
                    placeholder="Sculpt & Shine"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Sender Email (Optional)
                  </label>
                  <input
                    type="email"
                    name="fromEmail"
                    value={config.fromEmail}
                    onChange={handleChange}
                    placeholder="Override from email..."
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="px-5 py-2.5 rounded-xl font-bold text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors flex items-center gap-2"
                >
                  {isTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Test Connection
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-2 shadow-md shadow-blue-500/20"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Info Column */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCheck className="h-4 w-4 text-emerald-500" /> Hostinger Cheat Sheet
            </h3>
            <ul className="space-y-3 text-xs text-gray-600">
              <li className="flex justify-between items-center border-b border-gray-50 pb-2">
                <span className="font-medium">Protocol</span>
                <span className="text-gray-900 font-bold">SMTP</span>
              </li>
              <li className="flex justify-between items-center border-b border-gray-50 pb-2">
                <span className="font-medium">Hostname</span>
                <span className="text-gray-900 font-bold bg-gray-100 px-2 py-0.5 rounded">smtp.hostinger.com</span>
              </li>
              <li className="flex justify-between items-center border-b border-gray-50 pb-2">
                <span className="font-medium">Port</span>
                <span className="text-gray-900 font-bold bg-gray-100 px-2 py-0.5 rounded">465</span>
              </li>
              <li className="flex justify-between items-center">
                <span className="font-medium">Security</span>
                <span className="text-gray-900 font-bold">TLS/SSL (Checked)</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Send className="h-4 w-4 text-blue-500" /> Send Test Email
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Verify your setup by sending a test message to an inbox. Make sure to save your configuration first.
            </p>
            <form onSubmit={handleSendTestEmail} className="flex gap-2">
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="Enter email address..."
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium text-xs"
                required
              />
              <button
                type="submit"
                disabled={isSendingTest || !config.isEnabled}
                className="px-4 py-2 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors flex items-center gap-2 shrink-0"
              >
                {isSendingTest ? <Loader2 className="h-3 w-3 animate-spin" /> : "Send"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
