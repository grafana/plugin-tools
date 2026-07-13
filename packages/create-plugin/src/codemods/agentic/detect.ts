import which from 'which';
import { constants } from 'node:fs';
import { access } from 'node:fs/promises';
import { AGENT_DEFINITIONS } from './definitions.js';
import { AgentDefinition, InstalledAgent } from './types.js';

// Environment variables set by AI agent CLIs/IDEs when they run a shell command.
// Used to avoid spawning an agent from inside another agent.
const AGENT_ENV_VARS = [
  'CLAUDECODE',
  'CURSOR_TRACE_ID',
  'OPENCODE',
  'CODEX_THREAD_ID',
  'GEMINI_CLI',
  'VSCODE_AGENT',
  'REPL_ID',
];

export async function detectInstalledAgents(
  definitions: AgentDefinition[] = AGENT_DEFINITIONS
): Promise<InstalledAgent[]> {
  const probes = await Promise.all(definitions.map(detectAgent));
  return probes.filter((agent): agent is InstalledAgent => agent !== null);
}

export function isInsideAgent(env: NodeJS.ProcessEnv = process.env): boolean {
  return AGENT_ENV_VARS.some((envVar) => Boolean(env[envVar]));
}

async function detectAgent(definition: AgentDefinition): Promise<InstalledAgent | null> {
  for (const binaryName of definition.binaryNames) {
    const binaryPath = await which(binaryName, { nothrow: true });
    if (binaryPath) {
      return { definition, binaryPath };
    }
  }

  for (const wellKnownPath of definition.wellKnownPaths) {
    if (await isExecutable(wellKnownPath)) {
      return { definition, binaryPath: wellKnownPath };
    }
  }

  return null;
}

async function isExecutable(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}
