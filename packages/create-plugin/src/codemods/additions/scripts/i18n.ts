import * as recast from 'recast';
import * as babelParser from 'recast/parsers/babel-ts.js';
import { coerce, gte } from 'semver';
import { parseDocument, stringify } from 'yaml';
import * as v from 'valibot';

import type { Context } from '../../context.js';
import { addDependenciesToPackageJson, additionsDebug } from '../../utils.js';

const { builders } = recast.types;

/**
 * I18n addition schema using Valibot
 * Adds internationalization support to a plugin
 */
export const schema = v.object(
  {
    locales: v.pipe(
      v.union([v.string(), v.array(v.string())]),
      v.transform((input) => {
        // Handle both string (from CLI) and array (from tests)
        return typeof input === 'string' ? input.split(',').map((s) => s.trim()) : input;
      }),
      v.array(
        v.pipe(
          v.string(),
          v.regex(/^[a-z]{2}-[A-Z]{2}$/, 'Locale must be in format xx-XX (e.g., en-US, es-ES, sv-SE)')
        ),
        'Please provide a comma-separated list of all supported locales, e.g., "en-US,es-ES,sv-SE"'
      ),
      v.minLength(1, 'Please provide a comma-separated list of all supported locales, e.g., "en-US,es-ES,sv-SE"')
    ),
  },
  'Please provide a comma-separated list of all supported locales, e.g., "en-US,es-ES,sv-SE"'
);

type I18nOptions = v.InferOutput<typeof schema>;

export default function i18nAddition(context: Context, options: I18nOptions): Context {
  const { locales } = options;

  additionsDebug('Adding i18n support with locales:', locales);

  // Determine if we need backward compatibility (Grafana < 12.1.0)
  const needsBackwardCompatibility = checkNeedsBackwardCompatibility(context);
  additionsDebug('Needs backward compatibility:', needsBackwardCompatibility);

  // 1. Update docker-compose.yaml with feature toggle
  updateDockerCompose(context);

  // 2. Update plugin.json with languages and grafanaDependency
  updatePluginJson(context, locales, needsBackwardCompatibility);

  // 3. Create locale folders and files with example translations
  createLocaleFiles(context, locales);

  // 4. Add @grafana/i18n dependency
  addI18nDependency(context);

  // 5. Add semver dependency for backward compatibility
  if (needsBackwardCompatibility) {
    addSemverDependency(context);
  }

  // 6. Update eslint.config.mjs if needed
  updateEslintConfig(context);

  // 7. Add i18n initialization to module file
  addI18nInitialization(context, needsBackwardCompatibility);

  // 8. Create loadResources.ts for backward compatibility
  if (needsBackwardCompatibility) {
    createLoadResourcesFile(context);
  }

  // 9. Add i18next-cli as dev dependency and add script
  addI18nextCli(context);

  // 10. Create i18next.config.ts
  createI18nextConfig(context);

  return context;
}

