import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./src/test/setup.performance.js'],
    pool: 'threads',
    testTimeout: 120000, // 2 minutes for performance tests
    hookTimeout: 60000,
    name: 'performance',
    include: [
      'src/**/*.performance.test.js',
      'src/**/*.load.test.js',
      'src/__tests__/performance/**/*.test.js',
      'src/__tests__/load/**/*.test.js'
    ],
    exclude: [
      'node_modules/**'
    ],
    maxConcurrency: 2, // Limit concurrency for performance tests
    coverage: {
      enabled: false // Disable coverage for performance tests
    }
  },
  resolve: {
    alias: {
      '@test': path.resolve(__dirname, 'src/test')
    }
  }
});