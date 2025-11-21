#!/usr/bin/env node

/**
 * React 19 Breaking Changes Impact Analysis
 *
 * Scans Grafana plugin bundles for React 19 breaking changes and generates
 * detailed reports using source maps to trace back to original source code.
 *
 * node analyze-react-19.js <pattern_name>
 *
 * Available patterns:
 *  - __SECRET_INTERNALS
 *  - defaultProps
 *  - propTypes
 *  - createFactory
 *  - contextTypes
 *  - getChildContext
 *  - ReactDOM.render
 *  - ReactDOM.hydrate
 *  - ReactDOM.unmountComponentAtNode
 *  - ReactDOM.findDOMNode
 *  - findDOMNode
 *  - forwardRef
 *  - Context.Provider
 *  - refs[
 *
 * Example:
 * node analyze-react-19.js defaultProps
 *
 * This will analyze all plugins for the pattern 'defaultProps' and generate a report.
 *
 * The report will be saved to react-19-impact-<pattern>.csv in the current directory.
 * Each plugin will have at most 2 rows:
 *  - One "Dependency" row if issues are found in node_modules packages
 *  - One "Source" row if issues are found in the plugin's own source code
 *
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { SourceMapConsumer } = require('source-map');

// Breaking change patterns to search for
const PATTERNS = {
  __SECRET_INTERNALS: {
    pattern: '__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED',
    severity: 'renamed',
    description: 'React internals object renamed in React 19',
  },
  defaultProps: {
    pattern: '\\.defaultProps=',
    severity: 'removed',
    description: 'defaultProps removed for function components',
  },
  propTypes: {
    pattern: '\\.propTypes=',
    severity: 'removed',
    description: 'PropTypes removed from React package',
  },
  createFactory: {
    pattern: 'createFactory',
    severity: 'removed',
    description: 'React.createFactory removed',
  },
  contextTypes: {
    pattern: 'contextTypes',
    severity: 'removed',
    description: 'Legacy Context contextTypes removed',
  },
  getChildContext: {
    pattern: 'getChildContext',
    severity: 'removed',
    description: 'Legacy Context getChildContext removed',
  },
  'ReactDOM.render': {
    pattern: 'ReactDOM\\.render',
    severity: 'removed',
    description: 'ReactDOM.render removed, use createRoot',
  },
  'ReactDOM.hydrate': {
    pattern: 'ReactDOM\\.hydrate',
    severity: 'removed',
    description: 'ReactDOM.hydrate removed, use hydrateRoot',
  },
  'ReactDOM.unmountComponentAtNode': {
    pattern: 'ReactDOM\\.unmountComponentAtNode',
    severity: 'removed',
    description: 'ReactDOM.unmountComponentAtNode removed',
  },
  'ReactDOM.findDOMNode': {
    pattern: 'ReactDOM\\.findDOMNode',
    severity: 'removed',
    description: 'ReactDOM.findDOMNode removed',
  },
  findDOMNode: {
    pattern: 'findDOMNode',
    severity: 'removed',
    description: 'findDOMNode removed',
  },
  forwardRef: {
    pattern: 'forwardRef',
    severity: 'deprecated',
    description: 'forwardRef deprecated, ref now available as prop',
  },
  'Context.Provider': {
    pattern: '\\.Provider',
    severity: 'deprecated',
    description: 'Context.Provider deprecated, use Context directly',
  },
  'refs[': {
    pattern: 'refs\\[',
    severity: 'removed',
    description: 'String refs removed',
  },
};

class SourceMapParser {
  constructor(mapPath) {
    this.mapPath = mapPath;
    this.sourceMap = null;
    this.consumer = null;
    this.loadSourceMap();
  }

  loadSourceMap() {
    try {
      const content = fs.readFileSync(this.mapPath, 'utf8');
      this.sourceMap = JSON.parse(content);
    } catch (error) {
      console.error(`Failed to load source map ${this.mapPath}:`, error.message);
    }
  }

  /**
   * Initialize the SourceMapConsumer (async)
   */
  async initialize() {
    if (!this.sourceMap) {
      return false;
    }

    try {
      this.consumer = await new SourceMapConsumer(this.sourceMap);
      return true;
    } catch (error) {
      console.error(`Failed to initialize SourceMapConsumer for ${this.mapPath}:`, error.message);
      return false;
    }
  }

  /**
   * Find original source location for a given line/column in the minified file
   * Uses proper source map decoding for accurate mapping
   */
  async findOriginalSource(line, column = 0) {
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

      // No mapping found, return info about all sources
      return {
        sources: this.sourceMap.sources || [],
        sourcesContent: this.sourceMap.sourcesContent,
        hasContent: this.sourceMap.sourcesContent && this.sourceMap.sourcesContent.length > 0,
      };
    } catch (error) {
      console.error(`Error finding original source at ${line}:${column}:`, error.message);
      return null;
    }
  }

  /**
   * Determine if a source file is from node_modules (dependency)
   */
  isDependency(sourcePath) {
    return sourcePath.includes('node_modules');
  }

  /**
   * Extract package name from node_modules path
   */
  getPackageName(sourcePath) {
    const match = sourcePath.match(/node_modules\/(@?[^/]+(?:\/[^/]+)?)/);
    return match ? match[1] : null;
  }

  /**
   * Get the source content for a specific source file and line
   */
  getSourceContent(source, line) {
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
   * Clean up the consumer
   */
  destroy() {
    if (this.consumer) {
      this.consumer.destroy();
    }
  }
}

