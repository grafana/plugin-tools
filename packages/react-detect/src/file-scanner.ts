import fg from 'fast-glob';
import { join } from 'node:path';

export async function findSourceMapFiles(directory: string): Promise<string[]> {
  const distDirectory = join(directory, 'dist');

  try {
    const files = await fg('**/*.js.map', {
      cwd: distDirectory,
      absolute: true,
      ignore: ['**/node_modules/**'],
    });
    return files;
  } catch (error) {
    throw new Error(
      `Error finding source map files in ${distDirectory}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
