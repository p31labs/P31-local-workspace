import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: null,
      manifest: false,
      includeAssets: [
        'manifest.json',
        'icon-192.png',
        'icon-512.png',
        'favicon.svg',
      ],
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff2,png,svg,json}'],
      },
    }),
  ],
})
