import { api } from '../api';

export interface AuditLogItem {
  id: string;
  action: string;
  entity: string;
  entityId?: string | null;
  userId?: string | null;
  userEmail?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  status: 'SUCCESS' | 'FAILED' | 'WARNING' | 'INFO';
  details?: any;
  createdAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  } | null;
}

export interface AuditLogStats {
  total: number;
  todayCount: number;
  orderAndPaymentCount: number;
  catalogCount: number;
  authCount: number;
  failureCount: number;
  entityBreakdown: { entity: string; count: number }[];
}

export interface AuditLogsResponse {
  success: boolean;
  message: string;
  data: {
    logs: AuditLogItem[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export const auditAPI = {
  getLogs: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    entity?: string;
    action?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<AuditLogsResponse> => {
    const query = new URLSearchParams();

    if (params) {
      if (params.page) query.append('page', params.page.toString());
      if (params.limit) query.append('limit', params.limit.toString());
      if (params.entity && params.entity !== 'ALL') query.append('entity', params.entity);
      if (params.action && params.action !== 'ALL') query.append('action', params.action);
      if (params.status && params.status !== 'ALL') query.append('status', params.status);
      if (params.search && params.search.trim()) query.append('search', params.search.trim());
      if (params.startDate) query.append('startDate', params.startDate);
      if (params.endDate) query.append('endDate', params.endDate);
    }

    const response = await api.get(`/audit-logs?${query.toString()}`);
    return response.data;
  },

  getStats: async (): Promise<{ success: boolean; data: AuditLogStats }> => {
    const response = await api.get('/audit-logs/stats');
    return response.data;
  },

  getExportUrl: (params?: Record<string, any>): string => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v && v !== 'ALL') query.append(k, String(v));
      });
    }
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    return `${baseUrl}/audit-logs/export?${query.toString()}`;
  },
};
