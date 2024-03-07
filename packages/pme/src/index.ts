import * as ts from 'typescript';
import { MetaRegistry } from './meta/registry';
import {
  createExtensionComponentMeta,
  createExtensionLinkMeta,
  isConfigureExtensionComponentNode,
  isConfigureExtensionLinkNode,
} from './meta/extensions';
import { MetaBase } from './meta/base';

export function createProgram(entry: string): MetaBase[] {
  const program = ts.createProgram([entry], { allowJs: true });
  const sourceFile = program.getSourceFile(entry);
  const checker = program.getTypeChecker();
  const registry = new MetaRegistry();

  if (!sourceFile) {
    return [];
  }

  ts.forEachChild(sourceFile, (node) => {
    const appNode = findAppPluginNode(node, checker);
    if (!appNode) {
      return;
    }
    appNode.forEachChild(createAppNodeVisitor(registry, checker));
  });

  return registry.toArray();
}

function createAppNodeVisitor(registry: MetaRegistry, checker: ts.TypeChecker): (node: ts.Node) => void {
  return (node) => {
    if (ts.isCallExpression(node)) {
      node.forEachChild(createAppNodeVisitor(registry, checker));

      if (isConfigureExtensionLinkNode(node)) {
        registry.register(createExtensionLinkMeta(node, checker));
      }

      if (isConfigureExtensionComponentNode(node)) {
        registry.register(createExtensionComponentMeta(node, checker));
      }

      return;
    }

    node.forEachChild(createAppNodeVisitor(registry, checker));
  };
}

function findAppPluginNode(node: ts.Node, checker: ts.TypeChecker): ts.VariableDeclaration | undefined {
  if (!ts.isVariableStatement(node)) {
    return;
  }

  for (const declaration of node.declarationList.declarations) {
    const type = checker.getTypeAtLocation(declaration);
    if (type.symbol.escapedName === 'AppPlugin') {
      return declaration;
    }
  }
}

createProgram(
  '/Users/marcusandersson/Development/grafana/grafana-plugin-examples/examples/app-with-extensions/src/module.tsx'
);
