import { resolve } from 'path';
import { readFileSync } from 'fs';

export const version = async () => {
  try {
    console.log(getVersion());
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

const getVersion = () => {
  const packageJsonPath = resolve(__dirname, '..', '..', 'package.json');
  const pkg = readFileSync(packageJsonPath, 'utf8');
  const { version } = JSON.parse(pkg);
  if (!version) {
    throw `Could not find the version of sign-plugin`;
  }
  return version;
};
