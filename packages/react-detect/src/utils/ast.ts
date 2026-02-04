import type { TSESTree } from '@typescript-eslint/typescript-estree';

export function walk(node: any, callback: (node: any) => void): void {
  callback(node);
  for (const key in node) {
    if (node[key] && typeof node[key] === 'object') {
      if (Array.isArray(node[key])) {
        node[key].forEach((child) => walk(child, callback));
      } else if (node[key].type) {
        walk(node[key], callback);
      }
    }
  }
}

export function getSurroundingCode(code: string, node: any): string {
  const lines = code.split('\n');
  const startLine = Math.max(0, node.loc.start.line - 3);
  const endLine = Math.min(lines.length, node.loc.end.line + 2);
  return lines.slice(startLine, endLine).join('\n');
}

interface ImportTracking {
  defaultImports: Set<string>; // Local names for default imports
  namedImports: Map<string, Set<string>>; // Imported name -> Set of local names
}

/**
 *
 * @param ast - The AST to analyze
 * @param packageName - The package name to track (e.g., 'react-dom')
 *
 * @example
 * // For code: import ReactDOM from 'react-dom'
 * // Returns: { defaultImports: Set(['ReactDOM']), namedImports: Map() }
 *
 * @example
 * // For code: import { render } from 'react-dom'
 * // Returns: { defaultImports: Set(), namedImports: Map([['render', Set(['render'])]]) }
 *
 * @example
 * // For code: import { render as r } from 'react-dom'
 * // Returns: { defaultImports: Set(), namedImports: Map([['render', Set(['r'])]]) }
 */
export function trackImportsFromPackage(ast: TSESTree.Program, packageName: string): ImportTracking {
  const tracking: ImportTracking = {
    defaultImports: new Set(),
    namedImports: new Map(),
  };

  walk(ast, (node: TSESTree.Node) => {
    if (!node) {
      return;
    }

    // ES6 Import declarations
    if (node.type === 'ImportDeclaration' && node.source && node.source.value === packageName) {
      node.specifiers.forEach((spec) => {
        if (spec.type === 'ImportDefaultSpecifier') {
          // e.g import symbol from packageName
          tracking.defaultImports.add(spec.local.name);
        } else if (spec.type === 'ImportSpecifier' && spec.imported && spec.imported.type === 'Identifier') {
          // import { symbol } from packageName OR import { symbol as localName } from packageName
          const importedName = spec.imported.name;
          const localName = spec.local.name;

          if (!tracking.namedImports.has(importedName)) {
            tracking.namedImports.set(importedName, new Set());
          }
          tracking.namedImports.get(importedName)?.add(localName);
        }
      });
    }

    // CommonJS require()
    if (node.type === 'VariableDeclaration') {
      node.declarations.forEach((decl) => {
        if (
          decl.init?.type === 'CallExpression' &&
          decl.init.callee &&
          decl.init.callee.type === 'Identifier' &&
          decl.init.callee.name === 'require' &&
          decl.init.arguments[0]?.type === 'Literal' &&
          decl.init.arguments[0].value === packageName
        ) {
          if (decl.id.type === 'Identifier') {
            // e.g const symbol = require('packageName')
            tracking.defaultImports.add(decl.id.name);
          } else if (decl.id.type === 'ObjectPattern') {
            // e.g const { symbol } = require('packageName') OR const { symbol: localName } = require('packageName')
            decl.id.properties.forEach((prop) => {
              if (
                prop.type === 'Property' &&
                prop.key &&
                prop.key.type === 'Identifier' &&
                prop.value &&
                prop.value.type === 'Identifier'
              ) {
                const importedName = prop.key.name;
                const localName = prop.value.name;

                if (!tracking.namedImports.has(importedName)) {
                  tracking.namedImports.set(importedName, new Set());
                }
                tracking.namedImports.get(importedName)?.add(localName);
              }
            });
          }
        }
      });
    }
  });

  return tracking;
}
