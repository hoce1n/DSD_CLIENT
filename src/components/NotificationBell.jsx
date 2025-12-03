import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
    fetchNotificationSummary, 
    markNotificationAsRead, 
    markAllNotificationsAsRead,
    deleteNotification,
    clearError
} from '../store/slices/notificationSlice';

const NotificationBell = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const dropdownRef = useRef(null);
    const bellRef = useRef(null);
    
    const [isOpen, setIsOpen] = useState(false);
    
    const { 
        unreadCount, 
        recentNotifications, 
        loading, 
        error 
    } = useSelector(state => state.notifications);

    // دریافت اطلاعات اولیه
    useEffect(() => {
        dispatch(fetchNotificationSummary());
        
        // به‌روزرسانی دوره‌ای (هر 30 ثانیه)
        const interval = setInterval(() => {
            dispatch(fetchNotificationSummary());
        }, 30000);
        
        return () => clearInterval(interval);
    }, [dispatch]);

    // بستن dropdown با کلیک خارج از آن
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && 
                !dropdownRef.current.contains(event.target) && 
                !bellRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // پاک کردن خطا
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => {
                dispatch(clearError());
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [error, dispatch]);

    const handleMarkAsRead = async (notificationId) => {
        try {
            await dispatch(markNotificationAsRead(notificationId));
            dispatch(fetchNotificationSummary());
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await dispatch(markAllNotificationsAsRead());
            dispatch(fetchNotificationSummary());
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    const handleDeleteNotification = async (notificationId) => {
        try {
            await dispatch(deleteNotification(notificationId));
            dispatch(fetchNotificationSummary());
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const formatTimeAgo = (dateString) => {
        if (!dateString) return '';
        
        const now = new Date();
        const notificationDate = new Date(dateString);
        const diffInMinutes = Math.floor((now - notificationDate) / (1000 * 60));
        
        if (diffInMinutes < 1) return 'همین الان';
        if (diffInMinutes < 60) return `${diffInMinutes} دقیقه پیش`;
        
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours} ساعت پیش`;
        
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays} روز پیش`;
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'order':
                return '📦';
            case 'payment':
                return '💰';
            case 'delivery':
                return '🚚';
            case 'system':
                return '🔔';
            default:
                return '📌';
        }
    };

    return (
        <div className="relative">
            {/* Bell Icon */}
            <button
                ref={bellRef}
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
            >
                <svg
                    className="w-5 h-5 sm:w-6 sm:h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-5-5V9a6 6 0 10-12 0v3l-5 5h5m7 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                </svg>
                
                {/* Badge */}
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -left-0.5 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div
                    ref={dropdownRef}
                    className="absolute -left-11 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden"
                >
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm sm:text-base font-semibold text-gray-900">اعلان‌ها</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllAsRead}
                                    className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-medium"
                                >
                                    علامت‌گذاری همه به عنوان خوانده شده
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="max-h-80 overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                <span className="mr-2 text-sm text-gray-500">در حال بارگیری...</span>
                            </div>
                        ) : recentNotifications && recentNotifications.length > 0 ? (
                            <div className="divide-y divide-gray-100">
                                {recentNotifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`px-4 py-3 hover:bg-gray-50 transition-colors ${
                                            !notification.isRead ? 'bg-blue-50' : ''
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            {/* Icon */}
                                            <div className="flex-shrink-0 mt-0.5">
                                                <span className="text-lg">
                                                    {getNotificationIcon(notification.type)}
                                                </span>
                                            </div>
                                            
                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-sm ${
                                                            !notification.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'
                                                        }`}>
                                                            {notification.title}
                                                        </p>
                                                        <p className="text-xs sm:text-sm text-gray-500 mt-1 line-clamp-2">
                                                            {notification.message}
                                                        </p>
                                                        <p className="text-xs text-gray-400 mt-1">
                                                            {formatTimeAgo(notification.createdAt)}
                                                        </p>
                                                    </div>
                                                    
                                                    {/* Actions */}
                                                    <div className="flex items-center gap-1 mr-2">
                                                        {!notification.isRead && (
                                                            <button
                                                                onClick={() => handleMarkAsRead(notification.id)}
                                                                className="p-1 text-gray-400 hover:text-blue-600 rounded"
                                                                title="علامت‌گذاری به عنوان خوانده شده"
                                                            >
                                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleDeleteNotification(notification.id)}
                                                            className="p-1 text-gray-400 hover:text-red-600 rounded"
                                                            title="حذف اعلان"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                                
                                                {/* Unread indicator */}
                                                {!notification.isRead && (
                                                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                                                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="px-4 py-8 text-center">
                                <div className="text-4xl mb-2">🔔</div>
                                <p className="text-sm text-gray-500">هیچ اعلانی وجود ندارد</p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {recentNotifications && recentNotifications.length > 0 && (
                        <div className="px-4 py-3 border-t border-gray-100">
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    navigate('/notifications');
                                }}
                                className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                            >
                                مشاهده همه اعلان‌ها
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div className="absolute left-0 mt-2 w-80 bg-red-50 border border-red-200 rounded-lg p-3 z-50">
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}
        </div>
    );
};

export default NotificationBell; 