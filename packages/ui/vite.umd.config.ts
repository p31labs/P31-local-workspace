import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext',
    lib: {
      entry: resolve(__dirname, 'src/embed/index.ts'),
      name: 'P31UI',
      fileName: 'p31-ui.umd',
      formats: ['umd'],
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
        entryFileNames: 'p31-ui.umd.js',
        assetFileNames: 'p31-ui.umd.[ext]',
      },
    },
    outDir: resolve(__dirname, '../../production/shared/assets'),
    emptyOutDir: false,
    cssCodeSplit: false,
  },
});
