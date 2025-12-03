import api from './api';

const notificationService = {
    // دریافت لیست اعلانات
    getNotifications: async (params = {}) => {
        const { page = 1, pageSize = 20, isRead, type } = params;
        const queryParams = new URLSearchParams({
            page: page.toString(),
            pageSize: pageSize.toString()
        });

        if (isRead !== undefined) {
            queryParams.append('isRead', isRead.toString());
        }
        if (type) {
            queryParams.append('type', type);
        }

        const response = await api.get(`/notifications?${queryParams}`);
        return response.data;
    },

    // دریافت خلاصه اعلانات
    getNotificationSummary: async () => {
        const response = await api.get('/notifications/summary');
        return response.data;
    },

    // دریافت تعداد اعلانات خوانده نشده
    getUnreadCount: async () => {
        const response = await api.get('/notifications/unread-count');
        return response.data;
    },

    // علامت‌گذاری اعلان به عنوان خوانده شده
    markAsRead: async (notificationId) => {
        const response = await api.put(`/notifications/${notificationId}/mark-as-read`);
        return response.data;
    },

    // علامت‌گذاری همه اعلانات به عنوان خوانده شده
    markAllAsRead: async () => {
        const response = await api.put('/notifications/mark-all-as-read');
        return response.data;
    },

    // حذف اعلان
    deleteNotification: async (notificationId) => {
        const response = await api.delete(`/notifications/${notificationId}`);
        return response.data;
    },

    // ایجاد اعلان آزمایشی (فقط برای Admin/Supervisor)
    createTestNotification: async (notificationData) => {
        const response = await api.post('/notifications/test', notificationData);
        return response.data;
    }
};

export default notificationService; 