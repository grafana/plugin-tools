import annotationEditPage from './annotationEditPage';
import grafanaVersion from './grafanaVersion';
import selectors from './selectors';
import login from './commands/login';
import createDataSourceConfigPage from './commands/createDataSourceConfigPage';
import panelEditPage from './panelEditPage';
import createDataSource from './commands/createDataSource';
import readProvisionedDataSource from './commands/readProvisionedDataSource';
import readProvisionedDashboard from './commands/readProvisionedDashboard';
import newDashboardPage from './newDashboardPage';
import variableEditPage from './variableEditPage';
import explorePage from './explorePage';
import isFeatureToggleEnabled from './isFeatureToggleEnabled';
import page from './page';
import createUser from './commands/createUser';
import { gotoAppConfigPage } from './commands/gotoAppConfigPage';

const fixtures = {
  selectors,
  grafanaVersion,
  login,
  createDataSourceConfigPage,
  page,
  newDashboardPage,
  panelEditPage,
  variableEditPage,
  annotationEditPage,
  explorePage,
  createDataSource,
  readProvisionedDataSource,
  readProvisionedDashboard,
  isFeatureToggleEnabled,
  createUser,
  gotoAppConfigPage,
};

export default fixtures;