function checkNeedsBackwardCompatibility(context: Context): boolean {
  const pluginJsonRaw = context.getFile('src/plugin.json');
  if (!pluginJsonRaw) {
    return false;
  }

  try {
    const pluginJson = JSON.parse(pluginJsonRaw);
    const currentGrafanaDep = pluginJson.dependencies?.grafanaDependency || '>=11.0.0';
    const minVersion = coerce('12.1.0');
    const currentVersion = coerce(currentGrafanaDep.replace(/^[><=]+/, ''));

    // If current version is less than 12.1.0, we need backward compatibility
    if (currentVersion && minVersion && gte(currentVersion, minVersion)) {
      return false; // Already >= 12.1.0, no backward compat needed
    }
    return true; // < 12.1.0, needs backward compat
  } catch (error) {
    additionsDebug('Error checking backward compatibility:', error);
    return true; // Default to backward compat on error
  }
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

function updatePluginJson(context: Context, locales: string[], needsBackwardCompatibility: boolean): void {
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

    // Merge locales with existing languages (defensive: avoid duplicates)
    const existingLanguages = Array.isArray(pluginJson.languages) ? pluginJson.languages : [];
    const mergedLanguages = [...new Set([...existingLanguages, ...locales])];
    pluginJson.languages = mergedLanguages;

    // Update grafanaDependency based on backward compatibility needs
    if (!pluginJson.dependencies) {
      pluginJson.dependencies = {};
    }

    const currentGrafanaDep = pluginJson.dependencies.grafanaDependency || '>=11.0.0';
    const targetVersion = needsBackwardCompatibility ? '11.0.0' : '12.1.0';
    const minVersion = coerce(targetVersion);
    const currentVersion = coerce(currentGrafanaDep.replace(/^[><=]+/, ''));

    if (!currentVersion || !minVersion || !gte(currentVersion, minVersion)) {
      pluginJson.dependencies.grafanaDependency = `>=${targetVersion}`;
      additionsDebug(`Updated grafanaDependency to >=${targetVersion}`);
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

    // Create locale files for each locale (defensive: only if not already present)
    for (const locale of locales) {
      const localePath = `src/locales/${locale}/${pluginId}.json`;

      if (!context.doesFileExist(localePath)) {
        context.addFile(localePath, JSON.stringify({}, null, 2));
        additionsDebug(`Created ${localePath}`);
      } else {
        additionsDebug(`${localePath} already exists, skipping`);
      }
    }
  } catch (error) {
    additionsDebug('Error creating locale files:', error);
  }
}

function addI18nDependency(context: Context): void {
  addDependenciesToPackageJson(context, { '@grafana/i18n': '12.2.2' }, {});
  additionsDebug('Added @grafana/i18n dependency version 12.2.2');
}

function addSemverDependency(context: Context): void {
  // Add semver as regular dependency and @types/semver as dev dependency
  addDependenciesToPackageJson(context, { semver: '^7.6.0' }, { '@types/semver': '^7.5.0' });
  additionsDebug('Added semver dependency');
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

    // Defensive: only add if not already present
    if (!packageJson.scripts['i18n-extract']) {
      packageJson.scripts['i18n-extract'] = 'i18next-cli extract --sync-primary';
      context.updateFile('package.json', JSON.stringify(packageJson, null, 2));
      additionsDebug('Added i18n-extract script to package.json');
    } else {
      additionsDebug('i18n-extract script already exists, skipping');
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

  // Defensive: check if @grafana/i18n eslint plugin is already configured
  if (eslintConfigRaw.includes('@grafana/i18n/eslint-plugin')) {
    additionsDebug('ESLint i18n rule already configured');
    return;
  }

  try {
    const ast = recast.parse(eslintConfigRaw, {
      parser: babelParser,
    });

    // Find the import section and add the plugin import
    const imports = ast.program.body.filter((node: any) => node.type === 'ImportDeclaration');
    const lastImport = imports[imports.length - 1];

    if (lastImport) {
      const pluginImport = builders.importDeclaration(
        [builders.importDefaultSpecifier(builders.identifier('grafanaI18nPlugin'))],
        builders.literal('@grafana/i18n/eslint-plugin')
      );

      const lastImportIndex = ast.program.body.indexOf(lastImport);
      ast.program.body.splice(lastImportIndex + 1, 0, pluginImport);
    }

    // Find the defineConfig array and add the plugin config
    recast.visit(ast, {
      visitCallExpression(path: any) {
        if (path.node.callee.name === 'defineConfig' && path.node.arguments[0]?.type === 'ArrayExpression') {
          const configArray = path.node.arguments[0];

          // Add the grafana i18n config object
          const i18nConfig = builders.objectExpression([
            builders.property('init', builders.identifier('name'), builders.literal('grafana/i18n-rules')),
            builders.property(
              'init',
              builders.identifier('plugins'),
              builders.objectExpression([
                builders.property('init', builders.literal('@grafana/i18n'), builders.identifier('grafanaI18nPlugin')),
              ])
            ),
            builders.property(
              'init',
              builders.identifier('rules'),
              builders.objectExpression([
                builders.property(
                  'init',
                  builders.literal('@grafana/i18n/no-untranslated-strings'),
                  builders.arrayExpression([
                    builders.literal('error'),
                    builders.objectExpression([
                      builders.property(
                        'init',
                        builders.identifier('calleesToIgnore'),
                        builders.arrayExpression([builders.literal('^css$'), builders.literal('use[A-Z].*')])
                      ),
                    ]),
                  ])
                ),
                builders.property(
                  'init',
                  builders.literal('@grafana/i18n/no-translation-top-level'),
                  builders.literal('error')
                ),
              ])
            ),
          ]);

          configArray.elements.push(i18nConfig);
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
  // Defensive: skip if already exists
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

function addI18nInitialization(context: Context, needsBackwardCompatibility: boolean): void {
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

  // Defensive: check if i18n is already initialized
  if (moduleContent.includes('initPluginTranslations')) {
    additionsDebug('i18n already initialized in module file');
    return;
  }

  try {
    const ast = recast.parse(moduleContent, {
      parser: babelParser,
    });

    const imports = [];

    // Add necessary imports based on backward compatibility
    imports.push(
      builders.importDeclaration(
        [builders.importSpecifier(builders.identifier('initPluginTranslations'))],
        builders.literal('^@grafana/i18n')
      )
    );

    imports.push(
      builders.importDeclaration(
        [builders.importDefaultSpecifier(builders.identifier('pluginJson'))],
        builders.literal('plugin.json')
      )
    );

    if (needsBackwardCompatibility) {
      imports.push(
        builders.importDeclaration(
          [builders.importSpecifier(builders.identifier('config'))],
          builders.literal('@grafana/runtime')
        )
      );
      imports.push(
        builders.importDeclaration(
          [builders.importDefaultSpecifier(builders.identifier('semver'))],
          builders.literal('semver')
        )
      );
      imports.push(
        builders.importDeclaration(
          [builders.importSpecifier(builders.identifier('loadResources'))],
          builders.literal('./loadResources')
        )
      );
    }

    // Add imports after the first import statement
    const firstImportIndex = ast.program.body.findIndex((node: any) => node.type === 'ImportDeclaration');
    if (firstImportIndex !== -1) {
      ast.program.body.splice(firstImportIndex + 1, 0, ...imports);
    } else {
      ast.program.body.unshift(...imports);
    }

    // Add i18n initialization code
    const i18nInitCode = needsBackwardCompatibility
      ? `// Before Grafana version 12.1.0 the plugin is responsible for loading translation resources
// In Grafana version 12.1.0 and later Grafana is responsible for loading translation resources
const loaders = semver.lt(config?.buildInfo?.version, '12.1.0') ? [loadResources] : [];

await initPluginTranslations(pluginJson.id, loaders);`
      : `await initPluginTranslations(pluginJson.id);`;

    // Parse the initialization code and insert it at the top level (after imports)
    const initAst = recast.parse(i18nInitCode, {
      parser: babelParser,
    });

    // Find the last import index
    const lastImportIndex = ast.program.body.findLastIndex((node: any) => node.type === 'ImportDeclaration');
    if (lastImportIndex !== -1) {
      ast.program.body.splice(lastImportIndex + 1, 0, ...initAst.program.body);
    } else {
      ast.program.body.unshift(...initAst.program.body);
    }

    const output = recast.print(ast, {
      tabWidth: 2,
      trailingComma: true,
      lineTerminator: '\n',
    }).code;

    context.updateFile(moduleTsPath, output);
    additionsDebug(`Updated ${moduleTsPath} with i18n initialization`);
  } catch (error) {
    additionsDebug('Error updating module file:', error);
  }
}

function createLoadResourcesFile(context: Context): void {
  const loadResourcesPath = 'src/loadResources.ts';

  // Defensive: skip if already exists
  if (context.doesFileExist(loadResourcesPath)) {
    additionsDebug('loadResources.ts already exists, skipping');
    return;
  }

  const pluginJsonRaw = context.getFile('src/plugin.json');
  if (!pluginJsonRaw) {
    additionsDebug('Cannot create loadResources.ts without plugin.json');
    return;
  }

  const loadResourcesContent = `import { LANGUAGES, ResourceLoader, Resources } from '@grafana/i18n';
import pluginJson from 'plugin.json';

const resources = LANGUAGES.reduce<Record<string, () => Promise<{ default: Resources }>>>((acc, lang) => {
  acc[lang.code] = async () => await import(\`./locales/\${lang.code}/\${pluginJson.id}.json\`);
  return acc;
}, {});

export const loadResources: ResourceLoader = async (resolvedLanguage: string) => {
  try {
    const translation = await resources[resolvedLanguage]();
    return translation.default;
  } catch (error) {
    // This makes sure that the plugin doesn't crash when the resolved language in Grafana isn't supported by the plugin
    console.error(\`The plugin '\${pluginJson.id}' doesn't support the language '\${resolvedLanguage}'\`, error);
    return {};
  }
};
`;

  context.addFile(loadResourcesPath, loadResourcesContent);
  additionsDebug('Created src/loadResources.ts for backward compatibility');
}
