import { AnalysisResult, PluginAnalysisResults } from '../types/reporters.js';
import { output } from '../utils/output.js';

export function consoleReporter(results: PluginAnalysisResults) {
  if (results.summary.totalIssues === 0) {
    output.success({
      title: 'No React 19 breaking changes detected!',
      body: [
        `Plugin: ${results.plugin.name} version: ${results.plugin.version}`,
        'Good news! Your plugin appears to be compatible with React 19.',
        '',
        'Even so we recommend testing your plugin using the following steps:',
        ...output.bulletList([
          `1. Use the React 19 Grafana docker image: ${output.formatCode('grafana/grafana-enterprise-dev:10.0.0-255911')}`,
          '2. Start the server and manually test your plugin.',
        ]),
        '',
        `For more information, please refer to the React 19 blog post: ${output.formatUrl('https://react.dev/blog/2024/04/25/react-19-upgrade-guide')}.`,
        '',
        'Thank you for using Grafana!',
      ],
    });
    return;
  }

  output.error({
    title: 'React 19 breaking changes detected!',
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
        'We recommend checking for dependency updates which are compatible with React 19.',
      ],
      withPrefix: false,
    });

    const groupedByPackage = groupByPackage(dependencyIssues);
    for (const [pkgName, issues] of Object.entries(groupedByPackage)) {
      const uniquePatterns = new Set(
        issues.map(
          (issue) =>
            `${issue.problem} (${issue.pattern}). ${issue.fix.description}. Further information: ${output.formatUrl(issue.link)}`
        )
      );
      const uniqueFileLocations = new Set(issues.map((issue) => issue.location.file));
      const fileLocationList = output.bulletList(Array.from(uniqueFileLocations));
      const patternInfoList = output.bulletList(Array.from(uniquePatterns));
      output.error({
        title: `📦 ${pkgName}`,
        body: ['issues found:', ...patternInfoList, '', 'found in:', ...fileLocationList],
        withPrefix: false,
      });
      output.addHorizontalLine('red');
    }
  }

  output.error({
    title: 'Next steps',
    body: [
      'We recommend testing your plugin using the following steps to ensure it is compatible with React 19:',
      ...output.bulletList([
        `1. Use the React 19 Grafana docker image: ${output.formatCode('grafana/grafana-enterprise-dev:10.0.0-255911')}`,
        '2. Start the server and manually test your plugin.',
      ]),
      '',
      `For more information, please refer to the React 19 blog post: ${output.formatUrl('https://react.dev/blog/2024/04/25/react-19-upgrade-guide')}.`,
      '',
      'Thank you for using Grafana!',
    ],
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
