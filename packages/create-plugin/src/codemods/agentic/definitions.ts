import { homedir } from 'node:os';
import { join } from 'node:path';
import { AgentDefinition } from './types.js';

// Pure data. Invocation args mirror the Nx agentic migrate implementation (nrwl/nx#35718, #35889)
// and must be verified against the currently shipping agent CLIs when changed.
export const AGENT_DEFINITIONS: AgentDefinition[] = [
  {
    id: 'claude-code',
    displayName: 'Claude Code',
    binaryNames: ['claude'],
    wellKnownPaths: [join(homedir(), '.claude', 'local', 'claude')],
    buildInteractive: (invocationContext) => ({
      args: [
        '--system-prompt',
        invocationContext.systemPrompt,
        // pre-authorize the handoff write so the session cannot stall on a permission prompt
        '--allowedTools',
        `Write(${invocationContext.handoffDir}/**)`,
        invocationContext.userPrompt,
      ],
    }),
  },
  {
    id: 'codex',
    displayName: 'OpenAI Codex',
    binaryNames: ['codex'],
    wellKnownPaths: [],
    buildInteractive: (invocationContext) => ({
      args: ['-c', `developer_instructions=${invocationContext.systemPrompt}`, invocationContext.userPrompt],
    }),
  },
];
