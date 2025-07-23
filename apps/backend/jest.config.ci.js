export default {
  testEnvironment: 'node',
  transform: {},
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.test.{js,jsx}',
    '!src/test/**/*',
    '!src/scripts/**/*',
  ],
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.js'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx}',
  ],
  testTimeout: 30000,
  maxWorkers: 1, // Single worker for CI stability
  bail: true, // Stop on first failure in CI
  forceExit: true,
  detectOpenHandles: true,
  verbose: true,
  // CI-specific coverage configuration
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  },
  // CI reporters
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'coverage',
      outputName: 'junit-ci.xml'
    }],
    ['github-actions', { silent: false }]
  ]
};