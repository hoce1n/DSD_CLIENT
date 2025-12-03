import api from './api';

export const orderService = {
  // دریافت لیست سفارشات بر اساس نقش کاربر
  getOrders: async (page = 1, pageSize = 10, search = '') => {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });
    
    if (search) {
      params.append('search', search);
    }

    const response = await api.get(`/orders?${params.toString()}`);
    return response.data;
  },

  // دریافت جزئیات سفارش
  getOrderById: async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  // ایجاد سفارش جدید
  createOrder: async (orderData) => {
    const response = await api.post('/orders', orderData);
    return response.data;
  },

  // بروزرسانی وضعیت سفارش (فقط ادمین/سرپرست)
  updateOrderStatus: async (id, statusData) => {
    const response = await api.put(`/orders/${id}/status`, statusData);
    return response.data;
  },

  // بروزرسانی کامل سفارش (وضعیت، تاریخ تحویل، یادداشت)
  updateOrder: async (id, updateData) => {
    const response = await api.put(`/orders/${id}`, updateData);
    return response.data;
  },

  // سفارش سریع (از محصولات)
  quickOrder: async (orderItems) => {
    const orderData = {
      items: orderItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.price
      })),
      notes: 'سفارش سریع از صفحه محصولات'
    };
    
    const response = await api.post('/orders', orderData);
    return response.data;
  },

  // دریافت آمار سفارشات (برای dashboard)
  getOrderStatistics: async () => {
    const response = await api.get('/orders/statistics');
    return response.data;
  },

  // جستجو در سفارشات
  searchOrders: async (searchTerm, filters = {}) => {
    const params = new URLSearchParams({
      search: searchTerm,
      ...filters
    });

    const response = await api.get(`/orders/search?${params.toString()}`);
    return response.data;
  },

  // دریافت سفارشات با فیلتر وضعیت
  getOrdersByStatus: async (status, page = 1, pageSize = 10) => {
    const params = new URLSearchParams({
      status,
      page: page.toString(),
      pageSize: pageSize.toString()
    });

    const response = await api.get(`/orders?${params.toString()}`);
    return response.data;
  },

  // لغو سفارش (اگر امکان پذیر باشد)
  cancelOrder: async (id, reason) => {
    const response = await api.put(`/orders/${id}/status`, {
      status: 'Cancelled',
      notes: reason
    });
    return response.data;
  },

  // دریافت تاریخچه تغییرات سفارش
  getOrderHistory: async (id) => {
    const response = await api.get(`/orders/${id}/history`);
    return response.data;
  }
};

export default orderService; 