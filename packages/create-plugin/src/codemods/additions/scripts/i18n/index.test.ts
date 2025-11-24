import { describe, expect, it } from 'vitest';
import * as v from 'valibot';

import { Context } from '../../../context.js';
import i18nAddition, { schema } from './index.js';

describe('i18n addition', () => {
  describe('schema validation', () => {
    it('should require locales to be provided', () => {
      const result = v.safeParse(schema, {});
      expect(result.success).toBe(false);
      if (!result.success) {
        const errorMessage = result.issues[0].message;
        expect(errorMessage).toContain('comma-separated list');
        expect(errorMessage).toContain('en-US,es-ES,sv-SE');
      }
    });

    it('should validate locale format', () => {
      const result = v.safeParse(schema, { locales: ['invalid'] });
      expect(result.success).toBe(false);
      if (!result.success) {
        const errorMessage = result.issues[0].message;
        expect(errorMessage).toContain('xx-XX');
        expect(errorMessage).toContain('en-US');
        expect(errorMessage).toContain('sv-SE');
      }
    });

    it('should accept valid locales as array', () => {
      const result = v.safeParse(schema, { locales: ['en-US', 'es-ES', 'sv-SE'] });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.output.locales).toEqual(['en-US', 'es-ES', 'sv-SE']);
      }
    });

    it('should parse comma-separated string into array (CLI format)', () => {
      const result = v.safeParse(schema, { locales: 'en-US,es-ES,sv-SE' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.output.locales).toEqual(['en-US', 'es-ES', 'sv-SE']);
      }
    });

    it('should trim whitespace from comma-separated values', () => {
      const result = v.safeParse(schema, { locales: 'en-US, es-ES , sv-SE' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.output.locales).toEqual(['en-US', 'es-ES', 'sv-SE']);
      }
    });
  });

  it('should add i18n support with en-US locale', () => {
    const context = new Context('/virtual');

    // Set up a minimal plugin structure with Grafana 11.0.0 (needs backward compatibility)
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
    context.addFile(
      'docker-compose.yaml',
      `services:
  grafana:
    environment:
      FOO: bar`
    );
    context.addFile('package.json', JSON.stringify({ dependencies: {}, devDependencies: {}, scripts: {} }));
    context.addFile(
      'eslint.config.mjs',
      'import { defineConfig } from "eslint/config";\nexport default defineConfig([]);'
    );
    context.addFile(
      'src/module.ts',
      'import { PanelPlugin } from "@grafana/data";\nexport const plugin = new PanelPlugin();'
    );

    const result = i18nAddition(context, { locales: ['en-US'] });

    // Check plugin.json was updated
    const pluginJson = JSON.parse(result.getFile('src/plugin.json') || '{}');
    expect(pluginJson.languages).toEqual(['en-US']);
    // Should stay at 11.0.0 for backward compatibility
    expect(pluginJson.dependencies.grafanaDependency).toBe('>=11.0.0');

    // Check locale file was created
    expect(result.doesFileExist('src/locales/en-US/test-plugin.json')).toBe(true);
    const localeContent = result.getFile('src/locales/en-US/test-plugin.json');
    const localeData = JSON.parse(localeContent || '{}');
    expect(localeData).toEqual({}); // Should be an empty object

    // Check package.json was updated with dependencies
    const packageJson = JSON.parse(result.getFile('package.json') || '{}');
    expect(packageJson.dependencies['@grafana/i18n']).toBe('12.2.2');
    expect(packageJson.dependencies['semver']).toBe('^7.6.0');
    expect(packageJson.devDependencies['@types/semver']).toBe('^7.5.0');
    expect(packageJson.devDependencies['i18next-cli']).toBeDefined();
    expect(packageJson.scripts['i18n-extract']).toBe('i18next-cli extract --sync-primary');

    // Check docker-compose.yaml was updated with feature toggle
    const dockerCompose = result.getFile('docker-compose.yaml');
    expect(dockerCompose).toContain('localizationForPlugins');

    // Check module.ts was updated with backward compatibility code
    const moduleTs = result.getFile('src/module.ts');
    expect(moduleTs).toContain('initPluginTranslations');
    expect(moduleTs).toContain('semver');
    expect(moduleTs).toContain('loadResources');

    // Check loadResources.ts was created for backward compatibility
    expect(result.doesFileExist('src/loadResources.ts')).toBe(true);
    const loadResources = result.getFile('src/loadResources.ts');
    expect(loadResources).toContain('ResourceLoader');

    // Check i18next.config.ts was created
    expect(result.doesFileExist('i18next.config.ts')).toBe(true);
    const i18nextConfig = result.getFile('i18next.config.ts');
    expect(i18nextConfig).toContain('defineConfig');
    expect(i18nextConfig).toContain('pluginJson.id');
  });

  it('should add i18n support with multiple locales', () => {
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
    context.addFile(
      'docker-compose.yaml',
      `services:
  grafana:
    environment:
      FOO: bar`
    );
    context.addFile('package.json', JSON.stringify({ dependencies: {}, devDependencies: {}, scripts: {} }));
    context.addFile(
      'eslint.config.mjs',
      'import { defineConfig } from "eslint/config";\nexport default defineConfig([]);'
    );
    context.addFile(
      'src/module.ts',
      'import { PanelPlugin } from "@grafana/data";\nexport const plugin = new PanelPlugin();'
    );

    const result = i18nAddition(context, { locales: ['en-US', 'es-ES', 'sv-SE'] });

    // Check plugin.json has all locales
    const pluginJson = JSON.parse(result.getFile('src/plugin.json') || '{}');
    expect(pluginJson.languages).toEqual(['en-US', 'es-ES', 'sv-SE']);

    // Check all locale files were created
    expect(result.doesFileExist('src/locales/en-US/test-plugin.json')).toBe(true);
    expect(result.doesFileExist('src/locales/es-ES/test-plugin.json')).toBe(true);
    expect(result.doesFileExist('src/locales/sv-SE/test-plugin.json')).toBe(true);
  });

  it('should handle adding additional locales when i18n is already configured', () => {
    const context = new Context('/virtual');

    // Set up a plugin with i18n already configured
    context.addFile(
      'src/plugin.json',
      JSON.stringify({
        id: 'test-plugin',
        type: 'panel',
        name: 'Test Plugin',
        languages: ['en-US'], // Already configured
        dependencies: {
          grafanaDependency: '>=12.1.0',
        },
      })
    );
    context.addFile(
      'docker-compose.yaml',
      `services:
  grafana:
    environment:
      GF_FEATURE_TOGGLES_ENABLE: localizationForPlugins`
    );
    context.addFile('package.json', JSON.stringify({ dependencies: {}, devDependencies: {}, scripts: {} }));
    context.addFile(
      'eslint.config.mjs',
      'import { defineConfig } from "eslint/config";\nexport default defineConfig([]);'
    );
    context.addFile(
      'src/module.ts',
      'import { PanelPlugin } from "@grafana/data";\nimport { initPluginTranslations } from "@grafana/i18n";\nimport pluginJson from "plugin.json";\nawait initPluginTranslations(pluginJson.id);\nexport const plugin = new PanelPlugin();'
    );
    context.addFile('src/locales/en-US/test-plugin.json', JSON.stringify({ existing: 'translation' }));

    const result = i18nAddition(context, { locales: ['en-US', 'es-ES'] });

    // Should keep existing en-US locale file unchanged
    const enUSContent = result.getFile('src/locales/en-US/test-plugin.json');
    expect(JSON.parse(enUSContent || '{}')).toEqual({ existing: 'translation' });

    // Should create the new es-ES locale file
    expect(result.doesFileExist('src/locales/es-ES/test-plugin.json')).toBe(true);

    // Should update plugin.json with both locales (defensive update)
    const pluginJson = JSON.parse(result.getFile('src/plugin.json') || '{}');
    expect(pluginJson.languages).toEqual(['en-US', 'es-ES']);

    // Should not duplicate existing configurations
    const moduleTs = result.getFile('src/module.ts');
    const initCallCount = (moduleTs?.match(/initPluginTranslations/g) || []).length;
    expect(initCallCount).toBe(2); // 1 import + 1 call, not duplicated
  });

  it('should handle existing feature toggles in docker-compose.yaml (Grafana >= 12.1.0)', () => {
    const context = new Context('/virtual');

    context.addFile(
      'src/plugin.json',
      JSON.stringify({
        id: 'test-plugin',
        type: 'panel',
        name: 'Test Plugin',
        dependencies: {
          grafanaDependency: '>=12.1.0',
        },
      })
    );
    context.addFile(
      'docker-compose.yaml',
      `services:
  grafana:
    environment:
      GF_FEATURE_TOGGLES_ENABLE: someOtherFeature`
    );
    context.addFile('package.json', JSON.stringify({ dependencies: {}, devDependencies: {}, scripts: {} }));
    context.addFile(
      'eslint.config.mjs',
      'import { defineConfig } from "eslint/config";\nexport default defineConfig([]);'
    );
    context.addFile(
      'src/module.ts',
      'import { PanelPlugin } from "@grafana/data";\nexport const plugin = new PanelPlugin();'
    );

    const result = i18nAddition(context, { locales: ['en-US'] });

    const dockerCompose = result.getFile('docker-compose.yaml');
    expect(dockerCompose).toContain('someOtherFeature,localizationForPlugins');
  });

  it('should work with module.tsx instead of module.ts', () => {
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
    context.addFile(
      'docker-compose.yaml',
      `services:
  grafana:
    environment:
      FOO: bar`
    );
    context.addFile('package.json', JSON.stringify({ dependencies: {}, devDependencies: {}, scripts: {} }));
    context.addFile(
      'eslint.config.mjs',
      'import { defineConfig } from "eslint/config";\nexport default defineConfig([]);'
    );
    context.addFile(
      'src/module.tsx',
      'import { PanelPlugin } from "@grafana/data";\nexport const plugin = new PanelPlugin();'
    );

    const result = i18nAddition(context, { locales: ['en-US'] });

    const moduleTsx = result.getFile('src/module.tsx');
    expect(moduleTsx).toContain('@grafana/i18n');
  });

  it('should not update grafanaDependency if it is already >= 12.1.0', () => {
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
    context.addFile(
      'docker-compose.yaml',
      `services:
  grafana:
    environment:
      FOO: bar`
    );
    context.addFile('package.json', JSON.stringify({ dependencies: {}, devDependencies: {}, scripts: {} }));
    context.addFile(
      'eslint.config.mjs',
      'import { defineConfig } from "eslint/config";\nexport default defineConfig([]);'
    );
    context.addFile(
      'src/module.ts',
      'import { PanelPlugin } from "@grafana/data";\nexport const plugin = new PanelPlugin();'
    );

    const result = i18nAddition(context, { locales: ['en-US'] });

    const pluginJson = JSON.parse(result.getFile('src/plugin.json') || '{}');
    expect(pluginJson.dependencies.grafanaDependency).toBe('>=13.0.0');
  });

  it('should handle plugins without existing scripts in package.json', () => {
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
    context.addFile(
      'docker-compose.yaml',
      `services:
  grafana:
    environment:
      FOO: bar`
    );
    context.addFile('package.json', JSON.stringify({ dependencies: {}, devDependencies: {} })); // No scripts field
    context.addFile(
      'eslint.config.mjs',
      'import { defineConfig } from "eslint/config";\nexport default defineConfig([]);'
    );
    context.addFile(
      'src/module.ts',
      'import { PanelPlugin } from "@grafana/data";\nexport const plugin = new PanelPlugin();'
    );

    const result = i18nAddition(context, { locales: ['en-US'] });

    const packageJson = JSON.parse(result.getFile('package.json') || '{}');
    expect(packageJson.scripts['i18n-extract']).toBe('i18next-cli extract --sync-primary');
  });

  it('should not add ESLint config if already present', () => {
    const context = new Context('/virtual');

    context.addFile(
      'src/plugin.json',
      JSON.stringify({
        id: 'test-plugin',
        type: 'panel',
        name: 'Test Plugin',
        dependencies: {
          grafanaDependency: '>=12.1.0',
        },
      })
    );
    context.addFile(
      'docker-compose.yaml',
      `services:
  grafana:
    environment:
      FOO: bar`
    );
    context.addFile('package.json', JSON.stringify({ dependencies: {}, devDependencies: {}, scripts: {} }));
    context.addFile(
      'eslint.config.mjs',
      'import { defineConfig } from "eslint/config";\nimport grafanaI18nPlugin from "@grafana/i18n/eslint-plugin";\nexport default defineConfig([]);'
    );
    context.addFile(
      'src/module.ts',
      'import { PanelPlugin } from "@grafana/data";\nexport const plugin = new PanelPlugin();'
    );

    const result = i18nAddition(context, { locales: ['en-US'] });

    // The ESLint config should remain unchanged
    const eslintConfig = result.getFile('eslint.config.mjs');
    expect(eslintConfig).toContain('@grafana/i18n/eslint-plugin');
    // Should not have duplicate imports or configs
    const importCount = (eslintConfig?.match(/@grafana\/i18n\/eslint-plugin/g) || []).length;
    expect(importCount).toBe(1);
  });

  it('should not create locale files if they already exist', () => {
    const context = new Context('/virtual');

    context.addFile(
      'src/plugin.json',
      JSON.stringify({
        id: 'test-plugin',
        type: 'panel',
        name: 'Test Plugin',
        dependencies: {
          grafanaDependency: '>=12.1.0',
        },
      })
    );
    context.addFile(
      'docker-compose.yaml',
      `services:
  grafana:
    environment:
      FOO: bar`
    );
    context.addFile('package.json', JSON.stringify({ dependencies: {}, devDependencies: {}, scripts: {} }));
    context.addFile(
      'eslint.config.mjs',
      'import { defineConfig } from "eslint/config";\nexport default defineConfig([]);'
    );
    context.addFile(
      'src/module.ts',
      'import { PanelPlugin } from "@grafana/data";\nexport const plugin = new PanelPlugin();'
    );
    // Pre-existing locale file with custom content
    const customTranslations = JSON.stringify({ custom: { key: 'value' } }, null, 2);
    context.addFile('src/locales/en-US/test-plugin.json', customTranslations);

    const result = i18nAddition(context, { locales: ['en-US'] });

    // The existing locale file should remain unchanged
    const localeContent = result.getFile('src/locales/en-US/test-plugin.json');
    expect(localeContent).toBe(customTranslations);
  });

  it('should not add i18n initialization if already present', () => {
    const context = new Context('/virtual');

    context.addFile(
      'src/plugin.json',
      JSON.stringify({
        id: 'test-plugin',
        type: 'panel',
        name: 'Test Plugin',
        dependencies: {
          grafanaDependency: '>=12.1.0',
        },
      })
    );
    context.addFile(
      'docker-compose.yaml',
      `services:
  grafana:
    environment:
      FOO: bar`
    );
    context.addFile('package.json', JSON.stringify({ dependencies: {}, devDependencies: {}, scripts: {} }));
    context.addFile(
      'eslint.config.mjs',
      'import { defineConfig } from "eslint/config";\nexport default defineConfig([]);'
    );
    const moduleWithI18n = `import { PanelPlugin } from "@grafana/data";
import { initPluginTranslations } from "@grafana/i18n";
import pluginJson from "plugin.json";

await initPluginTranslations(pluginJson.id);

export const plugin = new PanelPlugin();`;
    context.addFile('src/module.ts', moduleWithI18n);

    const result = i18nAddition(context, { locales: ['en-US'] });

    // The module file should remain unchanged (no duplicate imports/calls)
    const moduleTs = result.getFile('src/module.ts');
    const initCallCount = (moduleTs?.match(/initPluginTranslations/g) || []).length;
    expect(initCallCount).toBe(2); // 1 import + 1 call
  });

  it('should not create i18next.config.ts if it already exists', () => {
    const context = new Context('/virtual');

    context.addFile(
      'src/plugin.json',
      JSON.stringify({
        id: 'test-plugin',
        type: 'panel',
        name: 'Test Plugin',
        dependencies: {
          grafanaDependency: '>=12.1.0',
        },
      })
    );
    context.addFile(
      'docker-compose.yaml',
      `services:
  grafana:
    environment:
      FOO: bar`
    );
    context.addFile('package.json', JSON.stringify({ dependencies: {}, devDependencies: {}, scripts: {} }));
    context.addFile(
      'eslint.config.mjs',
      'import { defineConfig } from "eslint/config";\nexport default defineConfig([]);'
    );
    context.addFile(
      'src/module.ts',
      'import { PanelPlugin } from "@grafana/data";\nexport const plugin = new PanelPlugin();'
    );
    const customI18nextConfig = 'export default { custom: true };';
    context.addFile('i18next.config.ts', customI18nextConfig);

    const result = i18nAddition(context, { locales: ['en-US'] });

    // The existing i18next.config.ts should remain unchanged
    const i18nextConfig = result.getFile('i18next.config.ts');
    expect(i18nextConfig).toBe(customI18nextConfig);
  });

  it('should not create loadResources.ts if it already exists', () => {
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
    context.addFile(
      'docker-compose.yaml',
      `services:
  grafana:
    environment:
      FOO: bar`
    );
    context.addFile('package.json', JSON.stringify({ dependencies: {}, devDependencies: {}, scripts: {} }));
    context.addFile(
      'eslint.config.mjs',
      'import { defineConfig } from "eslint/config";\nexport default defineConfig([]);'
    );
    context.addFile(
      'src/module.ts',
      'import { PanelPlugin } from "@grafana/data";\nexport const plugin = new PanelPlugin();'
    );
    const customLoadResources = 'export const loadResources = () => {};';
    context.addFile('src/loadResources.ts', customLoadResources);

    const result = i18nAddition(context, { locales: ['en-US'] });

    // The existing loadResources.ts should remain unchanged
    const loadResources = result.getFile('src/loadResources.ts');
    expect(loadResources).toBe(customLoadResources);
  });

  it('should not add i18n-extract script if it already exists', () => {
    const context = new Context('/virtual');

    context.addFile(
      'src/plugin.json',
      JSON.stringify({
        id: 'test-plugin',
        type: 'panel',
        name: 'Test Plugin',
        dependencies: {
          grafanaDependency: '>=12.1.0',
        },
      })
    );
    context.addFile(
      'docker-compose.yaml',
      `services:
  grafana:
    environment:
      FOO: bar`
    );
    context.addFile(
      'package.json',
      JSON.stringify({
        dependencies: {},
        devDependencies: {},
        scripts: {
          'i18n-extract': 'custom extract command',
        },
      })
    );
    context.addFile(
      'eslint.config.mjs',
      'import { defineConfig } from "eslint/config";\nexport default defineConfig([]);'
    );
    context.addFile(
      'src/module.ts',
      'import { PanelPlugin } from "@grafana/data";\nexport const plugin = new PanelPlugin();'
    );

    const result = i18nAddition(context, { locales: ['en-US'] });

    // The existing i18n-extract script should remain unchanged
    const packageJson = JSON.parse(result.getFile('package.json') || '{}');
    expect(packageJson.scripts['i18n-extract']).toBe('custom extract command');
  });

  it('should add feature toggle to docker-compose for Grafana >= 12.1.0', () => {
    const context = new Context('/virtual');

    context.addFile(
      'src/plugin.json',
      JSON.stringify({
        id: 'test-plugin',
        type: 'panel',
        name: 'Test Plugin',
        dependencies: {
          grafanaDependency: '>=12.1.0',
        },
      })
    );
    context.addFile(
      'docker-compose.yaml',
      `services:
  grafana:
    environment:
      FOO: bar`
    );
    context.addFile('package.json', JSON.stringify({ dependencies: {}, devDependencies: {}, scripts: {} }));
    context.addFile(
      'eslint.config.mjs',
      'import { defineConfig } from "eslint/config";\nexport default defineConfig([]);'
    );
    context.addFile(
      'src/module.ts',
      'import { PanelPlugin } from "@grafana/data";\nexport const plugin = new PanelPlugin();'
    );

    const result = i18nAddition(context, { locales: ['en-US'] });

    const dockerCompose = result.getFile('docker-compose.yaml');
    expect(dockerCompose).toContain('GF_FEATURE_TOGGLES_ENABLE: localizationForPlugins');

    // Should not add backward compatibility dependencies
    const packageJson = JSON.parse(result.getFile('package.json') || '{}');
    expect(packageJson.dependencies['semver']).toBeUndefined();
    expect(packageJson.devDependencies['@types/semver']).toBeUndefined();

    // Should not create loadResources.ts
    expect(result.doesFileExist('src/loadResources.ts')).toBe(false);

    // Module should not have semver imports
    const moduleTs = result.getFile('src/module.ts');
    expect(moduleTs).not.toContain('semver');
    expect(moduleTs).not.toContain('loadResources');
  });

  it('should not duplicate feature toggle if already present', () => {
    const context = new Context('/virtual');

    context.addFile(
      'src/plugin.json',
      JSON.stringify({
        id: 'test-plugin',
        type: 'panel',
        name: 'Test Plugin',
        dependencies: {
          grafanaDependency: '>=12.1.0',
        },
      })
    );
    context.addFile(
      'docker-compose.yaml',
      `services:
  grafana:
    environment:
      GF_FEATURE_TOGGLES_ENABLE: localizationForPlugins`
    );
    context.addFile('package.json', JSON.stringify({ dependencies: {}, devDependencies: {}, scripts: {} }));
    context.addFile(
      'eslint.config.mjs',
      'import { defineConfig } from "eslint/config";\nexport default defineConfig([]);'
    );
    context.addFile(
      'src/module.ts',
      'import { PanelPlugin } from "@grafana/data";\nexport const plugin = new PanelPlugin();'
    );

    const result = i18nAddition(context, { locales: ['en-US'] });

    const dockerCompose = result.getFile('docker-compose.yaml');
    // Should only have one instance of localizationForPlugins
    const toggleCount = (dockerCompose?.match(/localizationForPlugins/g) || []).length;
    expect(toggleCount).toBe(1);
  });

  it('should add correct ESLint config with proper rules and options', () => {
    const context = new Context('/virtual');

    context.addFile(
      'src/plugin.json',
      JSON.stringify({
        id: 'test-plugin',
        type: 'panel',
        name: 'Test Plugin',
        dependencies: {
          grafanaDependency: '>=12.1.0',
        },
      })
    );
    context.addFile(
      'docker-compose.yaml',
      `services:
  grafana:
    environment:
      FOO: bar`
    );
    context.addFile('package.json', JSON.stringify({ dependencies: {}, devDependencies: {}, scripts: {} }));
    context.addFile(
      'eslint.config.mjs',
      'import { defineConfig } from "eslint/config";\nexport default defineConfig([]);'
    );
    context.addFile(
      'src/module.ts',
      'import { PanelPlugin } from "@grafana/data";\nexport const plugin = new PanelPlugin();'
    );

    const result = i18nAddition(context, { locales: ['en-US'] });

    const eslintConfig = result.getFile('eslint.config.mjs');

    // Check correct import (recast uses double quotes)
    expect(eslintConfig).toContain('import grafanaI18nPlugin from "@grafana/i18n/eslint-plugin"');

    // Check plugin registration
    expect(eslintConfig).toContain('"@grafana/i18n": grafanaI18nPlugin');

    // Check rules are present
    expect(eslintConfig).toContain('"@grafana/i18n/no-untranslated-strings"');
    expect(eslintConfig).toContain('"@grafana/i18n/no-translation-top-level"');

    // Check rule configuration
    expect(eslintConfig).toContain('"error"');
    expect(eslintConfig).toContain('calleesToIgnore');
    expect(eslintConfig).toContain('"^css$"');
    expect(eslintConfig).toContain('"use[A-Z].*"');

    // Check config name
    expect(eslintConfig).toContain('name: "grafana/i18n-rules"');
  });
});
