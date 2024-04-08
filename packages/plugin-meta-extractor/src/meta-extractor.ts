import * as ts from 'typescript';
import { MetaBase } from './types.js';
import { getLinkExtensionsConfigs, getComponentExtensionConfigs } from './utils.js';

export function extractExtensionPoints(entry: string): MetaBase[] {
  const program = ts.createProgram([entry], {
    allowSyntheticDefaultImports: true,
    allowJs: true,
  });

  const sourceFile = program.getSourceFile(entry);
  const checker = program.getTypeChecker();

  if (!sourceFile) {
    return [];
  }

  const [appNode] = findAppPluginDeclarationNode(sourceFile, checker);

  if (!appNode) {
    return [];
  }

  const linkExtensionConfigs = getLinkExtensionsConfigs(appNode, checker);
  const componentExtensionConfigs = getComponentExtensionConfigs(appNode, checker);

  return [...linkExtensionConfigs, ...componentExtensionConfigs];
}

function findAppPluginDeclarationNode(entry: ts.SourceFile, checker: ts.TypeChecker): [ts.Node | undefined, ts.Node[]] {
  let appNode: ts.Node | undefined;
  const rootNodes: ts.Node[] = [];

  ts.forEachChild(entry, (node) => {
    rootNodes.push(node);

    // Check if it is a default export
    if (ts.isExportAssignment(node)) {
      // Supports when you do export default new AppPlugin()...
      if (ts.isCallExpression(node.expression) || ts.isNewExpression(node.expression)) {
        const type = checker.getTypeAtLocation(node.expression);
        if (type.symbol?.escapedName === 'AppPlugin') {
          appNode = node;
          return true;
        }
      }

      return false;
    }

    // Check if it is a named variable export
    if (ts.isVariableStatement(node)) {
      const isExported = node.modifiers?.find((mod) => {
        return mod.kind === ts.SyntaxKind.ExportKeyword;
      });

      if (!isExported) {
        return false;
      }

      const isPluginExport = node.declarationList.declarations.find((decl) => {
        if (!ts.isVariableDeclaration(decl)) {
          return false;
        }
        if (!ts.isIdentifier(decl.name)) {
          return false;
        }
        return decl.name.escapedText === 'plugin';
      });

      if (isPluginExport) {
        appNode = node;
        return true;
      }

      return false;
    }

    // Check if it is a named re-export
    if (ts.isExportDeclaration(node)) {
      if (!node.exportClause || !ts.isNamedExports(node.exportClause)) {
        return false;
      }

      const isPluginExport = node.exportClause.elements.find((ele) => {
        if (!ts.isExportSpecifier(ele)) {
          return false;
        }
        if (!ts.isIdentifier(ele.name)) {
          return false;
        }
        return ele.name.escapedText === 'plugin';
      });

      if (isPluginExport) {
        appNode = node;
        return true;
      }

      return false;
    }
  });

  return [appNode, rootNodes];
}