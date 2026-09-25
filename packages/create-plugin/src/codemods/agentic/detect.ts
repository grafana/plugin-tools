import { constants } from 'node:fs';
import { access } from 'node:fs/promises';
import { basename } from 'node:path';
import which from 'which';
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

// escape hatch for agents installed outside PATH, e.g. claude at ~/.claude/local/claude. the binary
// name has to identify the agent because each one takes different invocation arguments
export async function resolveAgentFromPath(
  binaryPath: string,
  definitions: AgentDefinition[] = AGENT_DEFINITIONS
): Promise<InstalledAgent> {
  const binaryName = basename(binaryPath);
  const definition = definitions.find((agentDefinition) => agentDefinition.binaryNames.includes(binaryName));

  if (!definition) {
    const expectedNames = definitions.flatMap((agentDefinition) => agentDefinition.binaryNames).join(', ');
    throw new Error(
      `Could not tell which agent "${binaryPath}" is. Expected the file to be named one of: ${expectedNames}.`
    );
  }

  try {
    await access(binaryPath, constants.X_OK);
  } catch {
    throw new Error(`The agent path "${binaryPath}" is not an executable file.`);
  }

  return { definition, binaryPath };
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

  return null;
}
