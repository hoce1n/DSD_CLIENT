import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import notificationService from '../../services/notificationService';

// Async Thunks
export const fetchNotifications = createAsyncThunk(
    'notifications/fetchNotifications',
    async (params, { rejectWithValue }) => {
        try {
            const response = await notificationService.getNotifications(params);
            return response;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'خطا در دریافت اعلانات');
        }
    }
);

export const fetchNotificationSummary = createAsyncThunk(
    'notifications/fetchNotificationSummary',
    async (_, { rejectWithValue }) => {
        try {
            const response = await notificationService.getNotificationSummary();
            return response;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'خطا در دریافت خلاصه اعلانات');
        }
    }
);

export const fetchUnreadCount = createAsyncThunk(
    'notifications/fetchUnreadCount',
    async (_, { rejectWithValue }) => {
        try {
            const response = await notificationService.getUnreadCount();
            return response;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'خطا در دریافت تعداد اعلانات');
        }
    }
);

export const markNotificationAsRead = createAsyncThunk(
    'notifications/markAsRead',
    async (notificationId, { rejectWithValue }) => {
        try {
            await notificationService.markAsRead(notificationId);
            return notificationId;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'خطا در علامت‌گذاری اعلان');
        }
    }
);

export const markAllNotificationsAsRead = createAsyncThunk(
    'notifications/markAllAsRead',
    async (_, { rejectWithValue }) => {
        try {
            await notificationService.markAllAsRead();
            return true;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'خطا در علامت‌گذاری همه اعلانات');
        }
    }
);

export const deleteNotification = createAsyncThunk(
    'notifications/deleteNotification',
    async (notificationId, { rejectWithValue }) => {
        try {
            await notificationService.deleteNotification(notificationId);
            return notificationId;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'خطا در حذف اعلان');
        }
    }
);

const initialState = {
    notifications: [],
    unreadCount: 0,
    recentNotifications: [],
    loading: false,
    error: null,
    currentPage: 1,
    totalPages: 1,
    hasMore: true,
    summary: {
        unreadCount: 0,
        recentNotifications: []
    }
};

const notificationSlice = createSlice({
    name: 'notifications',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        resetNotifications: (state) => {
            state.notifications = [];
            state.currentPage = 1;
            state.hasMore = true;
        },
        updateUnreadCount: (state, action) => {
            state.unreadCount = action.payload;
            state.summary.unreadCount = action.payload;
        },
        addNotification: (state, action) => {
            // اضافه کردن اعلان جدید به ابتدای لیست
            state.notifications.unshift(action.payload);
            state.recentNotifications.unshift(action.payload);
            
            // حذف اعلانات اضافی از recent notifications
            if (state.recentNotifications.length > 5) {
                state.recentNotifications = state.recentNotifications.slice(0, 5);
            }
            
            // اگر اعلان خوانده نشده است، تعداد را افزایش دهیم
            if (!action.payload.isRead) {
                state.unreadCount += 1;
                state.summary.unreadCount += 1;
            }
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch Notifications
            .addCase(fetchNotifications.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchNotifications.fulfilled, (state, action) => {
                state.loading = false;
                if (action.meta.arg?.page === 1) {
                    state.notifications = action.payload.data || [];
                } else {
                    state.notifications = [...state.notifications, ...(action.payload.data || [])];
                }
                state.currentPage = action.meta.arg?.page || 1;
                state.hasMore = (action.payload.data || []).length === (action.meta.arg?.pageSize || 20);
            })
            .addCase(fetchNotifications.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Fetch Notification Summary
            .addCase(fetchNotificationSummary.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchNotificationSummary.fulfilled, (state, action) => {
                state.loading = false;
                state.summary = action.payload.data || { unreadCount: 0, recentNotifications: [] };
                state.unreadCount = action.payload.data?.unreadCount || 0;
                state.recentNotifications = action.payload.data?.recentNotifications || [];
            })
            .addCase(fetchNotificationSummary.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Fetch Unread Count
            .addCase(fetchUnreadCount.pending, (state) => {
                state.error = null;
            })
            .addCase(fetchUnreadCount.fulfilled, (state, action) => {
                state.unreadCount = action.payload.data?.count || 0;
                state.summary.unreadCount = action.payload.data?.count || 0;
            })
            .addCase(fetchUnreadCount.rejected, (state, action) => {
                state.error = action.payload;
            })

            // Mark as Read
            .addCase(markNotificationAsRead.fulfilled, (state, action) => {
                const notificationId = action.payload;
                
                // به‌روزرسانی در لیست اصلی
                const notification = state.notifications.find(n => n.id === notificationId);
                if (notification && !notification.isRead) {
                    notification.isRead = true;
                    notification.readAt = new Date().toISOString();
                    state.unreadCount = Math.max(0, state.unreadCount - 1);
                    state.summary.unreadCount = Math.max(0, state.summary.unreadCount - 1);
                }
                
                // به‌روزرسانی در recent notifications
                const recentNotification = state.recentNotifications.find(n => n.id === notificationId);
                if (recentNotification && !recentNotification.isRead) {
                    recentNotification.isRead = true;
                    recentNotification.readAt = new Date().toISOString();
                }
            })
            .addCase(markNotificationAsRead.rejected, (state, action) => {
                state.error = action.payload;
            })

            // Mark All as Read
            .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
                // علامت‌گذاری همه اعلانات به عنوان خوانده شده
                state.notifications.forEach(notification => {
                    if (!notification.isRead) {
                        notification.isRead = true;
                        notification.readAt = new Date().toISOString();
                    }
                });
                
                state.recentNotifications.forEach(notification => {
                    if (!notification.isRead) {
                        notification.isRead = true;
                        notification.readAt = new Date().toISOString();
                    }
                });
                
                state.unreadCount = 0;
                state.summary.unreadCount = 0;
            })
            .addCase(markAllNotificationsAsRead.rejected, (state, action) => {
                state.error = action.payload;
            })

            // Delete Notification
            .addCase(deleteNotification.fulfilled, (state, action) => {
                const notificationId = action.payload;
                
                // حذف از لیست اصلی
                const notificationIndex = state.notifications.findIndex(n => n.id === notificationId);
                if (notificationIndex !== -1) {
                    const notification = state.notifications[notificationIndex];
                    if (!notification.isRead) {
                        state.unreadCount = Math.max(0, state.unreadCount - 1);
                        state.summary.unreadCount = Math.max(0, state.summary.unreadCount - 1);
                    }
                    state.notifications.splice(notificationIndex, 1);
                }
                
                // حذف از recent notifications
                const recentIndex = state.recentNotifications.findIndex(n => n.id === notificationId);
                if (recentIndex !== -1) {
                    state.recentNotifications.splice(recentIndex, 1);
                }
            })
            .addCase(deleteNotification.rejected, (state, action) => {
                state.error = action.payload;
            });
    }
});

export const { 
    clearError, 
    resetNotifications, 
    updateUnreadCount, 
    addNotification 
} = notificationSlice.actions;

export default notificationSlice.reducer; 