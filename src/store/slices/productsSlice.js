import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../services/api';

// Async thunks for API calls
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await API.get('/products', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'خطا در دریافت محصولات');
    }
  }
);

export const fetchProduct = createAsyncThunk(
  'products/fetchProduct',
  async (id, { rejectWithValue }) => {
    try {
      const response = await API.get(`/products/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'خطا در دریافت جزئیات محصول');
    }
  }
);

export const createProduct = createAsyncThunk(
  'products/createProduct',
  async (productData, { rejectWithValue }) => {
    try {
      const response = await API.post('/products', productData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'خطا در ایجاد محصول');
    }
  }
);

export const updateProduct = createAsyncThunk(
  'products/updateProduct',
  async ({ id, productData }, { rejectWithValue }) => {
    try {
      const response = await API.put(`/products/${id}`, productData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'خطا در ویرایش محصول');
    }
  }
);

export const deleteProduct = createAsyncThunk(
  'products/deleteProduct',
  async (id, { rejectWithValue }) => {
    try {
      const response = await API.delete(`/products/${id}`);
      return { id, message: response.data.message };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'خطا در حذف محصول');
    }
  }
);

export const searchProducts = createAsyncThunk(
  'products/searchProducts',
  async (term, { rejectWithValue }) => {
    try {
      const response = await API.get('/products/search', { params: { term } });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'خطا در جستجوی محصولات');
    }
  }
);

export const fetchCategories = createAsyncThunk(
  'products/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/products/categories');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'خطا در دریافت دسته‌بندی‌ها');
    }
  }
);

const productsSlice = createSlice({
  name: 'products',
  initialState: {
    // Products list
    products: [],
    totalCount: 0,
    currentPage: 1,
    pageSize: 10,
    totalPages: 0,
    
    // Current product
    currentProduct: null,
    
    // Search results
    searchResults: [],
    
    // Categories
    categories: [],
    
    // Filters
    filters: {
      category: '',
      search: '',
      sortBy: 'name',
      sortDesc: false
    },
    
    // Loading states
    loading: false,
    productLoading: false,
    searchLoading: false,
    categoriesLoading: false,
    
    // UI states
    showCreateModal: false,
    showEditModal: false,
    showDeleteModal: false,
    selectedProducts: [],
    
    // Error handling
    error: null,
    productError: null,
    searchError: null,
    categoriesError: null,
    
    // Success messages
    successMessage: null
  },
  reducers: {
    // UI state management
    setShowCreateModal: (state, action) => {
      state.showCreateModal = action.payload;
      if (!action.payload) {
        state.error = null;
      }
    },
    setShowEditModal: (state, action) => {
      state.showEditModal = action.payload;
      if (!action.payload) {
        state.error = null;
        state.currentProduct = null;
      }
    },
    setShowDeleteModal: (state, action) => {
      state.showDeleteModal = action.payload;
      if (!action.payload) {
        state.error = null;
      }
    },
    
    // Product selection
    toggleProductSelection: (state, action) => {
      const productId = action.payload;
      const index = state.selectedProducts.indexOf(productId);
      if (index > -1) {
        state.selectedProducts.splice(index, 1);
      } else {
        state.selectedProducts.push(productId);
      }
    },
    selectAllProducts: (state) => {
      state.selectedProducts = state.products.map(product => product.id);
    },
    clearProductSelection: (state) => {
      state.selectedProducts = [];
    },
    
    // Filters
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        category: '',
        search: '',
        sortBy: 'name',
        sortDesc: false
      };
    },
    
    // Pagination
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },
    setPageSize: (state, action) => {
      state.pageSize = action.payload;
      state.currentPage = 1; // Reset to first page when page size changes
    },
    
    // Messages
    clearMessages: (state) => {
      state.error = null;
      state.productError = null;
      state.searchError = null;
      state.categoriesError = null;
      state.successMessage = null;
    },
    setSuccessMessage: (state, action) => {
      state.successMessage = action.payload;
    },
    
    // Reset state
    resetProductsState: (state) => {
      state.products = [];
      state.currentProduct = null;
      state.searchResults = [];
      state.selectedProducts = [];
      state.error = null;
      state.successMessage = null;
      state.showCreateModal = false;
      state.showEditModal = false;
      state.showDeleteModal = false;
    }
  },
  extraReducers: (builder) => {
    // Fetch products
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success) {
          state.products = action.payload.data.items;
          state.totalCount = action.payload.data.totalCount;
          state.currentPage = action.payload.data.page;
          state.pageSize = action.payload.data.pageSize;
          state.totalPages = action.payload.data.totalPages;
        }
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch single product
    builder
      .addCase(fetchProduct.pending, (state) => {
        state.productLoading = true;
        state.productError = null;
      })
      .addCase(fetchProduct.fulfilled, (state, action) => {
        state.productLoading = false;
        if (action.payload.success) {
          state.currentProduct = action.payload.data;
        }
      })
      .addCase(fetchProduct.rejected, (state, action) => {
        state.productLoading = false;
        state.productError = action.payload;
      });

    // Create product
    builder
      .addCase(createProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success) {
          state.products.unshift(action.payload.data);
          state.totalCount += 1;
          state.successMessage = action.payload.message;
          state.showCreateModal = false;
        }
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Update product
    builder
      .addCase(updateProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success) {
          const index = state.products.findIndex(p => p.id === action.payload.data.id);
          if (index !== -1) {
            state.products[index] = action.payload.data;
          }
          state.currentProduct = action.payload.data;
          state.successMessage = action.payload.message;
          state.showEditModal = false;
        }
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Delete product
    builder
      .addCase(deleteProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.products = state.products.filter(p => p.id !== action.payload.id);
        state.totalCount -= 1;
        state.successMessage = action.payload.message;
        state.showDeleteModal = false;
        // Remove from selected products if it was selected
        state.selectedProducts = state.selectedProducts.filter(id => id !== action.payload.id);
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Search products
    builder
      .addCase(searchProducts.pending, (state) => {
        state.searchLoading = true;
        state.searchError = null;
      })
      .addCase(searchProducts.fulfilled, (state, action) => {
        state.searchLoading = false;
        if (action.payload.success) {
          state.searchResults = action.payload.data;
        }
      })
      .addCase(searchProducts.rejected, (state, action) => {
        state.searchLoading = false;
        state.searchError = action.payload;
      });

    // Fetch categories
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.categoriesLoading = true;
        state.categoriesError = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categoriesLoading = false;
        if (action.payload.success) {
          state.categories = action.payload.data;
        }
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.categoriesLoading = false;
        state.categoriesError = action.payload;
      });
  }
});

export const {
  setShowCreateModal,
  setShowEditModal,
  setShowDeleteModal,
  toggleProductSelection,
  selectAllProducts,
  clearProductSelection,
  setFilters,
  clearFilters,
  setCurrentPage,
  setPageSize,
  clearMessages,
  setSuccessMessage,
  resetProductsState
} = productsSlice.actions;

export default productsSlice.reducer; 