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
  // absolute fallback locations checked for the execute bit when the binary is not on PATH
  wellKnownPaths: string[];
  buildInteractive: (invocationContext: AgentInvocationContext) => AgentInvocation;
}

export interface InstalledAgent {
  definition: AgentDefinition;
  binaryPath: string;
}

export type AgenticResolution =
  | { mode: 'inside-agent' }
  | { mode: 'disabled'; reason: 'no-tty' | 'flag' | 'declined' | 'no-agents' }
  | { mode: 'enabled'; agent: InstalledAgent };

export interface Handoff {
  status: 'success' | 'failed';
  summary: string;
}

export type AgentSessionResult =
  | { outcome: 'handoff'; handoff: Handoff }
  | { outcome: 'ambiguous-exit'; exitCode: number | null; signal: NodeJS.Signals | null }
  | { outcome: 'user-aborted' };

export type PromptStepResult =
  | { kind: 'applied'; summary: string }
  | { kind: 'deferred' }
  // the agent session ended without a valid handoff and the user chose to continue
  | { kind: 'assumed-applied' };
