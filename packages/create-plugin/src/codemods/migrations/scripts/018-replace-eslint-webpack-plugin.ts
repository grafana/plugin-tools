import { join } from 'node:path';
import * as recast from 'recast';
import type { Context } from '../../context.js';
import { addDependenciesToPackageJson, migrationsDebug, removeDependenciesFromPackageJson } from '../../utils.js';
import { parseAsTypescript } from '../../utils.ast.js';
import { output } from '../../../utils/utils.console.js';

const OLD_PACKAGE_NAME = 'eslint-webpack-plugin';
const NEW_PACKAGE_NAME = 'diagnostics-webpack-plugin';

const WEBPACK_CONFIG_PATH = join('.config', 'webpack', 'webpack.config.ts');

// The rspack config keeps eslint-webpack-plugin, diagnostics-webpack-plugin relies on webpack-only compiler hooks.
const CONFIG_PATHS = [
  WEBPACK_CONFIG_PATH,
  join('.config', 'rspack', 'rspack.config.ts'),
  'webpack.config.ts',
  'rspack.config.ts',
];

// Options the template has scaffolded over time, with whitespace, comments and trailing commas stripped.
const SCAFFOLDED_OPTIONS = [
  "{extensions:['.ts','.tsx'],lintDirtyModulesOnly:Boolean(env.development)}",
  "{extensions:['.ts','.tsx'],lintDirtyModulesOnly:Boolean(env.development),failOnError:Boolean(env.production)}",
];

const NEW_IMPORT = `import DiagnosticsPlugin from '${NEW_PACKAGE_NAME}';`;
const NEW_PLUGIN = `new DiagnosticsPlugin({
  lintOnStart: false, // don't lint on start, only lint changed files
  checks: [{ use: 'eslint', extensions: ['ts', 'tsx'] }],
})`;

// eslint-webpack-plugin depends on micromatch, which pulls in braces. diagnostics-webpack-plugin uses picomatch
// instead and needs webpack 5.106 or newer.
export default function migrate(context: Context) {
  if (!replaceESLintPlugin(context)) {
    return context;
  }

  if (context.doesFileExist('package.json')) {
    addDependenciesToPackageJson(context, {}, { [NEW_PACKAGE_NAME]: '^1.0.1', webpack: '^5.106.0' });

    const isStillUsed = CONFIG_PATHS.some(
      (path) => context.doesFileExist(path) && (context.getFile(path) ?? '').includes(OLD_PACKAGE_NAME)
    );
    if (!isStillUsed) {
      removeDependenciesFromPackageJson(context, [OLD_PACKAGE_NAME], [OLD_PACKAGE_NAME]);
    }
  }

  return context;
}

function replaceESLintPlugin(context: Context): boolean {
  if (!context.doesFileExist(WEBPACK_CONFIG_PATH)) {
    return false;
  }

  const source = context.getFile(WEBPACK_CONFIG_PATH);
  if (!source || !source.includes(OLD_PACKAGE_NAME)) {
    return false;
  }

  const parsed = parseAsTypescript(source);
  if (!parsed.success) {
    migrationsDebug(`Failed to parse ${WEBPACK_CONFIG_PATH}. Error: ${parsed.error.message}`);
    return false;
  }

  // Splice the source text rather than reprinting the AST, which would reformat the surrounding plugins array.
  const lineOffsets = [0];
  for (const line of source.split('\n')) {
    lineOffsets.push(lineOffsets[lineOffsets.length - 1] + line.length + 1);
  }
  const toOffset = ({ line, column }: { line: number; column: number }) => lineOffsets[line - 1] + column;

  const localNames = new Set<string>();
  const replacements: Array<{ node: recast.types.namedTypes.Node; text: string }> = [];
  let hasCustomOptions = false;

  recast.visit(parsed.ast, {
    visitImportDeclaration(path) {
      if (path.node.source.value === OLD_PACKAGE_NAME) {
        for (const specifier of path.node.specifiers ?? []) {
          if (specifier.local?.name) {
            localNames.add(String(specifier.local.name));
          }
        }
        replacements.push({ node: path.node, text: NEW_IMPORT });
        return false;
      }
      return this.traverse(path);
    },
  });

  recast.visit(parsed.ast, {
    visitNewExpression(path) {
      const { node } = path;
      if (node.callee.type === 'Identifier' && localNames.has(node.callee.name)) {
        const [options] = node.arguments;
        const optionsText = options?.loc ? source.slice(toOffset(options.loc.start), toOffset(options.loc.end)) : '';
        const normalized = optionsText
          .replace(/\/\/.*$/gm, '')
          .replace(/\s+/g, '')
          .replace(/,}/g, '}');
        if (node.arguments.length !== 1 || !SCAFFOLDED_OPTIONS.includes(normalized)) {
          hasCustomOptions = true;
        }
        replacements.push({ node, text: NEW_PLUGIN });
        return false;
      }
      return this.traverse(path);
    },
  });

  if (hasCustomOptions) {
    output.warning({
      title: `Skipping the ${OLD_PACKAGE_NAME} replacement in ${WEBPACK_CONFIG_PATH}`,
      body: [
        `The ${OLD_PACKAGE_NAME} options differ from the scaffolded defaults, so the config was left as is.`,
        `${OLD_PACKAGE_NAME} depends on micromatch, which pulls in braces. To drop it, switch to ${NEW_PACKAGE_NAME} by hand.`,
      ],
    });
    return false;
  }

  let updated = source;
  const sorted = replacements
    .filter(({ node }) => node.loc)
    .sort(
      (a, b) => b.node.loc!.start.line - a.node.loc!.start.line || b.node.loc!.start.column - a.node.loc!.start.column
    );
  for (const { node, text } of sorted) {
    const { start, end } = node.loc!;
    const indent = ' '.repeat(start.column);
    updated = updated.slice(0, toOffset(start)) + text.replaceAll('\n', `\n${indent}`) + updated.slice(toOffset(end));
  }

  context.updateFile(WEBPACK_CONFIG_PATH, updated);
  return true;
}
