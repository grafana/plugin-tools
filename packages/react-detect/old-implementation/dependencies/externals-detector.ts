import fs from 'fs';
import path from 'path';
import type { ExternalConfig } from '../types.js';

/**
 * Detects and manages external dependencies that are provided by Grafana
 * These dependencies won't be bundled and should be excluded from analysis
 */
export class ExternalsDetector {
  private config: ExternalConfig;

  /**
   * Default externals that are always provided by Grafana
   * Based on .config/bundler/externals.ts template
   */
  private static readonly DEFAULT_EXTERNALS: ExternalConfig = {
    literals: [
      'lodash',
      'jquery',
      'moment',
      'slate',
      'emotion',
      '@emotion/react',
      '@emotion/css',
      'prismjs',
      'slate-plain-serializer',
      '@grafana/slate-react',
      'react',
      'react-dom',
      'react-redux',
      'redux',
      'rxjs',
      'i18next',
      'react-router',
      'react-router-dom',
      'd3',
      'angular',
    ],
    patterns: [
      /^@grafana\/runtime/i,
      /^@grafana\/data/i,
      /^@grafana\/ui/i, // May be bundled if bundleGrafanaUI: true
    ],
    hasCustomFunction: true, // For legacy 'grafana/' prefix handling
  };

  constructor(pluginRoot: string) {
    this.config = this.loadExternalsConfig(pluginRoot);
  }

  /**
   * Load externals configuration from the plugin's build config
   * Falls back to default config if not found
   *
   * @param pluginRoot Root directory of the plugin
   * @returns External configuration
   */
  private loadExternalsConfig(pluginRoot: string): ExternalConfig {
    const externalsPath = path.join(pluginRoot, '.config', 'bundler', 'externals.ts');

    // If custom externals file doesn't exist, use defaults
    if (!fs.existsSync(externalsPath)) {
      return ExternalsDetector.DEFAULT_EXTERNALS;
    }

    // For now, use defaults
    // TODO: Parse the actual externals.ts file if needed for customization
    // This would require:
    // 1. Reading the TypeScript file
    // 2. Parsing the exports array
    // 3. Handling strings, regexes, and functions
    // For MVP, defaults should cover 99% of cases

    return ExternalsDetector.DEFAULT_EXTERNALS;
  }

  /**
   * Check if a package name is externalized (provided by Grafana)
   *
   * @param packageName Package name to check (e.g., 'react', '@grafana/ui')
   * @returns True if the package is external
   */
  isExternal(packageName: string): boolean {
    // Check literal matches
    if (this.config.literals.includes(packageName)) {
      return true;
    }

    // Check regex patterns
    for (const pattern of this.config.patterns) {
      if (pattern.test(packageName)) {
        return true;
      }
    }

    // Check for legacy grafana/ prefix
    if (this.config.hasCustomFunction && packageName.startsWith('grafana/')) {
      return true;
    }

    return false;
  }

  /**
   * Filter a list of package names to only include bundled (non-external) packages
   *
   * @param packageNames Array of package names
   * @returns Array of bundled package names
   */
  filterBundled(packageNames: string[]): string[] {
    return packageNames.filter((pkg) => !this.isExternal(pkg));
  }

  /**
   * Get all external package names (for reporting)
   */
  getExternals(): string[] {
    return [...this.config.literals];
  }

  /**
   * Get external patterns (for debugging/reporting)
   */
  getExternalPatterns(): RegExp[] {
    return [...this.config.patterns];
  }
}
