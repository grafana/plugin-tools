import { Context } from '../../context.js';
import addRspack from './rspack.js';

vi.mock(import('../../../utils/utils.plugin.js'), async (importOriginal) => {
  const originalModule = await importOriginal();
  return {
    ...originalModule,
    getPluginJson: () => ({
      id: 'my-plugin-id',
      name: 'My Plugin',
      type: 'panel',
      info: { author: { name: 'my-author' } },
    }),
  };
});

vi.mock(import('../../../utils/utils.config.js'), async (importOriginal) => {
  const originalModule = await importOriginal();
  return {
    ...originalModule,
    getConfig: () => ({ version: '5.0.0', features: {} }),
  };
});

vi.mock(import('../../utils.js'), async (importOriginal) => {
  const originalModule = await importOriginal();

  // Only render externals.ts and _package.json from the real templates since we assert on their content.
  // All other templates just need a non-empty stub.
  return {
    ...originalModule,
    renderTemplate: (path: string, includeWarning?: boolean, templateDataOverrides?: Record<string, unknown>) => {
      if (path.includes('.config/bundler/externals.ts') || path.endsWith('_package.json')) {
        return originalModule.renderTemplate(path, includeWarning, templateDataOverrides);
      }
      return '// rendered template stub';
    },
  };
});

const RSPACK_TEMPLATE_DATA = { useExperimentalRspack: true, frontendBundler: 'rspack' };
const WEBPACK_TEMPLATE_DATA = { useExperimentalRspack: false, frontendBundler: 'webpack' };

async function getTemplateDevDependencies(templateData: Record<string, unknown>): Promise<Record<string, string>> {
  const { renderTemplate } = await vi.importActual<typeof import('../../utils.js')>('../../utils.js');
  const packageJsonTemplatePath = new URL('../../../../templates/common/_package.json', import.meta.url).pathname;
  const { devDependencies } = JSON.parse(renderTemplate(packageJsonTemplatePath, false, templateData));
  return devDependencies;
}

function createBaseContext(): Context {
  const context = new Context('/virtual');

  context.addFile('.config/webpack/webpack.config.ts', '');
  context.addFile('.config/webpack/BuildModeWebpackPlugin.ts', '');
  context.addFile('.config/bundler/externals.ts', '');
  context.addFile('.config/bundler/constants.ts', '');
  context.addFile('.config/bundler/copyFiles.ts', '');
  context.addFile('.config/bundler/utils.ts', '');

  context.addFile(
    'package.json',
    JSON.stringify(
      {
        scripts: {
          build: 'webpack -c ./.config/webpack/webpack.config.ts --env production',
          dev: 'webpack -w -c ./.config/webpack/webpack.config.ts --env development',
        },
        devDependencies: {
          'copy-webpack-plugin': '^12.0.0',
          'fork-ts-checker-webpack-plugin': '^9.0.0',
          'swc-loader': '^0.2.0',
          webpack: '^5.94.0',
          'webpack-cli': '^5.1.4',
          'webpack-livereload-plugin': '^3.0.2',
          'webpack-subresource-integrity': '^5.1.0',
          'webpack-virtual-modules': '^0.6.2',
        },
      },
      null,
      2
    )
  );
  context.addFile('.config/.cprc.json', JSON.stringify({ version: '5.0.0', features: {} }, null, 2));
  return context;
}

