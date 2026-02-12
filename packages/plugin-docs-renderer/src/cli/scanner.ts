import { readFile } from 'node:fs/promises';
import { join, relative, parse, sep } from 'node:path';
import globby from 'globby';
import GithubSlugger from 'github-slugger';
import matter from 'gray-matter';
import createDebug from 'debug';
import type { Manifest, Page, MarkdownFiles, Frontmatter } from '../types.js';

const debug = createDebug('plugin-docs-renderer:scanner');

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
   * Raw markdown content (without frontmatter).
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
  const slugger = new GithubSlugger();
  const parsed = parse(filePath);

  // build slug parts by slugifying each segment separately
  const parts: string[] = [];

  if (parsed.dir) {
    const dirParts = parsed.dir.split(sep);
    parts.push(...dirParts.map((part) => slugger.slug(part)));
  }

  parts.push(slugger.slug(parsed.name));

  return parts.join('/');
}

/**
 * Recursively scans a directory for markdown files and parses their frontmatter.
 *
 * @param docsPath - Absolute path to the docs folder
 * @returns Array of scanned files with frontmatter
 */
async function scanMarkdownFiles(docsPath: string): Promise<ScannedFile[]> {
  debug('Scanning for markdown files in: %s', docsPath);

  // find all .md files recursively
  const pattern = join(docsPath, '**/*.md');
  const filePaths = await globby(pattern, {
    ignore: ['**/node_modules/**', '**/dist/**'],
  });

  debug('Found %d markdown file(s)', filePaths.length);

  const scannedFiles: ScannedFile[] = [];

  for (const absolutePath of filePaths) {
    const relativePath = relative(docsPath, absolutePath);

    // read and parse the file
    const fileContent = await readFile(absolutePath, 'utf-8');

    let parsed;
    try {
      parsed = matter(fileContent);
    } catch (error) {
      debug('Failed to parse frontmatter for %s: %s', relativePath, error);
      continue;
    }

    // validate frontmatter has required fields
    const frontmatter = parsed.data as Partial<Frontmatter>;
    if (!frontmatter.title || !frontmatter.description) {
      console.warn(`Warning: ${relativePath} missing required frontmatter fields (title, description)`);
      continue;
    }

    scannedFiles.push({
      absolutePath,
      relativePath,
      frontmatter: frontmatter as Frontmatter,
      content: fileContent, // store original content with frontmatter
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

  // convert children to array and sort by sidebar_position, then alphabetically by name
  const childEntries = Array.from(node.children.entries());
  const sortedEntries = childEntries.sort((a, b) => {
    const posA = a[1].file?.frontmatter.sidebar_position ?? Infinity;
    const posB = b[1].file?.frontmatter.sidebar_position ?? Infinity;
    if (posA !== posB) {
      return posA - posB;
    }
    return a[0].localeCompare(b[0]);
  });

  for (const [name, child] of sortedEntries) {
    if (child.file) {
      // it's a markdown file
      const page: Page = {
        title: child.file.frontmatter.title,
        slug: child.file.frontmatter.slug || generateSlug(child.file.relativePath),
        file: child.file.relativePath,
      };

      // if this file has children (folder with same name), add them
      if (child.children.size > 0) {
        page.children = treeToPages(child);
      }

      pages.push(page);
    } else if (child.children.size > 0) {
      // it's a directory without a file - create category
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
