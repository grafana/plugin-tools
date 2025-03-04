import { Octokit } from '@octokit/rest';
import { getConfig } from './config.js';
import { cacheGet, cacheSet, cacheDel } from './cache.js';
import { CodeSearchResponse } from './types.js';
import { debug } from './utils.js';

export async function getAllReposForOrg() {
  const { org, clearCache, githubPat } = getConfig();
  const cacheKey = `repos_${org}`;
  const octokit = new Octokit({
    auth: githubPat,
  });

  if (clearCache) {
    await cacheDel(cacheKey);
  }

  try {
    if (await cacheGet(cacheKey)) {
      console.log(`[CACHE] Returning org repos from cache for ${org}`);
      return cacheGet(cacheKey);
    }

    const response = await octokit.rest.repos.listForOrg({
      org: org,
      type: 'all',
    });

    cacheSet(cacheKey, response.data);

    return response.data;
  } catch (error) {
    console.error(error);
  }
}

export const getPluginById = (pluginName: string) => {
  const queryFn = generateCodeSearchApi({
    id: `internal_plugin_repos_plugin_by_name_${pluginName}`,
    query: `"id": "${pluginName}" in:file filename:plugin.json`,
  });

  return queryFn();
};

export const getReposWithInternalAppPlugins = generateCodeSearchApi({
  id: 'internal_plugin_repos_app',
  query: `"type": app in:file filename:plugin.json`,
});

export const getReposWithInternalDatasourcePlugins = generateCodeSearchApi({
  id: 'internal_plugin_repos_datasource',
  query: `"type": datasource in:file filename:plugin.json`,
});

export const getReposWithInternalPanelPlugins = generateCodeSearchApi({
  id: 'internal_plugin_repos_panel',
  query: `"type": panel in:file filename:plugin.json`,
});

export const getAddedComponents = generateCodeSearchApi({
  id: 'added_components_internal_plugins',
  query: `".addComponent(" extension:tsx OR extension:ts`,
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
