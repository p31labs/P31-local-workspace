// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'static',
  adapter: cloudflare(),
  integrations: [react(), tailwind()],
  site: 'https://p31ca.org',
  trailingSlash: 'always',
  viewTransitions: true,
  build: {
    inlineStylesheets: 'auto',
  },
  vite: {
    build: {
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/three')) return 'three';
            if (id.includes('@electric-sql/pglite')) return 'pglite';
          },
        },
      },
    },
    plugins: [],
  },
});
