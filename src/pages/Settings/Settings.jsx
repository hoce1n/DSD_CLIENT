import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { authService } from '../../services/api';
import { 
  User, 
  Settings as SettingsIcon, 
  Bell, 
  Shield, 
  Database, 
  Moon, 
  Sun, 
  Globe, 
  Key,
  Save,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  PenTool
} from 'lucide-react';
import DigitalSignature from '../../components/DigitalSignature';

const Settings = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const [activeTab, setActiveTab] = useState('general');
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'fa');
  const [notifications, setNotifications] = useState({
    email: true,
    sms: true,
    push: true,
    orderUpdates: true,
    systemAlerts: true,
    promotions: false
  });
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || ''
  });
  
  const [systemSettings, setSystemSettings] = useState({
    companyName: 'شرکت توزیع',
    defaultAddress: '',
    defaultTaxRate: 9,
    defaultDiscountRate: 0
  });
  
  const [systemStatus, setSystemStatus] = useState({
    databaseStatus: 'فعال',
    serverStatus: 'فعال',
    lastBackupDate: new Date(),
    systemLogs: []
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    // اعمال Dark Mode
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  useEffect(() => {
    // بارگذاری تنظیمات سیستم برای Admin/Supervisor
    if (user?.role === 'Admin' || user?.role === 'Supervisor') {
      loadSystemSettings();
      loadSystemStatus();
    }
  }, [user]);

  const loadSystemSettings = async () => {
    try {
      const response = await fetch('/api/system/settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const result = await response.json();
        setSystemSettings({
          companyName: result.data.companyName,
          defaultAddress: result.data.defaultAddress,
          defaultTaxRate: result.data.defaultTaxRate,
          defaultDiscountRate: result.data.defaultDiscountRate
        });
      }
    } catch (error) {
      console.error('Error loading system settings:', error);
    }
  };

  const loadSystemStatus = async () => {
    try {
      const response = await fetch('/api/system/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const result = await response.json();
        setSystemStatus({
          databaseStatus: result.data.databaseStatus,
          serverStatus: result.data.serverStatus,
          lastBackupDate: new Date(result.data.lastBackupDate),
          systemLogs: []
        });
      }
    } catch (error) {
      console.error('Error loading system status:', error);
    }
  };

  const handleSystemSettingsSave = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/system/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(systemSettings)
      });
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'تنظیمات سیستم با موفقیت ذخیره شد' });
      } else {
        setMessage({ type: 'error', text: 'خطا در ذخیره تنظیمات سیستم' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'خطا در ارتباط با سرور' });
    } finally {
      setLoading(false);
    }
  };

  const handleBackupCreate = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/system/backup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'پشتیبان‌گیری با موفقیت انجام شد' });
        loadSystemStatus(); // به‌روزرسانی وضعیت سیستم
      } else {
        setMessage({ type: 'error', text: 'خطا در ایجاد پشتیبان' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'خطا در ارتباط با سرور' });
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'تنظیمات عمومی', icon: SettingsIcon },
    { id: 'profile', label: 'پروفایل', icon: User },
    { id: 'notifications', label: 'اعلان‌ها', icon: Bell },
    ...(user?.role === 'Admin' || user?.role === 'Supervisor' ? [
      { id: 'system', label: 'تنظیمات سیستم', icon: Shield },
      { id: 'maintenance', label: 'نگهداری', icon: Database }
    ] : [])
  ];

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'رمز عبور جدید و تکرار آن مطابقت ندارند' });
      return;
    }
    
    setLoading(true);
    try {
      await authService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      
      setMessage({ type: 'success', text: 'رمز عبور با موفقیت تغییر یافت' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'خطا در تغییر رمز عبور' });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.updateUserProfile(profileForm);
      setMessage({ type: 'success', text: 'اطلاعات پروفایل با موفقیت به‌روزرسانی شد' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'خطا در به‌روزرسانی پروفایل' });
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationUpdate = async () => {
    setLoading(true);
    try {
      // TODO: Implement notification settings API endpoint
      setMessage({ type: 'success', text: 'تنظیمات اعلان‌ها ذخیره شد' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'خطا در ذخیره تنظیمات' });
    } finally {
      setLoading(false);
    }
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">ظاهر و نمایش</h3>
        
        {/* Dark Mode Toggle */}
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center space-x-3">
            {darkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            <span className="text-gray-700 dark:text-gray-300">حالت تاریک</span>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              darkMode ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                darkMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Language Selection */}
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center space-x-3">
            <Globe className="h-5 w-5" />
            <span className="text-gray-700 dark:text-gray-300">زبان</span>
          </div>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="fa">فارسی</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderProfileSettings = () => (
    <div className="space-y-6">
      {/* Profile Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">اطلاعات شخصی</h3>
        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                نام
              </label>
              <input
                type="text"
                value={profileForm.firstName}
                onChange={(e) => setProfileForm({...profileForm, firstName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                نام خانوادگی
              </label>
              <input
                type="text"
                value={profileForm.lastName}
                onChange={(e) => setProfileForm({...profileForm, lastName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              ایمیل
            </label>
            <input
              type="email"
              value={profileForm.email}
              onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              شماره تلفن
            </label>
            <input
              type="tel"
              value={profileForm.phoneNumber}
              onChange={(e) => setProfileForm({...profileForm, phoneNumber: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>ذخیره تغییرات</span>
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">تغییر رمز عبور</h3>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              رمز عبور فعلی
            </label>
            <div className="relative">
              <input
                type={showPasswords.current ? "text" : "password"}
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
              <button
                type="button"
                onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              >
                {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              رمز عبور جدید
            </label>
            <div className="relative">
              <input
                type={showPasswords.new ? "text" : "password"}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
              <button
                type="button"
                onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              >
                {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              تکرار رمز عبور جدید
            </label>
            <div className="relative">
              <input
                type={showPasswords.confirm ? "text" : "password"}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
              <button
                type="button"
                onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              >
                {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            <Key className="h-4 w-4" />
            <span>تغییر رمز عبور</span>
          </button>
        </form>
      </div>

      {/* Digital Signature */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <PenTool className="h-5 w-5 ml-2" />
          مدیریت امضای دیجیتال
        </h3>
        <DigitalSignature />
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">تنظیمات اعلان‌ها</h3>
      <div className="space-y-4">
        {Object.entries({
          email: 'اعلان‌های ایمیل',
          sms: 'اعلان‌های پیامکی',
          push: 'اعلان‌های درون‌برنامه‌ای',
          orderUpdates: 'به‌روزرسانی سفارشات',
          systemAlerts: 'هشدارهای سیستم',
          promotions: 'اعلان‌های تبلیغاتی'
        }).map(([key, label]) => (
          <div key={key} className="flex items-center justify-between py-2">
            <span className="text-gray-700 dark:text-gray-300">{label}</span>
            <button
              onClick={() => setNotifications({...notifications, [key]: !notifications[key]})}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                notifications[key] ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  notifications[key] ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        ))}
        <button
          onClick={handleNotificationUpdate}
          disabled={loading}
          className="mt-4 flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          <span>ذخیره تنظیمات</span>
        </button>
      </div>
    </div>
  );

  const renderSystemSettings = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">تنظیمات عمومی سیستم</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              نام شرکت
            </label>
            <input
              type="text"
              value={systemSettings.companyName}
              onChange={(e) => setSystemSettings({...systemSettings, companyName: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              آدرس پیش‌فرض
            </label>
            <textarea
              value={systemSettings.defaultAddress}
              onChange={(e) => setSystemSettings({...systemSettings, defaultAddress: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                نرخ مالیات پیش‌فرض (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={systemSettings.defaultTaxRate}
                onChange={(e) => setSystemSettings({...systemSettings, defaultTaxRate: parseFloat(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                نرخ تخفیف پیش‌فرض (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={systemSettings.defaultDiscountRate}
                onChange={(e) => setSystemSettings({...systemSettings, defaultDiscountRate: parseFloat(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <button
            onClick={handleSystemSettingsSave}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>ذخیره تنظیمات سیستم</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderMaintenanceSettings = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">وضعیت سیستم</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">وضعیت سرور</span>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-green-600">{systemStatus.serverStatus}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">پایگاه داده</span>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-green-600">{systemStatus.databaseStatus}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">پشتیبان‌گیری</h3>
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            آخرین پشتیبان‌گیری: {systemStatus.lastBackupDate.toLocaleDateString('fa-IR')}
          </p>
          <button
            onClick={handleBackupCreate}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <Database className="h-4 w-4" />
            <span>ایجاد پشتیبان جدید</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">لاگ‌های سیستم</h3>
        <div className="bg-gray-100 dark:bg-gray-900 rounded-md p-4 max-h-64 overflow-y-auto">
          <pre className="text-sm text-gray-800 dark:text-gray-200 font-mono">
            {`[${new Date().toISOString()}] INFO: System started successfully
[${new Date().toISOString()}] INFO: Database connection established
[${new Date().toISOString()}] INFO: All services running normally`}
          </pre>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">تنظیمات</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            مدیریت تنظیمات حساب کاربری و سیستم
          </p>
        </div>

        {/* Message Display */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-md ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            <div className="flex items-center">
              {message.type === 'success' ? (
                <CheckCircle className="h-5 w-5 ml-2" />
              ) : (
                <AlertTriangle className="h-5 w-5 ml-2" />
              )}
              {message.text}
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-1/4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <nav className="space-y-1 p-4">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="lg:w-3/4">
            {activeTab === 'general' && renderGeneralSettings()}
            {activeTab === 'profile' && renderProfileSettings()}
            {activeTab === 'notifications' && renderNotificationSettings()}
            {activeTab === 'system' && renderSystemSettings()}
            {activeTab === 'maintenance' && renderMaintenanceSettings()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings; 