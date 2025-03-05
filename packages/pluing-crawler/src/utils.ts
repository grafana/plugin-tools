import { Octokit } from '@octokit/rest';
import createDebug from 'debug';
import { CLEAR_CACHE, GITHUB_PAT, ORG } from './constants.js';
import { cacheGet, cacheSet, cacheDel } from './cache.js';
import { getConfig } from './config.js';
import { CodeSearchItem, CodeSearchResponse, PluginType, SearchResultItem } from './types.js';
import chalk from 'chalk';
import { formatDistance } from 'date-fns';

const octokit = new Octokit({
  auth: GITHUB_PAT,
});

export const debug = createDebug('plugin-crawler');

export async function getAllReposForOrg() {
  const cacheKey = `repos_${ORG}`;

  if (CLEAR_CACHE) {
    await cacheDel(cacheKey);
  }

  try {
    const cached = await cacheGet(cacheKey);
    if (cached) {
      console.log(`[CACHE] Returning org repos from cache for ${ORG}`);
      return cached;
    }

    const response = await octokit.rest.repos.listForOrg({
      org: ORG,
      type: 'all',
    });

    await cacheSet(cacheKey, response.data);

    return response.data;
  } catch (error) {
    console.error(error);
  }
}

export async function getReposWithInternalAppPlugins(page = 1) {
  const cacheKey = `internal_plugins_${ORG}_${page}`;
  let data;

  // Use CLEAR_CACHE=true from the environment to clear the cache
  if (CLEAR_CACHE) {
    await cacheDel(cacheKey);
  }

  try {
    const cached = await cacheGet(cacheKey);
    if (cached) {
      console.log(`[CACHE] Returning internal plugins from cache for ${ORG} (page ${page})`);
      data = cached;
    } else {
      const { data } = await octokit.rest.search.code({
        q: `"type": app in:file filename:plugin.json org:${ORG}`,
        per_page: 100,
        page,
      });

      await cacheSet(cacheKey, data);
    }

    // There are more items (100 is the max number of items per page)
    if (data.items.length === 100) {
      const nextPage = await getReposWithInternalAppPlugins(page + 1);
      data.items.push(...nextPage.items);
    }

    return data;
  } catch (error) {
    console.error(error);
  }
}

export async function getAddedComponents(page = 1) {
  const cacheKey = `added_components_internal_plugins_${ORG}_${page}`;
  let data;

  // Use CLEAR_CACHE=true from the environment to clear the cache
  if (CLEAR_CACHE) {
    await cacheDel(cacheKey);
  }

  try {
    const cached = await cacheGet(cacheKey);
    if (cached) {
      console.log(`[CACHE] Returning added components for internal plugins from cache for ${ORG} (page ${page})`);
      data = cached;
    } else {
      const response = await octokit.rest.search.code({
        q: `".addComponent(" org:${ORG} extension:tsx OR extension:ts`,
        per_page: 100,
        page,
      });

      data = response.data;

      await cacheSet(cacheKey, data);
    }

    // There are more items (100 is the max number of items per page)
    if (data.items.length === 100) {
      const nextPage = await getAddedComponents(page + 1);
      data.items.push(...nextPage.items);
    }

    return data;
  } catch (error) {
    console.error(error);
  }
}

export async function getAddedLinks(page = 1) {
  const cacheKey = `added_links_internal_plugins_${ORG}_${page}`;
  let data;

  // Use CLEAR_CACHE=true from the environment to clear the cache
  if (CLEAR_CACHE) {
    await cacheDel(cacheKey);
  }

  try {
    const cached = await cacheGet(cacheKey);

    if (cached) {
      console.log(`[CACHE] Returning added links for internal plugins from cache for ${ORG} (page ${page})`);
      data = cached;
    } else {
      const response = await octokit.rest.search.code({
        q: `".addLink(" org:${ORG} extension:tsx OR extension:ts`,
        per_page: 100,
        page,
      });

      data = response.data;

      await cacheSet(cacheKey, data);
    }

    // There are more items (100 is the max number of items per page)
    if (data.items.length === 100) {
      const nextPage = await getAddedLinks(page + 1);
      data.items.push(...nextPage.items);
    }

    return data;
  } catch (error) {
    console.error(error);
  }
}

export async function getExposedComponents(page = 1) {
  const cacheKey = `exposed_components_internal_plugins_${ORG}_${page}`;
  let data;

  // Use CLEAR_CACHE=true from the environment to clear the cache
  if (CLEAR_CACHE) {
    await cacheDel(cacheKey);
  }

  try {
    const cached = await cacheGet(cacheKey);

    if (cached) {
      console.log(`[CACHE] Returning exposed components for internal plugins from cache for ${ORG} (page ${page})`);
      data = cached;
    } else {
      const response = await octokit.rest.search.code({
        q: `".exposeComponent(" org:${ORG} extension:tsx OR extension:ts`,
        per_page: 100,
        page,
      });

      data = response.data;

      await cacheSet(cacheKey, data);
    }

    // There are more items (100 is the max number of items per page)
    if (data.items.length === 100) {
      const nextPage = await getExposedComponents(page + 1);
      data.items.push(...nextPage.items);
    }

    return data;
  } catch (error) {
    console.error(error);
  }
}

