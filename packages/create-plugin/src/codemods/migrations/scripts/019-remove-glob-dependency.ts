import type { Context } from '../../context.js';
import * as recast from 'recast';
import {
  callsFunction,
  createImport,
  findImports,
  findFunctionDeclaration,
  findNamedImport,
  insertImports,
  parseAsTypescript,
  printAST,
} from '../../utils.ast.js';
import { migrationsDebug, removeDependenciesFromPackageJson } from '../../utils.js';

const OLD_PACKAGE_NAME = 'glob';
const NEW_PACKAGE_NAME = 'node:fs/promises';

const UTILS_PATHS = ['.config/webpack/utils.ts', '.config/bundler/utils.ts'];

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

export default function migrate(context: Context) {
  const updatedPaths = UTILS_PATHS.filter((filePath) => replaceGlobWithFsGlob(context, filePath));
  if (updatedPaths.length === 0) {
    return context;
  }

  const isStillUsed = UTILS_PATHS.some((filePath) => {
    const source = context.getFile(filePath);
    if (!source) {
      return false;
    }
    const parsed = parseAsTypescript(source);
    return !parsed.success || findImports(parsed.ast, OLD_PACKAGE_NAME).length > 0;
  });

  if (context.doesFileExist('package.json') && !isStillUsed) {
    removeDependenciesFromPackageJson(context, [OLD_PACKAGE_NAME], [OLD_PACKAGE_NAME]);
  }

  return context;
}

function replaceGlobWithFsGlob(context: Context, utilsPath: string): boolean {
  if (!context.doesFileExist(utilsPath)) {
    return false;
  }

  const source = context.getFile(utilsPath);
  if (!source || !source.includes(OLD_PACKAGE_NAME)) {
    return false;
  }

  const parsed = parseAsTypescript(source);
  if (!parsed.success) {
    migrationsDebug(`Failed to parse ${utilsPath}. Error: ${parsed.error.message}`);
    return false;
  }

  const globImport = findNamedImport(parsed.ast, OLD_PACKAGE_NAME, 'glob');
  if (!globImport) {
    return false;
  }

  const getEntries = findFunctionDeclaration(parsed.ast, 'getEntries');
  if (!getEntries) {
    return false;
  }

  // The new body calls glob directly, so an aliased import (and its calls) is left alone.
  if (!callsFunction(getEntries.body, 'glob')) {
    return false;
  }

  const { declaration, specifier } = globImport;
  declaration.specifiers = (declaration.specifiers ?? []).filter((candidate) => candidate !== specifier);
  if (declaration.specifiers.length === 0) {
    parsed.ast.program.body.splice(parsed.ast.program.body.indexOf(declaration), 1);
  }
  insertImports(parsed.ast, [createImport({ named: [{ name: 'glob' }] }, NEW_PACKAGE_NAME)]);

  getEntries.body = getFunctionBody(GET_ENTRIES_SOURCE);

  context.updateFile(utilsPath, printAST(parsed.ast));
  return true;
}

function getFunctionBody(source: string): recast.types.namedTypes.BlockStatement {
  const parsed = parseAsTypescript(source);
  if (!parsed.success) {
    throw parsed.error;
  }

  const [statement] = parsed.ast.program.body;
  if (statement?.type !== 'ExportNamedDeclaration' || statement.declaration?.type !== 'FunctionDeclaration') {
    throw new Error('Failed to parse target function body');
  }

  return statement.declaration.body;
}
