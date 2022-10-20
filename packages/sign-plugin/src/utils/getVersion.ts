import { readFileSync } from 'fs';

export const getVersion = () => {
  const pkg = readFileSync(`${__dirname}/../../package.json`, 'utf8');
  const { version } = JSON.parse(pkg);
  if (!version) {
    throw `Could not find the version of sign-plugin`;
  }
  return version;
};
