import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  plugins: [react(), tailwindcss()],
  server: {
    port: 5199,
    proxy: {
      // Dev-only: avoid CORS by proxying telemetry through Vite.
      // In production (Cloudflare Pages) the dashboard and worker share the
      // p31ca.org zone, so no proxy is needed. Override target with VITE_TETRA_HUB_URL.
      '/api/tetra': { target: process.env.VITE_TETRA_HUB_URL || 'https://tetra-hub.trimtab-signal.workers.dev', changeOrigin: true },
      '/api/health': { target: process.env.VITE_TETRA_HUB_URL || 'https://tetra-hub.trimtab-signal.workers.dev', changeOrigin: true },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
