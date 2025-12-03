import { SourceMapConsumer } from 'source-map';
import { SourceFile, SourceFileType } from './types/processors.js';
import { readFile } from 'node:fs/promises';

export async function extractSourcesFromMap(sourcemapFilePath: string): Promise<SourceFile[]> {
  const mapContent = await readFile(sourcemapFilePath, 'utf8');
  const sourceMap = JSON.parse(mapContent);
  const consumer = await new SourceMapConsumer(sourceMap);

  const sourceFiles: SourceFile[] = [];
  const bundledFilePath = sourcemapFilePath.replace('.map', '');

  for (const source of consumer.sources) {
    if (shouldSkipSource(source)) {
      continue;
    }

    const content = consumer.sourceContentFor(source, true);
    if (!content) {
      console.warn(`No sourceContent for ${source} in ${sourcemapFilePath}`);
      continue;
    }

    const classified = classifySource(source);
    sourceFiles.push({
      path: source,
      content,
      type: classified.type,
      packageName: classified.packageName,
      bundledFilePath,
    });
  }
  consumer.destroy();
  return sourceFiles;
}
export async function extractAllSources(sourcemapFilePaths: string[]): Promise<SourceFile[]> {
  const allSources: SourceFile[] = [];
  // we need to dedupe paths
  const seenPaths = new Set<string>();

  for (const mapFilePath of sourcemapFilePaths) {
    try {
      const sources = await extractSourcesFromMap(mapFilePath);
      for (const source of sources) {
        if (!seenPaths.has(source.path)) {
          seenPaths.add(source.path);
          allSources.push(source);
        }
      }
    } catch (error) {
      console.error(`Failed to extract sources from ${mapFilePath}:`, error);
    }
  }

  return allSources;
}

function classifySource(sourcePath: string): { type: SourceFileType; packageName?: string } {
  if (sourcePath.includes('node_modules')) {
    const packageName = getPackageName(sourcePath);
    console.log('packageName', packageName);
    return { type: 'dependency', packageName };
  }

  return { type: 'source' };
}

function getPackageName(sourcePath: string) {
  // PNPM has its own ideas of how to resolve dependencies, so we need to handle it differently.
  const pnpmMatch = sourcePath.match(/\.pnpm\/[^/]+\/node_modules\/((?:@[^/]+\/)?[^/]+)/);
  if (pnpmMatch) {
    return pnpmMatch[1];
  }
  // for everything else, we can use the standard node_modules structure.
  const match = sourcePath.match(/node_modules\/(@[^/]+\/[^/]+|[^/]+)/);
  return match ? match[1] : undefined;
}

function shouldSkipSource(sourcePath: string): boolean {
  // skip webpack runtime source
  if (sourcePath.includes('webpack/bootstrap') || sourcePath.includes('webpack/runtime')) {
    return true;
  }

  // Skip webpack entry points without actual paths
  if (sourcePath.match(/^webpack:\/\/[^/]+\/?$/)) {
    return true;
  }

  // Skip packages externalised by webpack
  if (sourcePath.includes('/external%20amd')) {
    return true;
  }

  // Skip virtual publicPath
  if (sourcePath.includes('node_modules/grafana-public-path.js')) {
    return true;
  }

  return false;
}
