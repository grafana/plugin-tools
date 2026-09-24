import { output, selectPrompt } from '../../utils/utils.console.js';
import {
  getPackageManagerExecCmd,
  getPackageManagerSilentInstallCmd,
  getPackageManagerWithFallback,
} from '../../utils/utils.packageManager.js';
import { Addition, hasPromptStep } from '../additions/additions.js';
import { Context } from '../context.js';
import { createRunId, ensureRunDir, getHandoffPath, getRunDir, wipeAgentRuns } from './handoff.js';
import {
  buildHybridUserPrompt,
  buildPromptOnlyUserPrompt,
  buildSystemPrompt,
  CodemodChanges,
  getPromptPath,
  loadPromptInstructions,
} from './prompts.js';
import { resolveAgenticMode } from './resolve.js';
import { runAgentSession } from './runner.js';
import { AgenticResolution, AgenticStepResult, AgentSessionResult, InstalledAgent } from './types.js';

export const ABORT_CHOICE = 'Abort the addition';
export const CONTINUE_CHOICE = 'Treat the agent step as completed';

export interface AgenticStepOptions {
  addition: Addition & { prompt: string };
  agent: InstalledAgent;
  // present for hybrid additions, absent for prompt-only
  context?: Context;
  basePath: string;
  // true when --force let a dirty tree through, so the working diff is not ours alone
  treeWasDirty: boolean;
}

// Resolves the agent before any codemod work runs, so a missing agent can never leave an addition
// half-applied. Returns undefined when the addition needs no agent, and throws when it needs one that
// is not available.
export async function prepareAgenticAddition(
  addition: Addition,
  agentFlag: string | boolean | undefined
): Promise<AgenticResolution | undefined> {
  if (!hasPromptStep(addition)) {
    return undefined;
  }

  const resolution = await resolveAgenticMode({ agentFlag });
  if (resolution.mode === 'unavailable') {
    throw new Error(buildUnavailableMessage(addition, resolution.reason));
  }

  return resolution;
}

export async function runAgenticStep(options: AgenticStepOptions): Promise<AgenticStepResult> {
  const { addition, agent, context, basePath, treeWasDirty } = options;
  const instructionsPath = getPromptPath(addition.prompt);

  // a unique dir per run means a stale handoff from an earlier run can never be read back
  wipeAgentRuns(basePath);
  const runDir = getRunDir(basePath, createRunId());
  ensureRunDir(runDir);
  const handoffPath = getHandoffPath(runDir, addition.name);

  const { packageManagerName, packageManagerVersion } = getPackageManagerWithFallback();
  const systemPrompt = buildSystemPrompt({
    workspaceRoot: basePath,
    packageManagerName,
    packageManagerVersion,
    installCmd: getPackageManagerSilentInstallCmd(packageManagerName, packageManagerVersion),
    execCmd: getPackageManagerExecCmd(packageManagerName, packageManagerVersion),
    handoffPath,
  });

  const userPromptOptions = {
    addition: { name: addition.name, description: addition.description },
    instructions: loadPromptInstructions(addition.prompt),
    instructionsPath,
    handoffPath,
  };
  const userPrompt = context
    ? buildHybridUserPrompt({ ...userPromptOptions, codemodChanges: getCodemodChanges(context, treeWasDirty) })
    : buildPromptOnlyUserPrompt(userPromptOptions);

  output.log({
    title: `Handing ${addition.name} to ${agent.definition.displayName}.`,
    body: [
      'The session is interactive: you can watch and redirect the agent.',
      'It ends automatically once the agent reports completion.',
    ],
  });

  const invocation = agent.definition.buildInteractive({
    systemPrompt,
    userPrompt,
    workspaceRoot: basePath,
    handoffDir: runDir,
  });

  const sessionResult = await runAgentSession({
    binaryPath: agent.binaryPath,
    args: invocation.args,
    env: invocation.env,
    cwd: basePath,
    handoffPath,
  });

  if (sessionResult.outcome === 'handoff') {
    if (sessionResult.handoff.status === 'failed') {
      throw new Error(`The agent reported failure for ${addition.name}: ${sessionResult.handoff.summary}`);
    }
    return { kind: 'applied', summary: sessionResult.handoff.summary };
  }

  if (sessionResult.outcome === 'user-aborted') {
    throw new Error(`The agent session for ${addition.name} was aborted.`);
  }

  return handleAmbiguousExit(addition.name, sessionResult);
}

function buildUnavailableMessage(addition: Addition & { prompt: string }, reason: 'no-tty' | 'no-agents'): string {
  const cause =
    reason === 'no-tty' ? 'this is not an interactive terminal' : 'no supported agent CLI was found on your PATH';

  return [
    `${addition.name} needs an AI agent to apply its instructions, and ${cause}.`,
    '',
    'Ways forward:',
    '  - install a supported agent CLI and run this again',
    '  - pass --agent=<path> if an agent is installed outside your PATH',
    `  - pass --no-agent to skip the agent, then apply ${getPromptPath(addition.prompt)} by hand`,
  ].join('\n');
}

async function handleAmbiguousExit(
  additionName: string,
  sessionResult: Extract<AgentSessionResult, { outcome: 'ambiguous-exit' }>
): Promise<AgenticStepResult> {
  output.warning({
    title: `The agent session for ${additionName} ended without reporting a result.`,
    body: [
      `Exit code: ${sessionResult.exitCode ?? 'none'}, signal: ${sessionResult.signal ?? 'none'}.`,
      'Inspect the working tree before deciding how to proceed.',
    ],
  });

  const choice = await safeSelect('How should the addition proceed?', [ABORT_CHOICE, CONTINUE_CHOICE]);
  if (choice === CONTINUE_CHOICE) {
    return { kind: 'assumed-applied' };
  }

  throw new Error(`The addition was aborted after the agent session for ${additionName} ended unexpectedly.`);
}

function getCodemodChanges(context: Context, treeWasDirty: boolean): CodemodChanges {
  // add requires a clean tree, so after the codemod flushes the whole working tree diff is ours.
  // --force can bypass that check, and then the diff includes changes we did not make.
  if (!treeWasDirty) {
    return { kind: 'git-diff' };
  }

  const files = Object.entries(context.listChanges()).map(([path, change]) => ({
    path,
    changeType: change.changeType,
  }));
  return { kind: 'file-list', files };
}

async function safeSelect(message: string, choices: string[]): Promise<string> {
  try {
    return await selectPrompt(message, choices);
  } catch {
    // enquirer rejects when the prompt is cancelled (ctrl+c) — treat as an abort
    return ABORT_CHOICE;
  }
}
