import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'test/', '**/*.d.ts', '**/*.config.*', '**/mockData/**'],
      thresholds: {
        lines: 80,
        functions: 90,
        branches: 75,
        statements: 80,
      },
    },
  },
});
