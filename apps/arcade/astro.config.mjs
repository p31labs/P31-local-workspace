import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import path from 'path';

export default defineConfig({
  output: 'static',
  integrations: [react()],
  vite: {
    resolve: {
      alias: {
        '@p31/game-engine/react': path.resolve(import.meta.dirname, '../../packages/game-engine/src/react.ts'),
        '@p31/game-engine': path.resolve(import.meta.dirname, '../../packages/game-engine/src/index.ts'),
        '@p31/game-generator': path.resolve(import.meta.dirname, '../../packages/game-generator/src/index.ts'),
      },
      dedupe: ['react', 'react-dom'],
    },
    ssr: {
      noExternal: ['@react-three/fiber', '@react-three/drei', '@react-three/postprocessing', 'three'],
    },
  },
});
