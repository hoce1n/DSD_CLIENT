import axios from 'axios';

const API_BASE_URL = 'http://localhost:5012';

// ایجاد axios instance با تنظیمات پایه
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor برای اضافه کردن token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor برای handle کردن token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/api/apiauth/refresh`, {
            refreshToken,
          });

          const { accessToken } = response.data;
          localStorage.setItem('accessToken', accessToken);
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export const authService = {
  // ورود به سیستم
  login: async (username, password) => {
    const response = await api.post('/api/apiauth/login', {
      username,
      password,
    });
    return response.data;
  },

  // خروج از سیستم
  logout: async () => {
    const response = await api.post('/api/apiauth/logout');
    return response.data;
  },

  // تجدید token
  refreshToken: async (refreshToken) => {
    const response = await api.post('/api/apiauth/refresh', {
      refreshToken,
    });
    return response.data;
  },

  // دریافت اطلاعات کاربر فعلی
  getCurrentUser: async () => {
    const response = await api.get('/api/apiauth/me');
    return response.data;
  },
};

export default api; 