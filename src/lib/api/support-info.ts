import { api } from '../api';

export interface SupportInfo {
  id: string;
  type: string;
  email?: string;
  mobileNumber?: string;
  whatsappNumber?: string;
  address?: string;
  operatingHours?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const supportInfoAPI = {
  getAll: async () => {
    const response = await api.get('/support/info');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/support/info/${id}`);
    return response.data;
  },

  create: async (data: Partial<SupportInfo>) => {
    const response = await api.post('/support/info', data);
    return response.data;
  },

  update: async (id: string, data: Partial<SupportInfo>) => {
    const response = await api.patch(`/support/info/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/support/info/${id}`);
    return response.data;
  }
};
