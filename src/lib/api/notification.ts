import { api } from '../api';

export interface AdminNotification {
  id: string;
  userProfileId: string;
  title: string;
  message: string;
  type: 'ORDER_UPDATE' | 'PROMO' | 'SYSTEM';
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

export const notificationAPI = {
  getMyNotifications: async (limit = 20): Promise<{ success: boolean; data: AdminNotification[] }> => {
    const response = await api.get(`/notifications?limit=${limit}`);
    return response.data;
  },

  markAsRead: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async (): Promise<{ success: boolean; message: string }> => {
    const response = await api.patch('/notifications/all/read');
    return response.data;
  },

  subscribe: async (subscription: any): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/notifications/subscribe', { subscription });
    return response.data;
  },
};
