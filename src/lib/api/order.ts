import { api } from '../api';

export const orderAPI = {
  getAllOrders: async (page = 1, limit = 20, status?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (status) params.append('status', status);
    
    const response = await api.get(`/orders/admin-all?${params.toString()}`);
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
