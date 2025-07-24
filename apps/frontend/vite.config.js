import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import viteCompression from 'vite-plugin-compression'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    viteCompression({
      verbose: true,
      disable: false,
      threshold: 10240,
      algorithm: 'gzip',
      ext: '.gz',
    })
  ],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  build: {
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Optimize minification
    minify: 'esbuild',
    // Set target for better compatibility
    target: 'esnext',
    // Enable source maps for debugging
    sourcemap: false,
    // Tree-shake unused code
    rollupOptions: {
      output: {
        format: 'es',
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router': ['react-router-dom'],
          'payment': ['@paypal/react-paypal-js', 'qrcode.react'],
          'redux': ['@reduxjs/toolkit', 'react-redux']
        }
      }
    },
    chunkSizeWarningLimit: 500
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    testTimeout: 20000, // Increase timeout to 20 seconds
    pool: 'forks', // Use forks for better isolation
    poolOptions: {
      forks: {
        singleFork: true
      }
    },
    // Add Jest compatibility
    server: {
      deps: {
        inline: ['@testing-library/react', '@testing-library/user-event']
      }
    },
    // Optimize for React tests
    clearMocks: true,
    restoreMocks: true,
    mockReset: true,
    // Exclude E2E tests from Vitest (they should run with Playwright)
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build,eslint,prettier}.config.*',
      '**/e2e/**',
      '**/*.e2e.*'
    ]
  },
})
