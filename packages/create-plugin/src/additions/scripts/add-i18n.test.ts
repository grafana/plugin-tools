import { describe, expect, it } from 'vitest';

import { Context } from '../../migrations/context.js';
import migrate from './add-i18n.js';

describe('add-i18n', () => {
  it('should be idempotent', async () => {
    const context = new Context('/virtual');

    // Set up a minimal plugin structure
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
    context.addFile('docker-compose.yaml', 'services:\n  grafana:\n    environment:\n      FOO: bar');
    context.addFile('package.json', JSON.stringify({ dependencies: {}, devDependencies: {} }));
    context.addFile(
      'eslint.config.mjs',
      'import { defineConfig } from "eslint/config";\nexport default defineConfig([]);'
    );
    context.addFile(
      'src/module.ts',
      'import { PanelPlugin } from "@grafana/data";\nexport const plugin = new PanelPlugin();'
    );

    const migrateWithOptions = (ctx: Context) => migrate(ctx, { locales: ['en-US'] });
    await expect(migrateWithOptions).toBeIdempotent(context);
  });

  it('should add i18n support with a single locale', () => {
    const context = new Context('/virtual');

    // Set up a minimal plugin structure
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

    const result = migrate(context, { locales: ['en-US'] });

    // Check plugin.json was updated
    const pluginJson = JSON.parse(result.getFile('src/plugin.json') || '{}');
    expect(pluginJson.languages).toEqual(['en-US']);
    expect(pluginJson.dependencies.grafanaDependency).toBe('>=12.1.0');

    // Check locale file was created
    expect(result.doesFileExist('src/locales/en-US/test-plugin.json')).toBe(true);
    const localeContent = result.getFile('src/locales/en-US/test-plugin.json');
    expect(JSON.parse(localeContent || '{}')).toEqual({});

    // Check package.json was updated with dependencies
    const packageJson = JSON.parse(result.getFile('package.json') || '{}');
    expect(packageJson.dependencies['@grafana/i18n']).toBeDefined();
    expect(packageJson.devDependencies['i18next-cli']).toBeDefined();
    expect(packageJson.scripts['i18n-extract']).toBe('i18next-cli extract --sync-primary');

    // Check docker-compose.yaml was updated
    const dockerCompose = result.getFile('docker-compose.yaml');
    expect(dockerCompose).toContain('localizationForPlugins');

    // Check module.ts was updated
    const moduleTs = result.getFile('src/module.ts');
    expect(moduleTs).toContain('@grafana/i18n');

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

    const result = migrate(context, { locales: ['en-US', 'es-ES', 'sv-SE'] });

    // Check plugin.json has all locales
    const pluginJson = JSON.parse(result.getFile('src/plugin.json') || '{}');
    expect(pluginJson.languages).toEqual(['en-US', 'es-ES', 'sv-SE']);

    // Check all locale files were created
    expect(result.doesFileExist('src/locales/en-US/test-plugin.json')).toBe(true);
    expect(result.doesFileExist('src/locales/es-ES/test-plugin.json')).toBe(true);
    expect(result.doesFileExist('src/locales/sv-SE/test-plugin.json')).toBe(true);
  });

  it('should skip if i18n is already configured', () => {
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
      FOO: bar`
    );
    context.addFile('package.json', JSON.stringify({ dependencies: {}, devDependencies: {}, scripts: {} }));
    context.addFile(
      'eslint.config.mjs',
      'import { defineConfig } from "eslint/config";\nexport default defineConfig([]);'
    );
    context.addFile(
      'src/module.ts',
      'import { PanelPlugin } from "@grafana/data";\nimport { i18n } from "@grafana/i18n";\nexport const plugin = new PanelPlugin();'
    );

    // Flush the context to simulate these files existing on "disk"
    const initialChanges = Object.keys(context.listChanges()).length;

    const result = migrate(context, { locales: ['es-ES'] });

    // Should not add any NEW changes beyond the initial setup
    const finalChanges = Object.keys(result.listChanges()).length;
    expect(finalChanges).toBe(initialChanges);
  });

  it('should handle existing feature toggles in docker-compose.yaml', () => {
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

    const result = migrate(context, { locales: ['en-US'] });

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

    const result = migrate(context, { locales: ['en-US'] });

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

    const result = migrate(context, { locales: ['en-US'] });

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

    const result = migrate(context, { locales: ['en-US'] });

    const packageJson = JSON.parse(result.getFile('package.json') || '{}');
    expect(packageJson.scripts['i18n-extract']).toBe('i18next-cli extract --sync-primary');
  });
});
