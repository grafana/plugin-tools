import { describe, expect, it } from 'vitest';

import { Context } from '../../context.js';
import migrate from './externalize-jsx-runtime.js';

vi.mock(import('../../../utils/utils.plugin.js'), async (importOriginal) => {
  const originalModule = await importOriginal();
  return {
    ...originalModule,
    getPluginJson: () => ({ id: 'my-plugin-id', info: { author: { name: 'my-author' } } }),
  };
});

describe('externalizeJSXRuntime', () => {
  it('renders the externals template if it does not exist', () => {
    const context = new Context();
    const result = migrate(context);

    expect(result.doesFileExist('.config/bundler/externals.ts')).toBeTruthy();
  });
  it('updates the externals template if it exists', () => {
    const context = new Context();
    const originalContent = 'original content';
    context.addFile('.config/bundler/externals.ts', originalContent);
    const result = migrate(context);
    const updatedContent = result.getFile('.config/bundler/externals.ts');

    expect(updatedContent).not.toEqual(originalContent);
  });
  it('updates the bundler config to import externals if it does not exist', () => {
    const context = new Context();
    const webpackConfigContent = `
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
    context.addFile('.config/webpack/webpack.config.ts', webpackConfigContent);
    const result = migrate(context);
    const updatedWebpackConfig = result.getFile('.config/webpack/webpack.config.ts');

    expect(updatedWebpackConfig).toContain(`import { externals } from '../bundler/externals.ts'`);
    expect(updatedWebpackConfig).toContain('externals,');
  });
  it('updates the plugin.json to support jsx-runtime patched versions of Grafana', () => {
    const context = new Context();
    const pluginJsonContent = JSON.stringify({
      id: 'my-plugin-id',
      dependencies: {
        grafanaDependency: '>=11.6.0 <12',
      },
    });
    context.addFile('src/plugin.json', pluginJsonContent);
    const result = migrate(context);
    const updatedPluginJsonContent = result.getFile('src/plugin.json');
    const updatedPluginJson = JSON.parse(updatedPluginJsonContent || '{}');

    expect(updatedPluginJson.dependencies.grafanaDependency).toBe(
      '>=11.6.11 <12 || >=12.0.10 <12.1 || >=12.1.7 <12.2 || >=12.2.5 <12.3 || >=12.3.0'
    );
  });
});

describe('semver range handling for grafanaDependency', () => {
  const EXPECTED_UPDATED_RANGE = '>=11.6.11 <12 || >=12.0.10 <12.1 || >=12.1.7 <12.2 || >=12.2.5 <12.3 || >=12.3.0';

  describe('should NOT update when min version >= 12.3.0', () => {
    it.each([
      ['>=12.3.0', 'gte range at 12.3.0'],
      ['>=12.3.1', 'gte range above 12.3.0'],
      ['>=12.4.0', 'gte range at 12.4.0'],
      ['>=13.0.0', 'gte range at 13.0.0'],
      ['^12.3.0', 'caret range at 12.3.0'],
      ['^12.4.0', 'caret range above 12.3.0'],
      ['~12.3.0', 'tilde range at 12.3.0'],
      ['~12.4.0', 'tilde range above 12.3.0'],
      ['12.3.0', 'exact version at 12.3.0'],
      ['12.4.0', 'exact version above 12.3.0'],
      ['>=12.3.0 <13', 'bounded range starting at 12.3.0'],
      ['>=12.3.0 <14 || >=14.0.0', 'complex OR range with min >= 12.3.0'],
    ])('%s (%s)', (range) => {
      const context = new Context();
      context.addFile(
        'src/plugin.json',
        JSON.stringify({
          id: 'my-plugin-id',
          dependencies: { grafanaDependency: range },
        })
      );

      const result = migrate(context);
      const updatedPluginJson = JSON.parse(result.getFile('src/plugin.json') || '{}');

      expect(updatedPluginJson.dependencies.grafanaDependency).toBe(range);
    });
  });

  describe('should update when min version < 12.3.0', () => {
    it.each([
      ['>=11.0.0', 'gte range below 12.3.0'],
      ['>=11.6.0', 'gte range at 11.6.0'],
      ['>=12.0.0', 'gte range at 12.0.0'],
      ['>=12.2.0', 'gte range at 12.2.0'],
      ['>=12.2.9', 'gte range just below 12.3.0'],
      ['>11.0.0', 'gt range below 12.3.0'],
      ['>12.2.9', 'gt range just below 12.3.0'],
      ['^11.0.0', 'caret range below 12.3.0'],
      ['^12.0.0', 'caret range at 12.0.0'],
      ['^12.2.0', 'caret range at 12.2.0'],
      ['~11.0.0', 'tilde range below 12.3.0'],
      ['~12.2.0', 'tilde range at 12.2.0'],
      ['11.0.0', 'exact version below 12.3.0'],
      ['12.2.9', 'exact version just below 12.3.0'],
      ['>=11.0.0 <12', 'bounded range below 12.3.0'],
      ['>=11.6.0 <12', 'bounded range at 11.6.0'],
      ['>=10.0.0 || >=11.0.0 <12', 'complex OR range with min < 12.3.0'],
      ['11.0.0 - 12.2.0', 'hyphen range below 12.3.0'],
    ])('%s (%s)', (range) => {
      const context = new Context();
      context.addFile(
        'src/plugin.json',
        JSON.stringify({
          id: 'my-plugin-id',
          dependencies: { grafanaDependency: range },
        })
      );

      const result = migrate(context);
      const updatedPluginJson = JSON.parse(result.getFile('src/plugin.json') || '{}');

      expect(updatedPluginJson.dependencies.grafanaDependency).toBe(EXPECTED_UPDATED_RANGE);
    });
  });
});
