import { join } from 'node:path';
import * as recast from 'recast';
import type { Context } from '../../context.js';
import { migrationsDebug } from '../../utils.js';
import { findVariableDeclaration, parseAsTypescript, printAST } from '../../utils.ast.js';

const { builders } = recast.types;

const JEST_UTILS_PATH = join('.config', 'jest', 'utils.js');
const ESM_MODULES_TO_ADD = ['@react-hookz/web', '@ver0/deep-equal'];

export default function migrate(context: Context): Context {
  if (!context.doesFileExist(JEST_UTILS_PATH)) {
    migrationsDebug(`${JEST_UTILS_PATH} not found. Skipping Jest ESM modules migration.`);
    return context;
  }

  const source = context.getFile(JEST_UTILS_PATH);
  if (!source) {
    migrationsDebug(`${JEST_UTILS_PATH} is empty. Skipping Jest ESM modules migration.`);
    return context;
  }

  const parsed = parseAsTypescript(source);
  if (!parsed.success) {
    migrationsDebug(`Failed to parse ${JEST_UTILS_PATH}. Error: ${parsed.error.message}`);
    return context;
  }

  const grafanaESModules = findVariableDeclaration(parsed.ast, 'grafanaESModules');
  if (!grafanaESModules) {
    migrationsDebug(`Could not find grafanaESModules variable declaration in ${JEST_UTILS_PATH}`);
    return context;
  }

  if (grafanaESModules.init?.type !== 'ArrayExpression') {
    migrationsDebug(`grafanaESModules variable in ${JEST_UTILS_PATH} is not an array.`);
    return context;
  }

  const existingModules = new Set(
    grafanaESModules.init.elements.map(getStringValue).filter((value) => value !== undefined)
  );
  const missingModules = ESM_MODULES_TO_ADD.filter((moduleName) => !existingModules.has(moduleName));

  if (missingModules.length === 0) {
    return context;
  }

  const schemaIndex = grafanaESModules.init.elements.findIndex(
    (element) => getStringValue(element) === '@grafana/schema'
  );
  const insertIndex = schemaIndex === -1 ? grafanaESModules.init.elements.length : schemaIndex + 1;

  grafanaESModules.init.elements.splice(
    insertIndex,
    0,
    ...missingModules.map((moduleName) => builders.literal(moduleName))
  );
  context.updateFile(JEST_UTILS_PATH, printAST(parsed.ast));

  return context;
}

function getStringValue(element: recast.types.namedTypes.ArrayExpression['elements'][number]): string | undefined {
  if (!element) {
    return undefined;
  }

  if (element.type === 'Literal' && typeof element.value === 'string') {
    return element.value;
  }

  if (element.type === 'StringLiteral') {
    return element.value;
  }

  return undefined;
}
