import { exec as nodeExec } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'fs';
import { getExportPath } from '../../utils/utils.path';
import { CliArgs } from '../types';

const exec = promisify(nodeExec);

export async function prettifyFiles({ pluginName, orgName, pluginType }: CliArgs) {
  const exportPath = getExportPath(pluginName, orgName, pluginType);

  if (!fs.existsSync(exportPath)) {
    return '';
  }

  try {
    let command = 'npx -y prettier@2 . --write';
    await exec(command, { cwd: exportPath });
  } catch (error) {
    throw new Error('There was a problem running prettier on the plugin files. Please run prettier manually.');
  }
  return 'Successfully ran prettier against new plugin.';
}
