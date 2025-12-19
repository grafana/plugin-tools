import * as recast from 'recast';
import * as typeScriptParser from 'recast/parsers/typescript.js';

import type { Context } from './context.js';
import { additionsDebug } from './utils.js';

/**
 * Utility for updating externals arrays in plugin bundler configurations.
 *
 * This utility is needed because the location of externals configuration has changed over time:
 * - **New plugins** (created with recent versions of @grafana/create-plugin): Externals are defined
 *   in a separate file at `.config/bundler/externals.ts`
 * - **Older plugins** (created with earlier versions): Externals are defined inline within
 *   `.config/webpack/webpack.config.ts` as part of the webpack Configuration object
 *
 * This utility handles both cases automatically, preferring the modern structure when both exist,
 * to ensure additions and migrations work correctly regardless of when the plugin was created.
 */

/**
 * Type for a function that modifies an externals array
 * @param externalsArray - The AST node representing the externals array
 * @returns true if changes were made, false otherwise
 */
export type ExternalsArrayModifier = (externalsArray: recast.types.namedTypes.ArrayExpression) => boolean;

const EXTERNALS_PATH = '.config/bundler/externals.ts';
const WEBPACK_CONFIG_PATH = '.config/webpack/webpack.config.ts';

/**
 * Updates the externals array in either .config/bundler/externals.ts (preferred) or
 * .config/webpack/webpack.config.ts (legacy fallback).
 *
 * @param context - The codemod context
 * @param modifier - A function that modifies the externals array and returns true if changes were made
 * @returns true if changes were made to any file, false otherwise
 */
export function updateExternalsArray(context: Context, modifier: ExternalsArrayModifier): boolean {
  // Try new structure first: .config/bundler/externals.ts
  if (context.doesFileExist(EXTERNALS_PATH)) {
    additionsDebug(`Found ${EXTERNALS_PATH}, updating externals array...`);
    const externalsContent = context.getFile(EXTERNALS_PATH);
    if (externalsContent) {
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
              if (modifier(node.init)) {
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
          return true;
        }
        return false;
      } catch (error) {
        additionsDebug(`Error updating ${EXTERNALS_PATH}:`, error);
        return false;
      }
    }
  }

  // Fall back to legacy structure: .config/webpack/webpack.config.ts with inline externals
  additionsDebug(`Checking for ${WEBPACK_CONFIG_PATH}...`);
  if (context.doesFileExist(WEBPACK_CONFIG_PATH)) {
    additionsDebug(`Found ${WEBPACK_CONFIG_PATH}, checking for inline externals...`);
    const webpackContent = context.getFile(WEBPACK_CONFIG_PATH);
    if (webpackContent) {
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
                    if (modifier(value)) {
                      hasChanges = true;
                    }
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
              if (modifier(node.value)) {
                hasChanges = true;
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
          return true;
        }
        return false;
      } catch (error) {
        additionsDebug(`Error updating ${WEBPACK_CONFIG_PATH}:`, error);
        return false;
      }
    }
  }

  additionsDebug('No externals configuration found');
  return false;
}
