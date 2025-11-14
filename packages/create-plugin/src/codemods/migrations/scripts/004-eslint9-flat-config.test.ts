import migrate from './004-eslint9-flat-config.js';
import { Context } from '../../context.js';

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
              project: "./tsconfig.json",
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
          ignores: [
            "**/*.test.ts",
            "**/.github",
            "**/.vscode",
            "**/playwright-report",
            "**/dist",
          ],
        }, {
          rules: {
            "no-console": "error",
          },
        }]);"
      `);
    });

    it('should attempt to migrate eslint configs with extends, plugins, rules, and overrides', async () => {
      const context = new Context('/virtual');

      context.addFile(
        '.eslintrc',
        JSON.stringify(
          {
            extends: [
              'eslint:recommended',
              './.config/.eslintrc',
              '@custom/eslint-config',
              'plugin:react/recommended',
              'prettier',
            ],
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
        import js from "@eslint/js";
        import baseConfig1 from "./.config/eslint.config.mjs";
        import customEslintConfig from "@custom/eslint-config";
        import react from "eslint-plugin-react";
        import prettier from "eslint-config-prettier/flat";
        import simpleImportSort from "eslint-plugin-simple-import-sort";

        export default defineConfig([
          js.configs.recommended,
          ...baseConfig1,
          customEslintConfig,
          react.configs.flat.recommended,
          prettier,
          {
            plugins: {
              "simple-import-sort": simpleImportSort,
            },

            rules: {
              "simple-import-sort/imports": "error",
            },
          },
          {
            files: ["src/**/*.{ts,tsx}"],
          },
        ]);"
      `);
      expect(result.listChanges()).not.toHaveProperty('.eslintrc');
    });

    it('should update package.json scripts and devDependencies', async () => {
      const context = new Context('/virtual');
      context.addFile(
        'package.json',
        JSON.stringify({
          scripts: {
            lint: 'eslint --cache --ignore-path ./.gitignore --ext .js,.jsx,.ts,.tsx ./src',
            'lint:fix': 'yarn lint --fix',
            build: 'webpack -c ./webpack.config.ts',
          },
          devDependencies: {
            '@grafana/eslint-config': '^8.0.0',
            eslint: '^8.0.0',
            'eslint-config-prettier': '^8.8.0',
            'eslint-plugin-jsdoc': '^46.8.0',
            'eslint-plugin-react': '^7.33.0',
            'eslint-plugin-react-hooks': '^4.6.0',
            'eslint-webpack-plugin': '^4.0.1',
          },
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
      expect(packageJson).toEqual({
        scripts: {
          lint: 'eslint --cache ./src',
          'lint:fix': 'yarn lint --fix',
          build: 'webpack -c ./webpack.config.ts',
        },
        devDependencies: {
          '@grafana/eslint-config': '^8.1.0',
          eslint: '^9.0.0',
          'eslint-config-prettier': '^8.8.0',
          'eslint-plugin-jsdoc': '^51.2.3',
          'eslint-plugin-react': '^7.37.5',
          'eslint-plugin-react-hooks': '^5.2.0',
          'eslint-webpack-plugin': '^5.0.0',
        },
      });
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
