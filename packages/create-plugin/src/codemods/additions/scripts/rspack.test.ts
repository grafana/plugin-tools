import { Context } from '../../context.js';
import addRspack, {
  BASE_CONFIG_DEV_DEPENDENCIES,
  getTemplateDevDependencyVersions,
  RSPACK_DEV_DEPENDENCIES,
  WEBPACK_ONLY_DEV_DEPENDENCIES,
} from './rspack.js';

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

  // Only render externals.ts from the real template since we assert on its content.
  // All other templates just need a non-empty stub.
  return {
    ...originalModule,
    renderTemplate: (path: string, includeWarning?: boolean, templateDataOverrides?: Record<string, unknown>) => {
      if (path.includes('.config/bundler/externals.ts')) {
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
  // guards the explicit package lists against the template: fails when the rspack template gains,
  // loses or renames a package the addition should manage. version bumps do not fail it
  describe('package lists', () => {
    it('should find a template version for every package the addition installs', async () => {
      const rspackDeps = await getTemplateDevDependencies(RSPACK_TEMPLATE_DATA);

      for (const name of [...RSPACK_DEV_DEPENDENCIES, ...BASE_CONFIG_DEV_DEPENDENCIES]) {
        expect(rspackDeps[name], name).toBeDefined();
      }
    });

    it('should list every package only the rspack template has', async () => {
      const rspackDeps = await getTemplateDevDependencies(RSPACK_TEMPLATE_DATA);
      const webpackDeps = await getTemplateDevDependencies(WEBPACK_TEMPLATE_DATA);
      const rspackOnly = Object.keys(rspackDeps).filter((name) => !(name in webpackDeps));

      expect(RSPACK_DEV_DEPENDENCIES).toEqual(expect.arrayContaining(rspackOnly));
    });

    it('should list every package only the webpack template has', async () => {
      const rspackDeps = await getTemplateDevDependencies(RSPACK_TEMPLATE_DATA);
      const webpackDeps = await getTemplateDevDependencies(WEBPACK_TEMPLATE_DATA);
      const webpackOnly = Object.keys(webpackDeps).filter((name) => !(name in rspackDeps));

      expect(WEBPACK_ONLY_DEV_DEPENDENCIES).toEqual(expect.arrayContaining(webpackOnly));
    });

    it('should read the same versions as a render with the plugin template data', async () => {
      expect(getTemplateDevDependencyVersions()).toEqual(await getTemplateDevDependencies(RSPACK_TEMPLATE_DATA));
    });
  });

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
      expect(result.getFile('.config/rspack/LiveReloadRspackPlugin.ts')).toBe('// rendered template stub');
      // renamed in the template, so the experimental setup's copy is removed
      expect(result.doesFileExist('.config/rspack/liveReloadPlugin.ts')).toBe(false);
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
      expect(result.doesFileExist('.config/rspack/LiveReloadRspackPlugin.ts')).toBe(true);
      expect(result.doesFileExist('.config/rspack/liveReloadPlugin.ts')).toBe(false);
      expect(result.doesFileExist('.config/rspack/LicenseRspackPlugin.ts')).toBe(true);
    });
  });

  describe('docs for agents and developers', () => {
    it('should re-render the agent instructions and .config README for rspack', () => {
      const context = createBaseContext();
      context.addFile('.config/AGENTS/instructions.md', '**You must use webpack**');
      context.addFile('.config/README.md', '### Extending the Webpack config');

      const result = addRspack(context);

      expect(result.getFile('.config/AGENTS/instructions.md')).toBe('// rendered template stub');
      expect(result.getFile('.config/README.md')).toBe('// rendered template stub');
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

    it('should add packages the rspack base config needs when the plugin has dropped them', async () => {
      const rspackDeps = await getTemplateDevDependencies(RSPACK_TEMPLATE_DATA);
      const context = createBaseContext();

      const result = addRspack(context);
      const pkg = JSON.parse(result.getFile('package.json')!);

      // builtin:swc-loader runs with externalHelpers, so builds import @swc/helpers
      expect(pkg.devDependencies['@swc/helpers']).toBe(rspackDeps['@swc/helpers']);
      expect(pkg.devDependencies['imports-loader']).toBe(rspackDeps['imports-loader']);
    });

    it('should not change the versions of base config packages the plugin already has', () => {
      const context = createBaseContext();
      const pkg = JSON.parse(context.getFile('package.json')!);
      pkg.devDependencies['sass-loader'] = '^13.0.0';
      pkg.dependencies = { '@swc/helpers': '0.4.14' };
      context.updateFile('package.json', JSON.stringify(pkg, null, 2));

      const result = addRspack(context);
      const updated = JSON.parse(result.getFile('package.json')!);

      expect(updated.devDependencies['sass-loader']).toBe('^13.0.0');
      expect(updated.dependencies['@swc/helpers']).toBe('0.4.14');
      expect(updated.devDependencies['@swc/helpers']).toBeUndefined();
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
      pkg.devDependencies['terser-webpack-plugin'] = '^5.3.0';
      context.updateFile('package.json', JSON.stringify(pkg, null, 2));

      const result = addRspack(context);
      const updated = JSON.parse(result.getFile('package.json')!);

      expect(updated.devDependencies['copy-webpack-plugin']).toBeUndefined();
      expect(updated.devDependencies['eslint-webpack-plugin']).toBeUndefined();
      expect(updated.devDependencies['fork-ts-checker-webpack-plugin']).toBeUndefined();
      expect(updated.devDependencies['swc-loader']).toBeUndefined();
      expect(updated.devDependencies['terser-webpack-plugin']).toBeUndefined();
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

  describe('experimental rspack start', () => {
    function createExperimentalRspackContext(devDependencies: Record<string, string>) {
      const context = new Context('/virtual');
      context.addFile('.config/rspack/rspack.config.ts', 'experimental rspack config');
      context.addFile(
        '.config/.cprc.json',
        JSON.stringify({ version: '7.9.0', features: { useExperimentalRspack: true } }, null, 2)
      );
      context.addFile('rspack.config.ts', 'my rspack config');
      context.addFile(
        'package.json',
        JSON.stringify(
          {
            scripts: { build: 'rspack -c ./rspack.config.ts --env production' },
            devDependencies: { 'eslint-webpack-plugin': '^5.0.0', webpack: '^5.94.0', ...devDependencies },
          },
          null,
          2
        )
      );
      return context;
    }

    it('should hand the root rspack config to the user untouched and not add a stub', () => {
      const context = createExperimentalRspackContext({ '@rspack/core': '^1.6.0', '@rspack/cli': '^1.6.0' });

      const result = addRspack(context);

      expect(result.getFile('rspack.config.ts')).toBe('my rspack config');
    });

    it('should swap eslint-webpack-plugin for eslint-rspack-plugin', () => {
      const context = createExperimentalRspackContext({ '@rspack/core': '^1.6.0', '@rspack/cli': '^1.6.0' });

      const result = addRspack(context);
      const pkg = JSON.parse(result.getFile('package.json')!);

      expect(pkg.devDependencies['eslint-webpack-plugin']).toBeUndefined();
      expect(pkg.devDependencies['eslint-rspack-plugin']).toBeDefined();
    });

    it('should keep rspack versions the plugin already pinned at or above the template', () => {
      const context = createExperimentalRspackContext({ '@rspack/core': '2.2.6', '@rspack/cli': '2.2.6' });

      const result = addRspack(context);
      const pkg = JSON.parse(result.getFile('package.json')!);

      expect(pkg.devDependencies['@rspack/core']).toBe('2.2.6');
      expect(pkg.devDependencies['@rspack/cli']).toBe('2.2.6');
    });
  });

  describe('engines', () => {
    function runWithEngines(engines?: Record<string, string>) {
      const context = createBaseContext();
      const pkg = JSON.parse(context.getFile('package.json')!);
      if (engines) {
        pkg.engines = engines;
      }
      context.updateFile('package.json', JSON.stringify(pkg, null, 2));
      return JSON.parse(addRspack(context).getFile('package.json')!).engines;
    }

    it('should raise engines.node when it allows versions rspack 2 cannot run on', () => {
      expect(runWithEngines({ node: '>=22' })).toEqual({ node: '>=22.23' });
      expect(runWithEngines({ node: '>=20', npm: '>=10' })).toEqual({ node: '>=22.23', npm: '>=10' });
    });

    it('should keep engines.node when it already requires a newer Node', () => {
      expect(runWithEngines({ node: '>=24' })).toEqual({ node: '>=24' });
      expect(runWithEngines({ node: '>=22.23.3' })).toEqual({ node: '>=22.23.3' });
    });

    it('should not add engines when the plugin has none', () => {
      expect(runWithEngines()).toBeUndefined();
    });
  });

  describe('npm lockfile', () => {
    function createLockfile(rspackCoreVersion: string) {
      return JSON.stringify(
        {
          name: 'my-plugin',
          lockfileVersion: 3,
          packages: {
            '': { name: 'my-plugin' },
            'node_modules/@rspack/core': { version: rspackCoreVersion },
            'node_modules/@rspack/cli': { version: rspackCoreVersion },
            'node_modules/@rspack/cli/node_modules/@rspack/dev-server': { version: '1.1.5' },
            'node_modules/react': { version: '18.3.1' },
          },
        },
        null,
        2
      );
    }

    it('should drop locked rspack 1 packages so npm can resolve rspack 2', () => {
      const context = createBaseContext();
      context.addFile('package-lock.json', createLockfile('1.7.12'));

      const result = addRspack(context);
      const packages = Object.keys(JSON.parse(result.getFile('package-lock.json')!).packages);

      expect(packages).toEqual(['', 'node_modules/react']);
    });

    it('should leave the lockfile alone when rspack 2 is already locked', () => {
      const context = createBaseContext();
      const lockfile = createLockfile('2.2.8');
      context.addFile('package-lock.json', lockfile);

      const result = addRspack(context);

      expect(result.getFile('package-lock.json')).toBe(lockfile);
    });

    it('should not touch other package managers lockfiles', () => {
      const context = createBaseContext();
      context.addFile('pnpm-lock.yaml', "lockfileVersion: '9.0'\n");
      context.addFile('yarn.lock', '# yarn lockfile v1\n');

      const result = addRspack(context);

      expect(result.getFile('pnpm-lock.yaml')).toBe("lockfileVersion: '9.0'\n");
      expect(result.getFile('yarn.lock')).toBe('# yarn lockfile v1\n');
    });
  });

  describe('idempotency', () => {
    const run = async (context: Context) => addRspack(context);

    it('should be idempotent for a webpack plugin', async () => {
      await expect(run).toBeIdempotent(createBaseContext());
    });

    it('should be idempotent for a webpack plugin with a root config, helpers and a lockfile', async () => {
      const context = createBaseContext();
      const pkg = JSON.parse(context.getFile('package.json')!);
      pkg.scripts = { build: 'pnpm run prebuild && webpack -c ./webpack.config.ts --env production' };
      pkg.engines = { node: '>=22' };
      context.updateFile('package.json', JSON.stringify(pkg, null, 2));
      context.addFile('webpack.config.ts', "import CopyWebpackPlugin from 'copy-webpack-plugin';");
      context.addFile('.config/webpack/CorsWorkerPlugin.ts', 'export class CorsWorkerPlugin {}');
      context.addFile(
        'package-lock.json',
        JSON.stringify({ packages: { 'node_modules/@rspack/core': { version: '1.7.12' } } }, null, 2)
      );

      await expect(run).toBeIdempotent(context);
    });

    it('should be idempotent for an experimental rspack plugin', async () => {
      const context = new Context('/virtual');
      context.addFile('.config/rspack/rspack.config.ts', 'experimental rspack config');
      context.addFile('rspack.config.ts', 'my rspack config');
      context.addFile(
        'package.json',
        JSON.stringify({ scripts: { build: 'rspack -c ./rspack.config.ts' }, devDependencies: {} }, null, 2)
      );

      await expect(run).toBeIdempotent(context);
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
