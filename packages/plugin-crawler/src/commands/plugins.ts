import terminalLink from 'terminal-link';
import { fetchPluginJson, getInternalPlugins, getRateLimitInfo } from '../api.js';
import {
  formatRateLimitInfo,
  isNotFork,
  isNotHackathon,
  isNotIgnored,
  isPluginIdMatch,
  isPluginJsonFieldDefined,
  isPluginType,
  mapCodeSearchItem,
  parseHrtimeToSeconds,
  sortItemsByPluginId,
} from '../utils.js';
import chalk from 'chalk';
import { setConfig } from '../config.js';
import { SearchResultItem } from '../types.js';
import { printGreenBox } from '../utils.console.js';

export type PluginsCommandOptions = {
  id: string;
  pluginJsonFieldDefined: string;
  panel: boolean;
  datasource: boolean;
  app: boolean;
  cache: boolean;
  json: boolean;
};

export type PluginsMeta = {
  panels: any;
  datasources: any;
  apps: any;
};

export const pluginsCommand = async ({
  id,
  pluginJsonFieldDefined,
  panel,
  datasource,
  app,
  cache,
  json,
}: PluginsCommandOptions) => {
  const startTime = process.hrtime();
  const rateLimitInfo = await getRateLimitInfo();
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
    .filter(isPluginIdMatch(id))
    .filter(isPluginType(panel, datasource, app))
    .filter(isPluginJsonFieldDefined(pluginJsonFieldDefined))
    .sort(sortItemsByPluginId);

  // JSON output
  if (json) {
    console.log(JSON.stringify(items, null, 2));
    return;
  }

  // Pretty print
  const rows = [];
  for (const item of items) {
    // Skip items that don't have a plugin.json
    if (!item.pluginJson || !item.pluginJson.id) {
      continue;
    }

    const columns = [
      // ID
      chalk.bold(item.pluginJson.id),
      // Type
      item.pluginJson.type ? chalk.bgWhite.black(` ${item.pluginJson.type} `) : '',
      // Links
      `| ${terminalLink('repository', item.repoUrl)}, ${terminalLink('plugin.json', item.fileUrl)}`,
    ].filter(Boolean);

    rows.push('- ' + columns.join(' '));
  }

  printGreenBox({
    title: `Grafana plugin search - ${items.length} result${items.length > 1 ? 's' : ''} (${parseHrtimeToSeconds(process.hrtime(startTime))} sec)`,
    content: formatRateLimitInfo(rateLimitInfo),
  });

  if (rows.length === 0) {
    console.log('No results found.');
    return;
  }

  console.log(rows.join('\n'));
};
