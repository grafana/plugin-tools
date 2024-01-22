import { exec as nodeExec } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import { getPackageJson } from './utils.packagejson.js';

const exec = promisify(nodeExec);

export async function prettifyFiles(exportPath: string, projectRoot = exportPath) {
  if (!fs.existsSync(exportPath)) {
    return '';
  }

  const packageJson = getPackageJson(projectRoot);
  const prettierVersion = packageJson.devDependencies?.prettier || packageJson.dependencies?.prettier || '2';

  try {
    let command = `npx -y prettier@${prettierVersion} . --write`;
    await exec(command, { cwd: exportPath });
  } catch (error) {
    throw new Error(
      'There was a problem running prettier on the plugin files. Please run `npx -y prettier@2 . --write` manually in your plugin directory.'
    );
  }
  return 'Successfully ran prettier against new plugin.';
}

export function isPrettierUsed() {
  const packageJson = getPackageJson();
  return Boolean(packageJson.devDependencies?.prettier || packageJson.dependencies?.prettier);
}
