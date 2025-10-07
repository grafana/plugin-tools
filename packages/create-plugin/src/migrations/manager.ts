import { satisfies, gte } from 'semver';
import { Context } from './context.js';
import defaultMigrations, { MigrationMeta } from './migrations.js';
import { flushChanges, printChanges, migrationsDebug, formatFiles, installNPMDependencies } from './utils.js';
import { gitCommitNoVerify } from '../utils/utils.git.js';
import { setRootConfig } from '../utils/utils.config.js';
import { output } from '../utils/utils.console.js';
import { CURRENT_APP_VERSION } from '../utils/utils.version.js';

export type MigrationFn = (context: Context) => Context | Promise<Context>;

export function getMigrationsToRun(
  fromVersion: string,
  toVersion: string,
  migrations: Record<string, MigrationMeta> = defaultMigrations.migrations
): Record<string, MigrationMeta> {
  const semverRange = `${fromVersion} - ${toVersion}`;

  const migrationsToRun = Object.entries(migrations)
    .sort((a, b) => {
      return gte(a[1].version, b[1].version) ? 1 : -1;
    })
    .reduce<Record<string, MigrationMeta>>((acc, [key, meta]) => {
      if (satisfies(meta.version, semverRange)) {
        acc[key] = meta;
      }
      return acc;
    }, {});

  return migrationsToRun;
}

type RunMigrationsOptions = {
  commitEachMigration?: boolean;
};

export async function runMigrations(migrations: Record<string, MigrationMeta>, options: RunMigrationsOptions = {}) {
  const basePath = process.cwd();
  const migrationList = Object.entries(migrations).map(
    ([key, migrationMeta]) => `${key} (${migrationMeta.description})`
  );

  const migrationListBody = migrationList.length > 0 ? output.bulletList(migrationList) : ['No migrations to run.'];

  output.log({ title: 'Running the following migrations:', body: migrationListBody });

  for (const [key, migration] of Object.entries(migrations)) {
    try {
      const context = await runMigration(migration, new Context(basePath));
      const shouldCommit = options.commitEachMigration && context.hasChanges();

      migrationsDebug(`context for "${key} (${migration.migrationScript})":`);
      migrationsDebug('%O', context.listChanges());

      await formatFiles(context);
      flushChanges(context);
      printChanges(context, key, migration);

      installNPMDependencies(context);

      if (shouldCommit) {
        await gitCommitNoVerify(`chore: run create-plugin migration - ${key} (${migration.migrationScript})`);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error running migration "${key} (${migration.migrationScript})": ${error.message}`);
      }
    }
  }

  setRootConfig({ version: CURRENT_APP_VERSION });

  if (options.commitEachMigration) {
    await gitCommitNoVerify(`chore: update .config/.cprc.json to version ${CURRENT_APP_VERSION}.`);
  }
}

export async function runMigration(migration: MigrationMeta, context: Context): Promise<Context> {
  const module: { default: MigrationFn } = await import(migration.migrationScript);

  return module.default(context);
}
