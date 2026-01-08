import { PluginAnalysisResults } from '../types/reporters.js';

export function jsonReporter(results: PluginAnalysisResults) {
  const {
    // Remove the duplicated dependencies issues
    issues: { dependencies, ...issues },
    ...rest
  } = results;

  const flattenedIssues = [...issues.critical, ...issues.warnings];

  console.log(JSON.stringify({ ...rest, issues: flattenedIssues }, null, 2));
}
