import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@p31/design-system': path.resolve(__dirname, '../../packages/design-system'),
    },
  },
  server: { port: 5190, host: true },
});
