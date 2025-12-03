import { usePWA } from '../hooks/usePWA';
import { Wifi, WifiOff } from 'lucide-react';

const OnlineStatus = () => {
  const { isOnline } = usePWA();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-red-600 text-white py-2 px-4">
      <div className="flex items-center justify-center gap-2 text-sm">
        <WifiOff className="w-4 h-4" />
        <span>شما آفلاین هستید - برخی قابلیت‌ها محدود می‌باشند</span>
      </div>
    </div>
  );
};

export default OnlineStatus; 