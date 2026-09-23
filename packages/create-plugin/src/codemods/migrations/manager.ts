import defaultMigrations, { Migration } from './migrations.js';
import { runCodemod } from '../runner.js';
import { gte, satisfies } from 'semver';
import { CURRENT_APP_VERSION } from '../../utils/utils.version.js';
import { gitCommitNoVerify } from '../../utils/utils.git.js';
import { output } from '../../utils/utils.console.js';
import { setRootConfig } from '../../utils/utils.config.js';
import { UNRELEASED } from '../../constants.js';

// An unreleased migration has not shipped in any version a plugin can be on yet, so it resolves to the
// version being updated to. That keeps it inside the range, and running it last.
function resolveVersion(migration: Migration, toVersion: string): string {
  return migration.version === UNRELEASED ? toVersion : migration.version;
}

export function getMigrationsToRun(
  fromVersion: string,
  toVersion: string,
  migrations: Migration[] = defaultMigrations
): Migration[] {
  const semverRange = `${fromVersion} - ${toVersion}`;

  return migrations
    .filter((meta) => satisfies(resolveVersion(meta, toVersion), semverRange))
    .sort((a, b) => {
      return gte(resolveVersion(a, toVersion), resolveVersion(b, toVersion)) ? 1 : -1;
    });
}

type RunMigrationsOptions = {
  commitEachMigration?: boolean;
  codemodOptions?: Record<string, any>;
};

export async function runMigrations(migrations: Migration[], options: RunMigrationsOptions = {}) {
  const migrationList = migrations.map((meta) => `${meta.name} (${meta.description})`);

  const migrationListBody = migrationList.length > 0 ? output.bulletList(migrationList) : ['No migrations to run.'];

  output.log({ title: 'Running the following migrations:', body: migrationListBody });

  // run migrations sequentially in version order where lowest version runs first
  for (const migration of migrations) {
    const context = await runCodemod(migration, options.codemodOptions);
    const shouldCommit = options.commitEachMigration && context.hasChanges();

    if (shouldCommit) {
      // for conventional commits we need to add a newline between the title and the description
      await gitCommitNoVerify(`chore: run create-plugin migration - ${migration.name}\n\n${migration.description}`);
    }
  }

  await setRootConfig({ version: CURRENT_APP_VERSION });

  if (options.commitEachMigration) {
    await gitCommitNoVerify(`chore: update .config/.cprc.json to version ${CURRENT_APP_VERSION}.`);
  }
}
