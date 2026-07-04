// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  integrations: [tailwind(), react()],
  site: 'https://p31ca.org',
  output: 'server',
  adapter: cloudflare({
    platformProxy: { enabled: false },
  }),
  // Avoid /dome <-> /dome/ redirect ping-pong with static hosts (see ground-truth routes.dome note).
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
    plugins: [

    ],
  }
});
