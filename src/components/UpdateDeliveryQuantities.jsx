import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { 
  Save, 
  ArrowLeft, 
  Package, 
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import deliveryService from '../services/deliveryService';
import orderService from '../services/orderService';

const UpdateDeliveryQuantities = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  
  const [order, setOrder] = useState(null);
  const [deliveryQuantities, setDeliveryQuantities] = useState({});
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await orderService.getOrderById(orderId);
      console.log('Order details response:', response);
      setOrder(response);
      
      // مقداردهی اولیه مقادیر تحویل
      const initialQuantities = {};
      response.items.forEach(item => {
        console.log('Item:', item.id, 'Quantity:', item.quantity, 'DeliveredQuantity:', item.deliveredQuantity);
        // اگر deliveredQuantity تعریف شده، از آن استفاده کن، وگرنه از quantity
        initialQuantities[item.id] = item.deliveredQuantity !== undefined && item.deliveredQuantity !== null 
          ? item.deliveredQuantity 
          : item.quantity;
      });
      console.log('Initial quantities:', initialQuantities);
      setDeliveryQuantities(initialQuantities);
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error('خطا در دریافت اطلاعات سفارش');
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (itemId, quantity) => {
    setDeliveryQuantities(prev => ({
      ...prev,
      [itemId]: parseInt(quantity) || 0
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const updateData = {
        items: Object.entries(deliveryQuantities).map(([itemId, quantity]) => ({
          orderItemId: parseInt(itemId),
          deliveredQuantity: quantity
        })),
        deliveryNotes: deliveryNotes.trim() || null
      };

      await deliveryService.updateDeliveryQuantities(orderId, updateData);
      toast.success('مقادیر تحویل با موفقیت به‌روزرسانی شد');
      navigate('/orders');
    } catch (error) {
      console.error('Error updating delivery quantities:', error);
      toast.error('خطا در به‌روزرسانی مقادیر تحویل');
    } finally {
      setSaving(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
  };

  const getQuantityStatus = (requested, delivered) => {
    if (delivered === requested) {
      return { color: 'text-green-600', icon: CheckCircle, text: 'کامل' };
    } else if (delivered < requested) {
      return { color: 'text-orange-600', icon: AlertTriangle, text: 'ناقص' };
    } else {
      return { color: 'text-blue-600', icon: Package, text: 'اضافه' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">در حال بارگیری...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">سفارش یافت نشد</p>
        </div>
      </div>
    );
  }

  // بررسی دسترسی
  const isSalesRep = user?.role === 'SalesRep';
  const isManager = user?.role === 'Admin' || user?.role === 'Supervisor';
  
  if (!isSalesRep && !isManager) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <p className="text-gray-600">شما مجاز به دسترسی به این صفحه نیستید</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-6 gap-4 sm:gap-0">
            <div className="flex items-center w-full sm:w-auto">
              <button
                onClick={() => {
                  // بر اساس نقش کاربر به صفحه مناسب برمی‌گردد
                  if (user?.role === 'SalesRep') {
                    navigate('/salesrep/orders');
                  } else {
                    navigate('/orders');
                  }
                }}
                className="ml-2 sm:ml-4 p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900">
                  به‌روزرسانی مقادیر تحویل
                </h1>
                <p className="text-gray-600 mt-1 text-xs sm:text-base">
                  سفارش شماره #{order.id} - {order.customer?.name}
                </p>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center w-full sm:w-auto justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 mt-2 sm:mt-0"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
            </button>
          </div>
        </div>
      </div>

      {/* محتوا */}
      <div className="max-w-4xl mx-auto p-2 sm:p-6">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* اطلاعات سفارش */}
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-4">اطلاعات سفارش</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-4">
              <div>
                <span className="text-xs sm:text-sm text-gray-500">مشتری:</span>
                <p className="font-medium text-sm sm:text-base">{order.customer?.name}</p>
                {order.customer?.storeTitle && (
                  <p className="text-xs sm:text-sm text-gray-600">{order.customer.storeTitle}</p>
                )}
              </div>
              <div>
                <span className="text-xs sm:text-sm text-gray-500">آدرس:</span>
                <p className="text-xs sm:text-sm">{order.customer?.address || 'آدرس مشخص نشده'}</p>
              </div>
              <div>
                <span className="text-xs sm:text-sm text-gray-500">مبلغ کل:</span>
                <p className="font-medium text-blue-600 text-sm sm:text-base">{formatPrice(order.totalAmount)}</p>
              </div>
            </div>
          </div>

          {/* جدول اقلام */}
          <div className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-4">اقلام سفارش</h3>
            <div className="overflow-x-auto">
              <table className="min-w-[600px] w-full divide-y divide-gray-200 text-xs sm:text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-right font-medium text-gray-500 uppercase">نام کالا</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-right font-medium text-gray-500 uppercase">مقدار درخواستی</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-right font-medium text-gray-500 uppercase">مقدار تحویل</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-right font-medium text-gray-500 uppercase">وضعیت</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-right font-medium text-gray-500 uppercase">قیمت واحد</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {order.items.map((item) => {
                    const deliveredQty = deliveryQuantities[item.id] || 0;
                    const status = getQuantityStatus(item.quantity, deliveredQty);
                    const StatusIcon = status.icon;
                    
                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-2 sm:px-4 py-2 sm:py-4">
                          <div className="font-medium text-gray-900 text-xs sm:text-sm">{item.product?.name}</div>
                          {item.product?.code && (
                            <div className="text-xs text-gray-500">کد: {item.product.code}</div>
                          )}
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-4 text-gray-900 text-center">
                          {item.quantity}
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-4">
                          <input
                            type="number"
                            min="0"
                            max={item.quantity * 2}
                            value={deliveredQty}
                            onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                            className="w-16 sm:w-20 px-2 py-1 border border-gray-300 rounded text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm"
                          />
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-4">
                          <div className={`flex items-center ${status.color}`}>
                            <StatusIcon className="w-4 h-4 ml-1" />
                            <span className="font-medium text-xs sm:text-sm">{status.text}</span>
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-4 text-gray-900">
                          {formatPrice(item.unitPrice)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* یادداشت تحویل */}
          <div className="p-4 sm:p-6 border-t border-gray-200">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-4">یادداشت تحویل</h3>
            <textarea
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm"
              placeholder="یادداشت‌های مربوط به تحویل کالا (اختیاری)..."
            />
          </div>

          {/* دکمه‌های عملیات */}
          <div className="p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
              <button
                onClick={() => {
                  // بر اساس نقش کاربر به صفحه مناسب برمی‌گردد
                  if (user?.role === 'SalesRep') {
                    navigate('/salesrep/orders');
                  } else {
                    navigate('/orders');
                  }
                }}
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                انصراف
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'در حال ذخیره...' : 'ذخیره و تأیید تحویل'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateDeliveryQuantities;