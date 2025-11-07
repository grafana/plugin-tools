import { resolve } from 'node:path';
import { defineProject, mergeConfig } from 'vitest/config';
import configShared from '../../vitest.config.base.js';

export default mergeConfig(
  configShared,
  defineProject({
    test: {
      root: resolve(__dirname),
      setupFiles: ['./vitest.setup.ts'],
    },
    plugins: [
      // This plugin is used to convince Vitest the mocked virtual migrations exist.
      // https://vitest.dev/guide/mocking/modules.html#mocking-non-existing-module
      {
        name: 'virtual-migrations',
        resolveId(id) {
          if (id === 'virtual-test-migration.js' || id === 'virtual-test-migration2.js') {
            return id;
          }
        },
      },
    ],
  })
);
