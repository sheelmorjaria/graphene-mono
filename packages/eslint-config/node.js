const baseConfig = require('./index.js');
const globals = require('globals');

module.exports = {
  ...baseConfig,
  files: ['**/*.{js,mjs}'],
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    globals: {
      ...globals.node,
      ...globals.es2020
    }
  },
  rules: {
    ...baseConfig.rules,
    // Node.js specific rules
    'no-console': 'off', // Allow console in Node.js
    'no-process-exit': 'error',
    'no-process-env': 'off',
    'global-require': 'error',
    'handle-callback-err': 'error',
    'no-new-require': 'error',
    'no-path-concat': 'error'
  }
};