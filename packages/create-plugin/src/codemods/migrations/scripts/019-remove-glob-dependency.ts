import type { Context } from '../../context.js';
import * as recast from 'recast';
import * as typeScriptParser from 'recast/parsers/typescript.js';
import { parseAsTypescript } from '../../utils.ast.js';
import { removeDependenciesFromPackageJson } from '../../utils.js';

const GET_ENTRIES_SOURCE = `export async function getEntries() {
  const plugins: string[][] = [];
  for await (const pluginJson of glob('**/src/**/plugin.json')) {
    const folder = path.dirname(pluginJson);
    const modules: string[] = [];
    for await (const module of glob(\`\${folder}/module.{ts,tsx,js,jsx}\`)) {
      modules.push(path.resolve(module));
    }
    plugins.push(modules);
  }

  return plugins.reduce<Record<string, string>>((result, modules) => {
    return modules.reduce((innerResult, module) => {
      const pluginPath = path.dirname(module);
      const pluginName = path.relative(process.cwd(), pluginPath).replace(/src\\/?/i, '');
      const entryName = pluginName === '' ? 'module' : \`\${pluginName}/module\`;

      innerResult[entryName] = module;
      return innerResult;
    }, result);
  }, {});
}`;

function getTargetFnBody() {
  const parsed = parseAsTypescript(GET_ENTRIES_SOURCE);

  if (!parsed.success) {
    throw parsed.error;
  }

  const [statement] = parsed.ast.program.body;

  if (statement?.type !== 'ExportNamedDeclaration' || statement.declaration?.type !== 'FunctionDeclaration') {
    throw new Error('Failed to parse target function body');
  }

  return statement.declaration.body;
}

function updateUtils(context: Context, target: string) {
  const webpackConfigContent = context.getFile(target);
  if (!webpackConfigContent) {
    return;
  }

  const ast = recast.parse(webpackConfigContent, {
    parser: typeScriptParser,
  });

  let hasChanges = true;
  recast.visit(ast, {
    visitImportDeclaration(path) {
      const { node } = path;
      if (node.source.value === 'glob') {
        node.source.value = 'node:fs/promises';
        hasChanges = true;
      }
      return this.traverse(path);
    },
    visitFunctionDeclaration(path) {
      const { node } = path;
      if (node.id?.name === 'getEntries') {
        node.body = getTargetFnBody();
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
    context.updateFile(target, output.code);
  }
}

export default function migrate(context: Context) {
  for (const filePath of ['.config/webpack/utils.ts', '.config/bundler/utils.ts']) {
    if (context.doesFileExist(filePath)) {
      updateUtils(context, filePath);
    }
  }

  removeDependenciesFromPackageJson(context, [], ['glob']);

  return context;
}
