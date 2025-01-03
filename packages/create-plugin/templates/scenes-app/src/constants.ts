import pluginJson from './plugin.json';

export const PLUGIN_BASE_URL = `/a/${pluginJson.id}`;

export const URLS = {
  Home: `${PLUGIN_BASE_URL}/home`,
  WithTabs: `${PLUGIN_BASE_URL}/page-with-tabs`,
  WithDrilldown: `${PLUGIN_BASE_URL}/page-with-drilldown`,
  HelloWorld: `${PLUGIN_BASE_URL}/hello-world`,
};

export const ROUTES = {
  Home: 'home/*',
  WithTabs: 'page-with-tabs/*',
  WithDrilldown: 'page-with-drilldown/*',
  HelloWorld: 'hello-world/*',
};

export const DATASOURCE_REF = {
  uid: 'gdev-testdata',
  type: 'testdata',
};
