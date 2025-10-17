import * as recast from 'recast';

import { addDependenciesToPackageJson, additionsDebug } from '../utils.js';
import { coerce, gte } from 'semver';
import { parseDocument, stringify } from 'yaml';

import type { Context } from '../../migrations/context.js';

const { builders } = recast.types;

export type I18nOptions = {
  locales: string[];
};

export default function migrate(context: Context, options: I18nOptions = { locales: ['en-US'] }): Context {
  const { locales } = options;

  additionsDebug('Adding i18n support with locales:', locales);

  // Check if i18n is already configured
  if (isI18nConfigured(context)) {
    additionsDebug('i18n already configured, skipping');
    return context;
  }

  // 1. Update docker-compose.yaml with feature toggle
  updateDockerCompose(context);

  // 2. Update plugin.json with languages and grafanaDependency
  updatePluginJson(context, locales);

  // 3. Create locale folders and files
  createLocaleFiles(context, locales);

  // 4. Add @grafana/i18n dependency
  addI18nDependency(context);

  // 5. Update eslint.config.mjs if needed
  updateEslintConfig(context);

  // 6. Add i18n initialization to module file
  addI18nInitialization(context);

  // 7. Add i18next-cli as dev dependency and add script
  addI18nextCli(context);

  // 8. Create i18next.config.ts
  createI18nextConfig(context);

  return context;
}

function isI18nConfigured(context: Context): boolean {
  // Check if plugin.json has languages field
  if (!context.doesFileExist('src/plugin.json')) {
    return false;
  }

  const pluginJsonRaw = context.getFile('src/plugin.json');
  if (!pluginJsonRaw) {
    return false;
  }

  try {
    const pluginJson = JSON.parse(pluginJsonRaw);
    if (pluginJson.languages && Array.isArray(pluginJson.languages) && pluginJson.languages.length > 0) {
      additionsDebug('Found languages in plugin.json, i18n already configured');
      return true;
    }
  } catch (error) {
    additionsDebug('Error parsing plugin.json:', error);
  }

  return false;
}

function updateDockerCompose(context: Context): void {
  if (!context.doesFileExist('docker-compose.yaml')) {
    additionsDebug('docker-compose.yaml not found, skipping');
    return;
  }

  const composeContent = context.getFile('docker-compose.yaml');
  if (!composeContent) {
    return;
  }

  try {
    const composeDoc = parseDocument(composeContent);
    const currentEnv = composeDoc.getIn(['services', 'grafana', 'environment']);

    if (!currentEnv) {
      additionsDebug('No environment section found in docker-compose.yaml, skipping');
      return;
    }

    // Check if the feature toggle is already set
    if (typeof currentEnv === 'object') {
      const envMap = currentEnv as any;
      const toggleValue = envMap.get('GF_FEATURE_TOGGLES_ENABLE');

      if (toggleValue) {
        const toggleStr = toggleValue.toString();
        if (toggleStr.includes('localizationForPlugins')) {
          additionsDebug('localizationForPlugins already in GF_FEATURE_TOGGLES_ENABLE');
          return;
        }
        // Append to existing feature toggles
        composeDoc.setIn(
          ['services', 'grafana', 'environment', 'GF_FEATURE_TOGGLES_ENABLE'],
          `${toggleStr},localizationForPlugins`
        );
      } else {
        // Set new feature toggle
        composeDoc.setIn(['services', 'grafana', 'environment', 'GF_FEATURE_TOGGLES_ENABLE'], 'localizationForPlugins');
      }

      context.updateFile('docker-compose.yaml', stringify(composeDoc));
      additionsDebug('Updated docker-compose.yaml with localizationForPlugins feature toggle');
    }
  } catch (error) {
    additionsDebug('Error updating docker-compose.yaml:', error);
  }
}

