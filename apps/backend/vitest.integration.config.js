import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./src/test/setup.integration.js'],
    include: [
      'src/**/*.integration.test.js',
      'src/routes/**/*.test.js',
      'src/__tests__/integration/**/*.test.js',
      'src/__tests__/userManagement.integration.test.js',
      'src/test/**/*.integration.test.js'
    ],
    exclude: [
      'src/**/*.e2e.test.js',
      'src/**/*.performance.test.js',
      'src/**/*.load.test.js',
      'src/**/*.security.test.js',
      'src/__tests__/e2e/**',
      'src/__tests__/performance/**',
      'src/__tests__/load/**',
      'src/__tests__/security/**',
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**'
    ],
    testTimeout: 30000, // Longer timeout for integration tests
    pool: 'forks', // Use separate processes for integration tests
    poolOptions: {
      forks: {
        singleFork: true // Run integration tests sequentially
      }
    },
    reporter: ['verbose'],
    coverage: {
      provider: 'c8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage/integration'
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@test': path.resolve(__dirname, './src/test')
    }
  }
});