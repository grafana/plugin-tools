import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { vi } from 'vitest';
import { findUpSync } from './index.js';

describe('findUpSync', () => {
  const tempDirs: string[] = [];

  function createFixtureTree(files: string[]): string {
    const rootDir = realpathSync(mkdtempSync(path.join(os.tmpdir(), 'find-up-test-')));
    tempDirs.push(rootDir);
    for (const file of files) {
      const filePath = path.join(rootDir, file);
      mkdirSync(path.dirname(filePath), { recursive: true });
      writeFileSync(filePath, '');
    }
    return rootDir;
  }

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(() => {
    tempDirs.forEach((dir) => rmSync(dir, { recursive: true, force: true }));
  });

  it('should find a file in the starting directory', () => {
    const rootDir = createFixtureTree(['package.json']);

    expect(findUpSync('package.json', { cwd: rootDir })).toBe(path.join(rootDir, 'package.json'));
  });

  it('should find a file in a parent directory', () => {
    const rootDir = createFixtureTree(['package.json', 'a/b/c/.gitkeep']);

    expect(findUpSync('package.json', { cwd: path.join(rootDir, 'a/b/c') })).toBe(path.join(rootDir, 'package.json'));
  });

  it('should return the closest match when the file exists in multiple parent directories', () => {
    const rootDir = createFixtureTree(['package.json', 'a/package.json', 'a/b/.gitkeep']);

    expect(findUpSync('package.json', { cwd: path.join(rootDir, 'a/b') })).toBe(
      path.join(rootDir, 'a', 'package.json')
    );
  });

  it('should check all names in a directory before moving up to the parent', () => {
    const rootDir = createFixtureTree(['yarn.lock', 'a/package-lock.json']);

    expect(findUpSync(['yarn.lock', 'pnpm-lock.yaml', 'package-lock.json'], { cwd: path.join(rootDir, 'a') })).toBe(
      path.join(rootDir, 'a', 'package-lock.json')
    );
  });

  it('should respect the order of names within the same directory', () => {
    const rootDir = createFixtureTree(['yarn.lock', 'package-lock.json']);

    expect(findUpSync(['yarn.lock', 'pnpm-lock.yaml', 'package-lock.json'], { cwd: rootDir })).toBe(
      path.join(rootDir, 'yarn.lock')
    );
  });

  it('should return undefined when no match is found', () => {
    const rootDir = createFixtureTree(['.gitkeep']);

    expect(findUpSync('file-that-does-not-exist.json', { cwd: rootDir })).toBeUndefined();
  });

  it('should ignore directories that match the name and only return files', () => {
    const rootDir = createFixtureTree(['package.json', 'a/.gitkeep']);
    // A directory named like the candidate must be skipped, mirroring find-up's type: 'file' default.
    mkdirSync(path.join(rootDir, 'a', 'package.json'));

    expect(findUpSync('package.json', { cwd: path.join(rootDir, 'a') })).toBe(path.join(rootDir, 'package.json'));
  });

  it('should default to the current working directory', () => {
    const rootDir = createFixtureTree(['package.json', 'a/.gitkeep']);
    vi.spyOn(process, 'cwd').mockReturnValue(path.join(rootDir, 'a'));

    expect(findUpSync('package.json')).toBe(path.join(rootDir, 'package.json'));
  });
});
