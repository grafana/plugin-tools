import { lazy } from 'react';
import { AppPlugin } from '@grafana/data';
import { initPluginTranslations } from '@grafana/i18n';
import { loadResources } from '@grafana/scenes';
import pluginJson from 'plugin.json';

await initPluginTranslations(pluginJson.id, [loadResources]);

const App = lazy(() => import('./components/App/App'));
const AppConfig = lazy(() => import('./components/AppConfig/AppConfig'));

export const plugin = new AppPlugin<{}>().setRootPage(App).addConfigPage({
  title: 'Configuration',
  icon: 'cog',
  body: AppConfig,
  id: 'configuration',
});
