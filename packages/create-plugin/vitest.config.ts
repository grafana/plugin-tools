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
      // Convince Vitest the mocked virtual migrations exist (vitest 4.1+ needs both resolveId and load for dynamic bare-specifier imports).
      {
        name: 'virtual-migrations',
        resolveId(id) {
          if (id === 'virtual-test-migration.js' || id === 'virtual-test-migration2.js') {
            return id;
          }
        },
        load(id) {
          if (id === 'virtual-test-migration.js' || id === 'virtual-test-migration2.js') {
            return 'export default () => {};';
          }
        },
      },
    ],
  })
);
