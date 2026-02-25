import { readFile, readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
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
    if (lines[i] === '---') {
      break;
    }
    if (lines[i].startsWith(`${key}:`)) {
      return i + 1;
    }
  }
  return undefined;
}

/**
 * Finds the 1-based line number of the first h1 heading (# ) in the markdown body.
 * The body starts after the closing --- of frontmatter.
 */
function findH1Line(raw: string): number | undefined {
  const lines = raw.split('\n');
  let inFrontmatter = false;
  let passedFrontmatter = false;
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
      return i + 1;
    }
  }
  return undefined;
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

  let entries: string[] = [];
  try {
    entries = await readdir(input.docsPath, { recursive: true });
  } catch {
    // docsPath doesn't exist - filesystem rules handle this
    return diagnostics;
  }

  const mdFiles = entries.filter(
    (entry) => entry.endsWith('.md') && !entry.includes('node_modules') && !entry.includes('dist')
  );

  const records: FileRecord[] = [];

  for (const relativePath of mdFiles) {
    const absolutePath = join(input.docsPath, relativePath);
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
        detail: `The slug "${data.slug}" contains unsafe characters. Only letters, digits, hyphens and forward slashes are allowed.`,
      });
    }

    // check for h1 headings in body - title comes from frontmatter
    const h1Line = findH1Line(raw);
    if (h1Line) {
      diagnostics.push({
        rule: Rule.NoH1,
        severity: 'warning',
        file: relativePath,
        line: h1Line,
        title: 'Avoid h1 headings in content',
        detail:
          'The page title comes from frontmatter. Any h1 in the body will be stripped by the parser. Use h2 (##) or lower.',
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
  const byDir = Map.groupBy(records, (r) => r.parentDir);
  for (const siblings of byDir.values()) {
    const seen = new Map<number, FileRecord>();
    for (const record of siblings) {
      if (record.sidebarPosition === undefined) {
        continue;
      }
      const prev = seen.get(record.sidebarPosition);
      if (prev) {
        for (const dup of [prev, record]) {
          diagnostics.push({
            rule: Rule.DuplicatePosition,
            severity: input.strict ? 'error' : 'warning',
            file: dup.relativePath,
            line: dup.sidebarPositionLine,
            title: `Duplicate sidebar_position: ${record.sidebarPosition}`,
            detail: `"${prev.relativePath}" and "${record.relativePath}" share sidebar_position ${record.sidebarPosition}. Each sibling page must have a unique position.`,
          });
        }
      } else {
        seen.set(record.sidebarPosition, record);
      }
    }
  }

  // no-duplicate-slugs: custom slugs must be unique across all files
  const slugSeen = new Map<string, FileRecord>();
  for (const record of records) {
    if (!record.customSlug) {
      continue;
    }
    const prev = slugSeen.get(record.customSlug);
    if (prev) {
      for (const dup of [prev, record]) {
        diagnostics.push({
          rule: Rule.DuplicateSlug,
          severity: 'error',
          file: dup.relativePath,
          line: dup.customSlugLine,
          title: `Duplicate slug: "${record.customSlug}"`,
          detail: `"${prev.relativePath}" and "${record.relativePath}" both use slug "${record.customSlug}". Each page must have a unique URL slug.`,
        });
      }
    } else {
      slugSeen.set(record.customSlug, record);
    }
  }

  return diagnostics;
}
