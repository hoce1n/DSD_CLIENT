import { useState, useEffect } from 'react';

export const usePWA = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);

  useEffect(() => {
    // بررسی وضعیت نصب
    const checkInstallStatus = () => {
      if (window.matchMedia('(display-mode: standalone)').matches || 
          window.navigator.standalone === true) {
        setIsInstalled(true);
      }
    };

    // مدیریت وضعیت آنلاین/آفلاین
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // مدیریت رویداد نصب
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    // مدیریت به‌روزرسانی Service Worker
    const handleServiceWorkerUpdate = () => {
      setIsUpdateAvailable(true);
    };

    checkInstallStatus();

    // ثبت event listenerها
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // بررسی Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SW_UPDATE_AVAILABLE') {
          handleServiceWorkerUpdate();
        }
      });

      // ثبت Service Worker
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker ثبت شد:', registration.scope);
          
          // بررسی به‌روزرسانی
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setIsUpdateAvailable(true);
              }
            });
          });
        })
        .catch((error) => {
          console.error('خطا در ثبت Service Worker:', error);
        });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // نصب اپلیکیشن
  const installApp = async () => {
    if (!installPrompt) return false;

    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('کاربر نصب را پذیرفت');
      setInstallPrompt(null);
      return true;
    } else {
      console.log('کاربر نصب را رد کرد');
      return false;
    }
  };

  // به‌روزرسانی اپلیکیشن
  const updateApp = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration && registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          window.location.reload();
        }
      });
    }
  };

  // ارسال اعلان (برای آینده)
  const sendNotification = (title, options = {}) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options
      });
    }
  };

  // درخواست مجوز اعلان
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  };

  return {
    isOnline,
    isInstalled,
    installPrompt: !!installPrompt,
    isUpdateAvailable,
    installApp,
    updateApp,
    sendNotification,
    requestNotificationPermission
  };
}; 