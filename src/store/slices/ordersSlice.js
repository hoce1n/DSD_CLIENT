import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { orderService } from '../../services/orderService';

// Async thunks for order operations
export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async ({ page = 1, pageSize = 10, search = '' }, { rejectWithValue }) => {
    try {
      const response = await orderService.getOrders(page, pageSize, search);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'خطا در دریافت سفارشات');
    }
  }
);

export const fetchOrderById = createAsyncThunk(
  'orders/fetchOrderById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await orderService.getOrderById(id);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'خطا در دریافت جزئیات سفارش');
    }
  }
);

export const createOrder = createAsyncThunk(
  'orders/createOrder',
  async (orderData, { rejectWithValue }) => {
    try {
      const response = await orderService.createOrder(orderData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'خطا در ثبت سفارش');
    }
  }
);

export const updateOrderStatus = createAsyncThunk(
  'orders/updateOrderStatus',
  async ({ id, statusData }, { rejectWithValue }) => {
    try {
      const response = await orderService.updateOrderStatus(id, statusData);
      return { id, statusData, message: response.message };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'خطا در بروزرسانی وضعیت سفارش');
    }
  }
);

export const quickOrder = createAsyncThunk(
  'orders/quickOrder',
  async (orderItems, { rejectWithValue }) => {
    try {
      const response = await orderService.quickOrder(orderItems);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'خطا در ثبت سفارش سریع');
    }
  }
);

export const searchOrders = createAsyncThunk(
  'orders/searchOrders',
  async ({ searchTerm, filters = {} }, { rejectWithValue }) => {
    try {
      const response = await orderService.searchOrders(searchTerm, filters);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'خطا در جستجوی سفارشات');
    }
  }
);

export const cancelOrder = createAsyncThunk(
  'orders/cancelOrder',
  async ({ id, reason }, { rejectWithValue }) => {
    try {
      const response = await orderService.cancelOrder(id, reason);
      return { id, message: response.message };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'خطا در لغو سفارش');
    }
  }
);

