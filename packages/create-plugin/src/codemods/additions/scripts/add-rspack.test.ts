import { Context } from '../../context.js';
import addRspack from './add-rspack.js';

vi.mock(import('../../../utils/utils.plugin.js'), async (importOriginal) => {
  const originalModule = await importOriginal();
  return {
    ...originalModule,
    getPluginJson: () => ({ id: 'my-plugin-id', type: 'panel', info: { author: { name: 'my-author' } } }),
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
  const rspackOverrides = { useExperimentalRspack: true, frontendBundler: 'rspack' };

  // Only render externals.ts from the real template since we assert on its content (RspackOptions).
  // All other templates just need a non-empty stub.
  const externalsTemplatePath = new URL('../../../../templates/common/.config/bundler/externals.ts', import.meta.url)
    .pathname;
  const renderedExternals = originalModule.renderTemplate(externalsTemplatePath, true, rspackOverrides);

  return {
    ...originalModule,
    renderTemplate: (path: string) => {
      if (path.includes('.config/bundler/externals.ts')) {
        return renderedExternals;
      }
      return '// rendered template stub';
    },
  };
});

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

describe('add-rspack', () => {
  describe('guard clauses', () => {
    it('should return unchanged context when rspack config already exists', () => {
      const context = new Context('/virtual');
      context.addFile('.config/rspack/rspack.config.ts', 'rspack config');
      context.addFile('.config/webpack/webpack.config.ts', 'webpack config');
      const changesBefore = Object.keys(context.listChanges()).length;

      const result = addRspack(context);

      expect(Object.keys(result.listChanges()).length).toBe(changesBefore);
    });

    it('should return unchanged context when no webpack config exists', () => {
      const context = new Context('/virtual');

      const result = addRspack(context);

      expect(result.hasChanges()).toBeFalsy();
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

    it('should update all bundler files', () => {
      const context = createBaseContext();

      const result = addRspack(context);

      const changes = result.listChanges();
      expect(changes['.config/bundler/externals.ts']?.changeType).toBe('update');
      expect(changes['.config/bundler/constants.ts']?.changeType).toBe('update');
      expect(changes['.config/bundler/copyFiles.ts']?.changeType).toBe('update');
      expect(changes['.config/bundler/utils.ts']?.changeType).toBe('update');
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
    it('should add rspack devDependencies', () => {
      const context = createBaseContext();

      const result = addRspack(context);
      const pkg = JSON.parse(result.getFile('package.json')!);

      expect(pkg.devDependencies['@rspack/core']).toBe('^1.6.0');
      expect(pkg.devDependencies['@rspack/cli']).toBe('^1.6.0');
      expect(pkg.devDependencies['ts-checker-rspack-plugin']).toBe('^1.2.0');
      expect(pkg.devDependencies['rspack-plugin-virtual-module']).toBe('^1.0.0');
      expect(pkg.devDependencies['@types/ws']).toBe('^8.18.1');
      expect(pkg.devDependencies['ws']).toBe('^8.13.0');
    });

    it('should remove webpack-only devDependencies', () => {
      const context = createBaseContext();

      const result = addRspack(context);
      const pkg = JSON.parse(result.getFile('package.json')!);

      expect(pkg.devDependencies['copy-webpack-plugin']).toBeUndefined();
      expect(pkg.devDependencies['fork-ts-checker-webpack-plugin']).toBeUndefined();
      expect(pkg.devDependencies['swc-loader']).toBeUndefined();
      expect(pkg.devDependencies['webpack-cli']).toBeUndefined();
      expect(pkg.devDependencies['webpack-livereload-plugin']).toBeUndefined();
      expect(pkg.devDependencies['webpack-subresource-integrity']).toBeUndefined();
      expect(pkg.devDependencies['webpack-virtual-modules']).toBeUndefined();
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
    it('should delete webpack config files from .config/webpack/', () => {
      const context = createBaseContext();

      const result = addRspack(context);

      expect(result.doesFileExist('.config/webpack/webpack.config.ts')).toBe(false);
      expect(result.doesFileExist('.config/webpack/BuildModeWebpackPlugin.ts')).toBe(false);
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
