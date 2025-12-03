 import { apiHelpers } from './api';

const deliveryService = {
  // دریافت فاکتور تحویل
  getDeliveryInvoice: async (orderId) => {
    return await apiHelpers.get(`/delivery/invoice/${orderId}`);
  },

  // به‌روزرسانی مقادیر تحویل داده شده
  updateDeliveryQuantities: async (orderId, data) => {
    return await apiHelpers.put(`/delivery/quantities/${orderId}`, data);
  },

  // تأیید دریافت کالا توسط مشتری
  confirmDeliveryByCustomer: async (orderId) => {
    return await apiHelpers.post(`/delivery/confirm/${orderId}`);
  }
};

export default deliveryService;