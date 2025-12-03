 import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import {
  X,
  DollarSign,
  CreditCard,
  Banknote,
  Building2,
  FileText,
  Calendar,
  Hash,
  MessageSquare
} from 'lucide-react';
import { addCustomerPayment } from '../../store/slices/customerLedgerSlice';
import PersianDatePicker from '../PersianDatePicker';
import customerFinancialService from '../../services/customerFinancialService';

const AddPaymentModal = ({ isOpen, onClose, customer, orderId = null }) => {
  const dispatch = useDispatch();
  const { paymentLoading, paymentError } = useSelector(state => state.customerLedger);

  const [formData, setFormData] = useState({
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0], // امروز
    paymentMethod: '',
    referenceNumber: '',
    description: '',
    notes: '',
    orderId: orderId || null
  });

  const [errors, setErrors] = useState({});

  // Payment methods با آیکون
  const paymentMethods = [
    { value: 'Cash', label: 'نقدی', icon: Banknote, color: 'text-green-500' },
    { value: 'Card', label: 'کارتخوان', icon: CreditCard, color: 'text-blue-500' },
    { value: 'Check', label: 'چک', icon: FileText, color: 'text-purple-500' },
    { value: 'BankTransfer', label: 'انتقال بانکی', icon: Building2, color: 'text-orange-500' }
  ];

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        amount: '',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: '',
        referenceNumber: '',
        description: '',
        notes: '',
        orderId: orderId || null
      });
      setErrors({});
    }
  }, [isOpen, orderId]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle payment method selection
  const handlePaymentMethodChange = (method) => {
    setFormData(prev => ({
      ...prev,
      paymentMethod: method,
      referenceNumber: '' // Clear reference number when changing method
    }));

    if (errors.paymentMethod) {
      setErrors(prev => ({
        ...prev,
        paymentMethod: ''
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const validation = customerFinancialService.validatePaymentForm(formData);
    setErrors(validation.errors);
    return validation.isValid;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('لطفاً خطاهای فرم را برطرف کنید');
      return;
    }

    try {
      const paymentData = {
        amount: parseFloat(formData.amount),
        paymentDate: formData.paymentDate,
        paymentMethod: formData.paymentMethod,
        referenceNumber: formData.referenceNumber || null,
        description: formData.description || `پرداخت ${customerFinancialService.getPaymentMethodText(formData.paymentMethod)}`,
        notes: formData.notes || null,
        orderId: formData.orderId
      };

      await dispatch(addCustomerPayment({
        customerId: customer.id,
        paymentData
      })).unwrap();

      toast.success('پرداخت با موفقیت ثبت شد');
      onClose();
    } catch (error) {
      toast.error(error || 'خطا در ثبت پرداخت');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <DollarSign className="w-6 h-6 text-green-500 ml-2" />
            <h2 className="text-xl font-semibold text-gray-900">ثبت پرداخت جدید</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Customer Info */}
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <h3 className="font-medium text-gray-900">{customer?.name}</h3>
          <p className="text-sm text-gray-600">{customer?.phone}</p>
          {customer?.currentBalance !== undefined && (
            <p className="text-sm mt-1">
              <span className="text-gray-600">بدهی فعلی: </span>
              <span className={`font-medium ${customer.currentBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {customerFinancialService.formatBalance(customer.currentBalance)}
              </span>
            </p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              مبلغ پرداخت (ریال) *
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.amount ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="مبلغ پرداخت را وارد کنید"
              min="1"
              step="1"
            />
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
            )}
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline ml-1" />
              تاریخ پرداخت *
            </label>
            <PersianDatePicker
              value={formData.paymentDate}
              onChange={(date) => setFormData(prev => ({...prev, paymentDate: date}))}
              placeholder="انتخاب تاریخ پرداخت"
              className={`w-full ${errors.paymentDate ? 'border-red-500' : ''}`}
            />
            {errors.paymentDate && (
              <p className="mt-1 text-sm text-red-600">{errors.paymentDate}</p>
            )}
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              روش پرداخت *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => handlePaymentMethodChange(method.value)}
                    className={`p-3 border rounded-md flex items-center justify-center transition-colors ${
                      formData.paymentMethod === method.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ml-2 ${
                      formData.paymentMethod === method.value ? 'text-blue-500' : method.color
                    }`} />
                    <span className="text-sm">{method.label}</span>
                  </button>
                );
              })}
            </div>
            {errors.paymentMethod && (
              <p className="mt-1 text-sm text-red-600">{errors.paymentMethod}</p>
            )}
          </div>

          {/* Reference Number (conditional) */}
          {(formData.paymentMethod === 'Check' || formData.paymentMethod === 'BankTransfer') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Hash className="w-4 h-4 inline ml-1" />
                {formData.paymentMethod === 'Check' ? 'شماره چک' : 'شماره تراکنش'} *
              </label>
              <input
                type="text"
                name="referenceNumber"
                value={formData.referenceNumber}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.referenceNumber ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder={formData.paymentMethod === 'Check' ? 'شماره چک را وارد کنید' : 'شماره تراکنش بانکی'}
              />
              {errors.referenceNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.referenceNumber}</p>
              )}
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              توضیحات
            </label>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="توضیحات اختیاری"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MessageSquare className="w-4 h-4 inline ml-1" />
              یادداشت‌ها
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="یادداشت‌های اضافی"
            />
          </div>

          {/* Error Display */}
          {paymentError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{paymentError}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={paymentLoading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={paymentLoading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
            >
              {paymentLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <DollarSign className="w-4 h-4 ml-2" />
                  ثبت پرداخت
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPaymentModal;