import path from 'path';
import { SourceMapParser } from './source-map-parser.js';
import { ConfidenceScorer } from './confidence-scorer.js';
import { ComponentDetector } from './component-detector.js';
import { PATTERNS } from './patterns.js';
import { ExternalsDetector } from '../dependencies/externals-detector.js';
import { DependencyResolver } from '../dependencies/dependency-resolver.js';
import { JsxConfigDetector } from '../utils/jsx-config-detector.js';
import { findJsFiles, searchInFile, fileExists, shortenPath } from '../utils/file.utils.js';
import { loadPluginMetadata } from '../utils/plugin.utils.js';
import type {
  AnalysisConfig,
  AnalysisResult,
  PluginAnalysisResults,
  Match,
  EnrichedMatch,
  IssueLocationType,
  JsxRuntimeContext,
} from '../types.js';

/**
 * Main analyzer that orchestrates the detection of React 19 breaking changes
 */
export class Analyzer {
  private config: AnalysisConfig;
  private externalsDetector: ExternalsDetector;
  private dependencyResolver: DependencyResolver;

  constructor(config: AnalysisConfig) {
    this.config = config;
    this.externalsDetector = new ExternalsDetector(config.pluginRoot);
    this.dependencyResolver = new DependencyResolver(config.pluginRoot);
  }

