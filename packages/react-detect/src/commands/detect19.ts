import fs from 'fs';
import path from 'path';
import minimist from 'minimist';
import { Output } from '@grafana/plugin-tools-output';
import { Analyzer } from '../core/analyzer.js';
import { ConsoleReporter } from '../reporters/console-reporter.js';
import { JsonReporter } from '../reporters/json-reporter.js';
import { CsvReporter } from '../reporters/csv-reporter.js';
import { isValidPatternName } from '../core/patterns.js';
import { findPluginRoot, directoryExists } from '../utils/file.utils.js';
import { isPluginDirectory } from '../utils/plugin.utils.js';
import type { AnalysisConfig, OutputFormat, Confidence } from '../types.js';

/**
 * Main detect command for finding React 19 breaking changes
 */
export async function detect19(argv: minimist.ParsedArgs, output: Output) {
  try {
    // Parse options
    const options = parseOptions(argv);

    // Pre-flight checks
    await performPreFlightChecks(options);

    // Build analysis config
    const config = buildAnalysisConfig(options);

    // Run analysis
    if (!options.quiet) {
      output.log({
        title: 'Detecting React 19 breaking changes...',
        withPrefix: true,
      });
    }

    const analyzer = new Analyzer(config, output);
    const results = await analyzer.analyze();

    // Generate output
    const reportOutput = generateOutput(results, options.format, output);

    // Write output
    if (options.output) {
      fs.writeFileSync(options.output, reportOutput);
      if (!options.quiet) {
        output.success({
          title: `Results written to ${options.output}`,
          withPrefix: false,
        });
      }
    } else if (options.format !== 'console') {
      // Non-console formats go to stdout
      output.logSingleLine(reportOutput);
    }

    // Exit with appropriate code
    const hasSourceIssues = results.sourceIssues.length > 0;
    process.exit(hasSourceIssues ? 1 : 0);
  } catch (error) {
    output.error({
      title: 'Error',
      body: [(error as Error).message],
      withPrefix: false,
    });
    process.exit(1);
  }
}

/**
 * Parse command line options
 */
function parseOptions(argv: minimist.ParsedArgs) {
  const distPath = argv._[1] || './dist';
  const pattern = argv.pattern as string | undefined;
  const format = (argv.format as OutputFormat) || 'console';
  const confidence = (argv.confidence as Confidence) || 'medium';
  const sourceOnly = argv['source-only'] || argv.sourceOnly || false;
  const depsOnly = argv['deps-only'] || argv.depsOnly || false;
  const includeExternals = argv['include-externals'] || argv.includeExternals || false;
  const output = argv.output as string | undefined;
  const quiet = argv.quiet || false;

  // Validate pattern if specified
  if (pattern && !isValidPatternName(pattern)) {
    throw new Error(`Unknown pattern: ${pattern}`);
  }

  // Validate format
  if (!['console', 'json', 'csv'].includes(format)) {
    throw new Error(`Unknown format: ${format}. Must be one of: console, json, csv`);
  }

  // Validate confidence
  if (!['high', 'medium', 'low', 'none', 'unknown'].includes(confidence)) {
    throw new Error(`Unknown confidence: ${confidence}. Must be one of: high, medium, low, none, unknown`);
  }

  return {
    distPath,
    pattern,
    format,
    confidence,
    sourceOnly,
    depsOnly,
    includeExternals,
    output,
    quiet,
  };
}

/**
 * Perform pre-flight checks before running analysis
 */
async function performPreFlightChecks(options: ReturnType<typeof parseOptions>) {
  // Find plugin root
  const pluginRoot = findPluginRoot();
  if (!pluginRoot && !isPluginDirectory()) {
    throw new Error(
      'Not in a Grafana plugin directory. Please run this command from your plugin root (should contain src/plugin.json)'
    );
  }

  // Check if dist directory exists
  const distDir = path.resolve(options.distPath);
  if (!directoryExists(distDir)) {
    throw new Error(
      `Distribution directory not found: ${distDir}\n` +
        `Please build your plugin first (npm run build) or specify a different path with: npx @grafana/react-detect detect <path>`
    );
  }

  // Check if dist has any JS files
  const files = fs.readdirSync(distDir);
  const hasJsFiles = files.some((f) => f.endsWith('.js'));
  if (!hasJsFiles) {
    throw new Error(`No JavaScript files found in ${distDir}. Please build your plugin first.`);
  }
}

/**
 * Build analysis configuration
 */
function buildAnalysisConfig(options: ReturnType<typeof parseOptions>): AnalysisConfig {
  const pluginRoot = findPluginRoot() || process.cwd();
  const distDir = path.resolve(options.distPath);

  return {
    distDir,
    pluginRoot,
    patterns: options.pattern ? [options.pattern] : null,
    minConfidence: options.confidence,
    includeExternals: options.includeExternals,
    showProgress: !options.quiet && options.format === 'console',
  };
}

/**
 * Generate output in the requested format
 */
function generateOutput(results: any, format: OutputFormat, output: Output): string {
  // Filter results based on sourceOnly/depsOnly flags
  // (This would need to be passed through options if needed)

  switch (format) {
    case 'console':
      ConsoleReporter.report(results, output);
      return '';
    case 'json':
      return JsonReporter.report(results, true);
    case 'csv':
      return CsvReporter.report(results);
    default:
      throw new Error(`Unknown format: ${format}`);
  }
}
