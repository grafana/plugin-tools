import { describe, expect, it } from 'vitest';
import { parse } from 'jsonc-parser';
import { parse as parseYaml } from 'yaml';
import migrate from './016-config-workspace-package.js';
import { Context } from '../../context.js';

const CONFIG_PACKAGE = '@grafana/create-plugin-configs';

// Wrapper files as scaffolded before .config became a workspace package.
const LEGACY_WRAPPERS: Record<string, string> = {
  'tsconfig.json': `{
  "extends": "./.config/tsconfig.json"
}
`,
  'jest.config.js': `// force timezone to UTC to allow tests to work regardless of local timezone
process.env.TZ = 'UTC';

module.exports = {
  // Jest configuration provided by Grafana scaffolding
  ...require('./.config/jest.config'),
};
`,
  'jest-setup.js': `// Jest setup provided by Grafana scaffolding
import './.config/jest-setup';
`,
  'eslint.config.mjs': `import { defineConfig } from 'eslint/config';
import baseConfig from './.config/eslint.config.mjs';

export default defineConfig([...baseConfig]);
`,
  '.prettierrc.js': `module.exports = {
  // Prettier configuration provided by Grafana scaffolding
  ...require('./.config/.prettierrc.js'),
};
`,
  'playwright.config.ts': `import type { PluginOptions } from '@grafana/plugin-e2e';
import { defineConfig } from '@playwright/test';
import baseConfig from './.config/playwright.config';

export default defineConfig<PluginOptions>(baseConfig, {});
`,
};

function legacyPackageJson(overrides: Record<string, unknown> = {}) {
  return JSON.stringify(
    {
      name: 'myorg-test-panel',
      version: '1.0.0',
      scripts: {
        build: 'webpack -c ./.config/webpack/webpack.config.ts --env production',
        dev: 'webpack -w -c ./.config/webpack/webpack.config.ts --env development',
        test: 'jest --watch --onlyChanged',
      },
      devDependencies: { '@grafana/eslint-config': '^10.0.0' },
      ...overrides,
    },
    null,
    2
  );
}

function createLegacyPlugin(
  packageJsonOverrides: Record<string, unknown> = {},
  extraFiles: Record<string, string> = {}
) {
  const context = new Context('/virtual');
  context.addFile('.config/.cprc.json', '{ "version": "7.11.0" }');
  context.addFile('.config/webpack/webpack.config.ts', 'export default {};');
  context.addFile('package.json', legacyPackageJson(packageJsonOverrides));
  for (const [file, content] of Object.entries({ ...LEGACY_WRAPPERS, ...extraFiles })) {
    context.addFile(file, content);
  }

  return context;
}

function readPackageJson(context: Context) {
  return JSON.parse(context.getFile('package.json') || '{}');
}

