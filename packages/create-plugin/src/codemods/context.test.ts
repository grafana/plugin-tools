import { Context } from './context.js';

describe('Context', () => {
  describe('getFile', () => {
    it('should read a file from the file system', () => {
      const context = new Context(`${__dirname}/migrations/fixtures`);
      const content = context.getFile('foo/bar.ts');
      expect(content).toEqual("console.log('foo/bar.ts');\n");
    });

    it('should get a file that was just added to the context', () => {
      const context = new Context();
      context.addFile('file.txt', 'content');
      const content = context.getFile('file.txt');
      expect(content).toEqual('content');
    });

    it('should get a file that was updated in the current context', () => {
      const context = new Context(`${__dirname}/migrations/fixtures`);
      context.updateFile('foo/bar.ts', 'content');
      const content = context.getFile('foo/bar.ts');
      expect(content).toEqual('content');
    });

    it('should not return a file that was marked for deletion', () => {
      const context = new Context(`${__dirname}/migrations/fixtures`);
      context.deleteFile('foo/bar.ts');
      const content = context.getFile('foo/bar.ts');
      expect(content).toEqual(undefined);
    });
  });

  describe('addFile', () => {
    it('should add a file to the context', () => {
      const context = new Context();
      context.addFile('file.txt', 'content');
      expect(context.listChanges()).toEqual({ 'file.txt': { content: 'content', changeType: 'add' } });
    });

    it('should not add a file if it already exists', () => {
      const context = new Context();
      context.addFile('file.txt', 'content');

      expect(() => context.addFile('file.txt', 'new content')).toThrowError('File file.txt already exists');
    });
  });

  describe('deleteFile', () => {
    it('should delete a file from the context', () => {
      const context = new Context();
      context.addFile('file.txt', 'content');
      context.deleteFile('file.txt');
      expect(context.listChanges()).toEqual({});
    });

    it('should not delete a file if it does not exist', () => {
      const context = new Context();

      expect(() => context.deleteFile('file.txt')).toThrowError('File file.txt does not exist');
    });
  });

  describe('updateFile', () => {
    it('should keep changeType=add when updating a file that was just added in this context', () => {
      // a file added then updated in the same context still has no on-disk
      // counterpart - the net effect is still an "add". Flipping to "update"
      // would cause flushChanges to skip the mkdirSync for the parent dir.
      const context = new Context();
      context.addFile('file.txt', 'content');
      context.updateFile('file.txt', 'new content');
      expect(context.listChanges()).toEqual({ 'file.txt': { content: 'new content', changeType: 'add' } });
    });

    it('should keep changeType=add when updating a file whose parent dir does not yet exist', () => {
      // regression: appendAgentSuffixToReadme calls updateFile on docs2/README.md
      // right after copyDocsTemplates added it. If updateFile flipped to "update",
      // flushChanges would writeFileSync without mkdirSync and ENOENT on the
      // missing parent directory.
      const context = new Context();
      context.addFile('docs2/README.md', 'initial');
      context.updateFile('docs2/README.md', 'initial\n\nappended');
      expect(context.listChanges()['docs2/README.md']).toEqual({
        content: 'initial\n\nappended',
        changeType: 'add',
      });
    });

    it('should flip changeType to update when modifying a file from disk', () => {
      const context = new Context(`${__dirname}/migrations/fixtures`);
      context.updateFile('foo/bar.ts', 'replaced');
      expect(context.listChanges()).toEqual({ 'foo/bar.ts': { content: 'replaced', changeType: 'update' } });
    });

    it('should not update a file if it does not exist', () => {
      const context = new Context();

      expect(() => context.updateFile('file.txt', 'new content')).toThrowError('File file.txt does not exist');
    });
  });

  describe('renameFile', () => {
    it('should rename a file', () => {
      const context = new Context(`${__dirname}/migrations/fixtures`);
      context.renameFile('foo/bar.ts', 'new-file.txt');
      expect(context.listChanges()).toEqual({
        'new-file.txt': { content: "console.log('foo/bar.ts');\n", changeType: 'add' },
        'foo/bar.ts': { changeType: 'delete' },
      });
    });

    it('should not rename a file if it does not exist', () => {
      const context = new Context();

      expect(() => context.renameFile('file.txt', 'new-file.txt')).toThrowError('File file.txt does not exist');
    });

    it('should not rename a file if the new name already exists', () => {
      const context = new Context();
      context.addFile('file.txt', 'content');
      context.addFile('new-file.txt', 'content');

      expect(() => context.renameFile('file.txt', 'new-file.txt')).toThrowError('File new-file.txt already exists');
    });
  });

  describe('readDir', () => {
    it('should read the directory', () => {
      const context = new Context(`${__dirname}/migrations/fixtures`);
      const files = context.readDir('foo');
      expect(files).toEqual(['foo/bar.ts', 'foo/baz.ts']);
    });

    it('should filter out deleted files', () => {
      const context = new Context(`${__dirname}/migrations/fixtures`);
      context.deleteFile('foo/bar.ts');
      const files = context.readDir('foo');
      expect(files).toEqual(['foo/baz.ts']);
    });

    it('should include files that are only added to the context', () => {
      const context = new Context(`${__dirname}/migrations/fixtures`);
      context.addFile('foo/foo.txt', '');
      const files = context.readDir('foo');
      expect(files).toEqual(['foo/bar.ts', 'foo/baz.ts', 'foo/foo.txt']);
    });
  });

  describe('normalisePath', () => {
    it('should normalise the path', () => {
      const context = new Context(`${__dirname}/migrations/fixtures`);
      expect(context.normalisePath('foo/bar.ts')).toEqual('foo/bar.ts');
      expect(context.normalisePath('./foo/bar.ts')).toEqual('foo/bar.ts');
      expect(context.normalisePath('/foo/bar.ts')).toEqual('foo/bar.ts');
    });
  });

  describe('hasChanges', () => {
    it('should return FALSE if the context has no changes', () => {
      const context = new Context(`${__dirname}/migrations/fixtures`);
      expect(context.hasChanges()).toEqual(false);
    });

    it('should return TRUE if the context has changes', () => {
      const context = new Context(`${__dirname}/migrations/fixtures`);

      context.addFile('foo.ts', '');

      expect(context.hasChanges()).toEqual(true);
    });
  });
});
