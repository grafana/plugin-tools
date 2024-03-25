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
    const contents = await promises.readFile(resolvedPath, 'utf8');
    const yml = parseYml(contents);
    if (!name) {
      return yml.datasources[0];
    }
    return yml.datasources.find((ds: DataSourceSettings) => ds.name === name);
  });
};
