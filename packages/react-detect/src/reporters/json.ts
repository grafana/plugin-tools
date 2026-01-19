import { PluginAnalysisResults } from '../types/reporters.js';
import { groupByPattern, mergeByPattern } from './utils.js';

export function jsonReporter(results: PluginAnalysisResults) {
  const { plugin, summary } = results;
  const criticalSourceIssues = results.issues.critical.filter((issue) => issue.location.type === 'source');
  const warningSourceIssues = results.issues.warnings.filter((issue) => issue.location.type === 'source');
  const criticalDependencyIssues = results.issues.critical.filter((issue) => issue.location.type === 'dependency');
  const warningDependencyIssues = results.issues.warnings.filter((issue) => issue.location.type === 'dependency');
  const sourceCodeIssues = [...criticalSourceIssues, ...warningSourceIssues];
  const dependencyIssues = [...criticalDependencyIssues, ...warningDependencyIssues];
  const sourceCodeIssuesGrouped = groupByPattern(sourceCodeIssues);
  const dependencyIssuesMerged = mergeByPattern(dependencyIssues);

  console.log(
    JSON.stringify(
      { plugin, summary, sourceCodeIssues: sourceCodeIssuesGrouped, dependencyIssues: dependencyIssuesMerged },
      null,
      2
    )
  );
}
