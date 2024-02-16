import path from 'path';
import { TestFixture } from '@playwright/test';
import { promises } from 'fs';
import { PluginFixture, PluginOptions } from '../../api';
import { ReadProvisionedDashboardArgs } from '../../types';
import { PlaywrightCombinedArgs } from '../types';

type ReadProvisionedDashboardFixture = TestFixture<
  <T = any>(args: ReadProvisionedDashboardArgs) => Promise<T>,
  PluginFixture & PluginOptions & PlaywrightCombinedArgs
>;

const readProvisionedDashboard: ReadProvisionedDashboardFixture = async ({ provisioningRootDir }, use) => {
  await use(async ({ fileName }) => {
    const resolvedPath = path.resolve(path.join(provisioningRootDir, 'dashboards', fileName));
    const contents = await promises.readFile(resolvedPath, 'utf8');
    return JSON.parse(contents);
  });
};

export default readProvisionedDashboard;
