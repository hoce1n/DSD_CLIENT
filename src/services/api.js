import axios from 'axios';

// Base URL for the API
// در development: از proxy استفاده می‌کنیم
// در production: از URL کامل بک‌اند استفاده می‌کنیم
const BASE_URL = import.meta.env.PROD 
  ? 'https://api.rahaan.ir' 
  : '/api';

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  // timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('authToken');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors and token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If unauthorized and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (refreshToken) {
          // استفاده از api instance به جای axios مستقیم تا baseURL اعمال شود
          const response = await api.post('/apiauth/refresh', {
            refreshToken: refreshToken
          });

          const { accessToken: newToken, refreshToken: newRefreshToken } = response.data;
          
          // Update tokens in localStorage
          localStorage.setItem('authToken', newToken);
          localStorage.setItem('refreshToken', newRefreshToken);
          
          // Update authorization header
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          
          // Retry original request
          return api(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, clear tokens and redirect to login
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        
        // Redirect to login page
        window.location.href = '/login';
        
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.errors?.[0] ||
                        error.message ||
                        'خطای غیرمنتظره رخ داد';

    return Promise.reject({
      message: errorMessage,
      status: error.response?.status,
      data: error.response?.data
    });
  }
);

export default api;

// Helper functions for common API operations
export const apiHelpers = {
  // Generic GET request
  get: async (url, params = {}) => {
    try {
      const response = await api.get(url, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Generic POST request
  post: async (url, data = {}) => {
    try {
      const response = await api.post(url, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Generic PUT request
  put: async (url, data = {}) => {
    try {
      const response = await api.put(url, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Generic PATCH request
  patch: async (url, data = {}) => {
    try {
      const response = await api.patch(url, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Generic DELETE request
  delete: async (url) => {
    try {
      const response = await api.delete(url);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Upload file
  uploadFile: async (url, file, onProgress = null) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted);
          }
        },
      };

      const response = await api.post(url, formData, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Download file
  downloadFile: async (url, filename) => {
    try {
      const response = await api.get(url, {
        responseType: 'blob',
      });

      // Create blob link to download
      const blob = new Blob([response.data]);
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return true;
    } catch (error) {
      throw error;
    }
  }
};

// Export specific API endpoints for better organization
export const endpoints = {
  // Authentication endpoints
  auth: {
    login: '/apiauth/login',
    register: '/apiauth/register',
    logout: '/apiauth/logout',
    refresh: '/apiauth/refresh',
    me: '/apiauth/me',
    profile: '/apiauth/profile',
    completeProfile: '/apiauth/complete-profile',
    updateProfile: '/apiauth/update-profile',
    changePassword: '/apiauth/change-password',
    updateUserProfile: '/apiauth/update-user-profile'
  },

  // Orders endpoints
  orders: {
    list: '/apiorders',
    create: '/apiorders',
    detail: (id) => `/apiorders/${id}`,
    update: (id) => `/apiorders/${id}`,
    delete: (id) => `/apiorders/${id}`,
    stats: '/apiorders/stats'
  },

  // Products endpoints
  products: {
    list: '/apiproducts',
    create: '/apiproducts',
    detail: (id) => `/apiproducts/${id}`,
    update: (id) => `/apiproducts/${id}`,
    delete: (id) => `/apiproducts/${id}`,
    search: '/apiproducts/search'
  },

  // Customers endpoints
  customers: {
    list: '/apicustomers',
    create: '/apicustomers',
    detail: (id) => `/apicustomers/${id}`,
    update: (id) => `/apicustomers/${id}`,
    delete: (id) => `/apicustomers/${id}`
  },

  // Dashboard endpoints
  dashboard: {
    stats: '/apidashboard/stats',
    charts: '/apidashboard/charts'
  },

  // SalesReps endpoints
  salesreps: {
    list: '/salesreps',
    create: '/salesreps',
    update: (id) => `/salesreps/${id}`,
    delete: (id) => `/salesreps/${id}`,
    availableUsers: '/salesreps/available-users'
  }
};

// Authentication service
export const authService = {
  // Login user
  login: async (credentials) => {
    try {
      const response = await apiHelpers.post(endpoints.auth.login, credentials);
      
      if (response.accessToken) {
        // Store tokens and user info
        localStorage.setItem('authToken', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.user));
        localStorage.setItem('needsCompleteProfile', response.needsCompleteProfile || false);
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Register new user
  register: async (userData) => {
    try {
      const response = await apiHelpers.post(endpoints.auth.register, userData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Logout user
  logout: async () => {
    try {
      await apiHelpers.post(endpoints.auth.logout);
      
      // Clear local storage
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('needsCompleteProfile');
      
      return true;
    } catch (error) {
      // Even if API call fails, clear local storage
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('needsCompleteProfile');
      throw error;
    }
  },

  // Get current user info
  getCurrentUser: async () => {
    try {
      const response = await apiHelpers.get(endpoints.auth.me);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get user profile with customer info
  getProfile: async () => {
    try {
      const response = await apiHelpers.get(endpoints.auth.profile);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Complete profile after registration
  completeProfile: async (profileData) => {
    try {
      const response = await apiHelpers.post(endpoints.auth.completeProfile, profileData);
      
      // Update needsCompleteProfile status
      localStorage.setItem('needsCompleteProfile', false);
      
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Update existing profile
  updateProfile: async (profileData) => {
    try {
      const response = await apiHelpers.put(endpoints.auth.updateProfile, profileData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Change password
  changePassword: async (passwordData) => {
    try {
      const response = await apiHelpers.post(endpoints.auth.changePassword, passwordData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Update user profile (personal info)
  updateUserProfile: async (profileData) => {
    try {
      const response = await apiHelpers.put(endpoints.auth.updateUserProfile, profileData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    return !!(token && user);
  },

  // Check if user needs to complete profile
  needsCompleteProfile: () => {
    return localStorage.getItem('needsCompleteProfile') === 'true';
  },

  // Get stored user info
  getStoredUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
};

// Orders service
export const ordersService = {
  // Get all orders
  getAll: async (params = {}) => {
    try {
      const response = await apiHelpers.get(endpoints.orders.list, params);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get order by ID
  getById: async (id) => {
    try {
      const response = await apiHelpers.get(endpoints.orders.detail(id));
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Create new order
  create: async (orderData) => {
    try {
      const response = await apiHelpers.post(endpoints.orders.create, orderData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Update order
  update: async (id, orderData) => {
    try {
      const response = await apiHelpers.put(endpoints.orders.update(id), orderData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Delete order
  delete: async (id) => {
    try {
      const response = await apiHelpers.delete(endpoints.orders.delete(id));
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get order statistics
  getStats: async () => {
    try {
      const response = await apiHelpers.get(endpoints.orders.stats);
      return response;
    } catch (error) {
      throw error;
    }
  }
};

// Products service
export const productsService = {
  // Get all products
  getAll: async (params = {}) => {
    try {
      const response = await apiHelpers.get(endpoints.products.list, params);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get product by ID
  getById: async (id) => {
    try {
      const response = await apiHelpers.get(endpoints.products.detail(id));
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Create new product
  create: async (productData) => {
    try {
      const response = await apiHelpers.post(endpoints.products.create, productData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Update product
  update: async (id, productData) => {
    try {
      const response = await apiHelpers.put(endpoints.products.update(id), productData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Delete product
  delete: async (id) => {
    try {
      const response = await apiHelpers.delete(endpoints.products.delete(id));
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Search products
  search: async (query) => {
    try {
      const response = await apiHelpers.get(endpoints.products.search, { q: query });
      return response;
    } catch (error) {
      throw error;
    }
  }
}; 