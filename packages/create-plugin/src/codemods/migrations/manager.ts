import defaultMigrations, { hasPromptStep, isScriptMigration, Migration } from './migrations.js';
import { runCodemod } from '../runner.js';
import { gte, satisfies } from 'semver';
import { CURRENT_APP_VERSION } from '../../utils/utils.version.js';
import { gitCommitNoVerify, isGitDirectoryClean } from '../../utils/utils.git.js';
import { output } from '../../utils/utils.console.js';
import { setRootConfig } from '../../utils/utils.config.js';
import type { AgenticRuntime } from '../agentic/index.js';
import type { Context } from '../context.js';

export function getMigrationsToRun(
  fromVersion: string,
  toVersion: string,
  migrations: Migration[] = defaultMigrations
): Migration[] {
  const semverRange = `${fromVersion} - ${toVersion}`;

  return migrations
    .filter((meta) => satisfies(meta.version, semverRange))
    .sort((a, b) => {
      return gte(a.version, b.version) ? 1 : -1;
    });
}

type RunMigrationsOptions = {
  // tri-state: undefined means the flag was not passed, which lets agentic soft-force commits
  commitEachMigration?: boolean;
  // raw minimist --agent value: undefined | '' | '<id>' | false
  agent?: string | boolean;
  codemodOptions?: Record<string, any>;
};

export async function runMigrations(migrations: Migration[], options: RunMigrationsOptions = {}) {
  const migrationList = migrations.map((meta) => `${meta.name} (${meta.description})`);

  const migrationListBody = migrationList.length > 0 ? output.bulletList(migrationList) : ['No migrations to run.'];

  output.log({ title: 'Running the following migrations:', body: migrationListBody });

  let agentic: AgenticRuntime | undefined;
  if (migrations.some(hasPromptStep)) {
    // lazy import: non-agentic runs never pay for the agentic module
    const { createAgenticRuntime } = await import('../agentic/index.js');
    agentic = await createAgenticRuntime({
      agentFlag: options.agent,
      commitEachMigration: options.commitEachMigration,
      basePath: process.cwd(),
    });
  }
  const commitEachMigration = options.commitEachMigration ?? agentic?.softForceCommits ?? false;

  // run migrations sequentially in version order where lowest version runs first
  for (const migration of migrations) {
    let context: Context | undefined;
    if (isScriptMigration(migration)) {
      context = await runCodemod(migration, options.codemodOptions);
    }

    let agentApplied = false;
    if (hasPromptStep(migration) && agentic) {
      // runs after the codemod has flushed and before the commit so the commit includes agent edits
      const step = await agentic.runPromptStep(migration, context);
      agentApplied = step.kind !== 'deferred';
    }

    const treeDirty = agentApplied ? !(await isGitDirectoryClean()) : false;
    const shouldCommit = commitEachMigration && ((context?.hasChanges() ?? false) || treeDirty);

    if (shouldCommit) {
      // for conventional commits we need to add a newline between the title and the description
      await gitCommitNoVerify(`chore: run create-plugin migration - ${migration.name}\n\n${migration.description}`);
    }
  }

  await setRootConfig({ version: CURRENT_APP_VERSION });

  if (commitEachMigration) {
    await gitCommitNoVerify(`chore: update .config/.cprc.json to version ${CURRENT_APP_VERSION}.`);
  }

  agentic?.printSummary();
}
