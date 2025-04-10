import { dirSync } from 'tmp';
import { Context } from './context.js';
import { flushChanges, printChanges } from './utils.js';
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
      await context.addFile('file.txt', 'content');
      await context.updateFile('baz.ts', 'new content');
      await context.deleteFile('bar.ts');

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
});
