import minimist from 'minimist';
import { findBundledJSfiles } from '../file-scanner.js';
import { AnalyzedMatch } from '../types/processors.js';
import { readFile } from 'fs/promises';
import { findPatternMatches } from '../patterns/matcher.js';
import { resolveMatch } from '../resolver.js';
import { analyzeMatch } from '../analyzer.js';
import { output } from '../utils/output.js';
import { getResults } from '../results.js';
import { DependencyContext } from '../utils/dependencies.js';

/**
 * Main detect command for finding React 19 breaking changes
 */
export async function detect19(argv: minimist.ParsedArgs) {
  const pluginRoot = argv.pluginRoot || process.cwd();

  output.log({
    title: `Detecting React 19 breaking changes for plugin at path:${pluginRoot}`,
  });

  const allMatches = await getAllMatches(pluginRoot);
  const depContext = new DependencyContext();
  await depContext.loadDependencies(pluginRoot);
  const results = getResults(allMatches, pluginRoot, depContext);

  process.exit(results.summary.totalIssues > 0 ? 1 : 0);
}

async function getAllMatches(pluginRoot: string) {
  const filePaths = await findBundledJSfiles(pluginRoot);
  const allMatches: AnalyzedMatch[] = [];

  for (const filePath of filePaths) {
    const code = await readFile(filePath, 'utf8');
    const rawMatches = findPatternMatches(code, filePath);

    for (const rawMatch of rawMatches) {
      const resolvedMatch = await resolveMatch(rawMatch);
      const analyzedMatch = await analyzeMatch(resolvedMatch);
      allMatches.push(analyzedMatch);
    }
  }

  return allMatches;
}
