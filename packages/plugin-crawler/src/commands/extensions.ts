import { getPlugins, getRateLimitInfo } from '../api.js';
import { setConfig } from '../config.js';
import {
  endSpinner,
  getCommandStartTime,
  isExtensionType,
  prettyPrintSearchResults,
  setSpinnerText,
  startSpinner,
} from '../utils.js';

export type ExtensionsCommandOptions = {
  pluginId: string;
  addedLinks: boolean;
  addedComponents: boolean;
  extensionPoints: boolean;
  exposedComponents: boolean;
  exposedComponentUsages: boolean;
  cache: boolean;
  filter: boolean;
  json: string;
  verbose: boolean;
};

export const extensionsCommand = async ({
  pluginId,
  addedLinks,
  addedComponents,
  extensionPoints,
  exposedComponents,
  exposedComponentUsages,
  cache,
  filter,
  json,
  verbose,
}: ExtensionsCommandOptions) => {
  startSpinner();
  const startTime = getCommandStartTime();

  if (!cache) {
    setConfig({ clearCache: true });
  }

  let items = await getPlugins({
    id: pluginId,

    // For extensions we are only interested in app plugins (for now at least)
    isApp: true,
    filter,
  });

  items = items.filter(
    isExtensionType({ addedLinks, addedComponents, extensionPoints, exposedComponents, exposedComponentUsages })
  );

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
