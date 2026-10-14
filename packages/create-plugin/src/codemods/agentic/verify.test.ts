import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildVerifyWarning, runVerifyScripts } from './verify.js';

function createWorkspace(scripts?: Record<string, string>): string {
  const cwd = mkdtempSync(join(tmpdir(), 'cp-verify-'));
  writeFileSync(join(cwd, 'package.json'), JSON.stringify(scripts ? { scripts } : {}));
  return cwd;
}

describe('runVerifyScripts', () => {
  it('should run every script in order and record its outcome', () => {
    const cwd = createWorkspace({ typecheck: 'tsc', build: 'rspack', lint: 'eslint' });
    const runScript = vi.fn((_pm: string, script: string) => script !== 'build');

    const results = runVerifyScripts({
      scripts: ['typecheck', 'build', 'lint'],
      cwd,
      packageManagerName: 'pnpm',
      runScript,
    });

    expect(runScript.mock.calls).toEqual([
      ['pnpm', 'typecheck', cwd],
      ['pnpm', 'build', cwd],
      ['pnpm', 'lint', cwd],
    ]);
    expect(results).toEqual([
      { script: 'typecheck', outcome: 'passed' },
      { script: 'build', outcome: 'failed' },
      { script: 'lint', outcome: 'passed' },
    ]);
  });

  it('should skip scripts the plugin does not define', () => {
    const cwd = createWorkspace({ build: 'rspack' });
    const runScript = vi.fn(() => true);

    const results = runVerifyScripts({ scripts: ['typecheck', 'build'], cwd, packageManagerName: 'npm', runScript });

    expect(runScript).toHaveBeenCalledTimes(1);
    expect(results).toEqual([
      { script: 'typecheck', outcome: 'missing' },
      { script: 'build', outcome: 'passed' },
    ]);
  });

  it('should treat every script as missing when package.json cannot be read', () => {
    const cwd = mkdtempSync(join(tmpdir(), 'cp-verify-'));
    const runScript = vi.fn(() => true);

    const results = runVerifyScripts({ scripts: ['build'], cwd, packageManagerName: 'npm', runScript });

    expect(runScript).not.toHaveBeenCalled();
    expect(results).toEqual([{ script: 'build', outcome: 'missing' }]);
  });

  it('should run nothing when the addition has no verify scripts', () => {
    const runScript = vi.fn(() => true);

    expect(runVerifyScripts({ scripts: [], cwd: createWorkspace(), packageManagerName: 'npm', runScript })).toEqual([]);
    expect(runScript).not.toHaveBeenCalled();
  });

  it('should report a real script exit code', () => {
    const cwd = createWorkspace({ pass: 'node -e "process.exit(0)"', fail: 'node -e "process.exit(1)"' });

    const results = runVerifyScripts({ scripts: ['pass', 'fail'], cwd, packageManagerName: 'npm' });

    expect(results).toEqual([
      { script: 'pass', outcome: 'passed' },
      { script: 'fail', outcome: 'failed' },
    ]);
  });
});

describe('buildVerifyWarning', () => {
  it('should return undefined when every check passed', () => {
    expect(buildVerifyWarning('rspack', 'npm', [{ script: 'build', outcome: 'passed' }])).toBeUndefined();
  });

  it('should return undefined when there were no checks', () => {
    expect(buildVerifyWarning('rspack', 'npm', [])).toBeUndefined();
  });

  it('should list failed and skipped checks', () => {
    const warning = buildVerifyWarning('rspack', 'pnpm', [
      { script: 'typecheck', outcome: 'missing' },
      { script: 'build', outcome: 'failed' },
    ]);

    expect(warning?.title).toBe('rspack was applied, but 1 of its checks failed.');
    expect(warning?.body).toEqual([
      'pnpm run typecheck  skipped: package.json has no "typecheck" script',
      'pnpm run build  failed',
      expect.stringContaining('git diff'),
    ]);
  });

  it('should say checks could not run when none failed but some were missing', () => {
    const warning = buildVerifyWarning('rspack', 'npm', [{ script: 'typecheck', outcome: 'missing' }]);

    expect(warning?.title).toBe('rspack was applied, but some of its checks could not run.');
  });
});
