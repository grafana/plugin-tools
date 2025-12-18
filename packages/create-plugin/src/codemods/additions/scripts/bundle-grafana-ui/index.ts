import * as v from 'valibot';
import * as recast from 'recast';
import * as typeScriptParser from 'recast/parsers/typescript.js';
import { coerce, gte } from 'semver';

import type { Context } from '../../../context.js';
import { additionsDebug } from '../../../utils.js';

const { builders } = recast.types;

export const schema = v.object({});

type BundleGrafanaUIOptions = v.InferOutput<typeof schema>;

const EXTERNALS_PATH = '.config/bundler/externals.ts';
const WEBPACK_CONFIG_PATH = '.config/webpack/webpack.config.ts';
const PLUGIN_JSON_PATH = 'src/plugin.json';
const MIN_GRAFANA_VERSION = '10.2.0';

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

function updateExternalsFile(context: Context): boolean {
  if (!context.doesFileExist(EXTERNALS_PATH)) {
    additionsDebug(`${EXTERNALS_PATH} not found, skipping`);
    return false;
  }

  const externalsContent = context.getFile(EXTERNALS_PATH);
  if (!externalsContent) {
    return false;
  }

  try {
    const ast = recast.parse(externalsContent, {
      parser: typeScriptParser,
    });

    let hasChanges = false;

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
          if (modifyExternalsArray(node.init)) {
            hasChanges = true;
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
      context.updateFile(EXTERNALS_PATH, output.code);
      additionsDebug(`Updated ${EXTERNALS_PATH}`);
    }

    return hasChanges;
  } catch (error) {
    additionsDebug(`Error updating ${EXTERNALS_PATH}:`, error);
    return false;
  }
}

function updateWebpackConfigFile(context: Context): boolean {
  if (!context.doesFileExist(WEBPACK_CONFIG_PATH)) {
    additionsDebug(`${WEBPACK_CONFIG_PATH} not found, skipping`);
    return false;
  }

  const webpackContent = context.getFile(WEBPACK_CONFIG_PATH);
  if (!webpackContent) {
    return false;
  }

  try {
    const ast = recast.parse(webpackContent, {
      parser: typeScriptParser,
    });

    let hasChanges = false;
    let foundExternals = false;

    recast.visit(ast, {
      visitObjectExpression(path) {
        const { node } = path;
        const properties = node.properties;

        if (properties) {
          for (const prop of properties) {
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
                if (modifyExternalsArray(value)) {
                  hasChanges = true;
                }
              }
            }
          }
        }

        return this.traverse(path);
      },
    });

    if (!foundExternals) {
      additionsDebug('No externals property found in webpack.config.ts');
    }

    if (hasChanges) {
      const output = recast.print(ast, {
        tabWidth: 2,
        trailingComma: true,
        lineTerminator: '\n',
      });
      context.updateFile(WEBPACK_CONFIG_PATH, output.code);
      additionsDebug(`Updated ${WEBPACK_CONFIG_PATH}`);
    }

    return hasChanges;
  } catch (error) {
    additionsDebug(`Error updating ${WEBPACK_CONFIG_PATH}:`, error);
    return false;
  }
}

/**
 * Ensures plugin.json has grafanaDependency >= 10.4.0
 * Bundling @grafana/ui is only supported from Grafana 10.4.0 onwards
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

  // Try new structure first: .config/bundler/externals.ts
  const updatedExternals = updateExternalsFile(context);

  // Fall back to legacy structure: .config/webpack/webpack.config.ts with inline externals
  if (!updatedExternals) {
    updateWebpackConfigFile(context);
  }

  return context;
}
