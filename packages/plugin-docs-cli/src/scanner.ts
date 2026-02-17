import { readFile, readdir } from 'node:fs/promises';
import { join, relative, parse, sep } from 'node:path';
import GithubSlugger from 'github-slugger';
import matter from 'gray-matter';
import createDebug from 'debug';
import type { Manifest, Page, MarkdownFiles, Frontmatter } from '@grafana/plugin-docs-parser';

const debug = createDebug('plugin-docs-cli:scanner');

/**
 * A scanned markdown file with parsed frontmatter.
 */
interface ScannedFile {
  /**
   * Absolute path to the file.
   */
  absolutePath: string;

  /**
   * Relative path from docs root (e.g., "01-overview.md" or "config/01-auth.md").
   */
  relativePath: string;

  /**
   * Parsed frontmatter metadata.
   */
  frontmatter: Frontmatter;

  /**
   * Markdown body (frontmatter stripped).
   */
  content: string;
}

/**
 * Result of scanning a docs folder.
 */
export interface ScannedDocs {
  /**
   * Generated manifest from filesystem structure.
   */
  manifest: Manifest;

  /**
   * All markdown files indexed by their relative path.
   */
  files: MarkdownFiles;
}

/**
 * Generates a URL slug from a file path.
 * Examples:
 *   "overview.md" → "overview"
 *   "config/auth.md" → "config/auth"
 */
function generateSlug(filePath: string): string {
  const parsed = parse(filePath);

  // fresh slugger per segment to avoid uniqueness suffixes (e.g. config/config → config/config-1)
  const slugSegment = (segment: string): string => new GithubSlugger().slug(segment);

  const parts: string[] = [];

  if (parsed.dir) {
    parts.push(...parsed.dir.split(sep).map(slugSegment));
  }

  parts.push(slugSegment(parsed.name));

  return parts.join('/');
}

/**
 * Normalizes and validates a custom slug from frontmatter.
 * Returns null when the slug is unsafe or malformed.
 */
function normalizeCustomSlug(rawSlug: string): string | null {
  const trimmed = rawSlug.trim().replace(/^\/+|\/+$/g, '');

  if (!trimmed) {
    return null;
  }

  // Restrict to route-safe characters only.
  if (!/^[A-Za-z0-9/_-]+$/.test(trimmed)) {
    return null;
  }

  // Disallow traversal-like and empty segments.
  const segments = trimmed.split('/');
  if (segments.some((segment) => !segment || segment === '.' || segment === '..')) {
    return null;
  }

  return trimmed;
}

/**
 * Recursively scans a directory for markdown files and parses their frontmatter.
 *
 * @param docsPath - Absolute path to the docs folder
 * @returns Array of scanned files with frontmatter
 */
async function scanMarkdownFiles(docsPath: string): Promise<ScannedFile[]> {
  debug('Scanning for markdown files in: %s', docsPath);

  // find all .md files recursively using Node's built-in readdir
  let entries: string[];
  try {
    entries = await readdir(docsPath, { recursive: true });
  } catch {
    return [];
  }
  const filePaths = entries
    .filter((entry) => {
      if (!entry.endsWith('.md')) {
        return false;
      }
      return !entry.includes('node_modules') && !entry.includes('dist');
    })
    .map((entry) => join(docsPath, entry));

  debug('Found %d markdown file(s)', filePaths.length);

  const scannedFiles: ScannedFile[] = [];

  for (const absolutePath of filePaths) {
    const relativePath = relative(docsPath, absolutePath);

    // read and parse the file
    const fileContent = await readFile(absolutePath, 'utf-8');
    const parsed = matter(fileContent);

    // validate frontmatter has required fields with correct types
    const frontmatter = parsed.data as Partial<Frontmatter>;
    if (
      typeof frontmatter.title !== 'string' ||
      typeof frontmatter.description !== 'string' ||
      typeof frontmatter.sidebar_position !== 'number'
    ) {
      console.warn(
        `Warning: ${relativePath} missing or invalid required frontmatter fields (title: string, description: string, sidebar_position: number)`
      );
      continue;
    }

    scannedFiles.push({
      absolutePath,
      relativePath,
      frontmatter: frontmatter as Frontmatter,
      content: parsed.content, // markdown body without frontmatter
    });
  }

  debug('Successfully scanned %d file(s) with valid frontmatter', scannedFiles.length);
  return scannedFiles;
}

