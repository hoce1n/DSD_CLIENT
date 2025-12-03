 import { apiHelpers } from './api';

const customerFinancialService = {
  // دریافت اطلاعات مشتری فعلی (برای User role)
  getMyCustomerInfo: async () => {
    return await apiHelpers.get('/apicustomers/my-info');
  },

  // ثبت پرداخت جدید
  addPayment: async (customerId, paymentData) => {
    return await apiHelpers.post(`/apicustomers/${customerId}/payments`, paymentData);
  },

  // دریافت تراکنش‌های مالی مشتری
  getCustomerTransactions: async (customerId, filters = {}) => {
    const params = new URLSearchParams();
    
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    if (filters.type) params.append('type', filters.type);
    if (filters.page) params.append('page', filters.page);
    if (filters.pageSize) params.append('pageSize', filters.pageSize);

    const queryString = params.toString();
    const url = `/apicustomers/${customerId}/transactions${queryString ? `?${queryString}` : ''}`;
    
    return await apiHelpers.get(url);
  },

  // دریافت وضعیت مالی مشتری
  getCustomerBalance: async (customerId) => {
    return await apiHelpers.get(`/apicustomers/${customerId}/balance`);
  },

  // گزارش کامل مالی مشتری
  getCustomerFinancialReport: async (customerId) => {
    return await apiHelpers.get(`/apicustomers/${customerId}/financial-report`);
  },

  // تعدیل بدهی (فقط ادمین)
  addBalanceAdjustment: async (customerId, adjustmentData) => {
    return await apiHelpers.post(`/apicustomers/${customerId}/balance-adjustment`, adjustmentData);
  },

  // لیست مشتریان بدهکار
  getDebtorCustomers: async (minDebt = 0) => {
    return await apiHelpers.get(`/apicustomers/debtors?minDebt=${minDebt}`);
  },

  // سفارشات پرداخت نشده
  getUnpaidOrders: async (customerId = null, daysOverdue = null) => {
    const params = new URLSearchParams();
    
    if (customerId) params.append('customerId', customerId);
    if (daysOverdue) params.append('daysOverdue', daysOverdue);

    const queryString = params.toString();
    const url = `/apicustomers/unpaid-orders${queryString ? `?${queryString}` : ''}`;
    
    return await apiHelpers.get(url);
  },

  // متدهای کمکی برای فرمت کردن داده‌ها
  formatBalance: (amount) => {
    return new Intl.NumberFormat('fa-IR', {
      style: 'currency',
      currency: 'IRR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount).replace('IRR', 'تومان');
  },

  getTransactionTypeText: (type) => {
    const types = {
      'Payment': 'پرداخت',
      'OrderInvoice': 'فاکتور سفارش',
      'CreditAdjustment': 'تعدیل اعتبار',
      'DebitAdjustment': 'تعدیل بدهی'
    };
    return types[type] || 'نامشخص';
  },

  getPaymentMethodText: (method) => {
    const methods = {
      'Cash': 'نقدی',
      'Card': 'کارتخوان',
      'Check': 'چک',
      'BankTransfer': 'انتقال بانکی',
      'Credit': 'اعتباری'
    };
    return methods[method] || 'نامشخص';
  },

  getPaymentStatusText: (status) => {
    const statuses = {
      'Pending': 'در انتظار پرداخت',
      'Paid': 'پرداخت شده',
      'PartiallyPaid': 'پرداخت جزئی',
      'Credit': 'اعتباری',
      'Refunded': 'بازپرداخت شده'
    };
    return statuses[status] || 'نامشخص';
  },

  // اعتبارسنجی فرم پرداخت
  validatePaymentForm: (paymentData) => {
    const errors = {};

    if (!paymentData.amount || paymentData.amount <= 0) {
      errors.amount = 'مبلغ پرداخت باید بیشتر از صفر باشد';
    }

    if (!paymentData.paymentDate) {
      errors.paymentDate = 'تاریخ پرداخت الزامی است';
    }

    if (!paymentData.paymentMethod) {
      errors.paymentMethod = 'روش پرداخت الزامی است';
    }

    if (paymentData.paymentMethod === 'Check' && !paymentData.referenceNumber) {
      errors.referenceNumber = 'شماره چک الزامی است';
    }

    if (paymentData.paymentMethod === 'BankTransfer' && !paymentData.referenceNumber) {
      errors.referenceNumber = 'شماره تراکنش بانکی الزامی است';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
};

export default customerFinancialService;