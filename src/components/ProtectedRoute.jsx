import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, isAuthenticated, needsCompleteProfile } = useSelector((state) => state.auth);
  const location = useLocation();

  // اگر کاربر لاگین نکرده
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // اگر کاربر باید پروفایل رو تکمیل کنه و الان در صفحه complete-profile نیست
  // فقط برای کاربران با نقش User
  if (needsCompleteProfile && user?.role === 'User' && location.pathname !== '/complete-profile') {
    return <Navigate to="/complete-profile" replace />;
  }

  // اگر نقش کاربر مجاز نیست
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            دسترسی محدود
          </h2>
          <p className="text-gray-600 mb-6">
            شما به این بخش دسترسی ندارید. لطفاً با مدیر سیستم تماس بگیرید.
          </p>
          <div className="text-sm text-gray-500">
            <p>نقش فعلی شما: <span className="font-medium">{user?.role || 'نامشخص'}</span></p>
            <p>نقش‌های مجاز: <span className="font-medium">{allowedRoles.join(', ')}</span></p>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute; 