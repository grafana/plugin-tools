import minimist from 'minimist';
import { findBundledJSfiles } from '../file-scanner.js';
import { AnalyzedMatch } from '../types/processors.js';
import { readFile } from 'fs/promises';
import { findPatternMatches } from '../patterns/matcher.js';
import { resolveMatch } from '../source-map-resolver.js';
import { analyzeMatch } from '../analyzer.js';
import { output } from '../utils/output.js';
import { reportConsole } from '../bin/reporters/console.js';

/**
 * Main detect command for finding React 19 breaking changes
 */
export async function detect19(argv: minimist.ParsedArgs) {
  const pluginRoot = argv.pluginRoot || process.cwd();

  output.log({
    title: `Detecting React 19 breaking changes for plugin at path:${pluginRoot}`,
  });

  const allMatches = await getAllMatches(pluginRoot);
  // Report results
  reportConsole(allMatches);

  process.exit(allMatches.length > 0 ? 1 : 0);
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
