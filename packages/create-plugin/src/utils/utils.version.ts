import { findUpSync } from 'find-up';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TEMPLATE_PATHS } from '../constants.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export function getVersion(): string {
  const packageJsonPath = findUpSync('package.json', { cwd: __dirname });
  if (!packageJsonPath) {
    throw `Could not find package.json`;
  }
  const pkg = readFileSync(packageJsonPath, 'utf8');
  const { version } = JSON.parse(pkg);
  if (!version) {
    throw `Could not find the version of create-plugin`;
  }
  return version;
}

export function getGrafanaRuntimeVersion() {
  const packageJsonPath = path.join(TEMPLATE_PATHS.common, '_package.json');
  const pkg = readFileSync(packageJsonPath, 'utf8');
  const { version } = /\"(@grafana\/runtime)\":\s\"\^(?<version>.*)\"/.exec(pkg)?.groups ?? {};
  return version;
}
