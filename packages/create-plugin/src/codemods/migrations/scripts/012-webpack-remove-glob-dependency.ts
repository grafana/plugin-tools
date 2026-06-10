import type { Context } from '../../context.js';
import * as recast from 'recast';
import * as typeScriptParser from 'recast/parsers/typescript.js';
import { removeDependenciesFromPackageJson } from '../../utils.js';

const targetFnBody = (() => {
  const raw = `export async function getEntries() {
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
  const ast = recast.parse(raw, {
    parser: typeScriptParser,
  });
  let out: any = undefined;
  recast.visit(ast, {
    visitFunctionDeclaration(path) {
      const { node } = path;
      out = node.body;
      return false;
    },
  });
  return out;
})();

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
      if (node.id && node.id.name === 'getEntries') {
        node.body = targetFnBody;
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
  for (const f of ['.config/webpack/utils.ts', '.config/bundler/utils.ts']) {
    if (context.doesFileExist(f)) {
      updateUtils(context, f);
    }
  }

  removeDependenciesFromPackageJson(context, [], ['glob']);

  return context;
}
