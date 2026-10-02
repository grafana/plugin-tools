import { defineConfig } from 'eslint/config';
import baseConfig from '@grafana/create-plugin-configs/eslint';

export default defineConfig([
  ...baseConfig,
  // Add your own ignores and rules after the shared config.
]);
