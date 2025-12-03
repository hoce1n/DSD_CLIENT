 import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import {
  ArrowLeft,
  DollarSign,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
  Download,
  Plus,
  Eye,
  FileText,
  User,
  Phone,
  MapPin,
  RefreshCw,
  AlertCircle,
  X
} from 'lucide-react';
import ResponsiveTable from '../../components/UI/ResponsiveTable';
import {
  fetchCustomerBalance,
  fetchCustomerTransactions,
  fetchCustomerFinancialReport,
  setCurrentCustomer,
  setTransactionFilters,
  resetTransactionFilters,
  clearErrors
} from '../../store/slices/customerLedgerSlice';
import AddPaymentModal from '../../components/Financial/AddPaymentModal';
import PersianDatePicker from '../../components/PersianDatePicker';
import customerFinancialService from '../../services/customerFinancialService';

// Helper function to format Persian date
const formatPersianDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fa-IR');
};

const CustomerLedger = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    balance,
    transactions,
    financialReport,
    transactionFilters,
    balanceLoading,
    transactionsLoading,
    financialReportLoading,
    balanceError,
    transactionsError
  } = useSelector(state => state.customerLedger);

  const { user } = useSelector(state => state.auth);
  
  // Determine if this is a user viewing their own ledger
  const isUserLedger = user?.role === 'User';
  const [myCustomerInfo, setMyCustomerInfo] = useState(null);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Load data when component mounts or customerId changes
  useEffect(() => {
    if (isUserLedger) {
      // For regular users, get their customer info first
      loadMyCustomerData();
    } else if (customerId) {
      // For admins/supervisors/salesreps, use the customerId from URL
      dispatch(setCurrentCustomer(parseInt(customerId)));
      loadCustomerData(customerId);
    }
  }, [customerId, dispatch, isUserLedger]);

  const loadMyCustomerData = async () => {
    try {
      const response = await customerFinancialService.getMyCustomerInfo();
      const customerInfo = response.data;
      setMyCustomerInfo(customerInfo);
      
      dispatch(setCurrentCustomer(customerInfo.id));
      loadCustomerData(customerInfo.id);
    } catch (error) {
      console.error('Error loading customer info:', error);
    }
  };

  const loadCustomerData = (targetCustomerId) => {
    const customerIdToUse = targetCustomerId || customerId;
    dispatch(clearErrors());
    dispatch(fetchCustomerBalance(customerIdToUse));
    dispatch(fetchCustomerTransactions({ customerId: customerIdToUse, filters: transactionFilters }));
    
    // Only load financial report for non-user roles
    if (!isUserLedger) {
      dispatch(fetchCustomerFinancialReport(customerIdToUse));
    }
  };

  // Handle filter changes
  const handleFilterChange = (filterName, value) => {
    const newFilters = { ...transactionFilters, [filterName]: value };
    dispatch(setTransactionFilters(newFilters));
    dispatch(fetchCustomerTransactions({ customerId, filters: newFilters }));
  };

  // Reset filters
  const handleResetFilters = () => {
    dispatch(resetTransactionFilters());
    dispatch(fetchCustomerTransactions({ customerId, filters: {} }));
  };

  // Handle payment modal
  const handleAddPayment = () => {
    setShowPaymentModal(true);
  };

  const handlePaymentModalClose = () => {
    setShowPaymentModal(false);
  };

  // Get transaction type color and icon
  const getTransactionTypeInfo = (type, amount) => {
    const isCredit = amount < 0; // منفی = پرداخت (کاهش بدهی)
    
    if (type === 'Payment') {
      return {
        color: 'text-green-600 bg-green-50',
        icon: TrendingDown,
        label: 'پرداخت'
      };
    } else if (type === 'OrderInvoice') {
      return {
        color: 'text-red-600 bg-red-50',
        icon: TrendingUp,
        label: 'فاکتور سفارش'
      };
    } else if (type === 'CreditAdjustment') {
      return {
        color: 'text-blue-600 bg-blue-50',
        icon: TrendingDown,
        label: 'تعدیل اعتبار'
      };
    } else if (type === 'DebitAdjustment') {
      return {
        color: 'text-orange-600 bg-orange-50',
        icon: TrendingUp,
        label: 'تعدیل بدهی'
      };
    }
    
    return {
      color: 'text-gray-600 bg-gray-50',
      icon: FileText,
      label: 'نامشخص'
    };
  };

  if (balanceError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">خطا در بارگذاری اطلاعات</h2>
          <p className="text-gray-600 mb-4">{balanceError}</p>
          <button
            onClick={loadCustomerData}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            تلاش مجدد
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
        <div className="text-center sm:text-right flex-1">
          <div className="flex items-center justify-start mb-2">
            <button
              onClick={() => navigate(-1)}
              className="ml-4 p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 min-h-[44px]"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className='text-right'>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                {isUserLedger ? 'وضعیت مالی من' : 'دفتر حساب مشتری'}
              </h1>
              <p className="text-sm text-gray-600">
                {isUserLedger 
                  ? 'مشاهده تراکنش‌ها و وضعیت مالی شما' 
                  : 'مدیریت مالی و تراکنش‌های مشتری'
                }
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto justify-center sm:justify-end">
          <button
            onClick={() => loadCustomerData()}
            disabled={balanceLoading || transactionsLoading}
            className="w-full sm:w-auto min-h-[44px] px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center"
          >
            <RefreshCw className={`w-4 h-4 ml-2 ${(balanceLoading || transactionsLoading) ? 'animate-spin' : ''}`} />
            بروزرسانی
          </button>
          {!isUserLedger && (user?.role === 'Admin' || user?.role === 'Supervisor' || user?.role === 'SalesRep') && (
            <button
              onClick={handleAddPayment}
              className="w-full sm:w-auto min-h-[44px] px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center"
            >
              <Plus className="w-4 h-4 ml-2" />
              ثبت پرداخت
            </button>
          )}
        </div>
      </div>

      {/* Customer Info & Balance Card */}
      {balance && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Customer Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 ml-2 text-blue-500" />
              اطلاعات مشتری
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <User className="w-4 h-4 text-gray-400 ml-2" />
                <span className="text-sm text-gray-600 ml-2">
                  {isUserLedger ? 'نام فروشگاه:' : 'نام:'}
                </span>
                <span className="font-medium">
                  {isUserLedger ? (myCustomerInfo?.storeTitle || balance.customerName) : balance.customerName}
                </span>
              </div>
              
              {isUserLedger && myCustomerInfo && (
                <div className="flex items-center">
                  <User className="w-4 h-4 text-gray-400 ml-2" />
                  <span className="text-sm text-gray-600 ml-2">نام مشتری:</span>
                  <span className="font-medium">{myCustomerInfo.name}</span>
                </div>
              )}
              
              {balance.lastPaymentDate && (
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 text-gray-400 ml-2" />
                  <span className="text-sm text-gray-600 ml-2">آخرین پرداخت:</span>
                  <span className="font-medium">
                    {formatPersianDate(balance.lastPaymentDate)}
                    {balance.lastPaymentAmount && (
                      <span className="text-green-600 mr-2">
                        ({customerFinancialService.formatBalance(balance.lastPaymentAmount)})
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Balance Summary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <DollarSign className="w-5 h-5 ml-2 text-green-500" />
              خلاصه مالی
            </h3>
            
            <div className="space-y-4">
              <div className={`flex justify-between items-center p-4 rounded-md ${
                balance.currentBalance > 0 
                  ? 'bg-red-50 border border-red-200' 
                  : 'bg-green-50 border border-green-200'
              }`}>
                <div className="flex items-center">
                  <DollarSign className={`w-5 h-5 ml-2 ${balance.currentBalance > 0 ? 'text-red-500' : 'text-green-500'}`} />
                  <span className="text-sm font-medium text-gray-700">
                    {balance.currentBalance > 0 ? 'بدهی فعلی' : 'حساب تسویه شده'}
                  </span>
                </div>
                <div className="text-left">
                  <span className={`font-bold text-xl ${balance.currentBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {customerFinancialService.formatBalance(balance.currentBalance)}
                  </span>
                  {isUserLedger && balance.currentBalance > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      لطفاً با ویزیتور خود تماس بگیرید
                    </p>
                  )}
                  {isUserLedger && balance.currentBalance === 0 && (
                    <p className="text-xs text-green-600 mt-1">
                      🎉 تبریک! حساب شما تسویه است
                    </p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center p-2 bg-red-50 rounded-md">
                  <p className="text-red-600 font-medium">
                    {customerFinancialService.formatBalance(balance.totalDebt)}
                  </p>
                  <p className="text-gray-600 text-xs">مجموع بدهی</p>
                </div>
                
                <div className="text-center p-2 bg-green-50 rounded-md">
                  <p className="text-green-600 font-medium">
                    {customerFinancialService.formatBalance(balance.totalPayments)}
                  </p>
                  <p className="text-gray-600 text-xs">مجموع پرداخت</p>
                </div>
              </div>
              
              {balance.unpaidOrdersCount > 0 && (
                <div className="flex justify-between items-center p-2 bg-yellow-50 rounded-md text-sm">
                  <span className="text-yellow-800">سفارشات پرداخت نشده</span>
                  <span className="font-medium text-yellow-800">
                    {balance.unpaidOrdersCount} سفارش - {customerFinancialService.formatBalance(balance.unpaidOrdersAmount)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Filter className="w-5 h-5 ml-2 text-blue-500" />
            فیلتر تراکنش‌ها
          </h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="text-sm text-blue-600 hover:text-blue-800 min-h-[44px]"
          >
            {showFilters ? 'بستن فیلترها' : 'نمایش فیلترها'}
          </button>
        </div>
        
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">از تاریخ</label>
              <PersianDatePicker
                value={transactionFilters.dateFrom || ''}
                onChange={(date) => handleFilterChange('dateFrom', date || null)}
                placeholder="انتخاب تاریخ شروع"
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">تا تاریخ</label>
              <PersianDatePicker
                value={transactionFilters.dateTo || ''}
                onChange={(date) => handleFilterChange('dateTo', date || null)}
                placeholder="انتخاب تاریخ پایان"
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">نوع تراکنش</label>
              <select
                value={transactionFilters.type || ''}
                onChange={(e) => handleFilterChange('type', e.target.value || null)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm min-h-[44px]"
              >
                <option value="">همه</option>
                <option value="Payment">پرداخت</option>
                <option value="OrderInvoice">فاکتور سفارش</option>
                <option value="CreditAdjustment">تعدیل اعتبار</option>
                <option value="DebitAdjustment">تعدیل بدهی</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={handleResetFilters}
                className="w-full px-3 py-2.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm min-h-[44px]"
              >
                پاک کردن فیلترها
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-3 sm:p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <FileText className="w-5 h-5 ml-2 text-blue-500" />
              تاریخچه تراکنش‌ها
            </h3>
            <button
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center min-h-[44px]"
              onClick={() => {/* TODO: Export functionality */}}
            >
              <Download className="w-4 h-4 ml-1" />
              دانلود
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {transactionsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="mr-2 text-gray-600">در حال بارگذاری...</span>
            </div>
          ) : transactionsError ? (
            <div className="text-center py-12">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-600">{transactionsError}</p>
            </div>
          ) : (
            <ResponsiveTable
              columns={[
                {
                  key: 'transactionDate',
                  header: 'تاریخ',
                  primary: true,
                  render: (transaction) => (
                    <span className="text-sm text-gray-900">
                      {formatPersianDate(transaction.transactionDate)}
                    </span>
                  )
                },
                {
                  key: 'type',
                  header: 'نوع',
                  primary: true,
                  render: (transaction) => {
                    const typeInfo = getTransactionTypeInfo(transaction.type, transaction.amount);
                    const Icon = typeInfo.icon;
                    return (
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeInfo.color}`}>
                        <Icon className="w-3 h-3 ml-1" />
                        {typeInfo.label}
                      </div>
                    );
                  }
                },
                {
                  key: 'description',
                  header: 'توضیحات',
                  render: (transaction) => (
                    <div className="text-sm text-gray-900">
                      {transaction.description}
                      {transaction.paymentMethodText && (
                        <span className="text-gray-500 text-xs block">
                          روش پرداخت: {transaction.paymentMethodText}
                        </span>
                      )}
                      {transaction.referenceNumber && (
                        <span className="text-gray-500 text-xs block">
                          شماره مرجع: {transaction.referenceNumber}
                        </span>
                      )}
                    </div>
                  )
                },
                {
                  key: 'amount',
                  header: 'مبلغ',
                  render: (transaction) => (
                    <span className={`text-sm font-medium ${transaction.amount < 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.amount < 0 ? '-' : '+'}
                      {customerFinancialService.formatBalance(Math.abs(transaction.amount))}
                    </span>
                  )
                },
                {
                  key: 'newBalance',
                  header: 'بدهی جدید',
                  render: (transaction) => (
                    <span className={`text-sm font-medium ${transaction.newBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {customerFinancialService.formatBalance(transaction.newBalance)}
                    </span>
                  )
                },
                {
                  key: 'actions',
                  header: 'عملیات',
                  render: (transaction) => (
                    <button
                      onClick={() => setSelectedTransaction(transaction)}
                      className="text-blue-600 hover:text-blue-800 p-1 min-h-[36px] min-w-[36px] flex items-center justify-center"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )
                }
              ]}
              data={transactions}
              loading={transactionsLoading}
              emptyMessage="هنوز هیچ تراکنش مالی ثبت نشده است"
              emptyIcon={FileText}
              mobileBreakpoint="md"
            />
          )}
        </div>
      </div>

      {/* Add Payment Modal */}
      <AddPaymentModal
        isOpen={showPaymentModal}
        onClose={handlePaymentModalClose}
        customer={balance ? { id: parseInt(customerId), name: balance.customerName, currentBalance: balance.currentBalance } : null}
      />

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-3 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">جزئیات تراکنش</h3>
              <button
                onClick={() => setSelectedTransaction(null)}
                className="text-gray-400 hover:text-gray-600 min-h-[44px]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">تاریخ:</span>
                  <span>{formatPersianDate(selectedTransaction.transactionDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">نوع:</span>
                  <span>{selectedTransaction.typeText}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">مبلغ:</span>
                  <span className={selectedTransaction.amount < 0 ? 'text-green-600' : 'text-red-600'}>
                    {customerFinancialService.formatBalance(selectedTransaction.amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">بدهی قبلی:</span>
                  <span>{customerFinancialService.formatBalance(selectedTransaction.previousBalance)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">بدهی جدید:</span>
                  <span>{customerFinancialService.formatBalance(selectedTransaction.newBalance)}</span>
                </div>
                {selectedTransaction.paymentMethodText && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">روش پرداخت:</span>
                    <span>{selectedTransaction.paymentMethodText}</span>
                  </div>
                )}
                {selectedTransaction.referenceNumber && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">شماره مرجع:</span>
                    <span>{selectedTransaction.referenceNumber}</span>
                  </div>
                )}
                <div className="border-t pt-3">
                  <span className="text-gray-600">توضیحات:</span>
                  <p className="mt-1">{selectedTransaction.description}</p>
                </div>
                {selectedTransaction.notes && (
                  <div>
                    <span className="text-gray-600">یادداشت‌ها:</span>
                    <p className="mt-1">{selectedTransaction.notes}</p>
                  </div>
                )}
                <div className="border-t pt-3 text-xs text-gray-500">
                  ثبت شده توسط: {selectedTransaction.createdByUserName} در {formatPersianDate(selectedTransaction.createdAt)} {new Date(selectedTransaction.createdAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </div>
      )}
    </div>
  );
};

export default CustomerLedger;