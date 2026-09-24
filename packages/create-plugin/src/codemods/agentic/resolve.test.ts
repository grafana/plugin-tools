import { confirmPrompt, output, selectPrompt } from '../../utils/utils.console.js';
import { resolveAgentFromPath } from './detect.js';
import { resolveAgenticMode } from './resolve.js';
import { AgentId, InstalledAgent } from './types.js';

vi.mock('./detect.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./detect.js')>()),
  resolveAgentFromPath: vi.fn(),
}));

vi.mock('../../utils/utils.console.js', () => ({
  output: {
    log: vi.fn(),
    warning: vi.fn(),
  },
  confirmPrompt: vi.fn(),
  selectPrompt: vi.fn(),
}));

const confirmPromptMock = vi.mocked(confirmPrompt);
const selectPromptMock = vi.mocked(selectPrompt);
const outputWarningMock = vi.mocked(output.warning);
const resolveAgentFromPathMock = vi.mocked(resolveAgentFromPath);

function createInstalledAgent(id: AgentId, displayName: string): InstalledAgent {
  return {
    definition: {
      id,
      displayName,
      binaryNames: [id],
      buildInteractive: () => ({ args: [] }),
    },
    binaryPath: `/usr/local/bin/${id}`,
  };
}

const claude = createInstalledAgent('claude-code', 'Claude Code');
const codex = createInstalledAgent('codex', 'OpenAI Codex');

