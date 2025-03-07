import ora from 'ora';
import boxen from 'boxen';
import chalk, { type ForegroundColorName } from 'chalk';
import terminalLink from 'terminal-link';
import { formatDistance } from 'date-fns';
import * as semver from 'semver';
import createDebug from 'debug';
import { getConfig } from './config.js';
import { CodeSearchItem, SearchResultItem } from './types.js';

const spinner = ora('Loading').start();
export const debug = createDebug('plugin-crawler');

export function isNotFork(item: SearchResultItem) {
  return !item.isFork;
}

export function isNotHackathon(item: SearchResultItem) {
  return !item.repoNameFull.includes('hackathon') && !item.repoNameFull.includes('hackaton');
}

export function isRepoNotIgnored(item: SearchResultItem) {
  const { ignoredRepos } = getConfig();
  return !ignoredRepos.includes(item.repoNameFull);
}

export function isNotTemplate(item: SearchResultItem) {
  if (item.filePath.endsWith('.json.tmpl') || item.filePath.match('templates/')) {
    return false;
  }

  return true;
}

export function isNotNestedPlugin(item: SearchResultItem) {
  if (!item.filePath.match('src/plugin.json')) {
    return false;
  }

  return true;
}

export function hasPluginJson(item: SearchResultItem) {
  if (!item.pluginJson || !item.pluginJson.id) {
    return false;
  }

  return true;
}

export function hasPackageJson(item: SearchResultItem) {
  if (!item.packageJson || !item.packageJson?.version) {
    return false;
  }

  return true;
}

