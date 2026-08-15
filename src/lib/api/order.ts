import { api } from '../api';

export const orderAPI = {
  getAllOrders: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  } | number, legacyLimit?: number, legacyStatus?: string) => {
    const query = new URLSearchParams();

    // Handle backward-compatibility with positional arguments (p, l, s)
    if (typeof params === 'number') {
      query.append('page', params.toString());
      if (legacyLimit) query.append('limit', legacyLimit.toString());
      if (legacyStatus && legacyStatus !== 'ALL') query.append('status', legacyStatus);
    } else if (params) {
      if (params.page) query.append('page', params.page.toString());
      if (params.limit) query.append('limit', params.limit.toString());
      if (params.status && params.status !== 'ALL') query.append('status', params.status);
      if (params.search && params.search.trim()) query.append('search', params.search.trim());
      if (params.startDate) query.append('startDate', params.startDate);
      if (params.endDate) query.append('endDate', params.endDate);
    }
    
    const response = await api.get(`/orders/admin-all?${query.toString()}`);
    return response.data;
  },

  getOrderById: async (id: string) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  updateOrderStatus: async (id: string, status: string, trackingNumber?: string, comment?: string) => {
    const response = await api.patch(`/orders/${id}/status`, { status, trackingNumber, comment });
    return response.data;
  },
};
