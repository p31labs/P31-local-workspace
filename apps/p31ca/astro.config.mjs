// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [tailwind(), react()],
  site: 'https://p31ca.org',
  output: 'static',
  trailingSlash: 'always',
  vite: {
    build: {
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/three')) return 'three';
          },
        },
      },
    },
    plugins: [],
  },
});
