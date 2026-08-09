import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: '/OrbitX../',
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.png'],
        manifest: {
          name: 'OrbitX',
          short_name: 'OrbitX',
          theme_color: '#0a0b16',
          background_color: '#0a0b16',
          display: 'standalone',
          icons: [
            { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' }
          ]
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 10485760,
          navigateFallback: 'index.html',
          navigateFallbackDenylist: [/^\/OrbitX\.\.\/(assets|sounds)\//],
          runtimeCaching: [
            {
              urlPattern: ({ url }) => url.hostname === 'api.dicebear.com',
              handler: 'CacheFirst',
              options: {
                cacheName: 'dicebear-avatars',
                cacheableResponse: { statuses: [0, 200] },
                expiration: { maxEntries: 500, maxAgeSeconds: 30 * 24 * 60 * 60 },
              },
            },
            {
              urlPattern: ({ url }) => url.hostname === 'images.unsplash.com',
              handler: 'CacheFirst',
              options: {
                cacheName: 'unsplash-images',
                cacheableResponse: { statuses: [0, 200] },
                expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 },
              },
            },
            {
              urlPattern: ({ url }) => url.hostname.includes('mp3quran.net') || url.hostname === 'archive.org' || url.hostname === 'assets.mixkit.co',
              handler: 'CacheFirst',
              options: {
                cacheName: 'orbitx-audio',
                cacheableResponse: { statuses: [0, 200] },
                expiration: { maxEntries: 30, maxAgeSeconds: 30 * 24 * 60 * 60 },
                rangeRequests: true,
              },
            },
            {
              urlPattern: ({ url }) => url.hostname === 'raw.githubusercontent.com' || url.hostname === 'www.transparenttextures.com' || url.hostname === 'grainy-gradients.vercel.app',
              handler: 'CacheFirst',
              options: {
                cacheName: 'orbitx-assets',
                cacheableResponse: { statuses: [0, 200] },
                expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 },
              },
            },
          ],
        }
      })
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'motion'],
            'vendor-charts': ['recharts'],
            'vendor-three': ['three', 'react-globe.gl'],
          },
        },
      },
    },
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        'firebase/app': path.resolve(__dirname, 'src/supabaseAdapter.ts'),
        'firebase/auth': path.resolve(__dirname, 'src/supabaseAdapter.ts'),
        'firebase/firestore': path.resolve(__dirname, 'src/supabaseAdapter.ts'),
        'react-firebase-hooks/auth': path.resolve(__dirname, 'src/firebaseHooks.ts'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
