import fg from 'fast-glob';
import { join } from 'node:path';

export async function findBundledJSfiles(directory: string): Promise<string[]> {
  const distDirectory = join(directory, 'dist');

  try {
    const files = await fg('**/*.js', {
      cwd: distDirectory,
      absolute: true,
      ignore: ['**/node_modules/**'],
    });
    return files;
  } catch (error) {
    throw new Error(
      `Error finding JS files in ${distDirectory}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
