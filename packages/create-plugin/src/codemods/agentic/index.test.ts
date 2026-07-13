import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { output, selectPrompt } from '../../utils/utils.console.js';
import { Context } from '../context.js';
import { PromptOnlyMigration, ScriptMigration } from '../migrations/migrations.js';
import { MIGRATE_RUNS_DIR } from './handoff.js';
import { ABORT_CHOICE, CONTINUE_CHOICE, createAgenticRuntime } from './index.js';
import { resolveAgenticMode } from './resolve.js';
import { runAgentSession } from './runner.js';
import { AgentSessionResult, InstalledAgent } from './types.js';

vi.mock('./resolve.js');
vi.mock('./runner.js');
vi.mock('../../utils/utils.console.js', () => ({
  output: {
    log: vi.fn(),
    warning: vi.fn(),
    logSingleLine: vi.fn(),
    statusList: vi.fn(),
  },
  confirmPrompt: vi.fn(),
  selectPrompt: vi.fn(),
}));
vi.mock('../../utils/utils.packageManager.js', () => ({
  getPackageManagerWithFallback: () => ({ packageManagerName: 'npm', packageManagerVersion: '11.0.0' }),
  getPackageManagerSilentInstallCmd: () => 'npm install --silent',
  getPackageManagerExecCmd: () => 'npx -y',
}));

const resolveMock = vi.mocked(resolveAgenticMode);
const runAgentSessionMock = vi.mocked(runAgentSession);
const selectPromptMock = vi.mocked(selectPrompt);
const outputMock = vi.mocked(output);

const fakeAgent: InstalledAgent = {
  definition: {
    id: 'claude-code',
    displayName: 'Claude Code',
    binaryNames: ['claude'],
    wellKnownPaths: [],
    buildInteractive: (invocationContext) => ({
      args: ['--sys', invocationContext.systemPrompt, invocationContext.userPrompt],
      env: { FAKE_AGENT: '1' },
    }),
  },
  binaryPath: '/usr/local/bin/claude',
};

function handoffResult(status: 'success' | 'failed', summary: string): AgentSessionResult {
  return { outcome: 'handoff', handoff: { status, summary } };
}

