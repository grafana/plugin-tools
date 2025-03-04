import terminalLink from 'terminal-link';
import {
  getReposWithInternalAppPlugins,
  getReposWithInternalDatasourcePlugins,
  getReposWithInternalPanelPlugins,
} from '../api.js';
import { SearchResult } from '../types.js';
import { filterAndSortSearchItems, mapCodeSearchItem } from '../utils.js';
import chalk from 'chalk';

export type PluginsCommandOptions = {
  panel: boolean;
  datasource: boolean;
  app: boolean;
  pluginJsonFieldExists: string;
  pluginJsonFieldNotEmpty: boolean;
  pluginId: string;
  noCache: boolean;
  json: boolean;
};

export type PluginsMeta = {
  panels: any;
  datasources: any;
  apps: any;
};

export const pluginsCommand = async ({
  panel: showPanels,
  datasource: showDatasources,
  app: showApps,
  //   pluginJsonFieldExists,
  //   pluginJsonFieldNotEmpty,
  //   pluginId,
  noCache,
  json,
}: PluginsCommandOptions) => {
  const showAll = !showPanels && !showDatasources && !showApps;
  const searchResult: SearchResult = {
    count: 0,
    items: [],
  };

  if (noCache) {
    process.env.CLEAR_CACHE = 'true';
  }

  if (showAll || showPanels) {
    const panels = await getReposWithInternalPanelPlugins();
    searchResult.count += panels.total_count;
    searchResult.items.push(...panels.items.map((item) => mapCodeSearchItem(item, 'panel')));
  }

  if (showAll || showDatasources) {
    const datasources = await getReposWithInternalDatasourcePlugins();
    searchResult.count += datasources.total_count;
    searchResult.items.push(...datasources.items.map((item) => mapCodeSearchItem(item, 'datasource')));
  }

  if (showAll || showApps) {
    const apps = await getReposWithInternalAppPlugins();
    searchResult.count += apps.total_count;
    searchResult.items.push(...apps.items.map((item) => mapCodeSearchItem(item, 'app')));
  }

  searchResult.items = filterAndSortSearchItems(searchResult.items);

  if (json) {
    console.log(JSON.stringify(searchResult, null, 2));
    return;
  }

  // Non JSON
  for (const item of searchResult.items) {
    console.log(
      `- ${chalk.bold(item.name)} | ${chalk.italic(item.pluginType.toUpperCase())} | ${terminalLink('plugin.json →', item.fileUrl)}`
    );
  }
};