export function isNotTest(item: SearchResultItem) {
  const path = `${item.repoNameFull}/${item.filePath}`;
  if (path.match('test') || path.match('spec') || path.match('mock') || path.match('e2e') || path.match('fixture')) {
    return false;
  }

  return true;
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

export const isPluginJsonFieldDefined = (field?: string) => (item: SearchResultItem) => {
  if (!field) {
    return true;
  }

  if (field && !item.pluginJson) {
    return false;
  }

  const found = field.split('.').reduce((o, i) => (o ? o[i] : o), item.pluginJson);

  // `false` values count as defined as well
  return found !== undefined;
};

export const isPluginType = (panel?: boolean, datasource?: boolean, app?: boolean) => (item: SearchResultItem) => {
  const showAll = !panel && !datasource && !app;
  const filters = [panel ? 'panel' : null, datasource ? 'datasource' : null, app ? 'app' : null].filter(Boolean);

  if (showAll) {
    return true;
  }

  return filters.includes(item.pluginJson.type);
};

export const hasDependencies =
  (dependencies: string[] = []) =>
  (item: SearchResultItem) => {
    const mergedDependencies = {
      ...item.packageJson.devDependencies,
      ...item.packageJson.dependencies,
    };

    // No dependencies specified, skip filtering
    if (!dependencies.length) {
      return true;
    }

    for (const dependency of dependencies) {
      const [depName, depVersion] = parseDependencyString(dependency);

      if (!mergedDependencies[depName]) {
        return false;
      }

      // "latest" means that they didn't specify the version
      if (mergedDependencies[depName] && depVersion === 'latest') {
        continue;
      }

      if (
        mergedDependencies[depName] &&
        !semver.satisfies(mergedDependencies[depName].replace(/^[~^]+/, ''), depVersion)
      ) {
        return false;
      }
    }

    return true;
  };

// In the format of "@grafana/data@10.0.1"
export function parseDependencyString(str: string) {
  const pos = str.lastIndexOf('@');

  if (pos <= 0 || pos === str.length - 1) {
    return [str, 'latest'];
  }

  const packageName = str.substring(0, pos);
  const version = str.substring(pos + 1);
  return [packageName, version];
}

// The filtering options work like a union (logical OR)
export const isExtensionType =
  ({
    addedLinks,
    addedComponents,
    extensionPoints,
    exposedComponents,
    exposedComponentUsages,
  }: {
    addedLinks?: boolean;
    addedComponents?: boolean;
    extensionPoints?: boolean;
    exposedComponents?: boolean;
    exposedComponentUsages?: boolean;
  }) =>
  (item: SearchResultItem) => {
    const showAll =
      !addedLinks && !addedComponents && !extensionPoints && !exposedComponents && !exposedComponentUsages;

    if ((showAll || addedLinks) && item.pluginJson?.extensions?.addedLinks?.length > 0) {
      return true;
    }

    if ((showAll || addedComponents) && item.pluginJson?.extensions?.addedComponents?.length > 0) {
      return true;
    }

    if ((showAll || extensionPoints) && item.pluginJson?.extensions?.extensionPoints?.length > 0) {
      return true;
    }

    if ((showAll || exposedComponents) && item.pluginJson?.extensions?.exposedComponents?.length > 0) {
      return true;
    }

    if (
      (showAll || exposedComponentUsages) &&
      item.pluginJson?.dependencies?.extensions?.exposedComponents?.length > 0
    ) {
      return true;
    }

    return false;
  };

export function mapCodeSearchItem(item: CodeSearchItem): SearchResultItem {
  const packageJsonPath = item.path.match('src/plugin.json')
    ? item.path.replace('src/plugin.json', 'package.json')
    : '';
  const packageJsonUrl = packageJsonPath ? item.repository.html_url + '/blob/main/' + packageJsonPath : '';

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
    packageJsonPath,
    packageJsonUrl,
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

// @ts-ignore - TODO: type `rateLimitInfo`
export function formatRateLimitInfo(r: any) {
  return [
    `Github rate limit: ${r.rate.used}/${r.rate.limit} - Resetting ${getRateLimitResetsText(r.rate.reset)}`,
    `Github core API limit: ${r.resources.core.used}/${r.resources.core.limit} - Resetting ${getRateLimitResetsText(r.resources.core.reset)}`,
    `Github code-search API limit: ${r.resources.search.used}/${r.resources.search.limit} - Resetting ${getRateLimitResetsText(r.resources.search.reset)}`,
  ]
    .map((t) => `- ${t}`)
    .join('\n');
}

export function getCommandStartTime() {
  return process.hrtime();
}

export function getCommandDurationTime(startTime: [number, number]) {
  const hrtime = process.hrtime(startTime);
  return (hrtime[0] + hrtime[1] / 1e9).toFixed(3);
}

export function prettyPrintSearchResults({
  items,
  startTime,
  rateLimitInfo,
  verbose,
}: {
  items: SearchResultItem[];
  startTime: [number, number];
  rateLimitInfo: any;
  verbose?: boolean;
}) {
  const rows = [];
  for (const item of items) {
    const columns = [
      // Type
      item.pluginJson.type ? chalk.bgWhite.black(` ${item.pluginJson.type} `) : '',
      // ID
      chalk.bold(item.pluginJson.id),
      // Vesion
      item.packageJson.version ? chalk.italic.gray(`v${item.packageJson.version}`) : '',
      // Links
      `| ${terminalLink('repository', item.repoUrl)}, ${terminalLink('plugin.json', item.fileUrl)}, ${terminalLink('package.json', item.packageJsonUrl)}`,
    ].filter(Boolean);

    rows.push(columns.join(' '));

    // TODO: clean this up!
    if (verbose) {
      const addedLinks = item.pluginJson.extensions?.addedLinks ?? [];
      const addedComponents = item.pluginJson.extensions?.addedComponents ?? [];
      const extensionPoints = item.pluginJson.extensions?.extensionPoints ?? [];
      const exposedComponents = item.pluginJson.extensions?.exposedComponents ?? [];
      const exposedComponentUsages = item.pluginJson.dependencies?.extensions?.exposedComponents ?? [];
      const nodes = [
        {
          title: chalk.bold(`Added links (${addedLinks.length})`),
          children: addedLinks.map((item: any) => ({
            title: item.title,
            children: item.targets.map((target: any) => target),
          })),
        },
        {
          title: chalk.bold(`Added components (${addedComponents.length})`),
          children: addedComponents.map((item: any) => ({
            title: item.title,
            children: item.targets.map((target: any) => target),
          })),
        },
        {
          title: chalk.bold(`Extension points (${extensionPoints.length})`),
          children: extensionPoints.map((item: any) => `${item.id}`),
        },
        {
          title: chalk.bold(`Exposed components (${exposedComponents.length})`),
          children: exposedComponents.map((item: any) => `${item.id}`),
        },
        {
          title: chalk.bold(`Used exposed components (${exposedComponentUsages.length})`),
          children: exposedComponentUsages.map((id: string) => id),
        },
      ];

      createAsciiTree(nodes, '  ').map((row) => rows.push(row));
      rows.push('');
    }
  }

  printBox({
    title: `Search - ${items.length} result${items.length > 1 ? 's' : ''} (${getCommandDurationTime(startTime)} sec)`,
    content: formatRateLimitInfo(rateLimitInfo),
  });

  if (rows.length === 0) {
    console.log('No results found.');
    return;
  }

  console.log(rows.join('\n'));
}

type TreeNode =
  | string
  | {
      title: string;
      children: TreeNode[];
    };

export function createAsciiTree(nodes: TreeNode[], prefix = '') {
  const rows: string[] = [];

  nodes.forEach((node, index) => {
    const isLast = index === nodes.length - 1;
    const branch = isLast ? '└── ' : '├── ';

    if (typeof node === 'string') {
      rows.push(prefix + branch + node);
    } else if (node.children?.length > 0) {
      rows.push(prefix + branch + node.title);

      if (node.children && node.children.length) {
        const newPrefix = prefix + (isLast ? '    ' : '│   ');
        createAsciiTree(node.children, newPrefix).map((row) => rows.push(row));
      }
    }
  });

  return rows;
}

export function startSpinner() {
  spinner.start();
}

export function endSpinner() {
  spinner.stop();
}

export function setSpinnerText(text: string) {
  spinner.text = text;
}

export function printBox({
  title,
  subtitle,
  content,
  color = 'green',
}: {
  title: string;
  content: string;
  subtitle?: string;
  color?: ForegroundColorName;
}) {
  console.log(
    boxen(chalk[color](`${chalk.bold(title)}${subtitle ? ` ${subtitle}` : ''}\n\n${content}`), {
      padding: 1,
      borderColor: color,
    })
  );
}
