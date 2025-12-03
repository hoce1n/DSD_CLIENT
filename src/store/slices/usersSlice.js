import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../services/api';

// Async thunks for API calls
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await API.get('/users', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'خطا در دریافت کاربران');
    }
  }
);

export const fetchUser = createAsyncThunk(
  'users/fetchUser',
  async (id, { rejectWithValue }) => {
    try {
      const response = await API.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'خطا در دریافت جزئیات کاربر');
    }
  }
);

export const fetchRoles = createAsyncThunk(
  'users/fetchRoles',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/users/roles');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'خطا در دریافت نقش‌ها');
    }
  }
);

const usersSlice = createSlice({
  name: 'users',
  initialState: {
    // Users list
    users: [],
    totalCount: 0,
    currentPage: 1,
    pageSize: 10,
    totalPages: 0,
    
    // Current user
    currentUser: null,
    
    // Roles
    roles: [],
    
    // Stats
    stats: {
      activeUsers: 0,
      inactiveUsers: 0,
      totalUsers: 0
    },
    
    // Filters
    filters: {
      search: '',
      roleId: null,
      isActive: null,
      sortBy: 'username',
      sortDesc: false
    },
    
    // Loading states
    loading: false,
    userLoading: false,
    rolesLoading: false,
    
    // UI states
    showViewModal: false,
    selectedUsers: [],
    
    // Error handling
    error: null,
    userError: null,
    rolesError: null,
    
    // Success messages
    successMessage: null
  },
  reducers: {
    // UI state management
    setShowViewModal: (state, action) => {
      state.showViewModal = action.payload;
      if (!action.payload) {
        state.error = null;
        state.currentUser = null;
      }
    },
    
    // User selection
    toggleUserSelection: (state, action) => {
      const userId = action.payload;
      const index = state.selectedUsers.indexOf(userId);
      if (index > -1) {
        state.selectedUsers.splice(index, 1);
      } else {
        state.selectedUsers.push(userId);
      }
    },
    selectAllUsers: (state) => {
      state.selectedUsers = state.users.map(user => user.id);
    },
    clearUserSelection: (state) => {
      state.selectedUsers = [];
    },
    
    // Filters
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        search: '',
        roleId: null,
        isActive: null,
        sortBy: 'username',
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
      state.userError = null;
      state.rolesError = null;
      state.successMessage = null;
    },
    setSuccessMessage: (state, action) => {
      state.successMessage = action.payload;
    },
    
    // Reset state
    resetUsersState: (state) => {
      state.users = [];
      state.currentUser = null;
      state.selectedUsers = [];
      state.error = null;
      state.successMessage = null;
      state.showViewModal = false;
    }
  },
  extraReducers: (builder) => {
    // Fetch users
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success) {
          state.users = action.payload.data.items;
          state.totalCount = action.payload.data.totalCount;
          state.currentPage = action.payload.data.page;
          state.pageSize = action.payload.data.pageSize;
          state.totalPages = action.payload.data.totalPages;
          state.stats = action.payload.data.stats;
        }
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch single user
    builder
      .addCase(fetchUser.pending, (state) => {
        state.userLoading = true;
        state.userError = null;
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.userLoading = false;
        if (action.payload.success) {
          state.currentUser = action.payload.data;
        }
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.userLoading = false;
        state.userError = action.payload;
      });

    // Fetch roles
    builder
      .addCase(fetchRoles.pending, (state) => {
        state.rolesLoading = true;
        state.rolesError = null;
      })
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.rolesLoading = false;
        if (action.payload.success) {
          state.roles = action.payload.data;
        }
      })
      .addCase(fetchRoles.rejected, (state, action) => {
        state.rolesLoading = false;
        state.rolesError = action.payload;
      });
  }
});

export const {
  setShowViewModal,
  toggleUserSelection,
  selectAllUsers,
  clearUserSelection,
  setFilters,
  clearFilters,
  setCurrentPage,
  setPageSize,
  clearMessages,
  setSuccessMessage,
  resetUsersState
} = usersSlice.actions;

export default usersSlice.reducer; 