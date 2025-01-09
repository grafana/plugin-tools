import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const getCreatePluginVersion = () => {
  try {
    const currDir = process.cwd();
    const crpcJSONPath = resolve(currDir, '.config', '.cprc.json');
    if (!existsSync(crpcJSONPath)) {
      return null;
    }

    const crpcJSON = readFileSync(crpcJSONPath, 'utf-8');
    const { version } = JSON.parse(crpcJSON);
    return version as string;
  } catch (err) {
    return null;
  }
};
