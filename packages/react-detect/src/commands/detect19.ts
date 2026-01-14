import minimist from 'minimist';
import { findSourceMapFiles } from '../file-scanner.js';
import { generateAnalysisResults } from '../results.js';
import { DependencyContext } from '../utils/dependencies.js';
import { jsonReporter } from '../reporters/json.js';
import { consoleReporter } from '../reporters/console.js';
import { extractAllSources } from '../source-extractor.js';
import { analyzeSourceFiles } from '../analyzer.js';
/**
 * Main detect command for finding React 19 breaking changes
 */
export async function detect19(argv: minimist.ParsedArgs) {
  const pluginRoot = argv.pluginRoot || process.cwd();

  const allMatches = await getAllMatches(pluginRoot);
  const depContext = new DependencyContext();
  await depContext.loadDependencies(pluginRoot);

  const matchesWithRootDependency = allMatches.map((match) => {
    if (match.type === 'dependency' && match.packageName) {
      return { ...match, rootDependency: depContext.findRootDependency(match.packageName) };
    }
    return match;
  });

  const results = generateAnalysisResults(matchesWithRootDependency, pluginRoot, depContext);

  if (argv.json) {
    jsonReporter(results);
  } else {
    consoleReporter(results);
  }

  process.exit(results.summary.totalIssues > 0 ? 1 : 0);
}

async function getAllMatches(pluginRoot: string) {
  const sourcemapPaths = await findSourceMapFiles(pluginRoot);

  if (sourcemapPaths.length === 0) {
    throw new Error('No source map files found in dist directory. Make sure to build your plugin first.');
  }

  const sources = await extractAllSources(sourcemapPaths);

  if (sources.length === 0) {
    throw new Error('No sources found in source maps.');
  }

  const matches = await analyzeSourceFiles(sources);

  return matches;
}
