// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'static',
  trailingSlash: 'ignore',
  adapter: cloudflare({ platformProxy: { enabled: true } }),
  integrations: [
    react(),
  ],
  vite: {
    plugins: [tailwindcss()]
  },
  site: 'https://demosite.p31ca.org/'
});
