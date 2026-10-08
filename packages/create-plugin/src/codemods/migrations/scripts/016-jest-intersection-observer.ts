import type { Context } from '../../context.js';
import { addDependenciesToPackageJson } from '../../utils.js';

const JEST_SETUP_PATH = '.config/jest-setup.js';
const INTERSECTION_OBSERVER_IMPORT = "import 'intersection-observer';";
const INTERSECTION_OBSERVER_VERSION = '^0.12.2';

export default function migrate(context: Context) {
  if (!context.doesFileExist(JEST_SETUP_PATH)) {
    return context;
  }

  const original = context.getFile(JEST_SETUP_PATH) ?? '';

  if (!original.includes(INTERSECTION_OBSERVER_IMPORT)) {
    const updated = addIntersectionObserverImport(original);
    context.updateFile(JEST_SETUP_PATH, updated);
  }

  addDependenciesToPackageJson(context, {}, { 'intersection-observer': INTERSECTION_OBSERVER_VERSION });

  return context;
}

function addIntersectionObserverImport(content: string) {
  const anchor = "import 'jest-canvas-mock';";
  if (content.includes(anchor)) {
    return content.replace(anchor, `${anchor}\n${INTERSECTION_OBSERVER_IMPORT}`);
  }
  return `${INTERSECTION_OBSERVER_IMPORT}\n${content}`;
}
