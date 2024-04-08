import * as ts from 'typescript';
import { ExtensionLinkMeta, ExtensionComponentMeta, MetaKind } from '../types';
import { parseExtensionPointId, parseString } from '../utils';

export function isConfigureExtensionLinkNode(node: ts.Node): node is ts.CallExpression {
  return true;

  // if (ts.isCallExpression(node)) {
  //   if (ts.isPropertyAccessExpression(node.expression)) {
  //     return node.expression.name.escapedText === 'configureExtensionLink';
  //   }
  // }
  // return false;
}

export function createExtensionLinkMeta(expression: ts.CallExpression, checker: ts.TypeChecker): ExtensionLinkMeta {
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
          meta.extensionPointId = parseExtensionPointId(node.initializer, checker);
          break;

        case 'description':
          meta.description = parseString(node.initializer);
          break;

        case 'title':
          meta.title = parseString(node.initializer);
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

export function isConfigureExtensionComponentNode(node: ts.Node): node is ts.CallExpression {
  if (ts.isCallExpression(node)) {
    if (ts.isPropertyAccessExpression(node.expression)) {
      return node.expression.name.escapedText === 'configureExtensionComponent';
    }
  }
  return false;
}

export function createExtensionComponentMeta(
  expression: ts.CallExpression,
  checker: ts.TypeChecker
): ExtensionComponentMeta {
  const options = expression.arguments.find(ts.isObjectLiteralExpression);

  if (!options || !isConfigureExtensionComponentNode(expression)) {
    throw new Error('Expression does not match `configureComponentExtension` call.');
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
          meta.extensionPointId = parseExtensionPointId(node.initializer, checker);
          break;

        case 'description':
          meta.description = parseString(node.initializer);
          break;

        case 'title':
          meta.title = parseString(node.initializer);
          break;

        default:
          break;
      }
      return meta;
    },
    {
      kind: MetaKind.extensionComponent,
      extensionPointId: '',
      title: '',
      description: '',
    }
  );
}
