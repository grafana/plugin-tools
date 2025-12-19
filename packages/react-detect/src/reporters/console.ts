import { AnalysisResult, PluginAnalysisResults } from '../types/reporters.js';
import { isExternal } from '../utils/dependencies.js';
import { output } from '../utils/output.js';

const summaryMsg = [
  `We strongly recommend testing your plugin using the React 19 Grafana docker image: ${output.formatCode('grafana/grafana:12.4.0-react19')}`,
  ...output.bulletList([
    `Start the server with ${output.formatCode('GRAFANA_VERSION=12.4.0-react19 GRAFANA_IMAGE=grafana docker compose up --build')} flag and manually test your plugin.`,
    'Run any e2e tests to try and catch any potential issues.',
    'Manually test your plugin in the browser. Look for any console warnings or errors related to React.',
  ]),
  '',
  'For more information, please refer to:',
  `React 19 blog post: ${output.formatUrl('https://react.dev/blog/2024/04/25/react-19-upgrade-guide')}.`,
  `Grafana developer documentation: ${output.formatUrl('https://grafana.com/developers/plugin-tools/set-up/set-up-docker')}`,
];

export function consoleReporter(results: PluginAnalysisResults) {
  if (results.summary.totalIssues === 0) {
    output.success({
      title: 'No React 19 breaking changes detected.',
      body: [
        `Plugin: ${results.plugin.name} version: ${results.plugin.version}`,
        'Good news! Your plugin appears to be compatible with React 19.',
      ],
    });
    output.addHorizontalLine('green');
    output.success({
      title: 'Next steps',
      body: summaryMsg,
      withPrefix: false,
    });
    return;
  }

  output.error({
    title: 'React 19 breaking changes detected.',
    body: [
      `Plugin: ${results.plugin.name} version: ${results.plugin.version}`,
      'Your plugin appears to be incompatible with React 19. Note that this tool can give false positives, please review the issues carefully.',
    ],
  });

  const criticalSourceIssues = results.issues.critical.filter((issue) => issue.location.type === 'source');
  const warningSourceIssues = results.issues.warnings.filter((issue) => issue.location.type === 'source');
  const sourceCodeIssues = [...criticalSourceIssues, ...warningSourceIssues];
  if (sourceCodeIssues.length > 0) {
    output.error({
      title: 'Source code issues',
      body: ['The following source code issues were found. Please refer to the suggestions to help resolve them.'],
      withPrefix: false,
    });
    const groupedByPattern = groupByPattern(sourceCodeIssues);
    for (const [pattern, issues] of Object.entries(groupedByPattern)) {
      // dedupe file locations
      const uniqueFileLocations = new Set(issues.map((issue) => issue.location.file));
      const fileLocationList = output.bulletList(Array.from(uniqueFileLocations));
      const patternInfo = issues[0];
      output.error({
        title: `${pattern} (${patternInfo.problem})`,
        body: [
          `fix: ${patternInfo.fix.description}.`,
          ...(patternInfo.fix.before ? [`before: ${output.formatCode(patternInfo.fix.before)}`] : []),
          ...(patternInfo.fix.after ? [`after: ${output.formatCode(patternInfo.fix.after)}`] : []),
          `link: ${output.formatUrl(patternInfo.link)}`,
          '',
          'found in:',
          ...fileLocationList,
        ],
        withPrefix: false,
      });
      output.addHorizontalLine('red');
    }
  }

  const criticalDependencyIssues = results.issues.critical.filter((issue) => issue.location.type === 'dependency');
  const warningDependencyIssues = results.issues.warnings.filter((issue) => issue.location.type === 'dependency');
  const dependencyIssues = [...criticalDependencyIssues, ...warningDependencyIssues];
  if (dependencyIssues.length > 0) {
    output.error({
      title: 'Dependency issues',
      body: [
        'The following issues were found in bundled dependencies.',
        'Please check for dependency updates that are compatible with React 19.',
      ],
      withPrefix: false,
    });

    const groupedByPackage = groupByPackage(dependencyIssues);
    for (const [pkgName, issues] of Object.entries(groupedByPackage)) {
      const uniquePatterns = new Set(
        issues.map(
          (issue) => `${issue.problem}. ${issue.fix.description}.
   Further information: ${output.formatUrl(issue.link)}`
        )
      );
      const uniqueFileLocations = new Set(issues.map((issue) => issue.location.file));
      const fileLocationList = output.bulletList(Array.from(uniqueFileLocations));
      const patternInfoList = output.bulletList(Array.from(uniquePatterns));
      const rootDependencies = issues
        .filter(
          (issue) =>
            issue.rootDependency !== undefined && issue.rootDependency !== pkgName && !isExternal(issue.rootDependency)
        )
        .map((issue) => issue.rootDependency);
      const uniqueDependencies = new Set(rootDependencies.filter((dep) => dep !== undefined));

      const body = ['issues found:', ...patternInfoList, ''];
      if (uniqueDependencies.size) {
        body.push(`Bundled by dependenc${uniqueDependencies.size > 1 ? 'ies' : 'y'}:`);
        body.push(...output.bulletList(Array.from(uniqueDependencies)));
      }

      body.push('found in:', ...fileLocationList);
      output.error({
        title: `📦 ${pkgName}`,
        body,
        withPrefix: false,
      });
      output.addHorizontalLine('red');
    }
  }

  output.error({
    title: 'Next steps',
    body: summaryMsg,
    withPrefix: false,
  });
}

function groupByPattern(issues: AnalysisResult[]): Record<string, AnalysisResult[]> {
  return issues.reduce(
    (groups, issue) => {
      if (!groups[issue.pattern]) {
        groups[issue.pattern] = [];
      }
      groups[issue.pattern].push(issue);
      return groups;
    },
    {} as Record<string, AnalysisResult[]>
  );
}

function groupByPackage(issues: AnalysisResult[]): Record<string, AnalysisResult[]> {
  return issues.reduce(
    (groups, issue) => {
      if (!groups[issue.packageName!]) {
        groups[issue.packageName!] = [];
      }
      groups[issue.packageName!].push(issue);
      return groups;
    },
    {} as Record<string, AnalysisResult[]>
  );
}
