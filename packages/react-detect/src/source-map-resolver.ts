import { SourceMapConsumer } from 'source-map';
import { RawMatch, ResolvedMatch } from './types/processors.js';
import { readFileSync } from 'node:fs';

export async function resolveMatch(match: RawMatch): Promise<ResolvedMatch> {
  try {
    const sourceMap = await loadSourceMap(`${match.file}.map`);
    const position = sourceMap.originalPositionFor({
      line: match.line,
      column: match.column,
    });

    let sourceContent: string | undefined;
    let sourceContext: string | undefined;
    if (position.source) {
      try {
        sourceContent = sourceMap.sourceContentFor(position.source, true) ?? undefined;
        sourceContext = extractSourceContext(sourceContent, position.line ?? undefined);
      } catch {
        console.error(`Failed to load source content for ${position.source}`);
      }
    }

    sourceMap.destroy();

    if (position.source) {
      if (isDependency(position.source)) {
        const packageName = getPackageName(position.source);
        if (packageName) {
          return {
            ...match,
            type: 'dependency',
            packageName: packageName,
            sourceFile: position.source,
            sourceLine: position.line ?? undefined,
            sourceColumn: position.column ?? undefined,
            sourceContent,
            sourceContext,
          };
        }
        return {
          ...match,
          type: 'unknown',
          reason: 'No package name found',
        };
      }
      return {
        ...match,
        type: 'source',
        sourceFile: position.source,
        sourceLine: position.line ?? undefined,
        sourceColumn: position.column ?? undefined,
        sourceContent,
        sourceContext,
      };
    }
    return { ...match, type: 'unknown', reason: 'No original source found' };
  } catch (error) {
    return {
      ...match,
      type: 'unknown',
      reason: `Failed to load source map ${match.file}: ${(error as Error).message}`,
    };
  }
}

async function loadSourceMap(filePath: string): Promise<SourceMapConsumer> {
  try {
    const content = readFileSync(filePath, 'utf8');
    const sourceMap = JSON.parse(content);
    const consumer = await new SourceMapConsumer(sourceMap);
    return consumer;
  } catch (error) {
    throw new Error(`Failed to load source map ${filePath}: ${(error as Error).message}`);
  }
}

function isDependency(source: string): boolean {
  return source.includes('node_modules');
}

function getPackageName(sourcePath: string): string | null {
  // PNPM has its own ideas of how to resolve dependencies, so we need to handle it differently.
  const pnpmMatch = sourcePath.match(/\.pnpm\/[^/]+\/node_modules\/((?:@[^/]+\/)?[^/]+)/);
  if (pnpmMatch) {
    return pnpmMatch[1];
  }
  // for everything else, we can use the standard node_modules structure.
  const match = sourcePath.match(/node_modules\/((?:@[^/]+\/)?[^/]+)/);
  return match ? match[1] : null;
}

function extractSourceContext(sourceContent: string | undefined, line: number | undefined): string | undefined {
  if (!line || !sourceContent) {
    return undefined;
  }

  const lines = sourceContent.split('\n');
  if (line < 1 || line > lines.length) {
    return undefined;
  }

  return lines
    .slice(Math.max(0, line - 2), line + 2)
    .join('\n')
    .trim();
}
