import { vi } from 'vitest';

import { update } from './update.command.js';
import { getMigrationsToRun, isUpToDate, runMigrations } from '../codemods/migrations/manager.js';

vi.mock('../utils/utils.checks.js', () => ({ performPreCodemodChecks: vi.fn() }));
vi.mock('../utils/utils.config.js', () => ({ getConfig: vi.fn(() => ({ version: '7.0.0', features: {} })) }));
vi.mock('../utils/utils.console.js', () => ({
  output: { log: vi.fn(), success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));
vi.mock('../codemods/migrations/manager.js', () => ({
  getMigrationsToRun: vi.fn(() => []),
  isUpToDate: vi.fn(() => false),
  runMigrations: vi.fn(),
}));

describe('update', () => {
  let exitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`process.exit(${code})`);
    }) as typeof process.exit);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns without exiting when the plugin is up to date', async () => {
    vi.mocked(isUpToDate).mockReturnValueOnce(true);

    await expect(update({ _: ['update'] })).resolves.toBeUndefined();
    expect(exitSpy).not.toHaveBeenCalled();
    expect(runMigrations).not.toHaveBeenCalled();
  });

  it('returns without exiting when there are no migrations to run', async () => {
    vi.mocked(getMigrationsToRun).mockReturnValueOnce([]);

    await expect(update({ _: ['update'] })).resolves.toBeUndefined();
    expect(exitSpy).not.toHaveBeenCalled();
    expect(runMigrations).not.toHaveBeenCalled();
  });
});
