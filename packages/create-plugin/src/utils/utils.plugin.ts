import path from 'node:path';
import { readJsonFile } from './utils.files.js';
import { compileTemplateFiles, getTemplateData } from './utils.templates.js';
import { UDPATE_CONFIG } from '../constants.js';
import { prettifyFiles } from './utils.prettifyFiles.js';

export function getPluginJson(srcDir?: string) {
  const srcPath = srcDir || path.join(process.cwd(), 'src');
  const pluginJsonPath = path.join(srcPath, 'plugin.json');
  return readJsonFile(pluginJsonPath);
}

// Checks if the given directory (defaults to CWD) is a valid root directory of a plugin
export function isPluginDirectory(rootPath = process.cwd()) {
  try {
    getPluginJson(path.join(rootPath, 'src'));
    return true;
  } catch (e) {
    return false;
  }
}

// Updates the .config/ directory with the latest templates
export async function updateDotConfigFolder() {
  compileTemplateFiles(UDPATE_CONFIG.filesToOverride, getTemplateData());
  await prettifyFiles({ targetPath: '.config', projectRoot: '.' });
}
