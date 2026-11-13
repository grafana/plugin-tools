import type { Context } from '../../context.js';
import { migrationsDebug } from '../../utils.js';

const JEST_CONFIG_PATH = '.config/jest.config.js';
const OLD_TRANSFORM_PATTERN = '(t|j)sx?';
const NEW_TRANSFORM_PATTERN = '(t|j|mj)sx?';

export default function migrate(context: Context): Context {
  if (!context.doesFileExist(JEST_CONFIG_PATH)) {
    migrationsDebug(`${JEST_CONFIG_PATH} not found, skipping`);
    return context;
  }

  const content = context.getFile(JEST_CONFIG_PATH) ?? '';

  if (content.includes(NEW_TRANSFORM_PATTERN)) {
    migrationsDebug(`${JEST_CONFIG_PATH} already transforms .mjs files, skipping`);
    return context;
  }

  if (!content.includes(OLD_TRANSFORM_PATTERN)) {
    migrationsDebug(`Transform pattern not found in ${JEST_CONFIG_PATH}, skipping`);
    return context;
  }

  context.updateFile(JEST_CONFIG_PATH, content.replace(OLD_TRANSFORM_PATTERN, NEW_TRANSFORM_PATTERN));
  return context;
}
