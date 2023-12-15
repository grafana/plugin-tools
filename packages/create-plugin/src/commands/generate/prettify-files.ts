import { exec as nodeExec } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'fs';

const exec = promisify(nodeExec);

export async function prettifyFiles(exportPath: string) {
  if (!fs.existsSync(exportPath)) {
    return '';
  }

  try {
    let command = 'npx -y prettier@2 . --write';
    await exec(command, { cwd: exportPath });
  } catch (error) {
    throw new Error(
      'There was a problem running prettier on the plugin files. Please run `npx -y prettier@2 . --write` manually in your plugin directory.'
    );
  }
  return '✔ Successfully ran prettier against new plugin.';
}
