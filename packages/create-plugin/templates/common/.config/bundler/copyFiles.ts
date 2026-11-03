import fs from 'fs';
import path from 'path';
import { SOURCE_DIR } from './constants.ts';
import { getPluginJson, hasReadme } from './utils.ts';

const pluginJson = getPluginJson();
const logoPaths: string[] = Array.from(new Set([pluginJson.info?.logos?.large, pluginJson.info?.logos?.small])).filter(
  Boolean
);
const screenshotPaths: string[] = pluginJson.info?.screenshots?.map((s: { path: string }) => s.path) || [];

// a screenshot outside src, such as one in the docs folder, resolves from the project root
function resolveScreenshotSource(screenshotPath: string) {
  const root = process.cwd();
  const isOutsideSource =
    !fs.existsSync(path.resolve(root, SOURCE_DIR, screenshotPath)) && fs.existsSync(path.resolve(root, screenshotPath));
  return isOutsideSource ? path.resolve(root, screenshotPath) : screenshotPath;
}

export const copyFilePatterns = [
  // If src/README.md exists use it; otherwise the root README
  // To `compiler.options.output`
  { from: hasReadme() ? 'README.md' : '../README.md', to: '.', force: true },
  { from: 'plugin.json', to: '.' },
  { from: '../LICENSE', to: '.' },
  { from: '../CHANGELOG.md', to: '.', force: true },
  { from: '**/*.json', to: '.' },
  { from: '**/query_help.md', to: '.', noErrorOnMissing: true },
  ...logoPaths.map((logoPath) => ({ from: logoPath, to: logoPath })),
  ...screenshotPaths.map((screenshotPath) => ({
    from: resolveScreenshotSource(screenshotPath),
    to: screenshotPath,
  })),
];
