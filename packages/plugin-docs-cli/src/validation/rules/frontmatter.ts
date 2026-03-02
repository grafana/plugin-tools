import { readFile, readdir } from 'node:fs/promises';
import type { Dirent } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import matter from 'gray-matter';
import { type Diagnostic, type ValidationInput, Rule } from '../types.js';

const REQUIRED_FIELDS: Array<{ key: string; type: string }> = [
  { key: 'title', type: 'string' },
  { key: 'description', type: 'string' },
  { key: 'sidebar_position', type: 'number' },
];

/**
 * Checks whether a custom slug is safe for use in URLs.
 * Mirrors the logic in scanner.ts normalizeCustomSlug.
 */
function isSlugSafe(raw: string): boolean {
  const trimmed = raw.trim().replace(/^\/+|\/+$/g, '');
  if (!trimmed) {
    return false;
  }
  if (!/^[A-Za-z0-9/_-]+$/.test(trimmed)) {
    return false;
  }
  const segments = trimmed.split('/');
  return !segments.some((s) => !s || s === '.' || s === '..');
}

/**
 * Finds the 1-based line number of a frontmatter key in the raw file content.
 * Returns undefined if the key isn't found.
 */
function findFieldLine(raw: string, key: string): number | undefined {
  const lines = raw.split('\n');
  // frontmatter starts after the opening ---, so skip line 0
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      break;
    }
    if (lines[i].startsWith(`${key}:`)) {
      return i + 1;
    }
  }
  return undefined;
}

/**
 * Finds the 1-based line numbers of all h1 headings (# ) in the markdown body.
 * The body starts after the closing --- of frontmatter.
 */
function findH1Lines(raw: string): number[] {
  const lines = raw.split('\n');
  let inFrontmatter = false;
  let passedFrontmatter = false;
  const result: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      if (!inFrontmatter) {
        inFrontmatter = true;
      } else {
        passedFrontmatter = true;
      }
      continue;
    }
    if (passedFrontmatter && /^# /.test(lines[i])) {
      result.push(i + 1);
    }
  }
  return result;
}

// tracks per-file data needed for cross-file duplicate checks
interface FileRecord {
  relativePath: string;
  parentDir: string;
  sidebarPosition: number | undefined;
  sidebarPositionLine: number | undefined;
  customSlug: string | undefined;
  customSlugLine: number | undefined;
}

