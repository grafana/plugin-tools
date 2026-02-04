import { AnalyzedMatch } from './types/processors.js';
import { PluginAnalysisResults, AnalysisResult, DependencyIssue } from './types/reporters.js';
import { getPattern } from './patterns/definitions.js';
import { getPluginJson, hasExternalisedJsxRuntime } from './utils/plugin.js';
import { DependencyContext, isExternal } from './utils/dependencies.js';
import path from 'node:path';

export interface AnalysisOptions {
  skipBuildTooling: boolean;
  skipDependencies: boolean;
}

export function generateAnalysisResults(
  matches: AnalyzedMatch[],
  pluginRoot: string,
  depContext: DependencyContext | null,
  options: AnalysisOptions = { skipBuildTooling: false, skipDependencies: false }
): PluginAnalysisResults {
  const filtered = filterMatches(matches, options.skipBuildTooling);
  const pluginJson = getPluginJson(pluginRoot);

  // Filter out externalized dependencies
  const filteredWithoutExternals = filtered.filter((match) => shouldIncludeDependencyMatch(match, depContext));

  const sourceMatches = filteredWithoutExternals.filter((m) => m.type === 'source');
  const dependencyMatches = filteredWithoutExternals.filter((m) => m.type === 'dependency');

  const criticalMatches = filteredWithoutExternals.filter((m) => {
    const pattern = getPattern(m.pattern);
    return pattern?.impactLevel === 'critical';
  });

  const warningMatches = filteredWithoutExternals.filter((m) => {
    const pattern = getPattern(m.pattern);
    return pattern?.impactLevel === 'warning';
  });

  const critical = criticalMatches.map((m) => generateResult(m));
  const warnings = warningMatches.map((m) => generateResult(m));
  const dependencies = buildDependencyIssues(dependencyMatches, depContext);

  const totalIssues = filteredWithoutExternals.length;
  const affectedDeps = new Set(
    dependencies.map((m) => m.packageName).filter((name): name is string => name !== undefined)
  );

  return {
    plugin: {
      id: pluginJson?.id || '',
      name: pluginJson?.name || '',
      version: pluginJson?.info.version || '',
      type: pluginJson?.type || '',
    },
    summary: {
      totalIssues,
      critical: critical.length,
      warnings: warnings.length,
      sourceIssuesCount: sourceMatches.length,
      dependencyIssuesCount: dependencies.length,
      status: totalIssues > 0 ? 'action_required' : 'no_action_required',
      affectedDependencies: Array.from(affectedDeps),
      analyzedBuildTooling: !options.skipBuildTooling,
      analyzedDependencies: !options.skipDependencies,
    },
    issues: {
      critical,
      warnings,
      dependencies,
    },
  };
}

function shouldIncludeDependencyMatch(match: AnalyzedMatch, _depContext: DependencyContext | null): boolean {
  if (match.type === 'dependency' && match.rootDependency && isExternal(match.rootDependency)) {
    return false;
  }

  return true;
}

function filterMatches(matches: AnalyzedMatch[], skipBuildTooling: boolean): AnalyzedMatch[] {
  // Only check webpack config if NOT skipping build tooling
  const externalisedJsxRuntime = skipBuildTooling ? false : hasExternalisedJsxRuntime();
  const filtered = matches.filter((match) => {
    // TODO: add mode for strict / loose filtering
    if (match.type === 'source' && (match.confidence === 'none' || match.confidence === 'unknown')) {
      return false;
    }

    if (match.type === 'source') {
      const pattern = getPattern(match.pattern);
      // defaultProps are allowed on class components in React 19.
      if (pattern?.functionComponentOnly && match.componentType !== 'function') {
        return false;
      }
    }

    // Don't report react internals from React's JSX transform. We only care about other dependencies
    // relying on React internals.
    if (
      match.type === 'dependency' &&
      match.pattern === '__SECRET_INTERNALS' &&
      match.packageName === 'react' &&
      (match.sourceFile.includes('jsx-runtime') || match.sourceFile.includes('jsx-dev-runtime'))
    ) {
      return false;
    }

    // JSX runtime imports are only an issue if they are not externalised in webpack config.
    if (
      match.type === 'dependency' &&
      (match.pattern === 'jsxRuntimeImport' || match.pattern === '__SECRET_INTERNALS')
    ) {
      return !externalisedJsxRuntime;
    }

    return true;
  });

  return filtered;
}

function generateResult(match: AnalyzedMatch): AnalysisResult {
  const pattern = getPattern(match.pattern);

  if (!pattern) {
    throw new Error(`Pattern not found: ${match.pattern}`);
  }

  const cleanFilePath = cleanSourceFilePath(match.sourceFile);

  const result: AnalysisResult = {
    pattern: match.pattern,
    severity: pattern.severity,
    impactLevel: pattern.impactLevel,
    location: {
      type: match.type,
      file: path.join(process.cwd(), cleanFilePath),
      line: match.sourceLine,
      column: match.sourceColumn,
    },
    problem: pattern.description,
    fix: {
      description: pattern.fix?.description || '',
      before: pattern.fix?.before || '',
      after: pattern.fix?.after || '',
    },
    link: pattern.link || '',
  };

  // Add dependency-specific fields
  if (match.type === 'dependency') {
    result.packageName = match.packageName;
    result.rootDependency = match.rootDependency;
  }

  return result;
}

/**
 * Build DependencyIssue objects grouped by package
 */
function buildDependencyIssues(
  dependencyMatches: AnalyzedMatch[],
  depContext: DependencyContext | null
): DependencyIssue[] {
  // Group by package
  const byPackage = new Map<string, AnalyzedMatch[]>();
  for (const match of dependencyMatches) {
    if (match.type === 'dependency' && match.packageName) {
      const existing = byPackage.get(match.packageName) || [];
      existing.push(match);
      byPackage.set(match.packageName, existing);
    }
  }

  // Build DependencyIssue for each package
  const issues: DependencyIssue[] = [];
  for (const [packageName, matches] of byPackage) {
    const rootDep = matches[0].rootDependency || packageName;
    // Handle null depContext gracefully with optional chaining
    const version = depContext?.getVersion(packageName) || null;

    issues.push({
      packageName,
      version: version || 'unknown',
      rootDependency: rootDep,
      issues: matches.map((m) => generateResult(m)),
    });
  }

  return issues;
}

function cleanSourceFilePath(filePath: string): string {
  let cleanPath = filePath;
  if (filePath.includes('node_modules')) {
    cleanPath = filePath.replace(/webpack:\/\/[^/]+\/node_modules\//, './node_modules/');
  } else {
    cleanPath = filePath.replace(/webpack:\/\/[^/]+/, './src/');
  }

  // find paths that include webpack:/ in the middle of the string.
  cleanPath = cleanPath.replace(/(.+)\/webpack:\/(.+)/g, '$1/$2');

  return cleanPath;
}
