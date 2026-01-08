import * as recast from 'recast';
import * as typeScriptParser from 'recast/parsers/typescript.js';

import type { Context } from './context.js';
import { additionsDebug } from './utils.js';

const WEBPACK_CONFIG_PATH = '.config/webpack/webpack.config.ts';
const RSPACK_CONFIG_PATH = '.config/rspack/rspack.config.ts';

/**
 * Type for a function that modifies a resolve object expression
 * @param resolveObject - The AST node representing the resolve configuration
 * @returns true if changes were made, false otherwise
 */
export type ResolveModifier = (resolveObject: recast.types.namedTypes.ObjectExpression) => boolean;

/**
 * Type for a function that modifies a module rules array
 * @param moduleObject - The AST node representing the module configuration
 * @returns true if changes were made, false otherwise
 */
export type ModuleRulesModifier = (moduleObject: recast.types.namedTypes.ObjectExpression) => boolean;

/**
 * Updates the bundler's resolve and module configuration.
 *
 * This utility handles both webpack and rspack configurations, preferring rspack when both exist.
 *
 * @param context - The codemod context
 * @param resolveModifier - Optional function to modify the resolve configuration
 * @param moduleRulesModifier - Optional function to modify the module rules configuration
 */
export function updateBundlerConfig(
  context: Context,
  resolveModifier?: ResolveModifier,
  moduleRulesModifier?: ModuleRulesModifier
): void {
  if (!resolveModifier && !moduleRulesModifier) {
    return;
  }

  // Try rspack config first (newer structure)
  if (context.doesFileExist(RSPACK_CONFIG_PATH)) {
    additionsDebug(`Found ${RSPACK_CONFIG_PATH}, updating bundler configuration...`);
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
                    resolveModifier &&
                    key &&
                    key.type === 'Identifier' &&
                    key.name === 'resolve' &&
                    value &&
                    value.type === 'ObjectExpression'
                  ) {
                    hasChanges = resolveModifier(value) || hasChanges;
                  }

                  // Find the module property
                  if (
                    moduleRulesModifier &&
                    key &&
                    key.type === 'Identifier' &&
                    key.name === 'module' &&
                    value &&
                    value.type === 'ObjectExpression'
                  ) {
                    hasChanges = moduleRulesModifier(value) || hasChanges;
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
    additionsDebug(`Found ${WEBPACK_CONFIG_PATH}, updating bundler configuration...`);
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
                    resolveModifier &&
                    key &&
                    key.type === 'Identifier' &&
                    key.name === 'resolve' &&
                    value &&
                    value.type === 'ObjectExpression'
                  ) {
                    hasChanges = resolveModifier(value) || hasChanges;
                  }

                  // Find the module property
                  if (
                    moduleRulesModifier &&
                    key &&
                    key.type === 'Identifier' &&
                    key.name === 'module' &&
                    value &&
                    value.type === 'ObjectExpression'
                  ) {
                    hasChanges = moduleRulesModifier(value) || hasChanges;
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
