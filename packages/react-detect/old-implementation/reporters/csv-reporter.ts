import type { PluginAnalysisResults, AnalysisResult } from '../types.js';

/**
 * Formats analysis results as CSV for spreadsheet consumption
 */
export class CsvReporter {
  /**
   * Generate a CSV report
   * Format: One row per plugin issue type (Source/Dependency) with aggregated counts
   *
   * @param results Analysis results
   * @returns CSV string
   */
  static report(results: PluginAnalysisResults): string {
    const rows: string[] = [];

    // CSV header
    rows.push('Plugin ID,Plugin Version,Type,Occurrence Count,React Confidence,Packages/Files,Source Code Sample');

    // Group issues by package for dependencies
    const dependenciesByPackage = this.groupByPackage(results.dependencyIssues);

    // Add dependency rows
    for (const [packageName, issues] of Object.entries(dependenciesByPackage)) {
      const confidence = this.getHighestConfidence(issues);
      const count = issues.length;

      rows.push(
        [
          this.escapeCsv(results.plugin.id),
          this.escapeCsv(results.plugin.version),
          'Dependency',
          count.toString(),
          confidence,
          this.escapeCsv(packageName),
          'N/A',
        ].join(',')
      );
    }

    // Add source code row (if any issues)
    if (results.sourceIssues.length > 0) {
      const uniqueFiles = [
        ...new Set(
          results.sourceIssues
            .map((r) => r.sourceMapFile)
            .filter((f) => f && f !== 'Unknown' && f !== 'N/A')
            .map((f) => {
              // Get just the filename
              const parts = f.split('/');
              return parts[parts.length - 1];
            })
        ),
      ];

      const fileList = uniqueFiles.length > 0 ? uniqueFiles.join(', ') : 'N/A';
      const confidence = this.getHighestConfidence(results.sourceIssues);
      const sampleCode = results.sourceIssues.find((r) => r.sourceContent)?.sourceContent || 'N/A';

      rows.push(
        [
          this.escapeCsv(results.plugin.id),
          this.escapeCsv(results.plugin.version),
          'Source',
          results.sourceIssues.length.toString(),
          confidence,
          this.escapeCsv(fileList),
          this.escapeCsv(sampleCode),
        ].join(',')
      );
    }

    return rows.join('\n');
  }

  /**
   * Group issues by package name
   */
  private static groupByPackage(issues: AnalysisResult[]): Record<string, AnalysisResult[]> {
    const grouped: Record<string, AnalysisResult[]> = {};

    for (const issue of issues) {
      const packageName = issue.packageName || 'unknown';
      if (!grouped[packageName]) {
        grouped[packageName] = [];
      }
      grouped[packageName].push(issue);
    }

    return grouped;
  }

  /**
   * Get the highest confidence level from a list of results
   */
  private static getHighestConfidence(results: AnalysisResult[]): string {
    const confidenceLevels: Record<string, number> = {
      high: 3,
      medium: 2,
      low: 1,
      none: 0,
      unknown: -1,
    };

    let highest = 'unknown';
    let highestScore = -1;

    for (const result of results) {
      const score = confidenceLevels[result.reactConfidence] || -1;
      if (score > highestScore) {
        highestScore = score;
        highest = result.reactConfidence;
      }
    }

    return highest;
  }

  /**
   * Escape a field for CSV format
   * Handles commas, quotes, and newlines
   */
  private static escapeCsv(field: string | number | null | undefined): string {
    if (field == null) {
      return '';
    }

    const str = String(field);

    // If the field contains comma, quote, or newline, wrap in quotes and escape quotes
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }

    return str;
  }
}