  /**
   * Run the analysis
   *
   * @returns Analysis results grouped by plugin
   */
  async analyze(): Promise<PluginAnalysisResults> {
    const pluginMetadata = loadPluginMetadata(this.config.pluginRoot);

    if (this.config.showProgress) {
      console.log(`\nAnalyzing plugin: ${pluginMetadata.name} (${pluginMetadata.type}) v${pluginMetadata.version}`);
      console.log(`Scanning ${this.config.distDir}...`);
    }

    // Find all JS files
    const jsFiles = await findJsFiles(this.config.distDir);

    if (jsFiles.length === 0) {
      console.warn(`No JavaScript files found in ${this.config.distDir}`);
      return this.createEmptyResults(pluginMetadata);
    }

    if (this.config.showProgress) {
      console.log(`Found ${jsFiles.length} JavaScript files to analyze\n`);
    }

    // Determine which patterns to check
    const patternsToCheck = this.config.patterns || Object.keys(PATTERNS);

    const allResults: AnalysisResult[] = [];
    let filesProcessed = 0;
    let classComponentFilteredCount = 0;

    // Process each file
    for (const jsFile of jsFiles) {
      filesProcessed++;

      if (this.config.showProgress && filesProcessed % 10 === 0) {
        console.log(`Processed ${filesProcessed}/${jsFiles.length} files...`);
      }

      // Check each pattern
      for (const patternName of patternsToCheck) {
        const patternDef = PATTERNS[patternName];
        if (!patternDef) {
          continue;
        }

        // Search for the pattern in the file
        const matches = searchInFile(jsFile, patternDef.pattern);
        if (matches.length === 0) {
          continue;
        }

        // Enrich matches with source map information
        const enrichedMatches = await this.enrichMatchesWithSourceMaps(jsFile, matches);

        // Process each enriched match
        for (const match of enrichedMatches) {
          // Filter by confidence level
          if (!ConfidenceScorer.meetsThreshold(match.reactConfidence, this.config.minConfidence)) {
            continue;
          }

          // Special handling for defaultProps on class components
          if (patternName === 'defaultProps' && match.componentType === 'class') {
            classComponentFilteredCount++;
            continue; // Class components can still use defaultProps in React 19
          }

          // Special case: jsx-runtime should never be filtered out
          // jsx-runtime bundling causes React 19 compatibility issues (__SECRET_INTERNALS renamed)
          const isJsxRuntime =
            match.packageName === 'react' &&
            (match.sourceMapFile.includes('jsx-runtime') || match.sourceMapFile.includes('jsx-dev-runtime'));

          // Check if this is an external dependency (skip if not including externals)
          // Exception: jsx-runtime is always reported even though react is external
          if (
            !this.config.includeExternals &&
            !isJsxRuntime &&
            match.isDependency === 'Yes' &&
            match.packageName !== 'N/A'
          ) {
            if (this.externalsDetector.isExternal(match.packageName)) {
              continue; // Skip external dependencies
            }
          }

          // Determine issue location type
          const locationType: IssueLocationType =
            match.isDependency === 'Yes' ? 'dependency' : match.isDependency === 'No' ? 'source' : 'unknown';

          // Find root dependency for bundled dependencies
          let rootDependency: string | null = null;
          if (locationType === 'dependency' && match.packageName !== 'N/A') {
            rootDependency = this.dependencyResolver.findRootDependency(match.packageName);
          }

          // Create analysis result
          const result: AnalysisResult = {
            patternName,
            pattern: patternDef,
            plugin: pluginMetadata,
            file: shortenPath(jsFile, this.config.pluginRoot),
            line: match.line,
            column: match.column,
            matched: match.matched,
            context: match.context,
            sourceMapFile: match.sourceMapFile,
            originalLine: match.originalLine,
            locationType,
            packageName: match.packageName !== 'N/A' ? match.packageName : null,
            rootDependency,
            sourceContent: match.sourceContent,
            reactConfidence: match.reactConfidence,
            reactReasons: match.reactReasons.split(', ').filter(Boolean),
            componentType: match.componentType,
          };

          allResults.push(result);
        }
      }
    }

    if (this.config.showProgress && classComponentFilteredCount > 0) {
      console.log(
        `\nFiltered out ${classComponentFilteredCount} defaultProps on class components (not a breaking change)`
      );
    }

    // Group results by source vs dependency
    const sourceIssues = allResults.filter((r) => r.locationType === 'source');
    const dependencyIssues = allResults.filter((r) => r.locationType === 'dependency');

    // Build summary
    const affectedDependencies = [
      ...new Set(dependencyIssues.map((r) => r.packageName).filter((name): name is string => name !== null)),
    ];

    const patternCounts: Record<string, number> = {};
    for (const result of allResults) {
      patternCounts[result.patternName] = (patternCounts[result.patternName] || 0) + 1;
    }

    // Check for jsx-runtime bundling context
    const jsxRuntimeContext = await this.detectJsxRuntimeContext(jsFiles, allResults);

    return {
      plugin: pluginMetadata,
      sourceIssues,
      dependencyIssues,
      summary: {
        totalIssues: allResults.length,
        sourceIssuesCount: sourceIssues.length,
        dependencyIssuesCount: dependencyIssues.length,
        affectedDependencies,
        patternCounts,
      },
      jsxRuntimeContext,
    };
  }

  /**
   * Detect jsx-runtime bundling context
   * This provides actionable information when __SECRET_INTERNALS issues are found
   */
  private async detectJsxRuntimeContext(
    jsFiles: string[],
    results: AnalysisResult[]
  ): Promise<JsxRuntimeContext | undefined> {
    // Only check if we have __SECRET_INTERNALS issues
    const hasSecretInternalsIssue = results.some((r) => r.patternName === '__SECRET_INTERNALS');
    if (!hasSecretInternalsIssue) {
      return undefined;
    }

    // Check if jsx-runtime is actually bundled
    const isJsxRuntimeBundled = results.some(
      (r) =>
        r.patternName === '__SECRET_INTERNALS' &&
        (r.sourceMapFile.includes('jsx-runtime') || r.sourceMapFile.includes('jsx-dev-runtime'))
    );

    if (!isJsxRuntimeBundled) {
      return undefined;
    }

    // Find which packages import jsx-runtime
    let jsxRuntimeImporters: string[] = [];

    // Check the first JS file's source map for jsx-runtime importers
    for (const jsFile of jsFiles) {
      const mapPath = jsFile + '.map';
      if (fileExists(mapPath)) {
        const parser = new SourceMapParser(mapPath);
        await parser.initialize();
        jsxRuntimeImporters = parser.findJsxRuntimeImporters();
        parser.destroy();

        if (jsxRuntimeImporters.length > 0) {
          break; // Found importers, no need to check more files
        }
      }
    }

    // Check build configuration
    const jsxConfigDetector = new JsxConfigDetector(this.config.pluginRoot);
    const buildConfig = jsxConfigDetector.detectAutomaticJsxConfig();
    const fixInstructions = jsxConfigDetector.generateFixInstructions(buildConfig.configType);

    return {
      isJsxRuntimeBundled: true,
      jsxRuntimeImporters,
      buildConfig,
      fixInstructions,
    };
  }

