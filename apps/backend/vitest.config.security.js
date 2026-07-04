import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./src/test/setup.security.js'],
    pool: 'threads',
    testTimeout: 15000,
    hookTimeout: 10000,
    name: 'security',
    include: [
      'src/**/*.security.test.js',
      'src/__tests__/security/**/*.test.js',
      'src/__tests__/userManagement.security.test.js'
    ],
    exclude: [
      'node_modules/**'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'src/test/**',
        'src/**/__tests__/**',
        'coverage/**',
        '**/*.config.js',
        'scripts/**'
      ]
    }
  },
  resolve: {
    alias: {
      '@test': path.resolve(__dirname, 'src/test')
    }
  }
});