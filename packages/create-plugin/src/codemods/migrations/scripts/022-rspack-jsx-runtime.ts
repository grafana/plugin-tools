import * as recast from 'recast';
import type { Context } from '../../context.js';
import { migrationsDebug } from '../../utils.js';
import {
  findNestedProperty,
  findObjectProperty,
  isBooleanLiteral,
  isProperty,
  isStringLiteral,
  parseAsTypescript,
  printAST,
} from '../../utils.ast.js';

const RSPACK_CONFIG_PATH = '.config/rspack/rspack.config.ts';

export default function migrate(context: Context): Context {
  if (!context.doesFileExist(RSPACK_CONFIG_PATH)) {
    migrationsDebug(`${RSPACK_CONFIG_PATH} not found, skipping`);
    return context;
  }

  const parsed = parseAsTypescript(context.getFile(RSPACK_CONFIG_PATH) ?? '');
  if (!parsed.success) {
    migrationsDebug(`Failed to parse ${RSPACK_CONFIG_PATH}: ${parsed.error.message}`);
    return context;
  }

  let hasChanged = false;

  recast.types.visit(parsed.ast, {
    visitObjectExpression(path) {
      if (!isSwcLoaderRule(path.node)) {
        return this.traverse(path);
      }

      const development = findNestedProperty(path.node, ['options', 'jsc', 'transform', 'react', 'development']);

      if (!development) {
        migrationsDebug(`No jsc.transform.react.development option on swc-loader in ${RSPACK_CONFIG_PATH}, skipping`);
        return false;
      }

      if (isBooleanLiteral(development.value, false)) {
        migrationsDebug(`swc-loader development option is already false in ${RSPACK_CONFIG_PATH}, skipping`);
        return false;
      }

      development.value = recast.types.builders.literal(false);
      hasChanged = true;
      return false;
    },
  });

  if (!hasChanged) {
    return context;
  }

  context.updateFile(RSPACK_CONFIG_PATH, printAST(parsed.ast));
  return context;
}

function isSwcLoaderRule(rule: recast.types.namedTypes.ObjectExpression): boolean {
  const loader = findObjectProperty(rule, 'loader');
  if (!loader || !isProperty(loader)) {
    return false;
  }
  return isStringLiteral(loader.value, 'builtin:swc-loader');
}
