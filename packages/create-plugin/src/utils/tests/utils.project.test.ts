import fs from 'node:fs';
import path from 'node:path';
import { dirSync } from 'tmp';

import { findProjectRoot, resolveProject } from '../utils.project.js';

const tmpObj = dirSync({ unsafeCleanup: true });

function writeFile(root: string, relativePath: string, content = '{}') {
  const filePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

describe('utils.project', () => {
  let projectDir: string;

  beforeEach(() => {
    projectDir = fs.mkdtempSync(path.join(tmpObj.name, 'project-'));
  });

  afterAll(() => {
    tmpObj.removeCallback();
  });

  describe('findProjectRoot', () => {
    it('returns the directory that contains .config/.cprc.json', () => {
      writeFile(projectDir, '.config/.cprc.json');

      expect(findProjectRoot(projectDir)).toBe(projectDir);
    });

    it('walks up from a nested directory', () => {
      writeFile(projectDir, '.config/.cprc.json');
      const nestedDir = path.join(projectDir, 'src', 'components');
      fs.mkdirSync(nestedDir, { recursive: true });

      expect(findProjectRoot(nestedDir)).toBe(projectDir);
    });

    it('returns undefined when no .config/.cprc.json exists up the tree', () => {
      expect(findProjectRoot(projectDir)).toBeUndefined();
    });
  });

  describe('resolveProject', () => {
    it('resolves a single plugin layout from the plugin root', () => {
      writeFile(projectDir, '.config/.cprc.json');
      writeFile(projectDir, 'src/plugin.json');

      expect(resolveProject(projectDir)).toEqual({
        root: projectDir,
        kind: 'single',
        plugins: [{ dir: '.' }],
      });
    });

    it('resolves the same root from a nested directory', () => {
      writeFile(projectDir, '.config/.cprc.json');
      const nestedDir = path.join(projectDir, 'src', 'components');
      fs.mkdirSync(nestedDir, { recursive: true });

      expect(resolveProject(nestedDir).root).toBe(projectDir);
    });

    it('falls back to the given directory when no project root is found', () => {
      expect(resolveProject(projectDir)).toEqual({
        root: projectDir,
        kind: 'single',
        plugins: [{ dir: '.' }],
      });
    });
  });
});
