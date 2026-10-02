import { execFile } from 'node:child_process';
import { findAdditionTodos } from './utils.git.js';

vi.mock('node:child_process', () => ({ execFile: vi.fn() }));

type ExecFileCallback = (error: Error | null, result?: { stdout: string; stderr: string }) => void;

function mockExec(outcome: { stdout: string } | { error: Error }) {
  vi.mocked(execFile).mockImplementation(((
    _file: string,
    _args: string[],
    _options: unknown,
    callback: ExecFileCallback
  ) => {
    if ('error' in outcome) {
      callback(outcome.error);
    } else {
      callback(null, { stdout: outcome.stdout, stderr: '' });
    }
  }) as unknown as typeof execFile);
}

describe('findAdditionTodos', () => {
  afterEach(() => {
    vi.mocked(execFile).mockReset();
  });

  it('should search tracked and untracked files for the addition marker', async () => {
    mockExec({ stdout: '' });

    await findAdditionTodos('rspack', '/plugin');

    expect(execFile).toHaveBeenCalledWith(
      'git',
      ['grep', '-n', '--untracked', '-F', 'TODO(rspack)'],
      { cwd: '/plugin' },
      expect.any(Function)
    );
  });

  it('should return the file, line and text of each marker', async () => {
    mockExec({
      stdout: [
        'rspack.config.ts:12:  // TODO(rspack): CorsWorkerPlugin needs a RuntimeModule port',
        'build/utils.ts:3:// TODO(rspack): swc plugin ABI: mismatch',
        '',
      ].join('\n'),
    });

    const todos = await findAdditionTodos('rspack', '/plugin');

    expect(todos).toEqual([
      { file: 'rspack.config.ts', line: 12, text: '// TODO(rspack): CorsWorkerPlugin needs a RuntimeModule port' },
      { file: 'build/utils.ts', line: 3, text: '// TODO(rspack): swc plugin ABI: mismatch' },
    ]);
  });

  it('should return no markers when git grep finds nothing or fails', async () => {
    mockExec({ error: Object.assign(new Error('Command failed'), { code: 1 }) });

    await expect(findAdditionTodos('rspack', '/plugin')).resolves.toEqual([]);
  });
});
