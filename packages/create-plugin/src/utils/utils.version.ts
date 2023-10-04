import { resolve } from 'path';
import { readFileSync } from 'fs';

export const getVersion = () => {
  const packageJsonPath = resolve(__dirname, '..', '..', 'package.json');
  const pkg = readFileSync(packageJsonPath, 'utf8');
  const { version } = JSON.parse(pkg);
  if (!version) {
    throw `Could not find the version of create-plugin`;
  }
  return version;
};
