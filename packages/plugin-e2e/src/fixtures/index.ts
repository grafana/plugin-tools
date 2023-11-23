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
import isFeatureToggleEnabled from './isFeatureToggleEnabled';

export default {
  featureToggles: {},
  selectors,
  grafanaVersion,
  login,
  createDataSourceConfigPage,
  newDashboardPage,
  panelEditPage,
  variableEditPage,
  annotationEditPage,
  createDataSource,
  readProvision,
  isFeatureToggleEnabled,
};
