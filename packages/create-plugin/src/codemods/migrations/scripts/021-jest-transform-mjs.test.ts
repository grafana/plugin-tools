import { describe, expect, it } from 'vitest';
import migrate from './021-jest-transform-mjs.js';
import { Context } from '../../context.js';

const JEST_CONFIG_PATH = '.config/jest.config.js';

const oldConfig = `module.exports = {
  transform: {
    '^.+\\\\.(t|j)sx?$': ['@swc/jest', {}],
  },
};
`;

const newConfig = `module.exports = {
  transform: {
    '^.+\\\\.(t|j|mj)sx?$': ['@swc/jest', {}],
  },
};
`;

describe('021-jest-transform-mjs', () => {
  it('should add mjs to the transform pattern', () => {
    const context = new Context('/virtual');
    context.addFile(JEST_CONFIG_PATH, oldConfig);

    const result = migrate(context);

    expect(result.getFile(JEST_CONFIG_PATH)).toBe(newConfig);
  });

  it('should not modify the file if already migrated', () => {
    const context = new Context('/virtual');
    context.addFile(JEST_CONFIG_PATH, newConfig);

    const result = migrate(context);

    expect(result.getFile(JEST_CONFIG_PATH)).toBe(newConfig);
  });

  it('should do nothing if the jest config does not exist', () => {
    const context = new Context('/virtual');

    const result = migrate(context);

    expect(result.hasChanges()).toBe(false);
  });

  it('should not modify the file if the transform pattern was customised', () => {
    const context = new Context('/virtual');
    const customConfig = "module.exports = { transform: { '^.+\\\\.tsx?$': 'ts-jest' } };\n";
    context.addFile(JEST_CONFIG_PATH, customConfig);

    const result = migrate(context);

    expect(result.getFile(JEST_CONFIG_PATH)).toBe(customConfig);
  });

  it('should be idempotent', async () => {
    const context = new Context('/virtual');
    context.addFile(JEST_CONFIG_PATH, oldConfig);

    await expect(migrate).toBeIdempotent(context);
  });
});
