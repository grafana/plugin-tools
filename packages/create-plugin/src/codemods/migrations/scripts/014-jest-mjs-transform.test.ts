import { describe, expect, it } from 'vitest';
import migrate from './014-jest-mjs-transform.js';
import { Context } from '../../context.js';

const JEST_UTILS_PATH = '.config/jest/utils.js';
const JEST_CONFIG_PATH = '.config/jest.config.js';

const JEST_UTILS = `const nodeModulesToTransform = (moduleNames) => \`node_modules\\/(?!.*(\${moduleNames.join('|')})\\/.*)\`;

// Array of known nested grafana package dependencies that only bundle an ESM version
const grafanaESModules = [
  '.pnpm', // Support using pnpm symlinked packages
  '@grafana/schema',
  '@react-hookz/web',
  '@ver0/deep-equal',
  '@wojtekmaj/date-utils',
  'd3',
  'uuid',
];

module.exports = {
  nodeModulesToTransform,
  grafanaESModules,
};
`;

const JEST_CONFIG = `const path = require('path');
const { grafanaESModules, nodeModulesToTransform } = require('./jest/utils');

module.exports = {
  moduleNameMapper: {
    '\\\\.(css|scss|sass)$': 'identity-obj-proxy',
  },
  testEnvironment: 'jest-environment-jsdom',
  transform: {
    '^.+\\\\.(t|j)sx?$': [
      '@swc/jest',
      {
        sourceMaps: 'inline',
        jsc: {
          parser: {
            syntax: 'typescript',
            tsx: true,
            decorators: false,
            dynamicImport: true,
          },
        },
      },
    ],
  },
  transformIgnorePatterns: [nodeModulesToTransform(grafanaESModules)],
};
`;

function createContext(
  files: Record<string, string> = { [JEST_UTILS_PATH]: JEST_UTILS, [JEST_CONFIG_PATH]: JEST_CONFIG }
) {
  const context = new Context('/virtual');
  for (const [filePath, content] of Object.entries(files)) {
    context.addFile(filePath, content);
  }
  return context;
}

describe('014-jest-mjs-transform', () => {
  it('should add @grafana/plugin-compat to grafanaESModules right after @grafana/schema', () => {
    const updated = migrate(createContext()).getFile(JEST_UTILS_PATH) ?? '';

    expect(updated).toContain("'@grafana/plugin-compat'");
    expect(updated.indexOf("'@grafana/schema'")).toBeLessThan(updated.indexOf("'@grafana/plugin-compat'"));
    expect(updated.indexOf("'@grafana/plugin-compat'")).toBeLessThan(updated.indexOf("'@react-hookz/web'"));
  });

  it('should extend the swc transform pattern to match .mjs files', () => {
    const updated = migrate(createContext()).getFile(JEST_CONFIG_PATH) ?? '';

    expect(updated).toContain("'^.+\\\\.(t|j)sx?$|^.+\\\\.mjs$': [");
    expect(updated).not.toContain("'^.+\\\\.(t|j)sx?$': [");
    // The swc options are carried over untouched.
    expect(updated).toContain("'@swc/jest'");
    expect(updated).toContain('dynamicImport: true');
  });

  it('should be idempotent', async () => {
    await expect(migrate).toBeIdempotent(createContext());
  });

  it('should not add the module twice', () => {
    const utils = JEST_UTILS.replace("'@grafana/schema',", "'@grafana/schema',\n  '@grafana/plugin-compat',");
    const updated = migrate(createContext({ [JEST_UTILS_PATH]: utils, [JEST_CONFIG_PATH]: JEST_CONFIG })).getFile(
      JEST_UTILS_PATH
    );

    expect(updated?.match(/'@grafana\/plugin-compat'/g)).toHaveLength(1);
  });

  it('should leave the Jest config alone when it already handles .mjs files', () => {
    const customConfig = JEST_CONFIG.replace("'^.+\\\\.(t|j)sx?$': [", "'^.+\\\\.(t|j)sx?$|^.+\\\\.mjs$': [");
    const result = migrate(createContext({ [JEST_UTILS_PATH]: JEST_UTILS, [JEST_CONFIG_PATH]: customConfig }));

    expect(result.getFile(JEST_CONFIG_PATH)).toBe(customConfig);
  });

  it('should leave the Jest config alone when the scaffolded transform rule was replaced', () => {
    const customConfig = JEST_CONFIG.replace("'^.+\\\\.(t|j)sx?$': [", "'\\\\.[jt]sx?$': [");
    const result = migrate(createContext({ [JEST_UTILS_PATH]: JEST_UTILS, [JEST_CONFIG_PATH]: customConfig }));

    expect(result.getFile(JEST_CONFIG_PATH)).toBe(customConfig);
  });

  it('should do nothing when neither Jest file exists', () => {
    const result = migrate(createContext({}));

    expect(result.hasChanges()).toBe(false);
  });

  it('should still update the Jest config when the utils file is missing', () => {
    const result = migrate(createContext({ [JEST_CONFIG_PATH]: JEST_CONFIG }));

    expect(result.getFile(JEST_CONFIG_PATH)).toContain("'^.+\\\\.(t|j)sx?$|^.+\\\\.mjs$': [");
    expect(result.doesFileExist(JEST_UTILS_PATH)).toBe(false);
  });
});
