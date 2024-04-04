import * as ts from 'typescript';
import { MetaRegistry } from './meta/registry';
import {
  createExtensionComponentMeta,
  createExtensionLinkMeta,
  isConfigureExtensionComponentNode,
  isConfigureExtensionLinkNode,
} from './meta/extensions';
import { MetaBase } from './types';

export function createProgram(entry: string): MetaBase[] {
  const program = ts.createProgram([entry], {
    allowSyntheticDefaultImports: true,
    allowJs: true,
  });

  const sourceFile = program.getSourceFile(entry);
  const checker = program.getTypeChecker();
  const registry = new MetaRegistry();

  if (!sourceFile) {
    return [];
  }

  const [appNode, rootNodes] = findAppPluginDeclarationNode(sourceFile, checker);
  console.log('appNode', Boolean(appNode));

  if (!appNode) {
    return [];
  }

  ts.forEachChild(appNode, createAppNodeVisitor(registry, checker, rootNodes));

  return registry.toArray();
}

function createAppNodeVisitor(
  registry: MetaRegistry,
  checker: ts.TypeChecker,
  rootNodes: ts.Node[]
): (node: ts.Node) => void {
  return (node) => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
      // We are wrapping the app call in a function call(s) and need to include possible
      // registrations from those functions.
      const funcName = node.expression.text;
      const funcNode = rootNodes.find((n) => {
        if (!ts.isImportDeclaration(n)) {
          return false;
        }

        if (!n.importClause || !n.importClause.namedBindings) {
          return false;
        }

        if (ts.isNamedImports(n.importClause.namedBindings)) {
          return Boolean(
            n.importClause.namedBindings.elements.find((e) => {
              return e.name.escapedText === funcName;
            })
          );
        }
      });

      if (funcNode && ts.isImportDeclaration(funcNode)) {
        // import that file and fetch the function.
      }
    }

    if (isChainedAppPlugin(node, checker)) {
      node.forEachChild(createAppNodeVisitor(registry, checker, rootNodes));

      if (isConfigureExtensionLinkNode(node)) {
        registry.register(createExtensionLinkMeta(node, checker));
      }

      if (isConfigureExtensionComponentNode(node)) {
        registry.register(createExtensionComponentMeta(node, checker));
      }

      return;
    }

    node.forEachChild(createAppNodeVisitor(registry, checker, rootNodes));
  };
}

function isChainedAppPlugin(node: ts.Node, checker: ts.TypeChecker): boolean {
  if (!ts.isCallExpression(node)) {
    return false;
  }
  const type = checker.getTypeAtLocation(node);
  return type.symbol?.escapedName === 'AppPlugin';
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

// createProgram(
//   '/Users/marcusandersson/Development/grafana/grafana-plugin-examples/examples/app-with-extensions/src/module.tsx'
// );
