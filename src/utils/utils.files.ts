import path from 'path';
import fs from 'fs';
import { TEMPLATE_PATHS } from '../constants';

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
