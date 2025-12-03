const CACHE_NAME = 'dsd-webapp-v1';
const STATIC_CACHE_NAME = 'dsd-static-v1';
const DYNAMIC_CACHE_NAME = 'dsd-dynamic-v1';

// فایل‌های ضروری که باید همیشه در cache باشند
const STATIC_FILES = [
  '/',
  '/index.html',
  '/src/main.jsx',
  '/src/App.jsx',
  '/pwa-192x192.png',
  '/offline.html'
];

// نصب Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker نصب شد');
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('فایل‌های اصلی در cache ذخیره شدند');
        return cache.addAll(STATIC_FILES);
      })
  );
});

// فعال‌سازی Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker فعال شد');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
            console.log('حذف cache قدیمی:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// مدیریت درخواست‌ها
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // درخواست‌های API
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // اگر درخواست موفق بود، آن را در cache ذخیره کن
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseClone);
              });
          }
          return response;
        })
        .catch(() => {
          // اگر آفلاین هستیم، از cache استفاده کن
          return caches.match(request);
        })
    );
  }
  // فایل‌های استاتیک
  else {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          // اگر در cache موجود است، آن را برگردان
          if (response) {
            return response;
          }
          
          // وگرنه از شبکه دریافت کن
          return fetch(request)
            .then((response) => {
              // اگر درخواست موفق بود، آن را در cache ذخیره کن
              if (response.status === 200) {
                const responseClone = response.clone();
                caches.open(DYNAMIC_CACHE_NAME)
                  .then((cache) => {
                    cache.put(request, responseClone);
                  });
              }
              return response;
            })
            .catch(() => {
              // اگر فایل HTML درخواست شده و آفلاین هستیم، صفحه آفلاین را نمایش بده
              if (request.headers.get('accept').includes('text/html')) {
                return caches.match('/offline.html');
              }
            });
        })
    );
  }
});

// مدیریت پیام‌ها از اپلیکیشن اصلی
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// نمایش اعلان‌ها (برای آینده)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey
      },
      actions: [
        {
          action: 'explore',
          title: 'مشاهده',
          icon: '/pwa-192x192.png'
        },
        {
          action: 'close',
          title: 'بستن',
          icon: '/pwa-192x192.png'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// مدیریت کلیک روی اعلان‌ها
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
}); 