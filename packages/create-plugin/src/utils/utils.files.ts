import path from 'node:path';
import fs from 'node:fs';
import { TEMPLATE_PATHS } from '../constants.js';
import { access, constants } from 'fs/promises';

// Removes common template files from the list in case they have a plugin-specific override
export function filterOutCommonFiles(files: string[], pluginType: string) {
  const isFileCommonAndOverriden = (file: string) =>
    file.includes(TEMPLATE_PATHS.common) &&
    files.includes(file.replace(TEMPLATE_PATHS.common, TEMPLATE_PATHS[pluginType]));

  return files.filter((file) => (isFileCommonAndOverriden(file) ? false : true));
}

export function isFile(path: string) {
  try {
    return fs.lstatSync(path).isFile();
  } catch (e) {
    return false;
  }
}

export function readJsonFile(filename: string) {
  if (!isFile(filename)) {
    throw new Error(
      `There is no "${path.basename(
        filename
      )}" file found at "${filename}". Make sure you run this command from a plugins root directory.`
    );
  }

  try {
    return JSON.parse(fs.readFileSync(filename).toString());
  } catch (error: any) {
    error.message = `Cannot parse the "${path.basename(filename)}" file at ${filename}.`;
    throw error;
  }
}

export async function directoryExists(path: string) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch (e) {
    return false;
  }
}

export function getOnlyExistingInCwd(files: string[]) {
  return files.filter((file) => fs.existsSync(path.join(process.cwd(), file)));
}

export function getOnlyNotExistingInCwd(files: string[]) {
  return files.filter((file) => !fs.existsSync(path.join(process.cwd(), file)));
}

export function removeFilesInCwd(files: string[]) {
  for (const file of files) {
    fs.rmSync(path.join(process.cwd(), file), { recursive: true, force: true });
  }
}

/** Given a exported file name it'll return its equivalent
 * in the template folder.
 */
export function getExportTemplateName(f: string) {
  const baseName = path.basename(f);
  for (const [key, value] of Object.entries(configFileNamesMap)) {
    if (value === baseName) {
      return key;
    }
  }
  return baseName;
}

export function getExportFileName(f: string) {
  const baseName = path.basename(f);

  if (Object.keys(configFileNamesMap).includes(baseName)) {
    return configFileNamesMap[baseName];
  }

  return path.extname(f) === '.hbs' ? path.basename(f, '.hbs') : baseName;
}

// yarn and npm packing will not include `.gitignore` files
// so we have to manually rename them to add the dot prefix
// other config files trip up the tooling in the plugin-tools monorepo
const configFileNamesMap: Record<string, string> = {
  gitignore: '.gitignore',
  npmrc: '.npmrc',
  _eslintrc: '.eslintrc',
  '_package.json': 'package.json',
  'playwright.config': 'playwright.config.ts',
};

/**
 * Returns TRUE if the file is starting with any of the provided string filters.
 *
 * @param file - Path of the file
 * @param filter - A single or array of strings to filter the files by - only returns TRUE if the file starts with any of the provided filter(s).
 */
export function isFileStartingWith(file: string, filter: string | string[]) {
  if (Array.isArray(filter)) {
    return filter.some((f) => file.startsWith(f));
  }

  return file.startsWith(filter);
}
