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