const initialState = {
  // لیست سفارشات
  orders: [],
  totalCount: 0,
  currentPage: 1,
  pageSize: 10,
  totalPages: 0,
  
  // جزئیات سفارش منتخب
  selectedOrder: null,
  
  // وضعیت‌های loading
  loading: false,
  fetchingDetails: false,
  creating: false,
  updating: false,
  searching: false,
  
  // خطاها
  error: null,
  detailsError: null,
  
  // فیلترها و جستجو
  searchTerm: '',
  statusFilter: '',
  filters: {},
  
  // پیام‌های موفقیت
  successMessage: null,
  
  // modal states
  showCreateModal: false,
  showDetailsModal: false,
  showStatusModal: false,
  
  // سبد خرید سریع (برای کاربران عادی)
  cart: [],
  cartTotal: 0,
};

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    // UI State Management
    clearError: (state) => {
      state.error = null;
      state.detailsError = null;
    },
    
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    },
    
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload;
    },
    
    setStatusFilter: (state, action) => {
      state.statusFilter = action.payload;
    },
    
    setFilters: (state, action) => {
      state.filters = action.payload;
    },
    
    // Modal Management
    openCreateModal: (state) => {
      state.showCreateModal = true;
    },
    
    closeCreateModal: (state) => {
      state.showCreateModal = false;
    },
    
    openDetailsModal: (state, action) => {
      state.showDetailsModal = true;
      if (action.payload) {
        state.selectedOrder = action.payload;
      }
    },
    
    closeDetailsModal: (state) => {
      state.showDetailsModal = false;
      state.selectedOrder = null;
    },
    
    openStatusModal: (state, action) => {
      state.showStatusModal = true;
      state.selectedOrder = action.payload;
    },
    
    closeStatusModal: (state) => {
      state.showStatusModal = false;
    },
    
    // Cart Management (for quick orders)
    addToCart: (state, action) => {
      const { productId, productName, price, quantity, stock } = action.payload;
      
      const existingItem = state.cart.find(item => item.productId === productId);
      
      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity <= stock) {
          existingItem.quantity = newQuantity;
          existingItem.totalPrice = existingItem.price * newQuantity;
        }
      } else {
        state.cart.push({
          productId,
          productName,
          price,
          quantity: Math.min(quantity, stock),
          stock,
          totalPrice: price * Math.min(quantity, stock)
        });
      }
      
      // Update cart total
      state.cartTotal = state.cart.reduce((total, item) => total + item.totalPrice, 0);
    },
    
    removeFromCart: (state, action) => {
      const productId = action.payload;
      state.cart = state.cart.filter(item => item.productId !== productId);
      state.cartTotal = state.cart.reduce((total, item) => total + item.totalPrice, 0);
    },
    
    updateCartQuantity: (state, action) => {
      const { productId, quantity } = action.payload;
      const item = state.cart.find(item => item.productId === productId);
      
      if (item && quantity > 0 && quantity <= item.stock) {
        item.quantity = quantity;
        item.totalPrice = item.price * quantity;
        state.cartTotal = state.cart.reduce((total, item) => total + item.totalPrice, 0);
      }
    },
    
    clearCart: (state) => {
      state.cart = [];
      state.cartTotal = 0;
    },
    
    // Pagination
    setPage: (state, action) => {
      state.currentPage = action.payload;
    },
    
    setPageSize: (state, action) => {
      state.pageSize = action.payload;
      state.currentPage = 1; // Reset to first page when changing page size
    },
  },
  
  extraReducers: (builder) => {
    builder
      // Fetch Orders
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload.orders;
        state.totalCount = action.payload.totalCount;
        state.currentPage = action.payload.currentPage;
        state.pageSize = action.payload.pageSize;
        state.totalPages = action.payload.totalPages;
        state.error = null;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch Order Details
      .addCase(fetchOrderById.pending, (state) => {
        state.fetchingDetails = true;
        state.detailsError = null;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.fetchingDetails = false;
        state.selectedOrder = action.payload;
        state.detailsError = null;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.fetchingDetails = false;
        state.detailsError = action.payload;
      })
      
      // Create Order
      .addCase(createOrder.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.creating = false;
        state.successMessage = action.payload.message;
        state.showCreateModal = false;
        // Clear cart after successful order
        state.cart = [];
        state.cartTotal = 0;
        state.error = null;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload;
      })
      
      // Update Order Status
      .addCase(updateOrderStatus.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.updating = false;
        state.successMessage = action.payload.message;
        state.showStatusModal = false;
        
        // Update order in the list
        const orderIndex = state.orders.findIndex(order => order.id === action.payload.id);
        if (orderIndex !== -1) {
          state.orders[orderIndex].status = action.payload.statusData.status;
          state.orders[orderIndex].statusText = action.payload.statusData.status; // You might want to map this properly
        }
        
        // Update selected order if it matches
        if (state.selectedOrder && state.selectedOrder.id === action.payload.id) {
          state.selectedOrder.status = action.payload.statusData.status;
        }
        
        state.error = null;
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload;
      })
      
      // Quick Order
      .addCase(quickOrder.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(quickOrder.fulfilled, (state, action) => {
        state.creating = false;
        state.successMessage = action.payload.message;
        state.cart = [];
        state.cartTotal = 0;
        state.error = null;
      })
      .addCase(quickOrder.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload;
      })
      
      // Search Orders
      .addCase(searchOrders.pending, (state) => {
        state.searching = true;
        state.error = null;
      })
      .addCase(searchOrders.fulfilled, (state, action) => {
        state.searching = false;
        state.orders = action.payload.orders;
        state.totalCount = action.payload.totalCount;
        state.currentPage = action.payload.currentPage || 1;
        state.totalPages = action.payload.totalPages;
        state.error = null;
      })
      .addCase(searchOrders.rejected, (state, action) => {
        state.searching = false;
        state.error = action.payload;
      })
      
      // Cancel Order
      .addCase(cancelOrder.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.updating = false;
        state.successMessage = action.payload.message;
        
        // Update order status in the list
        const orderIndex = state.orders.findIndex(order => order.id === action.payload.id);
        if (orderIndex !== -1) {
          state.orders[orderIndex].status = 'Cancelled';
          state.orders[orderIndex].statusText = 'لغو شده';
        }
        
        state.error = null;
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearError,
  clearSuccessMessage,
  setSearchTerm,
  setStatusFilter,
  setFilters,
  openCreateModal,
  closeCreateModal,
  openDetailsModal,
  closeDetailsModal,
  openStatusModal,
  closeStatusModal,
  addToCart,
  removeFromCart,
  updateCartQuantity,
  clearCart,
  setPage,
  setPageSize,
} = ordersSlice.actions;

export default ordersSlice.reducer;