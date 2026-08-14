import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getToken, getRefreshToken, setTokens, removeTokens } from './auth';

type ApiErrorResponse = {
  message?: string;
  data?: {
    accessToken?: string;
    refreshToken?: string;
  };
};

type RetryRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

type FailedQueueItem = {
  resolve: (token: string | null) => void;
  reject: (error: unknown) => void;
};

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: FailedQueueItem[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as RetryRequestConfig | undefined;
    const requestUrl = originalRequest?.url || '';
    const responseMessage = error.response?.data?.message;

    if (
      error.response?.status === 404 &&
      requestUrl.includes('/users/me') &&
      responseMessage === 'User not found'
    ) {
      removeTokens();
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise<string | null>(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch((err: unknown) => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        removeTokens();
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post<ApiErrorResponse>(`${api.defaults.baseURL}/auth/refresh-token`, { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = data.data || {};

        if (!accessToken || !newRefreshToken) {
          throw new Error('Refresh token response was missing tokens');
        }
        
        setTokens(accessToken, newRefreshToken);
        processQueue(null, accessToken);
        
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        removeTokens();
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
