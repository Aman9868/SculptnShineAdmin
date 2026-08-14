import { api } from '../api';

export type TicketCategory = 
  | 'DAMAGED_PRODUCT'
  | 'WRONG_ITEM'
  | 'DELIVERY_ISSUE'
  | 'PAYMENT_REFUND'
  | 'QUALITY_ISSUE'
  | 'GENERAL_INQUIRY'
  | 'OTHER';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type SenderType = 'USER' | 'ADMIN';

export interface UserProfileBasic {
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderType: SenderType;
  senderId: string;
  message: string;
  attachments: string[];
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  userProfileId: string;
  userProfile?: UserProfileBasic;
  orderId?: string;
  productId?: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  subject: string;
  description: string;
  attachments: string[];
  adminResponse?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
  messages?: TicketMessage[];
  order?: { id: string; orderNumber: string; totalAmount: number; status: string; createdAt: string };
  product?: { id: string; title: string; images: string[]; slug: string };
}

export const supportAPI = {
  getAllTickets: async (filters?: { status?: TicketStatus, category?: TicketCategory, search?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.search) params.append('search', filters.search);
    
    const response = await api.get(`/support/admin/tickets?${params.toString()}`);
    return response.data;
  },

  getTicketDetails: async (id: string) => {
    const response = await api.get(`/support/tickets/${id}`);
    return response.data;
  },

  updateTicketStatus: async (id: string, status: TicketStatus, adminResponse?: string) => {
    const response = await api.patch(`/support/admin/tickets/${id}/status`, { status, adminResponse });
    return response.data;
  },

  addReply: async (id: string, message: string, attachments: string[] = []) => {
    const response = await api.post(`/support/tickets/${id}/reply`, { message, attachments });
    return response.data;
  }
};
