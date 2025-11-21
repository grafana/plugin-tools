import chalk from 'chalk';
import type { PluginAnalysisResults, AnalysisResult, Severity, JsxRuntimeContext } from '../types.js';

/**
 * Formats analysis results for console output with colors and formatting
 */
export class ConsoleReporter {
  /**
   * Generate a formatted console report
   */
  static report(results: PluginAnalysisResults): void {
    console.log(chalk.bold('\n@grafana/react-detect - React 19 Compatibility Check'));
    console.log();
    console.log(
      `Analyzing plugin: ${chalk.cyan(results.plugin.name)} (${results.plugin.type}) v${results.plugin.version}`
    );
    console.log();
    this.printSeparator();

    // Summary
    if (results.summary.totalIssues === 0) {
      console.log(chalk.green.bold('\n✓ No React 19 compatibility issues found!'));
      console.log();
      this.printSeparator();
      return;
    }

    // Source issues
    if (results.sourceIssues.length > 0) {
      console.log(chalk.red.bold(`\n❌ Source Code Issues (${results.sourceIssues.length})`));
      console.log();
      this.printSourceIssues(results.sourceIssues);
    } else {
      console.log(chalk.green.bold('\n✓ No issues found in plugin source code'));
    }

    // Dependency issues
    if (results.dependencyIssues.length > 0) {
      console.log(chalk.yellow.bold(`\n⚠️  Bundled Dependency Issues (${results.dependencyIssues.length})`));
      console.log();
      this.printDependencyIssues(results.dependencyIssues);
    } else if (results.sourceIssues.length > 0) {
      console.log(chalk.green.bold('\n✓ No issues found in bundled dependencies'));
    }

    console.log();
    this.printSeparator();

    // Summary statistics
    console.log(chalk.bold('\nSummary:'));
    console.log(`  Total issues: ${results.summary.totalIssues}`);
    console.log(`  Source issues: ${results.summary.sourceIssuesCount}`);
    console.log(`  Dependency issues: ${results.summary.dependencyIssuesCount}`);

    if (results.summary.affectedDependencies.length > 0) {
      console.log(`  Affected dependencies: ${results.summary.affectedDependencies.length}`);
      console.log(`    ${results.summary.affectedDependencies.join(', ')}`);
    }

    // Pattern breakdown
    console.log(chalk.bold('\nIssues by pattern:'));
    for (const [pattern, count] of Object.entries(results.summary.patternCounts)) {
      console.log(`  ${pattern}: ${count}`);
    }

    // Show jsx-runtime bundling context if applicable
    if (results.jsxRuntimeContext) {
      this.printJsxRuntimeContext(results.jsxRuntimeContext);
    }

    // Show upgrade guide links
    console.log(chalk.bold('\nLearn more:'));
    console.log(`  React 19 Upgrade Guide: ${chalk.cyan('https://react.dev/blog/2024/04/25/react-19-upgrade-guide')}`);

    console.log();
  }

  /**
   * Print source code issues
   */
  private static printSourceIssues(issues: AnalysisResult[]): void {
    // Group by pattern
    const byPattern = this.groupByPattern(issues);

    for (const [patternName, patternIssues] of Object.entries(byPattern)) {
      const severity = patternIssues[0].pattern.severity;
      const description = patternIssues[0].pattern.description;
      const link = patternIssues[0].pattern.link;

      console.log(`  ${this.getSeverityIcon(severity)} ${chalk.bold(patternName)} ${chalk.dim(`(${severity})`)}`);
      console.log(`     ${chalk.dim(description)}`);
      if (link) {
        console.log(`     ${chalk.dim('→')} ${chalk.green(link)}`);
      }
      console.log();

      // Show first 5 occurrences
      const toShow = patternIssues.slice(0, 5);
      for (const issue of toShow) {
        console.log(`     ${chalk.cyan(issue.sourceMapFile)}:${chalk.yellow(issue.originalLine)}`);
        if (issue.sourceContent) {
          console.log(`       ${chalk.dim(issue.sourceContent)}`);
        }
      }

      if (patternIssues.length > 5) {
        console.log(`     ${chalk.dim(`... and ${patternIssues.length - 5} more occurrences`)}`);
      }

      console.log();
    }
  }