function updatePluginJson(context: Context, locales: string[]): void {
  if (!context.doesFileExist('src/plugin.json')) {
    additionsDebug('src/plugin.json not found, skipping');
    return;
  }

  const pluginJsonRaw = context.getFile('src/plugin.json');
  if (!pluginJsonRaw) {
    return;
  }

  try {
    const pluginJson = JSON.parse(pluginJsonRaw);

    // Add languages array
    pluginJson.languages = locales;

    // Ensure grafanaDependency is >= 12.1.0
    if (!pluginJson.dependencies) {
      pluginJson.dependencies = {};
    }

    const currentGrafanaDep = pluginJson.dependencies.grafanaDependency || '>=11.0.0';
    const minVersion = coerce('12.1.0');
    const currentVersion = coerce(currentGrafanaDep.replace(/^[><=]+/, ''));

    if (!currentVersion || !minVersion || !gte(currentVersion, minVersion)) {
      pluginJson.dependencies.grafanaDependency = '>=12.1.0';
      additionsDebug('Updated grafanaDependency to >=12.1.0');
    }

    context.updateFile('src/plugin.json', JSON.stringify(pluginJson, null, 2));
    additionsDebug('Updated src/plugin.json with languages:', locales);
  } catch (error) {
    additionsDebug('Error updating src/plugin.json:', error);
  }
}

function createLocaleFiles(context: Context, locales: string[]): void {
  // Get plugin ID from plugin.json
  const pluginJsonRaw = context.getFile('src/plugin.json');
  if (!pluginJsonRaw) {
    additionsDebug('Cannot create locale files without plugin.json');
    return;
  }

  try {
    const pluginJson = JSON.parse(pluginJsonRaw);
    const pluginId = pluginJson.id;

    if (!pluginId) {
      additionsDebug('No plugin ID found in plugin.json');
      return;
    }

    // Create locale files for each locale
    for (const locale of locales) {
      const localePath = `src/locales/${locale}/${pluginId}.json`;

      if (!context.doesFileExist(localePath)) {
        context.addFile(localePath, JSON.stringify({}, null, 2));
        additionsDebug(`Created ${localePath}`);
      }
    }
  } catch (error) {
    additionsDebug('Error creating locale files:', error);
  }
}

function addI18nDependency(context: Context): void {
  addDependenciesToPackageJson(context, { '@grafana/i18n': '^1.0.0' }, {});
  additionsDebug('Added @grafana/i18n dependency');
}

function addI18nextCli(context: Context): void {
  // Add i18next-cli as dev dependency
  addDependenciesToPackageJson(context, {}, { 'i18next-cli': '^1.1.1' });

  // Add i18n-extract script to package.json
  const packageJsonRaw = context.getFile('package.json');
  if (!packageJsonRaw) {
    return;
  }

  try {
    const packageJson = JSON.parse(packageJsonRaw);

    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }

    // Only add if not already present
    if (!packageJson.scripts['i18n-extract']) {
      packageJson.scripts['i18n-extract'] = 'i18next-cli extract --sync-primary';
      context.updateFile('package.json', JSON.stringify(packageJson, null, 2));
      additionsDebug('Added i18n-extract script to package.json');
    }
  } catch (error) {
    additionsDebug('Error adding i18n-extract script:', error);
  }
}

function updateEslintConfig(context: Context): void {
  if (!context.doesFileExist('eslint.config.mjs')) {
    additionsDebug('eslint.config.mjs not found, skipping');
    return;
  }

  const eslintConfigRaw = context.getFile('eslint.config.mjs');
  if (!eslintConfigRaw) {
    return;
  }

  // Check if @grafana/eslint-plugin-plugins is already configured
  if (eslintConfigRaw.includes('@grafana/eslint-plugin-plugins')) {
    additionsDebug('ESLint i18n rule already configured');
    return;
  }

  try {
    const ast = recast.parse(eslintConfigRaw, {
      parser: require('recast/parsers/babel-ts'),
    });

    // Find the import section and add the plugin import
    const imports = ast.program.body.filter((node: any) => node.type === 'ImportDeclaration');
    const lastImport = imports[imports.length - 1];

    if (lastImport) {
      const pluginImport = builders.importDeclaration(
        [builders.importDefaultSpecifier(builders.identifier('grafanaPluginsPlugin'))],
        builders.literal('@grafana/eslint-plugin-plugins')
      );

      const lastImportIndex = ast.program.body.indexOf(lastImport);
      ast.program.body.splice(lastImportIndex + 1, 0, pluginImport);
    }

    // Find the defineConfig array and add the plugin config
    recast.visit(ast, {
      visitCallExpression(path: any) {
        if (path.node.callee.name === 'defineConfig' && path.node.arguments[0]?.type === 'ArrayExpression') {
          const configArray = path.node.arguments[0];

          // Add the grafana plugins config object
          const pluginsConfig = builders.objectExpression([
            builders.property(
              'init',
              builders.identifier('plugins'),
              builders.objectExpression([
                builders.property(
                  'init',
                  builders.literal('grafanaPlugins'),
                  builders.identifier('grafanaPluginsPlugin')
                ),
              ])
            ),
            builders.property(
              'init',
              builders.identifier('rules'),
              builders.objectExpression([
                builders.property(
                  'init',
                  builders.literal('grafanaPlugins/no-untranslated-strings'),
                  builders.literal('warn')
                ),
              ])
            ),
          ]);

          configArray.elements.push(pluginsConfig);
        }
        this.traverse(path);
      },
    });

    const output = recast.print(ast, {
      tabWidth: 2,
      trailingComma: true,
      lineTerminator: '\n',
    }).code;

    context.updateFile('eslint.config.mjs', output);
    additionsDebug('Updated eslint.config.mjs with i18n linting rules');
  } catch (error) {
    additionsDebug('Error updating eslint.config.mjs:', error);
  }
}