export async function checkFrontmatter(input: ValidationInput): Promise<Diagnostic[]> {
  const diagnostics: Diagnostic[] = [];

  let entries: Dirent[] = [];
  try {
    entries = await readdir(input.docsPath, { recursive: true, withFileTypes: true });
  } catch {
    // docsPath doesn't exist - filesystem rules handle this
    return diagnostics;
  }

  const mdFiles = entries.filter(
    (e) =>
      e.isFile() && e.name.endsWith('.md') && !e.parentPath.includes('node_modules') && !e.parentPath.includes('dist')
  );

  const records: FileRecord[] = [];

  for (const file of mdFiles) {
    const absolutePath = join(file.parentPath, file.name);
    const relativePath = relative(input.docsPath, absolutePath);
    let raw: string;
    try {
      raw = await readFile(absolutePath, 'utf-8');
    } catch {
      continue;
    }

    // frontmatter-block-exists: file must start with ---
    if (!raw.startsWith('---')) {
      diagnostics.push({
        rule: Rule.BlockExists,
        severity: 'error',
        file: relativePath,
        line: 1,
        title: 'Missing frontmatter block',
        detail: 'Every page must start with a frontmatter block (---). Add title, description and sidebar_position.',
      });
      continue;
    }

    // frontmatter-valid-yaml: gray-matter throws on invalid YAML
    let data: Record<string, unknown>;
    try {
      ({ data } = matter(raw));
    } catch (err) {
      diagnostics.push({
        rule: Rule.ValidYaml,
        severity: 'error',
        file: relativePath,
        line: 1,
        title: 'Invalid YAML in frontmatter',
        detail: err instanceof Error ? err.message : 'YAML parse error.',
      });
      continue;
    }

    // check required fields are present and have correct types
    for (const { key, type } of REQUIRED_FIELDS) {
      if (!(key in data)) {
        diagnostics.push({
          rule: Rule.RequiredFields,
          severity: 'error',
          file: relativePath,
          line: 1,
          title: `Missing required field: ${key}`,
          detail: `Every page needs a "${key}" (${type}) in its frontmatter.`,
        });
      } else if (typeof data[key] !== type) {
        diagnostics.push({
          rule: Rule.FieldTypes,
          severity: 'error',
          file: relativePath,
          line: findFieldLine(raw, key),
          title: `Wrong type for field: ${key}`,
          detail: `"${key}" should be a ${type} but got ${typeof data[key]}.`,
        });
      }
    }

    // check custom slug if present
    if ('slug' in data && typeof data.slug === 'string' && !isSlugSafe(data.slug)) {
      diagnostics.push({
        rule: Rule.ValidSlug,
        severity: 'warning',
        file: relativePath,
        line: findFieldLine(raw, 'slug'),
        title: 'Invalid custom slug',
        detail: `The slug "${data.slug}" contains unsafe characters. Only letters, digits, underscores, hyphens and forward slashes are allowed.`,
      });
    }

    // check for h1 headings in body - title comes from frontmatter
    for (const h1Line of findH1Lines(raw)) {
      diagnostics.push({
        rule: Rule.NoH1,
        severity: 'warning',
        file: relativePath,
        line: h1Line,
        title: 'Avoid h1 headings in content',
        detail:
          'The page title comes from frontmatter. Any h1 in the body will be stripped by the parser and replaced by the frontmatter title. Use h2 (##) or lower.',
      });
    }

    // collect for cross-file checks
    records.push({
      relativePath,
      parentDir: dirname(relativePath),
      sidebarPosition: typeof data.sidebar_position === 'number' ? data.sidebar_position : undefined,
      sidebarPositionLine: findFieldLine(raw, 'sidebar_position'),
      customSlug: typeof data.slug === 'string' && isSlugSafe(data.slug) ? data.slug : undefined,
      customSlugLine: findFieldLine(raw, 'slug'),
    });
  }

  // no-duplicate-sidebar-position: siblings (same parent dir) must have unique positions
  // two-pass: count occurrences first, then report every sibling that uses a duplicate position
  const byDir = Map.groupBy(records, (r) => r.parentDir);
  for (const siblings of byDir.values()) {
    const posCounts = new Map<number, number>();
    for (const record of siblings) {
      if (record.sidebarPosition !== undefined) {
        posCounts.set(record.sidebarPosition, (posCounts.get(record.sidebarPosition) ?? 0) + 1);
      }
    }
    for (const record of siblings) {
      if (record.sidebarPosition === undefined || (posCounts.get(record.sidebarPosition) ?? 0) <= 1) {
        continue;
      }
      diagnostics.push({
        rule: Rule.DuplicatePosition,
        severity: input.strict ? 'error' : 'warning',
        file: record.relativePath,
        line: record.sidebarPositionLine,
        title: `Duplicate sidebar_position: ${record.sidebarPosition}`,
        detail: `sidebar_position ${record.sidebarPosition} is shared by multiple siblings. Each sibling page must have a unique position.`,
      });
    }
  }

  // no-duplicate-slugs: custom slugs must be unique across all files
  // two-pass: count occurrences first, then report every file that uses a duplicate slug
  const slugCounts = new Map<string, number>();
  for (const record of records) {
    if (record.customSlug) {
      slugCounts.set(record.customSlug, (slugCounts.get(record.customSlug) ?? 0) + 1);
    }
  }
  for (const record of records) {
    if (!record.customSlug || (slugCounts.get(record.customSlug) ?? 0) <= 1) {
      continue;
    }
    diagnostics.push({
      rule: Rule.DuplicateSlug,
      severity: 'error',
      file: record.relativePath,
      line: record.customSlugLine,
      title: `Duplicate slug: "${record.customSlug}"`,
      detail: `Slug "${record.customSlug}" is used by multiple pages. Each page must have a unique URL slug.`,
    });
  }

  return diagnostics;
}
