import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'pwa-192x192.png', 'pwa-512x512.png', 'robots.txt'],
      manifest: {
        name: 'ReadyToGovTH - รวมประกาศรับสมัครงานราชการ',
        short_name: 'ReadyToGov',
        description: 'ศูนย์รวมประกาศรับสมัครงานราชการ พนักงานราชการ รัฐวิสาหกิจ และลูกจ้างชั่วคราว อัปเดตล่าสุด',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
  build: {
    modulePreload: {
      resolveDependencies: (filename, deps) => {
        // Filter out admin and heavy dynamic-only chunks from initial HTML modulepreload
        return deps.filter(dep => 
          !dep.includes('vendor-firebase-auth') &&
          !dep.includes('html2canvas') &&
          !dep.includes('AdminPanel') &&
          !dep.includes('AuthModal')
        );
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Split Firebase Auth into a dedicated chunk so visitors only download firestore lite
            if (id.includes('firebase/auth') || id.includes('@firebase/auth')) {
              return 'vendor-firebase-auth';
            }
            if (id.includes('firebase') || id.includes('@firebase')) {
              return 'vendor-firebase-core';
            }
            if (id.includes('react-router')) {
              return 'vendor-router';
            }
            if (id.includes('@tanstack')) {
              return 'vendor-tanstack';
            }
            if (id.includes('react') || id.includes('scheduler')) {
              return 'vendor-react';
            }
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})
