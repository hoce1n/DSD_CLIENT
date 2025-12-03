import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  Download,
  Calendar,
  MapPin,
  User,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  MoreVertical,
  ShoppingBag,
  Truck,
  X,
  Save,
  FileText,
  ChevronDown,
  Phone,
  RefreshCw,
  CreditCard
} from 'lucide-react';
import { fetchOrders, setSearchTerm, setStatusFilter } from '../../store/slices/ordersSlice';
import PersianDatePicker from '../../components/PersianDatePicker';
import ResponsiveTable from '../../components/UI/ResponsiveTable';
import AddPaymentModal from '../../components/Financial/AddPaymentModal';
import moment from 'moment-jalaali';
import orderService from '../../services/orderService';
import deliveryService from '../../services/deliveryService';
import salesRepService from '../../services/salesRepService';

// Set Jalaali mode
moment.loadPersian({usePersianDigits: false});

const Orders = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  
  // Check user role
  const isAdmin = user?.role === 'Admin';
  const isSupervisor = user?.role === 'Supervisor';
  const isSalesRep = user?.role === 'SalesRep';
  const isUser = user?.role === 'User';
  const isManager = isAdmin || isSupervisor || (user?.role === 'Manager');
  
  // State management
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchTerm, setSearchTermState] = useState('');
  const [actionLoading, setActionLoading] = useState({});
  
  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showActionsMenu, setShowActionsMenu] = useState(null);
  
  // Payment Modal State (for SalesRep)
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState(null);
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    status: '',
    deliveryDate: '',
    notes: ''
  });

  // Load orders based on user role
  const loadOrders = async (status = null, search = '') => {
    try {
      setLoading(true);
      let response;
      
      if (isSalesRep) {
        // ویزیتور: بارگذاری سفارشات اختصاص یافته
        response = await salesRepService.getAssignedOrders(status);
        setOrders(response.orders || response.data || response || []);
      } else {
        // سایر نقش‌ها: بارگذاری از Redux store
        dispatch(fetchOrders({ search, status }));
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('خطا در بارگذاری سفارشات');
    } finally {
      setLoading(false);
    }
  };

  // Load orders from Redux for non-SalesRep users
  const { 
    orders: reduxOrders, 
    loading: reduxLoading, 
    error,
    currentPage,
    pageSize,
    totalCount,
    totalPages,
    searchTerm: reduxSearchTerm,
    statusFilter
  } = useSelector((state) => state.orders);

  useEffect(() => {
    if (isSalesRep) {
      loadOrders(selectedStatus || null, searchTerm);
    } else {
      dispatch(fetchOrders({ 
        page: currentPage, 
        pageSize, 
        search: reduxSearchTerm,
        status: statusFilter
      }));
    }
  }, [dispatch, currentPage, pageSize, reduxSearchTerm, statusFilter, selectedStatus, searchTerm, isSalesRep]);

  // Use appropriate orders and loading state based on user role
  const displayOrders = isSalesRep ? orders : reduxOrders;
  const displayLoading = isSalesRep ? loading : reduxLoading;

  // SalesRep specific handlers
  const handleStartDelivery = async (orderId) => {
    if (!window.confirm('آیا مطمئن هستید که می‌خواهید تحویل این سفارش را شروع کنید؟')) {
      return;
    }

    try {
      setActionLoading(prev => ({ ...prev, [orderId]: 'starting' }));
      await salesRepService.startDelivery(orderId);
      toast.success('تحویل سفارش شروع شد');
      await loadOrders(selectedStatus || null, searchTerm);
    } catch (error) {
      console.error('Error starting delivery:', error);
      toast.error('خطا در شروع تحویل');
    } finally {
      setActionLoading(prev => ({ ...prev, [orderId]: null }));
    }
  };

  const handleCompleteDelivery = async (orderId) => {
    if (!window.confirm('آیا مطمئن هستید که این سفارش تحویل داده شده است؟')) {
      return;
    }

    try {
      setActionLoading(prev => ({ ...prev, [orderId]: 'completing' }));
      await salesRepService.completeDelivery(orderId);
      toast.success('سفارش با موفقیت تحویل داده شد');
      await loadOrders(selectedStatus || null, searchTerm);
    } catch (error) {
      console.error('Error completing delivery:', error);
      toast.error('خطا در تکمیل تحویل');
    } finally {
      setActionLoading(prev => ({ ...prev, [orderId]: null }));
    }
  };

  const handleUpdateQuantities = (orderId) => {
    navigate(`/update-delivery-quantities/${orderId}`);
  };

  const handleViewInvoice = (orderId) => {
    navigate(`/delivery-invoice/${orderId}`);
  };

  const handleAddPayment = (order) => {
    setSelectedOrderForPayment(order);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    setSelectedOrderForPayment(null);
    toast.success('پرداخت با موفقیت ثبت شد');
    loadOrders(selectedStatus || null, searchTerm);
  };

  // Check if order needs payment (for SalesRep)
  const needsPayment = (order) => {
    return order.status === 'Pending' || order.status === 'Confirmed' || order.status === 'InProgress';
  };

  // Manager specific handlers
  const handleViewOrder = async (order) => {
    try {
      const orderDetails = await orderService.getOrderById(order.id);
      setSelectedOrder(orderDetails);
      setShowViewModal(true);
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error('خطا در دریافت جزئیات سفارش');
    }
  };

  const handleEditOrder = (order) => {
    setSelectedOrder(order);
    setEditForm({
      status: order.status,
      deliveryDate: order.deliveryDate || '',
      notes: order.notes || ''
    });
    setShowEditModal(true);
  };

  const handleDeleteOrder = (order) => {
    setSelectedOrder(order);
    setShowDeleteModal(true);
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      toast.success('وضعیت سفارش با موفقیت به‌روزرسانی شد');
      
      if (isSalesRep) {
        loadOrders(selectedStatus || null, searchTerm);
      } else {
        dispatch(fetchOrders({ 
          page: currentPage, 
          pageSize, 
          search: reduxSearchTerm,
          status: statusFilter
        }));
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('خطا در به‌روزرسانی وضعیت سفارش');
    }
  };

  // Utility functions
  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending': return <Clock className="w-4 h-4" />;
      case 'Confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'InProgress': return <Package className="w-4 h-4" />;
      case 'OnDelivery': return <Truck className="w-4 h-4" />;
      case 'Delivered': return <CheckCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'InProgress': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'OnDelivery': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'Cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fa-IR').format(price) + ' ریال';
  };

  const formatPersianDate = (dateString) => {
    if (!dateString) return '-';
    return moment(dateString).format('jYYYY/jMM/jDD - HH:mm');
  };

  if (displayLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">در حال بارگذاری سفارشات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
            <div className="text-center sm:text-right flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                {isSalesRep ? 'سفارشات من' : 'مدیریت سفارشات'}
              </h1>
              <p className="text-gray-600">
                {isSalesRep 
                  ? 'مدیریت سفارشات اختصاص یافته به شما'
                  : 'مشاهده و مدیریت تمامی سفارشات سیستم'
                }
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <button
                onClick={() => isSalesRep ? loadOrders(selectedStatus || null, searchTerm) : dispatch(fetchOrders({ page: currentPage, pageSize, search: reduxSearchTerm }))}
                className="flex justify-center items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors min-h-[44px] w-full sm:w-auto text-sm sm:text-base"
              >
                <RefreshCw className="w-4 h-4" />
                بروزرسانی
              </button>
              {isManager && (
                <button className="flex justify-center items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors min-h-[44px] w-full sm:w-auto text-sm sm:text-base">
                  <Plus className="w-4 h-4" />
                  سفارش جدید
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 flex-1 w-full">
              {/* Search */}
              <div className="flex items-center gap-2 flex-1 min-w-0 w-full">
                <Search className="w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="جستجو در سفارشات..."
                  value={isSalesRep ? searchTerm : reduxSearchTerm}
                  onChange={(e) => isSalesRep ? setSearchTermState(e.target.value) : dispatch(setSearchTerm(e.target.value))}
                  className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base min-h-[44px] w-full"
                />
              </div>
              
              {/* Status Filter */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="font-medium text-gray-700">وضعیت:</span>
                <select
                  value={isSalesRep ? selectedStatus : statusFilter}
                  onChange={(e) => isSalesRep ? setSelectedStatus(e.target.value) : dispatch(setStatusFilter(e.target.value))}
                  className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base min-h-[44px] w-full sm:w-auto"
                >
                  <option value="">همه سفارشات</option>
                  <option value="Pending">در انتظار تایید</option>
                  <option value="Confirmed">تایید شده</option>
                  <option value="InProgress">در حال آماده‌سازی</option>
                  <option value="OnDelivery">در حال تحویل</option>
                  <option value="Delivered">تحویل شده</option>
                  <option value="Cancelled">لغو شده</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Orders List */}
        {displayOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 sm:p-12 text-center">
            <Package className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">سفارشی یافت نشد</h3>
            <p className="text-gray-500 text-xs sm:text-base">
              {isSalesRep 
                ? (selectedStatus ? 'سفارشی با این وضعیت یافت نشد' : 'هنوز سفارشی به شما اختصاص داده نشده است')
                : 'هنوز سفارشی ثبت نشده است'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-3 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs sm:text-sm font-medium border ${getStatusColor(order.status)}`}> 
                        {getStatusIcon(order.status)}
                        {order.statusText || order.status}
                      </div>
                      <span className="text-xs sm:text-sm text-gray-500">سفارش #{order.id}</span>
                    </div>
                    <div className="text-left">
                      <p className="text-base sm:text-lg font-bold text-gray-900">{formatPrice(order.totalAmount)}</p>
                      <p className="text-xs sm:text-sm text-gray-500">{order.itemCount || order.items?.length || 0} کالا</p>
                    </div>
                  </div>

                  {/* Customer Info */}
                  {order.customer && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-xs sm:text-sm text-gray-600">مشتری:</span>
                        <span className="font-medium text-xs sm:text-sm">{order.customer.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="text-xs sm:text-sm text-gray-600">فروشگاه:</span>
                        <span className="font-medium text-xs sm:text-sm">{order.customer.storeTitle}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span className="text-xs sm:text-sm text-gray-600">تلفن:</span>
                        <span className="font-medium text-xs sm:text-sm">{order.customer.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-xs sm:text-sm text-gray-600">تاریخ سفارش:</span>
                        <span className="font-medium text-xs sm:text-sm">{formatPersianDate(order.orderDate)}</span>
                      </div>
                    </div>
                  )}

                  {/* Address */}
                  {order.customer?.address && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-blue-500 mt-0.5" />
                        <div>
                          <span className="text-xs sm:text-sm font-medium text-blue-700">آدرس تحویل:</span>
                          <p className="text-xs sm:text-sm text-blue-600 mt-1">{order.customer.address}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Expected Delivery Date */}
                  {order.expectedDeliveryDate && (
                    <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-yellow-500" />
                        <span className="text-xs sm:text-sm font-medium text-yellow-700">تاریخ تحویل مورد انتظار:</span>
                        <span className="text-xs sm:text-sm text-yellow-600">{formatPersianDate(order.expectedDeliveryDate)}</span>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {order.notes && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-gray-500 mt-0.5" />
                        <div>
                          <span className="text-xs sm:text-sm font-medium text-gray-700">یادداشت:</span>
                          <p className="text-xs sm:text-sm text-gray-600 mt-1">{order.notes}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                    {/* Common actions */}
                    <button
                      onClick={() => isSalesRep ? handleViewInvoice(order.id) : handleViewOrder(order)}
                      className="flex items-center justify-center gap-2 px-3 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors min-h-[44px] w-full sm:w-auto text-xs sm:text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      {isSalesRep ? 'مشاهده فاکتور' : 'مشاهده جزئیات'}
                    </button>

                    {/* SalesRep specific actions */}
                    {isSalesRep && (
                      <>
                        {needsPayment(order) && (
                          <button
                            onClick={() => handleAddPayment(order)}
                            className="flex items-center justify-center gap-2 px-3 py-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors min-h-[44px] w-full sm:w-auto text-xs sm:text-sm"
                          >
                            <CreditCard className="w-4 h-4" />
                            ثبت پرداخت
                          </button>
                        )}

                        {order.canUpdateQuantities && (
                          <button
                            onClick={() => handleUpdateQuantities(order.id)}
                            className="flex items-center justify-center gap-2 px-3 py-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors min-h-[44px] w-full sm:w-auto text-xs sm:text-sm"
                          >
                            <Edit className="w-4 h-4" />
                            بروزرسانی مقادیر
                          </button>
                        )}

                        {order.canStartDelivery && (
                          <button
                            onClick={() => handleStartDelivery(order.id)}
                            disabled={actionLoading[order.id] === 'starting'}
                            className="flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors min-h-[44px] w-full sm:w-auto text-xs sm:text-sm"
                          >
                            {actionLoading[order.id] === 'starting' ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Truck className="w-4 h-4" />
                            )}
                            شروع تحویل
                          </button>
                        )}

                        {order.canMarkAsDelivered && (
                          <button
                            onClick={() => handleCompleteDelivery(order.id)}
                            disabled={actionLoading[order.id] === 'completing'}
                            className="flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors min-h-[44px] w-full sm:w-auto text-xs sm:text-sm"
                          >
                            {actionLoading[order.id] === 'completing' ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                            تکمیل تحویل
                          </button>
                        )}
                      </>
                    )}

                    {/* Manager specific actions */}
                    {isManager && (
                      <>
                        <button
                          onClick={() => handleEditOrder(order)}
                          className="flex items-center justify-center gap-2 px-3 py-2 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 rounded-lg transition-colors min-h-[44px] w-full sm:w-auto text-xs sm:text-sm"
                        >
                          <Edit className="w-4 h-4" />
                          ویرایش
                        </button>

                        <button
                          onClick={() => handleDeleteOrder(order)}
                          className="flex items-center justify-center gap-2 px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors min-h-[44px] w-full sm:w-auto text-xs sm:text-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                          حذف
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination for non-SalesRep users */}
        {!isSalesRep && totalPages > 1 && (
          <div className="mt-6 sm:mt-8 flex justify-center">
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => dispatch(fetchOrders({ page: currentPage - 1, pageSize, search: reduxSearchTerm, status: statusFilter }))}
                disabled={currentPage === 1}
                className="px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
              >
                قبلی
              </button>
              <span className="px-4 py-2 text-gray-700">
                صفحه {currentPage} از {totalPages}
              </span>
              <button
                onClick={() => dispatch(fetchOrders({ page: currentPage + 1, pageSize, search: reduxSearchTerm, status: statusFilter }))}
                disabled={currentPage === totalPages}
                className="px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
              >
                بعدی
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal for SalesRep */}
      {showPaymentModal && selectedOrderForPayment && (
        <AddPaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedOrderForPayment(null);
          }}
          customerId={selectedOrderForPayment.customer?.id}
          customerName={selectedOrderForPayment.customer?.name}
          orderId={selectedOrderForPayment.id}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* View Modal */}
      {showViewModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">جزئیات سفارش #{selectedOrder.id}</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">وضعیت</label>
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedOrder.status)}`}>
                    {getStatusIcon(selectedOrder.status)}
                    {selectedOrder.statusText || selectedOrder.status}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">مبلغ کل</label>
                  <p className="text-lg font-bold text-gray-900">{formatPrice(selectedOrder.totalAmount)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">تاریخ سفارش</label>
                  <p className="text-sm text-gray-900">{formatPersianDate(selectedOrder.orderDate)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">تاریخ تحویل</label>
                  <p className="text-sm text-gray-900">{selectedOrder.deliveryDate ? formatPersianDate(selectedOrder.deliveryDate) : 'تعیین نشده'}</p>
                </div>
              </div>

              {/* Customer Info */}
              {selectedOrder.customer && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">اطلاعات مشتری</h3>
                  <div className="bg-gray-50 p-4 rounded-lg grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">نام مشتری</label>
                      <p className="text-sm text-gray-900">{selectedOrder.customer.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">نام فروشگاه</label>
                      <p className="text-sm text-gray-900">{selectedOrder.customer.storeTitle}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">تلفن</label>
                      <p className="text-sm text-gray-900">{selectedOrder.customer.phone}</p>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">آدرس</label>
                      <p className="text-sm text-gray-900">{selectedOrder.customer.address}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Items */}
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">کالاهای سفارش</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">محصول</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">تعداد</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">قیمت واحد</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">قیمت کل</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedOrder.items.map((item, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.product?.name || `محصول #${item.productId}`}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.quantity}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatPrice(item.unitPrice)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatPrice(item.quantity * item.unitPrice)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedOrder.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">یادداشت</label>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-900">{selectedOrder.notes}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t flex justify-end">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">ویرایش سفارش #{selectedOrder.id}</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                await orderService.updateOrder(selectedOrder.id, editForm);
                toast.success('سفارش با موفقیت به‌روزرسانی شد');
                setShowEditModal(false);
                dispatch(fetchOrders({ 
                  page: currentPage, 
                  pageSize, 
                  search: reduxSearchTerm,
                  status: statusFilter
                }));
              } catch (error) {
                toast.error('خطا در به‌روزرسانی سفارش');
              }
            }}>
              <div className="p-6 space-y-4">
                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">وضعیت</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Pending">در انتظار تایید</option>
                    <option value="Confirmed">تایید شده</option>
                    <option value="InProgress">در حال آماده‌سازی</option>
                    <option value="OnDelivery">در حال تحویل</option>
                    <option value="Delivered">تحویل شده</option>
                    <option value="Cancelled">لغو شده</option>
                  </select>
                </div>

                {/* Delivery Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">تاریخ تحویل</label>
                  <PersianDatePicker
                    value={editForm.deliveryDate}
                    onChange={(date) => setEditForm({...editForm, deliveryDate: date})}
                    placeholder="انتخاب تاریخ تحویل"
                    className="w-full"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">یادداشت</label>
                  <textarea
                    value={editForm.notes}
                    onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="یادداشت اضافی..."
                  />
                </div>
              </div>
              <div className="px-6 py-4 border-t flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  ذخیره تغییرات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">حذف سفارش</h3>
                  <p className="text-sm text-gray-500">آیا مطمئن هستید؟</p>
                </div>
              </div>
              <p className="text-sm text-gray-700 mb-6">
                سفارش #{selectedOrder.id} به مبلغ {formatPrice(selectedOrder.totalAmount)} حذف خواهد شد.
                این عمل قابل بازگشت نیست.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  انصراف
                </button>
                <button
                  onClick={async () => {
                    try {
                      await orderService.updateOrderStatus(selectedOrder.id, { status: 'Cancelled' });
                      toast.success('سفارش با موفقیت حذف شد');
                      setShowDeleteModal(false);
                      dispatch(fetchOrders({ 
                        page: currentPage, 
                        pageSize, 
                        search: reduxSearchTerm,
                        status: statusFilter
                      }));
                    } catch (error) {
                      toast.error('خطا در حذف سفارش');
                    }
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  حذف سفارش
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders; 