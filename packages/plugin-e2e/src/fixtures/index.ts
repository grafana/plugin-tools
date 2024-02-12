import annotationEditPage from './annotationEditPage';
import grafanaVersion from './grafanaVersion';
import selectors from './selectors';
import login from './commands/login';
import createDataSourceConfigPage from './commands/createDataSourceConfigPage';
import panelEditPage from './panelEditPage';
import createDataSource from './commands/createDataSource';
import readProvision from './commands/readProvision';
import readProvisionedDataSource from './commands/readProvisionedDataSource';
import newDashboardPage from './newDashboardPage';
import variableEditPage from './variableEditPage';
import explorePage from './explorePage';
import isFeatureToggleEnabled from './isFeatureToggleEnabled';
import page from './page';

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
  readProvision,
  readProvisionedDataSource,
  isFeatureToggleEnabled,
};

export default fixtures;
