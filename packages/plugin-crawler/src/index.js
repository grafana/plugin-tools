import { Octokit } from "@octokit/rest";
import { createCache } from "cache-manager";
import path from "node:path";
import Keyv from "keyv";
import KeyvSqlite from "@keyv/sqlite";

const CACHE_PATH = process.env.CACHE_PATH || path.resolve("./cache.sqlite");
const GITHUB_PAT = process.env.GITHUB_PAT;
const ORG = "grafana";
const keyv = new KeyvSqlite(`sqlite://${CACHE_PATH}`);
const cache = createCache({ ttl: 120000, stores: [keyv] });

if (!GITHUB_PAT) {
  console.error("GITHUB_PAT environment variable is required");
  process.exit(1);
}

const octokit = new Octokit({
  auth: GITHUB_PAT,
});

async function getAllReposForOrg() {
  const cacheKey = `repos_${ORG}`;

  try {
    if (cache.get(cacheKey)) {
      console.log(`[CACHE] Returning org repos from cache for ${org}`);
      return cache.get(cacheKey);
    }

    const response = await octokit.rest.repos.listForOrg({
      org: org,
      type: "all",
    });

    cache.set(cacheKey, response.data);

    return response.data;
  } catch (error) {
    console.error(error);
  }
}

async function getReposWithInternalAppPlugins() {
  const cacheKey = `internal_plugins_${ORG}`;

  try {
    const cached = await cacheGet(cacheKey);

    if (cached) {
      console.log(`[CACHE] Returning internal plugins from cache for ${ORG}`);
      return cached;
    }

    const response = await octokit.rest.search.code({
      q: `"type": app in:file filename:plugin.json org:${ORG}`,
    });

    await cacheSet(cacheKey, response.data);

    return response.data;
  } catch (error) {
    console.error(error);
  }
}

// async function findInternalPluginReposWithExtensions(org, fileName, content) {
//   try {
//     const response = await octokit.rest.search.code({
//       q: `${content} in:file filename:${fileName} org:${org}`,
//     });

//     response.data.items.forEach((item) => {
//       console.log(
//         `Repository: ${item.repository.full_name}, File Path: ${item.path}`
//       );
//     });
//   } catch (error) {
//     console.error(error);
//   }
// }

const run = async () => {
  const internalRepos = await getReposWithInternalAppPlugins();

  console.log(internalRepos.items.map((repo) => repo.repository));
};

run();
