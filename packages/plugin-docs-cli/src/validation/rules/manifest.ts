import { readdir } from 'node:fs/promises';
import { relative, join } from 'node:path';
import type { Dirent } from 'node:fs';
import type { Page } from '@grafana/plugin-docs-parser';
import { scanDocsFolder } from '../../scanner.js';
import { type Diagnostic, type ValidationInput, Rule } from '../types.js';

/**
 * Collects all file references from a manifest page tree.
 */
function collectPageFiles(pages: Page[]): Array<{ file: string; slug: string }> {
  const refs: Array<{ file: string; slug: string }> = [];
  for (const page of pages) {
    if (page.file) {
      refs.push({ file: page.file, slug: page.slug });
    }
    if (page.children) {
      refs.push(...collectPageFiles(page.children));
    }
  }
  return refs;
}

/**
 * Validates that a page has required fields and valid structure.
 */
function validatePage(page: Page, path: string, diagnostics: Diagnostic[]): void {
  if (!page.title) {
    diagnostics.push({
      rule: Rule.ManifestValid,
      severity: 'error',
      title: 'Manifest page missing title',
      detail: `Page at "${path}" has no title.`,
    });
  }

  if (!page.slug && page.slug !== '') {
    diagnostics.push({
      rule: Rule.ManifestValid,
      severity: 'error',
      title: 'Manifest page missing slug',
      detail: `Page "${page.title || path}" has no slug.`,
    });
  }

  if (page.children) {
    for (let i = 0; i < page.children.length; i++) {
      validatePage(page.children[i], `${path}/${page.children[i].slug || i}`, diagnostics);
    }
  }
}

export async function checkManifest(input: ValidationInput): Promise<Diagnostic[]> {
  const diagnostics: Diagnostic[] = [];

  // generate manifest from filesystem
  let manifest;
  try {
    const scanned = await scanDocsFolder(input.docsPath);
    manifest = scanned.manifest;
  } catch {
    // if scanning fails entirely, other rules already cover the issues (no markdown files, etc.)
    return diagnostics;
  }

  // manifest-valid: check basic structure
  if (!manifest.version) {
    diagnostics.push({
      rule: Rule.ManifestValid,
      severity: 'error',
      title: 'Manifest missing version',
      detail: 'The generated manifest has no version field.',
    });
  }

  if (!manifest.pages || !Array.isArray(manifest.pages)) {
    diagnostics.push({
      rule: Rule.ManifestValid,
      severity: 'error',
      title: 'Manifest missing pages',
      detail: 'The generated manifest has no pages array.',
    });
    return diagnostics;
  }

  if (manifest.pages.length === 0) {
    diagnostics.push({
      rule: Rule.ManifestValid,
      severity: 'error',
      title: 'Manifest has no pages',
      detail: 'The generated manifest has an empty pages array.',
    });
    return diagnostics;
  }

  // validate each page recursively
  for (const page of manifest.pages) {
    validatePage(page, page.slug || '(root)', diagnostics);
  }

  // manifest-refs-exist: check that all file paths in the manifest point to existing files
  let entries: Dirent[] = [];
  try {
    entries = await readdir(input.docsPath, { recursive: true, withFileTypes: true });
  } catch {
    return diagnostics;
  }

  const allFiles = new Set(
    entries.filter((e) => e.isFile()).map((e) => relative(input.docsPath, join(e.parentPath, e.name)))
  );

  const pageFiles = collectPageFiles(manifest.pages);
  for (const { file, slug } of pageFiles) {
    if (!file) {
      continue;
    }
    if (!allFiles.has(file)) {
      diagnostics.push({
        rule: Rule.ManifestRefsExist,
        severity: 'error',
        title: 'Manifest references missing file',
        detail: `Page "${slug}" references "${file}" which does not exist.`,
      });
    }
  }

  return diagnostics;
}
