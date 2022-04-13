import path from 'path';
import { readJsonFile } from './utils.files';

export function getPluginJson(srcDir?: string) {
  const srcPath = srcDir || path.join(process.cwd(), 'src');
  const pluginJsonPath = path.join(srcPath, 'plugin.json');

  return readJsonFile(pluginJsonPath);
}
