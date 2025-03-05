import terminalLink from 'terminal-link';
import { fetchPluginJson, getInternalPlugins } from '../api.js';
import {
  isNotFork,
  isNotHackathon,
  isNotIgnored,
  isPluginIdMatch,
  isPluginType,
  mapCodeSearchItem,
  sortItemsByPluginId,
} from '../utils.js';
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
  let items: SearchResultItem[] = [];

  if (!cache) {
    setConfig({ clearCache: true });
  }

  // Fetching plugins from Githuub
  const plugins = await getInternalPlugins();

  // Prefiltering results
  // (we are doing it here to avoid fetching plugin.json files for items that will be filtered out)
  items = plugins.items
    .map((item) => mapCodeSearchItem(item))
    .filter(isNotHackathon)
    .filter(isNotFork)
    .filter(isNotIgnored);

  // Fetching plugin.json files
  items = await Promise.all(
    items.map(async (item) => {
      const pluginJson = await fetchPluginJson(item);
      return {
        ...item,
        pluginJson,
      };
    })
  );

  // Post filtering and sorting
  items = items
    .filter(isPluginIdMatch(pluginId))
    .filter(isPluginType(panel, datasource, app))
    .sort(sortItemsByPluginId);

  if (json) {
    console.log(JSON.stringify(items, null, 2));
    return;
  }

  // Non JSON
  console.log(chalk.bold(`Number of results: ${items.length}\n`));

  for (const item of items) {
    // Skip items that don't have a plugin.json
    if (!item.pluginJson || !item.pluginJson.id) {
      continue;
    }

    const columns = [
      chalk.bold(item.pluginJson.id),
      item.pluginJson.type ? item.pluginJson.type.toUpperCase() : 'unknown',
      terminalLink('plugin.json →', item.fileUrl),
    ];

    console.log('- ' + columns.filter((x) => x).join(' | '));
  }
};
