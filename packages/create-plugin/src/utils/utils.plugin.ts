import path from 'node:path';
import { isFile, readJsonFile } from './utils.files.js';
import { compileTemplateFiles, getTemplateData } from './utils.templates.js';
import { UDPATE_CONFIG } from '../constants.js';
import { prettifyFiles } from './utils.prettifyFiles.js';

export function getPluginJsonPath(srcDri?: string) {
  const srcPath = srcDir || path.join(process.cwd(), 'src');

  return path.join(srcPath, 'plugin.json');
}

export function doesPluginJsonExist(srcDir?: string) {
  return isFile(getPluginJsonPath(srcDir));
}

export function getPluginJson(srcDir?: string) {
  try {
    return readJsonFile(getPluginJsonPath(srcDir));
  } catch {
    // In case there is no plugin.json yet (scaffolding the plugin from scratch), return with an empty object
    return {};
  }
}

// Checks if CWD is a valid root directory of a plugin
export function isPluginDirectory() {
  return doesPluginJsonExist();
}

// Updates the .config/ directory with the latest templates
export async function updateDotConfigFolder() {
  compileTemplateFiles(UDPATE_CONFIG.filesToOverride, getTemplateData());
  await prettifyFiles({ targetPath: '.config', projectRoot: '.' });
}
