import { AnalysisResult, MergedDependencyIssue } from '../types/reporters.js';

export function groupByPattern(issues: AnalysisResult[]): Record<string, AnalysisResult[]> {
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
export function groupByPackage(issues: AnalysisResult[]): Record<string, AnalysisResult[]> {
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

export function mergeByPattern(issues: AnalysisResult[]): MergedDependencyIssue[] {
  const mergedIssues = issues.reduce(
    (merged, issue) => {
      if (!merged[issue.pattern]) {
        merged[issue.pattern] = {
          pattern: issue.pattern,
          severity: issue.severity,
          impactLevel: issue.impactLevel,
          locations: [issue.location],
          problem: issue.problem,
          fix: issue.fix,
          link: issue.link,
          packageNames: issue.packageName ? [issue.packageName] : [],
          rootDependencies: issue.rootDependency ? [issue.rootDependency] : [],
        };
      } else {
        merged[issue.pattern].locations.push(issue.location);
        if (issue.packageName && !merged[issue.pattern].packageNames.includes(issue.packageName)) {
          merged[issue.pattern].packageNames.push(issue.packageName);
        }

        if (issue.rootDependency && !merged[issue.pattern].rootDependencies.includes(issue.rootDependency)) {
          merged[issue.pattern].rootDependencies.push(issue.rootDependency);
        }
      }
      return merged;
    },
    {} as Record<string, MergedDependencyIssue>
  );

  return Object.values(mergedIssues);
}
