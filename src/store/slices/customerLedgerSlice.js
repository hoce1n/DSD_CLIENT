import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import customerFinancialService from '../../services/customerFinancialService';

// Async thunks
export const fetchCustomerBalance = createAsyncThunk(
  'customerLedger/fetchBalance',
  async (customerId, { rejectWithValue }) => {
    try {
      const response = await customerFinancialService.getCustomerBalance(customerId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'خطا در دریافت اطلاعات مالی');
    }
  }
);

export const fetchCustomerTransactions = createAsyncThunk(
  'customerLedger/fetchTransactions',
  async ({ customerId, filters = {} }, { rejectWithValue }) => {
    try {
      const response = await customerFinancialService.getCustomerTransactions(customerId, filters);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'خطا در دریافت تراکنش‌ها');
    }
  }
);

export const fetchCustomerFinancialReport = createAsyncThunk(
  'customerLedger/fetchFinancialReport',
  async (customerId, { rejectWithValue }) => {
    try {
      const response = await customerFinancialService.getCustomerFinancialReport(customerId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'خطا در دریافت گزارش مالی');
    }
  }
);

export const addCustomerPayment = createAsyncThunk(
  'customerLedger/addPayment',
  async ({ customerId, paymentData }, { rejectWithValue, dispatch }) => {
    try {
      const response = await customerFinancialService.addPayment(customerId, paymentData);
      
      // بعد از ثبت پرداخت، بالانس و تراکنش‌ها را دوباره بارگذاری کن
      dispatch(fetchCustomerBalance(customerId));
      dispatch(fetchCustomerTransactions({ customerId }));
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'خطا در ثبت پرداخت');
    }
  }
);

export const addBalanceAdjustment = createAsyncThunk(
  'customerLedger/addBalanceAdjustment',
  async ({ customerId, adjustmentData }, { rejectWithValue, dispatch }) => {
    try {
      const response = await customerFinancialService.addBalanceAdjustment(customerId, adjustmentData);
      
      // بعد از تعدیل، بالانس و تراکنش‌ها را دوباره بارگذاری کن
      dispatch(fetchCustomerBalance(customerId));
      dispatch(fetchCustomerTransactions({ customerId }));
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'خطا در تعدیل بدهی');
    }
  }
);

export const fetchDebtorCustomers = createAsyncThunk(
  'customerLedger/fetchDebtorCustomers',
  async (minDebt = 0, { rejectWithValue }) => {
    try {
      const response = await customerFinancialService.getDebtorCustomers(minDebt);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'خطا در دریافت لیست مشتریان بدهکار');
    }
  }
);

export const fetchUnpaidOrders = createAsyncThunk(
  'customerLedger/fetchUnpaidOrders',
  async ({ customerId = null, daysOverdue = null } = {}, { rejectWithValue }) => {
    try {
      const response = await customerFinancialService.getUnpaidOrders(customerId, daysOverdue);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'خطا در دریافت سفارشات پرداخت نشده');
    }
  }
);

const initialState = {
  // اطلاعات مالی مشتری فعلی
  currentCustomerId: null,
  balance: null,
  transactions: [],
  financialReport: null,
  
  // لیست‌های عمومی
  debtorCustomers: [],
  unpaidOrders: [],
  
  // فیلترها
  transactionFilters: {
    dateFrom: null,
    dateTo: null,
    type: null,
    page: 1,
    pageSize: 10
  },
  
  // وضعیت‌های بارگذاری
  balanceLoading: false,
  transactionsLoading: false,
  financialReportLoading: false,
  debtorCustomersLoading: false,
  unpaidOrdersLoading: false,
  paymentLoading: false,
  adjustmentLoading: false,
  
  // خطاها
  balanceError: null,
  transactionsError: null,
  financialReportError: null,
  debtorCustomersError: null,
  unpaidOrdersError: null,
  paymentError: null,
  adjustmentError: null,

  // آخرین پرداخت ثبت شده
  lastPayment: null,
  lastAdjustment: null,
};

