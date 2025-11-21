/**
 * Type definitions for @grafana/react-detect
 */

/**
 * Severity level of a React 19 breaking change
 */
export type Severity = 'removed' | 'renamed' | 'deprecated';

/**
 * Confidence level that code is actually React-related
 */
export type Confidence = 'high' | 'medium' | 'low' | 'none' | 'unknown';

/**
 * Component type classification
 */
export type ComponentType = 'class' | 'function' | 'unknown';

/**
 * Issue location type
 */
export type IssueLocationType = 'source' | 'dependency' | 'unknown';

/**
 * Output format for reports
 */
export type OutputFormat = 'console' | 'json' | 'csv';

/**
 * Definition of a React 19 breaking change pattern
 */
export interface PatternDefinition {
  /** Regex pattern to search for */
  pattern: string;
  /** Severity of the breaking change */
  severity: Severity;
  /** Human-readable description */
  description: string;
  /** Optional: Whether this only applies to function components */
  functionComponentOnly?: boolean;
  /** Optional: Link to documentation/upgrade guide */
  link?: string;
}

/**
 * Collection of all breaking change patterns
 */
export interface Patterns {
  [patternName: string]: PatternDefinition;
}

/**
 * A single match found in a file
 */
export interface Match {
  /** Line number in the file (1-indexed) */
  line: number;
  /** Column number in the file (0-indexed) */
  column: number;
  /** The actual matched text */
  matched: string;
  /** Surrounding context (50 chars before/after) */
  context: string;
}

/**
 * Original source location resolved from source map
 */
export interface SourceLocation {
  /** Original source file path */
  source: string;
  /** Line number in original source (1-indexed) */
  line: number | null;
  /** Column number in original source (0-indexed) */
  column: number | null;
  /** Symbol name at this location (if available) */
  name: string | null;
  /** Whether this is from node_modules */
  isDependency: boolean;
  /** Package name if this is a dependency */
  packageName: string | null;
}

/**
 * Result of React code confidence analysis
 */
export interface ReactConfidenceResult {
  /** Whether this is likely React code */
  isReact: boolean | null;
  /** Confidence level */
  confidence: Confidence;
  /** Reasons for the confidence level */
  reasons: string[];
  /** Confidence score (numeric) */
  score: number;
}

/**
 * An enriched match with source map information
 */
export interface EnrichedMatch extends Match {
  /** Original source file from source map */
  sourceMapFile: string;
  /** Original line number */
  originalLine: number | string;
  /** Whether this is from a dependency */
  isDependency: 'Yes' | 'No' | 'Unknown';
  /** Package name if from dependency */
  packageName: string;
  /** Original source code content */
  sourceContent: string | null;
  /** Whether source content is available */
  hasSourceContent: boolean;
  /** React confidence level */
  reactConfidence: Confidence;
  /** Reasons for confidence level */
  reactReasons: string;
  /** Component type (class vs function) */
  componentType: ComponentType;
}

/**
 * Plugin metadata from plugin.json
 */
export interface PluginMetadata {
  /** Plugin ID */
  id: string;
  /** Plugin type (app, panel, datasource) */
  type: string;
  /** Plugin version */
  version: string;
  /** Plugin display name */
  name: string;
}

/**
 * Analysis result for a single issue
 */
export interface AnalysisResult {
  /** Pattern name that was matched */
  patternName: string;
  /** Pattern definition */
  pattern: PatternDefinition;
  /** Plugin metadata */
  plugin: PluginMetadata;
  /** File path (relative to plugin root) */
  file: string;
  /** Line number in bundled file */
  line: number;
  /** Column number in bundled file */
  column: number;
  /** Matched text */
  matched: string;
  /** Context around the match */
  context: string;
  /** Original source file */
  sourceMapFile: string;
  /** Original line number */
  originalLine: number | string;
  /** Issue location type */
  locationType: IssueLocationType;
  /** Package name (for dependencies) */
  packageName: string | null;
  /** Root dependency from package.json (for transitive deps) */
  rootDependency: string | null;
  /** Source code content */
  sourceContent: string | null;
  /** React confidence level */
  reactConfidence: Confidence;
  /** Reasons for confidence level */
  reactReasons: string[];
  /** Component type */
  componentType: ComponentType;
}

/**
 * JSX runtime configuration context
 */
export interface JsxRuntimeContext {
  /** Whether jsx-runtime is bundled */
  isJsxRuntimeBundled: boolean;
  /** Packages that import jsx-runtime */
  jsxRuntimeImporters: string[];
  /** Build configuration details */
  buildConfig: {
    hasAutomaticJsx: boolean;
    configFile: string | null;
    configType: 'swc' | 'tsconfig' | null;
    snippet: string | null;
  };
  /** Fix instructions */
  fixInstructions: string[];
}

/**
 * Aggregated results grouped by plugin
 */
export interface PluginAnalysisResults {
  /** Plugin metadata */
  plugin: PluginMetadata;
  /** Issues in plugin source code */
  sourceIssues: AnalysisResult[];
  /** Issues in bundled dependencies */
  dependencyIssues: AnalysisResult[];
  /** Summary statistics */
  summary: {
    totalIssues: number;
    sourceIssuesCount: number;
    dependencyIssuesCount: number;
    affectedDependencies: string[];
    patternCounts: Record<string, number>;
  };
  /** JSX runtime bundling context (if applicable) */
  jsxRuntimeContext?: JsxRuntimeContext;
}

/**
 * Dependency information from package.json
 */
export interface DependencyInfo {
  /** Package name */
  name: string;
  /** Version string from package.json */
  version: string;
  /** Whether this is a direct dependency */
  isDirect: boolean;
  /** Parent dependency (for transitive deps) */
  parent?: string;
}

/**
 * External dependency configuration
 */
export interface ExternalConfig {
  /** String literals that are external */
  literals: string[];
  /** Regex patterns that match externals */
  patterns: RegExp[];
  /** Custom function for checking externals */
  hasCustomFunction: boolean;
}

/**
 * CLI command options
 */
export interface DetectOptions {
  /** Path to analyze (defaults to ./dist) */
  path?: string;
  /** Specific pattern to check */
  pattern?: string;
  /** Output format */
  format?: OutputFormat;
  /** Minimum confidence level */
  confidence?: Confidence;
  /** Only show source issues */
  sourceOnly?: boolean;
  /** Only show dependency issues */
  depsOnly?: boolean;
  /** Include externalized dependencies */
  includeExternals?: boolean;
  /** Output file path */
  output?: string;
  /** Quiet mode (minimal output) */
  quiet?: boolean;
}

/**
 * Analysis configuration
 */
export interface AnalysisConfig {
  /** Directory to analyze */
  distDir: string;
  /** Plugin root directory */
  pluginRoot: string;
  /** Patterns to check (null = all) */
  patterns: string[] | null;
  /** Minimum confidence level */
  minConfidence: Confidence;
  /** Whether to include externals */
  includeExternals: boolean;
  /** Whether to show progress */
  showProgress: boolean;
}
