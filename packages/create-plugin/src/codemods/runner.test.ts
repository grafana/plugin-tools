import { flushChanges, formatFiles, installNPMDependencies, printChanges } from './utils.js';
import { Context } from './context.js';
import { Codemod } from './types.js';
import { output } from '../utils/utils.console.js';
import { runCodemod } from './runner.js';
import { vi } from 'vitest';

vi.mock('./utils.js', async (importOriginal) => {
  const actual: typeof import('./utils.js') = await importOriginal();
  return {
    ...actual,
    flushChanges: vi.fn(),
    formatFiles: vi.fn(),
    installNPMDependencies: vi.fn(),
    printChanges: vi.fn(),
  };
});

const codemodFn = vi.fn();

vi.doMock('virtual-runner-codemod.js', async () => ({ default: codemodFn }));

const codemod: Codemod = {
  name: 'virtual-codemod',
  description: 'a codemod that exists only for these tests',
  scriptPath: 'virtual-runner-codemod.js',
};

describe('runCodemod', () => {
  beforeEach(() => {
    vi.spyOn(output, 'warning').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('runs the post-processing pipeline for a codemod that did work', async () => {
    codemodFn.mockImplementation((context: Context) => {
      context.addFile('added.ts', '');
      return context;
    });

    const context = await runCodemod(codemod);

    expect(context.getSkip()).toBeUndefined();
    expect(formatFiles).toHaveBeenCalledOnce();
    expect(flushChanges).toHaveBeenCalledOnce();
    expect(printChanges).toHaveBeenCalledOnce();
    expect(installNPMDependencies).toHaveBeenCalledOnce();
  });

  describe('when the codemod skips', () => {
    beforeEach(() => {
      codemodFn.mockImplementation((context: Context) => {
        context.skip('this is not an app plugin.', ['Run it against an app plugin.']);
        return context;
      });
    });

    it('hands the skip back to the caller', async () => {
      const context = await runCodemod(codemod);

      expect(context.getSkip()).toEqual({
        reason: 'this is not an app plugin.',
        hints: ['Run it against an app plugin.'],
      });
    });

    it('touches nothing on disk', async () => {
      await runCodemod(codemod);

      expect(formatFiles).not.toHaveBeenCalled();
      expect(flushChanges).not.toHaveBeenCalled();
      expect(printChanges).not.toHaveBeenCalled();
      expect(installNPMDependencies).not.toHaveBeenCalled();
    });

    // explained here rather than in each command, so `add` and `update` word it the same way
    it('explains the skip where the change list would have gone', async () => {
      await runCodemod(codemod);

      expect(output.warning).toHaveBeenCalledWith({
        title: 'Skipped virtual-codemod: this is not an app plugin.',
        body: ['Run it against an app plugin.'],
      });
    });
  });

  it('refuses to silently discard changes staged before a skip', async () => {
    codemodFn.mockImplementation((context: Context) => {
      context.addFile('half-done.ts', '');
      context.skip('changed my mind.');
      return context;
    });

    await expect(runCodemod(codemod)).rejects.toThrow('staged changes and then skipped');
    expect(flushChanges).not.toHaveBeenCalled();
  });
});
