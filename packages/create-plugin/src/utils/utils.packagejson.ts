import path from 'node:path';
import { TEMPLATE_PATHS } from '../constants.js';
import { isFile, readJsonFile } from './utils.files.js';
import { getTemplateData, renderTemplateFromFile } from './utils.templates.js';
import fs from 'node:fs';

export type PackageJson = {
  scripts: Record<string, string>;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  packageManager?: string;
} & Record<string, any>;

export function doesPackageJsonExist(rootPath = process.cwd()): PackageJson {
  return isFile(path.join(rootPath, 'package.json'));
}

export function getPackageJson(rootPath = process.cwd()): PackageJson {
  try {
    return readJsonFile(path.join(rootPath, 'package.json'));
  } catch {
    // In case there is no package.json yet (scaffolding the plugin from scratch), return with an empty object
    return {};
  }
}

// Returns with a package.json that is generated based on the latest templates
export function getLatestPackageJson(): PackageJson {
  const packageJsonPath = path.join(TEMPLATE_PATHS.common, '_package.json');
  const data = getTemplateData();

  return JSON.parse(renderTemplateFromFile(packageJsonPath, data));
}

export function writePackageJson(json: PackageJson) {
  return fs.writeFileSync(path.join(process.cwd(), 'package.json'), `${JSON.stringify(json, null, 2)}\n`);
}
