import path from 'path';
import { TEMPLATE_PATHS } from '../constants';
import { readJsonFile } from './utils.files';
import { getTemplateData, renderTemplateFromFile } from './utils.templates';
import fs from 'fs';

export type PackageJson = {
  scripts: Record<string, string>;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  packageManager?: string;
} & Record<string, any>;
export function getPackageJson(): PackageJson {
  return readJsonFile(path.join(process.cwd(), 'package.json'));
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
