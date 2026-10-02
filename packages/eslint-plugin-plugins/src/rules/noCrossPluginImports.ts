import fs from 'node:fs';
import path from 'node:path';
import { ESLintUtils, AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/grafana/plugin-tools/tree/main/packages/eslint-plugin-plugins#${name}`
);

type MessageIds = 'crossPluginImport' | 'importOutsidePlugin';

const pluginRootCache = new Map<string, string | undefined>();

// The nearest directory at or above `startPath` that holds a src/plugin.json. Nested plugins inside an app
// (src/<nested>/plugin.json) belong to the app, so they resolve to the same root.
function findPluginRoot(startPath: string): string | undefined {
  const cached = pluginRootCache.get(startPath);
  if (cached !== undefined || pluginRootCache.has(startPath)) {
    return cached;
  }

  let currentDir = startPath;
  let pluginRoot: string | undefined;

  while (true) {
    if (fs.existsSync(path.join(currentDir, 'src', 'plugin.json'))) {
      pluginRoot = currentDir;
      break;
    }
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      break;
    }
    currentDir = parentDir;
  }

  pluginRootCache.set(startPath, pluginRoot);
  return pluginRoot;
}

function isWithin(target: string, root: string) {
  const relative = path.relative(root, target);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function getPackageName(specifier: string) {
  const segments = specifier.split('/');
  return specifier.startsWith('@') ? segments.slice(0, 2).join('/') : segments[0];
}

// Follows node_modules lookup from `fromDir` to the package's real directory (workspace packages are symlinks).
function resolvePackageDir(packageName: string, fromDir: string): string | undefined {
  let currentDir = fromDir;

  while (true) {
    const candidate = path.join(currentDir, 'node_modules', packageName);
    if (fs.existsSync(candidate)) {
      return fs.realpathSync(candidate);
    }
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      return undefined;
    }
    currentDir = parentDir;
  }
}

export const noCrossPluginImports = createRule<[], MessageIds>({
  name: 'no-cross-plugin-imports',
  meta: {
    docs: {
      description:
        'Disallows importing code from another plugin, or from outside the plugin by relative path. Each plugin is bundled and shipped on its own, so shared code belongs in a workspace package.',
    },
    messages: {
      crossPluginImport:
        '"{{specifier}}" imports code from another plugin. Plugins are bundled separately, so move shared code into a workspace package and depend on it instead.',
      importOutsidePlugin:
        '"{{specifier}}" reaches outside this plugin. Import shared code through a workspace package instead of a relative path.',
    },
    schema: [],
    type: 'problem',
  },
  defaultOptions: [],
  create: (context) => {
    const fileDir = path.dirname(context.filename);
    const pluginRoot = findPluginRoot(fileDir);

    // Files outside a plugin (for example repo-level scripts) are not restricted.
    if (!pluginRoot) {
      return {};
    }

    const check = (node: TSESTree.Node, specifier: unknown) => {
      if (typeof specifier !== 'string' || specifier === '') {
        return;
      }

      if (specifier.startsWith('.') || path.isAbsolute(specifier)) {
        const target = path.resolve(fileDir, specifier);
        if (isWithin(target, pluginRoot)) {
          return;
        }
        const targetPluginRoot = findPluginRoot(target);
        context.report({
          node,
          messageId: targetPluginRoot ? 'crossPluginImport' : 'importOutsidePlugin',
          data: { specifier },
        });
        return;
      }

      const packageDir = resolvePackageDir(getPackageName(specifier), fileDir);
      if (packageDir && packageDir !== pluginRoot && fs.existsSync(path.join(packageDir, 'src', 'plugin.json'))) {
        context.report({ node, messageId: 'crossPluginImport', data: { specifier } });
      }
    };

    return {
      ImportDeclaration: (node) => check(node.source, node.source.value),
      ExportAllDeclaration: (node) => check(node.source, node.source.value),
      ExportNamedDeclaration: (node) => {
        if (node.source) {
          check(node.source, node.source.value);
        }
      },
      ImportExpression: (node) => {
        if (node.source.type === AST_NODE_TYPES.Literal) {
          check(node.source, node.source.value);
        }
      },
      CallExpression: (node) => {
        const [firstArgument] = node.arguments;
        if (
          node.callee.type === AST_NODE_TYPES.Identifier &&
          node.callee.name === 'require' &&
          firstArgument?.type === AST_NODE_TYPES.Literal
        ) {
          check(firstArgument, firstArgument.value);
        }
      },
    };
  },
});
