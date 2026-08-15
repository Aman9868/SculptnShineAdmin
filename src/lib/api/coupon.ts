import { api } from '../api';

export interface Coupon {
  id: string;
  code: string;
  title: string;
  description?: string | null;
  discountType: 'PERCENTAGE' | 'FLAT';
  discountValue: number;
  maxDiscountAmount?: number | null;
  minOrderAmount?: number | null;
  scopeType: 'GENERAL' | 'FIRST_ORDER' | 'CATEGORY' | 'BRAND' | 'PRODUCT' | 'SEASONAL';
  applicableProductIds: string[];
  applicableCategoryIds: string[];
  applicableBrandIds: string[];
  startDate: string;
  endDate: string;
  usageLimit?: number | null;
  usageLimitPerUser: number;
  usedCount: number;
  isActive: boolean;
  isPublic: boolean;
  badgeText?: string | null;
  bannerText?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    usages: number;
    orders: number;
  };
}

export interface CouponMetrics {
  totalCoupons: number;
  activeCoupons: number;
  totalRedemptions: number;
  totalDiscountGranted: number;
}

export const couponAdminAPI = {
  async getCoupons(params?: {
    page?: number;
    limit?: number;
    search?: string;
    scopeType?: string;
    status?: string;
  }) {
    const res = await api.get('/coupons/admin', { params });
    return res.data;
  },

  async getCouponById(id: string) {
    const res = await api.get(`/coupons/admin/${id}`);
    return res.data;
  },

  async createCoupon(data: Partial<Coupon>) {
    const res = await api.post('/coupons', data);
    return res.data;
  },

  async updateCoupon(id: string, data: Partial<Coupon>) {
    const res = await api.put(`/coupons/admin/${id}`, data);
    return res.data;
  },

  async toggleStatus(id: string) {
    const res = await api.patch(`/coupons/admin/${id}/status`);
    return res.data;
  },

  async deleteCoupon(id: string) {
    const res = await api.delete(`/coupons/admin/${id}`);
    return res.data;
  },

  async getCategories() {
    const res = await api.get('/categories?limit=100');
    const data = res.data?.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.categories)) return data.categories;
    return [];
  },

  async getBrands() {
    const res = await api.get('/brands?limit=100');
    const data = res.data?.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.brands)) return data.brands;
    return [];
  },

  async getProducts() {
    const res = await api.get('/products?limit=100');
    const data = res.data?.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.products)) return data.products;
    return [];
  },
};