  /**
   * Enrich matches with source map information
   */
  private async enrichMatchesWithSourceMaps(jsFile: string, matches: Match[]): Promise<EnrichedMatch[]> {
    const mapPath = jsFile + '.map';

    // No source map available
    if (!fileExists(mapPath)) {
      return matches.map((match) => ({
        ...match,
        sourceMapFile: 'N/A',
        originalLine: 'N/A',
        isDependency: 'Unknown',
        packageName: 'N/A',
        sourceContent: null,
        hasSourceContent: false,
        reactConfidence: 'unknown',
        reactReasons: '',
        componentType: 'unknown',
      }));
    }

    const parser = new SourceMapParser(mapPath);
    await parser.initialize();

    const enrichedMatches: EnrichedMatch[] = [];

    for (const match of matches) {
      try {
        const sourceInfo = await parser.findOriginalSource(match.line, match.column);

        if (sourceInfo && sourceInfo.source) {
          // Get source content
          const sourceContent = sourceInfo.isDependency
            ? null
            : parser.getSourceContent(sourceInfo.source, sourceInfo.line || 0);

          // Get full source for analysis
          const fullSource = parser.getFullSourceContent(sourceInfo.source);

          // Analyze React confidence
          const reactAnalysis = ConfidenceScorer.analyze(fullSource, sourceInfo.source);

          // Detect component type
          const componentType = ComponentDetector.detect(fullSource, match.context);

          enrichedMatches.push({
            ...match,
            sourceMapFile: sourceInfo.source,
            originalLine: sourceInfo.line || 'N/A',
            isDependency: sourceInfo.isDependency ? 'Yes' : 'No',
            packageName: sourceInfo.packageName || 'N/A',
            sourceContent,
            hasSourceContent: fullSource !== null,
            reactConfidence: reactAnalysis.confidence,
            reactReasons: reactAnalysis.reasons.join(', '),
            componentType,
          });
        } else {
          // No mapping found
          enrichedMatches.push({
            ...match,
            sourceMapFile: 'Unknown',
            originalLine: 'N/A',
            isDependency: 'Unknown',
            packageName: 'N/A',
            sourceContent: null,
            hasSourceContent: parser.hasSourceContent(),
            reactConfidence: 'unknown',
            reactReasons: '',
            componentType: 'unknown',
          });
        }
      } catch (error) {
        console.error(`Error processing match at ${jsFile}:${match.line}:${match.column}:`, (error as Error).message);

        enrichedMatches.push({
          ...match,
          sourceMapFile: 'Error',
          originalLine: 'N/A',
          isDependency: 'Unknown',
          packageName: 'N/A',
          sourceContent: null,
          hasSourceContent: false,
          reactConfidence: 'unknown',
          reactReasons: '',
          componentType: 'unknown',
        });
      }
    }

    // Clean up
    parser.destroy();

    return enrichedMatches;
  }

  /**
   * Create empty results structure
   */
  private createEmptyResults(pluginMetadata: any): PluginAnalysisResults {
    return {
      plugin: pluginMetadata,
      sourceIssues: [],
      dependencyIssues: [],
      summary: {
        totalIssues: 0,
        sourceIssuesCount: 0,
        dependencyIssuesCount: 0,
        affectedDependencies: [],
        patternCounts: {},
      },
    };
  }
}
