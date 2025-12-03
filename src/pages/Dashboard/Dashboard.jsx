import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchDashboardStats, fetchRecentOrders, fetchChartsData } from '../../store/slices/dashboardSlice';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import customerFinancialService from '../../services/customerFinancialService';
import salesRepService from '../../services/salesRepService';
import moment from 'moment-jalaali';
import {
  ShoppingCart,
  DollarSign,
  Users,
  Clock,
  TrendingUp,
  Package,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Target,
  Award,
  MapPin,
  Calendar,
  Truck,
  Eye
} from 'lucide-react';

// Set Jalaali mode
moment.loadPersian({usePersianDigits: false});

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { 
    stats, 
    userInfo, 
    recentOrders, 
    chartsData,
    statsLoading, 
    ordersLoading, 
    chartsLoading,
    statsError,
    ordersError 
  } = useSelector((state) => state.dashboard);
  const { user } = useSelector((state) => state.auth);

  // Check user role
  const isAdmin = user?.role === 'Admin';
  const isSupervisor = user?.role === 'Supervisor';
  const isSalesRep = user?.role === 'SalesRep';
  const isUser = user?.role === 'User';
  const isManager = isAdmin || isSupervisor;

  // State for user financial widget
  const [userBalance, setUserBalance] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  // SalesRep specific state
  const [salesRepStats, setSalesRepStats] = useState(null);
  const [salesRepOrders, setSalesRepOrders] = useState([]);
  const [salesRepProfile, setSalesRepProfile] = useState(null);
  const [salesRepLoading, setSalesRepLoading] = useState(false);

  // Load user financial data for regular users
  const loadUserBalance = async () => {
    if (!isUser) return;
    
    try {
      setBalanceLoading(true);
      const customerInfo = await customerFinancialService.getMyCustomerInfo();
      const balanceInfo = await customerFinancialService.getCustomerBalance(customerInfo.data.id);
      setUserBalance(balanceInfo.data);
    } catch (error) {
      console.error('Error loading user balance:', error);
    } finally {
      setBalanceLoading(false);
    }
  };

  // Load SalesRep dashboard data
  const loadSalesRepData = async () => {
    if (!isSalesRep) return;
    
    try {
      setSalesRepLoading(true);
      
      // بارگذاری موازی اطلاعات
      const [statsResponse, ordersResponse, profileResponse] = await Promise.all([
        salesRepService.getStatistics(),
        salesRepService.getAssignedOrders(),
        salesRepService.getProfile()
      ]);

      setSalesRepStats(statsResponse);
      setSalesRepOrders((ordersResponse.orders || ordersResponse.data || ordersResponse || []).slice(0, 5));
      setSalesRepProfile(profileResponse.data || profileResponse);
    } catch (error) {
      console.error('Error loading sales rep data:', error);
      toast.error('خطا در بارگذاری اطلاعات داشبورد');
    } finally {
      setSalesRepLoading(false);
    }
  };

  // Load dashboard data based on user role
  useEffect(() => {
    if (isSalesRep) {
      loadSalesRepData();
    } else {
      dispatch(fetchDashboardStats());
      dispatch(fetchRecentOrders(5));
      
      // Load user balance for regular users
      if (isUser) {
        loadUserBalance();
      }
      
      // Only load charts data for managers
      if (isManager) {
        dispatch(fetchChartsData());
      }
    }
  }, [dispatch, isManager, isSalesRep, isUser]);

  // Stats بر اساس نقش کاربر و داده‌های واقعی
  const getDashboardStats = () => {
    if (isSalesRep && salesRepStats) {
      // آمار ویزیتور
      return [
        {
          title: 'کل سفارشات',
          value: salesRepStats.totalOrders?.toString() || '0',
          change: '0',
          changeType: 'neutral',
          icon: ShoppingCart,
          color: 'bg-blue-500',
        },
        {
          title: 'تحویل شده',
          value: salesRepStats.deliveredOrders?.toString() || '0',
          change: salesRepStats.totalOrders > 0 ? `${Math.round((salesRepStats.deliveredOrders / salesRepStats.totalOrders) * 100)}%` : '0%',
          changeType: 'increase',
          icon: CheckCircle,
          color: 'bg-green-500',
        },
        {
          title: 'در حال تحویل',
          value: salesRepStats.onDeliveryOrders?.toString() || '0',
          change: 'نیاز به توجه',
          changeType: 'neutral',
          icon: Truck,
          color: 'bg-indigo-500',
        },
        {
          title: 'کل فروش',
          value: new Intl.NumberFormat('fa-IR', { 
            notation: 'compact',
            maximumFractionDigits: 1 
          }).format(salesRepStats.totalSales || 0),
          change: 'ریال',
          changeType: 'increase',
          icon: TrendingUp,
          color: 'bg-purple-500',
        },
      ];
    }

    if (isUser) {
      // کاربر عادی فقط سفارشات خودش را می‌بیند
      return [
        {
          title: 'سفارشات من',
          value: stats.totalUserOrders?.toString() || '0',
          change: stats.todayUserOrders > 0 ? `+${stats.todayUserOrders}` : '0',
          changeType: stats.todayUserOrders > 0 ? 'increase' : 'neutral',
          icon: ShoppingCart,
          color: 'bg-blue-500',
        },
        {
          title: 'سفارش امروز',
          value: stats.todayUserOrders?.toString() || '0',
          change: '0',
          changeType: 'neutral',
          icon: Clock,
          color: 'bg-orange-500',
        },
        {
          title: 'پروفایل',
          value: userInfo.isProfileComplete ? 'کامل' : 'ناقص',
          change: userInfo.isProfileComplete ? '✓' : '!',
          changeType: userInfo.isProfileComplete ? 'increase' : 'decrease',
          icon: CheckCircle,
          color: userInfo.isProfileComplete ? 'bg-green-500' : 'bg-red-500',
        },
        {
          title: 'وضعیت حساب',
          value: 'فعال',
          change: '✓',
          changeType: 'increase',
          icon: Users,
          color: 'bg-purple-500',
        },
      ];
    }
    
    // ادمین، سرپرست
    return [
      {
        title: 'کل سفارشات',
        value: stats.totalOrders?.toString() || '0',
        change: stats.todayOrders > 0 ? `+${stats.todayOrders}` : '0',
        changeType: stats.todayOrders > 0 ? 'increase' : 'neutral',
        icon: ShoppingCart,
        color: 'bg-blue-500',
      },
      {
        title: 'سفارشات امروز',
        value: stats.todayOrders?.toString() || '0',
        change: '0',
        changeType: 'neutral',
        icon: Clock,
        color: 'bg-orange-500',
      },
      {
        title: 'مشتریان',
        value: stats.totalCustomers?.toString() || '0',
        change: '0',
        changeType: 'neutral',
        icon: Users,
        color: 'bg-purple-500',
      },
      {
        title: 'محصولات',
        value: stats.totalProducts?.toString() || '0',
        change: '0',
        changeType: 'neutral',
        icon: Package,
        color: 'bg-green-500',
      },
    ];
  };

  const dashboardStats = getDashboardStats();

  // تبدیل وضعیت سفارش به فارسی
  const getStatusText = (status) => {
    const statusMap = {
      'Pending': 'در انتظار',
      'Confirmed': 'تایید شده',
      'InProgress': 'در حال آماده‌سازی',
      'OnDelivery': 'در حال تحویل',
      'Delivered': 'تحویل شده',
      'Cancelled': 'لغو شده'
    };
    return statusMap[status] || status;
  };

  // تعیین رنگ وضعیت
  const getStatusColor = (status) => {
    const colorMap = {
      'Pending': 'yellow',
      'Confirmed': 'blue',
      'InProgress': 'purple',
      'OnDelivery': 'indigo',
      'Delivered': 'green',
      'Cancelled': 'red'
    };
    return colorMap[status] || 'gray';
  };

  // فرمت مبلغ
  const formatCurrency = (amount) => {
    if (!amount) return '0 تومان';
    return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
  };

  // فرمت تاریخ فارسی
  const formatPersianDate = (dateString) => {
    if (!dateString) return '-';
    return moment(dateString).format('jYYYY/jMM/jDD');
  };

  // Loading state
  const isLoading = isSalesRep ? salesRepLoading : (statsLoading || ordersLoading);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">در حال بارگذاری داشبورد...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold heading text-gray-900">
              {isAdmin ? 'داشبورد مدیریت سیستم' : 
               isSupervisor ? 'داشبورد سرپرست' : 
               isSalesRep ? 'داشبورد ویزیتور' :
               'داشبورد کاربر'}
            </h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              {isAdmin ? 'مدیریت کامل سیستم و کنترل دسترسی‌ها' :
               isSupervisor ? 'نظارت بر فروش و مدیریت عملیات' :
               isSalesRep ? `ویزیتور منطقه ${salesRepProfile?.region || 'نامشخص'}` :
               'مشاهده سفارشات و محصولات شما'}
            </p>
            {isSalesRep && (
              <p className="text-sm text-blue-600 mt-2">
                خوش آمدید، {salesRepProfile?.name || user?.firstName}
              </p>
            )}
            {userInfo.customerName && (
              <p className="text-sm text-blue-600 mt-2">خوش آمدید، {userInfo.customerName}</p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <button 
              onClick={() => isSalesRep ? loadSalesRepData() : dispatch(fetchDashboardStats())}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
            >
              <RefreshCw className="w-4 h-4 inline ml-2" />
              بروزرسانی
            </button>
            {isManager && (
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base">
                تنظیمات
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Profile Completion Alert for Users */}
      {isUser && !userInfo.isProfileComplete && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start sm:items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5 sm:mt-0" />
            <p className="text-yellow-800 text-sm sm:text-base">
              لطفاً پروفایل خود را تکمیل کنید تا بتوانید سفارش ثبت کنید.
            </p>
          </div>
        </div>
      )}

      {/* Financial Status Widget for Users */}
      {isUser && userBalance && (
        <div className={`rounded-xl shadow-sm border p-4 sm:p-6 ${
          userBalance.currentBalance > 0 
            ? 'bg-red-50 border-red-200' 
            : 'bg-green-50 border-green-200'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className={`p-3 rounded-lg ${
                userBalance.currentBalance > 0 ? 'bg-red-500' : 'bg-green-500'
              }`}>
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                  {userBalance.currentBalance > 0 ? 'وضعیت مالی' : 'حساب تسویه شده'}
                </h3>
                <p className={`text-xl sm:text-2xl font-bold ${
                  userBalance.currentBalance > 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {customerFinancialService.formatBalance(userBalance.currentBalance)}
                </p>
                {userBalance.currentBalance > 0 && (
                  <p className="text-sm text-gray-600 mt-1">
                    لطفاً با ویزیتور خود تماس بگیرید
                  </p>
                )}
                {userBalance.currentBalance === 0 && (
                  <p className="text-sm text-green-600 mt-1">
                    🎉 تبریک! حساب شما تسویه است
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => navigate('/profile/ledger')}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              مشاهده جزئیات
            </button>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {dashboardStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
                  <div className="flex items-center">
                    <span className={`text-xs sm:text-sm ${
                      stat.changeType === 'increase' ? 'text-green-600' :
                      stat.changeType === 'decrease' ? 'text-red-600' :
                      'text-gray-600'
                    }`}>
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Performance Chart for SalesRep */}
      {isSalesRep && salesRepStats && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">عملکرد ماهانه</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600">در انتظار</p>
              <p className="text-xl font-bold text-yellow-600">{salesRepStats.pendingOrders || 0}</p>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Package className="w-6 h-6 text-purple-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600">در حال آماده‌سازی</p>
              <p className="text-xl font-bold text-purple-600">{salesRepStats.inProgressOrders || 0}</p>
            </div>
            
            <div className="text-center p-4 bg-indigo-50 rounded-lg">
              <Truck className="w-6 h-6 text-indigo-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600">در حال تحویل</p>
              <p className="text-xl font-bold text-indigo-600">{salesRepStats.onDeliveryOrders || 0}</p>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600">تحویل شده</p>
              <p className="text-xl font-bold text-green-600">{salesRepStats.deliveredOrders || 0}</p>
            </div>
          </div>

          {/* Progress Bar */}
          {salesRepStats.completionRate !== undefined && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">نرخ تکمیل</span>
                <span className="text-sm text-gray-500">{salesRepStats.completionRate.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${salesRepStats.completionRate}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg font-semibold heading text-gray-900">سفارشات اخیر</h2>
            <button
              onClick={() => navigate('/orders')}
              className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium"
            >
              مشاهده همه
            </button>
          </div>
          
          {/* Recent orders content */}
          <div className="space-y-3 sm:space-y-4">
            {(isSalesRep ? salesRepOrders : recentOrders).length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <Package className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm sm:text-base">سفارش اخیری یافت نشد</p>
              </div>
            ) : (
              (isSalesRep ? salesRepOrders : recentOrders).map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium bg-${getStatusColor(order.status)}-100 text-${getStatusColor(order.status)}-800`}>
                      {order.statusText || getStatusText(order.status)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 text-sm sm:text-base">#{order.id}</p>
                      <p className="text-xs sm:text-sm text-gray-600 truncate">
                        {order.customer?.storeTitle || order.customer?.name || 'نامشخص'}
                      </p>
                    </div>
                  </div>
                  <div className="text-left flex-shrink-0">
                    <p className="font-medium text-gray-900 text-sm sm:text-base">{formatCurrency(order.totalAmount)}</p>
                    <p className="text-xs text-gray-500">{formatPersianDate(order.orderDate)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold heading text-gray-900 mb-4 sm:mb-6">
            {isSalesRep ? 'دسترسی سریع' : 'عملیات سریع'}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {(isUser || isSalesRep) && (
              <button 
                onClick={() => navigate('/orders')}
                className="flex flex-col items-center p-3 sm:p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group"
              >
                <Package className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 group-hover:text-blue-500 mb-2" />
                <span className="text-xs sm:text-sm font-medium text-gray-600 group-hover:text-blue-600 text-center">
                  {isSalesRep ? 'سفارشات من' : 'سفارش جدید'}
                </span>
              </button>
            )}
            
            {isSalesRep && (
              <>
                <button 
                  onClick={() => navigate('/customers')}
                  className="flex flex-col items-center p-3 sm:p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors group"
                >
                  <Users className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 group-hover:text-green-500 mb-2" />
                  <span className="text-xs sm:text-sm font-medium text-gray-600 group-hover:text-green-600 text-center">
                    مشتریان من
                  </span>
                </button>

                <button 
                  onClick={() => navigate('/orders?status=OnDelivery')}
                  className="flex flex-col items-center p-3 sm:p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors group"
                >
                  <Truck className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 group-hover:text-indigo-500 mb-2" />
                  <span className="text-xs sm:text-sm font-medium text-gray-600 group-hover:text-indigo-600 text-center">
                    در حال تحویل
                  </span>
                </button>

                <button 
                  onClick={() => navigate('/profile')}
                  className="flex flex-col items-center p-3 sm:p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors group"
                >
                  <Target className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 group-hover:text-purple-500 mb-2" />
                  <span className="text-xs sm:text-sm font-medium text-gray-600 group-hover:text-purple-600 text-center">
                    پروفایل من
                  </span>
                </button>
              </>
            )}

            {isManager && (
              <>
                <button className="flex flex-col items-center p-3 sm:p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors group">
                  <Users className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 group-hover:text-green-500 mb-2" />
                  <span className="text-xs sm:text-sm font-medium text-gray-600 group-hover:text-green-600 text-center">
                    مشتری جدید
                  </span>
                </button>
                <button className="flex flex-col items-center p-3 sm:p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors group">
                  <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 group-hover:text-purple-500 mb-2" />
                  <span className="text-xs sm:text-sm font-medium text-gray-600 group-hover:text-purple-600 text-center">
                    تایید سفارش
                  </span>
                </button>
                <button className="flex flex-col items-center p-3 sm:p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors group">
                  <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 group-hover:text-orange-500 mb-2" />
                  <span className="text-xs sm:text-sm font-medium text-gray-600 group-hover:text-orange-600 text-center">
                    گزارش فروش
                  </span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Today's Schedule for SalesRep */}
      {isSalesRep && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">برنامه امروز</h2>
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-5 h-5" />
            <span>{moment().format('jYYYY/jMM/jDD dddd')}</span>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 text-blue-700">
              <MapPin className="w-4 h-4" />
              <span className="text-sm font-medium">منطقه فعالیت: {salesRepProfile?.region || 'نامشخص'}</span>
            </div>
            <p className="text-sm text-blue-600 mt-2">
              {salesRepStats?.onDeliveryOrders || 0} سفارش در انتظار تحویل
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 