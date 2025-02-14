import { findUpSync } from 'find-up';
import { readFileSync } from 'node:fs';

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
