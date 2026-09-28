import { resolve } from 'node:path';
import { defineProject, mergeConfig } from 'vitest/config';
import configShared from '../../vitest.config.base.js';

export default mergeConfig(
  configShared,
  defineProject({
    test: {
      root: resolve(__dirname),
    },
  })
);
