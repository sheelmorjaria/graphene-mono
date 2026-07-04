import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      reportOnFailure: true,
      reporter: ['text', 'json', 'json-summary', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['**/*.test.ts', '**/*.spec.ts', 'node_modules/**', 'dist/**'],
      // @ratchet-begin (auto-updated by `npm run coverage:ratchet` — do not edit manually)
      thresholds: { lines: 85, branches: 65, functions: 82, statements: 85 }
      // @ratchet-end
    }
  }
});
