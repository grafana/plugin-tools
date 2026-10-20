import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import type { Manifest, Page } from '@grafana/plugin-docs-parser';
import { scanDocsFolder } from '../../scanner.js';
import { type Diagnostic, type ValidationInput, Rule } from '../types.js';

export const MANIFEST_FILE = 'manifest.json';

const SUPPORTED_MANIFEST_VERSION = '1';

// how many differing pages a single diagnostic spells out before it summarises the rest
const MAX_LISTED = 5;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * The problems with one manifest page against what GCOM and the catalog read: GCOM drops a manifest
 * whose pages lack a string title, slug or file and the catalog renders each page from `content`.
 */
function pageProblems(page: unknown): string[] {
  if (!isRecord(page)) {
    return ['is not an object'];
  }

  const problems: string[] = [];
  for (const key of ['title', 'slug', 'file']) {
    if (typeof page[key] !== 'string') {
      problems.push(`"${key}" is not a string`);
    }
  }

  if (typeof page.file === 'string' && page.file !== '') {
    if (typeof page.content !== 'string') {
      problems.push('"content" is not a string');
    }
    if (!isRecord(page.frontmatter)) {
      problems.push('"frontmatter" is not an object');
    }
  }

  if (page.headings !== undefined) {
    const valid =
      Array.isArray(page.headings) &&
      page.headings.every(
        (h) => isRecord(h) && typeof h.text === 'string' && typeof h.level === 'number' && typeof h.id === 'string'
      );
    if (!valid) {
      problems.push('"headings" is not a list of { text, level, id }');
    }
  }

  if (page.children !== undefined && !Array.isArray(page.children)) {
    problems.push('"children" is not an array');
  }

  return problems;
}

function checkPages(pages: unknown[], path: string, diagnostics: Diagnostic[]): void {
  pages.forEach((page, index) => {
    const pagePath = `${path}[${index}]`;
    const problems = pageProblems(page);
    if (problems.length > 0) {
      const label = isRecord(page) && typeof page.file === 'string' && page.file ? ` (${page.file})` : '';
      diagnostics.push({
        rule: Rule.DistManifestValid,
        severity: 'error',
        title: `Manifest page ${pagePath}${label} is invalid`,
        detail: `${MANIFEST_FILE} page ${pagePath} ${problems.join(' and ')}. The catalog can't use a manifest like this. Run the docs build again.`,
      });
    }
    if (isRecord(page) && Array.isArray(page.children)) {
      checkPages(page.children, `${pagePath}.children`, diagnostics);
    }
  });
}

function checkManifestShape(manifest: unknown): Diagnostic[] {
  if (!isRecord(manifest) || !Array.isArray(manifest.pages) || manifest.pages.length === 0) {
    return [
      {
        rule: Rule.DistManifestValid,
        severity: 'error',
        title: 'Manifest has no pages',
        detail: `${MANIFEST_FILE} must be an object with a non-empty "pages" array. Run the docs build again.`,
      },
    ];
  }

  const diagnostics: Diagnostic[] = [];

  if (manifest.version !== SUPPORTED_MANIFEST_VERSION) {
    diagnostics.push({
      rule: Rule.DistManifestValid,
      severity: 'warning',
      title: 'Unknown manifest version',
      detail: `${MANIFEST_FILE} has version ${JSON.stringify(manifest.version)} but this CLI writes version "${SUPPORTED_MANIFEST_VERSION}". Rebuild the docs with the same version of the docs CLI as the rest of your plugin build.`,
    });
  }

  checkPages(manifest.pages, 'pages', diagnostics);

  // the catalog opens the docs on the root page, found by its `index` slug
  const hasRootPage = manifest.pages.some((p) => isRecord(p) && p.slug === 'index' && p.file);
  if (!hasRootPage) {
    diagnostics.push({
      rule: Rule.DistManifestValid,
      severity: 'error',
      title: 'Manifest has no root page',
      detail: `${MANIFEST_FILE} has no top-level page with the slug "index" and a file. The catalog shows no Documentation tab without it. Add an index.md to the root of your docs folder.`,
    });
  }

  return diagnostics;
}

interface FlatPage {
  key: string;
  parent: string;
  page: Page;
}

/**
 * Pages in a tree by key: the page's file or, for a folder without an index.md, a key built from its
 * position. Keyed rather than ordered, so a manifest built on another operating system still compares equal.
 */
function flatten(pages: Page[], parent: string, into: Map<string, FlatPage>): Map<string, FlatPage> {
  for (const page of pages) {
    const key = page.file || `category:${parent}/${page.slug}`;
    into.set(key, { key, parent, page });
    if (page.children) {
      flatten(page.children, key, into);
    }
  }
  return into;
}

// values that went through a JSON round trip, which is what a manifest read from disk has been through
function viaJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value ?? null));
}

function summarise(items: string[]): string {
  const listed = items.slice(0, MAX_LISTED).join(', ');
  return items.length > MAX_LISTED ? `${listed} and ${items.length - MAX_LISTED} more` : listed;
}

