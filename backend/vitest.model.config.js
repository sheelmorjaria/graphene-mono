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
    testTimeout: 30000, // Longer timeout for database operations
    pool: 'forks', // Use separate processes
    poolOptions: {
      forks: {
        singleFork: true // Run tests sequentially to avoid DB conflicts
      }
    },
    reporter: ['verbose'],
    coverage: {
      provider: 'c8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage/models'
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@test': path.resolve(__dirname, './src/test')
    }
  }
});