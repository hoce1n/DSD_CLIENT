import { useState, useEffect } from 'react';
import { Download, Smartphone, X } from 'lucide-react';

const PWAInstallButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // بررسی اینکه آیا اپ قبلاً نصب شده یا نه
    const checkIfInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
      }
    };

    checkIfInstalled();

    // گوش دادن به رویداد beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    // گوش دادن به رویداد appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('کاربر نصب اپلیکیشن را پذیرفت');
    } else {
      console.log('کاربر نصب اپلیکیشن را رد کرد');
    }

    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  // اگر اپ نصب شده یا کاربر قبلاً رد کرده، چیزی نشان نده
  if (isInstalled || localStorage.getItem('pwa-install-dismissed') === 'true') {
    return null;
  }

  if (!showInstallPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 p-4 mx-auto">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center">
            <div className="bg-blue-100 rounded-full p-2 ml-3">
              <Smartphone className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">
                نصب سفارش یار
              </h3>
              <p className="text-xs text-gray-600">
                دسترسی سریع‌تر از صفحه اصلی
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-xs text-gray-600">
            <span className="w-2 h-2 bg-green-500 rounded-full ml-2"></span>
            کار آفلاین
          </div>
          <div className="flex items-center text-xs text-gray-600">
            <span className="w-2 h-2 bg-blue-500 rounded-full ml-2"></span>
            سرعت بالا
          </div>
          <div className="flex items-center text-xs text-gray-600">
            <span className="w-2 h-2 bg-purple-500 rounded-full ml-2"></span>
            تجربه Native
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleInstallClick}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            نصب
          </button>
          <button
            onClick={handleDismiss}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors"
          >
            بعداً
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallButton; 