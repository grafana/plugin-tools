// With the datasources apiserver flags on, Grafana sends data source requests to /apis/... instead of /api/...
// Each helper keeps the legacy `includes` match and adds the matching /apis/... URL, so waits work with both.

const QUERY_PATH = /^\/apis\/(?:query|datasource)\.grafana\.app\/[^/]+\/namespaces\/[^/]+\/query$/;
const DATASOURCE_API_PREFIX = String.raw`^\/apis\/[^/]+\.datasource\.grafana\.app\/[^/]+\/namespaces\/[^/]+\/datasources\/`;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getPathname(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

/**
 * Whether the url is a data source query request, sent to either /api/ds/query or the query apiserver.
 */
export function isDataQueryUrl(url: string, legacyQueryPath: string): boolean {
  return url.includes(legacyQueryPath) || QUERY_PATH.test(getPathname(url));
}

/**
 * Whether the url is the health check of the data source, sent to either the legacy API or the datasource apiserver.
 */
export function isHealthCheckUrl(url: string, uid: string, legacyHealthPath: string): boolean {
  return (
    url.includes(legacyHealthPath) ||
    new RegExp(`${DATASOURCE_API_PREFIX}${escapeRegExp(uid)}\\/health$`).test(getPathname(url))
  );
}

/**
 * Whether the url is the save request of the data source, sent to either the legacy API or the datasource apiserver.
 */
export function isDataSourceSaveUrl(url: string, uid: string, legacyDataSourcePath: string): boolean {
  return (
    url.includes(legacyDataSourcePath) ||
    new RegExp(`${DATASOURCE_API_PREFIX}${escapeRegExp(uid)}$`).test(getPathname(url))
  );
}
