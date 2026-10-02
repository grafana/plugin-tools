import defaultMigrations, { Migration } from './migrations.js';
import { runCodemod } from '../runner.js';
import { compare, eq, gt, satisfies } from 'semver';
import { CURRENT_APP_VERSION } from '../../utils/utils.version.js';
import { gitCommitNoVerify, isGitDirectoryClean } from '../../utils/utils.git.js';
import { output } from '../../utils/utils.console.js';
import { setRootConfig } from '../../utils/utils.config.js';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { UNRELEASED } from '../../constants.js';
import { ProjectLayout, resolveProject } from '../../utils/utils.project.js';

// An unreleased migration has not shipped in any version a plugin can be on yet, so it resolves to the
// version being updated to. That keeps it inside the range, and running it last.
function resolveVersion(migration: Migration, toVersion: string): string {
  return migration.version === UNRELEASED ? toVersion : migration.version;
}

// Local and preview builds report the latest release version, so a plugin already on it still needs its unreleased
// migrations.
export function isUpToDate(
  fromVersion: string,
  toVersion: string,
  migrations: Migration[] = defaultMigrations
): boolean {
  if (gt(fromVersion, toVersion)) {
    return true;
  }

  if (eq(fromVersion, toVersion)) {
    return !migrations.some((migration) => migration.version === UNRELEASED);
  }

  return false;
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
      return compare(resolveVersion(a, toVersion), resolveVersion(b, toVersion));
    });
}

const ROOT_CONFIG_PATH = '.config/.cprc.json';
const LOCKFILES = ['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock'];

// A migration's commit holds the files it changed plus the lockfile the dependency install may have updated.
// Only lockfiles git reports as changed are added: staging an ignored or untouched lockfile would fail the commit.
async function getMigrationCommitPaths(changedPaths: string[], root: string) {
  const changedLockfiles: string[] = [];

  for (const lockfile of LOCKFILES) {
    if (existsSync(join(root, lockfile)) && !(await isGitDirectoryClean({ cwd: root, paths: [lockfile] }))) {
      changedLockfiles.push(lockfile);
    }
  }

  return [...new Set([...changedPaths, ...changedLockfiles])];
}

type RunMigrationsOptions = {
  commitEachMigration?: boolean;
  codemodOptions?: Record<string, any>;
  project?: ProjectLayout;
};

export async function runMigrations(migrations: Migration[], options: RunMigrationsOptions = {}) {
  const project = options.project ?? resolveProject();
  const migrationList = migrations.map((meta) => `${meta.name} (${meta.description})`);

  const migrationListBody = migrationList.length > 0 ? output.bulletList(migrationList) : ['No migrations to run.'];

  output.log({ title: 'Running the following migrations:', body: migrationListBody });

  // run migrations sequentially in version order where lowest version runs first
  for (const migration of migrations) {
    const context = await runCodemod(migration, options.codemodOptions, project);
    const message = context.getMessage();

    if (message) {
      output[message.level]({ title: message.title, body: message.body });
    }
    const shouldCommit = options.commitEachMigration && context.hasChanges();

    if (shouldCommit) {
      // for conventional commits we need to add a newline between the title and the description
      await gitCommitNoVerify(`chore: run create-plugin migration - ${migration.name}\n\n${migration.description}`, {
        cwd: project.root,
        paths: await getMigrationCommitPaths(Object.keys(context.listChanges()), project.root),
      });
    }
  }

  await setRootConfig({ version: CURRENT_APP_VERSION }, project.root);

  // Nothing to commit when only unreleased migrations re-ran on a plugin already on this version.
  const versionScope = { cwd: project.root, paths: [ROOT_CONFIG_PATH] };
  if (options.commitEachMigration && !(await isGitDirectoryClean(versionScope))) {
    await gitCommitNoVerify(`chore: update .config/.cprc.json to version ${CURRENT_APP_VERSION}.`, versionScope);
  }
}
