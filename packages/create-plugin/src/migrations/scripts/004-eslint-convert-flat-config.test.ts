import { describe, expect, it } from 'vitest';
import migrate from './004-eslint-convert-flat-config.js';
import { Context } from '../context.js';

describe('004-eslint-convert-flat-config', () => {
  it('should convert a legacy eslint config to a flat config', async () => {
    const context = new Context('/virtual');

    context.addFile(
      '.eslintrc',
      JSON.stringify(
        {
          extends: './.config/.eslintrc',
        },
        null,
        2
      )
    );

    context.addFile(
      '.config/.eslintrc',
      JSON.stringify(
        {
          extends: ['@grafana/eslint-config'],
          root: true,
        },
        null,
        2
      )
    );

    const result = await migrate(context);
    expect(result.listChanges()).not.toHaveProperty('.eslintrc');

    const expected = `const defaultConfig = require('./.config/eslint.config.js');

/**
 * @type {Array<import('eslint').Linter.Config>}
 */
module.exports = defaultConfig;
`;

    expect(result.getFile('eslint.config.js')).toEqual(expected);
  });
});
