import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [react(), tailwind()],
  output: 'static',
  trailingSlash: 'always',
  vite: {
    optimizeDeps: {
      exclude: ['@electric-sql/pglite']
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            pglite: ['@electric-sql/pglite'],
          },
        },
      },
      chunkSizeWarningLimit: 500,
    },
  },
});
