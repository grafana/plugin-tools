import { AnalyzedMatch, SourceFile } from './types/processors.js';
import { parseFile } from './parser.js';
import { analyzeConfidence, analyzeComponentType } from './utils/analyzer.js';
import { findPatternMatches } from './patterns/matcher.js';

export async function analyzeSourceFiles(sourceFiles: SourceFile[]): Promise<AnalyzedMatch[]> {
  const matches: AnalyzedMatch[] = [];

  for (const source of sourceFiles) {
    if (source.type === 'external') {
      continue;
    }

    try {
      const ast = parseFile(source.content, source.path);
      const patternMatches = findPatternMatches(ast, source.content, source.path);

      for (const match of patternMatches) {
        const analyzed = {
          pattern: match.pattern,
          matched: match.matched,
          context: match.context,
          sourceFile: source.path,
          sourceLine: match.line,
          sourceColumn: match.column,
          type: source.type,
          packageName: source.packageName,
          bundledFilePath: source.bundledFilePath,

          confidence: analyzeConfidence(ast),
          componentType: analyzeComponentType(ast),
        };

        matches.push(analyzed);
      }
    } catch (error) {
      console.error(`Failed to analyze ${source.path}:`, error);
    }
  }

  return matches;
}
