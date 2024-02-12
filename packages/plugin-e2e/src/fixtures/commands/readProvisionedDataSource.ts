import { TestFixture } from '@playwright/test';
import { promises } from 'fs';
import path from 'path';
import { parse as parseYml } from 'yaml';
import { PluginFixture, PluginOptions } from '../../api';
import { DataSourceSettings, ReadProvisionedDataSourceArgs } from '../../types';
import { PlaywrightCombinedArgs } from '../types';

type ReadProvisionedDataSourceFixture = TestFixture<
  <T = any>(args: ReadProvisionedDataSourceArgs) => Promise<T>,
  PluginFixture & PluginOptions & PlaywrightCombinedArgs
>;

const readProvisionedDataSource: ReadProvisionedDataSourceFixture = async ({ provisioningRootDir }, use) => {
  await use(async ({ fileName: filePath, name }) => {
    const resolvedPath = path.resolve(path.join(provisioningRootDir, path.join('datasources', filePath)));
    const contents = await promises.readFile(resolvedPath, 'utf8');
    const yml = parseYml(contents);
    if (!name) {
      return yml.datasources[0];
    }
    return yml.datasources.find((ds: DataSourceSettings) => ds.name === name);
  });
};

export default readProvisionedDataSource;
