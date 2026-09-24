export type AgentId = 'claude-code' | 'codex';

export interface AgentInvocationContext {
  systemPrompt: string;
  userPrompt: string;
  workspaceRoot: string;
  handoffDir: string;
}

export interface AgentInvocation {
  args: string[];
  env?: Record<string, string>;
}

export interface AgentDefinition {
  id: AgentId;
  displayName: string;
  // candidate binary names probed on PATH, in order
  binaryNames: string[];
  buildInteractive: (invocationContext: AgentInvocationContext) => AgentInvocation;
}

export interface InstalledAgent {
  definition: AgentDefinition;
  binaryPath: string;
}

// 'unavailable' and 'opted-out' are deliberately distinct: the first means no agent could be used, the
// second means one could have been but the user said no. Only the first is an error.
export type AgenticResolution =
  | { mode: 'inside-agent' }
  | { mode: 'unavailable'; reason: 'no-tty' | 'no-agents' }
  | { mode: 'opted-out'; reason: 'flag' | 'declined' }
  | { mode: 'enabled'; agent: InstalledAgent };

export interface Handoff {
  status: 'success' | 'failed';
  summary: string;
}

export type AgentSessionResult =
  | { outcome: 'handoff'; handoff: Handoff }
  | { outcome: 'ambiguous-exit'; exitCode: number | null; signal: NodeJS.Signals | null }
  | { outcome: 'user-aborted' };

// no 'deferred' kind: deferral is decided from the resolution before a session is ever started
export type AgenticStepResult =
  | { kind: 'applied'; summary: string }
  // the agent session ended without a valid handoff and the user chose to continue
  | { kind: 'assumed-applied' };
