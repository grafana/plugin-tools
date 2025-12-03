import { AnalysisResult, PluginAnalysisResults } from '../types/reporters.js';
import { output } from '../utils/output.js';

export function consoleReporter(results: PluginAnalysisResults) {
  if (results.summary.totalIssues === 0) {
    output.success({
      title: 'No React 19 breaking changes detected!',
      body: [
        `Plugin: ${results.plugin.name} v${results.plugin.version}`,
        'Your plugin appears to be compatible with React 19.',
      ],
    });
    return;
  }

  output.error({
    title: 'React 19 breaking changes detected!',
    body: [
      `Plugin: ${results.plugin.name} v${results.plugin.version}`,
      'Your plugin appears to be incompatible with React 19. Please refer to the following suggestions to help resolve issues.',
    ],
  });

  const criticalSourceIssues = results.issues.critical.filter((issue) => issue.location.type === 'source');
  const warningSourceIssues = results.issues.warnings.filter((issue) => issue.location.type === 'source');
  const sourceCodeIssues = [...criticalSourceIssues, ...warningSourceIssues];
  if (sourceCodeIssues.length > 0) {
    const groupedByPattern = groupByPattern(sourceCodeIssues);
    for (const [pattern, issues] of Object.entries(groupedByPattern)) {
      const fileLocationList = output.bulletList(issues.map((issue) => issue.location.file));
      const patternInfo = issues[0];
      output.error({
        title: `${pattern} (${patternInfo.problem})`,
        body: [
          `fix: ${patternInfo.fix.description}. e.g.`,
          `before: ${output.formatCode(patternInfo.fix.before)}`,
          `after: ${output.formatCode(patternInfo.fix.after)}`,
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
    const groupedByPackage = groupByPattern(dependencyIssues);
    for (const [pkgName, issues] of Object.entries(groupedByPackage)) {
      output.error({
        title: pkgName,
        body: issues.map((issue) => issue.location.file),
      });
      output.addHorizontalLine('red');
    }
  }
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
