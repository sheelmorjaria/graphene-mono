import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./src/test/setup.vitest.js'],
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs}',
      'src/**/__tests__/**/*.{js,mjs,cjs}'
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/*.e2e.test.js',
      '**/*.playwright.test.js',
      '**/*.e2e.playwright.test.js',
      '**/playwright/**'
    ],
    coverage: {
      provider: 'c8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'coverage/**',
        'dist/**',
        '**/node_modules/**',
        '**/test/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/*.test.*'
      ]
    },
    testTimeout: 10000,
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@test': path.resolve(__dirname, './src/test')
    }
  }
});