const customerLedgerSlice = createSlice({
  name: 'customerLedger',
  initialState,
  reducers: {
    // تنظیم مشتری فعلی
    setCurrentCustomer: (state, action) => {
      state.currentCustomerId = action.payload;
      // پاک کردن داده‌های قبلی
      state.balance = null;
      state.transactions = [];
      state.financialReport = null;
    },

    // تنظیم فیلترهای تراکنش
    setTransactionFilters: (state, action) => {
      state.transactionFilters = { ...state.transactionFilters, ...action.payload };
    },

    // ریست کردن فیلترها
    resetTransactionFilters: (state) => {
      state.transactionFilters = {
        dateFrom: null,
        dateTo: null,
        type: null,
        page: 1,
        pageSize: 10
      };
    },

    // پاک کردن خطاها
    clearErrors: (state) => {
      state.balanceError = null;
      state.transactionsError = null;
      state.financialReportError = null;
      state.debtorCustomersError = null;
      state.unpaidOrdersError = null;
      state.paymentError = null;
      state.adjustmentError = null;
    },

    // پاک کردن داده‌ها
    clearCustomerData: (state) => {
      state.currentCustomerId = null;
      state.balance = null;
      state.transactions = [];
      state.financialReport = null;
    },

    // پاک کردن آخرین عملیات
    clearLastOperations: (state) => {
      state.lastPayment = null;
      state.lastAdjustment = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Balance
      .addCase(fetchCustomerBalance.pending, (state) => {
        state.balanceLoading = true;
        state.balanceError = null;
      })
      .addCase(fetchCustomerBalance.fulfilled, (state, action) => {
        state.balanceLoading = false;
        state.balance = action.payload;
      })
      .addCase(fetchCustomerBalance.rejected, (state, action) => {
        state.balanceLoading = false;
        state.balanceError = action.payload;
      })

      // Transactions
      .addCase(fetchCustomerTransactions.pending, (state) => {
        state.transactionsLoading = true;
        state.transactionsError = null;
      })
      .addCase(fetchCustomerTransactions.fulfilled, (state, action) => {
        state.transactionsLoading = false;
        state.transactions = action.payload;
      })
      .addCase(fetchCustomerTransactions.rejected, (state, action) => {
        state.transactionsLoading = false;
        state.transactionsError = action.payload;
      })

      // Financial Report
      .addCase(fetchCustomerFinancialReport.pending, (state) => {
        state.financialReportLoading = true;
        state.financialReportError = null;
      })
      .addCase(fetchCustomerFinancialReport.fulfilled, (state, action) => {
        state.financialReportLoading = false;
        state.financialReport = action.payload;
      })
      .addCase(fetchCustomerFinancialReport.rejected, (state, action) => {
        state.financialReportLoading = false;
        state.financialReportError = action.payload;
      })

      // Add Payment
      .addCase(addCustomerPayment.pending, (state) => {
        state.paymentLoading = true;
        state.paymentError = null;
      })
      .addCase(addCustomerPayment.fulfilled, (state, action) => {
        state.paymentLoading = false;
        state.lastPayment = action.payload;
      })
      .addCase(addCustomerPayment.rejected, (state, action) => {
        state.paymentLoading = false;
        state.paymentError = action.payload;
      })

      // Balance Adjustment
      .addCase(addBalanceAdjustment.pending, (state) => {
        state.adjustmentLoading = true;
        state.adjustmentError = null;
      })
      .addCase(addBalanceAdjustment.fulfilled, (state, action) => {
        state.adjustmentLoading = false;
        state.lastAdjustment = action.payload;
      })
      .addCase(addBalanceAdjustment.rejected, (state, action) => {
        state.adjustmentLoading = false;
        state.adjustmentError = action.payload;
      })

      // Debtor Customers
      .addCase(fetchDebtorCustomers.pending, (state) => {
        state.debtorCustomersLoading = true;
        state.debtorCustomersError = null;
      })
      .addCase(fetchDebtorCustomers.fulfilled, (state, action) => {
        state.debtorCustomersLoading = false;
        state.debtorCustomers = action.payload;
      })
      .addCase(fetchDebtorCustomers.rejected, (state, action) => {
        state.debtorCustomersLoading = false;
        state.debtorCustomersError = action.payload;
      })

      // Unpaid Orders
      .addCase(fetchUnpaidOrders.pending, (state) => {
        state.unpaidOrdersLoading = true;
        state.unpaidOrdersError = null;
      })
      .addCase(fetchUnpaidOrders.fulfilled, (state, action) => {
        state.unpaidOrdersLoading = false;
        state.unpaidOrders = action.payload;
      })
      .addCase(fetchUnpaidOrders.rejected, (state, action) => {
        state.unpaidOrdersLoading = false;
        state.unpaidOrdersError = action.payload;
      });
  },
});

export const {
  setCurrentCustomer,
  setTransactionFilters,
  resetTransactionFilters,
  clearErrors,
  clearCustomerData,
  clearLastOperations
} = customerLedgerSlice.actions;

export default customerLedgerSlice.reducer; 