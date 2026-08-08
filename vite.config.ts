import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: './',
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
        manifest: {
          name: 'OrbitX - مساحة الدراسة',
          short_name: 'OrbitX',
          description: 'منصتك المبتكرة للدراسة بتركيز عالي',
          theme_color: '#0a0b16',
          background_color: '#0a0b16',
          display: 'standalone',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
          maximumFileSizeToCacheInBytes: 15 * 1024 * 1024 // 15MB
        }
      })
    ],
    build: {
      target: 'esnext',
      minify: 'esbuild',
      cssCodeSplit: true,
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              // Group 3D graphics libraries together
              if (id.includes('three') || id.includes('@react-three') || id.includes('ecctrl') || id.includes('react-globe.gl')) {
                return 'vendor-3d-graphics';
              }
              // Group Firebase client libraries
              if (id.includes('firebase')) {
                return 'vendor-firebase-database';
              }
              // Group Recharts & D3 data visualization libraries
              if (id.includes('recharts') || id.includes('d3')) {
                return 'vendor-charts-data';
              }
              // Group Lucide React Icons
              if (id.includes('lucide-react')) {
                return 'vendor-graphics-icons';
              }
              // Group core framework libraries
              if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler') || id.includes('zustand')) {
                return 'vendor-framework-core';
              }
              // Group animation libraries
              if (id.includes('motion') || id.includes('framer-motion')) {
                return 'vendor-animation-motion';
              }
              // General common utilities fallback chunk
              return 'vendor-common-utilities';
            }
          }
        }
      }
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
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
