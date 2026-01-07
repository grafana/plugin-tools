import * as v from 'valibot';
import * as recast from 'recast';
import * as typeScriptParser from 'recast/parsers/typescript.js';
import { coerce, gte } from 'semver';

import type { Context } from '../../../context.js';
import { additionsDebug } from '../../../utils.js';
import { updateExternalsArray, type ExternalsArrayModifier } from '../../../utils.externals.js';

const { builders } = recast.types;

export const schema = v.object({});

type BundleGrafanaUIOptions = v.InferOutput<typeof schema>;

const PLUGIN_JSON_PATH = 'src/plugin.json';
const MIN_GRAFANA_VERSION = '10.2.0';
const WEBPACK_CONFIG_PATH = '.config/webpack/webpack.config.ts';
const RSPACK_CONFIG_PATH = '.config/rspack/rspack.config.ts';

/**
 * Checks if an AST node is a regex matching @grafana/ui
 * The pattern in the AST is "^@grafana\/ui" (backslash-escaped forward slash)
 */
function isGrafanaUiRegex(element: recast.types.namedTypes.ASTNode): boolean {
  // Handle RegExpLiteral (TypeScript parser)
  if (element.type === 'RegExpLiteral') {
    const regexNode = element as recast.types.namedTypes.RegExpLiteral;
    return regexNode.pattern === '^@grafana\\/ui' && regexNode.flags === 'i';
  }
  // Handle Literal with regex property (other parsers)
  if (element.type === 'Literal' && 'regex' in element && element.regex) {
    const regex = element.regex as { pattern: string; flags: string };
    return regex.pattern === '^@grafana\\/ui' && regex.flags === 'i';
  }
  return false;
}

/**
 * Checks if an AST node is a regex matching @grafana/data
 * The pattern in the AST is "^@grafana\/data" (backslash-escaped forward slash)
 */
function isGrafanaDataRegex(element: recast.types.namedTypes.ASTNode): boolean {
  // Handle RegExpLiteral (TypeScript parser)
  if (element.type === 'RegExpLiteral') {
    const regexNode = element as recast.types.namedTypes.RegExpLiteral;
    return regexNode.pattern === '^@grafana\\/data' && regexNode.flags === 'i';
  }
  // Handle Literal with regex property (other parsers)
  if (element.type === 'Literal' && 'regex' in element && element.regex) {
    const regex = element.regex as { pattern: string; flags: string };
    return regex.pattern === '^@grafana\\/data' && regex.flags === 'i';
  }
  return false;
}

/**
 * Removes /^@grafana\/ui/i regex from externals array and adds 'react-inlinesvg'
 * @returns true if changes were made, false otherwise
 */
function modifyExternalsArray(externalsArray: recast.types.namedTypes.ArrayExpression): boolean {
  let hasChanges = false;
  let hasGrafanaUiExternal = false;
  let hasReactInlineSvg = false;

  // Check current state
  for (const element of externalsArray.elements) {
    if (!element) {
      continue;
    }

    // Check for /^@grafana\/ui/i regex
    if (isGrafanaUiRegex(element)) {
      hasGrafanaUiExternal = true;
    }

    // Check for 'react-inlinesvg' string
    if (
      (element.type === 'Literal' || element.type === 'StringLiteral') &&
      'value' in element &&
      typeof element.value === 'string' &&
      element.value === 'react-inlinesvg'
    ) {
      hasReactInlineSvg = true;
    }
  }

  // Remove /^@grafana\/ui/i if present
  if (hasGrafanaUiExternal) {
    externalsArray.elements = externalsArray.elements.filter((element) => {
      if (!element) {
        return true;
      }
      return !isGrafanaUiRegex(element);
    });
    hasChanges = true;
    additionsDebug('Removed /^@grafana\\/ui/i from externals array');
  }

  // Add 'react-inlinesvg' if not present
  if (!hasReactInlineSvg) {
    // Find the index of /^@grafana\/data/i to insert after it
    let insertIndex = -1;
    for (let i = 0; i < externalsArray.elements.length; i++) {
      const element = externalsArray.elements[i];
      if (element && isGrafanaDataRegex(element)) {
        insertIndex = i + 1;
        break;
      }
    }

    if (insertIndex >= 0) {
      externalsArray.elements.splice(insertIndex, 0, builders.literal('react-inlinesvg'));
    } else {
      // Fallback: append to end
      externalsArray.elements.push(builders.literal('react-inlinesvg'));
    }
    hasChanges = true;
    additionsDebug("Added 'react-inlinesvg' to externals array");
  }

  return hasChanges;
}

