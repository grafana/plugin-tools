import { output, selectPrompt } from '../../utils/utils.console.js';
import {
  getPackageManagerExecCmd,
  getPackageManagerSilentInstallCmd,
  getPackageManagerWithFallback,
} from '../../utils/utils.packageManager.js';
import { Context } from '../context.js';
import { Migration } from '../migrations/migrations.js';
import { createRunId, ensureRunDir, getHandoffPath, getRunDir, wipeMigrateRuns } from './handoff.js';
import {
  buildDirectiveBlock,
  buildHybridUserPrompt,
  buildNextStepsList,
  buildPromptOnlyUserPrompt,
  buildSystemPrompt,
  CodemodChanges,
  DeferredMigration,
  getPromptPath,
  loadPromptInstructions,
} from './prompts.js';
import { resolveAgenticMode } from './resolve.js';
import { runAgentSession } from './runner.js';
import { AgenticResolution, AgentSessionResult, PromptStepResult } from './types.js';

export const ABORT_CHOICE = 'Abort the update';
export const CONTINUE_CHOICE = 'Treat the migration step as completed';

export interface AgenticRuntimeOptions {
  // raw minimist --agent value: undefined | '' | '<id>' | false
  agentFlag: string | boolean | undefined;
  // tri-state: undefined = flag absent, which allows agentic to soft-force commits
  commitEachMigration: boolean | undefined;
  basePath: string;
}

export interface AgenticRuntime {
  resolution: AgenticResolution;
  softForceCommits: boolean;
  runPromptStep: (migration: Migration & { prompt: string }, context?: Context) => Promise<PromptStepResult>;
  printSummary: () => void;
}

export async function createAgenticRuntime(options: AgenticRuntimeOptions): Promise<AgenticRuntime> {
  const resolution = await resolveAgenticMode({ agentFlag: options.agentFlag });
  const softForceCommits = resolution.mode === 'enabled' && options.commitEachMigration === undefined;
  const commitsEnabled = options.commitEachMigration ?? softForceCommits;
  const runDir = getRunDir(options.basePath, createRunId());
  const deferredMigrations: DeferredMigration[] = [];
  const appliedMigrations: string[] = [];

  if (resolution.mode === 'enabled') {
    wipeMigrateRuns(options.basePath);
    if (softForceCommits) {
      output.log({ title: 'Enabling per-migration commits so each agent step sees an isolated diff.' });
    }
    if (options.commitEachMigration === false) {
      output.warning({
        title: 'Running agent migrations without per-migration commits.',
        body: [
          'The agent cannot inspect an isolated git diff; the changed file list is embedded in its prompt instead.',
        ],
      });
    }
  }

  async function runPromptStep(
    migration: Migration & { prompt: string },
    context?: Context
  ): Promise<PromptStepResult> {
    const instructionsPath = getPromptPath(migration.prompt);

    if (resolution.mode !== 'enabled') {
      deferredMigrations.push({ name: migration.name, description: migration.description, instructionsPath });
      return { kind: 'deferred' };
    }

    const agent = resolution.agent;
    const handoffPath = getHandoffPath(runDir, migration.name);
    ensureRunDir(runDir);

    const { packageManagerName, packageManagerVersion } = getPackageManagerWithFallback();
    const systemPrompt = buildSystemPrompt({
      workspaceRoot: options.basePath,
      packageManagerName,
      packageManagerVersion,
      installCmd: getPackageManagerSilentInstallCmd(packageManagerName, packageManagerVersion),
      execCmd: getPackageManagerExecCmd(packageManagerName, packageManagerVersion),
      handoffPath,
    });

    const userPromptOptions = {
      migration: { name: migration.name, version: migration.version, description: migration.description },
      instructions: loadPromptInstructions(migration.prompt),
      instructionsPath,
      handoffPath,
    };
    const userPrompt = context
      ? buildHybridUserPrompt({ ...userPromptOptions, codemodChanges: getCodemodChanges(context) })
      : buildPromptOnlyUserPrompt(userPromptOptions);

    output.log({
      title: `Handing ${migration.name} to ${agent.definition.displayName}.`,
      body: [
        'The session is interactive: you can watch and redirect the agent.',
        'It ends automatically once the agent reports completion.',
      ],
    });

    const invocation = agent.definition.buildInteractive({
      systemPrompt,
      userPrompt,
      workspaceRoot: options.basePath,
      handoffDir: runDir,
    });

    const sessionResult = await runAgentSession({
      binaryPath: agent.binaryPath,
      args: invocation.args,
      env: invocation.env,
      cwd: options.basePath,
      handoffPath,
    });

    if (sessionResult.outcome === 'handoff') {
      if (sessionResult.handoff.status === 'failed') {
        throw new Error(`The agent reported failure for ${migration.name}: ${sessionResult.handoff.summary}`);
      }
      appliedMigrations.push(`${migration.name} — ${sessionResult.handoff.summary}`);
      return { kind: 'applied', summary: sessionResult.handoff.summary };
    }

    if (sessionResult.outcome === 'user-aborted') {
      throw new Error(`The agent session for ${migration.name} was aborted.`);
    }

    return handleAmbiguousExit(migration.name, sessionResult);
  }

  async function handleAmbiguousExit(
    migrationName: string,
    sessionResult: Extract<AgentSessionResult, { outcome: 'ambiguous-exit' }>
  ): Promise<PromptStepResult> {
    output.warning({
      title: `The agent session for ${migrationName} ended without reporting a result.`,
      body: [
        `Exit code: ${sessionResult.exitCode ?? 'none'}, signal: ${sessionResult.signal ?? 'none'}.`,
        'Inspect the working tree before deciding how to proceed.',
      ],
    });

    const choice = await safeSelect('How should the update proceed?', [ABORT_CHOICE, CONTINUE_CHOICE]);
    if (choice === CONTINUE_CHOICE) {
      appliedMigrations.push(`${migrationName} — assumed applied (the agent did not hand off a result).`);
      return { kind: 'assumed-applied' };
    }

    throw new Error(`Update aborted after the agent session for ${migrationName} ended unexpectedly.`);
  }

  function getCodemodChanges(context: Context): CodemodChanges {
    if (commitsEnabled) {
      return { kind: 'git-diff' };
    }
    const files = Object.entries(context.listChanges()).map(([path, change]) => ({
      path,
      changeType: change.changeType,
    }));
    return { kind: 'file-list', files };
  }

  function printSummary(): void {
    if (deferredMigrations.length > 0) {
      if (resolution.mode === 'inside-agent') {
        output.logSingleLine(buildDirectiveBlock(deferredMigrations));
        return;
      }
      output.warning({
        title: 'Some migrations include AI-agent instructions that were not applied automatically.',
        body: buildNextStepsList(deferredMigrations),
      });
      return;
    }

    if (appliedMigrations.length > 0) {
      output.statusList('success', appliedMigrations);
    }
  }

  return { resolution, softForceCommits, runPromptStep, printSummary };
}

async function safeSelect(message: string, choices: string[]): Promise<string> {
  try {
    return await selectPrompt(message, choices);
  } catch {
    // enquirer rejects when the prompt is cancelled (ctrl+c) — treat as an abort
    return ABORT_CHOICE;
  }
}
