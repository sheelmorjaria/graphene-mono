import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./src/test/setup.vitest.js'],
    pool: 'threads',
    testTimeout: 10000,
    hookTimeout: 10000,
    name: 'unit',
    include: [
      'src/**/*.test.js',
      'src/**/*.unit.test.js'
    ],
    exclude: [
      'src/**/*.integration.test.js',
      'src/**/*.e2e.test.js',
      'src/**/*.load.test.js',
      'src/**/*.performance.test.js',
      'src/**/*.security.test.js',
      'src/**/*.playwright.test.js',
      'src/**/*.e2e.playwright.test.js',
      'src/routes/**/*.test.js',
      'src/__tests__/integration/**',
      'src/__tests__/e2e/**',
      'src/__tests__/load/**',
      'src/__tests__/performance/**',
      'src/__tests__/security/**',
      'src/__tests__/playwright/**',
      'src/models/**/*.test.js',  // Exclude model tests - they use integration setup
      'node_modules/**'
    ],
    coverage: {
      provider: 'v8',
      // Generate the coverage report even when tests fail (default is false).
      reportOnFailure: true,
      reporter: ['text', 'json', 'json-summary', 'html'],
      include: ['src/**/*.js'],
      exclude: [
        'node_modules/**',
        'src/test/**',
        'src/**/__tests__/**',
        'coverage/**',
        '**/*.config.js',
        'scripts/**',
        // Dead code — not imported anywhere
        'src/controllers/PaymentController.class.js',
        'src/controllers/paymentControllerFactory.js',
        'src/controllers/adminUserController.js',
        'src/models/Return.js',
        'src/middleware/cors.js'
      ],
      // @ratchet-begin (auto-updated by `npm run coverage:ratchet` — do not edit manually)
      thresholds: { lines: 65, branches: 54, functions: 47, statements: 65 }
      // @ratchet-end
    }
  },
  resolve: {
    alias: {
      '@test': path.resolve(__dirname, 'src/test')
    }
  }
});