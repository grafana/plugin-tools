import which from 'which';
import fs from 'node:fs';
import { exec } from 'node:child_process';
import { debug } from './utils.cli.js';

const SDK_GO_MODULE = 'github.com/grafana/grafana-plugin-sdk-go';

const updateGoDebugger = debug.extend('update-go');

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
    const version = await getLatestSdkVersion(exportPath);
    await updateSdk(exportPath);
    await updateGoMod(exportPath);
    return `Updated Grafana go sdk to ${version} (latest)`;
  } catch {
    throw new Error(
      'There was an error trying to update the grafana go sdk. Please run `go get github.com/grafana/grafana-plugin-sdk-go` manually in your plugin directory.'
    );
  }
}

function updateSdk(exportPath: string): Promise<void> {
  return new Promise(async (resolve, reject) => {
    // run go get SDK_GO_MODULE to update the go.mod file
    const command = `go get ${SDK_GO_MODULE}`;
    exec(command, { cwd: exportPath }, (error) => {
      if (error) {
        updateGoDebugger(error);
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
        updateGoDebugger(error);
        reject();
      }
      resolve();
    });
  });
}

function getLatestSdkVersion(exportPath: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    // run go list SDK_GO_MODULE@latest to get the latest version number
    const command = `go list -m -json ${SDK_GO_MODULE}@latest`;
    exec(command, { cwd: exportPath }, (error, stdout) => {
      if (error) {
        updateGoDebugger(error);
        reject();
      }

      try {
        const version = JSON.parse(stdout).Version;
        resolve(version);
      } catch (e) {
        updateGoDebugger(e);
        reject();
      }
    });
  });
}
