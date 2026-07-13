import { confirmPrompt, output, selectPrompt } from '../../utils/utils.console.js';
import { AGENT_DEFINITIONS } from './definitions.js';
import { detectInstalledAgents, isInsideAgent } from './detect.js';
import { AgenticResolution, InstalledAgent } from './types.js';

export interface ResolveAgenticOptions {
  // raw minimist value: undefined = flag absent, '' = bare --agent, '<id>' = --agent=<id>, false = --no-agent
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
      title: 'Running inside an AI agent. Prompt migrations will be handed to it instead of spawning another agent.',
    });
    return { mode: 'inside-agent' };
  }

  if (options.agentFlag === false) {
    return { mode: 'disabled', reason: 'flag' };
  }

  if (!isTTY) {
    if (options.agentFlag !== undefined) {
      output.warning({
        title: 'The --agent flag requires an interactive terminal.',
        body: ['Prompt migrations will be listed as manual next steps instead.'],
      });
    }
    return { mode: 'disabled', reason: 'no-tty' };
  }

  const installedAgents = await detect();

  // --agent=<id>: pin a specific agent
  if (typeof options.agentFlag === 'string' && options.agentFlag !== '') {
    return { mode: 'enabled', agent: pinAgent(options.agentFlag, installedAgents) };
  }

  // bare --agent (or --agent=true): enable without asking
  if (options.agentFlag !== undefined) {
    if (installedAgents.length === 0) {
      throw new Error(
        `--agent was passed but no supported agent CLI was found on this system. Supported agents: ${supportedAgentList()}.`
      );
    }
    return resolveFromPick(installedAgents);
  }

  // no flag: opt in interactively
  if (installedAgents.length === 0) {
    return { mode: 'disabled', reason: 'no-agents' };
  }

  const optedIn = await safeConfirm(
    'Some queued migrations include AI-agent instructions. Run them with an installed agent?'
  );
  if (!optedIn) {
    return { mode: 'disabled', reason: 'declined' };
  }

  return resolveFromPick(installedAgents);
}

async function resolveFromPick(installedAgents: InstalledAgent[]): Promise<AgenticResolution> {
  const pickedAgent = await pickAgent(installedAgents);
  if (!pickedAgent) {
    return { mode: 'disabled', reason: 'declined' };
  }
  return { mode: 'enabled', agent: pickedAgent };
}

function pinAgent(agentId: string, installedAgents: InstalledAgent[]): InstalledAgent {
  const isKnownAgent = AGENT_DEFINITIONS.some((definition) => definition.id === agentId);
  if (!isKnownAgent) {
    throw new Error(`Unknown agent "${agentId}". Supported agents: ${supportedAgentList()}.`);
  }

  const installedAgent = installedAgents.find((agent) => agent.definition.id === agentId);
  if (!installedAgent) {
    const installedList =
      installedAgents.length > 0 ? installedAgents.map((agent) => agent.definition.id).join(', ') : 'none';
    throw new Error(`Agent "${agentId}" is not installed. Installed agents: ${installedList}.`);
  }

  return installedAgent;
}

async function pickAgent(installedAgents: InstalledAgent[]): Promise<InstalledAgent | undefined> {
  if (installedAgents.length === 1) {
    output.log({ title: `Using ${installedAgents[0].definition.displayName} for prompt migrations.` });
    return installedAgents[0];
  }

  try {
    const displayName = await selectPrompt(
      'Multiple agents are installed. Which one should run the prompt migrations?',
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
