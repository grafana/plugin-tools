import type { Context } from '../../context.js';
import { migrationsDebug } from '../../utils.js';

const MOCK_PATH = '.config/jest/mocks/react-inlinesvg.tsx';

const REPLACEMENTS = [
  ['const SVG_FILE_NAME_REGEX = /(.+)\\/(.+)\\.svg$/;', 'const SVG_FILE_NAME_REGEX = /.\\/([^/]+)\\.svg$/;'],
  [
    "const testId = src.replace(SVG_FILE_NAME_REGEX, '$2');",
    'const testId = src.match(SVG_FILE_NAME_REGEX)?.[1] ?? src;',
  ],
];

export default function migrate(context: Context): Context {
  if (!context.doesFileExist(MOCK_PATH)) {
    migrationsDebug(`${MOCK_PATH} not found, skipping`);
    return context;
  }

  const content = context.getFile(MOCK_PATH) ?? '';

  // The new regex changes the capture group, so only migrate when both the
  // original regex and its test ID extraction are present.
  if (!REPLACEMENTS.every(([from]) => content.includes(from))) {
    migrationsDebug(`${MOCK_PATH} does not contain the original regex usage, skipping`);
    return context;
  }

  const updatedContent = REPLACEMENTS.reduce((acc, [from, to]) => acc.replace(from, () => to), content);
  context.updateFile(MOCK_PATH, updatedContent);
  return context;
}
