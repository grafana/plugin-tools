import migrate from './004-eslint9-flat-config.js';
import { createDefaultContext } from '../test-utils.js';
import { Context } from '../context.js';

describe('004-eslint9-flat-config', () => {
  describe('migration', () => {
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
    });

    it('should not make additional changes when run multiple times', async () => {
      const context = await createDefaultContext();

      await expect(migrate).toBeIdempotent(context);
    });
  });
});
