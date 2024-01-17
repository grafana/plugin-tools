import { Fixtures } from '@playwright/test';
import path from 'path';
import annotationEditPage from './annotationEditPage';
import grafanaVersion from './grafanaVersion';
import selectors from './selectors';
import login from './commands/login';
import createDataSourceConfigPage from './commands/createDataSourceConfigPage';
import panelEditPage from './panelEditPage';
import createDataSource from './commands/createDataSource';
import readProvision from './commands/readProvision';
import newDashboardPage from './newDashboardPage';
import variableEditPage from './variableEditPage';
import explorePage from './explorePage';
import isFeatureToggleEnabled from './isFeatureToggleEnabled';
import { PluginFixture, PluginOptions } from '../api';

const fixtures: Fixtures<PluginFixture, PluginOptions> = {
  provisioningRootDir: [path.join(process.cwd(), 'provisioning'), { option: true, scope: 'worker' }],
  selectors,
  grafanaVersion,
  login,
  createDataSourceConfigPage,
  newDashboardPage,
  panelEditPage,
  variableEditPage,
  annotationEditPage,
  explorePage,
  createDataSource,
  readProvision,
  isFeatureToggleEnabled,
};

export default fixtures;
