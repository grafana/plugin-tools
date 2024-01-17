import which from 'which';
import fs from 'node:fs';
import { exec } from 'node:child_process';

const SDK_GO_MODULE = 'github.com/grafana/grafana-plugin-sdk-go';

export async function updateGoSdkAndModules(exportPath: string) {
  // check if there is a go.mod file in exportPath
  const goModPath = `${exportPath}/go.mod`;
  if (!fs.existsSync(goModPath)) {
    // skip if there is no go.mod file
    return '';
  }

  const goBinaryPath = await which('go', { nothrow: true });

  // if no go binary is found, skip
  if (!goBinaryPath) {
    return '';
  }

  try {
    await updateSdk(exportPath);
    await updateGoMod(exportPath);
  } catch {
    throw new Error(
      'There was an error trying to update the grafana go sdk. Please run `go get github.com/grafana/grafana-plugin-sdk-go` manually in your plugin directory.'
    );
  }
  return 'Grafana go sdk updated successfully.';
}

function updateSdk(exportPath: string): Promise<void> {
  return new Promise(async (resolve, reject) => {
    // run go get SDK_GO_MODULE to update the go.mod file
    const command = `go get ${SDK_GO_MODULE}`;
    exec(command, { cwd: exportPath }, (error) => {
      if (error) {
        reject();
      }
      resolve();
    });
  });
}

function updateGoMod(exportPath: string): Promise<void> {
  return new Promise(async (resolve, reject) => {
    // run go get SDK_GO_MODULE to update the go.mod file
    const command = `go mod tidy`;
    exec(command, { cwd: exportPath }, (error) => {
      if (error) {
        reject();
      }
      resolve();
    });
  });
}
