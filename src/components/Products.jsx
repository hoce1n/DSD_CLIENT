import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Edit, Trash2, Search, Filter, ShoppingCart, Minus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiHelpers } from '../services/api';
import PersianDatePicker from './PersianDatePicker';
import ResponsiveTable from './UI/ResponsiveTable';
import {
  fetchProducts,
  fetchCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  setShowCreateModal,
  setShowEditModal,
  setShowDeleteModal,
  setFilters,
  setCurrentPage,
  setPageSize,
  clearMessages,
  toggleProductSelection,
  selectAllProducts,
  clearProductSelection,
  fetchProduct
} from '../store/slices/productsSlice';

const Products = () => {
  const dispatch = useDispatch();
  const {
    products,
    totalCount,
    currentPage,
    pageSize,
    totalPages,
    categories,
    filters,
    loading,
    productLoading,
    categoriesLoading,
    showCreateModal,
    showEditModal,
    showDeleteModal,
    selectedProducts,
    error,
    successMessage,
    currentProduct
  } = useSelector((state) => state.products);
  
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const canEdit = user?.role === 'Admin' || user?.role === 'Manager';
  const isCustomer = user?.role === 'User';

  // Cart state for customers
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');

  // Local state for forms
  const [productForm, setProductForm] = useState({
    name: '',
    code: '',
    description: '',
    price: '',
    discountedPrice: '',
    stock: '',
    category: '',
    isActive: true
  });

  const [searchTerm, setSearchTerm] = useState(filters.search);
  const [selectedCategory, setSelectedCategory] = useState(filters.category);
  const [sortBy, setSortBy] = useState(filters.sortBy);
  const [sortDesc, setSortDesc] = useState(filters.sortDesc);

  // Load data on component mount
  useEffect(() => {
    dispatch(fetchProducts({
      page: currentPage,
      pageSize,
      category: filters.category,
      search: filters.search,
      sortBy: filters.sortBy,
      sortDesc: filters.sortDesc
    }));
    dispatch(fetchCategories());
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

  // Cart functions for customers
  const addToCart = (product, quantity = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevCart, { ...product, quantity }];
    });
    toast.success(`${product.name} به سبد خرید اضافه شد`);
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const updateCartQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => {
      const price = item.discountedPrice || item.price;
      return total + (price * item.quantity);
    }, 0);
  };

  const submitOrder = async () => {
    if (cart.length === 0) {
      toast.error('سبد خرید خالی است');
      return;
    }

    try {
      const orderData = {
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          unitPrice: item.discountedPrice || item.price
        })),
        expectedDeliveryDate: expectedDeliveryDate || null
      };

      const result = await apiHelpers.post('/orders', orderData);
      
      toast.success('سفارش با موفقیت ثبت شد');
      setCart([]);
      setExpectedDeliveryDate('');
      setShowCart(false);
    } catch (error) {
      toast.error(error.message || 'خطا در ثبت سفارش');
    }
  };

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

  const resetForm = () => {
    setProductForm({
      name: '',
      code: '',
      description: '',
      price: '',
      discountedPrice: '',
      stock: '',
      category: '',
      isActive: true
    });
  };

  const handleCreateProduct = () => {
    dispatch(setShowCreateModal(true));
    resetForm();
  };

  const handleEditProduct = async (product) => {
    setProductForm({
      name: product.name,
      code: product.code,
      description: product.description || '',
      price: product.price.toString(),
      discountedPrice: product.discountedPrice?.toString() || '',
      stock: product.stock.toString(),
      category: product.category || '',
      isActive: product.isActive
    });
    await dispatch(fetchProduct(product.id));
    dispatch(setShowEditModal(true));
  };

  const handleDeleteProduct = async (product) => {
    await dispatch(fetchProduct(product.id));
    dispatch(setShowDeleteModal(true));
  };

  const handleSubmitCreate = async (e) => {
    e.preventDefault();
    const result = await dispatch(createProduct({
      ...productForm,
      price: parseFloat(productForm.price),
      discountedPrice: productForm.discountedPrice ? parseFloat(productForm.discountedPrice) : null,
      stock: parseInt(productForm.stock)
    }));
    if (result.type.endsWith('fulfilled')) {
      resetForm();
    }
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    const result = await dispatch(updateProduct({
      id: currentProduct.id,
      productData: {
        ...productForm,
        price: parseFloat(productForm.price),
        discountedPrice: productForm.discountedPrice ? parseFloat(productForm.discountedPrice) : null,
        stock: parseInt(productForm.stock)
      }
    }));
    if (result.type.endsWith('fulfilled')) {
      resetForm();
    }
  };

  const handleConfirmDelete = async () => {
    await dispatch(deleteProduct(currentProduct.id));
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      dispatch(clearProductSelection());
    } else {
      dispatch(selectAllProducts(products.map(p => p.id)));
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
  };

  const getStockStatus = (stock) => {
    if (stock === 0) return { text: 'ناموجود', color: 'bg-red-100 text-red-800' };
    if (stock <= 10) return { text: 'کم', color: 'bg-yellow-100 text-yellow-800' };
    return { text: 'موجود', color: 'bg-green-100 text-green-800' };
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return '↕️';
    return sortDesc ? '⬇️' : '⬆️';
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-0 py-4 sm:py-6">
            <div className="text-right flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                {isCustomer ? 'فروشگاه محصولات' : 'مدیریت محصولات'}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {isCustomer ? `${totalCount} محصول موجود` : `مجموع ${totalCount} محصول`}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 w-full sm:w-auto">
              {isCustomer && (
                <button
                  onClick={() => setShowCart(true)}
                  className="relative bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto min-h-[44px]"
                >
                  <ShoppingCart className="w-5 h-5" />
                  سبد خرید
                  {cart.length > 0 && (
                    <span className="absolute -top-2 -right-2 sm:-top-2 sm:-right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {cart.length}
                    </span>
                  )}
                </button>
              )}
              {canEdit && (
                <button
                  onClick={handleCreateProduct}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto min-h-[44px]"
                >
                  <Plus className="w-5 h-5" />
                  <span className="hidden xs:inline sm:inline">افزودن محصول</span>
                  <span className="sm:hidden">افزودن</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
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
                  placeholder="نام یا کد محصول..."
                  className="w-full pr-10 pl-3 py-2.5 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm min-h-[44px]"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                دسته‌بندی
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  handleFilterChange({ category: e.target.value });
                }}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm min-h-[44px]"
              >
                <option value="">همه دسته‌بندی‌ها</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
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
                className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm min-h-[44px]"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-end gap-2">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('');
                  handleFilterChange({ search: '', category: '', sortBy: 'name', sortDesc: false });
                }}
                className="px-4 py-2.5 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm min-h-[44px] w-full sm:w-auto"
              >
                <Filter className="w-4 h-4" />
                پاک کردن فیلترها
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      {(successMessage || error) && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`p-4 rounded-lg mb-6 ${
            successMessage ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            <div className="flex justify-between items-center">
              <span>{successMessage || error}</span>
              <button
                onClick={() => dispatch(clearMessages())}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="mr-3 text-gray-600">در حال بارگذاری...</span>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📦</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">هیچ محصولی یافت نشد</h3>
              <p className="text-gray-500">محصول جدید اضافه کنید یا فیلترها را تغییر دهید</p>
            </div>
          ) : (
            <>
              {/* Toggle View for customers */}
              {isCustomer && (
                <div className="px-6 py-3 border-b">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">نمایش:</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowGrid(true)}
                        className={`px-3 py-1 text-sm rounded ${showGrid ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                      >
                        کارت
                      </button>
                      <button
                        onClick={() => setShowGrid(false)}
                        className={`px-3 py-1 text-sm rounded ${!showGrid ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                      >
                        جدول
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Grid View for customers */}
              {isCustomer && showGrid ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 p-3 sm:p-6">
                  {products.map((product) => {
                    const stockStatus = getStockStatus(product.stock);
                    return (
                      <div key={product.id} className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <div className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs text-gray-500">{product.code}</span>
                            {product.category && (
                              <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                {product.category}
                              </span>
                            )}
                          </div>
                          
                          <h3 className="font-medium text-gray-900 mb-2 line-clamp-2 text-sm sm:text-base">{product.name}</h3>
                          
                          {product.description && (
                            <p className="text-xs sm:text-sm text-gray-500 mb-3 line-clamp-2">{product.description}</p>
                          )}
                          
                          <div className="mb-3">
                            {product.discountedPrice ? (
                              <>
                                <div className="font-bold text-base sm:text-lg text-blue-600">{formatPrice(product.discountedPrice)}</div>
                                <div className="text-gray-500 line-through text-xs sm:text-sm">{formatPrice(product.price)}</div>
                              </>
                            ) : (
                              <div className="font-bold text-base sm:text-lg text-gray-900">{formatPrice(product.price)}</div>
                            )}
                          </div>
                          
                          <div className="flex justify-between items-center mb-3">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${stockStatus.color}`}>
                              {stockStatus.text}
                            </span>
                            <span className="text-xs sm:text-sm text-gray-500">{product.stock} موجود</span>
                          </div>
                          
                          {product.isActive && product.stock > 0 ? (
                            <button
                              onClick={() => addToCart(product)}
                              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 min-h-[44px] text-sm"
                            >
                              <Plus className="w-4 h-4" />
                              افزودن به سبد خرید
                            </button>
                          ) : (
                            <button
                              disabled
                              className="w-full bg-gray-300 text-gray-500 py-2 rounded cursor-not-allowed min-h-[44px] text-sm"
                            >
                              ناموجود
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Table View */
                <ResponsiveTable
                  columns={[
                    {
                      key: 'code',
                      header: 'کد',
                      primary: true,
                      render: (product) => (
                        <span className="text-sm font-medium text-gray-900">
                          {product.code}
                        </span>
                      )
                    },
                    {
                      key: 'name',
                      header: 'نام محصول',
                      primary: true,
                      render: (product) => (
                        <div>
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          {product.description && (
                            <div className="text-xs sm:text-sm text-gray-500 line-clamp-2">
                              {product.description}
                            </div>
                          )}
                        </div>
                      )
                    },
                    {
                      key: 'category',
                      header: 'دسته‌بندی',
                      render: (product) => (
                        product.category ? (
                          <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            {product.category}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )
                      )
                    },
                    {
                      key: 'price',
                      header: 'قیمت',
                      render: (product) => (
                        <div>
                          {product.discountedPrice ? (
                            <>
                              <div className="font-medium text-sm">{formatPrice(product.discountedPrice)}</div>
                              <div className="text-gray-500 line-through text-xs">{formatPrice(product.price)}</div>
                            </>
                          ) : (
                            <div className="font-medium text-sm">{formatPrice(product.price)}</div>
                          )}
                        </div>
                      )
                    },
                    {
                      key: 'stock',
                      header: 'موجودی',
                      render: (product) => {
                        const stockStatus = getStockStatus(product.stock);
                        return (
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${stockStatus.color}`}>
                            {product.stock} - {stockStatus.text}
                          </span>
                        );
                      }
                    },
                    {
                      key: 'status',
                      header: 'وضعیت',
                      render: (product) => (
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          product.isActive ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
                        }`}>
                          {product.isActive ? 'فعال' : 'غیرفعال'}
                        </span>
                      )
                    },
                    {
                      key: 'actions',
                      header: 'عملیات',
                      render: (product) => {
                        if (canEdit) {
                          return (
                            <div className="flex gap-1 sm:gap-2">
                              <button
                                onClick={() => handleEditProduct(product)}
                                className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors min-h-[36px] min-w-[36px]"
                                title="ویرایش محصول"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              {user?.role === 'Admin' && (
                                <button
                                  onClick={() => handleDeleteProduct(product)}
                                  className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors min-h-[36px] min-w-[36px]"
                                  title="حذف محصول"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          );
                        } else if (isCustomer && product.isActive && product.stock > 0) {
                          return (
                            <button
                              onClick={() => addToCart(product)}
                              className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors flex items-center gap-1 min-h-[36px] min-w-[36px]"
                            >
                              <Plus className="w-3 h-3" />
                              افزودن
                            </button>
                          );
                        } else {
                          return <span className="text-gray-400 text-sm">-</span>;
                        }
                      }
                    }
                  ]}
                  data={products}
                  loading={loading}
                  emptyMessage="محصول جدید اضافه کنید یا فیلترها را تغییر دهید"
                  emptyIcon={ShoppingCart}
                  mobileBreakpoint="md"
                />
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-3 sm:px-6 py-3 bg-gray-50 border-t">
                  <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
                    <div className="text-xs sm:text-sm text-gray-700">
                      نمایش {(currentPage - 1) * pageSize + 1} تا {Math.min(currentPage * pageSize, totalCount)} از {totalCount} محصول
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
            </>
          )}
        </div>
      </div>

      {/* Create Product Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-semibold">افزودن محصول جدید</h2>
            </div>
            <form onSubmit={handleSubmitCreate}>
              <div className="px-6 py-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      نام محصول *
                    </label>
                    <input
                      type="text"
                      required
                      value={productForm.name}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      کد محصول *
                    </label>
                    <input
                      type="text"
                      required
                      value={productForm.code}
                      onChange={(e) => setProductForm({ ...productForm, code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    توضیحات
                  </label>
                  <textarea
                    rows={3}
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      قیمت *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      قیمت تخفیف‌خورده
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={productForm.discountedPrice}
                      onChange={(e) => setProductForm({ ...productForm, discountedPrice: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      موجودی *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={productForm.stock}
                      onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    دسته‌بندی
                  </label>
                  <input
                    type="text"
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    list="categories"
                  />
                  <datalist id="categories">
                    {categories.map((category) => (
                      <option key={category} value={category} />
                    ))}
                  </datalist>
                </div>
              </div>
              <div className="px-6 py-4 border-t flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => dispatch(setShowCreateModal(false))}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'در حال ایجاد...' : 'ایجاد محصول'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && currentProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-semibold">ویرایش محصول</h2>
            </div>
            <form onSubmit={handleSubmitEdit}>
              <div className="px-6 py-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      نام محصول *
                    </label>
                    <input
                      type="text"
                      required
                      value={productForm.name}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      کد محصول *
                    </label>
                    <input
                      type="text"
                      required
                      value={productForm.code}
                      onChange={(e) => setProductForm({ ...productForm, code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    توضیحات
                  </label>
                  <textarea
                    rows={3}
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      قیمت *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      قیمت تخفیف‌خورده
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={productForm.discountedPrice}
                      onChange={(e) => setProductForm({ ...productForm, discountedPrice: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      موجودی *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={productForm.stock}
                      onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    دسته‌بندی
                  </label>
                  <input
                    type="text"
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    list="categories"
                  />
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={productForm.isActive}
                      onChange={(e) => setProductForm({ ...productForm, isActive: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">محصول فعال است</span>
                  </label>
                </div>
              </div>
              <div className="px-6 py-4 border-t flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => dispatch(setShowEditModal(false))}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'در حال ویرایش...' : 'ویرایش محصول'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && currentProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-semibold text-red-600">حذف محصول</h2>
            </div>
            <div className="px-6 py-4">
              <p className="text-gray-700 mb-4">
                آیا از حذف محصول <span className="font-medium">"{currentProduct.name}"</span> اطمینان دارید؟
              </p>
              <p className="text-sm text-red-600">
                این عمل قابل بازگشت نیست.
              </p>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button
                onClick={() => dispatch(setShowDeleteModal(false))}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                انصراف
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'در حال حذف...' : 'حذف محصول'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cart Modal for customers */}
      {isCustomer && showCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">سبد خرید</h2>
              <button
                onClick={() => setShowCart(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            {cart.length === 0 ? (
              <p className="text-center text-gray-500 py-8">سبد خرید خالی است</p>
            ) : (
              <>
                <div className="space-y-4 mb-6">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center justify-between border-b pb-4">
                      <div className="flex-1">
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="text-sm text-gray-500">{formatPrice(item.discountedPrice || item.price)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center border rounded"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="mx-2 min-w-[2rem] text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center border rounded"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500 hover:text-red-700 mr-4"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="border-t pt-4">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      تاریخ انتظار برای دریافت محصول (اختیاری)
                    </label>
                    <PersianDatePicker
                      value={expectedDeliveryDate}
                      onChange={setExpectedDeliveryDate}
                      placeholder="انتخاب تاریخ انتظار"
                      className="w-full"
                    />
                  </div>
                  
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-bold">مجموع:</span>
                    <span className="text-lg font-bold text-blue-600">
                      {formatPrice(getTotalPrice())}
                    </span>
                  </div>
                  
                  <button
                    onClick={submitOrder}
                    className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    ثبت سفارش
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Products; 