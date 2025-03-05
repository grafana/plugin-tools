import path from "node:path";

export const CACHE_PATH =
  process.env.CACHE_PATH || path.resolve("../cache.sqlite");

export const GITHUB_PAT = process.env.GITHUB_PAT;

export const ORG = "grafana";

export const CLEAR_CACHE = process.env.CLEAR_CACHE || false;

if (!GITHUB_PAT) {
  console.error("GITHUB_PAT environment variable is required");
  process.exit(1);
}
