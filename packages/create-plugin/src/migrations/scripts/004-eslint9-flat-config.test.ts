import migrate from './004-eslint9-flat-config.js';
import { Context } from '../context.js';

describe('004-eslint9-flat-config', () => {
  describe('migration', () => {
    it('should migrate default create-plugin scaffolded configs', async () => {
      const context = new Context('/virtual');
      context.addFile('.eslintrc', JSON.stringify({ extends: ['./.config/.eslintrc'] }));
      context.addFile(
        '.config/.eslintrc',
        JSON.stringify({
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
        })
      );

      const result = await migrate(context);
      expect(result.getFile('eslint.config.mjs')).toMatchInlineSnapshot(`
        "import { defineConfig } from "eslint/config";
        import baseConfig from "./.config/eslint.config.mjs";
        export default defineConfig([...baseConfig]);"
      `);
      expect(result.getFile('.config/eslint.config.mjs')).toMatchInlineSnapshot(`
        "import { defineConfig } from "eslint/config";
        import grafanaConfig from "@grafana/eslint-config/flat.js";

        export default defineConfig([...grafanaConfig, {
          rules: {
            "react/prop-types": "off",
          },
        }, {
          files: ["src/**/*.{ts,tsx}"],

          languageOptions: {
            parserOptions: {
              "project": "./tsconfig.json",
            },
          },

          rules: {
            "@typescript-eslint/no-deprecated": "warn",
          },
        }, {
          files: ["./tests/**/*"],

          rules: {
            "react-hooks/rules-of-hooks": "off",
          },
        }]);"
      `);
      expect(result.listChanges()).not.toHaveProperty('.eslintrc');
      expect(result.listChanges()).not.toHaveProperty('.config/.eslintrc');
    });

    it('should migrate legacy eslint config with ignore patterns', async () => {
      const context = new Context('/virtual');
      context.addFile('.eslintrc', JSON.stringify({ rules: { 'no-console': 'error' } }));
      context.addFile(
        'package.json',
        JSON.stringify({ scripts: { lint: 'eslint --cache --ignore-path ./.gitignore --ext .js,.jsx,.ts,.tsx .' } })
      );
      context.addFile('.eslintignore', '*.test.ts');
      context.addFile('.gitignore', ['.github', '.vscode', 'playwright-report', '**/dist'].join('\n'));

      const result = await migrate(context);
      expect(result.getFile('eslint.config.mjs')).toMatchInlineSnapshot(`
        "import { defineConfig } from "eslint/config";

        export default defineConfig([{
          ignores: ["*.test.ts", ".github", ".vscode", "playwright-report", "**/dist"],
        }, {
          rules: {
            "no-console": "error",
          },
        }]);"
      `);
    });

    it('should migrate eslint configs with additional plugins, rules, and overrides', async () => {
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
            overrides: [
              {
                files: ['src/**/*.{ts,tsx}'],
              },
            ],
          },
          null,
          2
        )
      );

      const result = await migrate(context);
      expect(result.getFile('eslint.config.mjs')).toMatchInlineSnapshot(`
        "import { defineConfig } from "eslint/config";
        import baseConfig from "./.config/eslint.config.mjs";
        import simpleImportSort from "eslint-plugin-simple-import-sort";

        export default defineConfig([...baseConfig, {
          plugins: {
            "simple-import-sort": simpleImportSort,
          },

          rules: {
            "simple-import-sort/imports": "error",
          },
        }, {
          files: ["src/**/*.{ts,tsx}"],
        }]);"
      `);
      expect(result.listChanges()).not.toHaveProperty('.eslintrc');
    });

    it('should update package.json scripts to remove legacy eslint args', async () => {
      const context = new Context('/virtual');
      context.addFile(
        'package.json',
        JSON.stringify({
          scripts: { lint: 'eslint --cache --ignore-path ./.gitignore --ext .js,.jsx,.ts,.tsx .', build: 'webpack' },
        })
      );
      context.addFile(
        '.eslintrc',
        JSON.stringify(
          {
            files: ['src/**/*.{ts,tsx}'],
          },
          null,
          2
        )
      );

      const result = await migrate(context);
      const packageJson = JSON.parse(result.getFile('package.json') || '{}');

      expect(packageJson.scripts.lint).toBe('eslint . --cache');
      expect(packageJson.scripts.build).toBe('webpack');
    });

    it('should not make additional changes when run multiple times', async () => {
      const context = new Context('/virtual');
      context.addFile('.eslintrc', JSON.stringify({ extends: ['./.config/.eslintrc'] }));
      context.addFile(
        '.config/.eslintrc',
        JSON.stringify({ extends: ['@grafana/eslint-config'], root: true, rules: { 'react/prop-types': 'off' } })
      );

      await expect(migrate).toBeIdempotent(context);
    });
  });
});
