import { execFile as nodeExecFile } from 'node:child_process';
import fs from 'node:fs';
import { resolve } from 'node:path';
import { promisify } from 'node:util';
import { getPackageJson } from './utils.packagejson.js';

const execFile = promisify(nodeExecFile);

type PrettifyFilesArgs = {
  // The path where we want to prettify files, defaults to the CWD
  targetPath?: string;

  // In case the `targetPath` would be set to a subdirectory, e.g. `.config/`. Defaults to `targetPath`.
  projectRoot?: string;
};

export async function prettifyFiles(options: PrettifyFilesArgs) {
  const targetPath = options.targetPath ?? process.cwd();
  const projectRoot = options.projectRoot ?? targetPath;

  if (!isPrettierUsed(projectRoot)) {
    return 'Prettify skipped, because it is not used in this project.';
  }

  if (!fs.existsSync(targetPath)) {
    return '';
  }

  const prettierVersion = getPrettierVersion(projectRoot);
  const directoryToWrite = resolve(projectRoot, targetPath);

  try {
    let command = 'npx';
    const args = ['-y', `prettier@${prettierVersion}`, directoryToWrite, '--write'];
    await execFile(command, args);
  } catch (error) {
    throw new Error(
      'There was a problem running prettier on the plugin files. Please run `npx -y prettier@2 . --write` manually in your plugin directory.'
    );
  }
  return '';
}

function isPrettierUsed(projectRoot?: string) {
  return Boolean(getPrettierVersion(projectRoot));
}

function getPrettierVersion(projectRoot?: string) {
  const packageJson = getPackageJson(projectRoot);
  return packageJson.devDependencies?.prettier || packageJson.dependencies?.prettier;
}
