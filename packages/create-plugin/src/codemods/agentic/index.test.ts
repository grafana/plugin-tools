import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Addition, PromptOnlyAddition } from '../additions/additions.js';
import { Context } from '../context.js';
import { selectPrompt } from '../../utils/utils.console.js';
import { AGENT_RUNS_DIR } from './handoff.js';
import { ABORT_CHOICE, CONTINUE_CHOICE, prepareAgenticAddition, runAgenticStep } from './index.js';
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

const fakeAgent: InstalledAgent = {
  definition: {
    id: 'claude-code',
    displayName: 'Claude Code',
    binaryNames: ['claude'],
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

let basePath: string;
let promptOnly: PromptOnlyAddition;

beforeEach(() => {
  vi.clearAllMocks();
  basePath = mkdtempSync(join(tmpdir(), 'cp-agentic-test-'));
  const promptPath = join(basePath, 'rspack-overrides.md');
  writeFileSync(promptPath, '# Port things');
  promptOnly = {
    name: 'rspack-overrides',
    description: 'Port custom things.',
    prompt: pathToFileURL(promptPath).href,
  };
});

afterEach(() => {
  rmSync(basePath, { recursive: true, force: true });
});

describe('prepareAgenticAddition', () => {
  const scriptOnly: Addition = {
    name: 'externalize-jsx-runtime',
    description: 'No prompt here.',
    scriptPath: 'file:///virtual/externalize-jsx-runtime.js',
  };

  it('should return undefined for an addition with no prompt', async () => {
    const resolution = await prepareAgenticAddition(scriptOnly, undefined);

    expect(resolution).toBeUndefined();
    expect(resolveMock).not.toHaveBeenCalled();
  });

  it('should return the resolution when an agent is enabled', async () => {
    resolveMock.mockResolvedValue({ mode: 'enabled', agent: fakeAgent });

    await expect(prepareAgenticAddition(promptOnly, undefined)).resolves.toEqual({
      mode: 'enabled',
      agent: fakeAgent,
    });
  });

  it.each([
    ['opted-out via flag', { mode: 'opted-out', reason: 'flag' } as const],
    ['opted-out via decline', { mode: 'opted-out', reason: 'declined' } as const],
    ['inside an agent', { mode: 'inside-agent' } as const],
  ])('should return the resolution when %s', async (_label, resolution) => {
    resolveMock.mockResolvedValue(resolution);

    await expect(prepareAgenticAddition(promptOnly, undefined)).resolves.toEqual(resolution);
  });

  it('should throw when no agent is installed', async () => {
    resolveMock.mockResolvedValue({ mode: 'unavailable', reason: 'no-agents' });

    await expect(prepareAgenticAddition(promptOnly, undefined)).rejects.toThrow(/needs an AI agent/);
  });

  it('should throw when there is no interactive terminal', async () => {
    resolveMock.mockResolvedValue({ mode: 'unavailable', reason: 'no-tty' });

    await expect(prepareAgenticAddition(promptOnly, undefined)).rejects.toThrow(/interactive terminal/);
  });

  it('should name every way forward when no agent is available', async () => {
    resolveMock.mockResolvedValue({ mode: 'unavailable', reason: 'no-agents' });

    await expect(prepareAgenticAddition(promptOnly, undefined)).rejects.toThrow(/--agent=<path>/);
    await expect(prepareAgenticAddition(promptOnly, undefined)).rejects.toThrow(/--no-agent/);
    await expect(prepareAgenticAddition(promptOnly, undefined)).rejects.toThrow(/rspack-overrides\.md/);
  });

  it('should pass the agent flag through to the resolver', async () => {
    resolveMock.mockResolvedValue({ mode: 'enabled', agent: fakeAgent });

    await prepareAgenticAddition(promptOnly, '/opt/homebrew/bin/claude');

    expect(resolveMock).toHaveBeenCalledWith({ agentFlag: '/opt/homebrew/bin/claude' });
  });
});

describe('runAgenticStep', () => {
  function runStep(overrides: Partial<Parameters<typeof runAgenticStep>[0]> = {}) {
    return runAgenticStep({
      addition: promptOnly,
      agent: fakeAgent,
      basePath,
      treeWasDirty: false,
      ...overrides,
    });
  }

  function createContextWithChanges() {
    const context = new Context(basePath);
    context.addFile('rspack.config.ts', 'export default {};');
    return context;
  }

  it('should report the handoff summary when the agent succeeds', async () => {
    runAgentSessionMock.mockResolvedValue(handoffResult('success', 'Ported the overrides.'));

    await expect(runStep()).resolves.toEqual({ kind: 'applied', summary: 'Ported the overrides.' });
  });

  it('should throw when the agent hands off a failure', async () => {
    runAgentSessionMock.mockResolvedValue(handoffResult('failed', 'Could not parse the config.'));

    await expect(runStep()).rejects.toThrow(/Could not parse the config./);
  });

  it('should throw when the user aborts the session', async () => {
    runAgentSessionMock.mockResolvedValue({ outcome: 'user-aborted' });

    await expect(runStep()).rejects.toThrow(/aborted/);
  });

  it('should spawn the agent with its own invocation', async () => {
    runAgentSessionMock.mockResolvedValue(handoffResult('success', 'done'));

    await runStep();

    expect(runAgentSessionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        binaryPath: '/usr/local/bin/claude',
        cwd: basePath,
        env: { FAKE_AGENT: '1' },
      })
    );
  });

  it('should create the run directory under the agent runs cache', async () => {
    runAgentSessionMock.mockResolvedValue(handoffResult('success', 'done'));

    await runStep();

    expect(existsSync(join(basePath, AGENT_RUNS_DIR))).toBe(true);
    const handoffPath = runAgentSessionMock.mock.calls[0][0].handoffPath;
    expect(handoffPath).toContain(AGENT_RUNS_DIR);
    expect(handoffPath).toContain('rspack-overrides.json');
  });

  describe('prompt content', () => {
    beforeEach(() => {
      runAgentSessionMock.mockResolvedValue(handoffResult('success', 'done'));
    });

    function getUserPrompt() {
      return runAgentSessionMock.mock.calls[0][0].args[2];
    }

    it('should omit the codemod changes section when there is no codemod half', async () => {
      await runStep();

      expect(getUserPrompt()).not.toContain('<codemod_changes>');
    });

    it('should point the agent at the git diff when the tree started clean', async () => {
      await runStep({ context: createContextWithChanges(), treeWasDirty: false });

      expect(getUserPrompt()).toContain('<codemod_changes>');
      expect(getUserPrompt()).toContain('git diff');
      expect(getUserPrompt()).not.toContain('<files_changed>');
    });

    it('should embed the changed file list when --force let a dirty tree through', async () => {
      await runStep({ context: createContextWithChanges(), treeWasDirty: true });

      expect(getUserPrompt()).toContain('<files_changed>');
      expect(getUserPrompt()).toContain('rspack.config.ts');
    });

    it('should embed the instructions file contents', async () => {
      await runStep();

      expect(getUserPrompt()).toContain('# Port things');
    });
  });

  describe('ambiguous exit', () => {
    beforeEach(() => {
      runAgentSessionMock.mockResolvedValue({ outcome: 'ambiguous-exit', exitCode: 1, signal: null });
    });

    it('should assume the step was applied when the user chooses to continue', async () => {
      selectPromptMock.mockResolvedValue(CONTINUE_CHOICE);

      await expect(runStep()).resolves.toEqual({ kind: 'assumed-applied' });
    });

    it('should throw when the user chooses to abort', async () => {
      selectPromptMock.mockResolvedValue(ABORT_CHOICE);

      await expect(runStep()).rejects.toThrow(/aborted/);
    });

    it('should treat a cancelled prompt as an abort', async () => {
      selectPromptMock.mockRejectedValue(new Error(''));

      await expect(runStep()).rejects.toThrow(/aborted/);
    });
  });
});
