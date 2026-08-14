import { api } from '../api';

export interface ShippingRule {
  id: string;
  name: string;
  states: string[];
  charge: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ShippingData {
  rules: ShippingRule[];
  threshold: number;
}

export const shippingAPI = {
  getSettings: async (): Promise<{ success: boolean; data: ShippingData }> => {
    const response = await api.get('/shipping');
    return response.data;
  },

  createRule: async (data: { name: string; states: string[]; charge: number; isDefault?: boolean }) => {
    const response = await api.post('/shipping/rules', data);
    return response.data;
  },

  updateRule: async (id: string, data: Partial<{ name: string; states: string[]; charge: number; isDefault: boolean }>) => {
    const response = await api.put(`/shipping/rules/${id}`, data);
    return response.data;
  },

  deleteRule: async (id: string) => {
    const response = await api.delete(`/shipping/rules/${id}`);
    return response.data;
  },

  updateThreshold: async (threshold: number) => {
    const response = await api.put('/shipping/settings', { threshold });
    return response.data;
  },
};
