import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  FaUser, 
  FaEdit, 
  FaSave, 
  FaTimes, 
  FaStore, 
  FaMapMarkerAlt, 
  FaPhone, 
  FaEnvelope,
  FaCity,
  FaInfoCircle,
  FaCalendarAlt,
  FaCrown
} from 'react-icons/fa';
import { authService } from '../../services/api';
import { login } from '../../store/slices/authSlice';
import DigitalSignature from '../../components/DigitalSignature';

const Profile = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileData, setProfileData] = useState({
    user: null,
    customer: null
  });

  const [editFormData, setEditFormData] = useState({
    storeTitle: '',
    address: '',
    city: '',
    phone: '',
    area: '',
    description: ''
  });

  const [errors, setErrors] = useState({});

  // Handle signature update
  const handleSignatureUpdate = async (newSignatureUrl) => {
    // Update local state immediately for better UX
    setProfileData(prev => ({
      ...prev,
      user: {
        ...prev.user,
        signatureImageUrl: newSignatureUrl
      }
    }));

    // Also reload profile data from server to ensure consistency
    try {
      const response = await authService.getProfile();
      setProfileData(response);
    } catch (error) {
      console.error('خطا در بارگیری مجدد اطلاعات پروفایل:', error);
    }
  };

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await authService.getProfile();
        setProfileData(response);
        
        if (response.customer) {
          // Check if customer phone is a placeholder (contains "تلفن-")
          const customerPhone = response.customer.phone || '';
          const isPhonePlaceholder = customerPhone.includes('تلفن-');
          
          // Use user's phone number if customer phone is empty or placeholder
          const phoneToUse = (customerPhone && !isPhonePlaceholder) 
            ? customerPhone 
            : response.user?.phoneNumber || '';

          setEditFormData({
            storeTitle: response.customer.storeTitle || '',
            address: response.customer.address || '',
            city: response.customer.city || '',
            phone: phoneToUse,
            area: response.customer.area || '',
            description: response.customer.description || ''
          });
        }
      } catch (error) {
        console.error('خطا در بارگیری اطلاعات پروفایل:', error);
        toast.error('خطا در بارگیری اطلاعات پروفایل');
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
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

    if (!editFormData.storeTitle.trim()) {
      newErrors.storeTitle = 'نام فروشگاه الزامی است';
    }

    if (!editFormData.phone.trim()) {
      newErrors.phone = 'شماره تلفن الزامی است';
    } else if (!/^09\d{9}$/.test(editFormData.phone)) {
      newErrors.phone = 'شماره تلفن معتبر نیست (مثال: 09123456789)';
    }

    if (!editFormData.address.trim()) {
      newErrors.address = 'آدرس الزامی است';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('لطفاً اطلاعات را کامل و صحیح وارد کنید');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.updateProfile(editFormData);
      
      // Update local profile data
      setProfileData(prev => ({
        ...prev,
        customer: {
          ...prev.customer,
          ...editFormData
        }
      }));

      // Update user info in Redux store if needed
      if (response.user) {
        dispatch(login(response.user));
      }

      setIsEditing(false);
      toast.success('پروفایل با موفقیت به‌روزرسانی شد! 🎉');
      
    } catch (error) {
      console.error('خطا در به‌روزرسانی پروفایل:', error);
      toast.error(error.message || 'خطا در به‌روزرسانی پروفایل');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form data
    if (profileData.customer) {
      const customerPhone = profileData.customer.phone || '';
      const isPhonePlaceholder = customerPhone.includes('تلفن-');
      const phoneToUse = (customerPhone && !isPhonePlaceholder) 
        ? customerPhone 
        : profileData.user?.phoneNumber || '';

      setEditFormData({
        storeTitle: profileData.customer.storeTitle || '',
        address: profileData.customer.address || '',
        city: profileData.customer.city || '',
        phone: phoneToUse,
        area: profileData.customer.area || '',
        description: profileData.customer.description || ''
      });
    }
    setErrors({});
    setIsEditing(false);
  };

  const getRoleLabel = (role) => {
    const roleLabels = {
      'Admin': 'مدیر سیستم',
      'Manager': 'مدیر فروش',
      'SalesRep': 'نماینده فروش',
      'User': 'کاربر عادی'
    };
    return roleLabels[role] || role;
  };

  const getRoleIcon = (role) => {
    if (role === 'Admin') return <FaCrown className="text-yellow-500" />;
    if (role === 'Manager') return <FaUser className="text-blue-500" />;
    if (role === 'SalesRep') return <FaUser className="text-green-500" />;
    return <FaUser className="text-gray-500" />;
  };

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm sm:text-base">در حال بارگیری اطلاعات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 p-3 sm:p-4">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
              <FaUser className="text-lg sm:text-2xl text-white" />
            </div>
            <div className="mr-3 sm:mr-4 min-w-0 flex-1">
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                {profileData.user?.firstName} {profileData.user?.lastName}
              </h1>
              <div className="flex items-center mt-1">
                <span className="text-sm sm:text-base">{getRoleIcon(profileData.user?.role)}</span>
                <span className="mr-2 text-gray-600 text-sm sm:text-base truncate">
                  {getRoleLabel(profileData.user?.role)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center justify-center px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base min-h-[44px] flex-1 sm:flex-initial"
              >
                <FaEdit className="ml-2 text-sm" />
                <span className="hidden sm:inline">ویرایش پروفایل</span>
                <span className="sm:hidden">ویرایش</span>
              </button>
            ) : (
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="flex items-center justify-center px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-sm sm:text-base min-h-[44px] flex-1 sm:flex-initial"
                >
                  <FaSave className="ml-2 text-sm" />
                  {isLoading ? 'در حال ذخیره...' : 'ذخیره'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="flex items-center justify-center px-3 sm:px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm sm:text-base min-h-[44px] flex-1 sm:flex-initial"
                >
                  <FaTimes className="ml-2 text-sm" />
                  انصراف
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* User Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center mb-4">
            <FaUser className="text-blue-600 text-lg sm:text-xl ml-2 sm:ml-3" />
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">اطلاعات کاربری</h2>
          </div>
          
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">نام کاربری</label>
              <div className="p-2 sm:p-3 bg-gray-50 rounded-lg border">
                <span className="text-gray-900 text-sm sm:text-base break-all">{profileData.user?.username}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ایمیل</label>
              <div className="p-2 sm:p-3 bg-gray-50 rounded-lg border flex items-center">
                <FaEnvelope className="text-gray-400 ml-2 text-sm sm:text-base flex-shrink-0" />
                <span className="text-gray-900 text-sm sm:text-base break-all">{profileData.user?.email}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">شماره تلفن شخصی</label>
              <div className="p-2 sm:p-3 bg-gray-50 rounded-lg border flex items-center">
                <FaPhone className="text-gray-400 ml-2 text-sm sm:text-base flex-shrink-0" />
                <span className="text-gray-900 text-sm sm:text-base">{profileData.user?.phoneNumber || 'وارد نشده'}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">تاریخ عضویت</label>
              <div className="p-2 sm:p-3 bg-gray-50 rounded-lg border flex items-center">
                <FaCalendarAlt className="text-gray-400 ml-2 text-sm sm:text-base flex-shrink-0" />
                <span className="text-gray-900 text-sm sm:text-base">
                  {profileData.user?.createdAt ? new Date(profileData.user.createdAt).toLocaleDateString('fa-IR') : 'نامشخص'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Store Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center mb-4">
            <FaStore className="text-green-600 text-lg sm:text-xl ml-2 sm:ml-3" />
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">اطلاعات فروشگاه</h2>
          </div>

          {profileData.customer ? (
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نام فروشگاه *</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="storeTitle"
                    value={editFormData.storeTitle}
                    onChange={handleInputChange}
                    className={`w-full p-2 sm:p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base ${
                      errors.storeTitle ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    dir="rtl"
                  />
                ) : (
                  <div className="p-2 sm:p-3 bg-gray-50 rounded-lg border flex items-center">
                    <FaStore className="text-gray-400 ml-2 text-sm sm:text-base flex-shrink-0" />
                    <span className="text-gray-900 text-sm sm:text-base break-words">{profileData.customer.storeTitle}</span>
                  </div>
                )}
                {errors.storeTitle && (
                  <p className="mt-1 text-sm text-red-600">{errors.storeTitle}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">شماره تلفن فروشگاه *</label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={editFormData.phone}
                    onChange={handleInputChange}
                    className={`w-full p-2 sm:p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base ${
                      errors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    dir="rtl"
                  />
                ) : (
                  <div className="p-2 sm:p-3 bg-gray-50 rounded-lg border flex items-center">
                    <FaPhone className="text-gray-400 ml-2 text-sm sm:text-base flex-shrink-0" />
                    <span className="text-gray-900 text-sm sm:text-base">{profileData.customer.phone}</span>
                  </div>
                )}
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">شهر</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="city"
                    value={editFormData.city}
                    onChange={handleInputChange}
                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                    dir="rtl"
                  />
                ) : (
                  <div className="p-2 sm:p-3 bg-gray-50 rounded-lg border flex items-center">
                    <FaCity className="text-gray-400 ml-2 text-sm sm:text-base flex-shrink-0" />
                    <span className="text-gray-900 text-sm sm:text-base">{profileData.customer.city || 'وارد نشده'}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">منطقه</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="area"
                    value={editFormData.area}
                    onChange={handleInputChange}
                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                    dir="rtl"
                  />
                ) : (
                  <div className="p-2 sm:p-3 bg-gray-50 rounded-lg border flex items-center">
                    <FaMapMarkerAlt className="text-gray-400 ml-2 text-sm sm:text-base flex-shrink-0" />
                    <span className="text-gray-900 text-sm sm:text-base">{profileData.customer.area || 'وارد نشده'}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">آدرس کامل *</label>
                {isEditing ? (
                  <textarea
                    name="address"
                    value={editFormData.address}
                    onChange={handleInputChange}
                    rows={3}
                    className={`w-full p-2 sm:p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none text-sm sm:text-base ${
                      errors.address ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    dir="rtl"
                  />
                ) : (
                  <div className="p-2 sm:p-3 bg-gray-50 rounded-lg border min-h-[80px]">
                    <span className="text-gray-900 text-sm sm:text-base break-words">{profileData.customer.address}</span>
                  </div>
                )}
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">توضیحات اضافی</label>
                {isEditing ? (
                  <textarea
                    name="description"
                    value={editFormData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none text-sm sm:text-base"
                    dir="rtl"
                  />
                ) : (
                  <div className="p-2 sm:p-3 bg-gray-50 rounded-lg border flex items-start min-h-[80px]">
                    <FaInfoCircle className="text-gray-400 ml-2 mt-1 text-sm sm:text-base flex-shrink-0" />
                    <span className="text-gray-900 text-sm sm:text-base break-words">
                      {profileData.customer.description || 'توضیحات اضافی وارد نشده'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 sm:py-8">
              <FaStore className="text-gray-400 text-3xl sm:text-4xl mx-auto mb-4" />
              <p className="text-gray-600 text-sm sm:text-base mb-4">اطلاعات فروشگاه تکمیل نشده است</p>
              <button
                onClick={() => navigate('/complete-profile')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base min-h-[44px]"
              >
                تکمیل اطلاعات فروشگاه
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Digital Signature Section */}
      <div className="mt-4 sm:mt-6">
        <DigitalSignature 
          currentSignature={profileData.user?.signatureImageUrl}
          onSignatureUpdate={handleSignatureUpdate}
        />
      </div>
    </div>
  );
};

export default Profile; 