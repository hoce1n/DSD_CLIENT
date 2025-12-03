import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';

const DigitalSignature = ({ currentSignature, onSignatureUpdate }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showDrawingPad, setShowDrawingPad] = useState(false);
  const [displaySignature, setDisplaySignature] = useState(currentSignature);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [lastX, setLastX] = useState(0);
  const [lastY, setLastY] = useState(0);

  // Update display signature when currentSignature prop changes
  useEffect(() => {
    setDisplaySignature(currentSignature);
  }, [currentSignature]);

  // آپلود فایل امضا
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // اعتبارسنجی فایل
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('فقط فایل‌های PNG، JPG و SVG مجاز است');
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB
      toast.error('حجم فایل نباید بیشتر از 2 مگابایت باشد');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('signatureFile', file);

    try {
      const response = await api.post('/apiauth/upload-signature', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success(response.data.message);
      setDisplaySignature(response.data.signatureUrl);
      onSignatureUpdate(response.data.signatureUrl);
    } catch (error) {
      toast.error(error.response?.data?.message || 'خطا در آپلود امضا');
    } finally {
      setIsUploading(false);
      // پاک کردن input file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // حذف امضا
  const handleDeleteSignature = async () => {
    if (!window.confirm('آیا از حذف امضا اطمینان دارید؟')) return;

    try {
      const response = await api.delete('/apiauth/delete-signature');
      toast.success(response.data.message);
      setDisplaySignature(null);
      onSignatureUpdate(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'خطا در حذف امضا');
    }
  };

  // Handle touch events for mobile drawing
  const getTouchPos = (canvasDom, touchEvent) => {
    const rect = canvasDom.getBoundingClientRect();
    return {
      x: touchEvent.touches[0].clientX - rect.left,
      y: touchEvent.touches[0].clientY - rect.top
    };
  };

  // شروع رسم - Mouse
  const startDrawing = (e) => {
    setIsDrawingMode(true);
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    setLastX(e.clientX - rect.left);
    setLastY(e.clientY - rect.top);
  };

  // شروع رسم - Touch
  const startDrawingTouch = (e) => {
    e.preventDefault();
    setIsDrawingMode(true);
    const canvas = canvasRef.current;
    const touchPos = getTouchPos(canvas, e);
    setLastX(touchPos.x);
    setLastY(touchPos.y);
  };

  // رسم - Mouse
  const draw = (e) => {
    if (!isDrawingMode) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(currentX, currentY);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();

    setLastX(currentX);
    setLastY(currentY);
  };

  // رسم - Touch
  const drawTouch = (e) => {
    e.preventDefault();
    if (!isDrawingMode) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const touchPos = getTouchPos(canvas, e);

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(touchPos.x, touchPos.y);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();

    setLastX(touchPos.x);
    setLastY(touchPos.y);
  };

  // پایان رسم
  const stopDrawing = () => {
    setIsDrawingMode(false);
  };

  // پاک کردن canvas
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // ذخیره امضای رسم شده
  const saveDrawnSignature = async () => {
    const canvas = canvasRef.current;
    
    // تبدیل canvas به blob
    canvas.toBlob(async (blob) => {
      if (!blob) {
        toast.error('خطا در تبدیل امضا');
        return;
      }

      setIsUploading(true);
      const formData = new FormData();
      formData.append('signatureFile', blob, 'signature.png');

      try {
        const response = await api.post('/apiauth/upload-signature', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        toast.success(response.data.message);
        setDisplaySignature(response.data.signatureUrl);
        onSignatureUpdate(response.data.signatureUrl);
        setShowDrawingPad(false);
      } catch (error) {
        toast.error(error.response?.data?.message || 'خطا در ذخیره امضا');
      } finally {
        setIsUploading(false);
      }
    }, 'image/png');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 flex items-center">
        <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-2 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
        امضای دیجیتال
      </h3>

      {/* نمایش امضای فعلی */}
      {displaySignature && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">امضای فعلی:</p>
          <div className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-gray-50 inline-block max-w-full">
            <img 
              src={`http://localhost:5012${displaySignature}?t=${Date.now()}`} 
              alt="امضای فعلی" 
              className="max-h-16 sm:max-h-20 max-w-full sm:max-w-48 h-auto"
              style={{ filter: 'none' }}
            />
          </div>
          <div className="mt-3 flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => setShowDrawingPad(!showDrawingPad)}
              className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors min-h-[44px] flex-1 sm:flex-initial"
            >
              ویرایش امضا
            </button>
            <button
              onClick={handleDeleteSignature}
              className="px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors min-h-[44px] flex-1 sm:flex-initial"
            >
              حذف امضا
            </button>
          </div>
        </div>
      )}

      {/* گزینه‌های آپلود - فقط وقتی امضا وجود نداره یا در حال ویرایش است */}
      {(!displaySignature || showDrawingPad) && (
        <div className="space-y-4">
          {/* آپلود فایل */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {displaySignature ? 'آپلود امضای جدید' : 'آپلود فایل امضا'}
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.svg"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500 file:ml-2 sm:file:ml-4 file:py-2 file:px-3 sm:file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              disabled={isUploading}
            />
            <p className="text-xs text-gray-500 mt-1">
              فرمت‌های مجاز: PNG، JPG، SVG - حداکثر حجم: 2MB
            </p>
          </div>

          {/* یا */}
          <div className="text-center">
            <span className="text-gray-500 text-sm">یا</span>
          </div>

          {/* رسم امضا */}
          {!displaySignature && (
            <div>
              <button
                onClick={() => setShowDrawingPad(!showDrawingPad)}
                className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors min-h-[44px]"
              >
                {showDrawingPad ? 'بستن صفحه رسم' : 'رسم امضا'}
              </button>
            </div>
          )}

          {/* صفحه رسم */}
          {showDrawingPad && (
            <div className="border border-gray-300 rounded-lg p-3 sm:p-4 bg-gray-50">
              <p className="text-sm text-gray-600 mb-3">امضای خود را در کادر زیر رسم کنید:</p>
              <div className="w-full overflow-x-auto">
                <canvas
                  ref={canvasRef}
                  width={Math.min(400, window.innerWidth - 80)}
                  height={150}
                  className="border border-gray-400 bg-white cursor-crosshair touch-none max-w-full"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawingTouch}
                  onTouchMove={drawTouch}
                  onTouchEnd={stopDrawing}
                />
              </div>
              <div className="mt-3 flex flex-col sm:flex-row gap-2">
                <button
                  onClick={clearCanvas}
                  className="px-3 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 transition-colors min-h-[44px] flex-1 sm:flex-initial"
                >
                  پاک کردن
                </button>
                <button
                  onClick={saveDrawnSignature}
                  disabled={isUploading}
                  className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 min-h-[44px] flex-1 sm:flex-initial"
                >
                  {isUploading ? 'در حال ذخیره...' : 'ذخیره امضا'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {isUploading && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 ml-2"></div>
            <span className="text-sm text-gray-600">در حال آپلود...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DigitalSignature; 