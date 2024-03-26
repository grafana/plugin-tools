import path from 'path';
import { TestFixture } from '@playwright/test';
import { promises } from 'fs';
import { PlaywrightArgs, ReadProvisionedDashboardArgs } from '../../types';

type ReadProvisionedDashboardFixture = TestFixture<
  <T = any>(args: ReadProvisionedDashboardArgs) => Promise<T>,
  PlaywrightArgs
>;

const DASHBOARDS_DIR = 'dashboards';

export const readProvisionedDashboard: ReadProvisionedDashboardFixture = async ({ provisioningRootDir }, use) => {
  await use(async ({ fileName }) => {
    const resolvedPath = path.resolve(path.join(provisioningRootDir, DASHBOARDS_DIR, fileName));
    const contents = await promises.readFile(resolvedPath, 'utf8');
    return JSON.parse(contents);
  });
};
