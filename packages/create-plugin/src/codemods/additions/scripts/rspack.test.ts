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

  describe('custom webpack config extension', () => {
    it('should create root rspack.config.ts when root webpack.config.ts exists', () => {
      const context = createBaseContext();
      context.addFile('webpack.config.ts', 'import grafanaConfig from "./.config/webpack/webpack.config";');

      const result = addRspack(context);

      expect(result.doesFileExist('rspack.config.ts')).toBe(true);
    });

    it('should include throw Error in root rspack.config.ts', () => {
      const context = createBaseContext();
      context.addFile('webpack.config.ts', 'custom webpack config');

      const result = addRspack(context);
      const rspackConfig = result.getFile('rspack.config.ts')!;

      expect(rspackConfig).toContain('throw new Error');
      expect(rspackConfig).toContain('[add-rspack]');
    });

    it('should reference webpack-merge in migration instructions', () => {
      const context = createBaseContext();
      context.addFile('webpack.config.ts', 'custom webpack config');

      const result = addRspack(context);
      const rspackConfig = result.getFile('rspack.config.ts')!;

      expect(rspackConfig).toContain('webpack-merge');
    });

    it('should include migration instructions in root rspack.config.ts', () => {
      const context = createBaseContext();
      context.addFile('webpack.config.ts', 'custom webpack config');

      const result = addRspack(context);
      const rspackConfig = result.getFile('rspack.config.ts')!;

      expect(rspackConfig).toContain('TODO');
      expect(rspackConfig).toContain('webpack.config.ts');
      expect(rspackConfig).toContain('.config/rspack/rspack.config');
    });

    it('should import from .config/rspack/rspack.config in root rspack.config.ts', () => {
      const context = createBaseContext();
      context.addFile('webpack.config.ts', 'custom webpack config');

      const result = addRspack(context);
      const rspackConfig = result.getFile('rspack.config.ts')!;

      expect(rspackConfig).toContain("import grafanaConfig from './.config/rspack/rspack.config'");
    });

    it('should leave root webpack.config.ts untouched', () => {
      const context = createBaseContext();
      const originalContent = 'import grafanaConfig from "./.config/webpack/webpack.config";';
      context.addFile('webpack.config.ts', originalContent);

      const result = addRspack(context);

      expect(result.getFile('webpack.config.ts')).toBe(originalContent);
    });

    it('should point build/dev scripts to root rspack.config.ts when custom config exists', () => {
      const context = createBaseContext();
      context.addFile('webpack.config.ts', 'custom webpack config');

      const result = addRspack(context);
      const pkg = JSON.parse(result.getFile('package.json')!);

      expect(pkg.scripts.build).toBe('rspack -c ./rspack.config.ts --env production');
      expect(pkg.scripts.dev).toBe('rspack -w -c ./rspack.config.ts --env development');
    });

    it('should not create root rspack.config.ts when no root webpack.config.ts exists', () => {
      const context = createBaseContext();

      const result = addRspack(context);

      expect(result.doesFileExist('rspack.config.ts')).toBe(false);
    });
  });
});
