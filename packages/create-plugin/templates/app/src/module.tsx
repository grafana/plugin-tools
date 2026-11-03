import { lazy } from 'react';
import { AppPlugin } from '@grafana/data';
import { LoadingPlaceholder } from '@grafana/ui';

const App = lazy(() => import('./components/App/App'));
const AppConfig = lazy(() => import('./components/AppConfig/AppConfig'));

export const plugin = new AppPlugin<{}>().setRootPage(App).addConfigPage({
  title: 'Configuration',
  icon: 'cog',
  body: AppConfig,
  id: 'configuration',
});
