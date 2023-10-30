import { readFileSync } from 'fs';
import { resolve } from 'path';

export function getVersion() {
  const packageJsonPath = resolve(__dirname, '..', '..', 'package.json');
  const pkg = readFileSync(packageJsonPath, 'utf8');
  const { version } = JSON.parse(pkg);
  if (!version) {
    throw `Could not find the version of sign-plugin`;
  }
  return version;
}
