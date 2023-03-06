import { getExportPath } from '../../utils/utils.path';
import { CliArgs } from '../types';
import which from 'which';
import fs from 'fs';
import { exec } from 'child_process';

const SDK_GO_MODULE = 'github.com/grafana/grafana-plugin-sdk-go';

export function updateGoSdkAndModules({ pluginName, orgName, pluginType }: CliArgs): Promise<string> {
  return new Promise(async (resolve, reject) => {
    // plugin directory
    const exportPath = getExportPath(pluginName, orgName, pluginType);

    // check if there is a go.mod file in exportPath
    const goModPath = `${exportPath}/go.mod`;
    if (!fs.existsSync(goModPath)) {
      // skip if there is no go.mod file
      resolve('');
    }

    const goBinaryPath = await which('go', { nothrow: true });

    // if no go binary is found, skip
    if (!goBinaryPath) {
      resolve('');
    }

    // run go get SDK_GO_MODULE to update the go.mod file
    const command = `go get ${SDK_GO_MODULE}`;
    exec(command, { cwd: exportPath }, (error) => {
      if (error) {
        reject(
          'There was an error trying to update the grafana go sdk. Please run `go get github.com/grafana/grafana-plugin-sdk-go` manually in your plugin directory.'
        );
      }
      resolve('Grafana go sdk updated successfully.');
    });
  });
}
