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
 * Tracks imports from a specified package within the given AST.
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
    if (node.type === 'ImportDeclaration' && node.source?.value === packageName) {
      handleImportDeclaration(node, tracking);
    }

    // CommonJS require()
    if (node.type === 'VariableDeclaration') {
      node.declarations.forEach((decl) => {
        if (isRequireCall(decl, packageName)) {
          handleRequireDeclaration(decl, tracking);
        }
      });
    }
  });

  return tracking;
}

function addNamedImport(tracking: ImportTracking, importedName: string, localName: string): void {
  let localNames = tracking.namedImports.get(importedName);
  if (!localNames) {
    localNames = new Set();
    tracking.namedImports.set(importedName, localNames);
  }
  localNames.add(localName);
}

function handleImportDeclaration(node: TSESTree.ImportDeclaration, tracking: ImportTracking): void {
  node.specifiers.forEach((spec) => {
    if (spec.type === 'ImportDefaultSpecifier' || spec.type === 'ImportNamespaceSpecifier') {
      // e.g import symbol from packageName OR import * as symbol from packageName
      tracking.defaultImports.add(spec.local.name);
    } else if (spec.type === 'ImportSpecifier' && spec.imported?.type === 'Identifier') {
      // import { symbol } from packageName OR import { symbol as localName } from packageName
      addNamedImport(tracking, spec.imported.name, spec.local.name);
    }
  });
}

function isRequireCall(decl: TSESTree.VariableDeclarator, packageName: string): boolean {
  return (
    decl.init?.type === 'CallExpression' &&
    decl.init.callee?.type === 'Identifier' &&
    decl.init.callee.name === 'require' &&
    decl.init.arguments[0]?.type === 'Literal' &&
    decl.init.arguments[0].value === packageName
  );
}

function handleRequireDeclaration(decl: TSESTree.VariableDeclarator, tracking: ImportTracking): void {
  if (decl.id.type === 'Identifier') {
    // e.g const symbol = require('packageName')
    tracking.defaultImports.add(decl.id.name);
  } else if (decl.id.type === 'ObjectPattern') {
    // e.g const { symbol } = require('packageName') OR const { symbol: localName } = require('packageName')
    decl.id.properties.forEach((prop) => {
      if (prop.type === 'Property' && prop.key?.type === 'Identifier' && prop.value?.type === 'Identifier') {
        addNamedImport(tracking, prop.key.name, prop.value.name);
      }
    });
  }
}
