import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import searchService from '../../services/searchService';

// Async thunk for performing search
export const performSearch = createAsyncThunk(
  'search/performSearch',
  async (query, { rejectWithValue }) => {
    try {
      const response = await searchService.globalSearch(query);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'خطا در جستجو');
    }
  }
);

// Legacy support - alias for backward compatibility
export const performGlobalSearch = performSearch;

const searchSlice = createSlice({
  name: 'search',
  initialState: {
    query: '',
    results: [],
    searchHistory: JSON.parse(localStorage.getItem('searchHistory') || '[]'),
    loading: false,
    error: null,
    showResults: false
  },
  reducers: {
    setQuery: (state, action) => {
      state.query = action.payload;
    },
    clearSearchResults: (state) => {
      state.results = [];
      state.showResults = false;
      state.error = null;
    },
    clearSearch: (state) => {
      state.query = '';
      state.results = [];
      state.showResults = false;
      state.error = null;
    },
    setShowResults: (state, action) => {
      state.showResults = action.payload;
    },
    addToSearchHistory: (state, action) => {
      const query = action.payload.trim();
      if (query && !state.searchHistory.includes(query)) {
        state.searchHistory = [query, ...state.searchHistory.slice(0, 9)]; // Keep last 10 searches
        localStorage.setItem('searchHistory', JSON.stringify(state.searchHistory));
      }
    },
    clearSearchHistory: (state) => {
      state.searchHistory = [];
      localStorage.removeItem('searchHistory');
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(performSearch.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(performSearch.fulfilled, (state, action) => {
        state.loading = false;
        // Transform the response to match the expected format
        const response = action.payload;
        
        // If response is in old format, transform it
        if (response && (response.orders || response.products || response.customers)) {
          const results = [];
          
          // Add orders
          if (response.orders) {
            response.orders.forEach(order => {
              results.push({
                id: order.id,
                type: 'order',
                title: `سفارش #${order.orderNumber || order.id}`,
                description: `${order.customerName || 'نامشخص'} - ${order.storeName || ''}`,
                metadata: [
                  `${new Intl.NumberFormat('fa-IR').format(order.totalAmount)} تومان`,
                  new Date(order.orderDate).toLocaleDateString('fa-IR')
                ]
              });
            });
          }
          
          // Add products
          if (response.products) {
            response.products.forEach(product => {
              results.push({
                id: product.id,
                type: 'product',
                title: product.name,
                description: `کد: ${product.code} - ${product.category || ''}`,
                metadata: [
                  `${new Intl.NumberFormat('fa-IR').format(product.price)} تومان`
                ]
              });
            });
          }
          
          // Add customers
          if (response.customers) {
            response.customers.forEach(customer => {
              results.push({
                id: customer.id,
                type: 'customer',
                title: customer.name,
                description: customer.storeName || '',
                metadata: [
                  customer.city || '',
                  customer.phone || ''
                ].filter(Boolean)
              });
            });
          }
          
          state.results = results;
        } else {
          // If response is already in new format or is an array
          state.results = Array.isArray(response) ? response : [];
        }
        
        state.showResults = true;
      })
      .addCase(performSearch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.showResults = false;
      });
  }
});

export const { 
  setQuery, 
  clearSearch, 
  clearSearchResults, 
  setShowResults, 
  addToSearchHistory, 
  clearSearchHistory 
} = searchSlice.actions;

export default searchSlice.reducer; 