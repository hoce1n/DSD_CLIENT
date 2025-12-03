import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { useReactToPrint } from 'react-to-print';
import { 
  Printer, 
  Download, 
  CheckCircle, 
  Package, 
  User, 
  Phone, 
  MapPin, 
  Calendar,
  FileText,
  Truck,
  ArrowLeft
} from 'lucide-react';
import { apiHelpers } from '../services/api';
import deliveryService from '../services/deliveryService';
import moment from 'moment-jalaali';
import '../styles/print.css';

// Set Jalaali mode
moment.loadPersian({usePersianDigits: false});

const DeliveryInvoice = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const componentRef = useRef();
  
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    fetchInvoice();
  }, [orderId]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const response = await deliveryService.getDeliveryInvoice(orderId);
      setInvoice(response);
    } catch (error) {
      console.error('Error fetching invoice:', error);
      toast.error('خطا در دریافت فاکتور');
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  const reactToPrintOptions = {
    content: () => {
      console.log('componentRef.current:', componentRef.current);
      if (!componentRef.current) {
        console.error('componentRef.current is null or undefined');
        return null;
      }
      return componentRef.current;
    },
    documentTitle: `فاکتور-تحویل-${orderId}`,
    onBeforeGetContent: () => {
      console.log('onBeforeGetContent called');
      // اطمینان از اینکه داده‌ها و المان لود شده‌اند
      return new Promise((resolve) => {
        if (invoice && !loading && componentRef.current) {
          console.log('All conditions met, resolving');
          resolve();
        } else {
          console.log('Waiting for conditions:', { invoice: !!invoice, loading, ref: !!componentRef.current });
          // اگر داده‌ها یا المان لود نشده‌اند، کمی صبر کنیم
          setTimeout(() => {
            console.log('Timeout resolved');
            resolve();
          }, 1000);
        }
      });
    },
    onAfterPrint: () => {
      console.log('چاپ تکمیل شد');
    },
    onPrintError: (errorLocation, error) => {
      console.error('خطا در چاپ:', errorLocation, error);
      toast.error('خطا در چاپ. از چاپ معمولی استفاده می‌شود.');
      // fallback به چاپ معمولی
      handleFallbackPrint();
    },
    removeAfterPrint: true,
  };

  const handlePrint = useReactToPrint(reactToPrintOptions);

  const handleFallbackPrint = () => {
    // چاپ معمولی به عنوان fallback
    const printWindow = window.open('', '_blank');
    const printContent = componentRef.current?.innerHTML;
    
    if (printContent) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
          <meta charset="utf-8">
          <title>فاکتور تحویل ${orderId}</title>
          <style>
            body { font-family: 'Vazirmatn', 'Tahoma', Arial, sans-serif; direction: rtl; margin: 20px; }
            .print-header { background: #2563eb; color: white; padding: 20px; margin-bottom: 20px; }
            .print-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            .print-table th, .print-table td { border: 1px solid #333; padding: 8px; text-align: right; }
            .print-table th { background-color: #f5f5f5; font-weight: bold; }
            .signature-box { border-top: 2px solid #000; margin-top: 50px; padding-top: 8px; text-align: center; }
            .no-print { display: none; }
          </style>
        </head>
        <body>${printContent}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
      printWindow.close();
    } else {
      toast.error('محتوای فاکتور برای چاپ یافت نشد');
    }
  };

  // تابع تست برای بررسی وضعیت ref
  const testPrint = () => {
    console.log('=== Test Print Debug ===');
    console.log('componentRef:', componentRef);
    console.log('componentRef.current:', componentRef.current);
    console.log('invoice:', invoice);
    console.log('loading:', loading);
    
    if (componentRef.current) {
      console.log('Element found:', componentRef.current.tagName);
      console.log('Element innerHTML length:', componentRef.current.innerHTML.length);
      console.log('Element children count:', componentRef.current.children.length);
    } else {
      console.error('componentRef.current is null!');
    }
    
    // سعی کنیم چاپ کنیم
    if (componentRef.current) {
      handlePrint();
    } else {
      toast.error('المان فاکتور یافت نشد');
    }
  };

  const handleConfirmDelivery = async () => {
    if (!window.confirm('آیا از دریافت کامل کالاها اطمینان دارید؟')) {
      return;
    }

    try {
      setConfirming(true);
      await deliveryService.confirmDeliveryByCustomer(orderId);
      toast.success('دریافت کالا با موفقیت تأیید شد');
      await fetchInvoice(); // بروزرسانی اطلاعات
    } catch (error) {
      console.error('Error confirming delivery:', error);
      toast.error('خطا در تأیید دریافت کالا');
    } finally {
      setConfirming(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
  };

  const formatPersianDate = (dateString) => {
    if (!dateString) return '-';
    return moment(dateString).format('jYYYY/jMM/jDD - HH:mm');
  };

  const getPaymentStatusBadge = (status, statusText) => {
    const statusConfig = {
      'Pending': { color: 'bg-yellow-100 text-yellow-800', text: statusText },
      'Paid': { color: 'bg-green-100 text-green-800', text: statusText },
      'PartiallyPaid': { color: 'bg-blue-100 text-blue-800', text: statusText },
      'Credit': { color: 'bg-purple-100 text-purple-800', text: statusText },
      'Refunded': { color: 'bg-red-100 text-red-800', text: statusText },
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', text: statusText };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">در حال بارگیری فاکتور...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">فاکتور یافت نشد</p>
        </div>
      </div>
    );
  }

  const isCustomer = user?.role === 'User';
  const canConfirmDelivery = isCustomer && invoice.status !== 'Delivered';

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header - فقط در نمایش عادی */}
      <div className="bg-white shadow-sm border-b no-print">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/orders')}
                className="ml-4 p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  فاکتور تحویل کالا
                </h1>
                <p className="text-gray-600 mt-1">
                  سفارش شماره #{invoice.orderId}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={testPrint}
                disabled={loading || !invoice}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Printer className="w-4 h-4 mr-2" />
                {loading ? 'در حال بارگیری...' : 'چاپ فاکتور'}
              </button>
              <button
                onClick={handleFallbackPrint}
                disabled={loading || !invoice}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4 mr-2" />
                چاپ ساده
              </button>
              {canConfirmDelivery && (
                <button
                  onClick={handleConfirmDelivery}
                  disabled={confirming}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {confirming ? 'در حال تأیید...' : 'تأیید دریافت کالا'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* فاکتور */}
      <div className="max-w-4xl mx-auto p-6">
        <div ref={componentRef} className="print-container bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header فاکتور */}
          <div className="print-header print-section bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold mb-2">شرکت توزیع DSD</h1>
                <p className="text-blue-100">سیستم مدیریت توزیع و فروش</p>
                <p className="text-blue-100 mt-1"></p>
                <p className="text-blue-100">: 021-12345678</p>
              </div>
              <div className="text-left">
                <h2 className="text-xl font-bold mb-2">فاکتور تحویل کالا</h2>
                <p className="text-blue-100">شماره: #{invoice.orderId}</p>
                <p className="text-blue-100">تاریخ: {formatPersianDate(invoice.orderDate)}</p>
              </div>
            </div>
          </div>

          {/* اطلاعات طرفین */}
          <div className="print-section p-6 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* اطلاعات خریدار */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">خریدار:</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium text-gray-900">{invoice.customer.name}</p>
                  {invoice.customer.storeTitle && (
                    <p className="text-gray-600">{invoice.customer.storeTitle}</p>
                  )}
                  <p className="text-gray-600 mt-1">{invoice.customer.address || 'آدرس مشخص نشده'}</p>
                  {invoice.customer.phone && (
                    <p className="text-gray-600">تلفن: {invoice.customer.phone}</p>
                  )}
                </div>
              </div>

              {/* اطلاعات تحویل‌دهنده */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">تحویل‌دهنده:</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  {invoice.salesRep ? (
                    <>
                      <p className="font-medium text-gray-900">{invoice.salesRep.name}</p>
                      {invoice.salesRep.phone && (
                        <p className="text-gray-600">تلفن: {invoice.salesRep.phone}</p>
                      )}
                    </>
                  ) : (
                    <p className="text-gray-600">اطلاعات تحویل‌دهنده مشخص نشده</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* اطلاعات سفارش */}
          <div className="print-section p-6 border-b border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-sm text-gray-500 mb-1">تاریخ سفارش</div>
                <div className="font-medium text-gray-900">{formatPersianDate(invoice.orderDate)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">تاریخ انتظار</div>
                <div className="font-medium text-gray-900">{formatPersianDate(invoice.expectedDeliveryDate)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">تاریخ تحویل</div>
                <div className="font-medium text-gray-900">{formatPersianDate(invoice.deliveryDate)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">وضعیت پرداخت</div>
                <div className="font-medium text-gray-900">{invoice.paymentStatusText}</div>
              </div>
            </div>
          </div>

          {/* جدول اقلام */}
          <div className="print-section p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">اقلام سفارش:</h3>
            <table className="print-table w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">ردیف</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">کد کالا</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">نام کالا</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">مقدار درخواستی</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">مقدار تحویل</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">قیمت واحد</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">مبلغ کل</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.productCode || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                      {item.productCategory && (
                        <div className="text-xs text-gray-500">{item.productCategory}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-center">{item.requestedQuantity}</td>
                    <td className="px-4 py-3 text-sm text-center">
                      <span className={`font-medium ${
                        item.deliveredQuantity !== null 
                          ? item.deliveredQuantity === item.requestedQuantity 
                            ? 'text-green-600' 
                            : 'text-orange-600'
                          : 'text-gray-400'
                      }`}>
                        {item.deliveredQuantity !== null ? item.deliveredQuantity : 'تعیین نشده'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{formatPrice(item.unitPrice)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatPrice(item.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* خلاصه مالی */}
          <div className="print-section p-6 bg-gray-50 border-t border-gray-200">
            <div className="max-w-md mr-auto">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">جمع کل:</span>
                  <span className="font-medium">{formatPrice(invoice.subTotal)}</span>
                </div>
                {invoice.discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">تخفیف:</span>
                    <span className="font-medium text-red-600">-{formatPrice(invoice.discountAmount)}</span>
                  </div>
                )}
                {invoice.taxAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">مالیات:</span>
                    <span className="font-medium">{formatPrice(invoice.taxAmount)}</span>
                  </div>
                )}
                <div className="border-t border-gray-300 pt-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>مبلغ نهایی:</span>
                    <span className="text-blue-600">{formatPrice(invoice.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* بخش امضا */}
          <div className="signature-section p-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-medium text-gray-900 mb-4">تأیید دریافت کالا:</h4>
                <p className="text-sm text-gray-600 mb-6">
                  اینجانب {invoice.customer.name} دریافت کالاهای فوق را تأیید می‌کنم.
                </p>
                <div className="signature-box">
                  {invoice.customer.signatureImageUrl ? (
                    <div className="signature-image-container">
                      <img 
                        src={`http://localhost:5012${invoice.customer.signatureImageUrl}`}
                        alt="امضای تحویل‌گیرنده"
                        className="signature-image"
                      />
                      <p className="text-sm text-gray-500 mt-2">{invoice.customer.name}</p>
                    </div>
                  ) : (
                  <p className="text-sm text-gray-500">امضا و نام تحویل‌گیرنده</p>
                  )}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-4">تحویل‌دهنده:</h4>
                {invoice.salesRep && (
                  <div className="text-sm text-gray-600 mb-6">
                    <p>نام: {invoice.salesRep.name}</p>
                    {invoice.salesRep.phone && <p>تلفن: {invoice.salesRep.phone}</p>}
                  </div>
                )}
                <div className="signature-box">
                  {invoice.salesRep?.signatureImageUrl ? (
                    <div className="signature-image-container">
                      <img 
                        src={`http://localhost:5012${invoice.salesRep.signatureImageUrl}`}
                        alt="امضای تحویل‌دهنده"
                        className="signature-image"
                      />
                      <p className="text-sm text-gray-500 mt-2">{invoice.salesRep.name}</p>
                    </div>
                  ) : (
                  <p className="text-sm text-gray-500">امضا و نام تحویل‌دهنده</p>
                  )}
                </div>
              </div>
            </div>
            
            {invoice.notes && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">یادداشت‌ها:</h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{invoice.notes}</p>
              </div>
            )}
            
            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <p className="text-xs text-gray-500">
                تاریخ و زمان تحویل: {formatPersianDate(invoice.deliveryDate || new Date())}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* استایل‌های عمومی و چاپ */}
      <style jsx>{`
        .signature-box {
          border-top: 1px solid #d1d5db;
          margin-top: 60px;
          padding-top: 5px;
          min-height: 80px;
          position: relative;
        }
        
        .signature-image-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-top: -50px;
          margin-bottom: 10px;
        }
        
        .signature-image {
          max-height: 60px;
          max-width: 150px;
          object-fit: contain;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          padding: 4px;
          background: white;
        }
        
      `}</style>
      <style jsx>{`
        @media print {
          .no-print {
            display: none !important;
          }
          
          body {
            margin: 0;
            padding: 0;
            background: white !important;
          }
          
          .print-container {
            box-shadow: none !important;
            border-radius: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            max-width: none !important;
            width: 100% !important;
          }
          
          .print-header {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%) !important;
            color: white !important;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          .print-section {
            page-break-inside: avoid;
          }
          
          .print-table {
            border-collapse: collapse;
            width: 100%;
          }
          
          .print-table th,
          .print-table td {
            border: 1px solid #d1d5db !important;
            padding: 8px !important;
          }
          
          .print-table th {
            background-color: #f9fafb !important;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          .signature-section {
            page-break-inside: avoid;
          }
          
          .signature-box {
            border-top: 1px solid #000 !important;
            margin-top: 60px;
            padding-top: 5px;
            min-height: 80px;
          }
          
          .signature-image-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-top: -50px;
            margin-bottom: 10px;
          }
          
          .signature-image {
            max-height: 60px !important;
            max-width: 150px !important;
            object-fit: contain;
            filter: none !important;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
};

export default DeliveryInvoice;