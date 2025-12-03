import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  Users,
  MapPin,
  Phone,
  Store,
  RefreshCw,
  Search,
  CheckCircle,
  AlertCircle,
  User,
  UserPlus,
  Edit,
  Trash2,
  Filter,
  ChevronDown,
  X,
  DollarSign,
  CreditCard,
  FileText,
  TrendingUp,
  BookOpen
} from 'lucide-react';
import api from '../services/api';
import customerFinancialService from '../services/customerFinancialService';
import salesRepService from '../services/salesRepService';
import AddPaymentModal from './Financial/AddPaymentModal';

const CustomersManagement = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  
  // Check user role
  const isAdmin = user?.role === 'Admin';
  const isSupervisor = user?.role === 'Supervisor';
  const isSalesRep = user?.role === 'SalesRep';
  const isUser = user?.role === 'User';
  const isManager = isAdmin || isSupervisor;
  
  const [customers, setCustomers] = useState([]);
  const [salesReps, setSalesReps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedSalesRep, setSelectedSalesRep] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);
  
  // States for financial management
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCustomerForPayment, setSelectedCustomerForPayment] = useState(null);

  // Load customers based on user role
  const loadCustomers = async (page = 1) => {
    try {
      setLoading(true);
      let response;
      
      if (isSalesRep) {
        // ویزیتور: بارگذاری مشتریان اختصاص یافته
        response = await salesRepService.getAssignedCustomers();
        const customersData = response.customers || response.data || response || [];
        setCustomers(customersData);
        setFilteredCustomers(customersData);
        setTotalPages(1); // برای ویزیتور pagination نداریم
      } else if (isManager) {
        // مدیران: بارگذاری تمام مشتریان
        response = await api.get(`/apicustomers?page=${page}&pageSize=${pageSize}&search=${searchTerm}`);
        
        if (response.data.success) {
          setCustomers(response.data.data.items || []);
          setCurrentPage(response.data.data.page);
          setTotalPages(response.data.data.totalPages);
        }
      }
    } catch (error) {
      console.error('Error loading customers:', error);
      toast.error('خطا در بارگذاری مشتریان');
    } finally {
      setLoading(false);
    }
  };

  // بارگذاری ویزیتورها (فقط برای مدیران)
  const loadSalesReps = async () => {
    if (!isManager) return;
    
    try {
      const response = await api.get('/apicustomers/salesreps');
      if (response.data.success) {
        setSalesReps(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading sales reps:', error);
      toast.error('خطا در بارگذاری ویزیتورها');
    }
  };

  useEffect(() => {
    loadCustomers();
    if (isManager) {
      loadSalesReps();
    }
  }, []);

  // تنظیم filteredCustomers هنگام تغییر customers
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCustomers(customers);
    }
  }, [customers]);

  // جستجو در مشتریان
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCustomers(customers);
    } else {
      const filtered = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.storeTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm) ||
        (customer.city && customer.city.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredCustomers(filtered);
    }
  }, [searchTerm, customers]);

  // باز کردن مدال تخصیص ویزیتور
  const openAssignModal = (customer) => {
    if (!isManager) {
      toast.error('شما مجاز به تخصیص ویزیتور نیستید');
      return;
    }
    console.log('Opening assign modal for customer:', customer);
    setSelectedCustomer(customer);
    setShowAssignModal(true);
  };

  // تخصیص ویزیتور (فقط برای مدیران)
  const handleAssignSalesRep = async () => {
    if (!selectedSalesRep || !selectedCustomer) {
      toast.error('لطفاً ویزیتور را انتخاب کنید');
      return;
    }

    try {
      setAssignLoading(true);
      await api.post('/apicustomers/assign-salesrep', {
        customerId: selectedCustomer.id,
        salesRepId: parseInt(selectedSalesRep)
      });

      toast.success('ویزیتور با موفقیت تخصیص یافت');
      setShowAssignModal(false);
      setSelectedCustomer(null);
      setSelectedSalesRep('');
      loadCustomers(currentPage);
    } catch (error) {
      console.error('Error assigning sales rep:', error);
      toast.error('خطا در تخصیص ویزیتور');
    } finally {
      setAssignLoading(false);
    }
  };

  // Financial Management Functions
  const handleViewLedger = (customer) => {
    navigate(`/customers/${customer.id}/ledger`);
  };

  const handleAddPayment = (customer) => {
    setSelectedCustomerForPayment(customer);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    setSelectedCustomerForPayment(null);
    toast.success('پرداخت با موفقیت ثبت شد');
    // Refresh customers to update balance if needed
    loadCustomers(currentPage);
  };

  // Pagination function
  const handlePageChange = (page) => {
    setCurrentPage(page);
    loadCustomers(page);
  };

  // Customer management functions (for managers)
  const handleEditCustomer = (customer) => {
    // Navigate to edit customer page or open edit modal
    navigate(`/customers/${customer.id}/edit`);
  };

  const handleDeleteCustomer = async (customer) => {
    if (!window.confirm(`آیا مطمئن هستید که می‌خواهید مشتری "${customer.name}" را حذف کنید؟`)) {
      return;
    }

    try {
      await api.delete(`/apicustomers/${customer.id}`);
      toast.success('مشتری با موفقیت حذف شد');
      loadCustomers(currentPage);
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error('خطا در حذف مشتری');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">در حال بارگذاری مشتریان...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
            <div className="text-right flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                {isSalesRep ? 'مشتریان من' : 'مدیریت مشتریان'}
              </h1>
              <p className="text-gray-600">
                {isSalesRep 
                  ? 'مشتریان اختصاص یافته به منطقه شما'
                  : 'مدیریت اطلاعات و حساب‌های مشتریان'
                }
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <button
                onClick={() => loadCustomers(currentPage)}
                className="flex justify-center items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors min-h-[44px] w-full sm:w-auto text-sm sm:text-base"
              >
                <RefreshCw className="w-4 h-4" />
                بروزرسانی
              </button>
              {isManager && (
                <button className="flex justify-center items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors min-h-[44px] w-full sm:w-auto text-sm sm:text-base">
                  <UserPlus className="w-4 h-4" />
                  مشتری جدید
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
            <input
              type="text"
              placeholder="جستجو در نام، فروشگاه، تلفن یا شهر..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base min-h-[44px] w-full"
            />
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  {isSalesRep ? 'مشتریان من' : 'کل مشتریان'}
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{filteredCustomers.length}</p>
              </div>
              <Users className="w-7 h-7 sm:w-8 sm:h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">پروفایل کامل</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600">
                  {filteredCustomers.filter(c => c.isProfileComplete).length}
                </p>
              </div>
              <CheckCircle className="w-7 h-7 sm:w-8 sm:h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">پروفایل ناکامل</p>
                <p className="text-xl sm:text-2xl font-bold text-orange-600">
                  {filteredCustomers.filter(c => !c.isProfileComplete).length}
                </p>
              </div>
              <AlertCircle className="w-7 h-7 sm:w-8 sm:h-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Customers List */}
        {filteredCustomers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 sm:p-12 text-center">
            <Users className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'مشتری یافت نشد' : 'مشتری یافت نشد'}
            </h3>
            <p className="text-gray-500 text-xs sm:text-base">
              {searchTerm 
                ? 'مشتری با این مشخصات یافت نشد. عبارت جستجو را تغییر دهید.'
                : (isSalesRep 
                    ? 'هنوز مشتری به شما اختصاص داده نشده است.'
                    : 'هنوز مشتری ثبت نشده است.'
                  )
              }
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCustomers.map((customer) => (
              <div key={customer.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-3 sm:p-6 space-y-3 sm:space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-2 sm:mb-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{customer.name}</h3>
                        <p className="text-xs sm:text-sm text-gray-500">#{customer.id}</p>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                      customer.isProfileComplete 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {customer.isProfileComplete ? 'کامل' : 'ناکامل'}
                    </div>
                  </div>

                  {/* Store Title */}
                  <div className="flex items-center gap-2 mb-2 sm:mb-3">
                    <Store className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <span className="font-medium text-gray-900 text-sm sm:text-base truncate">{customer.storeTitle}</span>
                  </div>

                  {/* Phone */}
                  <div className="flex items-center gap-2 mb-2 sm:mb-3">
                    <Phone className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <span className="text-gray-700 text-sm sm:text-base">{customer.phone}</span>
                  </div>

                  {/* Address */}
                  {customer.address && (
                    <div className="flex items-start gap-2 mb-2 sm:mb-3">
                      <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-gray-600 line-clamp-2">{customer.address}</span>
                    </div>
                  )}

                  {/* Region & City */}
                  {(customer.region || customer.city) && (
                    <div className="flex items-center gap-2 mb-2 sm:mb-4">
                      <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-gray-600 truncate">
                        {[customer.city, customer.region].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}

                  {/* Financial Info */}
                  {customer.currentBalance !== undefined && (
                    <div className="mb-2 sm:mb-4 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-medium text-gray-700 flex items-center">
                          <DollarSign className="w-4 h-4 ml-1 text-blue-500" />
                          بدهی فعلی:
                        </span>
                        <span className={`text-xs sm:text-sm font-bold ${
                          customer.currentBalance > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {customerFinancialService.formatBalance(customer.currentBalance)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Assigned Sales Rep */}
                  <div className="mb-2 sm:mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-medium text-gray-700">ویزیتور:</span>
                      {customer.salesRep ? (
                        <div className="text-xs sm:text-sm text-left">
                          <span className="text-green-600 font-medium block">{customer.salesRep.name}</span>
                          <span className="text-gray-500 text-xs">{customer.salesRep.region}</span>
                        </div>
                      ) : (
                        <span className="text-orange-600 text-xs sm:text-sm">تخصیص نیافته</span>
                      )}
                    </div>
                  </div>

                  {/* Financial Actions */}
                  {(user?.role === 'Admin' || user?.role === 'Supervisor' || user?.role === 'SalesRep') && (
                    <div className="mb-2 sm:mb-4 flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => handleViewLedger(customer)}
                        className="flex items-center justify-center gap-1 px-3 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 text-xs sm:text-sm min-h-[44px] flex-1 w-full sm:w-auto"
                      >
                        <FileText className="w-4 h-4" />
                        <span className="hidden sm:inline">دفتر حساب</span>
                        <span className="sm:hidden">دفتر</span>
                      </button>
                      
                      <button
                        onClick={() => handleAddPayment(customer)}
                        className="flex items-center justify-center gap-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-xs sm:text-sm min-h-[44px] flex-1 w-full sm:w-auto"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span className="hidden sm:inline">ثبت پرداخت</span>
                        <span className="sm:hidden">پرداخت</span>
                      </button>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-around pt-4 border-t border-gray-200">
                    <div className={`flex items-center gap-2 text-xs sm:text-sm ${
                      customer.isActive ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        customer.isActive ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      {customer.isActive ? 'فعال' : 'غیرفعال'}
                    </div>
                    
                    {isManager && (
                      <button
                        onClick={() => openAssignModal(customer)}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium min-h-[44px] px-2 -mx-2 sm:w-auto"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span className="hidden sm:inline">تخصیص ویزیتور</span>
                        <span className="sm:hidden">تخصیص</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 sm:mt-8 flex justify-center">
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
              >
                قبلی
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-2 sm:px-3 py-2 text-xs sm:text-sm border rounded-lg min-h-[44px] ${
                    page === currentPage
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
              >
                بعدی
              </button>
            </div>
          </div>
        )}

        {/* Show results count */}
        {searchTerm && (
          <div className="mt-6 text-center text-gray-500">
            {filteredCustomers.length} مشتری از {customers.length} مشتری یافت شد
          </div>
        )}
      </div>

      {/* Assign Sales Rep Modal (for managers) */}
      {showAssignModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">تخصیص ویزیتور</h2>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedCustomer(null);
                  setSelectedSalesRep('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                تخصیص ویزیتور برای مشتری: <strong>{selectedCustomer.name}</strong>
              </p>
              <select
                value={selectedSalesRep}
                onChange={(e) => setSelectedSalesRep(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
              >
                <option value="">انتخاب ویزیتور</option>
                {salesReps.map((rep) => (
                  <option key={rep.id} value={rep.id}>
                    {rep.name} - {rep.region || 'بدون منطقه'}
                  </option>
                ))}
              </select>
              <div className="flex gap-3">
                <button
                  onClick={handleAssignSalesRep}
                  disabled={assignLoading || !selectedSalesRep}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {assignLoading ? 'در حال تخصیص...' : 'تخصیص'}
                </button>
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedCustomer(null);
                    setSelectedSalesRep('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  انصراف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedCustomerForPayment && (
        <AddPaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedCustomerForPayment(null);
          }}
          customerId={selectedCustomerForPayment.id}
          customerName={selectedCustomerForPayment.name}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

export default CustomersManagement;