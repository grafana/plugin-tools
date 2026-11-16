import { E2ESelectorGroups } from '../types';
import { globToRegExp } from './glob';

type DataSourceApis = E2ESelectorGroups['apis']['DataSource'];

function getPathname(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

// the patterns are the globs used for routing, so the query string part is dropped and only the path is matched
function matchesPathPattern(url: string, pattern: string): boolean {
  return globToRegExp(pattern.split('?')[0]).test(getPathname(url));
}

/**
 * Whether the url is a data source query request, sent to either the legacy API or the query apiserver.
 */
export function isDataQueryUrl(url: string, apis: Pick<DataSourceApis, 'query' | 'appPlatformQueryPattern'>): boolean {
  return url.includes(apis.query) || matchesPathPattern(url, apis.appPlatformQueryPattern);
}

/**
 * Whether the url is the health check of the data source, sent to either the legacy API or the datasource apiserver.
 */
export function isHealthCheckUrl(url: string, legacyHealthPath: string, appPlatformHealthPattern: string): boolean {
  return url.includes(legacyHealthPath) || matchesPathPattern(url, appPlatformHealthPattern);
}

/**
 * Whether the url is the save request of the data source, sent to either the legacy API or the datasource apiserver.
 */
export function isDataSourceSaveUrl(
  url: string,
  legacyDataSourcePath: string,
  appPlatformDataSourcePattern: string
): boolean {
  return url.includes(legacyDataSourcePath) || matchesPathPattern(url, appPlatformDataSourcePattern);
}
