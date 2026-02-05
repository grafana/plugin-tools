import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import createDebug from 'debug';
import type { Manifest, MarkdownFiles } from './types.js';

const debug = createDebug('plugin-docs-renderer:loader');

/**
 * Result of loading a docs folder.
 */
export interface LoadedDocs {
  /**
   * The parsed manifest.json.
   */
  manifest: Manifest;

  /**
   * All markdown files indexed by their relative path.
   */
  files: MarkdownFiles;
}

/**
 * Recursively finds all markdown files in a directory.
 *
 * @param dir - The directory to search
 * @param baseDir - The base directory for calculating relative paths
 * @returns Array of absolute file paths
 */
async function findMarkdownFiles(dir: string, baseDir: string): Promise<string[]> {
  const files: string[] = [];
  debug('Searching for markdown files in %s', dir);

  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to read directory ${dir}: ${message}`);
  }

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      // recursively search subdirectories
      debug('Found subdirectory: %s', entry.name);
      const subFiles = await findMarkdownFiles(fullPath, baseDir);
      files.push(...subFiles);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      debug('Found markdown file: %s', entry.name);
      files.push(fullPath);
    }
  }

  debug('Found %d markdown file(s) in %s', files.length, dir);
  return files;
}

/**
 * Loads a documentation folder containing manifest.json and markdown files.
 *
 * @param rootPath - The absolute path to the docs folder
 * @returns The loaded manifest and markdown files
 * @throws {Error} If manifest.json is not found or invalid
 */
export async function loadDocsFolder(rootPath: string): Promise<LoadedDocs> {
  debug('Loading docs folder: %s', rootPath);

  // read and parse manifest.json
  const manifestPath = join(rootPath, 'manifest.json');
  debug('Reading manifest from: %s', manifestPath);

  let manifestContent;
  try {
    manifestContent = await readFile(manifestPath, 'utf-8');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to read manifest.json at ${manifestPath}: ${message}`);
  }

  let manifest;
  try {
    manifest = JSON.parse(manifestContent) as Manifest;
    debug('Parsed manifest: title=%s, version=%s, pages=%d', manifest.title, manifest.version, manifest.pages.length);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse manifest.json: ${message}`);
  }

  // find all markdown files
  let markdownPaths;
  try {
    markdownPaths = await findMarkdownFiles(rootPath, rootPath);
    debug('Found %d total markdown file(s)', markdownPaths.length);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to find markdown files in ${rootPath}: ${message}`);
  }

  // read all markdown files
  const files: MarkdownFiles = {};
  for (const filePath of markdownPaths) {
    const relativePath = relative(rootPath, filePath);
    debug('Reading markdown file: %s', relativePath);

    try {
      const content = await readFile(filePath, 'utf-8');
      files[relativePath] = content;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to read markdown file ${relativePath}: ${message}`);
    }
  }

  debug('Successfully loaded docs folder with %d file(s)', Object.keys(files).length);

  return {
    manifest,
    files,
  };
}
