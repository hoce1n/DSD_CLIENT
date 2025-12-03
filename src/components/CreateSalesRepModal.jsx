import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Building,
  CreditCard,
  Save
} from 'lucide-react';
import PersianDatePicker from './PersianDatePicker';
import { apiHelpers } from '../services/api';

const CreateSalesRepModal = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [formData, setFormData] = useState({
    userId: '',
    name: '',
    phone: '',
    email: '',
    nationalCode: '',
    address: '',
    birthDate: '',
    hireDate: new Date().toISOString().split('T')[0],
    region: ''
  });

  const [errors, setErrors] = useState({});

  // بارگیری کاربران قابل انتخاب
  const loadAvailableUsers = async () => {
    try {
      const response = await apiHelpers.get('/salesreps/available-users');
      if (response.success) {
        setAvailableUsers(response.data);
      }
    } catch (error) {
      console.error('Error loading available users:', error);
      toast.error('خطا در بارگیری کاربران');
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAvailableUsers();
      // Reset form
      setFormData({
        userId: '',
        name: '',
        phone: '',
        email: '',
        nationalCode: '',
        address: '',
        birthDate: '',
        hireDate: new Date().toISOString().split('T')[0],
        region: ''
      });
      setErrors({});
    }
  }, [isOpen]);

  // Handle user selection
  const handleUserChange = (e) => {
    const userId = parseInt(e.target.value);
    const selectedUser = availableUsers.find(u => u.id === userId);
    
    setFormData(prev => ({
      ...prev,
      userId: userId,
      name: selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName}` : '',
      email: selectedUser?.email || '',
      phone: selectedUser?.phoneNumber || ''
    }));
  };

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

    if (!formData.userId) {
      newErrors.userId = 'انتخاب کاربر الزامی است';
    }

    // Name validation - Required, MaxLength=100
    if (!formData.name.trim()) {
      newErrors.name = 'نام و نام خانوادگی الزامی است';
    } else if (formData.name.length > 100) {
      newErrors.name = 'نام نمی‌تواند بیشتر از 100 کاراکتر باشد';
    }

    // Phone validation - Required, MaxLength=20
    if (!formData.phone.trim()) {
      newErrors.phone = 'شماره تلفن الزامی است';
    } else if (formData.phone.length > 20) {
      newErrors.phone = 'شماره تلفن نمی‌تواند بیشتر از 20 کاراکتر باشد';
    }

    // Email validation - Optional, MaxLength=100
    if (formData.email && formData.email.length > 100) {
      newErrors.email = 'ایمیل نمی‌تواند بیشتر از 100 کاراکتر باشد';
    } else if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'فرمت ایمیل نادرست است';
    }

    // NationalCode validation - Required, MaxLength=20
    if (!formData.nationalCode.trim()) {
      newErrors.nationalCode = 'کد ملی الزامی است';
    } else if (formData.nationalCode.length > 20) {
      newErrors.nationalCode = 'کد ملی نمی‌تواند بیشتر از 20 کاراکتر باشد';
    }

    // Address validation - Optional, MaxLength=500
    if (formData.address && formData.address.length > 500) {
      newErrors.address = 'آدرس نمی‌تواند بیشتر از 500 کاراکتر باشد';
    }

    // Region validation - Optional, MaxLength=100
    if (formData.region && formData.region.length > 100) {
      newErrors.region = 'منطقه نمی‌تواند بیشتر از 100 کاراکتر باشد';
    }

    // HireDate validation - Required
    if (!formData.hireDate) {
      newErrors.hireDate = 'تاریخ استخدام الزامی است';
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

    setLoading(true);

    try {
      const submitData = {
        ...formData,
        userId: parseInt(formData.userId),
        birthDate: formData.birthDate ? new Date(formData.birthDate).toISOString() : null,
        hireDate: new Date(formData.hireDate).toISOString()
      };

      await apiHelpers.post('/salesreps', submitData);
      
      toast.success('کاربر با موفقیت به ویزیتور تبدیل شد');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.message || 'خطا در تبدیل کاربر به ویزیتور');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">تبدیل کاربر به ویزیتور</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Info Box */}
        <div className="p-4 bg-blue-50 border-r-4 border-blue-400 mx-6 mt-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="mr-3">
                             <p className="text-sm text-blue-700">
                 <strong>نکته:</strong> کاربران عادی که ثبت نام کرده‌اند را می‌توانید به ویزیتور تبدیل کنید.
                 <br />
                 با تبدیل، نقش کاربر به "ویزیتور" تغییر می‌کند و اطلاعات ویزیتور ثبت می‌شود.
               </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* User Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline ml-1" />
              انتخاب کاربر عادی *
            </label>
            <select
              value={formData.userId}
              onChange={handleUserChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.userId ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">انتخاب کاربر...</option>
              {availableUsers.map(user => (
                <option key={user.id} value={user.id}>
                  {user.fullName} ({user.username}) - {user.email}
                </option>
              ))}
            </select>
            {availableUsers.length === 0 && (
              <p className="text-amber-600 text-sm mt-1">
                هیچ کاربر عادی برای تبدیل به ویزیتور یافت نشد. کاربران باید ابتدا ثبت نام کنند.
              </p>
            )}
            {errors.userId && (
              <p className="text-red-500 text-sm mt-1">{errors.userId}</p>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline ml-1" />
              نام و نام خانوادگی *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              maxLength={100}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="نام کامل ویزیتور"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Phone and Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline ml-1" />
                شماره تلفن *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                maxLength={20}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="شماره تلفن"
              />
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline ml-1" />
                ایمیل
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                maxLength={100}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="example@domain.com"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>
          </div>

          {/* National Code and Region */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CreditCard className="w-4 h-4 inline ml-1" />
                کد ملی *
              </label>
              <input
                type="text"
                name="nationalCode"
                value={formData.nationalCode}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.nationalCode ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="کد ملی"
                maxLength={20}
              />
              {errors.nationalCode && (
                <p className="text-red-500 text-sm mt-1">{errors.nationalCode}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building className="w-4 h-4 inline ml-1" />
                منطقه
              </label>
              <input
                type="text"
                name="region"
                value={formData.region}
                onChange={handleInputChange}
                maxLength={100}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.region ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="منطقه کاری"
              />
              {errors.region && (
                <p className="text-red-500 text-sm mt-1">{errors.region}</p>
              )}
            </div>
          </div>

          {/* Birth Date and Hire Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline ml-1" />
                تاریخ تولد
              </label>
              <PersianDatePicker
                value={formData.birthDate}
                onChange={(date) => setFormData(prev => ({...prev, birthDate: date}))}
                placeholder="انتخاب تاریخ تولد"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline ml-1" />
                تاریخ استخدام *
              </label>
              <PersianDatePicker
                value={formData.hireDate}
                onChange={(date) => setFormData(prev => ({...prev, hireDate: date}))}
                placeholder="انتخاب تاریخ استخدام"
                className={`w-full ${errors.hireDate ? 'border-red-500' : ''}`}
              />
              {errors.hireDate && (
                <p className="text-red-500 text-sm mt-1">{errors.hireDate}</p>
              )}
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline ml-1" />
              آدرس
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              rows={3}
              maxLength={500}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.address ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="آدرس کامل"
            />
            {errors.address && (
              <p className="text-red-500 text-sm mt-1">{errors.address}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {loading ? 'در حال تبدیل...' : 'تبدیل به ویزیتور'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              انصراف
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSalesRepModal; 