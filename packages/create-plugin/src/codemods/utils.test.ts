import { dirSync } from 'tmp';
import { Context } from './context.js';
import {
  addDependenciesToPackageJson,
  removeDependenciesFromPackageJson,
  flushChanges,
  formatFiles,
  readJsonFile,
  isVersionGreater,
  printChanges,
} from './utils.js';
import { join } from 'node:path';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { output } from '../utils/utils.console.js';
import { vi } from 'vitest';

describe('utils', () => {
  const tmpObj = dirSync({ unsafeCleanup: true });
  const tmpDir = join(tmpObj.name, 'cp-test-migration');

  beforeEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
    await mkdir(tmpDir, { recursive: true });

    await writeFile(join(tmpDir, 'bar.ts'), 'content');
    await writeFile(join(tmpDir, 'baz.ts'), 'content');
  });

  afterAll(() => {
    tmpObj.removeCallback();
  });

  describe('flushChanges', () => {
    it('should write files to disk', async () => {
      const context = new Context(tmpDir);
      context.addFile('file.txt', 'content');
      context.addFile('deeper/path/to/file.txt', 'content');
      flushChanges(context);
      expect(readFileSync(join(tmpDir, 'file.txt'), 'utf-8')).toBe('content');
      expect(readFileSync(join(tmpDir, 'deeper/path/to/file.txt'), 'utf-8')).toBe('content');
    });

    it('should update files on disk', async () => {
      const context = new Context(tmpDir);
      context.updateFile('bar.ts', 'new content');
      flushChanges(context);
      expect(readFileSync(join(tmpDir, 'bar.ts'), 'utf-8')).toBe('new content');
    });

    it('should delete files from disk', async () => {
      const context = new Context(tmpDir);
      context.deleteFile('bar.ts');
      flushChanges(context);
      expect(() => readFileSync(join(tmpDir, 'bar.ts'), 'utf-8')).toThrowError();
    });
  });

  describe('printChanges', () => {
    const outputMock = {
      log: vi.fn(),
      addHorizontalLine: vi.fn(),
      logSingleLine: vi.fn(),
      bulletList: vi.fn().mockReturnValue(['']),
    };

    beforeEach(async () => {
      vi.spyOn(output, 'log').mockImplementation(outputMock.log);
      vi.spyOn(output, 'addHorizontalLine').mockImplementation(outputMock.addHorizontalLine);
      vi.spyOn(output, 'logSingleLine').mockImplementation(outputMock.logSingleLine);
      vi.spyOn(output, 'bulletList').mockImplementation(outputMock.bulletList);
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it('should print changes', async () => {
      const context = new Context(tmpDir);
      context.addFile('file.txt', 'content');
      context.updateFile('baz.ts', 'new content');
      context.deleteFile('bar.ts');

      printChanges(context, 'key', 'test');

      expect(outputMock.addHorizontalLine).toHaveBeenCalledWith('gray');
      expect(outputMock.logSingleLine).toHaveBeenCalledWith('key (test)');
      expect(outputMock.bulletList).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.stringMatching(/ADD.+file\.txt/),
          expect.stringMatching(/UPDATE.+baz\.ts/),
          expect.stringMatching(/DELETE.+bar\.ts/),
        ])
      );
      expect(outputMock.log).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Changes:',
          withPrefix: false,
        })
      );
    });

    it('should print no changes', async () => {
      const context = new Context(tmpDir);

      printChanges(context, 'key', 'test');

      expect(outputMock.logSingleLine).toHaveBeenCalledWith('No changes were made');
    });
  });

  describe('formatFiles', () => {
    it('should format files', async () => {
      const context = new Context(tmpDir);
      context.addFile('file.json', '[{"foo":"bar", "baz": "qux"}]');
      context.addFile('file.txt', "file which isn't supported");
      await formatFiles(context);
      flushChanges(context);
      expect(readFileSync(join(tmpDir, 'file.json'), 'utf-8')).toBe('[{ "foo": "bar", "baz": "qux" }]\n');
      expect(readFileSync(join(tmpDir, 'file.txt'), 'utf-8')).toBe("file which isn't supported");
    });
  });

  describe('readJsonFile', () => {
    it('should read a json file', () => {
      const context = new Context(tmpDir);
      context.addFile('file.json', '{"foo":"bar", "baz": "qux"}');
      const json = readJsonFile(context, 'file.json');
      expect(json).toEqual({ foo: 'bar', baz: 'qux' });
    });

    it('should throw an error if the file does not exist', () => {
      const context = new Context(tmpDir);
      expect(() => readJsonFile(context, 'file.json')).toThrowError();
    });
  });

  describe('addDependenciesToPackageJson', () => {
    let context: Context;
    beforeEach(() => {
      context = new Context(tmpDir);
      context.addFile(
        'package.json',
        JSON.stringify({ dependencies: { react: '18.3.0' }, devDependencies: { vitest: '2.1.5' } })
      );
    });

    it("should not add dependencies if they aren't greater than the existing version", () => {
      addDependenciesToPackageJson(context, { react: '17.3.0' }, { vitest: '2.1.5' });
      expect(JSON.parse(context.getFile('package.json') || '{}')).toEqual({
        dependencies: { react: '18.3.0' },
        devDependencies: { vitest: '2.1.5' },
      });
    });

    it('should add dependencies to package.json', () => {
      addDependenciesToPackageJson(context, { 'react-dom': '19.3.0' });
      expect(JSON.parse(context.getFile('package.json') || '{}')).toEqual({
        dependencies: { react: '18.3.0', 'react-dom': '19.3.0' },
        devDependencies: { vitest: '2.1.5' },
      });
    });

    it('should update existing dependencies if they are greater than the existing version', () => {
      addDependenciesToPackageJson(context, { react: '19.3.0' });
      expect(JSON.parse(context.getFile('package.json') || '{}')).toEqual({
        dependencies: { react: '19.3.0' },
        devDependencies: { vitest: '2.1.5' },
      });
    });

    it('should add devDependencies to package.json', () => {
      addDependenciesToPackageJson(context, {}, { playwright: '2.1.5' });
      expect(JSON.parse(context.getFile('package.json') || '{}')).toEqual({
        dependencies: { react: '18.3.0' },
        devDependencies: { playwright: '2.1.5', vitest: '2.1.5' },
      });
    });

    it('should update existing devDependencies if they are greater than the existing version', () => {
      addDependenciesToPackageJson(context, {}, { vitest: '3.1.5' });
      expect(JSON.parse(context.getFile('package.json') || '{}')).toEqual({
        dependencies: { react: '18.3.0' },
        devDependencies: { vitest: '3.1.5' },
      });
    });

    it('should not update dependencies if they exist in devDependencies or dependencies and the version is lower', () => {
      addDependenciesToPackageJson(context, {}, { react: '17.0.0' });
      expect(JSON.parse(context.getFile('package.json') || '{}')).toEqual({
        dependencies: { react: '18.3.0' },
        devDependencies: { vitest: '2.1.5' },
      });
    });

    it('should update dependencies if they exist in devDependencies or dependencies and the version is greater', () => {
      addDependenciesToPackageJson(context, { vitest: '3.0.0' }, { react: '19.0.0' });
      expect(JSON.parse(context.getFile('package.json') || '{}')).toEqual({
        dependencies: { react: '19.0.0' },
        devDependencies: { vitest: '3.0.0' },
      });
    });

    it('should sort dependencies alphabetically', () => {
      addDependenciesToPackageJson(context, { 'react-dom': '19.3.0', react: '18.3.0' });
      expect(JSON.parse(context.getFile('package.json') || '{}')).toEqual({
        dependencies: { react: '18.3.0', 'react-dom': '19.3.0' },
        devDependencies: { vitest: '2.1.5' },
      });
    });
  });

  describe('removeDependenciesFromPackageJson', () => {
    let context: Context;
    beforeEach(() => {
      context = new Context(tmpDir);
      context.addFile(
        'package.json',
        JSON.stringify({
          dependencies: { react: '18.3.0', 'react-dom': '19.3.0' },
          devDependencies: { vitest: '2.1.5' },
        })
      );
    });

    it('should remove dependencies from package.json', () => {
      removeDependenciesFromPackageJson(context, ['react', 'react-dom']);
      expect(JSON.parse(context.getFile('package.json') || '{}')).toEqual({
        dependencies: {},
        devDependencies: { vitest: '2.1.5' },
      });
    });

    it('should remove devDependencies from package.json', () => {
      removeDependenciesFromPackageJson(context, [], ['vitest']);
      expect(JSON.parse(context.getFile('package.json') || '{}')).toEqual({
        dependencies: { react: '18.3.0', 'react-dom': '19.3.0' },
        devDependencies: {},
      });
    });

    it('should not remove dependencies if they are not in package.json', () => {
      removeDependenciesFromPackageJson(context, ['non-existent-package']);
      expect(JSON.parse(context.getFile('package.json') || '{}')).toEqual({
        dependencies: { react: '18.3.0', 'react-dom': '19.3.0' },
        devDependencies: { vitest: '2.1.5' },
      });
    });

    it('should not remove devDependencies if they are not in package.json', () => {
      removeDependenciesFromPackageJson(context, [], ['non-existent-package']);
      expect(JSON.parse(context.getFile('package.json') || '{}')).toEqual({
        dependencies: { react: '18.3.0', 'react-dom': '19.3.0' },
        devDependencies: { vitest: '2.1.5' },
      });
    });

    it('should remove mixed dependencies and devDependencies', () => {
      removeDependenciesFromPackageJson(context, ['react'], ['vitest']);
      expect(JSON.parse(context.getFile('package.json') || '{}')).toEqual({
        dependencies: { 'react-dom': '19.3.0' },
        devDependencies: {},
      });
    });

    it('should handle empty arrays gracefully', () => {
      removeDependenciesFromPackageJson(context, [], []);
      expect(JSON.parse(context.getFile('package.json') || '{}')).toEqual({
        dependencies: { react: '18.3.0', 'react-dom': '19.3.0' },
        devDependencies: { vitest: '2.1.5' },
      });
    });
  });

  describe('isVersionGreater', () => {
    describe('dist tag comparison', () => {
      it('should return false when incoming is "latest" and existing is "next"', () => {
        expect(isVersionGreater('latest', 'next')).toBe(false);
      });

      it('should return true when incoming is "next" and existing is "latest"', () => {
        expect(isVersionGreater('next', 'latest')).toBe(true);
      });

      it('should return true when incoming is "*" and existing is "latest"', () => {
        expect(isVersionGreater('*', 'latest')).toBe(true);
      });

      it('should return true when incoming is "*" and existing is "next"', () => {
        expect(isVersionGreater('*', 'next')).toBe(true);
      });

      it('should return false when incoming is "latest" and existing is "*"', () => {
        expect(isVersionGreater('latest', '*')).toBe(false);
      });

      it('should return false when incoming is "next" and existing is "*"', () => {
        expect(isVersionGreater('next', '*')).toBe(false);
      });

      it('should return false when both versions are the same DIST_TAG', () => {
        expect(isVersionGreater('latest', 'latest')).toBe(false);
        expect(isVersionGreater('next', 'next')).toBe(false);
        expect(isVersionGreater('*', '*')).toBe(false);
      });
    });

    describe('dist tag vs semver comparison', () => {
      it('should return true when incoming is a DIST_TAG and existing is semver', () => {
        expect(isVersionGreater('latest', '1.0.0')).toBe(true);
        expect(isVersionGreater('next', '2.1.0')).toBe(true);
        expect(isVersionGreater('*', '3.0.0')).toBe(true);
      });

      it('should return true when incoming is semver and existing is a DIST_TAG', () => {
        expect(isVersionGreater('1.0.0', 'latest')).toBe(true);
        expect(isVersionGreater('2.1.0', 'next')).toBe(true);
        expect(isVersionGreater('3.0.0', '*')).toBe(true);
      });
    });

    describe('incomparable versions', () => {
      it('should return true when incoming version cannot be parsed as semver', () => {
        expect(isVersionGreater('not-a-version', '1.0.0')).toBe(true);
        expect(isVersionGreater('invalid-version-string', '2.1.0')).toBe(true);
      });

      it('should return true when existing version cannot be parsed as semver', () => {
        expect(isVersionGreater('1.0.0', 'not-a-version')).toBe(true);
        expect(isVersionGreater('2.1.0', 'invalid-version-string')).toBe(true);
      });

      it('should return true when both versions cannot be parsed as semver', () => {
        expect(isVersionGreater('not-a-version', 'also-invalid')).toBe(true);
      });
    });

    describe('semver comparison', () => {
      it('should return true when incoming version is greater', () => {
        expect(isVersionGreater('2.0.0', '1.0.0')).toBe(true);
        expect(isVersionGreater('1.1.0', '1.0.0')).toBe(true);
        expect(isVersionGreater('1.0.1', '1.0.0')).toBe(true);
        expect(isVersionGreater('2.0.0', '1.9.9')).toBe(true);
      });

      it('should return false when incoming version is less', () => {
        expect(isVersionGreater('1.0.0', '2.0.0')).toBe(false);
        expect(isVersionGreater('1.0.0', '1.1.0')).toBe(false);
        expect(isVersionGreater('1.0.0', '1.0.1')).toBe(false);
        expect(isVersionGreater('1.9.9', '2.0.0')).toBe(false);
      });

      it('should return false when versions are equal', () => {
        expect(isVersionGreater('1.0.0', '1.0.0')).toBe(false);
        expect(isVersionGreater('2.1.3', '2.1.3')).toBe(false);
      });

      it('should handle pre-release versions correctly', () => {
        expect(isVersionGreater('2.0.0', '2.0.0-beta.1')).toBe(true);
        expect(isVersionGreater('2.0.0-alpha.2', '2.0.0-alpha.1')).toBe(true);
        expect(isVersionGreater('2.0.0-beta.1', '2.0.0-alpha.1')).toBe(true);
      });
    });

    describe('version coercion', () => {
      it('should coerce version strings to valid semver', () => {
        expect(isVersionGreater('1', '0.9.0')).toBe(true);
        expect(isVersionGreater('1.2', '1.1.0')).toBe(true);
        expect(isVersionGreater('v1.0.0', '0.9.0')).toBe(true);
      });

      it('should handle ranges and other npm version formats', () => {
        expect(isVersionGreater('^1.0.0', '0.9.0')).toBe(true);
        expect(isVersionGreater('~1.0.0', '0.9.0')).toBe(true);
        expect(isVersionGreater('>=1.0.0', '0.9.0')).toBe(true);
      });
    });
  });
});
