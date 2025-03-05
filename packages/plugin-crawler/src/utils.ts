import { formatDistance } from 'date-fns';
import createDebug from 'debug';
import { getConfig } from './config.js';
import { CodeSearchItem, SearchResultItem } from './types.js';

export const debug = createDebug('plugin-crawler');

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

export const isPluginIdMatch = (pluginId: string) => (item: SearchResultItem) => {
  if (!pluginId) {
    return true;
  }

  if (pluginId && !item.pluginJson?.id) {
    return false;
  }

  return Boolean(item.pluginJson.id.match(pluginId));
};

export const isPluginType = (panel: boolean, datasource: boolean, app: boolean) => (item: SearchResultItem) => {
  const showAll = !panel && !datasource && !app;
  const filters = [panel ? 'panel' : null, datasource ? 'datasource' : null, app ? 'app' : null].filter(Boolean);

  if (showAll) {
    return true;
  }

  return filters.includes(item.pluginJson.type);
};

export function mapCodeSearchItem(item: CodeSearchItem): SearchResultItem {
  return {
    fileName: item.name,
    filePath: item.path,
    fileUrl: item.html_url,
    fileUrlRaw: item.url,
    repoName: item.repository.name,
    repoNameFull: item.repository.full_name,
    repoUrl: item.repository.html_url,
    repoPrivate: item.repository.private,
    isFork: item.repository.fork,
  };
}

export function getRateLimitResetsText(resets: number) {
  const resetsDate = new Date(resets * 1000);

  return formatDistance(resetsDate, new Date(), { addSuffix: true });
}

export function sortItemsByPluginId(a: SearchResultItem, b: SearchResultItem) {
  if (!a.pluginJson?.id || !b.pluginJson?.id) {
    return a.repoNameFull.localeCompare(b.repoNameFull);
  }

  return a.pluginJson?.id.localeCompare(b.pluginJson?.id);
}
