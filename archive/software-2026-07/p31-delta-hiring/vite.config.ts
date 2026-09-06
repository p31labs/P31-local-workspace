import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: { port: 3150 },
  build: { outDir: 'dist', sourcemap: true }
});
