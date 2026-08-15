import { api } from '../api';

export interface WhatsAppStatusResponse {
  status: 'DISCONNECTED' | 'CONNECTING' | 'SCAN_QR' | 'CONNECTED';
  connectedUser: {
    phone: string | null;
    name: string | null;
    jid: string | null;
    platform?: string;
  } | null;
  lastConnectedAt: string | null;
  qrCode: string | null;
  isConfigured: boolean;
  isAutomationEnabled?: boolean;
}

export const whatsappAPI = {
  getStatus: async () => {
    const res = await api.get('/whatsapp/status');
    return res.data;
  },

  getQR: async () => {
    const res = await api.get('/whatsapp/qr');
    return res.data;
  },

  disconnect: async () => {
    const res = await api.post('/whatsapp/disconnect');
    return res.data;
  },

  toggleAutomation: async (enabled: boolean) => {
    const res = await api.post('/whatsapp/toggle-automation', { enabled });
    return res.data;
  },

  sendTestMessage: async (phone: string, message?: string) => {
    const res = await api.post('/whatsapp/test-message', { phone, message });
    return res.data;
  },
};