function createI18nextConfig(context: Context): void {
  if (context.doesFileExist('i18next.config.ts')) {
    additionsDebug('i18next.config.ts already exists, skipping');
    return;
  }

  const pluginJsonRaw = context.getFile('src/plugin.json');
  if (!pluginJsonRaw) {
    additionsDebug('Cannot create i18next.config.ts without plugin.json');
    return;
  }

  try {
    const pluginJson = JSON.parse(pluginJsonRaw);
    const pluginId = pluginJson.id;

    if (!pluginId) {
      additionsDebug('No plugin ID found in plugin.json');
      return;
    }

    const i18nextConfig = `import { defineConfig } from 'i18next-cli';
import pluginJson from './src/plugin.json';

export default defineConfig({
  locales: pluginJson.languages,
  extract: {
    input: ['src/**/*.{tsx,ts}'],
    output: 'src/locales/{{language}}/{{namespace}}.json',
    defaultNS: pluginJson.id,
    functions: ['t', '*.t'],
    transComponents: ['Trans'],
  },
});
`;

    context.addFile('i18next.config.ts', i18nextConfig);
    additionsDebug('Created i18next.config.ts');
  } catch (error) {
    additionsDebug('Error creating i18next.config.ts:', error);
  }
}

function addI18nInitialization(context: Context): void {
  // Find module.ts or module.tsx
  const moduleTsPath = context.doesFileExist('src/module.ts')
    ? 'src/module.ts'
    : context.doesFileExist('src/module.tsx')
      ? 'src/module.tsx'
      : null;

  if (!moduleTsPath) {
    additionsDebug('No module.ts or module.tsx found, skipping i18n initialization');
    return;
  }

  const moduleContent = context.getFile(moduleTsPath);
  if (!moduleContent) {
    return;
  }

  // Check if i18n is already initialized
  if (moduleContent.includes('@grafana/i18n')) {
    additionsDebug('i18n already initialized in module file');
    return;
  }

  try {
    const ast = recast.parse(moduleContent, {
      parser: require('recast/parsers/babel-ts'),
    });

    // Add import for i18n
    const i18nImport = builders.importDeclaration(
      [builders.importSpecifier(builders.identifier('i18n'))],
      builders.literal('@grafana/i18n')
    );

    // Add the import after the first import statement
    const firstImportIndex = ast.program.body.findIndex((node: any) => node.type === 'ImportDeclaration');
    if (firstImportIndex !== -1) {
      ast.program.body.splice(firstImportIndex + 1, 0, i18nImport);
    } else {
      ast.program.body.unshift(i18nImport);
    }

    const output = recast.print(ast, {
      tabWidth: 2,
      trailingComma: true,
      lineTerminator: '\n',
    }).code;

    context.updateFile(moduleTsPath, output);
    additionsDebug(`Updated ${moduleTsPath} with i18n import`);
  } catch (error) {
    additionsDebug('Error updating module file:', error);
  }
}