describe('createAgenticRuntime', () => {
  let basePath: string;
  let migration: PromptOnlyMigration;

  beforeEach(() => {
    vi.clearAllMocks();
    basePath = mkdtempSync(join(tmpdir(), 'cp-agentic-test-'));
    const promptPath = join(basePath, '013-example.md');
    writeFileSync(promptPath, '# Port things');
    migration = {
      name: '013-example',
      version: '8.0.0',
      description: 'Port custom things.',
      prompt: pathToFileURL(promptPath).href,
    };
  });

  afterEach(() => {
    rmSync(basePath, { recursive: true, force: true });
  });

  function createEnabledRuntime(commitEachMigration?: boolean) {
    resolveMock.mockResolvedValue({ mode: 'enabled', agent: fakeAgent });
    return createAgenticRuntime({ agentFlag: undefined, commitEachMigration, basePath });
  }

  describe('disabled mode', () => {
    it('should defer prompt steps and print them as manual next steps', async () => {
      resolveMock.mockResolvedValue({ mode: 'disabled', reason: 'no-agents' });
      const runtime = await createAgenticRuntime({ agentFlag: undefined, commitEachMigration: undefined, basePath });

      const step = await runtime.runPromptStep(migration);
      runtime.printSummary();

      expect(step).toEqual({ kind: 'deferred' });
      expect(runtime.softForceCommits).toBe(false);
      expect(runAgentSessionMock).not.toHaveBeenCalled();
      expect(outputMock.warning).toHaveBeenCalledWith(
        expect.objectContaining({
          body: [expect.stringContaining('013-example')],
        })
      );
    });
  });

  describe('inside-agent mode', () => {
    it('should defer prompt steps and print a directive block for the outer agent', async () => {
      resolveMock.mockResolvedValue({ mode: 'inside-agent' });
      const runtime = await createAgenticRuntime({ agentFlag: undefined, commitEachMigration: undefined, basePath });

      const step = await runtime.runPromptStep(migration);
      runtime.printSummary();

      expect(step).toEqual({ kind: 'deferred' });
      expect(outputMock.logSingleLine).toHaveBeenCalledWith(expect.stringContaining('<create_plugin_agent_directive>'));
      expect(outputMock.logSingleLine).toHaveBeenCalledWith(expect.stringContaining('013-example'));
    });
  });

  describe('enabled mode', () => {
    it('should wipe previous runs when the runtime is created', async () => {
      const staleHandoff = join(basePath, MIGRATE_RUNS_DIR, 'old-run');
      mkdirSync(staleHandoff, { recursive: true });
      writeFileSync(join(staleHandoff, 'stale.json'), '{}');

      await createEnabledRuntime();

      expect(existsSync(staleHandoff)).toBe(false);
    });

    it('should run the agent session and report an applied step on a success handoff', async () => {
      runAgentSessionMock.mockResolvedValue(handoffResult('success', 'ported everything'));
      const runtime = await createEnabledRuntime();

      const step = await runtime.runPromptStep(migration);
      runtime.printSummary();

      expect(step).toEqual({ kind: 'applied', summary: 'ported everything' });
      expect(runAgentSessionMock).toHaveBeenCalledWith(
        expect.objectContaining({
          binaryPath: '/usr/local/bin/claude',
          cwd: basePath,
          env: { FAKE_AGENT: '1' },
          handoffPath: expect.stringContaining(join(MIGRATE_RUNS_DIR, '')),
        })
      );
      const sessionOptions = runAgentSessionMock.mock.calls[0][0];
      expect(sessionOptions.handoffPath).toContain('013-example.json');
      // the fake agent puts the system prompt at args[1] and the user prompt at args[2]
      expect(sessionOptions.args[1]).toContain(sessionOptions.handoffPath);
      expect(sessionOptions.args[2]).toContain('# Port things');
      expect(outputMock.statusList).toHaveBeenCalledWith('success', [expect.stringContaining('ported everything')]);
    });

    it('should throw when the agent hands off a failure', async () => {
      runAgentSessionMock.mockResolvedValue(handoffResult('failed', 'could not port'));
      const runtime = await createEnabledRuntime();

      await expect(runtime.runPromptStep(migration)).rejects.toThrow(/could not port/);
    });

    it('should throw when the user aborts the agent session', async () => {
      runAgentSessionMock.mockResolvedValue({ outcome: 'user-aborted' });
      const runtime = await createEnabledRuntime();

      await expect(runtime.runPromptStep(migration)).rejects.toThrow(/aborted/i);
    });

    it('should ask the user on an ambiguous exit and continue when told to', async () => {
      runAgentSessionMock.mockResolvedValue({ outcome: 'ambiguous-exit', exitCode: 1, signal: null });
      selectPromptMock.mockResolvedValue(CONTINUE_CHOICE);
      const runtime = await createEnabledRuntime();

      const step = await runtime.runPromptStep(migration);

      expect(selectPromptMock).toHaveBeenCalledWith(expect.any(String), [ABORT_CHOICE, CONTINUE_CHOICE]);
      expect(step).toEqual({ kind: 'assumed-applied' });
    });

    it('should abort on an ambiguous exit when told to', async () => {
      runAgentSessionMock.mockResolvedValue({ outcome: 'ambiguous-exit', exitCode: 1, signal: null });
      selectPromptMock.mockResolvedValue(ABORT_CHOICE);
      const runtime = await createEnabledRuntime();

      await expect(runtime.runPromptStep(migration)).rejects.toThrow(/aborted/i);
    });

    it('should treat a cancelled ambiguous-exit prompt as an abort', async () => {
      runAgentSessionMock.mockResolvedValue({ outcome: 'ambiguous-exit', exitCode: null, signal: null });
      selectPromptMock.mockRejectedValue(new Error(''));
      const runtime = await createEnabledRuntime();

      await expect(runtime.runPromptStep(migration)).rejects.toThrow(/aborted/i);
    });
  });

  describe('hybrid steps', () => {
    let hybridMigration: ScriptMigration;
    let context: Context;

    beforeEach(() => {
      hybridMigration = { ...migration, scriptPath: 'file:///virtual/scripts/013-example.js' };
      context = new Context(basePath);
      context.addFile('src/new-file.ts', 'content');
      runAgentSessionMock.mockResolvedValue(handoffResult('success', 'done'));
    });

    it('should point the agent at the git diff when per-migration commits are on', async () => {
      const runtime = await createEnabledRuntime(true);

      await runtime.runPromptStep(hybridMigration, context);

      const userPrompt = runAgentSessionMock.mock.calls[0][0].args[2];
      expect(userPrompt).toContain('git diff');
      expect(userPrompt).not.toContain('<files_changed>');
    });

    it('should embed the changed file list when commits are off', async () => {
      const runtime = await createEnabledRuntime(false);

      await runtime.runPromptStep(hybridMigration, context);

      const userPrompt = runAgentSessionMock.mock.calls[0][0].args[2];
      expect(userPrompt).toContain('<files_changed>');
      expect(userPrompt).toContain('[ADD] src/new-file.ts');
    });

    it('should warn that the agent loses diff context when commits are explicitly off', async () => {
      await createEnabledRuntime(false);
      expect(outputMock.warning).toHaveBeenCalled();
    });
  });

  describe('softForceCommits', () => {
    it('should soft-force commits when enabled and the commit flag was not given', async () => {
      const runtime = await createEnabledRuntime(undefined);
      expect(runtime.softForceCommits).toBe(true);
    });

    it('should not soft-force commits when the user set the flag explicitly', async () => {
      expect((await createEnabledRuntime(true)).softForceCommits).toBe(false);
      expect((await createEnabledRuntime(false)).softForceCommits).toBe(false);
    });
  });
});
