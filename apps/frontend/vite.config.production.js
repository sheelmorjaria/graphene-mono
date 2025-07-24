import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Simplified production config to avoid module issues
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  build: {
    minify: 'esbuild',
    target: 'es2015', // More compatible target
    sourcemap: false,
    rollupOptions: {
      output: {
        format: 'es'
      }
    }
  }
})