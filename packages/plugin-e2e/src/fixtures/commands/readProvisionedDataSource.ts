import { TestFixture } from '@playwright/test';
import { promises } from 'fs';
import path from 'path';
import { parse as parseYml } from 'yaml';
import { DataSourceSettings, ReadProvisionedDataSourceArgs, PlaywrightArgs } from '../../types';

type ReadProvisionedDataSourceFixture = TestFixture<
  <T = any>(args: ReadProvisionedDataSourceArgs) => Promise<T>,
  PlaywrightArgs
>;

const DATASOURCES_DIR = 'datasources';

export const readProvisionedDataSource: ReadProvisionedDataSourceFixture = async ({ provisioningRootDir }, use) => {
  await use(async ({ fileName: filePath, name }) => {
    const resolvedPath = path.resolve(path.join(provisioningRootDir, DATASOURCES_DIR, filePath));
    const raw = await promises.readFile(resolvedPath, 'utf8');
    // expand env vars the same way Grafana does when loading provisioning YAML.
    // supports $VAR, ${VAR} and ${VAR:-default} syntax.
    const contents = raw.replace(/\$\{(\w+)(?::-(.*?))?\}|\$(\w+)/g, (_, braced, fallback, plain) => {
      const varName = braced ?? plain;
      const value = process.env[varName];
      // For ${VAR:-default}, treat empty string as unset, matching shell/Grafana semantics.
      if (fallback !== undefined) {
        return value === undefined || value === '' ? fallback : value ?? '';
      }
      // For $VAR or ${VAR} without fallback, preserve existing behavior.
      return value ?? '';
    });
    const yml = parseYml(contents);
    if (!name) {
      return yml.datasources[0];
    }
    return yml.datasources.find((ds: DataSourceSettings) => ds.name === name);
  });
};