async function checkMatchesDocs(docsPath: string, manifest: Manifest): Promise<Diagnostic[]> {
  let scanned: Manifest;
  try {
    scanned = (await scanDocsFolder(docsPath)).manifest;
  } catch {
    // no readable pages at all: has-markdown-files reports it
    return [];
  }

  const inManifest = flatten(manifest.pages, '', new Map());
  const inDocs = flatten(scanned.pages, '', new Map());
  const diagnostics: Diagnostic[] = [];

  const pageFiles = (pages: Map<string, FlatPage>) => [...pages.values()].filter((p) => p.page.file).map((p) => p.key);
  const manifestFiles = pageFiles(inManifest);
  const docsFiles = pageFiles(inDocs);

  const extra = manifestFiles.filter((file) => !inDocs.has(file));
  const missing = docsFiles.filter((file) => !inManifest.has(file));
  if (extra.length > 0) {
    diagnostics.push({
      rule: Rule.DistManifestMatchesDocs,
      severity: 'error',
      title: 'Manifest lists pages that are not in the built docs',
      detail: `${MANIFEST_FILE} has ${summarise(extra)}, which the built docs folder does not contain. The catalog would show pages that were never validated. Run the docs build again.`,
    });
  }
  if (missing.length > 0) {
    diagnostics.push({
      rule: Rule.DistManifestMatchesDocs,
      severity: 'error',
      title: 'Built docs have pages that the manifest leaves out',
      detail: `${summarise(missing)} ${missing.length === 1 ? 'is' : 'are'} in the built docs folder but not in ${MANIFEST_FILE}, so the catalog won't show ${missing.length === 1 ? 'it' : 'them'}. Run the docs build again.`,
    });
  }

  const different = docsFiles.filter((file) => {
    const fromManifest = inManifest.get(file)?.page;
    const fromDocs = inDocs.get(file)?.page;
    return (
      fromManifest &&
      fromDocs &&
      (fromManifest.content !== fromDocs.content ||
        !isDeepStrictEqual(viaJson(fromManifest.frontmatter), viaJson(fromDocs.frontmatter)))
    );
  });
  for (const file of different) {
    diagnostics.push({
      rule: Rule.DistManifestMatchesDocs,
      severity: 'error',
      file,
      title: 'Manifest content differs from the built page',
      detail: `The content or frontmatter of "${file}" in ${MANIFEST_FILE} is not what the file in the built docs says. The catalog renders the manifest, so what was validated is not what readers would see. Run the docs build again.`,
    });
  }

  // derived by the CLI's scanner, which can change between versions, so differences warn instead
  const stale: string[] = [];
  for (const [key, expected] of inDocs) {
    const actual = inManifest.get(key);
    if (
      actual &&
      (actual.page.slug !== expected.page.slug ||
        actual.parent !== expected.parent ||
        !isDeepStrictEqual(viaJson(actual.page.headings), viaJson(expected.page.headings)))
    ) {
      stale.push(key);
    }
  }
  const categoriesDiffer =
    [...inManifest.keys()].some((key) => key.startsWith('category:') && !inDocs.has(key)) ||
    [...inDocs.keys()].some((key) => key.startsWith('category:') && !inManifest.has(key));
  if (categoriesDiffer) {
    stale.push('folders without an index.md');
  }
  if (stale.length > 0) {
    diagnostics.push({
      rule: Rule.DistManifestStale,
      severity: 'warning',
      title: 'Manifest was built by a different version of the docs CLI',
      detail: `The slugs, headings or page tree of ${summarise(stale)} in ${MANIFEST_FILE} differ from what this version of the docs CLI generates. Update @grafana/plugin-docs-cli and run the docs build again.`,
    });
  }

  return diagnostics;
}

/**
 * Checks that the built docs are what the catalog will use. Only runs with `validate --dist`.
 *
 * The page rules run on the built folder, so the markdown and assets are checked as they ship. This
 * rule covers the manifest, which GCOM stores and the catalog renders pages from instead of the
 * markdown files.
 */
export async function checkDistManifest(input: ValidationInput): Promise<Diagnostic[]> {
  if (input.mode !== 'dist') {
    return [];
  }

  let raw: string;
  try {
    raw = await readFile(join(input.docsPath, MANIFEST_FILE), 'utf-8');
  } catch (err) {
    const code = (err as NodeJS.ErrnoException | undefined)?.code;
    const docsFolderExists = await stat(input.docsPath).then(
      (st) => st.isDirectory(),
      () => false
    );
    // a docs folder that is missing altogether is reported by docs-path-exists
    if (!docsFolderExists) {
      return [];
    }
    return [
      {
        rule: Rule.DistManifestExists,
        severity: 'error',
        title: `Built docs have no ${MANIFEST_FILE}`,
        detail: `${MANIFEST_FILE} could not be read from the built docs folder (${code ?? 'unknown error'}). Without it the catalog shows no Documentation tab. Run the docs build after the plugin build, because the plugin build clears the dist folder.`,
      },
    ];
  }

  let manifest: unknown;
  try {
    manifest = JSON.parse(raw);
  } catch (err) {
    return [
      {
        rule: Rule.DistManifestExists,
        severity: 'error',
        title: `${MANIFEST_FILE} is not valid JSON`,
        detail: `${MANIFEST_FILE} could not be parsed: ${err instanceof Error ? err.message : 'parse error'}. Run the docs build again.`,
      },
    ];
  }

  const shape = checkManifestShape(manifest);
  if (shape.some((d) => d.severity === 'error')) {
    return shape;
  }

  return [...shape, ...(await checkMatchesDocs(input.docsPath, manifest as Manifest))];
}
