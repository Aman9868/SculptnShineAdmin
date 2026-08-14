"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { api } from "@/lib/api";

export interface SystemHealth {
  status: "healthy" | "degraded" | "maintenance";
  maintenance: boolean;
  maintenanceMessage?: string | null;
  estimatedEndTime?: string | null;
  services?: {
    server?: {
      status: string;
      uptime?: string;
      uptimeSeconds?: number;
      nodeEnv?: string;
    };
    database?: {
      status: string;
      latencyMs?: number;
    };
  };
  system?: {
    memory?: {
      rssMb: number;
      heapUsedMb: number;
      heapTotalMb: number;
    };
    timestamp?: string;
    responseTimeMs?: number;
  };
  version?: string;
}

interface HealthContextType {
  isHealthy: boolean;
  isMaintenance: boolean;
  isOffline: boolean;
  healthData: SystemHealth | null;
  lastChecked: Date | null;
  isChecking: boolean;
  checkHealth: () => Promise<boolean>;
  toggleMaintenanceMode: (enabled: boolean, message?: string) => Promise<boolean>;
  nextRetrySeconds: number;
  reportNetworkError: () => void;
}

const HealthContext = createContext<HealthContextType>({
  isHealthy: true,
  isMaintenance: false,
  isOffline: false,
  healthData: null,
  lastChecked: null,
  isChecking: false,
  checkHealth: async () => true,
  toggleMaintenanceMode: async () => false,
  nextRetrySeconds: 15,
  reportNetworkError: () => {},
});

export const useHealth = () => useContext(HealthContext);

export function HealthProvider({ children }: { children: React.ReactNode }) {
  const [healthData, setHealthData] = useState<SystemHealth | null>(null);
  const [isHealthy, setIsHealthy] = useState(true);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [nextRetrySeconds, setNextRetrySeconds] = useState(15);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const retryIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const checkHealth = useCallback(async (): Promise<boolean> => {
    setIsChecking(true);
    try {
      const res = await api.get("/health", {
        headers: { "Cache-Control": "no-cache" },
        timeout: 6000,
      });

      setLastChecked(new Date());

      if (res.status === 200 && res.data?.success) {
        setHealthData(res.data.data);
        setIsHealthy(true);
        setIsMaintenance(false);
        setIsOffline(false);
        setNextRetrySeconds(30);
        return true;
      } else if (res.status === 503 || res.data?.data?.maintenance) {
        setHealthData(res.data?.data || null);
        setIsHealthy(false);
        setIsMaintenance(true);
        setIsOffline(false);
        setNextRetrySeconds(15);
        return false;
      } else {
        setHealthData(res.data?.data || null);
        setIsHealthy(false);
        setIsMaintenance(false);
        setIsOffline(true);
        setNextRetrySeconds(15);
        return false;
      }
    } catch (err: any) {
      setLastChecked(new Date());
      if (err.response?.status === 503 && err.response?.data?.data?.maintenance) {
        setHealthData(err.response.data.data);
        setIsHealthy(false);
        setIsMaintenance(true);
        setIsOffline(false);
      } else {
        setIsHealthy(false);
        setIsMaintenance(false);
        setIsOffline(true);
      }
      setNextRetrySeconds(15);
      return false;
    } finally {
      setIsChecking(false);
    }
  }, []);

  const reportNetworkError = useCallback(() => {
    setIsHealthy(false);
    setIsOffline(true);
    setNextRetrySeconds(10);
  }, []);

  const toggleMaintenanceMode = async (enabled: boolean, message?: string): Promise<boolean> => {
    try {
      const res = await api.post("/health/maintenance", { enabled, message });
      if (res.data?.success) {
        await checkHealth();
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  // Initial check on mount
  useEffect(() => {
    checkHealth();

    // Listen for custom API offline events
    const handleApiOffline = () => reportNetworkError();
    window.addEventListener("sculptnshine:api-offline", handleApiOffline);
    return () => {
      window.removeEventListener("sculptnshine:api-offline", handleApiOffline);
    };
  }, [checkHealth, reportNetworkError]);

  // Periodic polling & countdown
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (retryIntervalRef.current) clearInterval(retryIntervalRef.current);

    if (!isHealthy || isOffline || isMaintenance) {
      setNextRetrySeconds(15);
      retryIntervalRef.current = setInterval(() => {
        setNextRetrySeconds((prev) => {
          if (prev <= 1) {
            checkHealth();
            return 15;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      timerRef.current = setInterval(() => {
        checkHealth();
      }, 60000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (retryIntervalRef.current) clearInterval(retryIntervalRef.current);
    };
  }, [isHealthy, isOffline, isMaintenance, checkHealth]);

  return (
    <HealthContext.Provider
      value={{
        isHealthy,
        isMaintenance,
        isOffline,
        healthData,
        lastChecked,
        isChecking,
        checkHealth,
        toggleMaintenanceMode,
        nextRetrySeconds,
        reportNetworkError,
      }}
    >
      {children}
    </HealthContext.Provider>
  );
}
