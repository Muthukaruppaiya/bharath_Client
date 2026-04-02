import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  appType: 'spa',
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://bharath-server.onrender.com',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})