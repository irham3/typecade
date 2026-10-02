import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { playwright } from '@vitest/browser-playwright';

const aliases = {
	'@': path.resolve(import.meta.dirname, '.'),
	'@typecade/contracts': path.resolve(import.meta.dirname, './packages/contracts/src/index.ts'),
	'@typecade/content': path.resolve(import.meta.dirname, './packages/content/src/index.ts'),
	'@typecade/game-rules': path.resolve(import.meta.dirname, './packages/game-rules/src/index.ts'),
	'@typecade/typing-engine': path.resolve(import.meta.dirname, './packages/typing-engine/src/index.ts'),
	'@typecade/race-rules': path.resolve(import.meta.dirname, './packages/race-rules/src/index.ts'),
};

export default defineConfig({
  plugins: [react()],
  publicDir: path.resolve(import.meta.dirname, 'apps/web/public'),
  test: {
    projects: [
      {
        resolve: { alias: aliases },
        test: {
          name: 'node',
          globals: true,
          environment: 'node',
          include: ['packages/**/*.test.ts', 'apps/web/src/**/*.test.ts'],
          exclude: ['**/*.browser.test.*'],
        },
      },
      {
        root: path.resolve(import.meta.dirname, 'apps/web'),
        resolve: { alias: aliases },
        test: {
          name: 'browser',
          include: ['src/**/*.browser.test.{ts,tsx}'],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
    coverage: {
      provider: 'istanbul',
      reporter: ['text-summary', 'json-summary', 'json'],
      include: ['packages/*/src/**/*.{ts,tsx}', 'apps/web/src/**/*.{ts,tsx}'],
      thresholds: { statements: 100, branches: 100, functions: 100, lines: 100 },
    },
    include: [
      'packages/**/*.test.ts',
      'apps/web/src/**/*.test.ts',
    ],
    exclude: [
      '**/node_modules/**',
      '**/.next/**',
      '**/.open-next/**',
      '**/.worktrees/**',
      '**/e2e/**',
      '**/out/**',
      '**/playwright-report/**',
      '**/test-results/**',
    ],
  },
  resolve: { alias: aliases },
});
