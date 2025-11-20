import { describe, expect, it } from 'vitest';
import migrate from './003-update-eslint-deprecation-rule.js';
import { Context } from '../../context.js';

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

    expect(eslintConfig).toEqual({
      overrides: [
        {
          files: ['src/**/*.{ts,tsx}'],
          rules: {
            '@typescript-eslint/no-deprecated': 'warn',
          },
        },
      ],
    });

    // Check package.json changes
    const packageJson = JSON.parse(result.getFile('package.json') || '{}');
    expect(packageJson).toEqual({
      devDependencies: {
        '@typescript-eslint/eslint-plugin': '^8.3.0',
        '@typescript-eslint/parser': '^8.3.0',
      },
    });
  });

  it('should remove eslint-plugin-deprecation from package.json if no overrides use it', () => {
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
    context.addFile(
      'package.json',
      JSON.stringify({
        devDependencies: {
          'eslint-plugin-deprecation': '^2.0.0',
          '@typescript-eslint/eslint-plugin': '^8.3.0',
          '@typescript-eslint/parser': '^8.3.0',
        },
      })
    );
    const result = migrate(context);
    const packageJson = JSON.parse(result.getFile('package.json') || '{}');
    expect(packageJson).toEqual({
      devDependencies: {
        '@typescript-eslint/eslint-plugin': '^8.3.0',
        '@typescript-eslint/parser': '^8.3.0',
      },
    });
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
    context.addFile(
      'package.json',
      JSON.stringify({
        dependencies: {
          react: '18.3.0',
        },
        devDependencies: {
          'eslint-plugin-deprecation': '^2.0.0',
          '@typescript-eslint/eslint-plugin': '^6.18.0',
          '@typescript-eslint/parser': '^6.18.0',
        },
      })
    );
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
