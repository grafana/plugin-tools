import * as ts from 'typescript';
import { MetaBase, MetaKind } from './base';

export interface ExtensionLinkMeta extends MetaBase {
  kind: MetaKind.extensionLink;
  extensionPointId: string;
  title: string;
  description: string;
}

export function isConfigureExtensionLinkNode(node: ts.Node): node is ts.CallExpression {
  if (ts.isCallExpression(node)) {
    if (ts.isPropertyAccessExpression(node.expression)) {
      return node.expression.name.escapedText === 'configureExtensionLink';
    }
  }
  return false;
}

export function createExtensionLinkMeta(expression: ts.CallExpression): ExtensionLinkMeta {
  const options = expression.arguments.find(ts.isObjectLiteralExpression);

  if (!options || !isConfigureExtensionLinkNode(expression)) {
    throw new Error('Expression does not match `configureLinkExtension` call.');
  }

  // Need to rewrite this part to something more elegant that works when you add more
  // fields to the meta and configuration
  return options.properties.reduce(
    (meta, node) => {
      if (!ts.isPropertyAssignment(node) || !ts.isIdentifier(node.name)) {
        return meta;
      }
      switch (node.name.escapedText.toString()) {
        case 'extensionPointId':
          meta.extensionPointId = node.initializer.getText();
          break;

        case 'description':
          meta.description = node.initializer.getText();
          break;

        case 'title':
          meta.title = node.initializer.getText();
          break;

        default:
          break;
      }
      return meta;
    },
    {
      kind: MetaKind.extensionLink,
      extensionPointId: '',
      title: '',
      description: '',
    }
  );
}
