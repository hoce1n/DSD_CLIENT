import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../services/api';

// Async thunks
export const fetchDashboardStats = createAsyncThunk(
  'dashboard/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/dashboard/stats');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'خطا در دریافت آمار داشبورد');
    }
  }
);

export const fetchRecentOrders = createAsyncThunk(
  'dashboard/fetchRecentOrders',
  async (count = 5, { rejectWithValue }) => {
    try {
      const response = await API.get(`/dashboard/recent-orders?count=${count}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'خطا در دریافت سفارشات اخیر');
    }
  }
);

export const fetchChartsData = createAsyncThunk(
  'dashboard/fetchChartsData',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/dashboard/charts-data');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'خطا در دریافت اطلاعات چارت');
    }
  }
);

const initialState = {
  // Dashboard stats
  stats: {
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    totalUsers: 0,
    todayOrders: 0,
    totalUserOrders: 0,
    todayUserOrders: 0,
    isRegularUser: false
  },
  
  // User info
  userInfo: {
    isProfileComplete: true,
    customerName: '',
    userRole: 'User',
    isRegularUser: false
  },
  
  // Recent orders
  recentOrders: [],
  
  // Charts data
  chartsData: {
    monthlyOrders: [],
    dailyOrders: [],
    orderStatusStats: [],
    topProducts: []
  },
  
  // Loading states
  statsLoading: false,
  ordersLoading: false,
  chartsLoading: false,
  
  // Error states
  statsError: null,
  ordersError: null,
  chartsError: null,
  
  // General loading
  loading: false,
  error: null
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.statsError = null;
      state.ordersError = null;
      state.chartsError = null;
    },
    clearRecentOrders: (state) => {
      state.recentOrders = [];
    },
    setUserInfo: (state, action) => {
      state.userInfo = action.payload;
    }
  },
  extraReducers: (builder) => {
    // Fetch dashboard stats
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.statsLoading = true;
        state.statsError = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        if (action.payload.success) {
          state.stats = action.payload.data.stats;
          state.userInfo = action.payload.data.userInfo;
        }
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.statsLoading = false;
        state.statsError = action.payload;
      });

    // Fetch recent orders
    builder
      .addCase(fetchRecentOrders.pending, (state) => {
        state.ordersLoading = true;
        state.ordersError = null;
      })
      .addCase(fetchRecentOrders.fulfilled, (state, action) => {
        state.ordersLoading = false;
        if (action.payload.success) {
          state.recentOrders = action.payload.data;
        }
      })
      .addCase(fetchRecentOrders.rejected, (state, action) => {
        state.ordersLoading = false;
        state.ordersError = action.payload;
      });

    // Fetch charts data
    builder
      .addCase(fetchChartsData.pending, (state) => {
        state.chartsLoading = true;
        state.chartsError = null;
      })
      .addCase(fetchChartsData.fulfilled, (state, action) => {
        state.chartsLoading = false;
        if (action.payload.success) {
          state.chartsData = action.payload.data;
        }
      })
      .addCase(fetchChartsData.rejected, (state, action) => {
        state.chartsLoading = false;
        state.chartsError = action.payload;
      });
  }
});

export const { clearError, clearRecentOrders, setUserInfo } = dashboardSlice.actions;
export default dashboardSlice.reducer; 