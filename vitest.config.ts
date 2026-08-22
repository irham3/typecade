import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
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
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      '@typecade/contracts': path.resolve(__dirname, './packages/contracts/src/index.ts'),
      '@typecade/content': path.resolve(__dirname, './packages/content/src/index.ts'),
      '@typecade/game-rules': path.resolve(__dirname, './packages/game-rules/src/index.ts'),
      '@typecade/typing-engine': path.resolve(__dirname, './packages/typing-engine/src/index.ts'),
    },
  },
});
