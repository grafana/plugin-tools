import { dirSync } from 'tmp';
import { Context } from './context.js';
import { flushChanges, printChanges } from './utils.js';
import { join } from 'node:path';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';

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
      await context.addFile('file.txt', 'content');
      await context.addFile('deeper/path/to/file.txt', 'content');
      flushChanges(context);
      expect(readFileSync(join(tmpDir, 'file.txt'), 'utf-8')).toBe('content');
      expect(readFileSync(join(tmpDir, 'deeper/path/to/file.txt'), 'utf-8')).toBe('content');
    });

    it('should update files on disk', async () => {
      const context = new Context(tmpDir);
      await context.updateFile('bar.ts', 'new content');
      flushChanges(context);
      expect(readFileSync(join(tmpDir, 'bar.ts'), 'utf-8')).toBe('new content');
    });

    it('should delete files from disk', async () => {
      const context = new Context(tmpDir);
      await context.deleteFile('bar.ts');
      flushChanges(context);
      expect(() => readFileSync(join(tmpDir, 'bar.ts'), 'utf-8')).toThrowError();
    });
  });

  describe('printChanges', () => {
    const originalConsoleLog = console.log;

    beforeEach(() => {
      vitest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
      console.log = originalConsoleLog;
    });

    it('should print changes', async () => {
      const context = new Context(tmpDir);
      await context.addFile('file.txt', 'content');
      await context.updateFile('baz.ts', 'new content');
      await context.deleteFile('bar.ts');

      printChanges(context, 'key', { migrationScript: 'test', description: 'test', version: '1.0.0' });

      expect(console.log).toHaveBeenCalledWith(expect.stringMatching(/ADD.+file\.txt/));
      expect(console.log).toHaveBeenCalledWith(expect.stringMatching(/UPDATE.+baz\.ts/));
      expect(console.log).toHaveBeenCalledWith(expect.stringMatching(/DELETE.+bar\.ts/));
    });

    it('should print no changes', async () => {
      const context = new Context(tmpDir);

      printChanges(context, 'key', { migrationScript: 'test', description: 'test', version: '1.0.0' });

      expect(console.log).toHaveBeenCalledWith(expect.stringMatching(/No changes were made/));
    });
  });
});
