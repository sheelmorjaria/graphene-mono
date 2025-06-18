import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./src/test/setup.security.js'],
    pool: 'threads',
    testTimeout: 30000,
    hookTimeout: 15000,
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
      provider: 'c8',
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