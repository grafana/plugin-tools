import { existsSync } from 'node:fs';
import path from 'node:path';

interface FindUpSyncOptions {
  cwd?: string;
}

export function findUpSync(name: string | string[], options: FindUpSyncOptions = {}): string | undefined {
  const names = Array.isArray(name) ? name : [name];
  let currentDir = path.resolve(options.cwd ?? process.cwd());
  let previousDir: string | undefined;

  while (currentDir !== previousDir) {
    for (const candidateName of names) {
      const candidatePath = path.join(currentDir, candidateName);
      if (existsSync(candidatePath)) {
        return candidatePath;
      }
    }
    previousDir = currentDir;
    currentDir = path.dirname(currentDir);
  }

  return undefined;
}
