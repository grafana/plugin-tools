import { getPlugins, getRateLimitInfo } from '../api.js';
import { prettyPrintSearchResults, getCommandStartTime, startSpinner, endSpinner, setSpinnerText } from '../utils.js';
import { setConfig } from '../config.js';

export type PluginsCommandOptions = {
  id: string;
  pluginJsonFieldDefined: string;
  dependency: string[];
  panel: boolean;
  datasource: boolean;
  app: boolean;
  cache: boolean;
  json: boolean;
  verbose: boolean;
};

export const pluginsCommand = async ({
  id,
  pluginJsonFieldDefined,
  dependency,
  panel,
  datasource,
  app,
  cache,
  json,
  verbose,
}: PluginsCommandOptions) => {
  startSpinner();
  const startTime = getCommandStartTime();

  if (!cache) {
    setConfig({ clearCache: true });
  }

  const items = await getPlugins({
    id,
    isPanel: panel,
    isDatasource: datasource,
    isApp: app,
    pluginJsonFieldDefined,
    dependency,
  });

  endSpinner();

  // JSON output
  if (json) {
    console.log(JSON.stringify(items, null, 2));
    return;
  }

  setSpinnerText('Fetching rate limit info');
  const rateLimitInfo = await getRateLimitInfo();

  // Pretty print
  prettyPrintSearchResults({
    items,
    startTime,
    rateLimitInfo,
    verbose,
  });
};
