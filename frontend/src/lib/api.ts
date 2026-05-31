import axios from 'axios';
import { handleMockRequest } from './mockDb';

// Get backend URL from localStorage, env or fallback to our secure public tunnel
export const getApiBaseUrl = (): string => {
  return localStorage.getItem('custom_api_url') || import.meta.env.VITE_API_URL || 'https://tricky-months-camp.loca.lt/api/v1';
};

export const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
    'Bypass-Tunnel-Reminder': 'true', // Bypass localtunnel reminder landing page
  },
  withCredentials: true, // Send credentials (cookies) with requests
});

export const updateApiBaseUrl = (newUrl: string) => {
  if (newUrl) {
    localStorage.setItem('custom_api_url', newUrl);
    api.defaults.baseURL = newUrl;
  } else {
    localStorage.removeItem('custom_api_url');
    api.defaults.baseURL = import.meta.env.VITE_API_URL || 'https://tricky-months-camp.loca.lt/api/v1';
  }
};

// Auto-attach JWT token if present & run in standalone mock mode if configured
api.interceptors.request.use((config) => {
  const connectionMode = localStorage.getItem('connection_mode') || 'mock'; // Default to offline standalone mock mode!
  if (connectionMode === 'mock') {
    config.adapter = async (cfg) => {
      const result = await handleMockRequest(cfg);
      const status = result.status || 200;
      
      const response = {
        data: result.data,
        status: status,
        statusText: status >= 200 && status < 300 ? 'OK' : 'Error',
        headers: {},
        config: cfg,
      };

      if (status >= 200 && status < 300) {
        return response;
      } else {
        const error = new Error(`Request failed with status code ${status}`) as any;
        error.response = response;
        error.config = cfg;
        error.status = status;
        throw error;
      }
    };
  }

  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Handle global 401s (token expiration)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 and we haven't already retried this request
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Do NOT attempt token refresh for authentication/credentials requests
      const isAuthRequest = originalRequest.url?.includes('/auth/login') ||
                            originalRequest.url?.includes('/auth/sso') ||
                            originalRequest.url?.includes('/auth/register') ||
                            originalRequest.url?.includes('/auth/guest') ||
                            originalRequest.url?.includes('/auth/refresh') ||
                            originalRequest.url?.endsWith('/auth/login') ||
                            originalRequest.url?.endsWith('/auth/refresh');

      if (isAuthRequest) {
        // Clear tokens if it is an expired token refresh attempt itself
        if (originalRequest.url?.includes('/auth/refresh') || originalRequest.url?.endsWith('/auth/refresh')) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Fetch new access token by using the refresh cookie
        const response = await axios.post(
          `${getApiBaseUrl()}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const { access_token } = response.data;

        localStorage.setItem('token', access_token);
        api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
        originalRequest.headers.Authorization = `Bearer ${access_token}`;

        processQueue(null, access_token);
        isRefreshing = false;

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;

        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
