import * as ts from 'typescript';
import * as tsquery from '@phenomnomnominal/tsquery';
import { PluginExtensionTypes } from '@grafana/data';

const CONFIGURE_FN_NAME_TO_TYPE: Record<string, PluginExtensionTypes> = {
  configureExtensionLink: PluginExtensionTypes.link,
  configureExtensionComponent: PluginExtensionTypes.component,
};

export function getLinkExtensionsConfigs(ast: ts.Node, checker: ts.TypeChecker) {
  return getExtensionConfigs('configureExtensionLink', ast, checker);
}

export function getComponentExtensionConfigs(ast: ts.Node, checker: ts.TypeChecker) {
  return getExtensionConfigs('configureExtensionComponent', ast, checker);
}

export function getExtensionConfigs(functionName: string, ast: ts.Node, checker: ts.TypeChecker) {
  const identifiers = tsquery.query(ast, `Identifier[name=${functionName}]`) as ts.Identifier[];
  const extensionConfigs = [];

  for (const identifier of identifiers) {
    const callExpression = identifier.parent.parent;
    if (ts.isCallExpression(callExpression)) {
      const options = callExpression.arguments.find(ts.isObjectLiteralExpression);
      if (options) {
        const config = parseExtensionPointOptions(options, checker);
        extensionConfigs.push({
          ...config,
          type: CONFIGURE_FN_NAME_TO_TYPE[functionName],
        });
      }
    }
  }

  return extensionConfigs;
}

export function parseString(node: ts.Expression): string {
  // If value is simple string
  if (ts.isStringLiteral(node)) {
    return node.text;
  }
  return node.getText();
}

// This needs to be rewritten as well
export function parseExtensionPointId(node: ts.Expression, checker: ts.TypeChecker): string {
  // If value is simple string
  if (ts.isStringLiteral(node)) {
    return node.text;
  }
  // If value is an enum e.g. PluginExtensionPointIds
  if (!ts.isPropertyAccessExpression(node)) {
    return node.getText();
  }
  if (!ts.isIdentifier(node.name)) {
    return node.getText();
  }
  const type = checker.getTypeAtLocation(node.name);
  if (type.isLiteral()) {
    return type.value.toString();
  }
  return node.getText();
}

export function parseExtensionPointOptions(options: ts.ObjectLiteralExpression, checker: ts.TypeChecker) {
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
      extensionPointId: '',
      title: '',
      description: '',
    }
  );
}
