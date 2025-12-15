import defaultMigrations, { Migration } from './migrations.js';
import { runCodemod } from '../runner.js';
import { gte, satisfies } from 'semver';
import { CURRENT_APP_VERSION } from '../../utils/utils.version.js';
import { gitCommitNoVerify } from '../../utils/utils.git.js';
import { output } from '../../utils/utils.console.js';
import { setRootConfig } from '../../utils/utils.config.js';

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

  setRootConfig({ version: CURRENT_APP_VERSION });

  if (options.commitEachMigration) {
    await gitCommitNoVerify(`chore: update .config/.cprc.json to version ${CURRENT_APP_VERSION}.`);
  }
}
