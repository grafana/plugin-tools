import { Octokit } from '@octokit/rest';
import { getConfig } from './config.js';
import { cacheGet, cacheSet, cacheDel } from './cache.js';
import { CodeSearchResponse, SearchResultItem } from './types.js';
import { debug } from './utils.js';

export const getInternalPlugins = generateCodeSearchApi({
  id: 'internal_plugins',
  query: `"type": in:file filename:plugin.json`,
});

export const getAddedComponents = generateCodeSearchApi({
  id: 'added_components_internal_plugins',
  query: `".addComponent(" extension:tsx OR extension:ts`,
});

export const getAddedLinks = generateCodeSearchApi({
  id: 'added_links_internal_plugins',
  query: `".addLink(" extension:tsx OR extension:ts`,
});

export const getExposedComponents = generateCodeSearchApi({
  id: 'exposed_components_internal_plugins',
  query: `".exposeComponent(" extension:tsx OR extension:ts`,
});

export const getComponentExtensionPoints = generateCodeSearchApi({
  id: 'component_extension_points_internal_plugins',
  query: `".usePluginComponents(" extension:tsx OR extension:ts`,
});

export const getLinkExtensionPoints = generateCodeSearchApi({
  id: 'link_extension_points_internal_plugins',
  query: `".usePluginLinks(" extension:tsx OR extension:ts`,
});

export const getExposedComponentUsages = generateCodeSearchApi({
  id: 'exposed_component_usages_internal_plugins',
  query: `".usePluginComponent(" extension:tsx OR extension:ts`,
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
    console.error(`Error fetching & parsing plugin.json from ${item.fileUrlRaw}`, error);
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
