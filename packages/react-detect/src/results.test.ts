import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateAnalysisResults, AnalysisOptions } from './results.js';
import { AnalyzedMatch } from './types/processors.js';
import { DependencyContext } from './utils/dependencies.js';

// Mock the plugin utils to avoid needing a real plugin.json file
vi.mock('./utils/plugin.js', () => ({
  getPluginJson: vi.fn(() => ({
    id: 'test-plugin',
    name: 'Test Plugin',
    type: 'app',
    info: {
      version: '1.0.0',
    },
  })),
  hasExternalisedJsxRuntime: vi.fn(() => false),
}));

describe('generateAnalysisResults', () => {
  const createDependencyMatch = (
    packageName: string,
    rootDependency: string,
    pattern = '__SECRET_INTERNALS'
  ): AnalyzedMatch => ({
    pattern,
    type: 'dependency',
    confidence: 'high',
    packageName,
    rootDependency,
    sourceFile: `node_modules/${packageName}/index.js`,
    sourceLine: 1,
    sourceColumn: 0,
    componentType: 'unknown',
    matched: '',
    context: '',
    bundledFilePath: `node_modules/${packageName}/index.js`,
  });

  const pluginRoot = process.cwd();
  const depContext = new DependencyContext();
  const options: AnalysisOptions = {
    skipBuildTooling: true,
    skipDependencies: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('externalized dependency filtering', () => {
    it('should never filter source code matches, only dependencies', () => {
      const sourceMatch: AnalyzedMatch = {
        pattern: 'defaultProps',
        type: 'source',
        confidence: 'high',
        packageName: undefined,
        rootDependency: undefined,
        sourceFile: 'src/components/MyComponent.tsx',
        sourceLine: 10,
        sourceColumn: 5,
        componentType: 'function',
        matched: 'defaultProps',
        context: 'MyComponent.defaultProps = {}',
        bundledFilePath: 'src/components/MyComponent.tsx',
      };
      const matches: AnalyzedMatch[] = [sourceMatch, createDependencyMatch('react', 'react')];
      const results = generateAnalysisResults(matches, pluginRoot, depContext, options);

      expect(results.summary.sourceIssuesCount).toBe(1);
      expect(results.summary.dependencyIssuesCount).toBe(0);
    });

    it('should filter externalized dependencies but not user packages', () => {
      const matches: AnalyzedMatch[] = [
        createDependencyMatch('lodash', 'lodash'), // lodash is externalized by Grafana
        createDependencyMatch('axios', 'axios'),
      ];
      const results = generateAnalysisResults(matches, pluginRoot, depContext, options);

      expect(results.issues.dependencies).toHaveLength(1);
      expect(results.issues.dependencies[0].packageName).toBe('axios');
    });

    it('should filter scoped externalized packages (@grafana/*)', () => {
      const matches: AnalyzedMatch[] = [
        createDependencyMatch('@grafana/data', '@grafana/data'),
        createDependencyMatch('@grafana/ui', '@grafana/ui'),
        createDependencyMatch('@custom/package', '@custom/package'),
      ];
      const results = generateAnalysisResults(matches, pluginRoot, depContext, options);

      expect(results.issues.dependencies).toHaveLength(1);
      expect(results.issues.dependencies[0].packageName).toBe('@custom/package');
    });

    it('should filter subpath imports of externalized packages', () => {
      const matches: AnalyzedMatch[] = [
        createDependencyMatch('@grafana/data/utils', '@grafana/data'),
        createDependencyMatch('@custom/package/utils', '@custom/package'),
      ];
      const results = generateAnalysisResults(matches, pluginRoot, depContext, options);

      expect(results.issues.dependencies).toHaveLength(1);
      expect(results.issues.dependencies[0].packageName).toBe('@custom/package/utils');
    });

    it('should filter transitive dependencies with externalized root', () => {
      // Real-world scenario: prop-types is bundled by react, scheduler by react
      const matches: AnalyzedMatch[] = [
        createDependencyMatch('prop-types', 'react'),
        createDependencyMatch('scheduler', 'react'),
        createDependencyMatch('debug', 'axios'), // Non-externalized root dependency
      ];
      const results = generateAnalysisResults(matches, pluginRoot, depContext, options);

      expect(results.issues.dependencies).toHaveLength(1);
      expect(results.issues.dependencies[0].packageName).toBe('debug');
      expect(results.issues.dependencies[0].rootDependency).toBe('axios');
    });

    it('should filter externalized deps from critical and warnings arrays used by reporters', () => {
      // This tests the actual consumption path - console reporter reads from critical/warnings
      const matches: AnalyzedMatch[] = [
        createDependencyMatch('react', 'react'),
        createDependencyMatch('@grafana/data', '@grafana/data'),
        createDependencyMatch('axios', 'axios'),
      ];
      const results = generateAnalysisResults(matches, pluginRoot, depContext, options);
      // Filter to only critical dep issues
      const reportedDeps = results.issues.critical.filter((i) => i.location.type === 'dependency');
      expect(reportedDeps).toHaveLength(1);
      expect(reportedDeps[0].packageName).toBe('axios');
    });
  });
});
