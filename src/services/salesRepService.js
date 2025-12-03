import { apiHelpers } from './api';

const salesRepService = {
  // دریافت پروفایل ویزیتور
  async getProfile() {
    try {
      const response = await apiHelpers.get('/salesrep/profile');
      return response;
    } catch (error) {
      console.error('Error fetching sales rep profile:', error);
      throw error;
    }
  },

  // دریافت سفارشات اختصاص یافته
  async getAssignedOrders(status = null) {
    try {
      const params = status ? { status } : {};
      const response = await apiHelpers.get('/salesrep/orders', params);
      return response;
    } catch (error) {
      console.error('Error fetching assigned orders:', error);
      throw error;
    }
  },

  // دریافت مشتریان اختصاص یافته
  async getAssignedCustomers() {
    try {
      const response = await apiHelpers.get('/salesrep/customers');
      return response;
    } catch (error) {
      console.error('Error fetching assigned customers:', error);
      throw error;
    }
  },

  // شروع تحویل سفارش
  async startDelivery(orderId) {
    try {
      const response = await apiHelpers.put(`/salesrep/orders/${orderId}/start-delivery`);
      return response;
    } catch (error) {
      console.error('Error starting delivery:', error);
      throw error;
    }
  },

  // تکمیل تحویل سفارش
  async completeDelivery(orderId) {
    try {
      const response = await apiHelpers.put(`/salesrep/orders/${orderId}/complete-delivery`);
      return response;
    } catch (error) {
      console.error('Error completing delivery:', error);
      throw error;
    }
  },

  // دریافت آمار ویزیتور
  async getStatistics(startDate = null, endDate = null) {
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      const response = await apiHelpers.get('/salesrep/statistics', { params });
      
      // اگر داده‌ای دریافت نشد، مقادیر پیش‌فرض برگردان
      return {
        totalOrders: 0,
        deliveredOrders: 0,
        pendingOrders: 0,
        inProgressOrders: 0,
        onDeliveryOrders: 0,
        totalSales: 0,
        completionRate: 0,
        ...response
      };
    } catch (error) {
      console.error('Error fetching statistics:', error);
      // در صورت خطا، مقادیر پیش‌فرض برگردان
      return {
        totalOrders: 0,
        deliveredOrders: 0,
        pendingOrders: 0,
        inProgressOrders: 0,
        onDeliveryOrders: 0,
        totalSales: 0,
        completionRate: 0
      };
    }
  }
};

export default salesRepService; 