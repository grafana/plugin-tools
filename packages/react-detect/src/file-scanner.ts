import { glob } from 'tinyglobby';

export async function findSourceMapFiles(distDir: string): Promise<string[]> {
  try {
    const files = await glob('**/*.js.map', {
      cwd: distDir,
      absolute: true,
      ignore: ['**/node_modules/**'],
    });
    return files;
  } catch (error) {
    throw new Error(
      `Error finding source map files in "${distDir}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
