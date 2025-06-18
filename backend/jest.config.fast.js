export default {
  testEnvironment: 'node',
  transform: {},
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.test.{js,jsx}',
    '!src/test/**/*',
    '!src/scripts/**/*',
  ],
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.unit.js'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.unit.{js,jsx}',
    '<rootDir>/src/**/*.unit.test.{js,jsx}',
    '<rootDir>/src/**/__tests__/**/*.(simple|basic|fast).{js,jsx}',
  ],
  testTimeout: 5000, // Short timeout for fast tests
  maxWorkers: '75%', // Use most available cores
  bail: false,
  forceExit: true,
  verbose: false,
  silent: false,
  // Cache configuration for faster subsequent runs
  cacheDirectory: '<rootDir>/.jest-cache',
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  // Fast test reporter
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'coverage',
      outputName: 'junit-fast.xml'
    }]
  ]
};