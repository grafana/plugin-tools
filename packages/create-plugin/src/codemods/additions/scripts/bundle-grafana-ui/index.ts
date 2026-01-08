import * as v from 'valibot';
import * as recast from 'recast';
import { coerce, gte } from 'semver';

import type { Context } from '../../../context.js';
import { additionsDebug } from '../../../utils.js';
import { updateExternalsArray, type ExternalsArrayModifier } from '../../../utils.externals.js';

const { builders } = recast.types;

const PLUGIN_JSON_PATH = 'src/plugin.json';
const MIN_GRAFANA_VERSION = '10.2.0';
const WEBPACK_CONFIG_PATH = '.config/webpack/webpack.config.ts';
const RSPACK_CONFIG_PATH = '.config/rspack/rspack.config.ts';

export const schema = v.object({});
type BundleGrafanaUIOptions = v.InferOutput<typeof schema>;

export default function bundleGrafanaUI(context: Context, _options: BundleGrafanaUIOptions): Context {
  additionsDebug('Running bundle-grafana-ui addition...');

  // Ensure minimum Grafana version requirement
  ensureMinGrafanaVersion(context);

  // Update externals array using the shared utility
  updateExternalsArray(context, createBundleGrafanaUIModifier());

  // Update bundler resolve configuration to handle ESM imports
  updateResolveExtensionsSimple(context);

  // Update module rules directly with simple string manipulation
  updateModuleRulesSimple(context);

  return context;
}

/**
 * Checks if an AST node is a regex matching a Grafana package pattern
 * @param element - The AST node to check
 * @param pattern - The regex pattern to match (e.g., "^@grafana\\/ui" or "^@grafana\\/data")
 */
function isGrafanaRegex(element: recast.types.namedTypes.ASTNode, pattern: string): boolean {
  // Handle RegExpLiteral (TypeScript parser)
  if (element.type === 'RegExpLiteral') {
    const regexNode = element as recast.types.namedTypes.RegExpLiteral;
    return regexNode.pattern === pattern && regexNode.flags === 'i';
  }
  // Handle Literal with regex property (other parsers)
  if (element.type === 'Literal' && 'regex' in element && element.regex) {
    const regex = element.regex as { pattern: string; flags: string };
    return regex.pattern === pattern && regex.flags === 'i';
  }
  return false;
}

/**
 * Removes /^@grafana\/ui/i regex from externals array and adds 'react-inlinesvg'
 * @returns true if changes were made, false otherwise
 */
function removeGrafanaUiAndAddReactInlineSvg(externalsArray: recast.types.namedTypes.ArrayExpression): boolean {
  let hasChanges = false;
  let hasGrafanaUiExternal = false;
  let hasReactInlineSvg = false;

  // Check current state
  for (const element of externalsArray.elements) {
    if (!element) {
      continue;
    }

    // Check for /^@grafana\/ui/i regex
    if (isGrafanaRegex(element, '^@grafana\\/ui')) {
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
      return !isGrafanaRegex(element, '^@grafana\\/ui');
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
      if (element && isGrafanaRegex(element, '^@grafana\\/data')) {
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
    return removeGrafanaUiAndAddReactInlineSvg(externalsArray);
  };
}

/**
 * Updates resolve extensions to add .mjs using simple string manipulation
 * This is a simplified approach that may not handle all edge cases, but is much simpler
 */
function updateResolveExtensionsSimple(context: Context): void {
  const configPath = context.doesFileExist(RSPACK_CONFIG_PATH)
    ? RSPACK_CONFIG_PATH
    : context.doesFileExist(WEBPACK_CONFIG_PATH)
      ? WEBPACK_CONFIG_PATH
      : null;

  if (!configPath) {
    return;
  }

  const content = context.getFile(configPath);
  if (!content) {
    return;
  }

  // Check if .mjs already exists
  if (content.includes("'.mjs'") || content.includes('".mjs"')) {
    return;
  }

  // Add .mjs to extensions array
  const updated = content.replace(/(extensions:\s*\[)([^\]]+)(\])/, (match, prefix, extensions, suffix) => {
    if (extensions.includes('.mjs')) {
      return match;
    }
    return `${prefix}${extensions}, '.mjs'${suffix}`;
  });

  if (updated !== content) {
    context.updateFile(configPath, updated);
    additionsDebug("Added '.mjs' to resolve.extensions");
  }
}

/**
 * Updates module rules to add .mjs rule using simple string manipulation
 * This is a simplified approach that may not handle all edge cases, but is much simpler
 */
function updateModuleRulesSimple(context: Context): void {
  const configPath = context.doesFileExist(RSPACK_CONFIG_PATH)
    ? RSPACK_CONFIG_PATH
    : context.doesFileExist(WEBPACK_CONFIG_PATH)
      ? WEBPACK_CONFIG_PATH
      : null;

  if (!configPath) {
    return;
  }

  const content = context.getFile(configPath);
  if (!content) {
    return;
  }

  // Check if rule already exists
  if (content.includes('test: /\\.mjs$') || content.includes('test: /\\\\.mjs$')) {
    return;
  }

  const mjsRule = `{
        test: /\\.mjs$/,
        include: /node_modules/,
        resolve: {
          fullySpecified: false,
        },
        type: 'javascript/auto',
      },`;

  // Simple approach: find rules array and insert after first rule
  let updated = content;

  // Case 1: Empty array - insert at start
  if (content.match(/rules:\s*\[\s*\]/)) {
    updated = content.replace(/(rules:\s*\[\s*)(\])/, `$1${mjsRule}\n      $2`);
  }
  // Case 2: Find first rule and insert after it
  else {
    // Match: rules: [ { ... }, and insert mjs rule after the first rule
    // The regex finds the first complete rule object (balanced braces)
    updated = content.replace(/(rules:\s*\[\s*)(\{[\s\S]*?\}),(\s*)/, (match, prefix, firstRule, suffix) => {
      // Check if we already inserted (avoid double insertion)
      if (match.includes('test: /\\.mjs$')) {
        return match;
      }
      // Insert mjs rule after first rule
      return `${prefix}${firstRule},\n      ${mjsRule}${suffix}`;
    });
  }

  if (updated !== content) {
    context.updateFile(configPath, updated);
    additionsDebug('Added module rule for .mjs files in node_modules with resolve.fullySpecified: false');
  }
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
