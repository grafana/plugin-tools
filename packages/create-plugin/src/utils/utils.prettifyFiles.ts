import { exec as nodeExec } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import { getPackageJson } from './utils.packagejson.js';

const exec = promisify(nodeExec);

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

  try {
    let command = `npx -y prettier@${prettierVersion} . --write`;
    await exec(command, { cwd: targetPath });
  } catch (error) {
    throw new Error(
      'There was a problem running prettier on the plugin files. Please run `npx -y prettier@2 . --write` manually in your plugin directory.'
    );
  }
  return 'Successfully ran prettier against new plugin.';
}

function isPrettierUsed(projectRoot?: string) {
  return Boolean(getPrettierVersion(projectRoot));
}

function getPrettierVersion(projectRoot?: string) {
  const packageJson = getPackageJson(projectRoot);
  return packageJson.devDependencies?.prettier || packageJson.dependencies?.prettier;
}