describe('016-config-workspace-package', () => {
  describe('npm', () => {
    it('adds the config package and declares it as a workspace', () => {
      const context = migrate(createLegacyPlugin({ packageManager: 'npm@10.9.0' }));
      const packageJson = readPackageJson(context);
      const configManifest = JSON.parse(context.getFile('.config/package.json') || '{}');

      expect(configManifest.name).toBe(CONFIG_PACKAGE);
      expect(configManifest.exports['./webpack']).toBe('./webpack/webpack.config.ts');
      expect(packageJson.private).toBe(true);
      expect(packageJson.workspaces).toEqual(['.config']);
      expect(packageJson.devDependencies[CONFIG_PACKAGE]).toBeUndefined();
      expect(context.doesFileExist('pnpm-workspace.yaml')).toBe(false);
    });

    it('defaults to npm when no package manager can be detected', () => {
      const context = migrate(createLegacyPlugin());

      expect(readPackageJson(context).workspaces).toEqual(['.config']);
    });
  });

  describe('pnpm', () => {
    it('declares the workspace in pnpm-workspace.yaml and depends on the package', () => {
      const context = migrate(createLegacyPlugin({ packageManager: 'pnpm@9.15.0' }));
      const packageJson = readPackageJson(context);

      expect(packageJson.workspaces).toBeUndefined();
      expect(packageJson.devDependencies[CONFIG_PACKAGE]).toBe('workspace:*');
      expect(parseYaml(context.getFile('pnpm-workspace.yaml') || '')).toEqual({ packages: ['.config'] });
    });

    it('keeps existing pnpm settings when pnpm-workspace.yaml has no packages', () => {
      const context = migrate(
        createLegacyPlugin({}, { 'pnpm-lock.yaml': '', 'pnpm-workspace.yaml': 'onlyBuiltDependencies:\n  - esbuild\n' })
      );

      expect(parseYaml(context.getFile('pnpm-workspace.yaml') || '')).toEqual({
        onlyBuiltDependencies: ['esbuild'],
        packages: ['.config'],
      });
    });
  });

  describe('yarn', () => {
    it('uses the workspace protocol for yarn berry', () => {
      const context = migrate(createLegacyPlugin({ packageManager: 'yarn@4.10.3' }));
      const packageJson = readPackageJson(context);

      expect(packageJson.workspaces).toEqual(['.config']);
      expect(packageJson.devDependencies[CONFIG_PACKAGE]).toBe('workspace:*');
    });

    it('relies on automatic workspace linking for yarn 1', () => {
      const context = migrate(createLegacyPlugin({}, { 'yarn.lock': '' }));
      const packageJson = readPackageJson(context);

      expect(packageJson.workspaces).toEqual(['.config']);
      expect(packageJson.devDependencies[CONFIG_PACKAGE]).toBeUndefined();
    });
  });

  describe('wrapper files', () => {
    it('imports the scaffolded configs by package name and keeps the rest of each file', () => {
      const context = migrate(createLegacyPlugin());

      expect(parse(context.getFile('tsconfig.json') || '').extends).toBe(`${CONFIG_PACKAGE}/tsconfig.json`);
      expect(context.getFile('jest.config.js')).toContain(`...require('${CONFIG_PACKAGE}/jest'),`);
      expect(context.getFile('jest.config.js')).toContain("process.env.TZ = 'UTC';");
      expect(context.getFile('jest-setup.js')).toContain(`import '${CONFIG_PACKAGE}/jest-setup';`);
      expect(context.getFile('eslint.config.mjs')).toContain(`import baseConfig from '${CONFIG_PACKAGE}/eslint';`);
      // Prettier runs before install when scaffolding, so its config keeps the relative import.
      expect(context.getFile('.prettierrc.js')).toBe(LEGACY_WRAPPERS['.prettierrc.js']);
      expect(context.getFile('playwright.config.ts')).toContain(
        `import baseConfig from '${CONFIG_PACKAGE}/playwright';`
      );
    });

    it('points the build and dev scripts at a new plugin-root bundler wrapper', () => {
      const context = migrate(createLegacyPlugin());
      const { scripts } = readPackageJson(context);

      expect(context.getFile('webpack.config.ts')).toContain(`export { default } from '${CONFIG_PACKAGE}/webpack';`);
      expect(scripts.build).toBe('webpack -c ./webpack.config.ts --env production');
      expect(scripts.dev).toBe('webpack -w -c ./webpack.config.ts --env development');
      expect(scripts.test).toBe('jest --watch --onlyChanged');
    });

    it('rewrites the import in an existing custom bundler config without replacing it', () => {
      const customWebpackConfig = `import type { Configuration } from 'webpack';
import { merge } from 'webpack-merge';
import grafanaConfig, { type Env } from './.config/webpack/webpack.config';

const config = async (env: Env): Promise<Configuration> => merge(await grafanaConfig(env), {});

export default config;
`;
      const context = migrate(
        createLegacyPlugin(
          {
            scripts: {
              build: 'webpack -c ./webpack.config.ts --env production',
              dev: 'webpack -w -c ./webpack.config.ts --env development',
            },
          },
          { 'webpack.config.ts': customWebpackConfig }
        )
      );

      expect(context.getFile('webpack.config.ts')).toBe(
        customWebpackConfig.replace("'./.config/webpack/webpack.config'", `'${CONFIG_PACKAGE}/webpack'`)
      );
      expect(readPackageJson(context).scripts.build).toBe('webpack -c ./webpack.config.ts --env production');
    });

    it('scaffolds an rspack wrapper for plugins on rspack', () => {
      const context = createLegacyPlugin({
        scripts: { build: 'rspack -c ./.config/rspack/rspack.config.ts --env production' },
      });
      context.deleteFile('.config/webpack/webpack.config.ts');
      context.addFile('.config/rspack/rspack.config.ts', 'export default {};');

      const result = migrate(context);

      expect(result.getFile('rspack.config.ts')).toContain(`export { default } from '${CONFIG_PACKAGE}/rspack';`);
      expect(result.doesFileExist('webpack.config.ts')).toBe(false);
      expect(readPackageJson(result).scripts.build).toBe('rspack -c ./rspack.config.ts --env production');
      expect(JSON.parse(result.getFile('.config/package.json') || '{}').exports['./rspack']).toBe(
        './rspack/rspack.config.ts'
      );
    });

    it('leaves imports of other .config files untouched', () => {
      const jestConfig = `const { grafanaESModules } = require('./.config/jest/utils');

module.exports = { ...require('./.config/jest.config') };
`;
      const context = createLegacyPlugin();
      context.updateFile('jest.config.js', jestConfig);

      const result = migrate(context);

      expect(result.getFile('jest.config.js')).toContain("require('./.config/jest/utils')");
      expect(result.getFile('jest.config.js')).toContain(`require('${CONFIG_PACKAGE}/jest')`);
    });
  });

  describe('guards', () => {
    it('skips plugins that already declare other workspaces and explains why', () => {
      const context = createLegacyPlugin({ workspaces: ['packages/*'] });
      const before = context.getFile('package.json');

      const result = migrate(context);

      expect(result.getFile('package.json')).toBe(before);
      expect(result.doesFileExist('.config/package.json')).toBe(false);
      expect(result.getFile('jest.config.js')).toBe(LEGACY_WRAPPERS['jest.config.js']);
      expect(result.getMessage()?.level).toBe('warning');
    });

    it('skips pnpm plugins whose pnpm-workspace.yaml already lists packages', () => {
      const context = createLegacyPlugin(
        { packageManager: 'pnpm@9.15.0' },
        { 'pnpm-workspace.yaml': 'packages:\n  - packages/*\n' }
      );

      const result = migrate(context);

      expect(result.doesFileExist('.config/package.json')).toBe(false);
      expect(result.getMessage()?.level).toBe('warning');
    });

    it('does nothing when .config is already a workspace package', () => {
      const context = createLegacyPlugin({}, { '.config/package.json': `{ "name": "${CONFIG_PACKAGE}" }` });
      const before = context.listChanges();
      const snapshot = JSON.stringify(before);

      const result = migrate(context);

      expect(JSON.stringify(result.listChanges())).toBe(snapshot);
    });

    it('does nothing outside a create-plugin project', () => {
      const context = new Context('/virtual');
      context.addFile('package.json', legacyPackageJson());

      const result = migrate(context);

      expect(Object.keys(result.listChanges())).toEqual(['package.json']);
      expect(result.getFile('package.json')).toBe(legacyPackageJson());
    });

    it('should be idempotent', async () => {
      await expect(migrate).toBeIdempotent(createLegacyPlugin({ packageManager: 'pnpm@9.15.0' }));
    });
  });
});
