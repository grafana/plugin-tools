import grafanaVersion from './grafanaVersion';
import selectors from './selectors';
import login from './commands/login';
import createDataSourceConfigPage from './commands/createDataSourceConfigPage';
import panelEditPage from './panelEditPage';
import createDataSource from './commands/createDataSource';
import emptyDashboardPage from './emptyDashboardPage';
import readProvision from './commands/readProvision';

export default {
  selectors,
  grafanaVersion,
  login,
  createDataSourceConfigPage,
  panelEditPage,
  createDataSource,
  emptyDashboardPage,
  readProvision,
};
