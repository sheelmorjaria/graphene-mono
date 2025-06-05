export default {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.test.{js,jsx}',
    '!src/test/**/*',
  ],
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.js'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx}',
  ],
  testTimeout: 30000,
  maxWorkers: 1, // Run tests sequentially to avoid MongoDB conflicts
};