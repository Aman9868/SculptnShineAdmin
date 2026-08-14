import { api } from '../api';

export interface Guide {
  id: string;
  title: string;
  slug: string;
  category: string;
  image: string;
  videoUrl?: string | null;
  content: string;
  readTime: string;
  status: boolean;
  author: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetGuidesResponse {
  success: boolean;
  guides: Guide[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const guideAPI = {
  getAll: (page = 1, limit = 10, status?: boolean) => {
    let url = `/guides?page=${page}&limit=${limit}`;
    if (status !== undefined) {
      url += `&status=${status}`;
    }
    return api.get<GetGuidesResponse>(url);
  },

  getById: (id: string) => api.get<{ success: boolean; data: Guide }>(`/guides/${id}`),

  create: (data: Partial<Guide>) => api.post<{ success: boolean; data: Guide }>('/guides', data),

  update: (id: string, data: Partial<Guide>) => api.patch<{ success: boolean; data: Guide }>(`/guides/${id}`, data),

  delete: (id: string) => api.delete<{ success: boolean; message: string }>(`/guides/${id}`),
};
