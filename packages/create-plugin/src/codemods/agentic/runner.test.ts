import { spawn, ChildProcess } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runAgentSession, AgentSessionOptions } from './runner.js';

vi.mock('node:child_process');

const spawnMock = vi.mocked(spawn);

interface FakeChildBehavior {
  onSigint?: 'exit' | 'ignore';
}

class FakeChild extends EventEmitter {
  kill = vi.fn((signal: NodeJS.Signals) => {
    if (signal === 'SIGINT' && this.behavior.onSigint === 'exit') {
      setTimeout(() => this.emit('exit', 130, null), 5);
    }
    if (signal === 'SIGKILL') {
      setTimeout(() => this.emit('exit', null, 'SIGKILL'), 5);
    }
    return true;
  });

  constructor(private behavior: FakeChildBehavior = { onSigint: 'exit' }) {
    super();
  }
}

function stubSpawn(child: FakeChild) {
  spawnMock.mockReturnValue(child as unknown as ChildProcess);
}

describe('runAgentSession', () => {
  let dir: string;
  let handoffPath: string;
  let sessionOptions: AgentSessionOptions;

  beforeEach(() => {
    vi.clearAllMocks();
    dir = mkdtempSync(join(tmpdir(), 'cp-runner-test-'));
    handoffPath = join(dir, '013-example.json');
    sessionOptions = {
      binaryPath: '/usr/local/bin/claude',
      args: ['--system-prompt', 'sys', 'user'],
      cwd: dir,
      handoffPath,
      pollIntervalMs: 10,
      killGraceMs: 5000,
    };
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('should resolve with the handoff and stop the session once the handoff file appears', async () => {
    const child = new FakeChild();
    stubSpawn(child);
    writeFileSync(handoffPath, '{"status":"success","summary":"migrated"}');

    const result = await runAgentSession(sessionOptions);

    expect(result).toEqual({ outcome: 'handoff', handoff: { status: 'success', summary: 'migrated' } });
    expect(child.kill).toHaveBeenCalledWith('SIGINT');
    expect(spawnMock).toHaveBeenCalledWith(
      sessionOptions.binaryPath,
      sessionOptions.args,
      expect.objectContaining({ stdio: 'inherit', cwd: dir })
    );
  });

  it('should escalate to SIGKILL when the agent ignores SIGINT after a valid handoff', async () => {
    const child = new FakeChild({ onSigint: 'ignore' });
    stubSpawn(child);
    writeFileSync(handoffPath, '{"status":"success","summary":"migrated"}');

    const result = await runAgentSession({ ...sessionOptions, killGraceMs: 30 });

    expect(result).toEqual({ outcome: 'handoff', handoff: { status: 'success', summary: 'migrated' } });
    expect(child.kill).toHaveBeenCalledWith('SIGINT');
    expect(child.kill).toHaveBeenCalledWith('SIGKILL');
  });

  it('should treat an exit after a self-written handoff as a handoff', async () => {
    const child = new FakeChild();
    stubSpawn(child);

    const resultPromise = runAgentSession({ ...sessionOptions, pollIntervalMs: 60_000 });
    writeFileSync(handoffPath, '{"status":"failed","summary":"blocked"}');
    setTimeout(() => child.emit('exit', 0, null), 10);

    await expect(resultPromise).resolves.toEqual({
      outcome: 'handoff',
      handoff: { status: 'failed', summary: 'blocked' },
    });
  });

  it('should classify an exit without a handoff as ambiguous', async () => {
    const child = new FakeChild();
    stubSpawn(child);

    const resultPromise = runAgentSession(sessionOptions);
    setTimeout(() => child.emit('exit', 1, null), 10);

    await expect(resultPromise).resolves.toEqual({ outcome: 'ambiguous-exit', exitCode: 1, signal: null });
  });

  it('should classify an exit with an invalid handoff file as ambiguous', async () => {
    const child = new FakeChild();
    stubSpawn(child);
    writeFileSync(handoffPath, 'not json at all');

    const resultPromise = runAgentSession({ ...sessionOptions, pollIntervalMs: 60_000 });
    setTimeout(() => child.emit('exit', 0, null), 10);

    await expect(resultPromise).resolves.toEqual({ outcome: 'ambiguous-exit', exitCode: 0, signal: null });
  });

  it.each([
    [130, null],
    [143, null],
    [null, 'SIGINT'],
    [null, 'SIGTERM'],
  ])('should classify exit code %s / signal %s as user-aborted', async (exitCode, signal) => {
    const child = new FakeChild();
    stubSpawn(child);

    const resultPromise = runAgentSession(sessionOptions);
    setTimeout(() => child.emit('exit', exitCode, signal), 10);

    await expect(resultPromise).resolves.toEqual({ outcome: 'user-aborted' });
  });

  it('should classify a spawn error as ambiguous', async () => {
    const child = new FakeChild();
    stubSpawn(child);

    const resultPromise = runAgentSession(sessionOptions);
    setTimeout(() => child.emit('error', new Error('spawn ENOENT')), 5);

    await expect(resultPromise).resolves.toEqual({ outcome: 'ambiguous-exit', exitCode: null, signal: null });
  });
});
