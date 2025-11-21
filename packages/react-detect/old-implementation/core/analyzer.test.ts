import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Analyzer } from './analyzer.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { AnalysisConfig } from '../types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Analyzer', () => {
  const testDir = path.join(__dirname, '__test-fixtures__', 'analyzer');
  const distDir = path.join(testDir, 'dist');

  // Suppress console output during tests
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Create test directories
    fs.mkdirSync(distDir, { recursive: true });
    fs.mkdirSync(path.join(testDir, 'src'), { recursive: true });

    // Create a minimal plugin.json (must be in src directory)
    fs.writeFileSync(
      path.join(testDir, 'src', 'plugin.json'),
      JSON.stringify({
        id: 'test-plugin',
        type: 'panel',
        name: 'Test Plugin',
        version: '1.0.0',
      })
    );

    // Create a minimal package.json
    fs.writeFileSync(
      path.join(testDir, 'package.json'),
      JSON.stringify({
        name: 'test-plugin',
        version: '1.0.0',
        dependencies: {
          react: '^18.0.0',
          'react-select': '^5.0.0',
        },
      })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  describe('analyze', () => {
    it('should return empty results when no JS files found', async () => {
      const config: AnalysisConfig = {
        distDir,
        pluginRoot: testDir,
        patterns: null,
        minConfidence: 'none',
        includeExternals: false,
        showProgress: false,
      };

      const analyzer = new Analyzer(config);
      const results = await analyzer.analyze();

      expect(results.sourceIssues).toEqual([]);
      expect(results.dependencyIssues).toEqual([]);
      expect(results.summary.totalIssues).toBe(0);
    });

    it('should detect patterns in source files without source maps', async () => {
      // Create a JS file with a React 19 breaking change
      const jsContent = `
        function MyComponent(props) {
          return <MyOtherComponent />;
        }
        MyComponent.defaultProps={ value: 'test' };
      `;

      fs.writeFileSync(path.join(distDir, 'module.js'), jsContent);

      const config: AnalysisConfig = {
        distDir,
        pluginRoot: testDir,
        patterns: ['defaultProps'],
        minConfidence: 'unknown', // No source map means 'unknown' confidence
        includeExternals: false,
        showProgress: false,
      };

      const analyzer = new Analyzer(config);
      const results = await analyzer.analyze();

      expect(results.summary.totalIssues).toBeGreaterThan(0);
      expect(results.summary.patternCounts.defaultProps).toBe(1);
    });

    it('should filter defaultProps on class components', async () => {
      // Create a JS file with defaultProps on a class component
      const jsContent = `
        class MyComponent extends React.Component {
          render() {
            return <View />;
          }
        }
        MyComponent.defaultProps={ value: 'test' };
      `;

      fs.writeFileSync(path.join(distDir, 'module.js'), jsContent);

      const config: AnalysisConfig = {
        distDir,
        pluginRoot: testDir,
        patterns: ['defaultProps'],
        minConfidence: 'none',
        includeExternals: false,
        showProgress: false,
      };

      const analyzer = new Analyzer(config);
      const results = await analyzer.analyze();

      // defaultProps on class components should be filtered out
      expect(results.summary.patternCounts.defaultProps).toBeUndefined();
    });

    it('should filter results by confidence level', async () => {
      // Create a JS file with a pattern but no React indicators
      const jsContent = `
        const obj = {
          defaultProps: { value: 'test' }
        };
      `;

      fs.writeFileSync(path.join(distDir, 'module.js'), jsContent);

      const config: AnalysisConfig = {
        distDir,
        pluginRoot: testDir,
        patterns: ['defaultProps'],
        minConfidence: 'medium',
        includeExternals: false,
        showProgress: false,
      };

      const analyzer = new Analyzer(config);
      const results = await analyzer.analyze();

      // Should be filtered out due to low confidence
      expect(results.summary.totalIssues).toBe(0);
    });

    it('should separate source and dependency issues', async () => {
      // Create a source map that indicates dependency code
      const jsContent = `MyComponent.defaultProps={ value: 'test' };`;
      const sourceMap = {
        version: 3,
        sources: ['node_modules/react-select/dist/index.js'],
        sourcesContent: [
          `function MyComponent() { return <View />; }\nMyComponent.defaultProps={ value: 'test' };`,
        ],
        names: [],
        mappings: 'AAAA',
      };

      fs.writeFileSync(path.join(distDir, 'module.js'), jsContent);
      fs.writeFileSync(path.join(distDir, 'module.js.map'), JSON.stringify(sourceMap));

      const config: AnalysisConfig = {
        distDir,
        pluginRoot: testDir,
        patterns: ['defaultProps'],
        minConfidence: 'none',
        includeExternals: true,
        showProgress: false,
      };

      const analyzer = new Analyzer(config);
      const results = await analyzer.analyze();

      expect(results.dependencyIssues.length).toBeGreaterThan(0);
      expect(results.sourceIssues.length).toBe(0);
    });

    it('should filter external dependencies when includeExternals is false', async () => {
      // Create a source map pointing to react (an external)
      const jsContent = `MyComponent.defaultProps={ value: 'test' };`;
      const sourceMap = {
        version: 3,
        sources: ['node_modules/react/index.js'],
        sourcesContent: [
          `function MyComponent() { return <View />; }\nMyComponent.defaultProps={ value: 'test' };`,
        ],
        names: [],
        mappings: 'AAAA',
      };

      fs.writeFileSync(path.join(distDir, 'module.js'), jsContent);
      fs.writeFileSync(path.join(distDir, 'module.js.map'), JSON.stringify(sourceMap));

      const config: AnalysisConfig = {
        distDir,
        pluginRoot: testDir,
        patterns: ['defaultProps'],
        minConfidence: 'none',
        includeExternals: false,
        showProgress: false,
      };

      const analyzer = new Analyzer(config);
      const results = await analyzer.analyze();

      // Should be filtered because react is external
      expect(results.summary.totalIssues).toBe(0);
    });

    it('should NOT filter jsx-runtime even though react is external', async () => {
      // Create a source map pointing to jsx-runtime
      const jsContent = `__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED`;
      const sourceMap = {
        version: 3,
        sources: ['node_modules/react/jsx-runtime.js'],
        sourcesContent: [`export const __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = {};`],
        names: [],
        mappings: 'AAAA',
      };

      fs.writeFileSync(path.join(distDir, 'module.js'), jsContent);
      fs.writeFileSync(path.join(distDir, 'module.js.map'), JSON.stringify(sourceMap));

      const config: AnalysisConfig = {
        distDir,
        pluginRoot: testDir,
        patterns: ['__SECRET_INTERNALS'],
        minConfidence: 'none',
        includeExternals: false,
        showProgress: false,
      };

      const analyzer = new Analyzer(config);
      const results = await analyzer.analyze();

      // jsx-runtime should NOT be filtered even though react is external
      expect(results.summary.totalIssues).toBeGreaterThan(0);
      expect(results.summary.patternCounts.__SECRET_INTERNALS).toBe(1);
    });

    it('should detect jsx-runtime context when __SECRET_INTERNALS is found', async () => {
      // Create a source map pointing to jsx-runtime
      const jsContent = `__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED`;
      const sourceMap = {
        version: 3,
        sources: [
          'node_modules/react/jsx-runtime.js',
          'node_modules/@floating-ui/react/dist/index.js',
        ],
        sourcesContent: [
          `export const __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = {};`,
          `import { jsx } from 'react/jsx-runtime';\nexport function Component() {}`,
        ],
        names: [],
        mappings: 'AAAA',
      };

      fs.writeFileSync(path.join(distDir, 'module.js'), jsContent);
      fs.writeFileSync(path.join(distDir, 'module.js.map'), JSON.stringify(sourceMap));

      const config: AnalysisConfig = {
        distDir,
        pluginRoot: testDir,
        patterns: ['__SECRET_INTERNALS'],
        minConfidence: 'none',
        includeExternals: false,
        showProgress: false,
      };

      const analyzer = new Analyzer(config);
      const results = await analyzer.analyze();

      expect(results.jsxRuntimeContext).toBeDefined();
      expect(results.jsxRuntimeContext?.isJsxRuntimeBundled).toBe(true);
      expect(results.jsxRuntimeContext?.jsxRuntimeImporters).toContain('@floating-ui/react');
    });

    it('should track pattern counts correctly', async () => {
      // Create a JS file with multiple patterns
      const jsContent = `
        MyComponent.propTypes={};
        MyComponent.defaultProps={};
        findDOMNode(component);
      `;

      fs.writeFileSync(path.join(distDir, 'module.js'), jsContent);

      const config: AnalysisConfig = {
        distDir,
        pluginRoot: testDir,
        patterns: ['propTypes', 'defaultProps', 'findDOMNode'],
        minConfidence: 'unknown', // No source map means 'unknown' confidence
        includeExternals: false,
        showProgress: false,
      };

      const analyzer = new Analyzer(config);
      const results = await analyzer.analyze();

      expect(results.summary.totalIssues).toBe(3);
      expect(results.summary.patternCounts.propTypes).toBe(1);
      expect(results.summary.patternCounts.defaultProps).toBe(1);
      expect(results.summary.patternCounts.findDOMNode).toBe(1);
    });

    it('should identify affected dependencies', async () => {
      // Create source maps pointing to different dependencies
      const jsContent = `Component.defaultProps={}`;
      const sourceMap = {
        version: 3,
        sources: ['node_modules/react-select/dist/index.js'],
        sourcesContent: [`Component.defaultProps={};`],
        names: [],
        mappings: 'AAAA',
      };

      fs.writeFileSync(path.join(distDir, 'module.js'), jsContent);
      fs.writeFileSync(path.join(distDir, 'module.js.map'), JSON.stringify(sourceMap));

      const config: AnalysisConfig = {
        distDir,
        pluginRoot: testDir,
        patterns: ['defaultProps'],
        minConfidence: 'none',
        includeExternals: true,
        showProgress: false,
      };

      const analyzer = new Analyzer(config);
      const results = await analyzer.analyze();

      expect(results.summary.affectedDependencies).toContain('react-select');
      expect(results.dependencyIssues.length).toBeGreaterThan(0);
    });

    it('should handle files with missing source map gracefully', async () => {
      const jsContent = `
        function MyComponent(props) {
          return <MyOtherComponent />;
        }
        MyComponent.defaultProps={ value: 'test' };
      `;

      fs.writeFileSync(path.join(distDir, 'module.js'), jsContent);
      // No source map file created

      const config: AnalysisConfig = {
        distDir,
        pluginRoot: testDir,
        patterns: ['defaultProps'],
        minConfidence: 'unknown', // No source map means 'unknown' confidence
        includeExternals: false,
        showProgress: false,
      };

      const analyzer = new Analyzer(config);
      const results = await analyzer.analyze();

      // Should still detect the pattern
      expect(results.summary.totalIssues).toBeGreaterThan(0);
      expect(results.summary.patternCounts.defaultProps).toBe(1);
      // Without source map, location type will be 'unknown', so issues won't be in sourceIssues or dependencyIssues
      expect(results.sourceIssues.length).toBe(0);
      expect(results.dependencyIssues.length).toBe(0);
    });
  });
});