/**
 * Tree node for building hierarchical structure.
 */
interface TreeNode {
  name: string;
  file?: ScannedFile;
  children: Map<string, TreeNode>;
}

function buildTree(scannedFiles: ScannedFile[]): TreeNode {
  const root: TreeNode = { name: '', children: new Map() };

  for (const file of scannedFiles) {
    const parts = file.relativePath.split(sep);
    let current = root;

    // navigate/create tree structure
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current.children.has(part)) {
        current.children.set(part, { name: part, children: new Map() });
      }
      current = current.children.get(part)!;
    }

    // add the file at the leaf
    const fileName = parts[parts.length - 1];
    current.children.set(fileName, {
      name: fileName,
      file,
      children: new Map(),
    });
  }

  return root;
}

// converts a tree node to Page array (recursively).
function treeToPages(node: TreeNode): Page[] {
  const pages: Page[] = [];

  // Promote index.md files: if a directory has an index.md child,
  // use it as the directory's own file so its sidebar_position is
  // used for sorting and its frontmatter provides the page metadata.
  const childEntries = Array.from(node.children.entries());
  for (const [, child] of childEntries) {
    if (!child.file && child.children.has('index.md')) {
      const indexNode = child.children.get('index.md')!;
      if (indexNode.file) {
        child.file = indexNode.file;
        child.children.delete('index.md');
      }
    }
  }

  // convert children to array and sort by sidebar_position
  const sortedEntries = childEntries.sort(
    (a, b) =>
      (a[1].file?.frontmatter.sidebar_position ?? Infinity) - (b[1].file?.frontmatter.sidebar_position ?? Infinity)
  );

  for (const [name, child] of sortedEntries) {
    if (child.file) {
      // it's a markdown file (or a directory with a promoted index.md)
      const parsed = parse(child.file.relativePath);
      const isIndex = parsed.name === 'index' && parsed.dir !== '';
      const generatedSlug = isIndex ? generateSlug(parsed.dir) : generateSlug(child.file.relativePath);
      const customSlug = child.file.frontmatter.slug ? normalizeCustomSlug(child.file.frontmatter.slug) : null;

      if (child.file.frontmatter.slug && !customSlug) {
        console.warn(
          `Warning: ${child.file.relativePath} contains an invalid frontmatter slug and will use generated slug instead`
        );
      }

      const page: Page = {
        title: child.file.frontmatter.title,
        slug: customSlug || generatedSlug,
        file: child.file.relativePath,
      };

      // if this file has children (folder with same name), add them
      if (child.children.size > 0) {
        page.children = treeToPages(child);
      }

      pages.push(page);
    } else if (child.children.size > 0) {
      // it's a directory without an index file - create category
      const page: Page = {
        title: name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, ' '),
        slug: name,
        file: '',
        children: treeToPages(child),
      };
      pages.push(page);
    }
  }

  return pages;
}

/**
 * Builds a hierarchical manifest from scanned files based on folder structure.
 *
 * @param scannedFiles - Array of scanned markdown files
 * @returns Generated manifest
 */
function buildManifest(scannedFiles: ScannedFile[]): Manifest {
  debug('Building manifest from %d file(s)', scannedFiles.length);

  // build tree structure from file paths
  const tree = buildTree(scannedFiles);

  // convert tree to pages array
  const pages = treeToPages(tree);

  const manifest: Manifest = {
    version: '1',
    title: 'Plugin Documentation',
    pages,
  };

  debug('Generated manifest with %d top-level page(s)', pages.length);
  return manifest;
}

/**
 * Scans a docs folder and generates a manifest from the filesystem structure.
 *
 * @param docsPath - Absolute path to the docs folder
 * @returns Scanned docs with generated manifest and file contents
 */
export async function scanDocsFolder(docsPath: string): Promise<ScannedDocs> {
  debug('Starting scan of docs folder: %s', docsPath);

  // scan all markdown files
  const scannedFiles = await scanMarkdownFiles(docsPath);

  if (scannedFiles.length === 0) {
    throw new Error(`No valid markdown files found in ${docsPath}`);
  }

  // build manifest from scanned files
  const manifest = buildManifest(scannedFiles);

  // create files map
  const files: MarkdownFiles = {};
  for (const file of scannedFiles) {
    files[file.relativePath] = file.content;
  }

  debug('Scan complete: %d files, %d pages', Object.keys(files).length, manifest.pages.length);

  return {
    manifest,
    files,
  };
}
