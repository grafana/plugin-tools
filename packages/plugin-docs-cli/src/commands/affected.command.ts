import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import matter from 'gray-matter';
import createDebug from 'debug';

const debug = createDebug('plugin-docs-cli:affected');

export interface AffectedOptions {
  source: string;
}

export async function affectedCommand(docsPath: string, options: AffectedOptions): Promise<void> {
  const normalized = normalizeSource(options.source);
  debug('Finding docs that reference source: %s (normalized: %s)', options.source, normalized);

  const docFiles = await collectMarkdownFiles(docsPath);
  const matches: string[] = [];

  for (const file of docFiles) {
    const related = await readRelatedSources(file);
    if (related.some((entry) => normalizeSource(entry) === normalized)) {
      matches.push(relative(process.cwd(), file));
    }
  }

  for (const match of matches) {
    console.log(match);
  }
}

async function collectMarkdownFiles(dir: string): Promise<string[]> {
  const results: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') {
      continue;
    }
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await collectMarkdownFiles(full)));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      results.push(full);
    }
  }
  return results;
}

async function readRelatedSources(file: string): Promise<string[]> {
  let raw: string;
  try {
    raw = await readFile(file, 'utf-8');
  } catch {
    return [];
  }
  let parsed: matter.GrayMatterFile<string>;
  try {
    parsed = matter(raw);
  } catch {
    return [];
  }
  const value = (parsed.data as Record<string, unknown>).relatedSources;
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((entry): entry is string => typeof entry === 'string');
}

function normalizeSource(input: string): string {
  return input.replace(/^\.\//, '').replace(/\\/g, '/').replace(/\/+$/g, '');
}
