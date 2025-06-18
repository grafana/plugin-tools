import { describe, expect, it } from 'vitest';
import migrate from './003-update-eslint-deprecation-rule.js';
import { Context } from '../context.js';

describe('003-update-eslint-deprecation-rule', () => {
  it('should not update ESLint config if no deprecation rule is present', () => {
    const context = new Context('/virtual');

    context.addFile(
      '.config/.eslintrc',
      JSON.stringify({
        overrides: [
          {
            files: ['src/**/*.{ts,tsx}'],
          },
        ],
      })
    );

    const initialChanges = context.listChanges();
    migrate(context);
    expect(context.listChanges()).toEqual(initialChanges);
  });

  it('should update ESLint config and package.json', () => {
    const context = new Context('/virtual');
    context.addFile(
      '.config/.eslintrc',
      JSON.stringify({
        overrides: [
          {
            plugins: ['deprecation'],
            files: ['src/**/*.{ts,tsx}'],
            rules: {
              'deprecation/deprecation': 'warn',
            },
          },
        ],
      })
    );
    context.addFile(
      'package.json',
      JSON.stringify({
        devDependencies: {
          'eslint-plugin-deprecation': '^2.0.0',
          '@typescript-eslint/eslint-plugin': '^6.18.0',
          '@typescript-eslint/parser': '^6.18.0',
        },
      })
    );

    const result = migrate(context);

    // Check ESLint config changes
    const eslintConfig = JSON.parse(result.getFile('.config/.eslintrc') || '{}');
    expect(eslintConfig.overrides[0].plugins).not.toContain('deprecation');
    expect(eslintConfig.overrides[0].rules['deprecation/deprecation']).toBeUndefined();
    expect(eslintConfig.overrides[0].rules['@typescript-eslint/no-deprecated']).toBe('warn');

    // Check package.json changes
    const packageJson = JSON.parse(result.getFile('package.json') || '{}');
    expect(packageJson.devDependencies['eslint-plugin-deprecation']).toBeUndefined();
    expect(packageJson.devDependencies['@typescript-eslint/eslint-plugin']).toBe('^8.3.0');
    expect(packageJson.devDependencies['@typescript-eslint/parser']).toBe('^8.3.0');
  });

  it('should preserve comments', async () => {
    const context = new Context('/virtual');
    const eslintConfigRaw = JSON.stringify({
      overrides: [
        {
          plugins: ['deprecation'],
          files: ['src/**/*.{ts,tsx}'],
          rules: {
            'deprecation/deprecation': 'warn',
          },
        },
      ],
    });
    const comments = `/*
 * Some comments to test with
*/`;

    context.addFile('.config/.eslintrc', comments + '\n' + eslintConfigRaw);
    const result = migrate(context);
    const migrated = result.getFile('.config/.eslintrc');

    expect(migrated).toContain(comments);
  });

  it('should handle missing files gracefully', () => {
    const context = new Context('/virtual');
    const result = migrate(context);
    expect(result.hasChanges()).toBe(false);
  });

  it('should be idempotent', async () => {
    const context = new Context('/virtual');
    context.addFile(
      '.config/.eslintrc',
      JSON.stringify({
        overrides: [
          {
            files: ['src/**/*.{ts,tsx}'],
            rules: {
              '@typescript-eslint/no-deprecated': 'warn',
            },
          },
        ],
      })
    );

    context.addFile(
      'package.json',
      JSON.stringify({
        devDependencies: {
          '@typescript-eslint/eslint-plugin': '^8.3.0',
          '@typescript-eslint/parser': '^8.3.0',
        },
      })
    );

    await expect(migrate).toBeIdempotent(context);
  });
});