  /**
   * Print dependency issues grouped by package
   */
  private static printDependencyIssues(issues: AnalysisResult[]): void {
    // Group by package
    const byPackage = this.groupByPackage(issues);

    for (const [packageName, packageIssues] of Object.entries(byPackage)) {
      const firstIssue = packageIssues[0];
      const rootDep = firstIssue.rootDependency;

      console.log(`  📦 ${chalk.bold.cyan(packageName)}`);

      if (rootDep && rootDep !== packageName) {
        console.log(`     ${chalk.dim(`Via: ${rootDep} (transitive dependency)`)}`);
      }

      console.log();

      // Group by pattern within this package
      const byPattern = this.groupByPattern(packageIssues);

      for (const [patternName, patternIssues] of Object.entries(byPattern)) {
        const severity = patternIssues[0].pattern.severity;
        const count = patternIssues.length;
        const link = patternIssues[0].pattern.link;

        console.log(
          `     ${this.getSeverityIcon(severity)} ${patternName}: ${chalk.yellow(count)} occurrence${
            count > 1 ? 's' : ''
          }`
        );

        // Show first occurrence location
        const firstOccurrence = patternIssues[0];
        console.log(`        ${chalk.dim(firstOccurrence.sourceMapFile)}:${firstOccurrence.originalLine}`);

        if (link) {
          console.log(`        ${chalk.dim('→')} ${chalk.green(link)}`);
        }
      }

      console.log();
    }
  }

  /**
   * Group results by pattern name
   */
  private static groupByPattern(results: AnalysisResult[]): Record<string, AnalysisResult[]> {
    const grouped: Record<string, AnalysisResult[]> = {};

    for (const result of results) {
      if (!grouped[result.patternName]) {
        grouped[result.patternName] = [];
      }
      grouped[result.patternName].push(result);
    }

    return grouped;
  }

  /**
   * Group results by package name
   */
  private static groupByPackage(results: AnalysisResult[]): Record<string, AnalysisResult[]> {
    const grouped: Record<string, AnalysisResult[]> = {};

    for (const result of results) {
      const packageName = result.packageName || 'unknown';
      if (!grouped[packageName]) {
        grouped[packageName] = [];
      }
      grouped[packageName].push(result);
    }

    return grouped;
  }

  /**
   * Get icon for severity level
   */
  private static getSeverityIcon(severity: Severity): string {
    switch (severity) {
      case 'removed':
        return chalk.red('✗');
      case 'renamed':
        return chalk.yellow('⚠');
      case 'deprecated':
        return chalk.yellow('⚠');
      default:
        return '•';
    }
  }

  /**
   * Print jsx-runtime bundling context
   */
  private static printJsxRuntimeContext(context: JsxRuntimeContext): void {
    console.log(chalk.bold.red('\n🚨 Critical: jsx-runtime Bundled'));
    console.log();
    console.log(
      chalk.yellow(
        "  React's jsx-runtime is bundled in your plugin. This causes React 19 compatibility issues\n" +
          '  because __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED was renamed to __CLIENT_INTERNALS.'
      )
    );
    console.log();

    // Show which dependencies import jsx-runtime
    if (context.jsxRuntimeImporters.length > 0) {
      console.log(chalk.bold('  Dependencies importing jsx-runtime:'));
      for (const pkg of context.jsxRuntimeImporters) {
        console.log(`    • ${chalk.cyan(pkg)}`);
      }
      console.log();
    }

    // Show build config if detected
    if (context.buildConfig.hasAutomaticJsx) {
      console.log(chalk.bold('  Detected automatic JSX transform:'));
      console.log(`    File: ${chalk.cyan(context.buildConfig.configFile)}`);
      console.log(`    Config: ${chalk.dim(context.buildConfig.snippet)}`);
      console.log();
    }

    // Show fix instructions
    if (context.fixInstructions.length > 0) {
      console.log(chalk.bold.green('  How to fix:'));
      for (const instruction of context.fixInstructions) {
        if (instruction.startsWith('  ')) {
          console.log(`  ${chalk.dim(instruction.trim())}`);
        } else {
          console.log(`  ${instruction}`);
        }
      }
      console.log();
    }

    this.printSeparator();
  }

  /**
   * Print a horizontal separator line
   */
  private static printSeparator(): void {
    const width = process.stdout.columns || 80;
    console.log(chalk.dim('─'.repeat(width - 1)));
  }
}
