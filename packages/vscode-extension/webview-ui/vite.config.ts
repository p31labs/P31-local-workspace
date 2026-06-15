import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'src/main.tsx'),
      output: {
        entryFileNames: 'webview.js',
        chunkFileNames: '[name].js',
        assetFileNames: 'webview.[ext]',
      },
    },
    target: 'es2020',
    sourcemap: false,
    minify: 'esbuild',
  },
  server: {
    port: 3001,
    strictPort: true,
  },
});
