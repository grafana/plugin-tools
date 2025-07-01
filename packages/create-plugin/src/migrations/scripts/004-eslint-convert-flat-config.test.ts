import { describe, expect, it } from 'vitest';
import migrate, { getIgnorePaths, getPluginImport, extractImports } from './004-eslint-convert-flat-config.js';
import { Context } from '../context.js';

describe('004-eslint-convert-flat-config', () => {
  describe('migrate', () => {
    it('should convert legacy eslint configs to flat configs', async () => {
      const context = new Context('/virtual');

      context.addFile('.eslintrc', JSON.stringify({ extends: './.config/.eslintrc' }, null, 2));
      context.addFile(
        '.config/.eslintrc',
        JSON.stringify(
          {
            extends: ['@grafana/eslint-config'],
            root: true,
            rules: {
              'react/prop-types': 'off',
            },
            overrides: [
              {
                files: ['src/**/*.{ts,tsx}'],
                rules: {
                  '@typescript-eslint/no-deprecated': 'warn',
                },
                parserOptions: {
                  project: './tsconfig.json',
                },
              },
              {
                files: ['./tests/**/*'],
                rules: {
                  'react-hooks/rules-of-hooks': 'off',
                },
              },
            ],
          },
          null,
          2
        )
      );
      context.addFile('.eslintignore', 'dist/**');

      const result = await migrate(context);
      expect(result.listChanges()).not.toHaveProperty('.eslintrc');

      const expected = `import defaultConfig from './.config/eslint.config.mjs';

/**
 * @type {Array<import('eslint').Linter.Config>}
 */
const config = [
...defaultConfig,
{ ignores: [ 'dist/**' ] }
];

export default config;
`;
      expect(result.getFile('eslint.config.mjs')).toEqual(expected);

      const expectedExtends = `import grafanaConfig from '@grafana/eslint-config/flat.js';

/**
 * @type {Array<import('eslint').Linter.Config>}
 */
const config = [
...grafanaConfig,
{ rules: { 'react/prop-types': 'off' } },
{
  files: [ 'src/**/*.{ts,tsx}' ],
  rules: { '@typescript-eslint/no-deprecated': 'warn' },
  languageOptions: { parserOptions: { project: './tsconfig.json' } }
},
{
  files: [ './tests/**/*' ],
  rules: { 'react-hooks/rules-of-hooks': 'off' }
}
];

export default config;
`;
      expect(result.getFile('.config/eslint.config.mjs')).toMatch(expectedExtends);
    });

    it('should convert a legacy eslint config with plugins', async () => {
      const context = new Context('/virtual');

      context.addFile(
        '.eslintrc',
        JSON.stringify(
          {
            extends: './.config/.eslintrc',
            plugins: ['simple-import-sort'],
            rules: {
              'simple-import-sort/imports': 'error',
            },
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
import simpleImportSort from 'eslint-plugin-simple-import-sort';

/**
 * @type {Array<import('eslint').Linter.Config>}
 */
const config = [
...defaultConfig,
{ rules: { 'simple-import-sort/imports': 'error' } }
];

export default config;
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

    it('should deduplicate ignore paths from multiple sources', () => {
      const context = new Context('/virtual');
      context.addFile('.eslintignore', 'node_modules\ndist/**');
      context.addFile(
        'package.json',
        JSON.stringify({
          scripts: {
            lint: 'eslint --ignore-path ./.gitignore .',
          },
        })
      );
      context.addFile('.gitignore', 'node_modules\nbuild/');

      const result = getIgnorePaths(context);
      expect(result).toEqual(['node_modules', 'dist/**', 'build/']);
    });

    it('should handle empty ignore files', () => {
      const context = new Context('/virtual');
      context.addFile('.eslintignore', '');
      context.addFile(
        'package.json',
        JSON.stringify({
          scripts: { lint: 'eslint .' },
        })
      );

      const result = getIgnorePaths(context);
      expect(result).toEqual([]);
    });

    it('should handle missing package.json gracefully', () => {
      const context = new Context('/virtual');
      context.addFile('.eslintignore', 'dist/**');

      const result = getIgnorePaths(context);
      expect(result).toEqual(['dist/**']);
    });

    it('should handle malformed package.json gracefully', () => {
      const context = new Context('/virtual');
      context.addFile('.eslintignore', 'dist/**');
      context.addFile('package.json', '{ invalid json }');

      const result = getIgnorePaths(context);
      expect(result).toEqual(['dist/**']);
    });
  });

  describe('getPluginImport', () => {
    it('should handle plugins with eslint-plugin- prefix', () => {
      expect(getPluginImport('eslint-plugin-react')).toBe('eslint-plugin-react');
      expect(getPluginImport('eslint-plugin-import')).toBe('eslint-plugin-import');
    });

    it('should add eslint-plugin- prefix to bare plugin names', () => {
      expect(getPluginImport('react')).toBe('eslint-plugin-react');
      expect(getPluginImport('import')).toBe('eslint-plugin-import');
      expect(getPluginImport('typescript-eslint')).toBe('eslint-plugin-typescript-eslint');
    });

    it('should handle scoped packages with eslint-plugin suffix', () => {
      expect(getPluginImport('@typescript-eslint/eslint-plugin')).toBe('@typescript-eslint/eslint-plugin');
    });

    it('should handle scoped packages without eslint-plugin suffix', () => {
      expect(getPluginImport('@typescript-eslint')).toBe('@typescript-eslint/eslint-plugin');
    });

    it('should handle scoped packages with custom names', () => {
      expect(getPluginImport('@myorg/my-plugin')).toBe('@myorg/eslint-plugin-my-plugin');
    });
  });

  describe('extractImports', () => {
    it('should extract known extends', () => {
      const config = {
        extends: './.config/.eslintrc',
      };

      const result = extractImports(config);
      expect(result).toEqual([
        {
          name: 'defaultConfig',
          path: './.config/eslint.config.mjs',
        },
      ]);
    });

    it('should extract plugins and convert to camelCase', () => {
      const config = {
        plugins: ['simple-import-sort', 'react-hooks'],
      };

      const result = extractImports(config);
      expect(result).toEqual([
        {
          name: 'simpleImportSort',
          path: 'eslint-plugin-simple-import-sort',
        },
        {
          name: 'reactHooks',
          path: 'eslint-plugin-react-hooks',
        },
      ]);
    });

    it('should handle both extends and plugins', () => {
      const config = {
        extends: '@grafana/eslint-config',
        plugins: ['react'],
      };

      const result = extractImports(config);
      expect(result).toEqual([
        {
          name: 'grafanaConfig',
          path: '@grafana/eslint-config/flat.js',
        },
        {
          name: 'react',
          path: 'eslint-plugin-react',
        },
      ]);
    });

    it('should handle scoped plugins', () => {
      const config = {
        plugins: ['@typescript-eslint/eslint-plugin'],
      };

      const result = extractImports(config);
      expect(result).toEqual([
        {
          name: 'typescriptEslintEslintPlugin',
          path: '@typescript-eslint/eslint-plugin',
        },
      ]);
    });

    it('should return empty array for config without extends or plugins', () => {
      const config = {
        rules: {
          'no-console': 'warn',
        },
      };

      const result = extractImports(config);
      expect(result).toEqual([]);
    });

    it('should handle unknown extends gracefully', () => {
      const config = {
        extends: 'unknown-config',
      };

      const result = extractImports(config);
      expect(result).toEqual([]);
    });
  });
});
