import { api } from '../api';

export const emailApi = {
  getConfig: async () => {
    const response = await api.get('/email-config');
    return response.data;
  },

  updateConfig: async (data: any) => {
    const response = await api.put('/email-config', data);
    return response.data;
  },

  testConnection: async (data: any) => {
    const response = await api.post('/email-config/test', data);
    return response.data;
  },

  sendTestEmail: async (data: { email: string }) => {
    const response = await api.post('/email-config/send-test', data);
    return response.data;
  },
};
