import { dirSync } from 'tmp';
import { Context } from './context.js';
import { addDependenciesToPackageJson, flushChanges, formatFiles, printChanges, readJsonFile } from './utils.js';
import { join } from 'node:path';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { output } from '../utils/utils.console.js';

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

      printChanges(context, 'key', { migrationScript: 'test', description: 'test', version: '1.0.0' });

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

      printChanges(context, 'key', { migrationScript: 'test', description: 'test', version: '1.0.0' });

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
  });
});
