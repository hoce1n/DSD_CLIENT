import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5012',
        changeOrigin: true,
        secure: false
      }
    }
  },
  plugins: [
    react(), 
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,ttf}']
      },
      includeAssets: ['favicon.ico', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'سیستم مدیریت سفارشات',
        short_name: 'سفارش یار',
        description: 'سیستم جامع مدیریت سفارشات و فروش',
        theme_color: '#1f2937',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        lang: 'fa',
        dir: 'rtl',
        icons: [
          {
            src: 'favicon.png',
            sizes: '48x48',
            type: 'image/x-icon',
            purpose: 'any'
          },
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        categories: ['business', 'productivity'],
        shortcuts: [
          {
            name: 'داشبورد',
            short_name: 'داشبورد',
            description: 'دسترسی سریع به داشبورد اصلی',
            url: '/dashboard',
            icons: [{ src: 'favicon.ico', sizes: '48x48', type: 'image/x-icon' }]
          },
          {
            name: 'سفارشات',
            short_name: 'سفارشات',
            description: 'مدیریت سفارشات',
            url: '/orders',
            icons: [{ src: 'favicon.ico', sizes: '48x48', type: 'image/x-icon' }]
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ],
})
