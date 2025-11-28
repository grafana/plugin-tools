import { AnalyzedMatch, ResolvedMatch } from './types/processors.js';
import { parseFile } from './parser.js';
import { analyzeConfidence, analyzeComponentType } from './utils/analyzer.js';

export async function analyzeMatch(match: ResolvedMatch): Promise<AnalyzedMatch> {
  if (match.type === 'unknown' || !match.sourceContent) {
    return {
      ...match,
      confidence: 'unknown',
      componentType: 'unknown',
    };
  }

  try {
    const ast = parseFile(match.sourceContent, match.sourceFile);

    return {
      ...match,
      confidence: analyzeConfidence(ast),
      componentType: analyzeComponentType(ast),
    };
  } catch (error) {
    console.error(error);
    return {
      ...match,
      confidence: 'unknown',
      componentType: 'unknown',
    };
  }
}
