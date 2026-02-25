import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import matter from 'gray-matter';
import type { Diagnostic, ValidationInput } from '../types.js';

const RULE_REQUIRED_FIELDS = 'frontmatter-required-fields';
const RULE_FIELD_TYPES = 'frontmatter-field-types';
const RULE_VALID_SLUG = 'frontmatter-valid-slug';

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

  for (const relativePath of mdFiles) {
    const absolutePath = join(input.docsPath, relativePath);
    let raw: string;
    try {
      raw = await readFile(absolutePath, 'utf-8');
    } catch {
      continue;
    }

    const { data } = matter(raw);

    // check required fields are present and have correct types
    for (const { key, type } of REQUIRED_FIELDS) {
      if (!(key in data)) {
        diagnostics.push({
          rule: RULE_REQUIRED_FIELDS,
          severity: 'error',
          file: relativePath,
          title: `Missing required field: ${key}`,
          detail: `Every page needs a "${key}" (${type}) in its frontmatter.`,
        });
      } else if (typeof data[key] !== type) {
        diagnostics.push({
          rule: RULE_FIELD_TYPES,
          severity: 'error',
          file: relativePath,
          title: `Wrong type for field: ${key}`,
          detail: `"${key}" should be a ${type} but got ${typeof data[key]}.`,
        });
      }
    }

    // check custom slug if present
    if ('slug' in data && typeof data.slug === 'string' && !isSlugSafe(data.slug)) {
      diagnostics.push({
        rule: RULE_VALID_SLUG,
        severity: 'warning',
        file: relativePath,
        title: 'Invalid custom slug',
        detail: `The slug "${data.slug}" contains unsafe characters. Only letters, digits, hyphens and forward slashes are allowed.`,
      });
    }
  }

  return diagnostics;
}
