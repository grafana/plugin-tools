import { coerce, gte } from 'semver';
import { parseDocument, stringify } from 'yaml';
import * as recast from 'recast';
import * as typeScriptParser from 'recast/parsers/typescript.js';

import type { Context } from '../../../context.js';
import { additionsDebug } from '../../../utils.js';

const { builders } = recast.types;

export function updateDockerCompose(context: Context): void {
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

export function updatePluginJson(context: Context, locales: string[], needsBackwardCompatibility: boolean): void {
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

export function createI18nextConfig(context: Context): void {
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

/**
 * Adds 'i18next' to an externals array if it's not already present
 * @returns true if changes were made, false otherwise
 */
function addI18nextToExternalsArray(externalsArray: recast.types.namedTypes.ArrayExpression): boolean {
  // Check if 'i18next' is already in the array
  const hasI18next = externalsArray.elements.some((element) => {
    if (
      element &&
      (element.type === 'Literal' || element.type === 'StringLiteral') &&
      typeof element.value === 'string'
    ) {
      return element.value === 'i18next';
    }
    return false;
  });

  if (hasI18next) {
    additionsDebug("'i18next' already in externals array");
    return false;
  }

  // Append 'i18next' to the end of the array
  externalsArray.elements.push(builders.literal('i18next'));
  additionsDebug("Added 'i18next' to externals array");
  return true;
}

export function ensureI18nextExternal(context: Context): void {
  try {
    additionsDebug('Checking for externals configuration...');

    // Try new structure first: .config/bundler/externals.ts
    const externalsPath = '.config/bundler/externals.ts';
    if (context.doesFileExist(externalsPath)) {
      additionsDebug(`Found ${externalsPath}, checking for i18next...`);
      const externalsContent = context.getFile(externalsPath);
      if (externalsContent) {
        try {
          const ast = recast.parse(externalsContent, {
            parser: typeScriptParser,
          });

          let hasChanges = false;

          // Find the externals array
          recast.visit(ast, {
            visitVariableDeclarator(path) {
              const { node } = path;

              if (
                node.id.type === 'Identifier' &&
                node.id.name === 'externals' &&
                node.init &&
                node.init.type === 'ArrayExpression'
              ) {
                additionsDebug('Found externals array in externals.ts');
                if (addI18nextToExternalsArray(node.init)) {
                  hasChanges = true;
                }
              }

              return this.traverse(path);
            },
          });

          // Only update the file if we made changes
          if (hasChanges) {
            const output = recast.print(ast, {
              tabWidth: 2,
              trailingComma: true,
              lineTerminator: '\n',
            });
            context.updateFile(externalsPath, output.code);
            additionsDebug(`Updated ${externalsPath} with i18next external`);
          }
          return;
        } catch (error) {
          additionsDebug(`Error updating ${externalsPath}:`, error);
        }
      }
    }

    // Fall back to legacy structure: .config/webpack/webpack.config.ts with inline externals
    const webpackConfigPath = '.config/webpack/webpack.config.ts';
    additionsDebug(`Checking for ${webpackConfigPath}...`);
    if (context.doesFileExist(webpackConfigPath)) {
      additionsDebug(`Found ${webpackConfigPath}, checking for inline externals...`);
      const webpackContent = context.getFile(webpackConfigPath);
      if (webpackContent) {
        try {
          const ast = recast.parse(webpackContent, {
            parser: typeScriptParser,
          });

          let hasChanges = false;
          let foundExternals = false;

          // Find the externals property in the Configuration object
          // It can be in baseConfig or any variable with an object initializer
          recast.visit(ast, {
            visitObjectExpression(path) {
              const { node } = path;
              const properties = node.properties;

              if (properties) {
                for (const prop of properties) {
                  // Handle both Property and ObjectProperty types
                  if (prop && (prop.type === 'Property' || prop.type === 'ObjectProperty')) {
                    const key = 'key' in prop ? prop.key : null;
                    const value = 'value' in prop ? prop.value : null;

                    if (
                      key &&
                      key.type === 'Identifier' &&
                      key.name === 'externals' &&
                      value &&
                      value.type === 'ArrayExpression'
                    ) {
                      foundExternals = true;
                      additionsDebug('Found externals property in webpack.config.ts');
                      if (addI18nextToExternalsArray(value)) {
                        hasChanges = true;
                      }
                      // Don't break, continue to check all object expressions
                    }
                  }
                }
              }

              return this.traverse(path);
            },
            visitProperty(path) {
              const { node } = path;

              // Also check properties directly (fallback)
              if (
                node.key &&
                node.key.type === 'Identifier' &&
                node.key.name === 'externals' &&
                node.value &&
                node.value.type === 'ArrayExpression'
              ) {
                if (!foundExternals) {
                  foundExternals = true;
                  additionsDebug('Found externals property in webpack.config.ts (via visitProperty)');
                }
                if (addI18nextToExternalsArray(node.value)) {
                  hasChanges = true;
                }
              }

              return this.traverse(path);
            },
          });

          if (!foundExternals) {
            additionsDebug('No externals property found in webpack.config.ts');
          }

          // Only update the file if we made changes
          if (hasChanges) {
            const output = recast.print(ast, {
              tabWidth: 2,
              trailingComma: true,
              lineTerminator: '\n',
            });
            context.updateFile(webpackConfigPath, output.code);
            additionsDebug(`Updated ${webpackConfigPath} with i18next external`);
          } else if (foundExternals) {
            additionsDebug('i18next already present in externals, no changes needed');
          }
          return;
        } catch (error) {
          additionsDebug(`Error updating ${webpackConfigPath}:`, error);
          additionsDebug(`Error details: ${error instanceof Error ? error.message : String(error)}`);
        }
      } else {
        additionsDebug(`File ${webpackConfigPath} exists but content is empty`);
      }
    } else {
      additionsDebug(`File ${webpackConfigPath} does not exist`);
    }

    additionsDebug('No externals configuration found, skipping i18next external check');
  } catch (error) {
    additionsDebug(
      `Unexpected error in ensureI18nextExternal: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
