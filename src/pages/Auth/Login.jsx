import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { loginUser, clearError } from '../../store/slices/authSlice';
import { Eye, EyeOff, User, Lock, LogIn, ShoppingCart } from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error, isAuthenticated, needsCompleteProfile, user } = useSelector((state) => state.auth);

  // Check for registration success message
  const registrationMessage = location.state?.message;
  const registeredUsername = location.state?.registeredUsername;

  useEffect(() => {
    if (isAuthenticated) {
      // Check if user needs to complete profile (only for User role)
      if (needsCompleteProfile && user?.role === 'User') {
        navigate('/complete-profile');
      } else {
        navigate('/dashboard');
      }
    }
  }, [isAuthenticated, needsCompleteProfile, user, navigate]);

  useEffect(() => {
    // Clear error when component mounts
    dispatch(clearError());
    
    // Set username if coming from registration
    if (registeredUsername) {
      setFormData(prev => ({
        ...prev,
        username: registeredUsername
      }));
    }
  }, [dispatch, registeredUsername]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(loginUser(formData));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-sm sm:max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
            <ShoppingCart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold heading text-gray-800 mb-2">
            سامانه سفارش‌یار
          </h1>
          <p className="text-gray-600">
            لطفاً برای ورود به سیستم اطلاعات خود را وارد کنید
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Registration Success Message */}
            {registrationMessage && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-500 rounded-full mr-3 flex-shrink-0"></div>
                  {registrationMessage}
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-red-500 rounded-full mr-3 flex-shrink-0"></div>
                  {error}
                </div>
              </div>
            )}

            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                نام کاربری
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="block w-full pr-10 pl-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-right bg-gray-50 focus:bg-white"
                  placeholder="نام کاربری خود را وارد کنید"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                رمز عبور
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="block w-full pr-10 pl-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-right bg-gray-50 focus:bg-white"
                  placeholder="رمز عبور خود را وارد کنید"
                  dir="ltr"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 left-0 pl-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg text-white text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:ring-blue-500 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
              }`}
            >
              {loading ? (
                <div className="flex items-center">
                  در حال ورود...
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                </div>
              ) : (
                <div className="flex items-center">
                  <LogIn className="w-5 h-5 ml-2" />
                  ورود به سیستم
                </div>
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              حساب کاربری ندارید؟{' '}
              <Link
                to="/register"
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                ثبت نام کنید
              </Link>
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>© ۱۴۰۳ سامانه سفارش‌یار DSD. تمامی حقوق محفوظ است.</p>
        </div>
      </div>
    </div>
  );
};

export default Login; 