/**
 * Creates a modifier function for updateExternalsArray that removes @grafana/ui
 * and adds react-inlinesvg
 */
function createBundleGrafanaUIModifier(): ExternalsArrayModifier {
  return (externalsArray: recast.types.namedTypes.ArrayExpression) => {
    return modifyExternalsArray(externalsArray);
  };
}

/**
 * Updates the bundler's resolve configuration to handle ESM imports from @grafana/ui
 * - Adds '.mjs' to resolve.extensions
 * - Adds fullySpecified: false to allow extensionless imports in node_modules
 */
function updateBundlerResolveConfig(context: Context): void {
  // Try rspack config first (newer structure)
  if (context.doesFileExist(RSPACK_CONFIG_PATH)) {
    additionsDebug(`Found ${RSPACK_CONFIG_PATH}, updating resolve configuration...`);
    const rspackContent = context.getFile(RSPACK_CONFIG_PATH);
    if (rspackContent) {
      try {
        const ast = recast.parse(rspackContent, {
          parser: typeScriptParser,
        });

        let hasChanges = false;

        recast.visit(ast, {
          visitObjectExpression(path) {
            const { node } = path;
            const properties = node.properties;

            if (properties) {
              for (const prop of properties) {
                if (prop && (prop.type === 'Property' || prop.type === 'ObjectProperty')) {
                  const key = 'key' in prop ? prop.key : null;
                  const value = 'value' in prop ? prop.value : null;

                  // Find the resolve property
                  if (
                    key &&
                    key.type === 'Identifier' &&
                    key.name === 'resolve' &&
                    value &&
                    value.type === 'ObjectExpression'
                  ) {
                    hasChanges = updateResolveObject(value) || hasChanges;
                  }

                  // Find the module property to add .mjs rule
                  if (
                    key &&
                    key.type === 'Identifier' &&
                    key.name === 'module' &&
                    value &&
                    value.type === 'ObjectExpression'
                  ) {
                    hasChanges = updateModuleRules(value) || hasChanges;
                  }
                }
              }
            }

            return this.traverse(path);
          },
        });

        if (hasChanges) {
          const output = recast.print(ast, {
            tabWidth: 2,
            trailingComma: true,
            lineTerminator: '\n',
          });
          context.updateFile(RSPACK_CONFIG_PATH, output.code);
          additionsDebug(`Updated ${RSPACK_CONFIG_PATH}`);
        }
      } catch (error) {
        additionsDebug(`Error updating ${RSPACK_CONFIG_PATH}:`, error);
      }
    }
    return;
  }

  // Fall back to webpack config (legacy structure)
  if (context.doesFileExist(WEBPACK_CONFIG_PATH)) {
    additionsDebug(`Found ${WEBPACK_CONFIG_PATH}, updating resolve configuration...`);
    const webpackContent = context.getFile(WEBPACK_CONFIG_PATH);
    if (webpackContent) {
      try {
        const ast = recast.parse(webpackContent, {
          parser: typeScriptParser,
        });

        let hasChanges = false;

        recast.visit(ast, {
          visitObjectExpression(path) {
            const { node } = path;
            const properties = node.properties;

            if (properties) {
              for (const prop of properties) {
                if (prop && (prop.type === 'Property' || prop.type === 'ObjectProperty')) {
                  const key = 'key' in prop ? prop.key : null;
                  const value = 'value' in prop ? prop.value : null;

                  // Find the resolve property
                  if (
                    key &&
                    key.type === 'Identifier' &&
                    key.name === 'resolve' &&
                    value &&
                    value.type === 'ObjectExpression'
                  ) {
                    hasChanges = updateResolveObject(value) || hasChanges;
                  }

                  // Find the module property to add .mjs rule
                  if (
                    key &&
                    key.type === 'Identifier' &&
                    key.name === 'module' &&
                    value &&
                    value.type === 'ObjectExpression'
                  ) {
                    hasChanges = updateModuleRules(value) || hasChanges;
                  }
                }
              }
            }

            return this.traverse(path);
          },
        });

        if (hasChanges) {
          const output = recast.print(ast, {
            tabWidth: 2,
            trailingComma: true,
            lineTerminator: '\n',
          });
          context.updateFile(WEBPACK_CONFIG_PATH, output.code);
          additionsDebug(`Updated ${WEBPACK_CONFIG_PATH}`);
        }
      } catch (error) {
        additionsDebug(`Error updating ${WEBPACK_CONFIG_PATH}:`, error);
      }
    }
  }
}

