import { confirmPrompt, output, selectPrompt } from '../../utils/utils.console.js';
import { resolveAgenticMode } from './resolve.js';
import { AgentId, InstalledAgent } from './types.js';

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

function createInstalledAgent(id: AgentId, displayName: string): InstalledAgent {
  return {
    definition: {
      id,
      displayName,
      binaryNames: [id],
      wellKnownPaths: [],
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
    expect(resolution).toEqual({ mode: 'disabled', reason: 'flag' });
  });

  it('should silently disable on non-TTY without a flag', async () => {
    const resolution = await resolveAgenticMode(createOptions({ isTTY: false }));
    expect(resolution).toEqual({ mode: 'disabled', reason: 'no-tty' });
    expect(outputWarningMock).not.toHaveBeenCalled();
  });

  it('should warn and disable on non-TTY when a flag was passed explicitly', async () => {
    const resolution = await resolveAgenticMode(createOptions({ agentFlag: 'claude-code', isTTY: false }));
    expect(resolution).toEqual({ mode: 'disabled', reason: 'no-tty' });
    expect(outputWarningMock).toHaveBeenCalled();
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
    expect(resolution).toEqual({ mode: 'disabled', reason: 'no-agents' });
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
    expect(resolution).toEqual({ mode: 'disabled', reason: 'declined' });
  });

  it('should treat a cancelled confirm prompt as declined', async () => {
    confirmPromptMock.mockRejectedValue(new Error(''));
    const resolution = await resolveAgenticMode(createOptions());
    expect(resolution).toEqual({ mode: 'disabled', reason: 'declined' });
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
    expect(resolution).toEqual({ mode: 'disabled', reason: 'declined' });
  });
});
