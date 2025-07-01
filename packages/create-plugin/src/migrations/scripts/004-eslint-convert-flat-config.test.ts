import { describe, expect, it } from 'vitest';
import migrate, { getIgnorePaths } from './004-eslint-convert-flat-config.js';
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
        },
        null,
        2
      )
    );

    const result = await migrate(context);
    expect(result.listChanges()).not.toHaveProperty('.eslintrc');

    const expected = `import defaultConfig from './.config/eslint.config.mjs';

/**
 * @type {Array<import('eslint').Linter.Config>}
 */
export default defaultConfig;
`;

    expect(result.getFile('eslint.config.mjs')).toEqual(expected);
  });
});

describe('getIgnorePaths', () => {
  it('should get the ignore paths', () => {
    const context = new Context('/virtual');
    context.addFile(
      'package.json',
      JSON.stringify({
        scripts: {
          lint: 'eslint --cache --ignore-path ./.gitignore --ext .js,.jsx,.ts,.tsx .',
        },
      })
    );

    context.addFile('.gitignore', 'node_modules');
    context.addFile('.eslintignore', 'dist/**');

    const result = getIgnorePaths(context);
    expect(result).toEqual(['dist/**', 'node_modules']);
  });
});