/**
 * Updates module rules to add a rule for .mjs files in node_modules with resolve.fullySpecified: false
 */
function updateModuleRules(moduleObject: recast.types.namedTypes.ObjectExpression): boolean {
  if (!moduleObject.properties) {
    return false;
  }

  let hasChanges = false;
  let hasMjsRule = false;
  let rulesProperty: recast.types.namedTypes.Property | null = null;

  // Find the rules property
  for (const prop of moduleObject.properties) {
    if (!prop || (prop.type !== 'Property' && prop.type !== 'ObjectProperty')) {
      continue;
    }

    const key = 'key' in prop ? prop.key : null;
    const value = 'value' in prop ? prop.value : null;

    if (key && key.type === 'Identifier' && key.name === 'rules' && value && value.type === 'ArrayExpression') {
      rulesProperty = prop as recast.types.namedTypes.Property;
      // Check if .mjs rule already exists
      for (const element of value.elements) {
        if (element && element.type === 'ObjectExpression' && element.properties) {
          for (const ruleProp of element.properties) {
            if (
              ruleProp &&
              (ruleProp.type === 'Property' || ruleProp.type === 'ObjectProperty') &&
              'key' in ruleProp &&
              ruleProp.key.type === 'Identifier' &&
              ruleProp.key.name === 'test'
            ) {
              const testValue = 'value' in ruleProp ? ruleProp.value : null;
              if (testValue) {
                // Check for RegExpLiteral with .mjs pattern
                if (testValue.type === 'RegExpLiteral' && 'pattern' in testValue && testValue.pattern === '\\.mjs$') {
                  hasMjsRule = true;
                  break;
                }
                // Check for Literal with regex property
                if (
                  testValue.type === 'Literal' &&
                  'regex' in testValue &&
                  testValue.regex &&
                  typeof testValue.regex === 'object' &&
                  'pattern' in testValue.regex &&
                  testValue.regex.pattern === '\\.mjs$'
                ) {
                  hasMjsRule = true;
                  break;
                }
                // Check for string literal containing .mjs
                if (
                  testValue.type === 'Literal' &&
                  'value' in testValue &&
                  typeof testValue.value === 'string' &&
                  testValue.value.includes('.mjs')
                ) {
                  hasMjsRule = true;
                  break;
                }
              }
            }
          }
        }
        if (hasMjsRule) {
          break;
        }
      }
      break;
    }
  }

  // Add .mjs rule if missing (insert at beginning so it's processed before rules that exclude node_modules)
  if (!hasMjsRule && rulesProperty && 'value' in rulesProperty) {
    const rulesArray = rulesProperty.value as recast.types.namedTypes.ArrayExpression;
    const mjsRule = builders.objectExpression([
      builders.property('init', builders.identifier('test'), builders.literal(/\.mjs$/)),
      builders.property('init', builders.identifier('include'), builders.literal(/node_modules/)),
      builders.property(
        'init',
        builders.identifier('resolve'),
        builders.objectExpression([
          builders.property('init', builders.identifier('fullySpecified'), builders.literal(false)),
        ])
      ),
      builders.property('init', builders.identifier('type'), builders.literal('javascript/auto')),
    ]);
    // Insert at the beginning of the rules array
    rulesArray.elements.unshift(mjsRule);
    hasChanges = true;
    additionsDebug('Added module rule for .mjs files in node_modules with resolve.fullySpecified: false');
  }

  return hasChanges;
}

/**
 * Updates a resolve object expression to add .mjs extension
 * Note: We don't set fullySpecified: false globally because .mjs files need
 * rule-level configuration to override ESM's strict fully-specified import requirements
 */
