import { join } from 'node:path';
import * as recast from 'recast';
import type { Context } from '../../context.js';
import { migrationsDebug, removeDependenciesFromPackageJson } from '../../utils.js';
import { parseAsTypescript, printAST } from '../../utils.ast.js';

const PACKAGE_NAME = 'eslint-webpack-plugin';

const BUNDLER_CONFIG_PATHS = [
  join('.config', 'webpack', 'webpack.config.ts'),
  join('.config', 'rspack', 'rspack.config.ts'),
];

// Configs that extend the scaffolded ones and may import the plugin themselves.
const EXTENDED_CONFIG_PATHS = ['webpack.config.ts', 'rspack.config.ts'];

// eslint-webpack-plugin depends on micromatch, which pulls in braces. It only linted
// changed files during development, which `npm run lint` already covers.
export default function migrate(context: Context) {
  for (const configPath of BUNDLER_CONFIG_PATHS) {
    removeESLintPlugin(context, configPath);
  }

  const isStillUsed = [...BUNDLER_CONFIG_PATHS, ...EXTENDED_CONFIG_PATHS].some(
    (path) => context.doesFileExist(path) && (context.getFile(path) ?? '').includes(PACKAGE_NAME)
  );

  if (!isStillUsed && context.doesFileExist('package.json')) {
    removeDependenciesFromPackageJson(context, [PACKAGE_NAME], [PACKAGE_NAME]);
  }

  return context;
}

function removeESLintPlugin(context: Context, configPath: string): void {
  if (!context.doesFileExist(configPath)) {
    return;
  }

  const source = context.getFile(configPath);
  if (!source || !source.includes(PACKAGE_NAME)) {
    return;
  }

  const parsed = parseAsTypescript(source);
  if (!parsed.success) {
    migrationsDebug(`Failed to parse ${configPath}. Error: ${parsed.error.message}`);
    return;
  }

  const localNames = new Set<string>();
  const removedNodes: recast.types.namedTypes.Node[] = [];

  recast.visit(parsed.ast, {
    visitImportDeclaration(path) {
      if (path.node.source.value === PACKAGE_NAME) {
        for (const specifier of path.node.specifiers ?? []) {
          if (specifier.local?.name) {
            localNames.add(String(specifier.local.name));
          }
        }
        removedNodes.push(path.node);
        path.prune();
        return false;
      }
      return this.traverse(path);
    },
  });

  recast.visit(parsed.ast, {
    visitNewExpression(path) {
      const { node } = path;
      if (
        node.callee.type === 'Identifier' &&
        localNames.has(node.callee.name) &&
        path.parent?.node.type === 'ArrayExpression'
      ) {
        removedNodes.push(node);
        path.prune();
        return false;
      }
      return this.traverse(path);
    },
  });

  // Reprinting the AST reformats the surrounding plugins array, so drop the lines directly
  // when each removed node sits on its own lines, as it does in the scaffolded configs.
  context.updateFile(configPath, removeOwnLines(source, removedNodes) ?? printAST(parsed.ast));
}

function removeOwnLines(source: string, nodes: recast.types.namedTypes.Node[]): string | undefined {
  const lines = source.split('\n');
  const linesToRemove = new Set<number>();

  for (const node of nodes) {
    if (!node.loc) {
      return undefined;
    }
    const { start, end } = node.loc;
    const before = lines[start.line - 1].slice(0, start.column);
    const after = lines[end.line - 1].slice(end.column);
    if (before.trim() !== '' || !/^,?\s*$/.test(after)) {
      return undefined;
    }
    for (let line = start.line; line <= end.line; line++) {
      linesToRemove.add(line - 1);
    }
  }

  return lines.filter((_, index) => !linesToRemove.has(index)).join('\n');
}
