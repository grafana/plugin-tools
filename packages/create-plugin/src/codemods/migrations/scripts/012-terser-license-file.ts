import { join } from 'node:path';
import * as recast from 'recast';
import type { Context } from '../../context.js';
import { migrationsDebug } from '../../utils.js';
import { findObjectProperty, parseAsTypescript, printAST } from '../../utils.ast.js';

const { builders } = recast.types;

const BUNDLER_CONFIG_PATHS = [
  join('.config', 'webpack', 'webpack.config.ts'),
  join('.config', 'rspack', 'rspack.config.ts'),
];

export default function migrate(context: Context): Context {
  for (const configPath of BUNDLER_CONFIG_PATHS) {
    migrateBundlerConfig(context, configPath);
  }

  return context;
}

function migrateBundlerConfig(context: Context, configPath: string): void {
  if (!context.doesFileExist(configPath)) {
    return;
  }

  const source = context.getFile(configPath);
  if (!source) {
    return;
  }

  // Any existing mention of extractComments (including user-supplied values
  // like `extractComments: false`) means we leave the file untouched.
  if (source.includes('extractComments')) {
    return;
  }

  const parsed = parseAsTypescript(source);
  if (!parsed.success) {
    migrationsDebug(`Failed to parse ${configPath}. Error: ${parsed.error.message}`);
    return;
  }

  let hasChanges = false;

  recast.visit(parsed.ast, {
    visitNewExpression(path) {
      const { node } = path;

      if (node.callee.type === 'Identifier' && node.callee.name === 'TerserPlugin' && node.arguments.length > 0) {
        const optionsArg = node.arguments[0];

        if (optionsArg.type === 'ObjectExpression' && !findObjectProperty(optionsArg, 'extractComments')) {
          const extractCommentsProperty = builders.property(
            'init',
            builders.identifier('extractComments'),
            builders.objectExpression([
              builders.property('init', builders.identifier('banner'), builders.literal(false)),
              builders.property('init', builders.identifier('filename'), builders.literal('LICENSE.txt')),
            ])
          );

          optionsArg.properties.unshift(extractCommentsProperty);
          hasChanges = true;
        }
      }

      return this.traverse(path);
    },
  });

  if (hasChanges) {
    context.updateFile(configPath, printAST(parsed.ast));
  }
}
