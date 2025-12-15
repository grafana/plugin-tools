import { join } from 'node:path';
import * as recast from 'recast';
import * as typeScriptParser from 'recast/parsers/typescript.js';
import type { Context } from '../../context.js';

const { builders } = recast.types;

export default function migrate(context: Context): Context {
  const webpackConfigPath = join('.config', 'webpack', 'webpack.config.ts');
  if (!context.doesFileExist(webpackConfigPath)) {
    return context;
  }

  const webpackConfigContent = context.getFile(webpackConfigPath);
  if (!webpackConfigContent) {
    return context;
  }

  let hasChanges = false;
  const ast = recast.parse(webpackConfigContent, {
    parser: typeScriptParser,
  });

  recast.visit(ast, {
    visitNewExpression(path) {
      const { node } = path;

      // Check if this is a ReplaceInFileWebpackPlugin constructor
      if (
        node.callee.type === 'Identifier' &&
        node.callee.name === 'ReplaceInFileWebpackPlugin' &&
        node.arguments.length > 0
      ) {
        const firstArg = node.arguments[0];

        // The first argument should be an array of config objects
        if (firstArg.type === 'ArrayExpression' && firstArg.elements) {
          firstArg.elements.forEach((element) => {
            if (element && element.type === 'ObjectExpression') {
              const changed = transformFilesProperty(element);
              if (changed) {
                hasChanges = true;
              }
            }
          });
        }
      }

      return this.traverse(path);
    },
  });

  // Only update the file if we made changes
  if (hasChanges) {
    const output = recast.print(ast, {
      tabWidth: 2,
      trailingComma: true,
      lineTerminator: '\n',
    });
    context.updateFile(webpackConfigPath, output.code);
  }

  return context;
}

function transformFilesProperty(objectExpression: recast.types.namedTypes.ObjectExpression): boolean {
  const properties = objectExpression.properties;
  if (!properties) {
    return false;
  }

  // Find the 'files' property
  const filesPropertyIndex = properties.findIndex(
    (prop) =>
      (prop.type === 'Property' || prop.type === 'ObjectProperty') &&
      prop.key.type === 'Identifier' &&
      prop.key.name === 'files'
  );

  if (filesPropertyIndex === -1) {
    return false;
  }

  const filesProperty = properties[filesPropertyIndex];

  // Type guard: ensure it's a Property or ObjectProperty (which have a value)
  if ((filesProperty.type !== 'Property' && filesProperty.type !== 'ObjectProperty') || !('value' in filesProperty)) {
    return false;
  }

  // Check if it's an array with the expected values
  if (filesProperty.value.type === 'ArrayExpression' && filesProperty.value.elements.length === 2) {
    const elements = filesProperty.value.elements;
    const values = elements
      .map((el) => (el?.type === 'Literal' || el?.type === 'StringLiteral' ? el?.value : null))
      .filter((v) => v !== null);

    // Only transform if it matches the exact pattern we're looking for
    if (values.length === 2 && values.includes('plugin.json') && values.includes('README.md')) {
      // Remove the 'files' property
      properties.splice(filesPropertyIndex, 1);

      // Add the 'test' property with regex array
      const testProperty = builders.property(
        'init',
        builders.identifier('test'),
        builders.arrayExpression([builders.literal(/(^|\/)plugin\.json$/), builders.literal(/(^|\/)README\.md$/)])
      );

      // Insert at the same position
      properties.splice(filesPropertyIndex, 0, testProperty);
      return true;
    }
  }

  return false;
}