class PluginAnalyzer {
  constructor(pluginsDir) {
    this.pluginsDir = pluginsDir;
    this.results = {};
  }

  /**
   * Find all .js files in extracted plugin directories
   */
  findJsFiles() {
    console.log('Finding all JS files in extracted plugins...');
    const command = `find "${this.pluginsDir}" -path "*-extracted*" -name "*.js" -type f`;
    const output = execSync(command, {
      encoding: 'utf8',
      maxBuffer: 50 * 1024 * 1024,
    });
    return output.trim().split('\n').filter(Boolean);
  }

  /**
   * Search for a pattern in a file and return matches with context
   */
  searchInFile(filePath, pattern) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      const matches = [];

      lines.forEach((line, lineIndex) => {
        const regex = new RegExp(pattern, 'g');
        let match;

        while ((match = regex.exec(line)) !== null) {
          const column = match.index;
          const contextStart = Math.max(0, column - 50);
          const contextEnd = Math.min(line.length, column + pattern.length + 50);
          const context = line.substring(contextStart, contextEnd);

          matches.push({
            line: lineIndex + 1,
            column: column,
            matched: match[0],
            context: context.trim(),
          });
        }
      });

      return matches;
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error.message);
      return [];
    }
  }

  /**
   * Determine if source code is likely React-related to reduce false positives
   */
  isLikelyReactCode(sourceContent, sourcePath) {
    if (!sourceContent && !sourcePath) {
      return { isReact: null, confidence: 'Unknown', reasons: [] };
    }

    const reasons = [];
    let score = 0;

    // Check for React imports (strong signal)
    if (sourceContent) {
      if (/import\s+.*\s+from\s+['"]react['"]/.test(sourceContent)) {
        reasons.push('React import');
        score += 3;
      }
      if (/require\s*\(\s*['"]react['"]\s*\)/.test(sourceContent)) {
        reasons.push('React require');
        score += 3;
      }

      // Check for React DOM imports
      if (/from\s+['"]react-dom['"]/.test(sourceContent)) {
        reasons.push('ReactDOM import');
        score += 2;
      }

      // Check for JSX syntax (strong signal)
      if (/<[A-Z][a-zA-Z0-9]*[\s\/>]/.test(sourceContent)) {
        reasons.push('JSX syntax');
        score += 2;
      }

      // Check for React hooks (strong signal)
      if (/\b(useState|useEffect|useContext|useReducer|useCallback|useMemo|useRef)\s*\(/.test(sourceContent)) {
        reasons.push('React hooks');
        score += 3;
      }

      // Check for React component patterns
      if (/React\.Component|React\.PureComponent|React\.memo/.test(sourceContent)) {
        reasons.push('React component class');
        score += 3;
      }
    }

    // Check if it's from react package itself (very strong signal)
    if (sourcePath) {
      if (sourcePath.includes('node_modules/react/') || sourcePath.includes('node_modules/react-dom/')) {
        reasons.push('React package');
        score += 5;
      }

      // Check file extension (moderate signal)
      if (/\.(jsx|tsx)$/.test(sourcePath)) {
        reasons.push('JSX/TSX file');
        score += 2;
      }

      // Check for common React library patterns
      if (sourcePath.includes('node_modules/@react') || sourcePath.includes('node_modules/react-')) {
        reasons.push('React ecosystem package');
        score += 1;
      }
    }

    // Determine confidence based on score
    let confidence;
    let isReact;

    if (score >= 5) {
      confidence = 'High';
      isReact = true;
    } else if (score >= 2) {
      confidence = 'Medium';
      isReact = true;
    } else if (score >= 1) {
      confidence = 'Low';
      isReact = true;
    } else {
      confidence = 'None';
      isReact = false;
    }

    return { isReact, confidence, reasons, score };
  }

  /**
   * Check if a component is a class component by analyzing source code
   * Returns true if the component is definitively a class component,
   * false if definitively a function component, or null if uncertain
   */
  isClassComponent(sourceContent, context) {
    if (!sourceContent) {
      return null;
    }

    // Get surrounding context (we need more than just the line with defaultProps)
    // The context parameter contains the matched line, we need to search in sourceContent

    // Look for class component patterns
    const classPatterns = [
      /class\s+\w+\s+extends\s+React\.Component/,
      /class\s+\w+\s+extends\s+Component/,
      /class\s+\w+\s+extends\s+React\.PureComponent/,
      /class\s+\w+\s+extends\s+PureComponent/,
    ];

    // Look for function component patterns
    const functionPatterns = [
      /function\s+\w+\s*\([^)]*\)\s*\{/,
      /const\s+\w+\s*=\s*\([^)]*\)\s*=>/,
      /const\s+\w+\s*=\s*function\s*\([^)]*\)/,
      /export\s+default\s+function\s+\w+\s*\([^)]*\)/,
      /export\s+function\s+\w+\s*\([^)]*\)/,
    ];

    // Strong indicators of class components
    const classIndicators = [
      /\bthis\.state\s*=/,
      /\bthis\.props\b/,
      /\bcomponentDidMount\s*\(/,
      /\bcomponentDidUpdate\s*\(/,
      /\bcomponentWillUnmount\s*\(/,
      /\brender\s*\(\s*\)\s*\{/,
      /\bgetDerivedStateFromProps\b/,
      /\bshouldComponentUpdate\s*\(/,
    ];

    // Strong indicators of function components
    const functionIndicators = [
      /\buseState\s*\(/,
      /\buseEffect\s*\(/,
      /\buseContext\s*\(/,
      /\buseReducer\s*\(/,
      /\buseCallback\s*\(/,
      /\buseMemo\s*\(/,
      /\buseRef\s*\(/,
      /\buseImperativeHandle\s*\(/,
      /\buseLayoutEffect\s*\(/,
    ];

    // Check for class component patterns first (most definitive)
    for (const pattern of classPatterns) {
      if (pattern.test(sourceContent)) {
        return true;
      }
    }

    // Check for class component indicators
    let classScore = 0;
    for (const pattern of classIndicators) {
      if (pattern.test(sourceContent)) {
        classScore++;
      }
    }

    // Check for function component indicators
    let functionScore = 0;
    for (const pattern of functionIndicators) {
      if (pattern.test(sourceContent)) {
        functionScore++;
      }
    }

    // If we have strong hook usage, it's definitely a function component
    if (functionScore >= 2) {
      return false;
    }

    // If we have class lifecycle methods, it's definitely a class component
    if (classScore >= 2) {
      return true;
    }

    // Check for function component patterns
    for (const pattern of functionPatterns) {
      if (pattern.test(sourceContent)) {
        // Could still be a class component with other functions, but less likely
        // Only return false if we have function pattern AND some React indicators
        if (functionScore > 0 || /return\s*\(?\s*</.test(sourceContent)) {
          return false;
        }
      }
    }

    // If we can't determine, return null
    return null;
  }

  /**
   * Get plugin metadata from plugin.json
   */
  getPluginMetadata(jsFilePath) {
    // Navigate up to find plugin.json
    let dir = path.dirname(jsFilePath);

    // Go up until we find plugin.json or hit the plugins root
    while (dir !== this.pluginsDir && dir !== '/') {
      const pluginJsonPath = path.join(dir, 'plugin.json');
      if (fs.existsSync(pluginJsonPath)) {
        try {
          const content = fs.readFileSync(pluginJsonPath, 'utf8');
          const metadata = JSON.parse(content);
          return {
            id: metadata.id || 'unknown',
            type: metadata.type || 'unknown',
            version: metadata.info?.version || 'unknown',
            name: metadata.name || 'unknown',
          };
        } catch (error) {
          console.error(`Error parsing plugin.json at ${pluginJsonPath}:`, error.message);
        }
      }
      dir = path.dirname(dir);
    }

    return {
      id: 'unknown',
      type: 'unknown',
      version: 'unknown',
      name: 'unknown',
    };
  }

  /**
   * Analyze source map for a given JS file (async)
   */
  async analyzeWithSourceMap(jsFilePath, matches) {
    const mapPath = jsFilePath + '.map';

    if (!fs.existsSync(mapPath)) {
      return matches.map((match) => ({
        ...match,
        sourceMapFile: 'N/A',
        originalLine: 'N/A',
        isDependency: 'Unknown',
        packageName: 'N/A',
        sourceContent: null,
        hasSourceContent: false,
        reactConfidence: 'Unknown',
        reactReasons: '',
        componentType: 'Unknown',
      }));
    }

    const parser = new SourceMapParser(mapPath);

    // Process each match to find its original source location
    const enrichedMatches = [];

    for (const match of matches) {
      try {
        const sourceInfo = await parser.findOriginalSource(match.line, match.column);

        let sourceMapFile = 'Unknown';
        let originalLine = 'N/A';
        let isDependency = 'Unknown';
        let packageName = 'N/A';
        let sourceContent = null;
        let reactConfidence = 'Unknown';
        let reactReasons = [];
        let componentType = 'Unknown';

        if (sourceInfo) {
          // If we got a specific mapping
          if (sourceInfo.source) {
            sourceMapFile = sourceInfo.source;
            originalLine = sourceInfo.line || 'N/A';
            isDependency = sourceInfo.isDependency ? 'Yes' : 'No';
            packageName = sourceInfo.packageName || 'N/A';

            // For non-dependencies, extract the actual source code line
            if (!sourceInfo.isDependency && sourceInfo.line) {
              sourceContent = parser.getSourceContent(sourceInfo.source, sourceInfo.line);
            }

            // Get the full source content for React detection
            let fullSourceContent = null;
            try {
              fullSourceContent = parser.consumer.sourceContentFor(sourceInfo.source, true);
            } catch (error) {
              // Source content not available, we'll still check the path
            }

            // Check if this is likely React code
            const reactCheck = this.isLikelyReactCode(fullSourceContent, sourceInfo.source);
            reactConfidence = reactCheck.confidence;
            reactReasons = reactCheck.reasons;

            // Check if this is a class component (important for defaultProps analysis)
            // Class components can still use defaultProps in React 19
            const isClassComp = this.isClassComponent(fullSourceContent, match.context);

            // Store the component type information
            componentType = isClassComp === true ? 'Class' : isClassComp === false ? 'Function' : 'Unknown';
          }
          // If we got general source info (no specific mapping found)
          else if (sourceInfo.sources && sourceInfo.sources.length > 0) {
            const depSources = sourceInfo.sources.filter((s) => parser.isDependency(s));
            if (depSources.length > 0) {
              isDependency = 'Yes';
              const packageNames = [...new Set(depSources.map((s) => parser.getPackageName(s)).filter(Boolean))];
              if (packageNames.length === 1) {
                packageName = packageNames[0];
              } else if (packageNames.length > 1) {
                packageName = packageNames[0] + ` (+${packageNames.length - 1} more)`;
              }
              sourceMapFile = depSources[0];
            } else {
              isDependency = 'No';
              sourceMapFile = sourceInfo.sources[0] || 'Unknown';
            }
          }
        }

        enrichedMatches.push({
          ...match,
          sourceMapFile,
          originalLine,
          isDependency,
          packageName,
          sourceContent,
          hasSourceContent: sourceInfo?.hasContent || false,
          reactConfidence,
          reactReasons: reactReasons.join(', '),
          componentType,
        });
      } catch (error) {
        console.error(`Error processing match at ${jsFilePath}:${match.line}:${match.column}:`, error.message);
        enrichedMatches.push({
          ...match,
          sourceMapFile: 'Error',
          originalLine: 'N/A',
          isDependency: 'Unknown',
          packageName: 'N/A',
          sourceContent: null,
          hasSourceContent: false,
          reactConfidence: 'Unknown',
          reactReasons: '',
          componentType: 'Unknown',
        });
      }
    }

    // Clean up the parser
    parser.destroy();

    return enrichedMatches;
  }

  /**
   * Analyze a specific breaking change pattern (async)
   */
  async analyzePattern(patternName, patternConfig) {
    console.log(`\nAnalyzing: ${patternName}`);
    console.log(`Pattern: ${patternConfig.pattern}`);
    console.log(`Severity: ${patternConfig.severity}`);

    const jsFiles = this.findJsFiles();
    console.log(`Found ${jsFiles.length} JS files to scan`);

    const results = [];
    let filesProcessed = 0;
    let classComponentFilteredCount = 0;

    for (const jsFile of jsFiles) {
      filesProcessed++;
      if (filesProcessed % 100 === 0) {
        console.log(`Processed ${filesProcessed}/${jsFiles.length} files...`);
      }

      const matches = this.searchInFile(jsFile, patternConfig.pattern);

      if (matches.length === 0) {
        continue;
      }

      const plugin = this.getPluginMetadata(jsFile);
      const enrichedMatches = await this.analyzeWithSourceMap(jsFile, matches);

      enrichedMatches.forEach((match) => {
        // Filter out defaultProps on class components (not a breaking change in React 19)
        if (patternName === 'defaultProps' && match.componentType === 'Class') {
          classComponentFilteredCount++;
          return;
        }

        // Shorten the file path by removing the -extracted directory portion
        const relativePath = path.relative(this.pluginsDir, jsFile);
        const pathParts = relativePath.split(path.sep);
        let shortenedPath = relativePath;

        // Find the -extracted directory and remove it from the path
        const extractedIndex = pathParts.findIndex((part) => part.includes('-extracted'));
        if (extractedIndex !== -1 && pathParts.length > extractedIndex + 1) {
          // Keep the first part (plugin dir) and everything after -extracted
          shortenedPath = [pathParts[0], ...pathParts.slice(extractedIndex + 2)].join(path.sep);
        }

        results.push({
          pluginId: plugin.id,
          pluginName: plugin.name,
          pluginType: plugin.type,
          pluginVersion: plugin.version,
          file: shortenedPath,
          line: match.line,
          column: match.column,
          matched: match.matched,
          context: match.context,
          sourceMapFile: match.sourceMapFile,
          originalLine: match.originalLine,
          isDependency: match.isDependency,
          packageName: match.packageName,
          sourceContent: match.sourceContent,
          reactConfidence: match.reactConfidence,
          reactReasons: match.reactReasons,
        });
      });
    }

    console.log(
      `Found ${results.length} occurrences in ${new Set(results.map((r) => r.pluginId)).size} unique plugins`
    );

    if (patternName === 'defaultProps' && classComponentFilteredCount > 0) {
      console.log(`Filtered out ${classComponentFilteredCount} class component defaultProps (not a breaking change)`);
    }

    return results;
  }

  /**
   * Generate CSV for results
   */
  generateCSV(patternName, results) {
    if (results.length === 0) {
      return '';
    }

    // Escape CSV fields that may contain commas or quotes
    const escapeCsvField = (field) => {
      if (field == null) {
        return '';
      }
      const str = String(field);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // Group results by plugin ID
    const pluginGroups = {};
    for (const result of results) {
      if (!pluginGroups[result.pluginId]) {
        pluginGroups[result.pluginId] = {
          version: result.pluginVersion,
          dependencies: [],
          source: [],
        };
      }

      if (result.isDependency === 'Yes') {
        pluginGroups[result.pluginId].dependencies.push(result);
      } else if (result.isDependency === 'No') {
        pluginGroups[result.pluginId].source.push(result);
      }
    }

    // Helper function to get the highest confidence from a list of results
    const getHighestConfidence = (results) => {
      const confidenceLevels = { High: 3, Medium: 2, Low: 1, None: 0, Unknown: -1 };
      let highest = 'Unknown';
      let highestScore = -1;

      for (const result of results) {
        const score = confidenceLevels[result.reactConfidence] || -1;
        if (score > highestScore) {
          highestScore = score;
          highest = result.reactConfidence;
        }
      }

      return highest;
    };

    // CSV header
    let csv = 'Plugin ID,Plugin Version,Type,Occurrence Count,React Confidence,Packages/Files,Source Code Sample\n';

    // Generate aggregated rows
    for (const [pluginId, data] of Object.entries(pluginGroups)) {
      // Dependencies row (if any)
      if (data.dependencies.length > 0) {
        const uniquePackages = [...new Set(data.dependencies.map((r) => r.packageName).filter((p) => p !== 'N/A'))];
        const packageList = uniquePackages.join(', ');
        const confidence = getHighestConfidence(data.dependencies);

        csv += `${escapeCsvField(pluginId)},${escapeCsvField(data.version)},Dependency,${data.dependencies.length},${confidence},${escapeCsvField(packageList)},N/A\n`;
      }

      // Source code row (if any)
      if (data.source.length > 0) {
        const uniqueFiles = [
          ...new Set(
            data.source
              .map((r) => r.sourceMapFile)
              .filter((f) => f && f !== 'Unknown' && f !== 'N/A')
              .map((f) => path.basename(f))
          ),
        ];
        const fileList = uniqueFiles.length > 0 ? uniqueFiles.join(', ') : 'N/A';
        const confidence = getHighestConfidence(data.source);

        // Get first available source code sample
        const sampleCode = data.source.find((r) => r.sourceContent)?.sourceContent || 'N/A';

        csv += `${escapeCsvField(pluginId)},${escapeCsvField(data.version)},Source,${data.source.length},${confidence},${escapeCsvField(fileList)},${escapeCsvField(sampleCode)}\n`;
      }
    }

    return csv;
  }

  /**
   * Run analysis for all patterns (async)
   */
  async analyzeAll() {
    const allResults = {};

    for (const [name, config] of Object.entries(PATTERNS)) {
      allResults[name] = await this.analyzePattern(name, config);
    }

    return allResults;
  }
}

// Main execution
async function main() {
  const pluginsDir = path.join(__dirname, 'plugins');

  if (!fs.existsSync(pluginsDir)) {
    console.error(`Plugins directory not found: ${pluginsDir}`);
    process.exit(1);
  }

  const analyzer = new PluginAnalyzer(pluginsDir);

  // For now, just analyze the first pattern as a test
  const pattern = process.argv[2] || '__SECRET_INTERNALS';

  if (!PATTERNS[pattern]) {
    console.error(`Unknown pattern: ${pattern}`);
    console.error(`Available patterns: ${Object.keys(PATTERNS).join(', ')}`);
    process.exit(1);
  }

  console.log('React 19 Breaking Changes Analysis');
  console.log('===================================\n');

  const results = await analyzer.analyzePattern(pattern, PATTERNS[pattern]);
  const csv = analyzer.generateCSV(pattern, results);

  // Update the impact file
  const impactFile = path.join(__dirname, `react-19-impact-${pattern}.csv`);

  // Write CSV to file (overwrites if exists)
  if (csv) {
    fs.writeFileSync(impactFile, csv);
    console.log(`\nResults written to ${impactFile}`);
    console.log(`Total occurrences: ${results.length}`);
    console.log(`Unique plugins affected: ${new Set(results.map((r) => r.pluginId)).size}`);

    // Show confidence distribution
    const confidenceCounts = {
      High: 0,
      Medium: 0,
      Low: 0,
      None: 0,
      Unknown: 0,
    };

    results.forEach((r) => {
      const conf = r.reactConfidence || 'Unknown';
      if (confidenceCounts.hasOwnProperty(conf)) {
        confidenceCounts[conf]++;
      }
    });

    console.log(`\nReact Confidence Distribution:`);
    console.log(
      `  High:    ${confidenceCounts.High} (${((confidenceCounts.High / results.length) * 100).toFixed(1)}%)`
    );
    console.log(
      `  Medium:  ${confidenceCounts.Medium} (${((confidenceCounts.Medium / results.length) * 100).toFixed(1)}%)`
    );
    console.log(`  Low:     ${confidenceCounts.Low} (${((confidenceCounts.Low / results.length) * 100).toFixed(1)}%)`);
    console.log(
      `  None:    ${confidenceCounts.None} (${((confidenceCounts.None / results.length) * 100).toFixed(1)}%)`
    );
    console.log(
      `  Unknown: ${confidenceCounts.Unknown} (${((confidenceCounts.Unknown / results.length) * 100).toFixed(1)}%)`
    );
  } else {
    console.log(`\nNo occurrences found for ${pattern}`);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { PluginAnalyzer, SourceMapParser, PATTERNS };