export async function getComponentExtensionPoints(page = 1) {
  const cacheKey = `component_extension_points_internal_plugins_${ORG}_${page}`;
  let data;

  // Use CLEAR_CACHE=true from the environment to clear the cache
  if (CLEAR_CACHE) {
    await cacheDel(cacheKey);
  }

  try {
    const cached = await cacheGet(cacheKey);

    if (cached) {
      console.log(
        `[CACHE] Returning component extension points for internal plugins from cache for ${ORG} (page ${page})`
      );
      data = cached;
    } else {
      const response = await octokit.rest.search.code({
        q: `".usePluginComponents(" org:${ORG} extension:tsx OR extension:ts`,
        per_page: 100,
        page,
      });

      data = response.data;

      await cacheSet(cacheKey, data);
    }

    // There are more items (100 is the max number of items per page)
    if (data.items.length === 100) {
      const nextPage = await getComponentExtensionPoints(page + 1);
      data.items.push(...nextPage.items);
    }

    return data;
  } catch (error) {
    console.error(error);
  }
}

export async function getLinkExtensionPoints(page = 1) {
  const cacheKey = `link_extension_points_internal_plugins_${ORG}_${page}`;
  let data;

  // Use CLEAR_CACHE=true from the environment to clear the cache
  if (CLEAR_CACHE) {
    await cacheDel(cacheKey);
  }

  try {
    const cached = await cacheGet(cacheKey);

    if (cached) {
      console.log(`[CACHE] Returning link extension points for internal plugins from cache for ${ORG} (page ${page})`);
      data = cached;
    } else {
      const response = await octokit.rest.search.code({
        q: `".usePluginLinks(" org:${ORG} extension:tsx OR extension:ts`,
        per_page: 100,
        page,
      });

      data = response.data;

      await cacheSet(cacheKey, data);
    }

    // There are more items (100 is the max number of items per page)
    if (data.items.length === 100) {
      const nextPage = await getLinkExtensionPoints(page + 1);
      data.items.push(...nextPage.items);
    }

    return data;
  } catch (error) {
    console.error(error);
  }
}

export async function getExposedComponentUsages(page = 1) {
  const cacheKey = `exposed_component_usages_internal_plugins_${ORG}_${page}`;
  let data;

  // Use CLEAR_CACHE=true from the environment to clear the cache
  if (CLEAR_CACHE) {
    await cacheDel(cacheKey);
  }

  try {
    const cached = await cacheGet(cacheKey);

    if (cached) {
      console.log(
        `[CACHE] Returning usages of exposed components for internal plugins from cache for ${ORG} (page ${page})`
      );
      data = cached;
    } else {
      const response = await octokit.rest.search.code({
        q: `".usePluginComponent(" org:${ORG} extension:tsx OR extension:ts`,
        per_page: 100,
        page,
      });

      data = response.data;

      await cacheSet(cacheKey, data);
    }

    // There are more items (100 is the max number of items per page)
    if (data.items.length === 100) {
      const nextPage = await getExposedComponentUsages(page + 1);
      data.items.push(...nextPage.items);
    }

    return data;
  } catch (error) {
    console.error(error);
  }
}

export async function getRateLimitInfo() {
  try {
    const response = await octokit.rest.rateLimit.get();

    return response.data;
  } catch (error) {
    console.error(error);

    return {};
  }
}

export function skipForksAndHackathons(data: CodeSearchResponse) {
  return {
    ...data,
    items: data.items.filter(
      ({ repository }) =>
        !repository.fork && !(repository.name.includes('hackathon') || repository.name.includes('hackaton'))
    ),
  };
}

export function isNotFork(item: SearchResultItem) {
  return !item.isFork;
}

export function isNotHackathon(item: SearchResultItem) {
  return !item.repoNameFull.includes('hackathon') && !item.repoNameFull.includes('hackaton');
}

export function isNotIgnored(item: SearchResultItem) {
  const { ignoredRepos } = getConfig();
  return !ignoredRepos.includes(item.repoNameFull);
}

export function isNotTest(item: SearchResultItem) {
  return (
    !item.filePath.includes('test') ||
    !item.filePath.includes('spec') ||
    !item.filePath.includes('mock') ||
    !item.filePath.includes('e2e') ||
    !item.filePath.includes('fixture')
  );
}

export function sortReposByName(data: CodeSearchResponse) {
  return {
    ...data,
    items: data.items.sort((a, b) => a.repository.name.localeCompare(b.repository.name)),
  };
}

export function filterAndSortSearchItems(items: SearchResultItem[]) {
  return items
    .filter(isNotHackathon)
    .filter(isNotFork)
    .filter(isNotIgnored)
    .sort((a, b) => a.repoNameFull.localeCompare(b.repoNameFull));
}

// To get the plugin name, we would need to download and read the actual plugin.json files, which would be time-consuming.
export function guessPluginName(filePath: string) {
  const parts = filePath.split('/');

  // The "main" plugin
  if (filePath === '/src/plugin.json') {
    return '';
  }

  // It is a nested plugin, with `plugin.json` living under "src/"
  if (parts[parts.length - 2] === 'src') {
    return parts[parts.length - 3];
  }

  // Sub-plugin, `plugin.json` not living under "src/"
  return parts[parts.length - 2] ?? '';
}

export function mapCodeSearchItem(item: CodeSearchItem, pluginType?: PluginType): SearchResultItem {
  const guessedPluginName = guessPluginName(item.path);

  return {
    name: guessedPluginName
      ? chalk.underline(item.repository.full_name) + '/' + guessedPluginName
      : chalk.underline(item.repository.full_name),
    fileName: item.name,
    filePath: item.path,
    fileUrl: item.html_url,
    fileUrlRaw: item.url,
    repoName: item.repository.name,
    repoNameFull: item.repository.full_name,
    repoUrl: item.repository.html_url,
    repoPrivate: item.repository.private,
    isFork: item.repository.fork,
    pluginType: pluginType ?? 'unknown',
  };
}

export function getRateLimitResetsText(resets: number) {
  const resetsDate = new Date(resets * 1000);

  return formatDistance(resetsDate, new Date(), { addSuffix: true });
}
