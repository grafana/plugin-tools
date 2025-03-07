import { defineConfig } from 'vitest/config';
import tsconfig from './tsconfig.base.json';
import { resolve } from 'node:path';

const alias = Object.fromEntries(
  Object.entries(tsconfig.compilerOptions.paths).map(([key, [value]]) => [
    key.replace('/*', ''),
    resolve(__dirname, value.replace('/*', '')),
  ])
);

export default defineConfig({
  test: {
    globals: true,
    include: ['src/**/*.test.ts'],
    alias,
  },
});