function createOptions(overrides: Partial<Parameters<typeof resolveAgenticMode>[0]> = {}) {
  return {
    agentFlag: undefined,
    isTTY: true,
    env: {},
    detect: vi.fn().mockResolvedValue([claude, codex]),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('resolveAgenticMode', () => {
  it('should resolve to inside-agent when running inside an agent, even with an explicit flag', async () => {
    const resolution = await resolveAgenticMode(createOptions({ agentFlag: 'claude-code', env: { CLAUDECODE: '1' } }));
    expect(resolution).toEqual({ mode: 'inside-agent' });
  });

  it('should resolve to disabled when --no-agent is passed', async () => {
    const resolution = await resolveAgenticMode(createOptions({ agentFlag: false }));
    expect(resolution).toEqual({ mode: 'opted-out', reason: 'flag' });
  });

  it('should resolve to unavailable on non-TTY without a flag', async () => {
    const resolution = await resolveAgenticMode(createOptions({ isTTY: false }));
    expect(resolution).toEqual({ mode: 'unavailable', reason: 'no-tty' });
    // the caller turns unavailable into an error, so resolve stays quiet
    expect(outputWarningMock).not.toHaveBeenCalled();
  });

  it('should resolve to unavailable on non-TTY even when a flag was passed explicitly', async () => {
    const resolution = await resolveAgenticMode(createOptions({ agentFlag: 'claude-code', isTTY: false }));
    expect(resolution).toEqual({ mode: 'unavailable', reason: 'no-tty' });
  });

  it('should not probe the PATH when a flag is passed on a non-TTY', async () => {
    const detect = vi.fn().mockResolvedValue([claude]);
    await resolveAgenticMode(createOptions({ agentFlag: '', isTTY: false, detect }));
    expect(detect).not.toHaveBeenCalled();
  });

  it('should auto-select the only installed agent when --agent is passed bare', async () => {
    const resolution = await resolveAgenticMode(
      createOptions({ agentFlag: '', detect: vi.fn().mockResolvedValue([codex]) })
    );
    expect(resolution).toEqual({ mode: 'enabled', agent: codex });
    expect(selectPromptMock).not.toHaveBeenCalled();
    expect(confirmPromptMock).not.toHaveBeenCalled();
  });

  it('should show a picker when --agent is passed bare and multiple agents are installed', async () => {
    selectPromptMock.mockResolvedValue('OpenAI Codex');
    const resolution = await resolveAgenticMode(createOptions({ agentFlag: '' }));
    expect(selectPromptMock).toHaveBeenCalledWith(expect.any(String), ['Claude Code', 'OpenAI Codex']);
    expect(resolution).toEqual({ mode: 'enabled', agent: codex });
  });

  it('should throw when --agent is passed bare and nothing is installed', async () => {
    await expect(
      resolveAgenticMode(createOptions({ agentFlag: '', detect: vi.fn().mockResolvedValue([]) }))
    ).rejects.toThrow(/no supported agent/i);
  });

  it('should pin the requested agent when --agent=<id> is installed', async () => {
    const resolution = await resolveAgenticMode(createOptions({ agentFlag: 'codex' }));
    expect(resolution).toEqual({ mode: 'enabled', agent: codex });
    expect(confirmPromptMock).not.toHaveBeenCalled();
  });

  it('should throw when --agent=<id> is not a known agent', async () => {
    await expect(resolveAgenticMode(createOptions({ agentFlag: 'update' }))).rejects.toThrow(/unknown agent/i);
  });

  it('should throw when --agent=<id> is known but not installed', async () => {
    await expect(
      resolveAgenticMode(createOptions({ agentFlag: 'codex', detect: vi.fn().mockResolvedValue([claude]) }))
    ).rejects.toThrow(/not installed/i);
  });

  it('should disable when no flag is passed and nothing is installed', async () => {
    const resolution = await resolveAgenticMode(createOptions({ detect: vi.fn().mockResolvedValue([]) }));
    expect(resolution).toEqual({ mode: 'unavailable', reason: 'no-agents' });
    expect(confirmPromptMock).not.toHaveBeenCalled();
  });

  it('should enable after the user opts in via the confirm prompt', async () => {
    confirmPromptMock.mockResolvedValue(true);
    const resolution = await resolveAgenticMode(createOptions({ detect: vi.fn().mockResolvedValue([claude]) }));
    expect(resolution).toEqual({ mode: 'enabled', agent: claude });
  });

  it('should disable when the user declines the confirm prompt', async () => {
    confirmPromptMock.mockResolvedValue(false);
    const resolution = await resolveAgenticMode(createOptions());
    expect(resolution).toEqual({ mode: 'opted-out', reason: 'declined' });
  });

  it('should treat a cancelled confirm prompt as declined', async () => {
    confirmPromptMock.mockRejectedValue(new Error(''));
    const resolution = await resolveAgenticMode(createOptions());
    expect(resolution).toEqual({ mode: 'opted-out', reason: 'declined' });
  });

  it('should show the picker after opt-in when multiple agents are installed', async () => {
    confirmPromptMock.mockResolvedValue(true);
    selectPromptMock.mockResolvedValue('Claude Code');
    const resolution = await resolveAgenticMode(createOptions());
    expect(resolution).toEqual({ mode: 'enabled', agent: claude });
  });

  it('should treat a cancelled picker as declined', async () => {
    confirmPromptMock.mockResolvedValue(true);
    selectPromptMock.mockRejectedValue(new Error(''));
    const resolution = await resolveAgenticMode(createOptions());
    expect(resolution).toEqual({ mode: 'opted-out', reason: 'declined' });
  });

  describe('--agent=<path>', () => {
    it('should resolve an agent from an explicit path', async () => {
      resolveAgentFromPathMock.mockResolvedValue(claude);

      const resolution = await resolveAgenticMode(createOptions({ agentFlag: '/opt/homebrew/bin/claude' }));

      expect(resolveAgentFromPathMock).toHaveBeenCalledWith('/opt/homebrew/bin/claude');
      expect(resolution).toEqual({ mode: 'enabled', agent: claude });
    });

    it('should not probe the PATH when an explicit path is given', async () => {
      resolveAgentFromPathMock.mockResolvedValue(claude);
      const detect = vi.fn().mockResolvedValue([]);

      await resolveAgenticMode(createOptions({ agentFlag: '/opt/homebrew/bin/claude', detect }));

      expect(detect).not.toHaveBeenCalled();
    });

    it('should propagate the error when the path cannot be resolved', async () => {
      resolveAgentFromPathMock.mockRejectedValue(new Error('not an executable file'));

      await expect(resolveAgenticMode(createOptions({ agentFlag: '/opt/homebrew/bin/claude' }))).rejects.toThrow(
        /not an executable file/
      );
    });

    it('should treat a value with no separator as an agent id, not a path', async () => {
      const resolution = await resolveAgenticMode(createOptions({ agentFlag: 'codex' }));

      expect(resolveAgentFromPathMock).not.toHaveBeenCalled();
      expect(resolution).toEqual({ mode: 'enabled', agent: codex });
    });
  });
});
