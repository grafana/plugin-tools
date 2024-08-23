import { lazy } from 'react';
import { AppPlugin } from '@grafana/data';
import { App } from './components/App/App';

export const plugin = new AppPlugin<{}>().setRootPage(App).addConfigPage({
  title: 'Configuration',
  icon: 'cog',
  body: lazy(() => import('./components/AppConfig/AppConfig')),
  id: 'configuration',
});