describe('rspack', () => {
  describe('start states', () => {
    it('should make no changes and explain why when there is no create-plugin bundler setup', () => {
      const context = new Context('/virtual');

      const result = addRspack(context);

      expect(result.hasChanges()).toBe(false);
      expect(result.getMessage()).toEqual(
        expect.objectContaining({ level: 'warning', title: expect.stringContaining('bundler configuration') })
      );
    });

    it('should re-render a stale .config/rspack left behind on a webpack plugin', () => {
      const context = createBaseContext();
      context.addFile('.config/rspack/rspack.config.ts', 'stale rspack config');

      const result = addRspack(context);

      expect(result.getFile('.config/rspack/rspack.config.ts')).toBe('// rendered template stub');
      expect(result.doesFileExist('.config/webpack/webpack.config.ts')).toBe(false);
    });

    it('should replace an experimental rspack setup with the current rspack templates', () => {
      const context = new Context('/virtual');
      context.addFile('.config/rspack/rspack.config.ts', 'experimental rspack config');
      context.addFile('.config/rspack/BuildModeRspackPlugin.ts', 'experimental build mode plugin');
      context.addFile('.config/rspack/liveReloadPlugin.ts', 'experimental live reload plugin');
      context.addFile(
        '.config/.cprc.json',
        JSON.stringify({ version: '7.9.0', features: { useExperimentalRspack: true } }, null, 2)
      );

      const result = addRspack(context);

      expect(result.getFile('.config/rspack/rspack.config.ts')).toBe('// rendered template stub');
      expect(result.getFile('.config/rspack/BuildModeRspackPlugin.ts')).toBe('// rendered template stub');
      expect(result.getFile('.config/rspack/liveReloadPlugin.ts')).toBe('// rendered template stub');
    });
  });

  describe('.cprc.json', () => {
    it('should update existing .cprc.json with useExperimentalRspack flag', () => {
      const context = createBaseContext();

      const result = addRspack(context);
      const cprc = JSON.parse(result.getFile('.config/.cprc.json')!);

      expect(cprc.features.useExperimentalRspack).toBe(true);
    });

    it('should preserve existing .cprc.json properties', () => {
      const context = createBaseContext();

      const result = addRspack(context);
      const cprc = JSON.parse(result.getFile('.config/.cprc.json')!);

      expect(cprc.version).toBe('5.0.0');
    });
  });

  describe('rspack config files', () => {
    it('should add rspack config files', () => {
      const context = createBaseContext();

      const result = addRspack(context);

      expect(result.doesFileExist('.config/rspack/rspack.config.ts')).toBe(true);
      expect(result.doesFileExist('.config/rspack/BuildModeRspackPlugin.ts')).toBe(true);
      expect(result.doesFileExist('.config/rspack/liveReloadPlugin.ts')).toBe(true);
    });
  });

  describe('bundler files', () => {
    it('should update externals.ts with rspack imports', () => {
      const context = createBaseContext();

      const result = addRspack(context);
      const externals = result.getFile('.config/bundler/externals.ts')!;

      expect(externals).toContain('RspackOptions');
    });

    it('should re-render all bundler files', () => {
      const context = createBaseContext();

      const result = addRspack(context);

      expect(result.getFile('.config/bundler/externals.ts')).toContain('RspackOptions');
      expect(result.getFile('.config/bundler/constants.ts')).toBe('// rendered template stub');
      expect(result.getFile('.config/bundler/copyFiles.ts')).toBe('// rendered template stub');
      expect(result.getFile('.config/bundler/utils.ts')).toBe('// rendered template stub');
    });

    it('should add bundler files that do not already exist', () => {
      const context = new Context('/virtual');
      context.addFile('.config/webpack/webpack.config.ts', 'webpack config');
      context.addFile(
        'package.json',
        JSON.stringify({ scripts: { build: 'webpack', dev: 'webpack -w' }, devDependencies: {} }, null, 2)
      );

      const result = addRspack(context);

      expect(result.doesFileExist('.config/bundler/externals.ts')).toBe(true);
      expect(result.doesFileExist('.config/bundler/constants.ts')).toBe(true);
      expect(result.doesFileExist('.config/bundler/copyFiles.ts')).toBe(true);
      expect(result.doesFileExist('.config/bundler/utils.ts')).toBe(true);
    });
  });

  describe('package.json', () => {
    it('should add the rspack-only devDependencies from the template at the template versions', async () => {
      const rspackDeps = await getTemplateDevDependencies(RSPACK_TEMPLATE_DATA);
      const webpackDeps = await getTemplateDevDependencies(WEBPACK_TEMPLATE_DATA);
      const rspackOnlyDeps = Object.keys(rspackDeps).filter((name) => !(name in webpackDeps));
      const context = createBaseContext();

      const result = addRspack(context);
      const pkg = JSON.parse(result.getFile('package.json')!);

      expect(rspackOnlyDeps).toEqual(expect.arrayContaining(['@rspack/core', '@rspack/cli', 'eslint-rspack-plugin']));
      for (const name of rspackOnlyDeps) {
        expect(pkg.devDependencies[name], name).toBe(rspackDeps[name]);
      }
    });

    it('should upgrade rspack devDependencies that are below the template version', async () => {
      const rspackDeps = await getTemplateDevDependencies(RSPACK_TEMPLATE_DATA);
      const context = createBaseContext();
      const pkg = JSON.parse(context.getFile('package.json')!);
      pkg.devDependencies['@rspack/core'] = '^1.6.0';
      pkg.devDependencies['@rspack/cli'] = '^1.6.0';
      pkg.devDependencies['ts-checker-rspack-plugin'] = '^1.2.0';
      context.updateFile('package.json', JSON.stringify(pkg, null, 2));

      const result = addRspack(context);
      const updated = JSON.parse(result.getFile('package.json')!);

      expect(updated.devDependencies['@rspack/core']).toBe(rspackDeps['@rspack/core']);
      expect(updated.devDependencies['@rspack/cli']).toBe(rspackDeps['@rspack/cli']);
      expect(updated.devDependencies['ts-checker-rspack-plugin']).toBe(rspackDeps['ts-checker-rspack-plugin']);
    });

    it('should remove webpack-only devDependencies', () => {
      const context = createBaseContext();
      const pkg = JSON.parse(context.getFile('package.json')!);
      pkg.devDependencies['eslint-webpack-plugin'] = '^5.0.0';
      context.updateFile('package.json', JSON.stringify(pkg, null, 2));

      const result = addRspack(context);
      const updated = JSON.parse(result.getFile('package.json')!);

      expect(updated.devDependencies['copy-webpack-plugin']).toBeUndefined();
      expect(updated.devDependencies['eslint-webpack-plugin']).toBeUndefined();
      expect(updated.devDependencies['fork-ts-checker-webpack-plugin']).toBeUndefined();
      expect(updated.devDependencies['swc-loader']).toBeUndefined();
      expect(updated.devDependencies['webpack-cli']).toBeUndefined();
      expect(updated.devDependencies['webpack-livereload-plugin']).toBeUndefined();
      expect(updated.devDependencies['webpack-subresource-integrity']).toBeUndefined();
      expect(updated.devDependencies['webpack-virtual-modules']).toBeUndefined();
    });

    it('should keep webpack-only devDependencies that root build files still use and report them', () => {
      const context = createBaseContext();
      context.addFile(
        'webpack.config.ts',
        "import CopyWebpackPlugin from 'copy-webpack-plugin';\nimport { getAlias } from './webpack.config.utils';"
      );
      context.addFile('webpack.config.utils.ts', "export const rule = { use: { loader: 'swc-loader' } };");

      const result = addRspack(context);
      const pkg = JSON.parse(result.getFile('package.json')!);

      expect(pkg.devDependencies['copy-webpack-plugin']).toBe('^12.0.0');
      expect(pkg.devDependencies['swc-loader']).toBe('^0.2.0');
      expect(pkg.devDependencies['webpack-livereload-plugin']).toBeUndefined();
      const report = result.getMessage()?.body?.join('\n');
      expect(report).toContain('copy-webpack-plugin');
      expect(report).toContain('swc-loader');
    });

    it('should not treat source files as build files when deciding which dependencies to keep', () => {
      const context = createBaseContext();
      context.addFile('src/module.ts', "import 'copy-webpack-plugin';");

      const result = addRspack(context);
      const pkg = JSON.parse(result.getFile('package.json')!);

      expect(pkg.devDependencies['copy-webpack-plugin']).toBeUndefined();
    });

    it('should keep webpack package itself', () => {
      const context = createBaseContext();

      const result = addRspack(context);
      const pkg = JSON.parse(result.getFile('package.json')!);

      expect(pkg.devDependencies['webpack']).toBe('^5.94.0');
    });

    it('should update build and dev scripts to use rspack', () => {
      const context = createBaseContext();

      const result = addRspack(context);
      const pkg = JSON.parse(result.getFile('package.json')!);

      expect(pkg.scripts.build).toBe('rspack -c ./.config/rspack/rspack.config.ts --env production');
      expect(pkg.scripts.dev).toBe('rspack -w -c ./.config/rspack/rspack.config.ts --env development');
    });
  });

  describe('scripts', () => {
    function runWithScripts(scripts: Record<string, string>, rootConfig = true) {
      const context = createBaseContext();
      const pkg = JSON.parse(context.getFile('package.json')!);
      pkg.scripts = scripts;
      context.updateFile('package.json', JSON.stringify(pkg, null, 2));
      if (rootConfig) {
        context.addFile('webpack.config.ts', 'custom webpack config');
      }
      const result = addRspack(context);
      return {
        scripts: JSON.parse(result.getFile('package.json')!).scripts,
        report: result.getMessage()?.body?.join('\n') ?? '',
      };
    }

    it('should point scripts that use the root webpack config at the root rspack config', () => {
      const { scripts } = runWithScripts({
        build: 'webpack -c webpack.config.ts --env production',
        dev: 'webpack -w --config=./webpack.config.ts --env development',
      });

      expect(scripts.build).toBe('rspack -c ./rspack.config.ts --env production');
      expect(scripts.dev).toBe('rspack -w --config=./rspack.config.ts --env development');
    });

    it('should keep chained commands, env assignments and extra flags', () => {
      const { scripts } = runWithScripts({
        build:
          'pnpm run build:deps && NODE_ENV=production npx webpack -c ./webpack.config.ts --env production --stats-error-details',
      });

      expect(scripts.build).toBe(
        'pnpm run build:deps && NODE_ENV=production npx rspack -c ./rspack.config.ts --env production --stats-error-details'
      );
    });

    it('should rewrite sub scripts and leave script runners alone', () => {
      const { scripts } = runWithScripts({
        build: 'run-s "build:*"',
        'build:compile': 'webpack -c ./webpack.config.ts --env production',
      });

      expect(scripts.build).toBe('run-s "build:*"');
      expect(scripts['build:compile']).toBe('rspack -c ./rspack.config.ts --env production');
    });

    it('should rewrite webpack calls that rely on the default config lookup', () => {
      const { scripts } = runWithScripts({ build: 'webpack --env production' });

      expect(scripts.build).toBe('rspack --env production');
    });

    it('should leave scripts it cannot rewrite unchanged and report them', () => {
      const unparseable = 'tsx node_modules/webpack-cli/bin/cli.js -c ./webpack.config.ts --env production';
      const { scripts, report } = runWithScripts({ build: unparseable });

      expect(scripts.build).toBe(unparseable);
      expect(report).toContain('build');
      expect(report).toContain(unparseable);
    });

    it('should not touch or report scripts that only mention webpack tooling', () => {
      const { scripts, report } = runWithScripts({ analyze: 'webpack-bundle-analyzer dist/stats.json' });

      expect(scripts.analyze).toBe('webpack-bundle-analyzer dist/stats.json');
      expect(report).not.toContain('webpack-bundle-analyzer');
    });

    it('should leave scripts that already call rspack unchanged', () => {
      const { scripts } = runWithScripts(
        {
          build: 'rspack -c ./rspack.config.ts --env production',
          dev: 'rspack -w -c ./rspack.config.ts --env development',
        },
        false
      );

      expect(scripts.build).toBe('rspack -c ./rspack.config.ts --env production');
      expect(scripts.dev).toBe('rspack -w -c ./rspack.config.ts --env development');
    });
  });

  describe('webpack cleanup', () => {
    it('should delete the create-plugin webpack files from .config/webpack/', () => {
      const context = createBaseContext();
      context.addFile('.config/webpack/utils.ts', '');
      context.addFile('.config/webpack/constants.ts', '');
      context.addFile('.config/webpack/tsconfig.webpack.json', '');

      const result = addRspack(context);

      expect(result.doesFileExist('.config/webpack/webpack.config.ts')).toBe(false);
      expect(result.doesFileExist('.config/webpack/BuildModeWebpackPlugin.ts')).toBe(false);
      expect(result.doesFileExist('.config/webpack/utils.ts')).toBe(false);
      expect(result.doesFileExist('.config/webpack/constants.ts')).toBe(false);
      expect(result.doesFileExist('.config/webpack/tsconfig.webpack.json')).toBe(false);
    });

    it('should keep files the plugin added to .config/webpack/ and report them', () => {
      const context = createBaseContext();
      context.addFile('.config/webpack/CorsWorkerPlugin.ts', 'export class CorsWorkerPlugin {}');

      const result = addRspack(context);

      expect(result.getFile('.config/webpack/CorsWorkerPlugin.ts')).toBe('export class CorsWorkerPlugin {}');
      expect(result.getMessage()?.body?.join('\n')).toContain('.config/webpack/CorsWorkerPlugin.ts');
    });
  });

  describe('root config stub', () => {
    it.each(['webpack.config.ts', 'webpack.config.js', 'webpack.config.cjs', 'webpack.config.mjs'])(
      'should add a root rspack.config.ts stub when %s exists',
      (rootConfig) => {
        const context = createBaseContext();
        context.addFile(rootConfig, 'custom webpack config');

        const result = addRspack(context);

        expect(result.doesFileExist('rspack.config.ts')).toBe(true);
      }
    );

    it('should make the stub fail the build until the config is ported', () => {
      const context = createBaseContext();
      context.addFile('webpack.config.ts', 'custom webpack config');

      const result = addRspack(context);
      const stub = result.getFile('rspack.config.ts')!;

      expect(stub).toContain('throw new Error(');
      expect(stub).toContain('[rspack]');
      expect(stub).toContain('add rspack --agent');
      expect(stub).toContain('TODO(rspack)');
    });

    it('should write the stub as an ESM safe rspack-merge config', () => {
      const context = createBaseContext();
      context.addFile('webpack.config.ts', 'custom webpack config');

      const result = addRspack(context);
      const stub = result.getFile('rspack.config.ts')!;

      expect(stub).toContain("import { merge } from 'rspack-merge';");
      expect(stub).toContain("import grafanaConfig, { type Env } from './.config/rspack/rspack.config.ts';");
      expect(stub).not.toContain('__dirname');
      expect(stub).not.toContain('webpack-merge');
    });

    it('should leave the root webpack config untouched', () => {
      const context = createBaseContext();
      const originalContent = 'import grafanaConfig from "./.config/webpack/webpack.config";';
      context.addFile('webpack.config.ts', originalContent);

      const result = addRspack(context);

      expect(result.getFile('webpack.config.ts')).toBe(originalContent);
    });

    it('should not overwrite an existing root rspack config and should report it', () => {
      const context = createBaseContext();
      context.addFile('webpack.config.ts', 'custom webpack config');
      context.addFile('rspack.config.ts', 'my rspack config');

      const result = addRspack(context);

      expect(result.getFile('rspack.config.ts')).toBe('my rspack config');
      expect(result.getMessage()?.body?.join('\n')).toContain('rspack.config.ts');
    });

    it('should not add a stub when there is no root webpack config', () => {
      const context = createBaseContext();

      const result = addRspack(context);

      expect(result.doesFileExist('rspack.config.ts')).toBe(false);
    });
  });
});
