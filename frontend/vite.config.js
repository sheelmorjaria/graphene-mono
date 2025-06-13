import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss()],
  server: {
    port: 3000,
    host: true
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Core React dependencies
          if (id.includes('react') || id.includes('react-dom')) {
            return 'react-vendor';
          }
          // Router dependencies
          if (id.includes('react-router')) {
            return 'router';
          }
          // Redux/State management
          if (id.includes('redux') || id.includes('@reduxjs')) {
            return 'state';
          }
          // Payment related libraries
          if (id.includes('paypal') || id.includes('qrcode')) {
            return 'payment';
          }
          // UI libraries and icons
          if (id.includes('@heroicons') || id.includes('react-icons')) {
            return 'ui-icons';
          }
          // Testing libraries (should not be in production, but just in case)
          if (id.includes('testing-library') || id.includes('vitest')) {
            return 'testing';
          }
          // Other large third-party libraries
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    },
    chunkSizeWarningLimit: 500
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    testTimeout: 10000, // Increase timeout to 10 seconds
  },
})
