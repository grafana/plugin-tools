import { confirmPrompt, output, selectPrompt } from '../../utils/utils.console.js';
import { AGENT_DEFINITIONS } from './definitions.js';
import { detectInstalledAgents, isInsideAgent, resolveAgentFromPath } from './detect.js';
import { AgenticResolution, InstalledAgent } from './types.js';

export interface ResolveAgenticOptions {
  // raw minimist value: undefined = flag absent, '' = bare --agent, '<id>' or '<path>' = --agent=..., false = --no-agent
  agentFlag: string | boolean | undefined;
  isTTY?: boolean;
  env?: NodeJS.ProcessEnv;
  detect?: typeof detectInstalledAgents;
}

export async function resolveAgenticMode(options: ResolveAgenticOptions): Promise<AgenticResolution> {
  const isTTY = options.isTTY ?? Boolean(process.stdout.isTTY && process.stdin.isTTY);
  const detect = options.detect ?? detectInstalledAgents;

  if (isInsideAgent(options.env)) {
    output.log({
      title: 'Running inside an AI agent. The agent step will be handed to it instead of spawning another agent.',
    });
    return { mode: 'inside-agent' };
  }

  if (options.agentFlag === false) {
    return { mode: 'opted-out', reason: 'flag' };
  }

  // the agent session is interactive, so it cannot run without a terminal to attach to
  if (!isTTY) {
    return { mode: 'unavailable', reason: 'no-tty' };
  }

  // --agent=<path>: an agent installed outside PATH
  if (typeof options.agentFlag === 'string' && looksLikePath(options.agentFlag)) {
    return { mode: 'enabled', agent: await resolveAgentFromPath(options.agentFlag) };
  }

  const installedAgents = await detect();

  // --agent=<id>: pin a specific agent
  if (typeof options.agentFlag === 'string' && options.agentFlag !== '') {
    return { mode: 'enabled', agent: pinAgent(options.agentFlag, installedAgents) };
  }

  // bare --agent: enable without asking
  if (options.agentFlag !== undefined) {
    if (installedAgents.length === 0) {
      throw new Error(
        `--agent was passed but no supported agent CLI was found on this system. Supported agents: ${supportedAgentList()}. Pass --agent=<path> if one is installed outside your PATH.`
      );
    }
    return resolveFromPick(installedAgents);
  }

  // no flag: opt in interactively
  if (installedAgents.length === 0) {
    return { mode: 'unavailable', reason: 'no-agents' };
  }

  const optedIn = await safeConfirm('This addition includes AI-agent instructions. Apply them with an agent?');
  if (!optedIn) {
    return { mode: 'opted-out', reason: 'declined' };
  }

  return resolveFromPick(installedAgents);
}

function looksLikePath(agentFlag: string): boolean {
  return agentFlag.includes('/');
}

async function resolveFromPick(installedAgents: InstalledAgent[]): Promise<AgenticResolution> {
  const pickedAgent = await pickAgent(installedAgents);
  if (!pickedAgent) {
    return { mode: 'opted-out', reason: 'declined' };
  }
  return { mode: 'enabled', agent: pickedAgent };
}

function pinAgent(agentId: string, installedAgents: InstalledAgent[]): InstalledAgent {
  const isKnownAgent = AGENT_DEFINITIONS.some((definition) => definition.id === agentId);
  if (!isKnownAgent) {
    throw new Error(
      `Unknown agent "${agentId}". Supported agents: ${supportedAgentList()}. Pass a path instead to use an agent installed outside your PATH.`
    );
  }

  const installedAgent = installedAgents.find((agent) => agent.definition.id === agentId);
  if (!installedAgent) {
    const installedList =
      installedAgents.length > 0 ? installedAgents.map((agent) => agent.definition.id).join(', ') : 'none';
    throw new Error(
      `Agent "${agentId}" is not installed. Installed agents: ${installedList}. Pass --agent=<path> if it is installed outside your PATH.`
    );
  }

  return installedAgent;
}

async function pickAgent(installedAgents: InstalledAgent[]): Promise<InstalledAgent | undefined> {
  if (installedAgents.length === 1) {
    output.log({ title: `Using ${installedAgents[0].definition.displayName} for this addition.` });
    return installedAgents[0];
  }

  try {
    const displayName = await selectPrompt(
      'Multiple agents are installed. Which one should apply this addition?',
      installedAgents.map((agent) => agent.definition.displayName)
    );
    return installedAgents.find((agent) => agent.definition.displayName === displayName);
  } catch {
    // enquirer rejects when the prompt is cancelled (ctrl+c) — treat as a decline
    return undefined;
  }
}

async function safeConfirm(message: string): Promise<boolean> {
  try {
    return await confirmPrompt(message);
  } catch {
    // enquirer rejects when the prompt is cancelled (ctrl+c) — treat as a decline
    return false;
  }
}

function supportedAgentList(): string {
  return AGENT_DEFINITIONS.map((definition) => `${definition.displayName} (${definition.id})`).join(', ');
}
