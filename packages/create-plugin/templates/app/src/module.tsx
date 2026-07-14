import { lazy } from 'react';
import { AppPlugin } from '@grafana/data';

const LazyApp = lazy(() => import('./components/App/App'));
const LazyAppConfig = lazy(() => import('./components/AppConfig/AppConfig'));

export const plugin = new AppPlugin<{}>().setRootPage(LazyApp).addConfigPage({
  title: 'Configuration',
  icon: 'cog',
  body: LazyAppConfig,
  id: 'configuration',
});
