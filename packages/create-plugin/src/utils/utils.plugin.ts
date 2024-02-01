import path from 'node:path';
import { readJsonFile } from './utils.files.js';

export function getPluginJson(srcDir?: string) {
  const srcPath = srcDir || path.join(process.cwd(), 'src');
  const pluginJsonPath = path.join(srcPath, 'plugin.json');
  return readJsonFile(pluginJsonPath);
}

// Checks if CWD is a valid root directory of a plugin
export function isPluginDirectory() {
  try {
    getPluginJson();
    return true;
  } catch (e) {
    return false;
  }
}
