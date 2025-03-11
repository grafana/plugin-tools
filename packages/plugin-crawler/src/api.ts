import { Octokit } from '@octokit/rest';
import { getConfig } from './config.js';
import { cacheGet, cacheSet, cacheDel } from './cache.js';
import { CodeSearchResponse, SearchResultItem } from './types.js';
import {
  debug,
  hasDependencies,
  hasPackageJson,
  hasPluginJson,
  isNotFork,
  isNotHackathon,
  isNotNestedPlugin,
  isNotTemplate,
  isNotTest,
  isNotTestPluginId,
  isPluginIdMatch,
  isPluginJsonFieldDefined,
  isPluginType,
  isRepoNotIgnored,
  mapCodeSearchItem,
  setSpinnerText,
  sortItemsByPluginId,
} from './utils.js';

// Fetches Grafana plugins from GitHub and filters them based on the provided options
export const getPlugins = async ({
  id,
  isPanel,
  isDatasource,
  isApp,
  pluginJsonFieldDefined,
  dependency,
  filter,
}: {
  id: string;
  isPanel?: boolean;
  isDatasource?: boolean;
  isApp?: boolean;
  pluginJsonFieldDefined?: string;
  dependency?: string[];
  filter: boolean;
}) => {
  let items: SearchResultItem[] = [];
  setSpinnerText('Fetching plugins from GitHub');
  const plugins = await searchPlugins();

  // Prefiltering
  // (Doing it here to avoid extra requests - we don't have all info yet for proper filtering)
  items = plugins.items.map((item) => mapCodeSearchItem(item));

  if (filter) {
    items = items
      .filter(isNotHackathon)
      .filter(isNotFork)
      .filter(isNotTest)
      .filter(isNotTemplate)
      .filter(isNotNestedPlugin) // we currently don't support nested plugins (due to them missing a package.json)
      .filter(isRepoNotIgnored);
  }

  // Fetching plugin.json files
  setSpinnerText('Fetching plugin.json files');
  items = await Promise.all(
    items.map(async (item) => {
      const pluginJson = await fetchPluginJson(item);
      return {
        ...item,
        pluginJson,
      };
    })
  );

  // Fetching package.json files
  setSpinnerText('Fetching package.json files');
  items = await Promise.all(
    items.map(async (item) => {
      const packageJson = await fetchPackageJson(item);
      return {
        ...item,
        packageJson,
      };
    })
  );

  // Post filtering and sorting
  if (filter) {
    items = items.filter(isNotTestPluginId);
  }

  return items
    .filter(isPluginIdMatch(id))
    .filter(isPluginType(isPanel, isDatasource, isApp))
    .filter(isPluginJsonFieldDefined(pluginJsonFieldDefined))
    .filter(hasPluginJson)
    .filter(hasPackageJson)
    .filter(hasDependencies(dependency))
    .sort(sortItemsByPluginId);
};

// Searches for Grafana plugins on GitHub
export const searchPlugins = generateCodeSearchApi({
  id: 'internal_plugins',
  query: `"type": in:file filename:plugin.json`,
});

// The `org` parameter is assigned automatically to the queries and the cache keys
// The generated function has automatic pagination built in (to give back all the results)
export function generateCodeSearchApi({ id, query }: { id: string; query: string }) {
  return async function generated(page = 1): Promise<CodeSearchResponse> {
    let data;
    const { org, clearCache, githubPat } = getConfig();
    const cacheKey = `${id}_${org}_${page}`;
    const octokit = new Octokit({
      auth: githubPat,
    });

    if (clearCache) {
      debug(`[CACHE] - Caching is disabled.`);
      await cacheDel(cacheKey);
    }

    try {
      const cached = await cacheGet(cacheKey);

      if (cached) {
        debug(`[CACHE] - returning data for "${cacheKey}" from cache`);
        data = cached;
      } else {
        const q = `${query}${!query.match(/\borg:[a-zA-Z0-9_-]+\b/) ? ` org:${org}` : ''}`;
        debug(`[OCTOKIT] - fetching data for query "${q}", page ${page}`);
        const response = await octokit.rest.search.code({
          q,
          per_page: 100,
          page,
        });

        data = response.data;

        await cacheSet(cacheKey, data);
      }

      // There are more items (100 is the max number of items per page)
      if (data.items.length === 100) {
        const nextPage = await generated(page + 1);
        data.items.push(...nextPage.items);
      }

      return data;
    } catch (error) {
      // TODO: add more fine-grained error handling
      throw error;
    }
  };
}

export async function fetchPluginJson(item: SearchResultItem) {
  let data;
  const { org, clearCache, githubPat } = getConfig();
  const cacheKey = `file_${item.fileUrlRaw}`;
  const octokit = new Octokit({
    auth: githubPat,
  });

  if (clearCache) {
    debug(`[CACHE] - Caching is disabled.`);
    await cacheDel(cacheKey);
  }

  try {
    const cached = await cacheGet(cacheKey);

    if (cached) {
      debug(`[CACHE] - returning data for "${cacheKey}" from cache`);
      data = cached;
    } else {
      debug(`[OCTOKIT] - fetching file contents for "${item.fileUrlRaw}"`);
      const response = await octokit.repos.getContent({
        owner: org,
        repo: item.repoName,
        path: item.filePath,
      });

      // @ts-ignore
      data = JSON.parse(Buffer.from(response.data.content, 'base64').toString());

      await cacheSet(cacheKey, data);
    }

    return data;
  } catch (error) {
    // TODO: add more fine-grained error handling
    debug(`[ERROR] fetching plugin.json - "${item.fileUrlRaw}"`);
    debug(error);
    await cacheSet(cacheKey, {});
    return {};
  }
}

export async function fetchPackageJson(item: SearchResultItem) {
  let data;
  const { org, clearCache, githubPat } = getConfig();
  const cacheKey = `package_json_${item.repoNameFull}/${item.filePath}`;
  const octokit = new Octokit({
    auth: githubPat,
  });

  if (clearCache) {
    debug(`[CACHE] - Caching is disabled.`);
    await cacheDel(cacheKey);
  }

  try {
    const cached = await cacheGet(cacheKey);

    if (cached) {
      debug(`[CACHE] - returning data for "${cacheKey}" from cache`);
      data = cached;
    } else {
      debug(`[OCTOKIT] - fetching file contents for "${item.repoNameFull}/${item.packageJsonPath}"`);
      const response = await octokit.repos.getContent({
        owner: org,
        repo: item.repoName,
        path: item.packageJsonPath,
      });

      // @ts-ignore
      data = JSON.parse(Buffer.from(response.data.content, 'base64').toString());

      await cacheSet(cacheKey, data);
    }

    return data;
  } catch (error) {
    // TODO: add more fine-grained error handling
    debug(`[ERROR] fetching package.json - "${item.packageJsonUrl}"`);
    debug(error);
    await cacheSet(cacheKey, {});
    return {};
  }
}

export async function getRateLimitInfo() {
  const { githubPat } = getConfig();
  const octokit = new Octokit({
    auth: githubPat,
  });

  try {
    const response = await octokit.rest.rateLimit.get();

    return response.data;
  } catch (error) {
    console.error(error);

    return null;
  }
}
