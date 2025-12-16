import { describe, expect, it } from 'vitest';

import { Context } from '../../../context.js';
import { ensureI18nextExternal, updatePluginJson } from './config-updates.js';

describe('config-updates', () => {
  describe('ensureI18nextExternal', () => {
    it('should add i18next to externals array in .config/bundler/externals.ts', () => {
      const context = new Context('/virtual');

      context.addFile('.config/bundler/externals.ts', `export const externals = ['react', 'react-dom'];`);

      ensureI18nextExternal(context);

      const externalsContent = context.getFile('.config/bundler/externals.ts');
      expect(externalsContent).toMatch(/["']i18next["']/);
      expect(externalsContent).toContain("'react'");
      expect(externalsContent).toContain("'react-dom'");
    });

    it('should not duplicate i18next if already in externals array', () => {
      const context = new Context('/virtual');

      const originalExternals = `export const externals = ['react', 'i18next', 'react-dom'];`;
      context.addFile('.config/bundler/externals.ts', originalExternals);

      ensureI18nextExternal(context);

      const externalsContent = context.getFile('.config/bundler/externals.ts');
      const i18nextCount = (externalsContent?.match(/["']i18next["']/g) || []).length;
      expect(i18nextCount).toBe(1);
    });

    it('should add i18next to externals in .config/webpack/webpack.config.ts (legacy)', () => {
      const context = new Context('/virtual');

      context.addFile(
        '.config/webpack/webpack.config.ts',
        `import { Configuration } from 'webpack';
export const config: Configuration = {
  externals: ['react', 'react-dom'],
};`
      );

      ensureI18nextExternal(context);

      const webpackConfig = context.getFile('.config/webpack/webpack.config.ts');
      expect(webpackConfig).toMatch(/["']i18next["']/);
      expect(webpackConfig).toContain("'react'");
      expect(webpackConfig).toContain("'react-dom'");
    });

    it('should handle missing externals configuration gracefully', () => {
      const context = new Context('/virtual');
      // No externals.ts or webpack.config.ts

      expect(() => {
        ensureI18nextExternal(context);
      }).not.toThrow();
    });

    it('should prefer .config/bundler/externals.ts over webpack.config.ts', () => {
      const context = new Context('/virtual');

      context.addFile('.config/bundler/externals.ts', `export const externals = ['react'];`);
      context.addFile('.config/webpack/webpack.config.ts', `export const config = { externals: ['react-dom'] };`);

      ensureI18nextExternal(context);

      // Should update externals.ts, not webpack.config.ts
      const externalsContent = context.getFile('.config/bundler/externals.ts');
      expect(externalsContent).toMatch(/["']i18next["']/);

      const webpackConfig = context.getFile('.config/webpack/webpack.config.ts');
      expect(webpackConfig).not.toMatch(/["']i18next["']/);
    });
  });

  describe('updatePluginJson', () => {
    it('should auto-update grafanaDependency from < 11.0.0 to >=11.0.0', () => {
      const context = new Context('/virtual');

      context.addFile(
        'src/plugin.json',
        JSON.stringify({
          id: 'test-plugin',
          type: 'panel',
          name: 'Test Plugin',
          dependencies: {
            grafanaDependency: '>=10.0.0',
          },
        })
      );

      updatePluginJson(context, ['en-US'], true);

      const pluginJson = JSON.parse(context.getFile('src/plugin.json') || '{}');
      expect(pluginJson.dependencies.grafanaDependency).toBe('>=11.0.0');
      expect(pluginJson.languages).toEqual(['en-US']);
    });

    it('should keep grafanaDependency >= 11.0.0 unchanged when needsBackwardCompatibility is true', () => {
      const context = new Context('/virtual');

      context.addFile(
        'src/plugin.json',
        JSON.stringify({
          id: 'test-plugin',
          type: 'panel',
          name: 'Test Plugin',
          dependencies: {
            grafanaDependency: '>=11.0.0',
          },
        })
      );

      updatePluginJson(context, ['en-US'], true);

      const pluginJson = JSON.parse(context.getFile('src/plugin.json') || '{}');
      expect(pluginJson.dependencies.grafanaDependency).toBe('>=11.0.0');
    });

    it('should update grafanaDependency to >=12.1.0 when needsBackwardCompatibility is false', () => {
      const context = new Context('/virtual');

      context.addFile(
        'src/plugin.json',
        JSON.stringify({
          id: 'test-plugin',
          type: 'panel',
          name: 'Test Plugin',
          dependencies: {
            grafanaDependency: '>=11.0.0',
          },
        })
      );

      updatePluginJson(context, ['en-US'], false);

      const pluginJson = JSON.parse(context.getFile('src/plugin.json') || '{}');
      expect(pluginJson.dependencies.grafanaDependency).toBe('>=12.1.0');
    });

    it('should merge locales with existing languages', () => {
      const context = new Context('/virtual');

      context.addFile(
        'src/plugin.json',
        JSON.stringify({
          id: 'test-plugin',
          type: 'panel',
          name: 'Test Plugin',
          languages: ['en-US'],
          dependencies: {
            grafanaDependency: '>=12.1.0',
          },
        })
      );

      updatePluginJson(context, ['es-ES', 'sv-SE'], false);

      const pluginJson = JSON.parse(context.getFile('src/plugin.json') || '{}');
      expect(pluginJson.languages).toEqual(['en-US', 'es-ES', 'sv-SE']);
    });

    it('should not duplicate locales', () => {
      const context = new Context('/virtual');

      context.addFile(
        'src/plugin.json',
        JSON.stringify({
          id: 'test-plugin',
          type: 'panel',
          name: 'Test Plugin',
          languages: ['en-US', 'es-ES'],
          dependencies: {
            grafanaDependency: '>=12.1.0',
          },
        })
      );

      updatePluginJson(context, ['en-US', 'sv-SE'], false);

      const pluginJson = JSON.parse(context.getFile('src/plugin.json') || '{}');
      expect(pluginJson.languages).toEqual(['en-US', 'es-ES', 'sv-SE']);
    });

    it('should not update grafanaDependency if it is already >= target version', () => {
      const context = new Context('/virtual');

      context.addFile(
        'src/plugin.json',
        JSON.stringify({
          id: 'test-plugin',
          type: 'panel',
          name: 'Test Plugin',
          dependencies: {
            grafanaDependency: '>=13.0.0',
          },
        })
      );

      updatePluginJson(context, ['en-US'], false);

      const pluginJson = JSON.parse(context.getFile('src/plugin.json') || '{}');
      expect(pluginJson.dependencies.grafanaDependency).toBe('>=13.0.0');
    });
  });
});
