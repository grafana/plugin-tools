import type { PluginAnalysisResults } from '../types.js';

/**
 * Formats analysis results as JSON for machine consumption
 */
export class JsonReporter {
  /**
   * Generate a JSON report
   *
   * @param results Analysis results
   * @param pretty Whether to pretty-print the JSON
   * @returns JSON string
   */
  static report(results: PluginAnalysisResults, pretty = true): string {
    const output = {
      plugin: results.plugin,
      summary: results.summary,
      sourceIssues: results.sourceIssues.map((issue) => ({
        pattern: issue.patternName,
        severity: issue.pattern.severity,
        description: issue.pattern.description,
        file: issue.sourceMapFile,
        line: issue.originalLine,
        matched: issue.matched,
        context: issue.context,
        sourceContent: issue.sourceContent,
        confidence: issue.reactConfidence,
        reasons: issue.reactReasons,
        componentType: issue.componentType,
      })),
      dependencyIssues: results.dependencyIssues.map((issue) => ({
        pattern: issue.patternName,
        severity: issue.pattern.severity,
        description: issue.pattern.description,
        package: issue.packageName,
        rootDependency: issue.rootDependency,
        file: issue.sourceMapFile,
        line: issue.originalLine,
        matched: issue.matched,
        confidence: issue.reactConfidence,
        reasons: issue.reactReasons,
      })),
    };

    return pretty ? JSON.stringify(output, null, 2) : JSON.stringify(output);
  }
}
