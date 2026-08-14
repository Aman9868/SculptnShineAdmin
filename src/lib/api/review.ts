import { api } from '../api';

export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ProductReview {
  id: string;
  productId: string;
  product?: { id: string; title: string; images: string[]; slug: string };
  userProfileId?: string;
  userProfile?: {
    user: { firstName: string; lastName: string; email: string };
  };
  rating: number;
  title?: string;
  comment?: string;
  images: string[];
  isVerifiedPurchase: boolean;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
}

export const reviewAPI = {
  getAllReviews: async (filters?: { status?: ReviewStatus, search?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    
    const response = await api.get(`/reviews/admin/list?${params.toString()}`);
    return response.data;
  },

  updateReviewStatus: async (id: string, status: ReviewStatus) => {
    const response = await api.patch(`/reviews/admin/${id}/status`, { status });
    return response.data;
  },

  addReview: async (data: { productId: string; rating: number; title?: string; comment?: string; images?: string[] }) => {
    const response = await api.post('/reviews/admin', data);
    return response.data;
  },

  deleteReview: async (id: string) => {
    const response = await api.delete(`/reviews/admin/${id}`);
    return response.data;
  },

  updateReview: async (id: string, data: { rating?: number; title?: string; comment?: string }) => {
    const response = await api.patch(`/reviews/admin/${id}`, data);
    return response.data;
  },
  
  // Need to fetch basic product info to help admin link reviews
  searchProducts: async (query: string) => {
    const response = await api.get(`/products?search=${query}&limit=10`);
    return response.data;
  }
};
