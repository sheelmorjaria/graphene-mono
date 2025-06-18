export default {
  testEnvironment: 'node',
  transform: {},
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.test.{js,jsx}',
    '!src/test/**/*',
  ],
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.unit.js'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.unit.{js,jsx}',
    '<rootDir>/src/**/*.unit.test.{js,jsx}',
  ],
  testTimeout: 10000, // Shorter timeout for unit tests
  maxWorkers: '50%', // Use half the available cores
  bail: false,
  forceExit: true,
  verbose: false,
  silent: false
};