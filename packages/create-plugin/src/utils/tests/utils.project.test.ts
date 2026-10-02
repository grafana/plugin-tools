import fs from 'node:fs';
import path from 'node:path';
import { dirSync } from 'tmp';

import {
  checkGenerateLocation,
  findProjectRoot,
  findWorkspaceRoot,
  getWorkspaceGlobs,
  resolveProject,
} from '../utils.project.js';

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

  describe('findWorkspaceRoot', () => {
    it('finds a package.json that declares workspaces', () => {
      writeFile(projectDir, 'package.json', JSON.stringify({ workspaces: ['packages/*'] }));
      const nestedDir = path.join(projectDir, 'packages', 'a');
      fs.mkdirSync(nestedDir, { recursive: true });
      writeFile(nestedDir, 'package.json', JSON.stringify({ name: 'a' }));

      expect(findWorkspaceRoot(nestedDir)).toBe(projectDir);
    });

    it('finds a pnpm-workspace.yaml', () => {
      writeFile(projectDir, 'pnpm-workspace.yaml', 'packages:\n  - packages/*\n');

      expect(findWorkspaceRoot(projectDir)).toBe(projectDir);
    });

    it('returns undefined outside a workspace', () => {
      writeFile(projectDir, 'package.json', JSON.stringify({ name: 'not-a-workspace' }));

      expect(findWorkspaceRoot(projectDir)).toBeUndefined();
    });
  });

  describe('checkGenerateLocation', () => {
    it('allows generating in a directory outside any project', () => {
      expect(checkGenerateLocation(projectDir).error).toBeUndefined();
    });

    it('refuses to generate inside an existing plugin', () => {
      writeFile(projectDir, '.config/.cprc.json');
      writeFile(projectDir, 'src/plugin.json');
      const nestedDir = path.join(projectDir, 'src', 'components');
      fs.mkdirSync(nestedDir, { recursive: true });

      expect(checkGenerateLocation(projectDir).error?.title).toMatch(/inside a plugin/i);
      expect(checkGenerateLocation(nestedDir).error?.title).toMatch(/inside a plugin/i);
    });

    it('refuses to generate inside a workspace create-plugin did not scaffold', () => {
      writeFile(projectDir, 'package.json', JSON.stringify({ private: true, workspaces: ['apps/*'] }));

      expect(checkGenerateLocation(projectDir).error?.title).toMatch(/workspace/i);
    });

    it('allows generating in a create-plugin monorepo', () => {
      writeFile(projectDir, 'package.json', JSON.stringify({ private: true, workspaces: ['.config', 'plugins/*'] }));
      writeFile(projectDir, '.config/.cprc.json');

      const result = checkGenerateLocation(projectDir);

      expect(result.error).toBeUndefined();
      expect(result.monorepoRoot).toBe(projectDir);
    });
  });

  describe('getWorkspaceGlobs', () => {
    it('reads the workspaces array from package.json', () => {
      writeFile(projectDir, 'package.json', JSON.stringify({ workspaces: ['.config', 'plugins/*'] }));

      expect(getWorkspaceGlobs(projectDir)).toEqual(['.config', 'plugins/*']);
    });

    it('reads the yarn workspaces object form', () => {
      writeFile(projectDir, 'package.json', JSON.stringify({ workspaces: { packages: ['plugins/*'] } }));

      expect(getWorkspaceGlobs(projectDir)).toEqual(['plugins/*']);
    });

    it('reads pnpm-workspace.yaml', () => {
      writeFile(projectDir, 'package.json', JSON.stringify({ name: 'root' }));
      writeFile(projectDir, 'pnpm-workspace.yaml', 'packages:\n  - .config\n  - plugins/*\n');

      expect(getWorkspaceGlobs(projectDir)).toEqual(['.config', 'plugins/*']);
    });

    it('returns an empty list when nothing declares workspaces', () => {
      writeFile(projectDir, 'package.json', JSON.stringify({ name: 'root' }));

      expect(getWorkspaceGlobs(projectDir)).toEqual([]);
    });
  });

  describe('resolveProject in a monorepo', () => {
    function createMonorepo() {
      writeFile(projectDir, 'package.json', JSON.stringify({ workspaces: ['.config', 'plugins/*', 'packages/*'] }));
      writeFile(projectDir, '.config/.cprc.json');
      writeFile(projectDir, '.config/package.json', JSON.stringify({ name: '@grafana/create-plugin-configs' }));
      writeFile(projectDir, 'plugins/a/package.json');
      writeFile(projectDir, 'plugins/a/src/plugin.json', JSON.stringify({ id: 'myorg-a-panel' }));
      writeFile(projectDir, 'plugins/b/package.json');
      writeFile(projectDir, 'plugins/b/src/plugin.json', JSON.stringify({ id: 'myorg-b-app' }));
      writeFile(projectDir, 'packages/shared/package.json');
    }

    it('lists every workspace that contains a plugin', () => {
      createMonorepo();

      expect(resolveProject(projectDir)).toEqual({
        root: projectDir,
        kind: 'monorepo',
        plugins: [
          { dir: 'plugins/a', id: 'myorg-a-panel' },
          { dir: 'plugins/b', id: 'myorg-b-app' },
        ],
      });
    });

    it('resolves the monorepo from inside a plugin', () => {
      createMonorepo();

      const project = resolveProject(path.join(projectDir, 'plugins', 'b', 'src'));

      expect(project.root).toBe(projectDir);
      expect(project.kind).toBe('monorepo');
    });

    it('treats a plugin whose only workspace is .config as a single plugin', () => {
      writeFile(projectDir, 'package.json', JSON.stringify({ workspaces: ['.config'] }));
      writeFile(projectDir, '.config/.cprc.json');
      writeFile(projectDir, 'src/plugin.json', JSON.stringify({ id: 'myorg-single-panel' }));

      expect(resolveProject(projectDir)).toEqual({
        root: projectDir,
        kind: 'single',
        plugins: [{ dir: '.', id: 'myorg-single-panel' }],
      });
    });
  });
});
