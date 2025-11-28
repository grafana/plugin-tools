import { join, isAbsolute, relative } from 'node:path';
import { existsSync } from 'node:fs';

/**
 * Source maps can have different path formats. This function normalises the path relative to the plugin root
 * and returns the absolute path to the source file.
 */
export function getSourceFilePath(sourceFilePath: string, pluginRoot = process.cwd()) {
  let filePath = sourceFilePath;

  if (filePath.startsWith('webpack://')) {
    // webpack://package-name/src/file.tsx -> src/file.tsx
    // webpack://package-name/node_modules/... -> node_modules/...
    filePath = filePath.replace(/^webpack:\/\/[^/]+\//, '');
  }

  if (!isAbsolute(filePath)) {
    filePath = join(pluginRoot, filePath);
  }

  return filePath;
}
