import minimist from 'minimist';
import { findSourceMapFiles } from '../file-scanner.js';
import { generateAnalysisResults } from '../results.js';
import { DependencyContext } from '../utils/dependencies.js';
import { jsonReporter } from '../reporters/json.js';
import { consoleReporter } from '../reporters/console.js';
import { extractAllSources } from '../source-extractor.js';
import { analyzeSourceFiles } from '../analyzer.js';
import { output } from '../utils/output.js';
/**
 * Main detect command for finding React 19 breaking changes
 */
export async function detect19(argv: minimist.ParsedArgs) {
  try {
    const pluginRoot = argv.pluginRoot || process.cwd();
    const skipDependencies = argv.skipDependencies || false;
    const skipBuildTooling = argv.skipBuildTooling || false;

    const allMatches = await getAllMatches(pluginRoot);

    // Conditionally load dependencies
    let depContext: DependencyContext | null = null;
    if (!skipDependencies) {
      depContext = new DependencyContext();
      try {
        await depContext.loadDependencies(pluginRoot);
      } catch (error) {
        // Log warning but continue with null context
        output.warning({
          title: 'Failed to load dependencies',
          body: [
            (error as Error).message,
            'Continuing without dependency analysis.',
            'Use --skipDependencies to suppress this warning.',
          ],
        });
        depContext = null;
      }
    }

    // Enrich matches with root dependency only if we have context
    const matchesWithRootDependency =
      depContext === null
        ? allMatches
        : allMatches.map((match) => {
            if (match.type === 'dependency' && match.packageName) {
              return { ...match, rootDependency: depContext.findRootDependency(match.packageName) };
            }
            return match;
          });

    const results = generateAnalysisResults(matchesWithRootDependency, pluginRoot, depContext, {
      skipBuildTooling,
      skipDependencies,
    });

    if (argv.json) {
      jsonReporter(results);
    } else {
      consoleReporter(results);
    }

    process.exit(results.summary.totalIssues > 0 ? 1 : 0);
  } catch (error) {
    output.error({
      title: 'Error during detection',
      body: [(error as Error).message],
    });
    process.exit(1);
  }
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
