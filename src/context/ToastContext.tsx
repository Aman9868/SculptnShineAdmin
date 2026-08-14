"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "success", duration: number = 3500) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, message, type }]);

      setTimeout(() => {
        removeToast(id);
      }, duration);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Floating Container */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => {
          const isSuccess = toast.type === "success";
          const isError = toast.type === "error";
          const isWarning = toast.type === "warning";

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center justify-between p-4 rounded-2xl shadow-xl border backdrop-blur-md transition-all duration-300 transform animate-in slide-in-from-top-5 ${
                isSuccess
                  ? "bg-white/95 border-emerald-200 text-emerald-950 shadow-emerald-500/10"
                  : isError
                  ? "bg-white/95 border-red-200 text-red-950 shadow-red-500/10"
                  : isWarning
                  ? "bg-white/95 border-amber-200 text-amber-950 shadow-amber-500/10"
                  : "bg-white/95 border-gold-200 text-gray-900 shadow-gold-500/10"
              }`}
            >
              <div className="flex items-center gap-3 pr-2">
                {isSuccess && (
                  <div className="h-9 w-9 rounded-xl bg-emerald-100/80 flex items-center justify-center shrink-0">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                  </div>
                )}
                {isError && (
                  <div className="h-9 w-9 rounded-xl bg-red-100/80 flex items-center justify-center shrink-0">
                    <XCircle className="h-5 w-5 text-red-600" />
                  </div>
                )}
                {isWarning && (
                  <div className="h-9 w-9 rounded-xl bg-amber-100/80 flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                  </div>
                )}
                {!isSuccess && !isError && !isWarning && (
                  <div className="h-9 w-9 rounded-xl bg-gold-100/80 flex items-center justify-center shrink-0">
                    <Info className="h-5 w-5 text-gold-600" />
                  </div>
                )}

                <p className="text-sm font-bold leading-tight">{toast.message}</p>
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors shrink-0 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