function updateResolveObject(resolveObject: recast.types.namedTypes.ObjectExpression): boolean {
  if (!resolveObject.properties) {
    return false;
  }

  let hasChanges = false;
  let hasMjsExtension = false;
  let extensionsProperty: recast.types.namedTypes.Property | null = null;

  // Check current state
  for (const prop of resolveObject.properties) {
    if (!prop || (prop.type !== 'Property' && prop.type !== 'ObjectProperty')) {
      continue;
    }

    const key = 'key' in prop ? prop.key : null;
    const value = 'value' in prop ? prop.value : null;

    if (key && key.type === 'Identifier') {
      if (key.name === 'extensions' && value && value.type === 'ArrayExpression') {
        extensionsProperty = prop as recast.types.namedTypes.Property;
        // Check if .mjs is already in the extensions array
        for (const element of value.elements) {
          if (
            element &&
            (element.type === 'Literal' || element.type === 'StringLiteral') &&
            'value' in element &&
            element.value === '.mjs'
          ) {
            hasMjsExtension = true;
            break;
          }
        }
      }
    }
  }

  // Add .mjs to extensions if missing
  if (!hasMjsExtension && extensionsProperty && 'value' in extensionsProperty) {
    const extensionsArray = extensionsProperty.value as recast.types.namedTypes.ArrayExpression;
    extensionsArray.elements.push(builders.literal('.mjs'));
    hasChanges = true;
    additionsDebug("Added '.mjs' to resolve.extensions");
  }

  return hasChanges;
}

/**
 * Ensures plugin.json has grafanaDependency >= 10.2.0
 * Bundling @grafana/ui is only supported from Grafana 10.2.0 onwards
 */
function ensureMinGrafanaVersion(context: Context): void {
  if (!context.doesFileExist(PLUGIN_JSON_PATH)) {
    additionsDebug(`${PLUGIN_JSON_PATH} not found, skipping version check`);
    return;
  }

  const pluginJsonRaw = context.getFile(PLUGIN_JSON_PATH);
  if (!pluginJsonRaw) {
    return;
  }

  try {
    const pluginJson = JSON.parse(pluginJsonRaw);

    if (!pluginJson.dependencies) {
      pluginJson.dependencies = {};
    }

    const currentGrafanaDep = pluginJson.dependencies.grafanaDependency || '>=9.0.0';
    const currentVersion = coerce(currentGrafanaDep.replace(/^[><=]+/, ''));
    const minVersion = coerce(MIN_GRAFANA_VERSION);

    if (!currentVersion || !minVersion || !gte(currentVersion, minVersion)) {
      const oldVersion = pluginJson.dependencies.grafanaDependency || 'not set';
      pluginJson.dependencies.grafanaDependency = `>=${MIN_GRAFANA_VERSION}`;
      context.updateFile(PLUGIN_JSON_PATH, JSON.stringify(pluginJson, null, 2));
      additionsDebug(
        `Updated grafanaDependency from "${oldVersion}" to ">=${MIN_GRAFANA_VERSION}" - bundling @grafana/ui requires Grafana ${MIN_GRAFANA_VERSION} or higher`
      );
      console.log(
        `\n⚠️  Updated grafanaDependency to ">=${MIN_GRAFANA_VERSION}" because bundling @grafana/ui is only supported from Grafana ${MIN_GRAFANA_VERSION} onwards.\n`
      );
    } else {
      additionsDebug(
        `grafanaDependency "${currentGrafanaDep}" already meets minimum requirement of ${MIN_GRAFANA_VERSION}`
      );
    }
  } catch (error) {
    additionsDebug(`Error updating ${PLUGIN_JSON_PATH}:`, error);
  }
}

export default function bundleGrafanaUI(context: Context, _options: BundleGrafanaUIOptions): Context {
  additionsDebug('Running bundle-grafana-ui addition...');

  // Ensure minimum Grafana version requirement
  ensureMinGrafanaVersion(context);

  // Update externals array using the shared utility
  updateExternalsArray(context, createBundleGrafanaUIModifier());

  // Update bundler resolve configuration to handle ESM imports
  updateBundlerResolveConfig(context);

  return context;
}
