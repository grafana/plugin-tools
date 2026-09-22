import { join } from 'node:path';
import * as recast from 'recast';
import type { Context } from '../../context.js';
import { migrationsDebug } from '../../utils.js';
import { findObjectProperty, isProperty, parseAsTypescript, printAST } from '../../utils.ast.js';
import { addGrafanaESModules } from '../../utils.jest.js';

const { builders } = recast.types;

const JEST_CONFIG_PATH = join('.config', 'jest.config.js');
const ESM_MODULES_TO_ADD = ['@grafana/plugin-compat'];
const LEGACY_TRANSFORM_PATTERN = '^.+\\.(t|j)sx?$';
const MJS_TRANSFORM_PATTERN = '^.+\\.(t|j)sx?$|^.+\\.mjs$';

export default function migrate(context: Context): Context {
  addGrafanaESModules(context, ESM_MODULES_TO_ADD);
  addMjsToTransformPattern(context);

  return context;
}

/**
 * Packages that only publish `.mjs` files (such as `@grafana/plugin-compat`) are skipped by the scaffolded
 * `^.+\.(t|j)sx?$` transform pattern, so Jest loads them untransformed and fails with
 * "SyntaxError: Unexpected token 'export'" even when they are allow-listed in `transformIgnorePatterns`.
 */
function addMjsToTransformPattern(context: Context): void {
  if (!context.doesFileExist(JEST_CONFIG_PATH)) {
    migrationsDebug(`${JEST_CONFIG_PATH} not found. Skipping Jest .mjs transform migration.`);
    return;
  }

  const source = context.getFile(JEST_CONFIG_PATH);
  if (!source) {
    migrationsDebug(`${JEST_CONFIG_PATH} is empty. Skipping Jest .mjs transform migration.`);
    return;
  }

  // Any existing handling of .mjs files means the project already solved this its own way.
  if (source.includes('.mjs')) {
    return;
  }

  const parsed = parseAsTypescript(source);
  if (!parsed.success) {
    migrationsDebug(`Failed to parse ${JEST_CONFIG_PATH}. Error: ${parsed.error.message}`);
    return;
  }

  let hasChanges = false;

  recast.visit(parsed.ast, {
    visitObjectExpression(path) {
      const transform = findObjectProperty(path.node, 'transform');

      if (transform && isProperty(transform) && transform.value.type === 'ObjectExpression') {
        const legacyRule = findObjectProperty(transform.value, LEGACY_TRANSFORM_PATTERN);

        if (legacyRule && isProperty(legacyRule)) {
          legacyRule.key = builders.literal(MJS_TRANSFORM_PATTERN);
          hasChanges = true;
        }

        return false;
      }

      return this.traverse(path);
    },
  });

  if (!hasChanges) {
    migrationsDebug(`Could not find the '${LEGACY_TRANSFORM_PATTERN}' transform rule in ${JEST_CONFIG_PATH}.`);
    return;
  }

  context.updateFile(JEST_CONFIG_PATH, printAST(parsed.ast));
}
