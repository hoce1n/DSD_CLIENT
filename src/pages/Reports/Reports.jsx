import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  DollarSign,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  User,
  Target,
  Award,
  CheckCircle,
  XCircle,
  Clock,
  Truck
} from 'lucide-react';
import ResponsiveTable from '../../components/UI/ResponsiveTable';

const Reports = () => {
  const { user } = useSelector(state => state.auth);
  const [activeReport, setActiveReport] = useState('overview');
  const [dateRange, setDateRange] = useState('thisMonth');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState({});

  // گزارشات بر اساس نقش
  const getReportsByRole = () => {
    const baseReports = [
      { id: 'overview', name: 'خلاصه کلی', icon: BarChart3 }
    ];

    if (user?.role === 'User') {
      return [
        ...baseReports,
        { id: 'myOrders', name: 'سفارشات من', icon: ShoppingCart },
        { id: 'myActivity', name: 'فعالیت من', icon: User }
      ];
    }

    if (user?.role === 'SalesRep') {
      return [
        ...baseReports,
        { id: 'myPerformance', name: 'عملکرد من', icon: Target },
        { id: 'myCustomers', name: 'مشتریان من', icon: Users },
        { id: 'myOrders', name: 'سفارشات من', icon: ShoppingCart }
      ];
    }

    if (user?.role === 'Admin' || user?.role === 'Supervisor') {
      return [
        ...baseReports,
        { id: 'sales', name: 'آمار فروش', icon: TrendingUp },
        { id: 'orders', name: 'وضعیت سفارشات', icon: PieChart },
        { id: 'salesReps', name: 'عملکرد ویزیتورها', icon: Award },
        { id: 'customers', name: 'گزارش مشتریان', icon: Users },
        { id: 'products', name: 'گزارش محصولات', icon: BarChart3 }
      ];
    }

    return baseReports;
  };

  const reports = getReportsByRole();

  useEffect(() => {
    loadReportData();
  }, [activeReport, dateRange]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let endpoint = '';

      switch (activeReport) {
        case 'overview':
          endpoint = '/api/dashboard/stats';
          break;
        case 'myOrders':
          if (user?.role === 'User') {
            endpoint = '/api/orders';
          } else if (user?.role === 'SalesRep') {
            endpoint = '/api/salesrep/orders';
          }
          break;
        case 'myPerformance':
          endpoint = '/api/salesrep/statistics';
          break;
        case 'myCustomers':
          endpoint = '/api/salesrep/customers';
          break;
        case 'sales':
          endpoint = '/api/reports/sales';
          break;
        case 'orders':
          endpoint = '/api/reports/order-status';
          break;
        case 'salesReps':
          endpoint = '/api/reports/salesrep-performance';
          break;
        case 'customers':
          endpoint = '/api/reports/customers';
          break;
        case 'products':
          endpoint = '/api/reports/products';
          break;
        default:
          endpoint = '/api/dashboard/stats';
      }

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setReportData(data.data || data);
      }
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' ریال';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fa-IR');
  };

  const renderOverviewReport = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
            <ShoppingCart className="h-6 w-6 text-blue-600 dark:text-blue-300" />
          </div>
          <div className="mr-4">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">کل سفارشات</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {reportData.totalOrders || 0}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
            <DollarSign className="h-6 w-6 text-green-600 dark:text-green-300" />
          </div>
          <div className="mr-4">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">کل فروش</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(reportData.totalSales || 0)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900">
            <Users className="h-6 w-6 text-purple-600 dark:text-purple-300" />
          </div>
          <div className="mr-4">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">مشتریان فعال</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {reportData.activeCustomers || 0}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900">
            <Clock className="h-6 w-6 text-orange-600 dark:text-orange-300" />
          </div>
          <div className="mr-4">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">در انتظار</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {reportData.pendingOrders || 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMyOrdersReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">کل سفارشات</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {reportData.totalOrders || 0}
              </p>
            </div>
            <ShoppingCart className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">تحویل شده</p>
              <p className="text-3xl font-bold text-green-600">
                {reportData.deliveredOrders || 0}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">در انتظار</p>
              <p className="text-3xl font-bold text-orange-600">
                {reportData.pendingOrders || 0}
              </p>
            </div>
            <Clock className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          نمودار وضعیت سفارشات
        </h3>
        <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">نمودار وضعیت سفارشات</p>
        </div>
      </div>
    </div>
  );

  const renderSalesRepPerformance = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">مشتریان من</p>
              <p className="text-3xl font-bold text-blue-600">
                {reportData.assignedCustomers || 0}
              </p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">سفارشات من</p>
              <p className="text-3xl font-bold text-green-600">
                {reportData.totalOrders || 0}
              </p>
            </div>
            <ShoppingCart className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">فروش من</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(reportData.totalSales || 0)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">نرخ موفقیت</p>
              <p className="text-3xl font-bold text-orange-600">
                {reportData.successRate || 0}%
              </p>
            </div>
            <Target className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          عملکرد ماهانه
        </h3>
        <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">نمودار عملکرد ماهانه</p>
        </div>
      </div>
    </div>
  );

  const renderSalesReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">کل فروش</p>
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(reportData.totalSales || 0)}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">میانگین سفارش</p>
              <p className="text-3xl font-bold text-blue-600">
                {formatCurrency(reportData.averageOrderValue || 0)}
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">رشد فروش</p>
              <p className="text-3xl font-bold text-purple-600">
                {reportData.salesGrowth || 0}%
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            فروش ماهانه
          </h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">نمودار فروش ماهانه</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            پرفروش‌ترین محصولات
          </h3>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-gray-900 dark:text-white">محصول {item}</span>
                <span className="text-green-600 font-semibold">{item * 50} فروش</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderOrderStatusReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
          <Clock className="h-8 w-8 text-orange-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600 dark:text-gray-400">در انتظار</p>
          <p className="text-2xl font-bold text-orange-600">{reportData.pending || 0}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
          <CheckCircle className="h-8 w-8 text-blue-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600 dark:text-gray-400">تأیید شده</p>
          <p className="text-2xl font-bold text-blue-600">{reportData.confirmed || 0}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
          <Truck className="h-8 w-8 text-purple-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600 dark:text-gray-400">در حال تحویل</p>
          <p className="text-2xl font-bold text-purple-600">{reportData.onDelivery || 0}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
          <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600 dark:text-gray-400">تحویل شده</p>
          <p className="text-2xl font-bold text-green-600">{reportData.delivered || 0}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          نمودار وضعیت سفارشات
        </h3>
        <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">نمودار دایره‌ای وضعیت سفارشات</p>
        </div>
      </div>
    </div>
  );

  const renderAllSalesRepsReport = () => {
    const salesRepsData = [1, 2, 3, 4, 5].map((rep) => ({
      id: rep,
      name: `ویزیتور ${rep}`,
      customers: rep * 10,
      orders: rep * 25,
      sales: formatCurrency(rep * 5000000),
      successRate: `${85 + rep}%`
    }));

    const columns = [
      {
        key: 'name',
        header: 'نام ویزیتور',
        primary: true,
        render: (row) => (
          <span className="font-medium text-gray-900 dark:text-white">{row.name}</span>
        )
      },
      {
        key: 'customers',
        header: 'مشتریان',
        primary: true,
        render: (row) => (
          <span className="text-gray-500 dark:text-gray-300">{row.customers}</span>
        )
      },
      {
        key: 'orders',
        header: 'سفارشات',
        render: (row) => (
          <span className="text-gray-500 dark:text-gray-300">{row.orders}</span>
        )
      },
      {
        key: 'sales',
        header: 'فروش',
        render: (row) => (
          <span className="text-gray-500 dark:text-gray-300">{row.sales}</span>
        )
      },
      {
        key: 'successRate',
        header: 'نرخ موفقیت',
        render: (row) => (
          <span className="text-gray-500 dark:text-gray-300">{row.successRate}</span>
        )
      }
    ];

    return (
      <div className="space-y-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            عملکرد ویزیتورها
          </h3>
        </div>
        <ResponsiveTable
          columns={columns}
          data={salesRepsData}
          loading={loading}
          emptyMessage="هیچ ویزیتوری یافت نشد"
          emptyIcon={Users}
          mobileBreakpoint="md"
        />
      </div>
    );
  };

  const renderReport = () => {
    switch (activeReport) {
      case 'overview':
        return renderOverviewReport();
      case 'myOrders':
        return renderMyOrdersReport();
      case 'myPerformance':
        return renderSalesRepPerformance();
      case 'myCustomers':
        return renderSalesRepPerformance(); // می‌توان جداگانه پیاده‌سازی کرد
      case 'sales':
        return renderSalesReport();
      case 'orders':
        return renderOrderStatusReport();
      case 'salesReps':
        return renderAllSalesRepsReport();
      default:
        return renderOverviewReport();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">گزارشات</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            تحلیل و بررسی عملکرد سیستم
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-wrap gap-2 w-full lg:w-auto justify-center lg:justify-start">
              {reports.map((report) => {
                const Icon = report.icon;
                return (
                  <button
                    key={report.id}
                    onClick={() => setActiveReport(report.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto min-h-[44px] justify-center ${
                      activeReport === report.id
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{report.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 w-full lg:w-auto justify-center lg:justify-end">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm w-full sm:w-auto min-h-[44px]"
              >
                <option value="today">امروز</option>
                <option value="thisWeek">این هفته</option>
                <option value="thisMonth">این ماه</option>
                <option value="lastMonth">ماه گذشته</option>
                <option value="thisYear">امسال</option>
              </select>

              <button
                onClick={loadReportData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm w-full sm:w-auto min-h-[44px] justify-center"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>به‌روزرسانی</span>
              </button>

              <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm w-full sm:w-auto min-h-[44px] justify-center">
                <Download className="h-4 w-4" />
                <span>دانلود</span>
              </button>
            </div>
          </div>
        </div>

        {/* Report Content */}
        <div className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
              <span className="mr-2 text-gray-600 dark:text-gray-400">در حال بارگذاری...</span>
            </div>
          ) : (
            renderReport()
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports; 