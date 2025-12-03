import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Eye, Search, Filter, Users as UsersIcon, UserCheck, UserX, UserPlus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import ResponsiveTable from './UI/ResponsiveTable';
import CreateSalesRepModal from './CreateSalesRepModal';
import {
  fetchUsers,
  fetchRoles,
  fetchUser,
  setShowViewModal,
  setFilters,
  setCurrentPage,
  setPageSize,
  clearMessages,
  toggleUserSelection,
  selectAllUsers,
  clearUserSelection
} from '../store/slices/usersSlice';

const Users = () => {
  const dispatch = useDispatch();
  const {
    users,
    totalCount,
    currentPage,
    pageSize,
    totalPages,
    stats,
    roles,
    filters,
    loading,
    userLoading,
    rolesLoading,
    showViewModal,
    selectedUsers,
    error,
    successMessage,
    currentUser
  } = useSelector((state) => state.users);

  const { user } = useSelector((state) => state.auth);
  const isAdmin = user?.role === 'Admin';

  // Local state for forms
  const [searchTerm, setSearchTerm] = useState(filters.search);
  const [selectedRole, setSelectedRole] = useState(filters.roleId);
  const [statusFilter, setStatusFilter] = useState(filters.isActive);
  const [sortBy, setSortBy] = useState(filters.sortBy);
  const [sortDesc, setSortDesc] = useState(filters.sortDesc);
  const [showCreateSalesRepModal, setShowCreateSalesRepModal] = useState(false);

  // Load data on component mount
  useEffect(() => {
    dispatch(fetchUsers({
      page: currentPage,
      pageSize,
      search: filters.search,
      roleId: filters.roleId,
      isActive: filters.isActive,
      sortBy: filters.sortBy,
      sortDesc: filters.sortDesc
    }));
    dispatch(fetchRoles());
  }, [dispatch, currentPage, pageSize, filters]);

  // Auto-clear messages after 5 seconds
  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      const timer = setTimeout(() => {
        dispatch(clearMessages());
      }, 5000);
      return () => clearTimeout(timer);
    }
    if (error) {
      toast.error(error);
      const timer = setTimeout(() => {
        dispatch(clearMessages());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, error, dispatch]);

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== filters.search) {
        handleFilterChange({ search: searchTerm });
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Event handlers
  const handleFilterChange = (newFilters) => {
    dispatch(setFilters(newFilters));
    dispatch(setCurrentPage(1));
  };

  const handleSortChange = (field) => {
    const isDesc = sortBy === field ? !sortDesc : false;
    setSortBy(field);
    setSortDesc(isDesc);
    handleFilterChange({ sortBy: field, sortDesc: isDesc });
  };

  const handlePageChange = (page) => {
    dispatch(setCurrentPage(page));
  };

  const handlePageSizeChange = (newPageSize) => {
    dispatch(setPageSize(newPageSize));
  };

  const handleViewUser = async (userObj) => {
    await dispatch(fetchUser(userObj.id));
    dispatch(setShowViewModal(true));
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      dispatch(clearUserSelection());
    } else {
      dispatch(selectAllUsers());
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  const getStatusBadge = (isActive) => {
    return isActive
      ? { text: 'فعال', color: 'text-green-600 bg-green-50' }
      : { text: 'غیرفعال', color: 'text-red-600 bg-red-50' };
  };

  const getRoleBadge = (roleName) => {
    const roleColors = {
      'Admin': 'text-red-600 bg-red-50',
      'Manager': 'text-purple-600 bg-purple-50',
      'SalesRep': 'text-blue-600 bg-blue-50',
      'User': 'text-gray-600 bg-gray-50'
    };
    
    return roleColors[roleName] || 'text-gray-600 bg-gray-50';
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return '↕️';
    return sortDesc ? '⬇️' : '⬆️';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-0 py-4 sm:py-6">
            <div className="text-right flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">مدیریت کاربران</h1>
              <p className="mt-1 text-sm text-gray-500">
                مجموع {totalCount} کاربر
              </p>
            </div>
            
            {/* Action Buttons */}
            {isAdmin && (
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCreateSalesRepModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  تبدیل به ویزیتور
                </button>
              </div>
            )}
            
            {/* Stats Cards */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
              <div className="bg-green-50 px-3 py-2 rounded-lg flex-1 sm:flex-initial min-h-[44px]">
                <div className="flex items-center justify-center sm:justify-start">
                  <UserCheck className="w-5 h-5 text-green-600 ml-2" />
                  <div>
                    <p className="text-xs text-green-600">فعال</p>
                    <p className="text-sm font-bold text-green-800">{stats.activeUsers}</p>
                  </div>
                </div>
              </div>
              <div className="bg-red-50 px-3 py-2 rounded-lg flex-1 sm:flex-initial min-h-[44px]">
                <div className="flex items-center justify-center sm:justify-start">
                  <UserX className="w-5 h-5 text-red-600 ml-2" />
                  <div>
                    <p className="text-xs text-red-600">غیرفعال</p>
                    <p className="text-sm font-bold text-red-800">{stats.inactiveUsers}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                جستجو
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="نام کاربری، نام، ایمیل..."
                  className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Role Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                نقش
              </label>
              <select
                value={selectedRole || ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? null : parseInt(e.target.value);
                  setSelectedRole(value);
                  handleFilterChange({ roleId: value });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">همه نقش‌ها</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                وضعیت
              </label>
              <select
                value={statusFilter === null ? '' : statusFilter.toString()}
                onChange={(e) => {
                  const value = e.target.value === '' ? null : e.target.value === 'true';
                  setStatusFilter(value);
                  handleFilterChange({ isActive: value });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">همه</option>
                <option value="true">فعال</option>
                <option value="false">غیرفعال</option>
              </select>
            </div>

            {/* Page Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                تعداد نمایش
              </label>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="mr-3 text-gray-600">در حال بارگذاری...</span>
            </div>
          ) : (
            <ResponsiveTable
              columns={[
                {
                  key: 'username',
                  header: (
                    <button onClick={() => handleSortChange('username')} className="flex items-center hover:text-gray-700">
                      نام کاربری {getSortIcon('username')}
                    </button>
                  ),
                  primary: true,
                  render: (userObj) => (
                    <span className="text-sm font-medium text-gray-900">
                      {userObj.username}
                    </span>
                  )
                },
                {
                  key: 'fullName',
                  header: (
                    <button onClick={() => handleSortChange('firstname')} className="flex items-center hover:text-gray-700">
                      نام و نام خانوادگی {getSortIcon('firstname')}
                    </button>
                  ),
                  primary: true,
                  render: (userObj) => (
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {userObj.firstName} {userObj.lastName}
                      </div>
                      {userObj.phoneNumber && (
                        <div className="text-sm text-gray-500">{userObj.phoneNumber}</div>
                      )}
                    </div>
                  )
                },
                {
                  key: 'email',
                  header: (
                    <button onClick={() => handleSortChange('email')} className="flex items-center hover:text-gray-700">
                      ایمیل {getSortIcon('email')}
                    </button>
                  ),
                  render: (userObj) => (
                    <span className="text-sm text-gray-900">{userObj.email}</span>
                  )
                },
                {
                  key: 'role',
                  header: (
                    <button onClick={() => handleSortChange('role')} className="flex items-center hover:text-gray-700">
                      نقش {getSortIcon('role')}
                    </button>
                  ),
                  render: (userObj) => {
                    const roleColor = getRoleBadge(userObj.role.name);
                    return (
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${roleColor}`}>
                        {userObj.role.name}
                      </span>
                    );
                  }
                },
                {
                  key: 'status',
                  header: 'وضعیت',
                  render: (userObj) => {
                    const status = getStatusBadge(userObj.isActive);
                    return (
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${status.color}`}>
                          {status.text}
                        </span>
                        {(userObj.role.name === 'User' || userObj.role.name === 'SalesRep') && (
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            userObj.isSalesRepActivated 
                              ? 'bg-green-100 text-green-800' 
                              : userObj.role.name === 'User' 
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {userObj.isSalesRepActivated 
                              ? 'ویزیتور فعال' 
                              : userObj.role.name === 'User' 
                                ? 'قابل تبدیل' 
                                : 'نیاز به تکمیل'}
                          </span>
                        )}
                      </div>
                    );
                  }
                },
                {
                  key: 'createdAt',
                  header: (
                    <button onClick={() => handleSortChange('createdat')} className="flex items-center hover:text-gray-700">
                      تاریخ ایجاد {getSortIcon('createdat')}
                    </button>
                  ),
                  render: (userObj) => (
                    <span className="text-sm text-gray-500">
                      {formatDate(userObj.createdAt)}
                    </span>
                  )
                },
                {
                  key: 'actions',
                  header: 'عملیات',
                  render: (userObj) => (
                    <button
                      onClick={() => handleViewUser(userObj)}
                      className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                      title="مشاهده جزئیات"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )
                }
              ]}
              data={users}
              loading={loading}
              emptyMessage="فیلترها را تغییر دهید تا کاربران نمایش داده شوند"
              emptyIcon={UsersIcon}
              mobileBreakpoint="md"
            />
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-3 sm:px-6 py-3 bg-gray-50 border-t">
              <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
                <div className="text-xs sm:text-sm text-gray-700">
                  نمایش {(currentPage - 1) * pageSize + 1} تا {Math.min(currentPage * pageSize, totalCount)} از {totalCount} کاربر
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-2 sm:px-3 py-1 text-xs sm:text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 min-h-[44px]"
                  >
                    قبلی
                  </button>
                  {[...Array(totalPages)].map((_, index) => {
                    const page = index + 1;
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 2 && page <= currentPage + 2)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-2 sm:px-3 py-1 text-xs sm:text-sm border rounded-md min-h-[44px] ${
                            page === currentPage
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      page === currentPage - 3 ||
                      page === currentPage + 3
                    ) {
                      return <span key={page} className="px-2 text-gray-500">...</span>;
                    }
                    return null;
                  })}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-2 sm:px-3 py-1 text-xs sm:text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 min-h-[44px]"
                  >
                    بعدی
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* View User Modal */}
      {showViewModal && currentUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-semibold">جزئیات کاربر</h2>
            </div>
            <div className="px-6 py-4 space-y-6">
              {/* User Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">نام کاربری</label>
                  <p className="text-sm text-gray-900">{currentUser.username}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">نقش</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleBadge(currentUser.role.name)}`}>
                    {currentUser.role.name}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">نام</label>
                  <p className="text-sm text-gray-900">{currentUser.firstName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">نام خانوادگی</label>
                  <p className="text-sm text-gray-900">{currentUser.lastName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ایمیل</label>
                  <p className="text-sm text-gray-900">{currentUser.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">شماره تلفن</label>
                  <p className="text-sm text-gray-900">{currentUser.phoneNumber || 'تعریف نشده'}</p>
                </div>
              </div>

              {/* Customer Info (if exists) */}
              {currentUser.customer && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">اطلاعات مشتری</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">نام فروشگاه</label>
                      <p className="text-sm text-gray-900">{currentUser.customer.storeTitle || 'تعریف نشده'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">وضعیت پروفایل</label>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        currentUser.customer.isProfileComplete 
                          ? 'text-green-600 bg-green-50' 
                          : 'text-yellow-600 bg-yellow-50'
                      }`}>
                        {currentUser.customer.isProfileComplete ? 'تکمیل شده' : 'ناقص'}
                      </span>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">آدرس</label>
                      <p className="text-sm text-gray-900">{currentUser.customer.address || 'تعریف نشده'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Stats */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">آمار کاربر</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg text-center">
                    <p className="text-xs text-blue-600">کل سفارشات</p>
                    <p className="text-lg font-bold text-blue-800">{currentUser.stats.totalOrders}</p>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-lg text-center">
                    <p className="text-xs text-yellow-600">در انتظار</p>
                    <p className="text-lg font-bold text-yellow-800">{currentUser.stats.pendingOrders}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg text-center">
                    <p className="text-xs text-green-600">تکمیل شده</p>
                    <p className="text-lg font-bold text-green-800">{currentUser.stats.completedOrders}</p>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">تاریخ ایجاد</label>
                  <p className="text-sm text-gray-900">{formatDate(currentUser.createdAt)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">آخرین ورود</label>
                  <p className="text-sm text-gray-900">
                    {currentUser.lastLoginAt ? formatDate(currentUser.lastLoginAt) : 'هرگز وارد نشده'}
                  </p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end">
              <button
                onClick={() => dispatch(setShowViewModal(false))}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Convert to SalesRep Modal */}
      <CreateSalesRepModal
        isOpen={showCreateSalesRepModal}
        onClose={() => setShowCreateSalesRepModal(false)}
        onSuccess={() => {
          // Refresh users list to see the updated SalesRep status
          dispatch(fetchUsers({
            page: currentPage,
            pageSize,
            search: filters.search,
            roleId: filters.roleId,
            isActive: filters.isActive,
            sortBy: filters.sortBy,
            sortDesc: filters.sortDesc
          }));
        }}
      />
    </div>
  );
};

export default Users; 