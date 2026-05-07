import legacy from '@vitejs/plugin-legacy'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    legacy()
  ],
  server: {
    proxy: {
      '/odoo-api': {
        target: 'https://mrp.staging-sourceamax.asia',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/odoo-api/, ''),
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['@capacitor/geolocation', '@capacitor/core']
  },
  test: {
    globals: true,
    environment: 'jsdom'
  }
})
