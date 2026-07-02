import { defineConfig } from 'vitest/config'
import { resolve } from 'path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    testTimeout: 10000,
    
    // Better isolation and performance
    pool: 'forks',
    singleFork: true,
    
    // Test file patterns
    include: [
      'src/**/*.{test,spec}.{js,jsx,ts,tsx}'
    ],
    
    // Exclude E2E tests and other non-unit test files
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build,eslint,prettier}.config.*',
      '**/e2e/**',
      '**/*.e2e.*',
      '**/playwright/**'
    ],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      // Generate the coverage report even when tests fail (default is false).
      // Without this, any failing test suppresses coverage-summary.json.
      reportOnFailure: true,
      reporter: ['text', 'json', 'json-summary', 'html'],
      include: ['src/**/*.{js,jsx}'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.test.*',
        '**/*.spec.*',
        '**/*.config.*',
        '**/e2e/**'
      ],
      // @ratchet-begin (auto-updated by `npm run coverage:ratchet` — do not edit manually)
      thresholds: { lines: 45, branches: 41, functions: 43, statements: 45 }
      // @ratchet-end
    },
    
    // Enhanced dependency handling
    server: {
      deps: {
        inline: [
          '@testing-library/react',
          '@testing-library/user-event',
          '@testing-library/jest-dom'
        ]
      }
    },
    
    // Mock reset options
    clearMocks: true,
    restoreMocks: true,
    mockReset: true,
    
    // Reporter configuration
    reporter: globalThis.process?.env?.CI ? ['junit', 'json'] : ['verbose']
  },
  
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@test': resolve(__dirname, './src/test')
    }
  }
})