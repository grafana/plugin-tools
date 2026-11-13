import { readFile, readdir } from 'node:fs/promises';
import type { Dirent } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { readFrontmatter, type FrontmatterProblem } from '@grafana/plugin-docs-parser';
import { type Diagnostic, type ValidationInput, Rule } from '../types.js';
import { isInExcludedFolder, isMetaFile } from './utils.js';

const REQUIRED_FIELDS: Array<{ key: string; type: string }> = [
  { key: 'title', type: 'string' },
  { key: 'description', type: 'string' },
];

// optional fields: validated only when present
const OPTIONAL_FIELDS: Array<{ key: string; type: string }> = [{ key: 'sidebar_position', type: 'number' }];

// SEO conventions: search engines truncate title/description around these lengths
const MAX_TITLE_LENGTH = 60;
const MIN_DESCRIPTION_LENGTH = 20;
const MAX_DESCRIPTION_LENGTH = 160;

// how many other pages a duplicate-description warning names before it says "and N more"
const MAX_SHOWN_DUPLICATES = 3;

// below this, a page body is almost certainly a stub rather than real content
const MIN_CONTENT_LENGTH = 150;

function isStringList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string' && item.trim() !== '');
}

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
 * The body starts after the closing --- of frontmatter. Lines inside fenced code
 * blocks (``` or ~~~) are skipped, since a shell comment like "# foo" isn't a heading.
 */
function findH1Lines(raw: string): number[] {
  const lines = raw.split('\n');
  let inFrontmatter = false;
  let passedFrontmatter = false;
  let fence: string | undefined;
  const result: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (!passedFrontmatter && lines[i].trim() === '---') {
      if (!inFrontmatter) {
        inFrontmatter = true;
      } else {
        passedFrontmatter = true;
      }
      continue;
    }
    if (!passedFrontmatter) {
      continue;
    }
    if (fence) {
      const closer = /^ {0,3}(`{3,}|~{3,})\s*$/.exec(lines[i]);
      if (closer && closer[1][0] === fence[0] && closer[1].length >= fence.length) {
        fence = undefined;
      }
      continue;
    }
    const opener = /^ {0,3}(```+|~~~+)/.exec(lines[i]);
    if (opener) {
      fence = opener[1];
      continue;
    }
    if (/^# /.test(lines[i])) {
      result.push(i + 1);
    }
  }
  return result;
}

function frontmatterProblemDiagnostic(
  problem: FrontmatterProblem
): Pick<Diagnostic, 'rule' | 'line' | 'title' | 'detail'> {
  switch (problem.kind) {
    case 'unclosed':
      return {
        rule: Rule.BlockExists,
        line: problem.line,
        title: 'Frontmatter block is not closed',
        detail: 'End the frontmatter block with a line that holds only ---.',
      };
    case 'invalid-yaml':
      return {
        rule: Rule.ValidYaml,
        line: problem.line,
        title: 'Invalid YAML in frontmatter',
        detail: problem.message,
      };
    case 'not-a-mapping':
      return {
        rule: Rule.ValidYaml,
        line: problem.line,
        title: 'Frontmatter must use key: value fields',
        detail: 'Write each field on its own line as "key: value", such as "title: Configure the data source".',
      };
  }
}

function normalizeDescription(description: string): string {
  return description.replace(/\s+/g, ' ').trim().toLowerCase();
}

// tracks per-file data needed for cross-file duplicate checks
interface FileRecord {
  relativePath: string;
  parentDir: string;
  sidebarPosition: number | undefined;
  sidebarPositionLine: number | undefined;
  customSlug: string | undefined;
  customSlugLine: number | undefined;
  // empty when the page has no description or one too short to count
  normalizedDescription: string;
  descriptionLine: number | undefined;
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
      e.isFile() &&
      e.name.endsWith('.md') &&
      !isMetaFile(e.name) &&
      !isInExcludedFolder(relative(input.docsPath, e.parentPath))
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

    const { hasBlock, data, body, problem } = readFrontmatter(raw);
    if (!hasBlock) {
      diagnostics.push({
        rule: Rule.BlockExists,
        severity: 'error',
        file: relativePath,
        line: 1,
        title: 'Missing frontmatter block',
        detail: 'Every page must start with a frontmatter block (---). Add at least title and description.',
      });
      continue;
    }
    if (problem) {
      diagnostics.push({ ...frontmatterProblemDiagnostic(problem), severity: 'error', file: relativePath });
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

    // check optional fields: wrong type only when the field is present
    for (const { key, type } of OPTIONAL_FIELDS) {
      if (key in data && typeof data[key] !== type) {
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

    if ('keywords' in data && !isStringList(data.keywords)) {
      diagnostics.push({
        rule: Rule.FieldTypes,
        severity: 'error',
        file: relativePath,
        line: findFieldLine(raw, 'keywords'),
        title: 'Wrong type for field: keywords',
        detail: '"keywords" should be a list of non-empty strings.',
      });
    }

    // frontmatter-title-length: search engines truncate long titles in results
    if (typeof data.title === 'string' && data.title.length > MAX_TITLE_LENGTH) {
      diagnostics.push({
        rule: Rule.TitleLength,
        severity: 'warning',
        file: relativePath,
        line: findFieldLine(raw, 'title'),
        title: `Title exceeds ${MAX_TITLE_LENGTH} characters`,
        detail: `"title" is ${data.title.length} characters. Search engines truncate titles around ${MAX_TITLE_LENGTH} characters, so shorten it.`,
      });
    }

    // frontmatter-description-length: search engines truncate long descriptions, and a very
    // short one usually means it hasn't been written yet
    if (typeof data.description === 'string') {
      if (data.description.length < MIN_DESCRIPTION_LENGTH) {
        diagnostics.push({
          rule: Rule.DescriptionLength,
          severity: 'error',
          file: relativePath,
          line: findFieldLine(raw, 'description'),
          title: `Description is shorter than ${MIN_DESCRIPTION_LENGTH} characters`,
          detail: `"description" is ${data.description.length} characters. Write a fuller sentence describing what's on this page.`,
        });
      } else if (data.description.length > MAX_DESCRIPTION_LENGTH) {
        diagnostics.push({
          rule: Rule.DescriptionLength,
          severity: 'warning',
          file: relativePath,
          line: findFieldLine(raw, 'description'),
          title: `Description exceeds ${MAX_DESCRIPTION_LENGTH} characters`,
          detail: `"description" is ${data.description.length} characters. Search engines truncate descriptions around ${MAX_DESCRIPTION_LENGTH} characters, so shorten it.`,
        });
      }
    }

    // min-content-length: catches pages stubbed out with just a title and a sentence
    if (body.trim().length < MIN_CONTENT_LENGTH) {
      diagnostics.push({
        rule: Rule.MinContentLength,
        severity: 'info',
        file: relativePath,
        title: 'Page content is very short',
        detail: `This page has ${body.trim().length} characters of content, under the ${MIN_CONTENT_LENGTH}-character guideline. Add more detail, or remove the page if it isn't needed.`,
      });
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

    // the catalog finds the docs landing page by its `index` slug, so renaming it hides the
    // Documentation tab. unsafe slugs are skipped: the scanner already falls back to `index`.
    if (
      relativePath === 'index.md' &&
      typeof data.slug === 'string' &&
      isSlugSafe(data.slug) &&
      data.slug.trim().replace(/^\/+|\/+$/g, '') !== 'index'
    ) {
      diagnostics.push({
        rule: Rule.RootIndexSlug,
        severity: 'error',
        file: relativePath,
        line: findFieldLine(raw, 'slug'),
        title: 'Root index.md cannot set a custom slug',
        detail: `The root index.md is your documentation landing page and must keep the slug "index". Remove the slug "${data.slug}" from its frontmatter.`,
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
      customSlug:
        typeof data.slug === 'string' && isSlugSafe(data.slug) ? data.slug.trim().replace(/^\/+|\/+$/g, '') : undefined,
      customSlugLine: findFieldLine(raw, 'slug'),
      normalizedDescription:
        typeof data.description === 'string' && data.description.length >= MIN_DESCRIPTION_LENGTH
          ? normalizeDescription(data.description)
          : '',
      descriptionLine: findFieldLine(raw, 'description'),
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
        severity: 'error',
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

  // no-duplicate-descriptions: search engines show the description as the page snippet, so pages that
// share one are hard to tell apart. Compare descriptions while ignoring case and whitespace differences.
// Descriptions under the minimum length are skipped because frontmatter-description-length already reports them.
  const byDescription = Map.groupBy(
    records.filter((r) => r.normalizedDescription),
    (r) => r.normalizedDescription
  );
  for (const sharing of byDescription.values()) {
    if (sharing.length <= 1) {
      continue;
    }
    const paths = sharing.map((r) => r.relativePath);
    for (const record of sharing) {
      const shown = paths
        .slice(0, MAX_SHOWN_DUPLICATES + 1)
        .filter((path) => path !== record.relativePath)
        .slice(0, MAX_SHOWN_DUPLICATES);
      const hidden = paths.length - 1 - shown.length;
      const others = hidden > 0 ? `${shown.join(', ')} and ${hidden} more` : shown.join(', ');
      diagnostics.push({
        rule: Rule.DuplicateDescription,
        severity: 'warning',
        file: record.relativePath,
        line: record.descriptionLine,
        title: 'Description is shared with another page',
        detail: `This "description" is also used by ${others}. Search engines show it as the page snippet, so give each page its own.`,
      });
    }
  }

  return diagnostics;
}
