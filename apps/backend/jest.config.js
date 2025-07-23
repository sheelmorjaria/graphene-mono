export default {
  testEnvironment: 'node',
  transform: {},
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
  bail: false, // Don't stop on first failure
  forceExit: true, // Force exit after tests complete
  detectOpenHandles: true, // Detect handles that may prevent Jest from exiting
  verbose: false, // Reduce noise unless debugging
  silent: false // Allow console output for debugging
};