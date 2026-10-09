import type { Context } from '../../context.js';
import { addDependenciesToPackageJson } from '../../utils.js';

const JEST_SETUP_PATH = '.config/jest-setup.js';
const BROKEN_CANVAS_STUB_PATTERN = /^HTMLCanvasElement\.prototype\.getContext\s*=\s*\(\)\s*=>\s*\{\};\s*\n?/m;
const CANVAS_MOCK_IMPORT = "import 'jest-canvas-mock';";
const JEST_CANVAS_MOCK_VERSION = '^2.5.2';

export default function migrate(context: Context) {
  if (!context.doesFileExist(JEST_SETUP_PATH)) {
    return context;
  }

  const original = context.getFile(JEST_SETUP_PATH) ?? '';
  let updated = original;

  if (BROKEN_CANVAS_STUB_PATTERN.test(updated)) {
    updated = updated.replace(BROKEN_CANVAS_STUB_PATTERN, '');
  }

  if (!updated.includes(CANVAS_MOCK_IMPORT)) {
    updated = addCanvasMockImport(updated);
  }

  if (updated !== original) {
    context.updateFile(JEST_SETUP_PATH, updated);
  }

  addDependenciesToPackageJson(context, {}, { 'jest-canvas-mock': JEST_CANVAS_MOCK_VERSION });

  return context;
}

function addCanvasMockImport(content: string) {
  const anchor = "import '@testing-library/jest-dom';";
  if (content.includes(anchor)) {
    return content.replace(anchor, `${anchor}\n${CANVAS_MOCK_IMPORT}`);
  }
  return `${CANVAS_MOCK_IMPORT}\n${content}`;
}
