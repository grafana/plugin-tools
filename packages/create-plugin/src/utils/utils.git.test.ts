import { exec } from 'node:child_process';
import { findAdditionTodos } from './utils.git.js';

vi.mock('node:child_process', () => ({ exec: vi.fn() }));

type ExecCallback = (error: Error | null, result?: { stdout: string; stderr: string }) => void;

function mockExec(outcome: { stdout: string } | { error: Error }) {
  vi.mocked(exec).mockImplementation(((_command: string, _options: unknown, callback: ExecCallback) => {
    if ('error' in outcome) {
      callback(outcome.error);
    } else {
      callback(null, { stdout: outcome.stdout, stderr: '' });
    }
  }) as unknown as typeof exec);
}

describe('findAdditionTodos', () => {
  afterEach(() => {
    vi.mocked(exec).mockReset();
  });

  it('should search tracked and untracked files for the addition marker', async () => {
    mockExec({ stdout: '' });

    await findAdditionTodos('rspack', '/plugin');

    expect(exec).toHaveBeenCalledWith(
      'git grep -n --untracked -F "TODO(rspack)"',
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
