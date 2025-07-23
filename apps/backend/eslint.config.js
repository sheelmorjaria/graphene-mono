export default [
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly'
      }
    },
    rules: {
      // Code style
      'indent': ['error', 2],
      'quotes': ['error', 'single'],
      'semi': ['error', 'always'],
      'comma-dangle': ['error', 'never'],
      
      // Best practices
      'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
      'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
      'no-debugger': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-throw-literal': 'error',
      
      // ES6+
      'prefer-const': 'error',
      'prefer-arrow-callback': 'off',
      'arrow-spacing': 'error',
      'no-var': 'error',
      
      // Async/await - more lenient
      'no-return-await': 'warn',
      'require-await': 'off',
      
      // Security
      'no-new-require': 'error',
      'no-path-concat': 'error'
    }
  },
  {
    files: ['**/*.test.js', '**/__tests__/**/*.js', '**/test/**/*.js', '**/*.playwright.test.js'],
    rules: {
      'no-console': 'off',
      'no-unused-vars': 'off',
      'require-await': 'off',
      'prefer-const': 'warn',
      'no-return-await': 'warn'
    }
  }
];