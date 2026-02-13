import { Context } from '../../context.js';
import externalizeJSXRuntime from './externalize-jsx-runtime.js';

vi.mock(import('../../../utils/utils.plugin.js'), async (importOriginal) => {
  const originalModule = await importOriginal();
  return {
    ...originalModule,
    getPluginJson: () => ({ id: 'my-plugin-id', info: { author: { name: 'my-author' } } }),
  };
});

vi.mock(import('../../utils.js'), async (importOriginal) => {
  const originalModule = await importOriginal();
  // Disk I/O is slow so render template once and return in mocked renderTemplate function.
  const externalsTemplatePath = new URL('../../../../templates/common/.config/bundler/externals.ts', import.meta.url)
    .pathname;
  const renderedExternalsTemplate = originalModule.renderTemplate(externalsTemplatePath, true);
  return {
    ...originalModule,
    renderTemplate: () => renderedExternalsTemplate,
  };
});

describe('externalizeJSXRuntime', () => {
  let context: Context;
  const baseConfigContent = `
      import { defineConfig } from 'webpack';

      const config = async (env: Env): Promise<Configuration> => {
        const baseConfig: Configuration = {
          entry: await getEntries(),
          externals: ['react'],
          experiments: {
            asyncWebAssembly: true,
          },
        };
        return baseConfig;
      };
      export default config;
    `;

  beforeEach(() => {
    context = new Context('/virtual');
  });

  describe('externals template', () => {
    it('renders the externals template if it does not exist', () => {
      context.addFile('.config/webpack/webpack.config.ts', baseConfigContent);
      const result = externalizeJSXRuntime(context);

      expect(result.doesFileExist('.config/bundler/externals.ts')).toBeTruthy();
    });

    it('updates the externals template if it exists', () => {
      context.addFile('.config/webpack/webpack.config.ts', baseConfigContent);
      const originalContent = 'original content';
      context.addFile('.config/bundler/externals.ts', originalContent);
      const result = externalizeJSXRuntime(context);

      expect(result.getFile('.config/bundler/externals.ts')).toContain('react/jsx-runtime');
    });
  });

  describe('bundler config', () => {
    it('updates webpack config to import externals', () => {
      context.addFile('.config/webpack/webpack.config.ts', baseConfigContent);
      const result = externalizeJSXRuntime(context);
      const updatedConfig = result.getFile('.config/webpack/webpack.config.ts');

      expect(updatedConfig).toContain(`import { externals } from '../bundler/externals.ts'`);
      expect(updatedConfig).toContain('externals,');
    });

    it('updates rspack config to import externals when webpack config does not exist', () => {
      context.addFile('.config/rspack/rspack.config.ts', baseConfigContent);
      const result = externalizeJSXRuntime(context);
      const updatedConfig = result.getFile('.config/rspack/rspack.config.ts');

      expect(updatedConfig).toContain(`import { externals } from '../bundler/externals.ts'`);
      expect(updatedConfig).toContain('externals,');
    });

    it('does not modify bundler config when externals property is not an array', () => {
      const configWithFunctionExternals = `
        const baseConfig = {
          externals: () => {},
        };
      `;
      context.addFile('.config/webpack/webpack.config.ts', configWithFunctionExternals);
      const result = externalizeJSXRuntime(context);
      const updatedConfig = result.getFile('.config/webpack/webpack.config.ts');

      expect(updatedConfig).not.toContain(`import { externals }`);
      expect(updatedConfig).toContain('externals: () => {}');
    });
  });

  describe('plugin.json semver range updates', () => {
    const ALL_RANGES = '>=11.6.11 <12 || >=12.0.10 <12.1 || >=12.1.7 <12.2 || >=12.2.5';
    const FROM_12_0 = '>=12.0.10 <12.1 || >=12.1.7 <12.2 || >=12.2.5';
    const FROM_12_1 = '>=12.1.7 <12.2 || >=12.2.5';
    const FROM_12_2 = '>=12.2.5';

    function runMigration(grafanaDependency: string) {
      context.addFile(
        'src/plugin.json',
        JSON.stringify({
          id: 'my-plugin-id',
          dependencies: { grafanaDependency },
        })
      );
      context.addFile('.config/webpack/webpack.config.ts', baseConfigContent);
      const result = externalizeJSXRuntime(context);
      return JSON.parse(result.getFile('src/plugin.json') || '{}');
    }

    describe('should NOT update when min version >= 12.2.5', () => {
      it.each([['>=12.2.5'], ['>=12.3.0'], ['>=12.3.0-0'], ['12.3.1'], ['>=13.0.0'], ['>=12.3.0 <13']])(
        '%s',
        (range) => {
          const pluginJson = runMigration(range);
          expect(pluginJson.dependencies.grafanaDependency).toBe(range);
        }
      );
    });

    describe('should update to all ranges when min version < 12.0.0', () => {
      it.each([['>=11.0.0'], ['11.6.0'], ['>=11.0.0 <12']])('%s', (range) => {
        const pluginJson = runMigration(range);
        expect(pluginJson.dependencies.grafanaDependency).toBe(ALL_RANGES);
      });
    });

    describe('should update from 12.0 ranges when min version >= 12.0.0 and < 12.1.0', () => {
      it.each([['>=12.0.0'], ['12.0.0'], ['12.0.0-0'], ['>=12.0.0 <12.1']])('%s', (range) => {
        const pluginJson = runMigration(range);
        expect(pluginJson.dependencies.grafanaDependency).toBe(FROM_12_0);
      });
    });

    describe('should update from 12.1 ranges when min version >= 12.1.0 and < 12.2.0', () => {
      it.each([['>=12.1.0'], ['12.1.0'], ['12.1.0-0'], ['>=12.1.0 <12.2']])('%s', (range) => {
        const pluginJson = runMigration(range);
        expect(pluginJson.dependencies.grafanaDependency).toBe(FROM_12_1);
      });
    });

    describe('should update from 12.2 ranges when min version >= 12.2.0 and < 12.3.0', () => {
      it.each([['>=12.2.0'], ['12.2.0'], ['12.2.0-0'], ['>=12.2.0 <12.3']])('%s', (range) => {
        const pluginJson = runMigration(range);
        expect(pluginJson.dependencies.grafanaDependency).toBe(FROM_12_2);
      });
    });

    it('does not modify plugin.json when file does not exist', () => {
      context.addFile('.config/webpack/webpack.config.ts', baseConfigContent);
      const result = externalizeJSXRuntime(context);

      expect(result.getFile('src/plugin.json')).toBeUndefined();
    });

    it('should set grafanaDependency to >=12.2.5 when undefined', () => {
      context.addFile(
        'src/plugin.json',
        JSON.stringify({
          id: 'my-plugin-id',
        })
      );
      context.addFile('.config/webpack/webpack.config.ts', baseConfigContent);
      const result = externalizeJSXRuntime(context);
      const pluginJson = JSON.parse(result.getFile('src/plugin.json') || '{}');

      expect(pluginJson.dependencies.grafanaDependency).toBe('>=12.2.5');
    });
  });

  it('should be idempotent', async () => {
    context.addFile('.config/webpack/webpack.config.ts', baseConfigContent);
    await expect(externalizeJSXRuntime).toBeIdempotent(context);
  });
});
