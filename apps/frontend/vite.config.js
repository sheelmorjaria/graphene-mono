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
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy) => {
          proxy.on('error', (err, req) => {
            console.log('🔴 Proxy error:', err.message);
            console.log('Request was:', req.method, req.url);
          });
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log('🟡 Proxying request:', req.method, req.url, '→', proxyReq.getHeader('host'));
          });
          proxy.on('proxyRes', (proxyRes, req) => {
            console.log('🟢 Proxy response:', proxyRes.statusCode, req.url);
          });
        }
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
        // Function form — the object form silently produced EMPTY react-vendor
        // and redux chunks (React/RTK stayed glued into the main bundle).
        // Segment-precise patterns so react-router doesn't land in react-vendor.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'react-vendor';
          if (/[\\/]node_modules[\\/](react-router|react-router-dom)[\\/]/.test(id) || id.includes('@remix-run/router')) return 'router';
          if (/[\\/]node_modules[\\/](redux|react-redux|@reduxjs|immer|reselect|redux-thunk)[\\/]/.test(id)) return 'state';
          if (/[\\/]node_modules[\\/](@paypal|qrcode|prop-types)[\\/]/.test(id)) return 'payment';
          return undefined;
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
    singleFork: true,
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
