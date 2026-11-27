import { applyEdits, modify, parse, type JSONPath } from 'jsonc-parser';
import type { Context } from '../../context.js';

const TSCONFIG_PATH = '.config/tsconfig.json';

// Paths in .config/tsconfig.json used to be relative to .config itself, which ties the config to living
// inside the plugin. `${configDir}` resolves to the directory of the tsconfig that extends it instead.
const SCAFFOLDED_SRC = '../src';
const CONFIG_DIR_SRC = '${configDir}/src';
const SCAFFOLDED_PATHS = ['../src/*'];
const SCAFFOLDED_TYPE_ROOTS = ['../node_modules/@types'];

type TsConfig = {
  compilerOptions?: {
    rootDir?: unknown;
    paths?: Record<string, unknown>;
    typeRoots?: unknown;
  };
  include?: unknown;
};

function isEqualJson(a: unknown, b: unknown) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export default function migrate(context: Context) {
  if (!context.doesFileExist(TSCONFIG_PATH)) {
    return context;
  }

  const original = context.getFile(TSCONFIG_PATH) || '';
  const config: TsConfig = parse(original) ?? {};
  const compilerOptions = config.compilerOptions ?? {};
  const edits: Array<{ path: JSONPath; value: unknown }> = [];

  if (compilerOptions.rootDir === SCAFFOLDED_SRC) {
    edits.push({ path: ['compilerOptions', 'rootDir'], value: CONFIG_DIR_SRC });
  }

  if (isEqualJson(compilerOptions.paths?.['*'], SCAFFOLDED_PATHS)) {
    edits.push({ path: ['compilerOptions', 'paths', '*'], value: [`${CONFIG_DIR_SRC}/*`] });
  }

  // The default typeRoots walk up every enclosing node_modules/@types, which also finds hoisted types.
  if (isEqualJson(compilerOptions.typeRoots, SCAFFOLDED_TYPE_ROOTS)) {
    edits.push({ path: ['compilerOptions', 'typeRoots'], value: undefined });
  }

  if (Array.isArray(config.include) && config.include.includes(SCAFFOLDED_SRC)) {
    const include = config.include.map((entry) => (entry === SCAFFOLDED_SRC ? CONFIG_DIR_SRC : entry));
    edits.push({ path: ['include'], value: include });
  }

  if (edits.length === 0) {
    return context;
  }

  const formattingOptions = { formattingOptions: { insertSpaces: true, tabSize: 2 } };
  // Apply edits one at a time so each offset is computed against the content it changes.
  const updated = edits.reduce(
    (content, edit) => applyEdits(content, modify(content, edit.path, edit.value, formattingOptions)),
    original
  );

  context.updateFile(TSCONFIG_PATH, updated);

  return context;
}
