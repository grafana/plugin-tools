import { describe, expect, it } from 'vitest';

import { Context } from '../../../context.js';
import bundleGrafanaUI from './index.js';

const EXTERNALS_PATH = '.config/bundler/externals.ts';
const WEBPACK_CONFIG_PATH = '.config/webpack/webpack.config.ts';
const PLUGIN_JSON_PATH = 'src/plugin.json';

const defaultExternalsContent = `import type { Configuration, ExternalItemFunctionData } from 'webpack';

type ExternalsType = Configuration['externals'];

export const externals: ExternalsType = [
  { 'amd-module': 'module' },
  'lodash',
  'react',
  'react-dom',
  /^@grafana\\/ui/i,
  /^@grafana\\/runtime/i,
  /^@grafana\\/data/i,
];`;

const webpackConfigWithExternals = `import type { Configuration } from 'webpack';

const baseConfig: Configuration = {
  externals: [
    { 'amd-module': 'module' },
    'lodash',
    'react',
    /^@grafana\\/ui/i,
    /^@grafana\\/runtime/i,
    /^@grafana\\/data/i,
  ],
};

export default baseConfig;`;

describe('bundle-grafana-ui', () => {
  describe('externals.ts (new structure)', () => {
    it('should remove @grafana/ui from externals', () => {
      const context = new Context('/virtual');
      context.addFile(EXTERNALS_PATH, defaultExternalsContent);

      const result = bundleGrafanaUI(context, {});

      const content = result.getFile(EXTERNALS_PATH) || '';
      expect(content).not.toMatch(/\/\^@grafana\\\/ui\/i/);
    });

    it('should add react-inlinesvg to externals', () => {
      const context = new Context('/virtual');
      context.addFile(EXTERNALS_PATH, defaultExternalsContent);

      const result = bundleGrafanaUI(context, {});

      const content = result.getFile(EXTERNALS_PATH) || '';
      expect(content).toMatch(/['"]react-inlinesvg['"]/);
    });

    it('should preserve other externals', () => {
      const context = new Context('/virtual');
      context.addFile(EXTERNALS_PATH, defaultExternalsContent);

      const result = bundleGrafanaUI(context, {});

      const content = result.getFile(EXTERNALS_PATH) || '';
      expect(content).toContain("'lodash'");
      expect(content).toContain("'react'");
      expect(content).toMatch(/\/\^@grafana\\\/runtime\/i/);
      expect(content).toMatch(/\/\^@grafana\\\/data\/i/);
    });

    it('should be idempotent', () => {
      const context = new Context('/virtual');
      context.addFile(EXTERNALS_PATH, defaultExternalsContent);

      const result1 = bundleGrafanaUI(context, {});
      const content1 = result1.getFile(EXTERNALS_PATH) || '';

      // Verify first run removed @grafana/ui and added react-inlinesvg
      expect(content1).not.toContain('@grafana\\/ui');
      expect(content1).toMatch(/['"]react-inlinesvg['"]/);

      const context2 = new Context('/virtual');
      context2.addFile(EXTERNALS_PATH, content1);
      const result2 = bundleGrafanaUI(context2, {});

      // Second run should produce identical content (idempotent)
      const content2 = result2.getFile(EXTERNALS_PATH) || '';
      expect(content2).toBe(content1);
    });
  });

  describe('webpack.config.ts (legacy structure)', () => {
    it('should remove @grafana/ui from externals in webpack config', () => {
      const context = new Context('/virtual');
      context.addFile(WEBPACK_CONFIG_PATH, webpackConfigWithExternals);

      const result = bundleGrafanaUI(context, {});

      const content = result.getFile(WEBPACK_CONFIG_PATH) || '';
      expect(content).not.toMatch(/\/\^@grafana\\\/ui\/i/);
    });

    it('should add react-inlinesvg to externals in webpack config', () => {
      const context = new Context('/virtual');
      context.addFile(WEBPACK_CONFIG_PATH, webpackConfigWithExternals);

      const result = bundleGrafanaUI(context, {});

      const content = result.getFile(WEBPACK_CONFIG_PATH) || '';
      expect(content).toMatch(/['"]react-inlinesvg['"]/);
    });

    it('should be idempotent for webpack config', () => {
      const context = new Context('/virtual');
      context.addFile(WEBPACK_CONFIG_PATH, webpackConfigWithExternals);

      const result1 = bundleGrafanaUI(context, {});
      const content1 = result1.getFile(WEBPACK_CONFIG_PATH) || '';

      // Verify first run removed @grafana/ui and added react-inlinesvg
      expect(content1).not.toContain('@grafana\\/ui');
      expect(content1).toMatch(/['"]react-inlinesvg['"]/);

      const context2 = new Context('/virtual');
      context2.addFile(WEBPACK_CONFIG_PATH, content1);
      const result2 = bundleGrafanaUI(context2, {});

      // Second run should produce identical content (idempotent)
      const content2 = result2.getFile(WEBPACK_CONFIG_PATH) || '';
      expect(content2).toBe(content1);
    });
  });

  describe('priority', () => {
    it('should prefer externals.ts over webpack.config.ts when both exist', () => {
      const context = new Context('/virtual');
      context.addFile(EXTERNALS_PATH, defaultExternalsContent);
      context.addFile(WEBPACK_CONFIG_PATH, webpackConfigWithExternals);

      const result = bundleGrafanaUI(context, {});

      // externals.ts should be updated
      const externalsContent = result.getFile(EXTERNALS_PATH) || '';
      expect(externalsContent).not.toMatch(/\/\^@grafana\\\/ui\/i/);
      expect(externalsContent).toMatch(/['"]react-inlinesvg['"]/);

      // webpack.config.ts should NOT be updated (still has @grafana/ui)
      const webpackContent = result.getFile(WEBPACK_CONFIG_PATH) || '';
      expect(webpackContent).toMatch(/\/\^@grafana\\\/ui\/i/);
    });
  });

  describe('no config files', () => {
    it('should do nothing if no config files exist', () => {
      const context = new Context('/virtual');

      const result = bundleGrafanaUI(context, {});

      expect(result.hasChanges()).toBe(false);
    });
  });

  describe('grafanaDependency version check', () => {
    it('should bump grafanaDependency to 10.2.0 if lower', () => {
      const context = new Context('/virtual');
      context.addFile(EXTERNALS_PATH, defaultExternalsContent);
      context.addFile(
        PLUGIN_JSON_PATH,
        JSON.stringify({
          id: 'test-plugin',
          dependencies: {
            grafanaDependency: '>=9.0.0',
          },
        })
      );

      const result = bundleGrafanaUI(context, {});

      const pluginJson = JSON.parse(result.getFile(PLUGIN_JSON_PATH) || '{}');
      expect(pluginJson.dependencies.grafanaDependency).toBe('>=10.2.0');
    });

    it('should not change grafanaDependency if already >= 10.2.0', () => {
      const context = new Context('/virtual');
      context.addFile(EXTERNALS_PATH, defaultExternalsContent);
      context.addFile(
        PLUGIN_JSON_PATH,
        JSON.stringify({
          id: 'test-plugin',
          dependencies: {
            grafanaDependency: '>=11.0.0',
          },
        })
      );

      const result = bundleGrafanaUI(context, {});

      const pluginJson = JSON.parse(result.getFile(PLUGIN_JSON_PATH) || '{}');
      expect(pluginJson.dependencies.grafanaDependency).toBe('>=11.0.0');
    });

    it('should add dependencies object if missing', () => {
      const context = new Context('/virtual');
      context.addFile(EXTERNALS_PATH, defaultExternalsContent);
      context.addFile(
        PLUGIN_JSON_PATH,
        JSON.stringify({
          id: 'test-plugin',
        })
      );

      const result = bundleGrafanaUI(context, {});

      const pluginJson = JSON.parse(result.getFile(PLUGIN_JSON_PATH) || '{}');
      expect(pluginJson.dependencies.grafanaDependency).toBe('>=10.2.0');
    });

    it('should handle version with exact match (10.2.0)', () => {
      const context = new Context('/virtual');
      context.addFile(EXTERNALS_PATH, defaultExternalsContent);
      context.addFile(
        PLUGIN_JSON_PATH,
        JSON.stringify({
          id: 'test-plugin',
          dependencies: {
            grafanaDependency: '>=10.2.0',
          },
        })
      );

      const result = bundleGrafanaUI(context, {});

      const pluginJson = JSON.parse(result.getFile(PLUGIN_JSON_PATH) || '{}');
      expect(pluginJson.dependencies.grafanaDependency).toBe('>=10.2.0');
    });
  });
});
