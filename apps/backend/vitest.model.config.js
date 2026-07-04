import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./src/test/setup.integration.js'], // Use integration setup for real DB
    include: [
      'src/models/**/*.test.js',
      'src/models/**/*.unit.test.js'
    ],
    exclude: [
      'node_modules/**',
      'dist/**',
      'build/**'
    ],
    testTimeout: 30000,
    pool: 'forks',
    singleFork: true,
    silent: true,
    reporter: ['dot'],
    coverage: {
      provider: 'v8',
      reportOnFailure: true,
      reporter: ['text', 'json', 'json-summary', 'html'],
      reportsDirectory: './coverage/models',
      // @ratchet-begin (auto-updated by `npm run coverage:ratchet` — do not edit manually)
      thresholds: { lines: 88, branches: 69, functions: 85, statements: 86 }
      // @ratchet-end
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@test': path.resolve(__dirname, './src/test')
    }
  }
});