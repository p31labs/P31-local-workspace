/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/spaceship-earth/',
  plugins: [
    react(),
    visualizer({
      filename: './dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
    VitePWA({
      registerType: 'prompt',
      // useRegisterSW (virtual:pwa-register/react) handles SW registration via the bundle.
      // Disable HTML script injection — Rolldown silently drops generateBundle output.
      injectRegister: null,
      includeAssets: ['favicon.ico', 'icons/*.png', 'fonts/*.ttf'],
      manifest: {
        name: 'SPACESHIP EARTH — P31 Labs',
        short_name: 'SpaceshipEarth',
        description: 'The sovereign OS for your family\'s quantum journey.',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    port: 5180,
  },
  resolve: {
    alias: {
      '@p31/shared': path.resolve(__dirname, '../packages/shared/src'),
      '@p31/node-zero': path.resolve(__dirname, '../packages/node-zero/src'),
      '@p31/love-ledger': path.resolve(__dirname, '../packages/love-ledger/src'),
      '@p31/game-engine': path.resolve(__dirname, '../packages/game-engine/src'),
      '@p31/sovereign': path.resolve(__dirname, '../packages/sovereign/src'),
    },
    dedupe: ['three', '@react-three/fiber', '@react-three/drei'],
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    cssMinify: true,
    rollupOptions: {
      onwarn(warning, defaultHandler) {
        // sovereignRelay is intentionally lazy-loaded by BONDING as an optional dep.
        // When built inside SE the module is already in the bundle — expected non-issue.
        if (warning.code === 'INEFFECTIVE_DYNAMIC_IMPORT' && warning.message.includes('sovereignRelay')) return;
        defaultHandler(warning);
      },
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) return 'vendor-react';
          if (id.includes('node_modules/three/') || id.includes('node_modules/@react-three/')) return 'vendor-three';
          if (id.includes('node_modules/zustand/')) return 'vendor-utils';
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
