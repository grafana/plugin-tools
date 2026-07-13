import which from 'which';
import { access } from 'node:fs/promises';
import { detectInstalledAgents, isInsideAgent } from './detect.js';
import { AgentDefinition } from './types.js';

vi.mock('which');
vi.mock('node:fs/promises');

const whichMock = vi.mocked(which);
const accessMock = vi.mocked(access);

function createDefinition(overrides: Partial<AgentDefinition>): AgentDefinition {
  return {
    id: 'claude-code',
    displayName: 'Claude Code',
    binaryNames: ['claude'],
    wellKnownPaths: [],
    buildInteractive: () => ({ args: [] }),
    ...overrides,
  };
}

describe('detectInstalledAgents', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should detect an agent found on the PATH', async () => {
    whichMock.mockResolvedValue('/usr/local/bin/claude');

    const installed = await detectInstalledAgents([createDefinition({})]);

    expect(installed).toHaveLength(1);
    expect(installed[0].binaryPath).toBe('/usr/local/bin/claude');
    expect(whichMock).toHaveBeenCalledWith('claude', { nothrow: true });
  });

  it('should fall back to well-known paths when the binary is not on the PATH', async () => {
    // @ts-expect-error - the nothrow overload returns string | null which the mocked union cannot infer
    whichMock.mockResolvedValue(null);
    accessMock.mockResolvedValue(undefined);

    const definition = createDefinition({ wellKnownPaths: ['/home/user/.claude/local/claude'] });
    const installed = await detectInstalledAgents([definition]);

    expect(installed).toHaveLength(1);
    expect(installed[0].binaryPath).toBe('/home/user/.claude/local/claude');
  });

  it('should return an empty list when nothing is installed', async () => {
    // @ts-expect-error - the nothrow overload returns string | null which the mocked union cannot infer
    whichMock.mockResolvedValue(null);
    accessMock.mockRejectedValue(new Error('ENOENT'));

    const definition = createDefinition({ wellKnownPaths: ['/home/user/.claude/local/claude'] });
    const installed = await detectInstalledAgents([definition]);

    expect(installed).toEqual([]);
  });

  it('should preserve definition order even when probes resolve out of order', async () => {
    whichMock.mockImplementation((binaryName) => {
      if (binaryName === 'claude') {
        return new Promise((resolve) => {
          setTimeout(() => resolve('/usr/local/bin/claude'), 20);
        });
      }
      return Promise.resolve('/usr/local/bin/codex');
    });

    const installed = await detectInstalledAgents([
      createDefinition({}),
      createDefinition({ id: 'codex', displayName: 'OpenAI Codex', binaryNames: ['codex'] }),
    ]);

    expect(installed.map((agent) => agent.definition.id)).toEqual(['claude-code', 'codex']);
  });
});

describe('isInsideAgent', () => {
  it.each(['CLAUDECODE', 'CURSOR_TRACE_ID', 'OPENCODE', 'CODEX_THREAD_ID', 'GEMINI_CLI', 'VSCODE_AGENT', 'REPL_ID'])(
    'should return true when %s is set',
    (envVar) => {
      expect(isInsideAgent({ [envVar]: '1' })).toBe(true);
    }
  );

  it('should return false when no agent environment variables are set', () => {
    expect(isInsideAgent({ PATH: '/usr/bin', TERM: 'xterm-256color' })).toBe(false);
  });

  it('should return false when an agent environment variable is set but empty', () => {
    expect(isInsideAgent({ CLAUDECODE: '' })).toBe(false);
  });
});
