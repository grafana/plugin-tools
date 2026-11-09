import { join } from 'node:path';
import { TEMPLATE_PATHS } from '../../../constants.js';
import type { Context } from '../../context.js';
import { renderTemplate } from '../../utils.js';

const README_PATH = '.config/README.md';

export default function migrate(context: Context): Context {
  if (!context.doesFileExist(README_PATH)) {
    return context;
  }

  const readme = renderTemplate(join(TEMPLATE_PATHS.common, README_PATH), false, {});
  context.updateFile(README_PATH, readme);
  return context;
}
