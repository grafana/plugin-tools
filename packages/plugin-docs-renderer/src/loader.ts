import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import type { Manifest, MarkdownFiles } from './types.js';

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
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      // recursively search subdirectories
      const subFiles = await findMarkdownFiles(fullPath, baseDir);
      files.push(...subFiles);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }

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
  // read and parse manifest.json
  const manifestPath = join(rootPath, 'manifest.json');
  const manifestContent = await readFile(manifestPath, 'utf-8');
  const manifest = JSON.parse(manifestContent) as Manifest;

  // find all markdown files
  const markdownPaths = await findMarkdownFiles(rootPath, rootPath);

  // read all markdown files
  const files: MarkdownFiles = {};
  for (const filePath of markdownPaths) {
    const relativePath = relative(rootPath, filePath);
    const content = await readFile(filePath, 'utf-8');
    files[relativePath] = content;
  }

  return {
    manifest,
    files,
  };
}
