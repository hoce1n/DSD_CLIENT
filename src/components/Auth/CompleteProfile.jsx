import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-hot-toast';
import { 
  FaStore, 
  FaMapMarkerAlt, 
  FaPhone, 
  FaCity, 
  FaUser, 
  FaArrowRight, 
  FaSpinner,
  FaCheckCircle 
} from 'react-icons/fa';
import { authService } from '../../services/api';
import { login } from '../../store/slices/authSlice';

const CompleteProfile = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    storeTitle: '',
    address: '',
    city: '',
    phone: '',
    area: '',
    description: ''
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Load existing profile data
  useEffect(() => {
    const loadProfile = async () => {
      try {
        if (isAuthenticated) {
          const response = await authService.getProfile();
          if (response.customer) {
            // Check if customer phone is a placeholder (contains "تلفن-")
            const customerPhone = response.customer.phone || '';
            const isPhonePlaceholder = customerPhone.includes('تلفن-');
            
            // Use user's phone number if customer phone is empty or placeholder
            const phoneToUse = (customerPhone && !isPhonePlaceholder) 
              ? customerPhone 
              : response.user?.phoneNumber || '';

            setFormData({
              storeTitle: response.customer.storeTitle || '',
              address: response.customer.address || '',
              city: response.customer.city || '',
              phone: phoneToUse,
              area: response.customer.area || '',
              description: response.customer.description || ''
            });
          }
        }
      } catch (error) {
        console.error('خطا در بارگیری اطلاعات پروفایل:', error);
        toast.error('خطا در بارگیری اطلاعات پروفایل');
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadProfile();
  }, [isAuthenticated]);

  // Redirect if not authenticated or doesn't need profile completion
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // فقط کاربران با نقش User باید فرم تکمیل پروفایل را ببینند
    if (user?.role !== 'User') {
      navigate('/dashboard');
      return;
    }

    if (!authService.needsCompleteProfile()) {
      navigate('/dashboard');
      return;
    }
  }, [isAuthenticated, user, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.storeTitle.trim()) {
      newErrors.storeTitle = 'نام فروشگاه الزامی است';
    } else if (formData.storeTitle.length < 2) {
      newErrors.storeTitle = 'نام فروشگاه باید حداقل ۲ کاراکتر باشد';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'شماره تلفن الزامی است';
    } else if (!/^09\d{9}$/.test(formData.phone)) {
      newErrors.phone = 'شماره تلفن معتبر نیست (مثال: 09123456789)';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'شهر الزامی است';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'آدرس الزامی است';
    } else if (formData.address.length < 10) {
      newErrors.address = 'آدرس باید حداقل ۱۰ کاراکتر باشد';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('لطفاً اطلاعات را کامل و صحیح وارد کنید');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.completeProfile(formData);
      
      toast.success('پروفایل شما با موفقیت تکمیل شد! 🎉');
      
      // Update user info in Redux store
      if (response.user) {
        dispatch(login(response.user));
      }
      
      // Redirect to dashboard
      navigate('/dashboard');
      
    } catch (error) {
      console.error('خطا در تکمیل پروفایل:', error);
      toast.error(error.message || 'خطا در تکمیل پروفایل');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipForNow = () => {
    toast.success('می‌توانید بعداً پروفایل خود را تکمیل کنید');
    navigate('/dashboard');
  };

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">در حال بارگیری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <FaStore className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            تکمیل اطلاعات فروشگاه
          </h1>
          <p className="text-gray-600 text-lg">
            سلام {user?.fullName || user?.username}! برای استفاده کامل از سیستم، لطفاً اطلاعات فروشگاه خود را تکمیل کنید.
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                <FaCheckCircle />
              </div>
              <div className="w-16 h-1 bg-green-500"></div>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                2
              </div>
              <div className="w-16 h-1 bg-gray-300"></div>
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-sm font-bold">
                3
              </div>
            </div>
          </div>
          <div className="flex justify-center mt-2">
            <div className="flex space-x-8 text-sm text-gray-600">
              <span className="text-green-600 font-semibold">ثبت نام</span>
              <span className="text-blue-600 font-semibold">تکمیل پروفایل</span>
              <span>شروع کار</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white shadow-2xl rounded-2xl overflow-hidden">
          <div className="px-8 py-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Store Title */}
              <div>
                <label htmlFor="storeTitle" className="block text-sm font-semibold text-gray-700 mb-2">
                  <FaStore className="inline-block ml-2 text-blue-600" />
                  نام فروشگاه *
                </label>
                <input
                  type="text"
                  id="storeTitle"
                  name="storeTitle"
                  value={formData.storeTitle}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg text-right focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    errors.storeTitle ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="مثال: فروشگاه الماس"
                  dir="rtl"
                />
                {errors.storeTitle && (
                  <p className="mt-1 text-sm text-red-600 text-right">{errors.storeTitle}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                  <FaPhone className="inline-block ml-2 text-green-600" />
                  شماره تلفن *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg text-right focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    errors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="09123456789"
                  dir="rtl"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600 text-right">{errors.phone}</p>
                )}
              </div>

              {/* City */}
              <div>
                <label htmlFor="city" className="block text-sm font-semibold text-gray-700 mb-2">
                  <FaCity className="inline-block ml-2 text-purple-600" />
                  شهر *
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg text-right focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    errors.city ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="مثال: تهران"
                  dir="rtl"
                />
                {errors.city && (
                  <p className="mt-1 text-sm text-red-600 text-right">{errors.city}</p>
                )}
              </div>

              {/* Area */}
              <div>
                <label htmlFor="area" className="block text-sm font-semibold text-gray-700 mb-2">
                  <FaMapMarkerAlt className="inline-block ml-2 text-red-600" />
                  منطقه
                </label>
                <input
                  type="text"
                  id="area"
                  name="area"
                  value={formData.area}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-right focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="مثال: منطقه ۱"
                  dir="rtl"
                />
              </div>

              {/* Address */}
              <div>
                <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-2">
                  <FaMapMarkerAlt className="inline-block ml-2 text-orange-600" />
                  آدرس کامل *
                </label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={3}
                  className={`w-full px-4 py-3 border rounded-lg text-right focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none ${
                    errors.address ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="آدرس کامل فروشگاه خود را وارد کنید..."
                  dir="rtl"
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600 text-right">{errors.address}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
                  <FaUser className="inline-block ml-2 text-indigo-600" />
                  توضیحات اضافی
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-right focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  placeholder="اطلاعات اضافی در مورد فروشگاه یا فعالیت خود..."
                  dir="rtl"
                />
              </div>

              {/* Submit Button */}
              <div className="flex space-x-4 pt-6">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <FaSpinner className="animate-spin ml-2" />
                      در حال ذخیره...
                    </>
                  ) : (
                    <>
                      تکمیل پروفایل
                      <FaArrowRight className="mr-2" />
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleSkipForNow}
                  disabled={isLoading}
                  className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50"
                >
                  بعداً تکمیل می‌کنم
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            با تکمیل این اطلاعات، تجربه بهتری از سیستم خواهید داشت و قابلیت‌های بیشتری در اختیار شما قرار می‌گیرد.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfile; 