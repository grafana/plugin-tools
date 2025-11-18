import fs from 'fs';
import { SourceMapConsumer } from 'source-map';
import type { SourceLocation } from '../types.js';

/**
 * Parses source maps to resolve minified/bundled code back to original source locations
 */
export class SourceMapParser {
  private mapPath: string;
  private sourceMap: any = null;
  private consumer: SourceMapConsumer | null = null;

  constructor(mapPath: string) {
    this.mapPath = mapPath;
    this.loadSourceMap();
  }

  /**
   * Load the source map file
   */
  private loadSourceMap(): void {
    try {
      const content = fs.readFileSync(this.mapPath, 'utf8');
      this.sourceMap = JSON.parse(content);
    } catch (error) {
      console.error(`Failed to load source map ${this.mapPath}:`, (error as Error).message);
    }
  }

  /**
   * Initialize the SourceMapConsumer (async operation)
   * Must be called before using findOriginalSource
   */
  async initialize(): Promise<boolean> {
    if (!this.sourceMap) {
      return false;
    }

    try {
      this.consumer = await new SourceMapConsumer(this.sourceMap);
      return true;
    } catch (error) {
      console.error(`Failed to initialize SourceMapConsumer for ${this.mapPath}:`, (error as Error).message);
      return false;
    }
  }

  /**
   * Find original source location for a given line/column in the minified file
   *
   * @param line Line number in minified file (1-indexed)
   * @param column Column number in minified file (0-indexed)
   * @returns Original source location or null if not found
   */
  async findOriginalSource(line: number, column = 0): Promise<SourceLocation | null> {
    if (!this.consumer) {
      await this.initialize();
    }

    if (!this.consumer) {
      return null;
    }

    try {
      const position = this.consumer.originalPositionFor({
        line: line,
        column: column,
      });

      // If we found a valid mapping
      if (position.source) {
        return {
          source: position.source,
          line: position.line,
          column: position.column,
          name: position.name,
          isDependency: this.isDependency(position.source),
          packageName: this.isDependency(position.source) ? this.getPackageName(position.source) : null,
        };
      }

      return null;
    } catch (error) {
      console.error(`Error finding original source at ${line}:${column}:`, (error as Error).message);
      return null;
    }
  }

  /**
   * Determine if a source file is from node_modules (a dependency)
   *
   * @param sourcePath Path from the source map
   * @returns True if this is a dependency
   */
  isDependency(sourcePath: string): boolean {
    return sourcePath.includes('node_modules');
  }

  /**
   * Extract package name from node_modules path
   * Handles regular packages, scoped packages, and pnpm's nested structure
   *
   * Examples:
   * - node_modules/foo/dist/... → foo
   * - node_modules/@scope/foo/dist/... → @scope/foo
   * - node_modules/.pnpm/foo@1.0.0/node_modules/foo/... → foo
   * - node_modules/.pnpm/@scope+foo@1.0.0_dep@2.0.0/node_modules/@scope/foo/... → @scope/foo
   *
   * @param sourcePath Path from the source map
   * @returns Package name or null if not extractable
   */
  getPackageName(sourcePath: string): string | null {
    // Handle pnpm's .pnpm directory structure
    // Pattern: node_modules/.pnpm/<package>@<version>_<hash>/node_modules/<package>
    const pnpmMatch = sourcePath.match(/\.pnpm\/[^/]+\/node_modules\/((?:@[^/]+\/)?[^/]+)/);
    if (pnpmMatch) {
      // Return the actual package name after the nested node_modules
      // This handles: .pnpm/react-select@5.8.0_.../node_modules/react-select
      return pnpmMatch[1];
    }

    // Handle standard node_modules structure
    // Pattern captures:
    // - Regular packages: node_modules/foo → foo
    // - Scoped packages: node_modules/@scope/foo → @scope/foo
    const match = sourcePath.match(/node_modules\/((?:@[^/]+\/)?[^/]+)/);
    return match ? match[1] : null;
  }

  /**
   * Get the source content for a specific source file and line
   *
   * @param source Source file path
   * @param line Line number (1-indexed)
   * @returns Source code content or null if not available
   */
  getSourceContent(source: string, line: number): string | null {
    if (!this.consumer) {
      return null;
    }

    try {
      const content = this.consumer.sourceContentFor(source, true);
      if (content) {
        const lines = content.split('\n');
        if (line > 0 && line <= lines.length) {
          return lines[line - 1].trim();
        }
      }
    } catch (error) {
      // Source content not available
      return null;
    }

    return null;
  }

  /**
   * Get the full source content for a specific source file
   *
   * @param source Source file path
   * @returns Full source code content or null if not available
   */
  getFullSourceContent(source: string): string | null {
    if (!this.consumer) {
      return null;
    }

    try {
      return this.consumer.sourceContentFor(source, true);
    } catch (error) {
      // Source content not available
      return null;
    }
  }

  /**
   * Get all source file paths from the source map
   */
  getSources(): string[] {
    return this.sourceMap?.sources || [];
  }

  /**
   * Check if source content is embedded in the source map
   */
  hasSourceContent(): boolean {
    return this.sourceMap?.sourcesContent && this.sourceMap.sourcesContent.length > 0;
  }

  /**
   * Find which dependencies import react/jsx-runtime
   * This helps identify why jsx-runtime is bundled (React 19 compatibility issue)
   *
   * @returns Array of package names that import jsx-runtime
   */
  findJsxRuntimeImporters(): string[] {
    if (!this.consumer) {
      return [];
    }

    const importers: string[] = [];
    const sources = this.getSources();

    for (const source of sources) {
      // Skip if not from node_modules or if it IS jsx-runtime itself
      if (!source.includes('node_modules') || source.includes('jsx-runtime')) {
        continue;
      }

      // Get source content and check for jsx-runtime imports
      const content = this.getFullSourceContent(source);
      if (content && /from\s+['"]react\/jsx(-dev)?-runtime['"]/.test(content)) {
        const packageName = this.getPackageName(source);
        if (packageName) {
          importers.push(packageName);
        }
      }
    }

    // Return unique list
    return [...new Set(importers)];
  }

  /**
   * Clean up the consumer to free memory
   */
  destroy(): void {
    if (this.consumer) {
      this.consumer.destroy();
      this.consumer = null;
    }
  }
}
