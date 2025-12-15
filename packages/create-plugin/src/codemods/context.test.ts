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
    it('should update a file in the context', () => {
      const context = new Context();
      context.addFile('file.txt', 'content');
      context.updateFile('file.txt', 'new content');
      expect(context.listChanges()).toEqual({ 'file.txt': { content: 'new content', changeType: 'update' } });
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
