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

  const visitor = createAppNodeVisitor(registry, checker);

  for (const file of program.getSourceFiles()) {
    if (file.fileName.includes('/node_modules/')) {
      continue;
    }
    console.log(file.fileName);
    ts.forEachChild(file, visitor);
  }

  return registry.toArray();
}

function createAppNodeVisitor(registry: MetaRegistry, checker: ts.TypeChecker): (node: ts.Node) => void {
  return (node) => {
    if (isChainedAppPlugin(node, checker)) {
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

function isChainedAppPlugin(node: ts.Node, checker: ts.TypeChecker): boolean {
  if (!ts.isCallExpression(node)) {
    return false;
  }
  const type = checker.getTypeAtLocation(node);
  return type.symbol?.escapedName === 'AppPlugin';
}

// createProgram(
//   '/Users/marcusandersson/Development/grafana/grafana-plugin-examples/examples/app-with-extensions/src/module.tsx'
// );
