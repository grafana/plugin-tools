import path from 'node:path';
import { readJsonFile } from './utils.files.js';
import { compileTemplateFiles, getTemplateData } from '../utils/utils.templates.js';
import { UDPATE_CONFIG } from '../constants.js';

export function getPluginJson(srcDir?: string) {
  const srcPath = srcDir || path.join(process.cwd(), 'src');
  const pluginJsonPath = path.join(srcPath, 'plugin.json');
  return readJsonFile(pluginJsonPath);
}

// Updates the .config/ directory with the latest templates
export function updateDotConfigFolder() {
  compileTemplateFiles(UDPATE_CONFIG.filesToOverride, getTemplateData());
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
