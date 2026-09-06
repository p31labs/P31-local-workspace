import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          ['babel-plugin-react-compiler', {
            compilationMode: 'annotation',
          }],
        ],
      },
    }),
  ],
  server: {
    port: 3000,
    host: true
  }
})