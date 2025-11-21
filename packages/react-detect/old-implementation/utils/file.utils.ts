import fs from 'fs';
import path from 'path';
import fg from 'fast-glob';
import type { Match } from '../types.js';

/**
 * Utility functions for file operations
 */

/**
 * Find all JavaScript files in a directory
 *
 * @param directory Directory to search
 * @returns Array of absolute file paths
 */
export async function findJsFiles(directory: string): Promise<string[]> {
  try {
    const files = await fg.glob('**/*.js', {
      cwd: directory,
      absolute: true,
      ignore: ['**/node_modules/**'],
    });
    return files;
  } catch (error) {
    console.error(`Error finding JS files in ${directory}:`, (error as Error).message);
    return [];
  }
}

/**
 * Search for a pattern in a file and return matches with context
 *
 * @param filePath Path to the file to search
 * @param pattern Regex pattern to search for
 * @returns Array of matches with line/column/context
 */
export function searchInFile(filePath: string, pattern: string): Match[] {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const matches: Match[] = [];
    const regex = new RegExp(pattern, 'g');

    lines.forEach((line, lineIndex) => {
      // Reset regex lastIndex for each line
      regex.lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = regex.exec(line)) !== null) {
        const column = match.index;
        const contextStart = Math.max(0, column - 50);
        const contextEnd = Math.min(line.length, column + pattern.length + 50);
        const context = line.substring(contextStart, contextEnd);

        matches.push({
          line: lineIndex + 1, // 1-indexed
          column: column,
          matched: match[0],
          context: context.trim(),
        });
      }
    });

    return matches;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, (error as Error).message);
    return [];
  }
}

/**
 * Check if a file exists
 *
 * @param filePath Path to check
 * @returns True if file exists
 */
export function fileExists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

/**
 * Check if a directory exists
 *
 * @param dirPath Path to check
 * @returns True if directory exists
 */
export function directoryExists(dirPath: string): boolean {
  try {
    return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Get the plugin root directory by searching up for src/plugin.json
 *
 * @param startPath Starting path (defaults to cwd)
 * @returns Plugin root directory or null if not found
 */
export function findPluginRoot(startPath: string = process.cwd()): string | null {
  let currentPath = path.resolve(startPath);

  while (currentPath !== path.parse(currentPath).root) {
    const pluginJsonPath = path.join(currentPath, 'src', 'plugin.json');
    if (fileExists(pluginJsonPath)) {
      return currentPath;
    }
    currentPath = path.dirname(currentPath);
  }

  return null;
}

/**
 * Shorten a file path by removing intermediate directories
 * Useful for making paths more readable in reports
 *
 * @param fullPath Full absolute path
 * @param basePath Base path to make relative from
 * @returns Shortened relative path
 */
export function shortenPath(fullPath: string, basePath: string): string {
  const relativePath = path.relative(basePath, fullPath);
  const pathParts = relativePath.split(path.sep);

  // Find and remove -extracted directory portions
  const extractedIndex = pathParts.findIndex((part) => part.includes('-extracted'));
  if (extractedIndex !== -1 && pathParts.length > extractedIndex + 1) {
    return [pathParts[0], ...pathParts.slice(extractedIndex + 2)].join(path.sep);
  }

  return relativePath;
}
