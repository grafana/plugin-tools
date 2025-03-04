import terminalLink from 'terminal-link';
import {
  getPluginById,
  getReposWithInternalAppPlugins,
  getReposWithInternalDatasourcePlugins,
  getReposWithInternalPanelPlugins,
} from '../api.js';
import { filterAndSortSearchItems, mapCodeSearchItem } from '../utils.js';
import chalk from 'chalk';
import { setConfig } from '../config.js';
import { SearchResultItem } from '../types.js';

export type PluginsCommandOptions = {
  panel: boolean;
  datasource: boolean;
  app: boolean;
  pluginJsonFieldExists: string;
  pluginJsonFieldNotEmpty: boolean;
  pluginId: string;
  cache: boolean;
  json: boolean;
};

export type PluginsMeta = {
  panels: any;
  datasources: any;
  apps: any;
};

export const pluginsCommand = async ({
  panel,
  datasource,
  app,
  //   pluginJsonFieldExists,
  //   pluginJsonFieldNotEmpty,
  pluginId,
  cache,
  json,
}: PluginsCommandOptions) => {
  const showAll = !panel && !datasource && !app;
  const fetchDatasources = !pluginId && (showAll || datasource);
  const fetchPanels = !pluginId && (showAll || panel);
  const fetchApps = !pluginId && (showAll || app);
  let items: SearchResultItem[] = [];

  if (!cache) {
    console.log('NO CACHE');
    setConfig({ clearCache: true });
  }

  if (pluginId) {
    const plugin = await getPluginById(pluginId);
    items.push(...plugin.items.map((item) => mapCodeSearchItem(item)));
  }

  if (fetchPanels) {
    const panels = await getReposWithInternalPanelPlugins();
    items.push(...panels.items.map((item) => mapCodeSearchItem(item, 'panel')));
  }

  if (fetchDatasources) {
    const datasources = await getReposWithInternalDatasourcePlugins();
    items.push(...datasources.items.map((item) => mapCodeSearchItem(item, 'datasource')));
  }

  if (fetchApps) {
    const apps = await getReposWithInternalAppPlugins();
    items.push(...apps.items.map((item) => mapCodeSearchItem(item, 'app')));
  }

  items = filterAndSortSearchItems(items);

  if (json) {
    console.log(JSON.stringify(items, null, 2));
    return;
  }

  // Non JSON
  console.log(chalk.bold(`Number of results: ${items.length}\n`));

  for (const item of items) {
    const columns = [
      chalk.bold(item.name),
      item.pluginType !== 'unknown' ? chalk.italic(item.pluginType.toUpperCase()) : '',
      terminalLink('plugin.json →', item.fileUrl),
    ];

    console.log('- ' + columns.filter((x) => x).join(' | '));
  }
};
